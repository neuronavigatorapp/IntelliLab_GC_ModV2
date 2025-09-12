from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from app.models.models import Instrument
from app.schemas.schemas import InstrumentCreate, InstrumentUpdate
import datetime

class InstrumentService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_instrument(self, instrument_data: InstrumentCreate) -> Instrument:
        """Create new instrument with validation"""
        try:
            db_instrument = Instrument(
                name=instrument_data.name,
                manufacturer=instrument_data.manufacturer,
                model=instrument_data.model,
                serial_number=instrument_data.serial_number,
                location=instrument_data.location,
                status=instrument_data.status or "operational",
                last_maintenance=instrument_data.last_maintenance or datetime.date.today(),
                next_maintenance=instrument_data.next_maintenance,
                notes=instrument_data.notes or "",
                created_date=datetime.datetime.now(),
                modified_date=datetime.datetime.now()
            )
            
            self.db.add(db_instrument)
            self.db.commit()
            self.db.refresh(db_instrument)
            
            return db_instrument
            
        except IntegrityError as e:
            self.db.rollback()
            raise ValueError(f"Instrument creation failed: {str(e)}")
    
    def get_instrument(self, instrument_id: int) -> Optional[Instrument]:
        """Get instrument by ID"""
        return self.db.query(Instrument).filter(Instrument.id == instrument_id).first()
    
    def get_all_instruments(self, skip: int = 0, limit: int = 100) -> List[Instrument]:
        """Get all instruments with pagination"""
        return self.db.query(Instrument).offset(skip).limit(limit).all()
    
    def update_instrument(self, instrument_id: int, instrument_data: InstrumentUpdate) -> Optional[Instrument]:
        """Update existing instrument"""
        db_instrument = self.get_instrument(instrument_id)
        if not db_instrument:
            return None
        
        try:
            # Update fields that are provided
            update_data = instrument_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_instrument, field, value)
            
            db_instrument.modified_date = datetime.datetime.now()
            
            self.db.commit()
            self.db.refresh(db_instrument)
            
            return db_instrument
            
        except IntegrityError as e:
            self.db.rollback()
            raise ValueError(f"Instrument update failed: {str(e)}")
    
    def delete_instrument(self, instrument_id: int) -> bool:
        """Delete instrument (soft delete)"""
        db_instrument = self.get_instrument(instrument_id)
        if not db_instrument:
            return False
        
        try:
            # Soft delete - mark as inactive instead of actual deletion
            db_instrument.status = "decommissioned"
            db_instrument.modified_date = datetime.datetime.now()
            
            self.db.commit()
            return True
            
        except Exception as e:
            self.db.rollback()
            return False
    
    def search_instruments(self, query: str) -> List[Instrument]:
        """Search instruments by name, manufacturer, or model"""
        return self.db.query(Instrument).filter(
            Instrument.name.ilike(f"%{query}%") |
            Instrument.manufacturer.ilike(f"%{query}%") |
            Instrument.model.ilike(f"%{query}%")
        ).all()
    
    def get_instruments_by_status(self, status: str) -> List[Instrument]:
        """Get instruments filtered by status"""
        return self.db.query(Instrument).filter(Instrument.status == status).all()
