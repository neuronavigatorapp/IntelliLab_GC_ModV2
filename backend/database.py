from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime, JSON, ForeignKey, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import json
import os

Base = declarative_base()

# Create SQLite database for persistence
database_path = os.path.join(os.path.dirname(__file__), 'intellilab_gc.db')
engine = create_engine(f'sqlite:///{database_path}', echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class GCInstrument(Base):
    """Each physical GC in your fleet"""
    __tablename__ = "gc_instruments"
    
    id = Column(Integer, primary_key=True, index=True)
    serial_number = Column(String, unique=True, index=True)
    manufacturer = Column(String)
    model = Column(String)
    location = Column(String)
    purchase_date = Column(DateTime)
    last_pm_date = Column(DateTime)
    total_runs = Column(Integer, default=0)
    total_runtime_hours = Column(Float, default=0)
    status = Column(String, default="Active")  # Active, Maintenance, Retired
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    runs = relationship("GCRun", back_populates="instrument")
    maintenance = relationship("MaintenanceRecord", back_populates="instrument")
    
class GCRun(Base):
    """Every single run on every GC"""
    __tablename__ = "gc_runs"
    
    id = Column(Integer, primary_key=True, index=True)
    instrument_id = Column(Integer, ForeignKey("gc_instruments.id"))
    run_date = Column(DateTime, default=datetime.utcnow)
    sequence_name = Column(String)
    method_name = Column(String)
    operator = Column(String)
    
    # Actual operating parameters for THIS run
    column_type = Column(String)
    column_length_m = Column(Float)
    column_id_mm = Column(Float)
    carrier_gas = Column(String)
    flow_rate_ml_min = Column(Float)
    inlet_temp_c = Column(Float)
    inlet_pressure_psi = Column(Float)
    oven_initial_temp_c = Column(Float)
    oven_final_temp_c = Column(Float)
    ramp_rate_c_min = Column(Float)
    detector_type = Column(String)
    detector_temp_c = Column(Float)
    
    # Performance metrics
    baseline_noise_pa = Column(Float)
    baseline_drift_pa_hr = Column(Float)
    total_runtime_min = Column(Float)
    sample_type = Column(String)  # QC, Sample, Blank, Standard
    
    # Quality flags
    passed_sst = Column(Boolean, default=True)  # System Suitability Test
    issues_noted = Column(Text)
    is_valid = Column(Boolean, default=True)
    notes = Column(Text)
    
    # Relationships
    instrument = relationship("GCInstrument", back_populates="runs")
    peaks = relationship("PeakData", back_populates="run", cascade="all, delete-orphan")

class PeakData(Base):
    """Every peak from every run"""
    __tablename__ = "peak_data"
    
    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("gc_runs.id"))
    
    # Peak identification
    compound_name = Column(String, index=True)
    cas_number = Column(String)
    elution_order = Column(Integer)
    
    # Measured values
    retention_time_min = Column(Float)
    peak_height = Column(Float)
    peak_area = Column(Float)
    peak_width_min = Column(Float)
    peak_width_half_height = Column(Float)
    
    # Calculated values
    theoretical_plates = Column(Integer)
    tailing_factor = Column(Float)
    resolution_from_previous = Column(Float)
    capacity_factor = Column(Float)
    
    # Quantitation
    concentration_ppm = Column(Float)
    response_factor = Column(Float)
    internal_standard_used = Column(String)
    
    # Quality flags
    is_baseline_resolved = Column(Boolean, default=True)
    integration_quality = Column(String, default="Good")  # Good, Poor, Manual
    
    # Relationships
    run = relationship("GCRun", back_populates="peaks")

class MaintenanceRecord(Base):
    """Track all maintenance activities"""
    __tablename__ = "maintenance_records"
    
    id = Column(Integer, primary_key=True, index=True)
    instrument_id = Column(Integer, ForeignKey("gc_instruments.id"))
    date = Column(DateTime, default=datetime.utcnow)
    type = Column(String)  # "PM", "Repair", "Column Change", "Calibration", etc.
    description = Column(Text)
    parts_replaced = Column(JSON)
    performed_by = Column(String)
    cost = Column(Float)
    downtime_hours = Column(Float)
    next_pm_due = Column(DateTime)
    
    # Quality impact
    before_performance = Column(JSON)  # Performance metrics before maintenance
    after_performance = Column(JSON)   # Performance metrics after maintenance
    
    instrument = relationship("GCInstrument", back_populates="maintenance")

class CompoundLibrary(Base):
    """Library of compounds for auto-identification"""
    __tablename__ = "compound_library"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    cas_number = Column(String)
    molecular_weight = Column(Float)
    boiling_point_c = Column(Float)
    expected_rt_db5_30m = Column(Float)  # Expected RT on DB-5, 30m column
    rt_tolerance_min = Column(Float, default=0.1)
    common_aliases = Column(JSON)  # Alternative names
    
    # For method development
    suggested_detector = Column(String)
    suggested_column = Column(String)
    notes = Column(Text)

class CalculationLog(Base):
    """Track all calculations performed for audit trail"""
    __tablename__ = "calculation_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    calculation_type = Column(String)  # split_ratio, detection_limit, column_params, etc
    input_parameters = Column(JSON)
    results = Column(JSON)
    user = Column(String)
    instrument_serial = Column(String)  # If calculation was for specific GC

class TroubleshootingLog(Base):
    """Store all troubleshooting sessions for pattern analysis"""
    __tablename__ = "troubleshooting_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    instrument_id = Column(Integer, ForeignKey("gc_instruments.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    component = Column(String)  # inlet, column, detector
    issue_type = Column(String)
    
    # Measured parameters
    measured_values = Column(JSON)  # All inputs
    calculated_diagnostics = Column(JSON)  # All outputs
    
    # Results
    root_cause = Column(String)
    confidence_percent = Column(Float)
    solution_applied = Column(String)
    resolution_confirmed = Column(Boolean)
    time_to_resolve_hours = Column(Float)
    
    # Links
    run_id = Column(Integer, ForeignKey("gc_runs.id"))
    instrument = relationship("GCInstrument")

class DetectorPerformance(Base):
    """Track detector-specific metrics over time"""
    __tablename__ = "detector_performance"
    
    id = Column(Integer, primary_key=True, index=True)
    instrument_id = Column(Integer, ForeignKey("gc_instruments.id"))
    detector_type = Column(String)  # FID, TCD, MS, ECD, SCD
    test_date = Column(DateTime, default=datetime.utcnow)
    
    # Universal metrics
    baseline_noise = Column(Float)
    baseline_drift = Column(Float)
    sensitivity = Column(Float)
    
    # Detector-specific
    fid_flame_voltage = Column(Float)
    tcd_bridge_current = Column(Float)
    ms_em_voltage = Column(Float)
    ecd_standing_current = Column(Float)
    scd_burner_temp = Column(Float)
    
    test_compound = Column(String)
    test_response = Column(Float)
    
    instrument = relationship("GCInstrument")

def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_database():
    """Initialize database with tables and sample data"""
    Base.metadata.create_all(bind=engine)
    
    # Add some common compounds to the library
    db = SessionLocal()
    try:
        # Check if compounds already exist
        if db.query(CompoundLibrary).count() == 0:
            common_compounds = [
                {
                    "name": "Benzene",
                    "cas_number": "71-43-2",
                    "molecular_weight": 78.11,
                    "boiling_point_c": 80.1,
                    "expected_rt_db5_30m": 8.5,
                    "suggested_detector": "FID",
                    "suggested_column": "DB-5MS"
                },
                {
                    "name": "Toluene",
                    "cas_number": "108-88-3",
                    "molecular_weight": 92.14,
                    "boiling_point_c": 110.6,
                    "expected_rt_db5_30m": 12.3,
                    "suggested_detector": "FID",
                    "suggested_column": "DB-5MS"
                },
                {
                    "name": "Ethylbenzene",
                    "cas_number": "100-41-4",
                    "molecular_weight": 106.17,
                    "boiling_point_c": 136.2,
                    "expected_rt_db5_30m": 16.8,
                    "suggested_detector": "FID",
                    "suggested_column": "DB-5MS"
                },
                {
                    "name": "p-Xylene",
                    "cas_number": "106-42-3",
                    "molecular_weight": 106.17,
                    "boiling_point_c": 138.4,
                    "expected_rt_db5_30m": 17.2,
                    "suggested_detector": "FID",
                    "suggested_column": "DB-5MS"
                },
                {
                    "name": "n-Hexane",
                    "cas_number": "110-54-3",
                    "molecular_weight": 86.18,
                    "boiling_point_c": 68.7,
                    "expected_rt_db5_30m": 5.2,
                    "suggested_detector": "FID",
                    "suggested_column": "DB-5MS"
                }
            ]
            
            for compound_data in common_compounds:
                compound = CompoundLibrary(**compound_data)
                db.add(compound)
            
            db.commit()
            print("Database initialized with sample compounds")
    
    finally:
        db.close()

# Initialize database on import
if __name__ == "__main__":
    init_database()
