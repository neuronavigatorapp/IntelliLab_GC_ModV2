#!/usr/bin/env python3
"""
Instrument management API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from loguru import logger

from app.core.database import get_db
from app.models.schemas import Instrument, InstrumentCreate, InstrumentUpdate
from app.core.database import Instrument as InstrumentModel
from app.core.websocket import websocket_manager
from datetime import datetime
import json

router = APIRouter()


@router.get("/", response_model=List[Instrument])
async def get_instruments(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all instruments"""
    try:
        instruments = db.query(InstrumentModel).offset(skip).limit(limit).all()
        return instruments
    except Exception as e:
        logger.error(f"Error getting instruments: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving instruments"
        )


@router.get("/fleet/overview")
async def fleet_overview(db: Session = Depends(get_db)):
    """Basic fleet KPIs used by frontend cards."""
    try:
        total = db.query(InstrumentModel).count()
        good = db.query(InstrumentModel).filter(InstrumentModel.maintenance_level.in_(["Excellent", "Good"]))
        needs = db.query(InstrumentModel).filter(InstrumentModel.maintenance_level.in_(["Fair", "Poor", "Neglected"]))
        return {
            "total": total,
            "good": good.count(),
            "needs_attention": needs.count(),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{instrument_id}", response_model=Instrument)
async def get_instrument(
    instrument_id: int,
    db: Session = Depends(get_db)
):
    """Get instrument by ID"""
    try:
        instrument = db.query(InstrumentModel).filter(InstrumentModel.id == instrument_id).first()
        if not instrument:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Instrument not found"
            )
        return instrument
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting instrument {instrument_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving instrument"
        )


@router.post("/", response_model=Instrument)
async def create_instrument(
    instrument: InstrumentCreate,
    db: Session = Depends(get_db)
):
    """Create new instrument"""
    try:
        # Check if serial number already exists
        existing = db.query(InstrumentModel).filter(
            InstrumentModel.serial_number == instrument.serial_number
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Instrument with this serial number already exists"
            )
        
        # Create new instrument
        db_instrument = InstrumentModel(**instrument.model_dump())
        db.add(db_instrument)
        db.commit()
        db.refresh(db_instrument)
        
        # Broadcast WebSocket update
        await websocket_manager.broadcast(json.dumps({
            "type": "instrument_update",
            "instrument_id": db_instrument.id,
            "action": "create",
            "data": instrument.model_dump(),
            "timestamp": datetime.now().isoformat()
        }))
        
        logger.info(f"Created instrument: {db_instrument.name}")
        return db_instrument
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating instrument: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating instrument"
        )


@router.put("/{instrument_id}", response_model=Instrument)
async def update_instrument(
    instrument_id: int,
    instrument_update: InstrumentUpdate,
    db: Session = Depends(get_db)
):
    """Update instrument"""
    try:
        db_instrument = db.query(InstrumentModel).filter(
            InstrumentModel.id == instrument_id
        ).first()
        
        if not db_instrument:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Instrument not found"
            )
        
        # Update fields
        update_data = instrument_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_instrument, field, value)
        
        db_instrument.modified_date = datetime.now()
        db.commit()
        db.refresh(db_instrument)
        
        # Broadcast WebSocket update
        await websocket_manager.broadcast(json.dumps({
            "type": "instrument_update",
            "instrument_id": instrument_id,
            "action": "update",
            "data": update_data,
            "timestamp": datetime.now().isoformat()
        }))
        
        logger.info(f"Updated instrument: {db_instrument.name}")
        return db_instrument
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating instrument {instrument_id}: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating instrument"
        )


@router.delete("/{instrument_id}")
async def delete_instrument(
    instrument_id: int,
    db: Session = Depends(get_db)
):
    """Delete instrument"""
    try:
        db_instrument = db.query(InstrumentModel).filter(
            InstrumentModel.id == instrument_id
        ).first()
        
        if not db_instrument:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Instrument not found"
            )
        
        instrument_name = db_instrument.name
        db.delete(db_instrument)
        db.commit()
        
        # Broadcast WebSocket update
        await websocket_manager.broadcast(json.dumps({
            "type": "instrument_update",
            "instrument_id": instrument_id,
            "action": "delete",
            "data": {"name": instrument_name},
            "timestamp": datetime.now().isoformat()
        }))
        
        logger.info(f"Deleted instrument: {instrument_name}")
        return {"message": f"Instrument '{instrument_name}' deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting instrument {instrument_id}: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting instrument"
        )


@router.get("/{instrument_id}/performance")
async def get_instrument_performance(
    instrument_id: int,
    db: Session = Depends(get_db)
):
    """Get instrument performance metrics"""
    try:
        instrument = db.query(InstrumentModel).filter(
            InstrumentModel.id == instrument_id
        ).first()
        
        if not instrument:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Instrument not found"
            )
        
        # Calculate performance metrics
        age_factor = max(0.5, 1.0 - (instrument.age_years * 0.02))
        maintenance_factor = {
            "Excellent": 1.0,
            "Good": 0.95,
            "Fair": 0.85,
            "Poor": 0.7,
            "Neglected": 0.5
        }.get(instrument.maintenance_level, 1.0)
        
        vacuum_factor = instrument.vacuum_integrity / 100.0
        
        overall_performance = age_factor * maintenance_factor * vacuum_factor * 100
        
        performance_data = {
            "instrument_id": instrument_id,
            "name": instrument.name,
            "age_factor": age_factor,
            "maintenance_factor": maintenance_factor,
            "vacuum_factor": vacuum_factor,
            "overall_performance": overall_performance,
            "recommendations": []
        }
        
        # Generate recommendations
        if instrument.age_years > 15:
            performance_data["recommendations"].append("Consider instrument replacement")
        
        if instrument.maintenance_level in ["Poor", "Neglected"]:
            performance_data["recommendations"].append("Schedule maintenance")
        
        if instrument.vacuum_integrity < 85:
            performance_data["recommendations"].append("Check for vacuum leaks")
        
        return performance_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting instrument performance {instrument_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error calculating performance metrics"
        )


@router.get("/fleet/overview")
async def get_fleet_overview(db: Session = Depends(get_db)):
    """Get fleet overview statistics"""
    try:
        instruments = db.query(InstrumentModel).all()
        
        if not instruments:
            return {
                "total_instruments": 0,
                "average_age": 0,
                "maintenance_status": {
                    "excellent": 0,
                    "good": 0,
                    "fair": 0,
                    "poor": 0
                },
                "performance_metrics": {
                    "average_efficiency": 0,
                    "average_uptime": 0
                }
            }
        
        total_instruments = len(instruments)
        avg_age = sum(inst.age_years for inst in instruments) / total_instruments
        
        # Maintenance status distribution
        maintenance_status = {
            "excellent": 0,
            "good": 0,
            "fair": 0,
            "poor": 0
        }
        
        for instrument in instruments:
            level = instrument.maintenance_level.lower()
            if level in maintenance_status:
                maintenance_status[level] += 1
        
        # Performance metrics calculation
        efficiency_scores = []
        uptime_scores = []
        
        for instrument in instruments:
            # Calculate efficiency based on age, maintenance, and vacuum integrity
            age_factor = max(0.5, 1.0 - (instrument.age_years * 0.02))
            maintenance_factor = {
                "Excellent": 1.0,
                "Good": 0.95,
                "Fair": 0.85,
                "Poor": 0.7,
                "Neglected": 0.5
            }.get(instrument.maintenance_level, 1.0)
            
            vacuum_factor = instrument.vacuum_integrity / 100.0
            efficiency = age_factor * maintenance_factor * vacuum_factor * 100
            efficiency_scores.append(efficiency)
            
            # Calculate uptime (simplified - based on maintenance level and vacuum integrity)
            uptime_base = 95.0  # Base uptime percentage
            uptime_modifier = (maintenance_factor - 0.5) * 10  # -5 to +5 based on maintenance
            vacuum_modifier = (vacuum_factor - 0.5) * 10  # -5 to +5 based on vacuum
            uptime = max(70.0, min(99.0, uptime_base + uptime_modifier + vacuum_modifier))
            uptime_scores.append(uptime)
        
        avg_efficiency = sum(efficiency_scores) / len(efficiency_scores) if efficiency_scores else 0
        avg_uptime = sum(uptime_scores) / len(uptime_scores) if uptime_scores else 0
        
        return {
            "total_instruments": total_instruments,
            "average_age": round(avg_age, 1),
            "maintenance_status": maintenance_status,
            "performance_metrics": {
                "average_efficiency": round(avg_efficiency, 1),
                "average_uptime": round(avg_uptime, 1)
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting fleet overview: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error generating fleet overview"
        ) 