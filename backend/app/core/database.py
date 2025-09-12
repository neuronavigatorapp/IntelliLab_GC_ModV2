#!/usr/bin/env python3
"""
Database configuration for IntelliLab GC API
"""

import os
from typing import Generator
from sqlalchemy import create_engine, event, text, Column, Integer, String, Float, DateTime, Text, JSON, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional
import json
import logging

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv not available, use system environment

from app.core.config import settings

logger = logging.getLogger(__name__)

# Database URL from environment or fallback to SQLite
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL and DATABASE_URL.startswith("postgresql"):
    # PostgreSQL configuration
    engine = create_engine(
        DATABASE_URL,
        poolclass=QueuePool,
        pool_size=20,
        max_overflow=40,
        pool_pre_ping=True,  # Verify connections before using
        pool_recycle=3600,   # Recycle connections after 1 hour
        echo=False,           # Set to True for SQL debugging
        future=True          # Use SQLAlchemy 2.0 style
    )
else:
    # SQLite fallback configuration
    database_url = f"sqlite:///{settings.get_database_path()}"
    engine = create_engine(
        database_url,
        connect_args={"check_same_thread": False},
        echo=False
    )

# Create session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    future=True
)

# Create base class for models
Base = declarative_base()

# Database dependency for FastAPI
def get_db() -> Generator[Session, None, None]:
    """
    Database session dependency for FastAPI endpoints.
    Automatically handles session lifecycle.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

# Connection event listeners for debugging
@event.listens_for(engine, "connect")
def receive_connect(dbapi_conn, connection_record):
    """Log new database connections"""
    logger.info("Database connection established")

@event.listens_for(engine, "close")
def receive_close(dbapi_conn, connection_record):
    """Log closed database connections"""
    logger.info("Database connection closed")

# Health check function
async def check_database_health() -> bool:
    """
    Check if database is accessible and healthy
    """
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            return result.scalar() == 1
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False


class Instrument(Base):
    """Instrument profile model"""
    __tablename__ = "instruments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    model = Column(String(255), nullable=False)
    serial_number = Column(String(100), unique=True, index=True)
    install_date = Column(String(50))
    location = Column(String(255))
    age_years = Column(Float, default=5.0)
    maintenance_level = Column(String(50), default="Good")
    vacuum_integrity = Column(Float, default=95.0)
    septum_condition = Column(String(50), default="New")
    liner_condition = Column(String(50), default="Clean")
    oven_calibration = Column(String(50), default="Good")
    column_condition = Column(String(50), default="Good")
    last_maintenance = Column(String(50))
    notes = Column(Text)
    parameters = Column(JSON)  # Store additional parameters
    calibration_data = Column(JSON)  # Store calibration data
    performance_history = Column(JSON)  # Store performance metrics
    created_date = Column(DateTime, default=func.now())
    modified_date = Column(DateTime, default=func.now(), onupdate=func.now())


class Method(Base):
    """GC method model"""
    __tablename__ = "methods"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    method_type = Column(String(50))  # inlet, oven, detection
    parameters = Column(JSON, nullable=False)
    results = Column(JSON)
    optimization_data = Column(JSON)
    created_date = Column(DateTime, default=func.now())
    modified_date = Column(DateTime, default=func.now(), onupdate=func.now())


class Compound(Base):
    """Compound library entries for simulation/quant."""
    __tablename__ = "compounds"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    category = Column(String(100), index=True)  # e.g., Hydrocarbon, Oxygenate, Aromatic
    retention_time = Column(Float, nullable=False)  # minutes (typical RT under default method)
    molecular_weight = Column(Float, nullable=True)
    default_intensity = Column(Float, default=100.0)
    default_width = Column(Float, default=0.1)  # FWHM (min)
    metadata_json = Column(JSON)
    created_date = Column(DateTime, default=func.now())
    modified_date = Column(DateTime, default=func.now(), onupdate=func.now())


class MethodPreset(Base):
    """ASTM/GPA/EPA method presets."""
    __tablename__ = "method_presets"

    id = Column(Integer, primary_key=True, index=True)
    standard_body = Column(String(20), index=True)  # ASTM, GPA, EPA
    code = Column(String(50), index=True)  # e.g., ASTM D3588
    name = Column(String(255), nullable=False)
    description = Column(Text)
    method_type = Column(String(50))
    parameters = Column(JSON, nullable=False)
    created_date = Column(DateTime, default=func.now())
    modified_date = Column(DateTime, default=func.now(), onupdate=func.now())


class SandboxRun(Base):
    """Stored Sandbox simulation runs with fault parameters and outputs."""
    __tablename__ = "sandbox_runs"

    id = Column(Integer, primary_key=True, index=True)
    instrument_id = Column(Integer, index=True)
    method_id = Column(Integer, index=True)
    sample_name = Column(String(255))
    compound_ids = Column(JSON)  # list[int]
    fault_params = Column(JSON)
    time = Column(JSON)  # list[float]
    signal = Column(JSON)  # list[float]
    peaks = Column(JSON)  # serialized peaks
    baseline = Column(JSON)
    metrics = Column(JSON)
    created_date = Column(DateTime, default=func.now())


class SimulationProfile(Base):
    """Simulation profiles for saving/loading sandbox configurations."""
    __tablename__ = "simulation_profiles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    instrument_id = Column(Integer, nullable=False, index=True)
    method_id = Column(Integer, nullable=False, index=True)
    inlet_type = Column(String(50), default="split")  # split, splitless, on-column
    oven_ramp_config = Column(JSON)  # Multi-step oven ramp configuration
    flow_config = Column(JSON)  # Flow rate settings
    detector_config = Column(JSON)  # Detector-specific parameters
    compound_ids = Column(JSON)  # Selected compounds
    fault_config = Column(JSON)  # Fault injection parameters
    created_by = Column(Integer, index=True)  # User ID
    is_public = Column(Boolean, default=False)
    usage_count = Column(Integer, default=0)
    tags = Column(JSON)  # Search tags
    created_date = Column(DateTime, default=func.now())
    modified_date = Column(DateTime, default=func.now(), onupdate=func.now())


class ChromatogramDiagnostic(Base):
    """AI-powered chromatogram diagnostics results."""
    __tablename__ = "chromatogram_diagnostics"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, index=True)  # Associated sandbox run or real run
    file_path = Column(String(500))  # Path to uploaded chromatogram file
    file_type = Column(String(20))  # csv, image, jcamp, etc.
    ai_analysis = Column(JSON)  # AI analysis results
    fault_causes = Column(JSON)  # Likely fault causes
    method_adjustments = Column(JSON)  # Suggested method improvements
    confidence_score = Column(Float)  # Overall confidence (0-1)
    processing_time = Column(Float)  # Analysis duration in seconds
    model_version = Column(String(50))  # AI model version used
    created_date = Column(DateTime, default=func.now())


class WorkMode(Base):
    """User work mode preferences for refinery environment."""
    __tablename__ = "work_modes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, unique=True, index=True)  # One mode per user
    mode_name = Column(String(100), default="full")  # full, work, troubleshooting, maintenance
    enabled_modules = Column(JSON)  # List of enabled module names
    dashboard_config = Column(JSON)  # Dashboard layout preferences
    quick_access_tools = Column(JSON)  # Frequently used tools
    auto_launch_module = Column(String(100))  # Module to auto-open
    last_used = Column(DateTime, default=func.now())
    created_date = Column(DateTime, default=func.now())
    modified_date = Column(DateTime, default=func.now(), onupdate=func.now())


class Calculation(Base):
    """Calculation history model"""
    __tablename__ = "calculations"
    
    id = Column(Integer, primary_key=True, index=True)
    calculation_type = Column(String(50), nullable=False)  # transfer_efficiency, detection_limit, etc.
    input_parameters = Column(JSON, nullable=False)
    output_results = Column(JSON, nullable=False)
    execution_time = Column(Float)  # seconds
    created_date = Column(DateTime, default=func.now())


class FileUpload(Base):
    """File upload model"""
    __tablename__ = "file_uploads"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer)
    file_type = Column(String(100))
    upload_date = Column(DateTime, default=func.now())


class User(Base):
    """User model"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="scientist")
    is_active = Column(Boolean, default=True)
    department = Column(String(255))
    phone = Column(String(50))
    created_date = Column(DateTime, default=func.now())
    modified_date = Column(DateTime, default=func.now(), onupdate=func.now())
    last_login = Column(DateTime)


class MethodTemplate(Base):
    """Method template model for reusable method configurations"""
    __tablename__ = "method_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)  # Hydrocarbons, Environmental, Pharmaceutical, etc.
    tool_type = Column(String(100), nullable=False, index=True)  # inlet_simulator, detection_limit, oven_ramp
    description = Column(Text)
    parameters = Column(JSON, nullable=False)  # Store tool-specific parameters
    created_by = Column(Integer, nullable=False)  # User ID who created the template
    is_public = Column(Boolean, default=False)  # Whether template is available to all users
    usage_count = Column(Integer, default=0)  # Track template popularity
    tags = Column(JSON)  # Store searchable tags
    created_date = Column(DateTime, default=func.now())
    modified_date = Column(DateTime, default=func.now(), onupdate=func.now())


class Sample(Base):
    """Sample tracking model for chain of custody"""
    __tablename__ = "samples"
    
    id = Column(Integer, primary_key=True, index=True)
    sample_id = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    matrix = Column(String(100))  # Water, Soil, Air, etc.
    prep_date = Column(DateTime)
    analyst_id = Column(Integer)  # User ID of assigned analyst
    status = Column(String(50), default="received")  # received, prep, analysis, complete
    priority = Column(String(20), default="normal")  # low, normal, high, urgent
    notes = Column(Text)
    sample_metadata = Column(JSON)  # Store additional sample information
    chain_of_custody = Column(JSON)  # Store custody transfer history
    analysis_results = Column(JSON)  # Store analysis results
    created_date = Column(DateTime, default=func.now())
    modified_date = Column(DateTime, default=func.now(), onupdate=func.now())


class CostItem(Base):
    """Cost calculation items (consumables, labor, instrument time)"""
    __tablename__ = "cost_items"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)  # consumables, labor, instrument_time
    subcategory = Column(String(100))  # specific item type
    unit_cost = Column(Float, nullable=False)  # Cost per unit
    unit = Column(String(50), nullable=False)  # mL, hour, analysis, etc.
    supplier = Column(String(255))
    part_number = Column(String(100))
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_date = Column(DateTime, default=func.now())
    modified_date = Column(DateTime, default=func.now(), onupdate=func.now())


class Report(Base):
    """Generated reports model"""
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    report_type = Column(String(100), nullable=False)  # method_development, validation, troubleshooting
    template_used = Column(String(100))  # Template name used for generation
    data_source = Column(JSON, nullable=False)  # Source data used for report
    generated_by = Column(Integer, nullable=False)  # User ID who generated report
    file_path = Column(String(500))  # Path to generated file
    file_format = Column(String(20), default="pdf")  # pdf, docx, xlsx
    status = Column(String(50), default="generating")  # generating, completed, failed
    report_metadata = Column(JSON)  # Additional report metadata
    created_date = Column(DateTime, default=func.now())
    completed_date = Column(DateTime)


# Database utilities
def init_db():
    """
    Create all tables in the database.
    Should be called on application startup.
    """
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")
        raise


def get_instrument_by_id(db, instrument_id: int):
    """Get instrument by ID"""
    return db.query(Instrument).filter(Instrument.id == instrument_id).first()


def get_instrument_by_serial(db, serial_number: str):
    """Get instrument by serial number"""
    return db.query(Instrument).filter(Instrument.serial_number == serial_number).first()


def get_methods_by_type(db, method_type: str):
    """Get methods by type"""
    return db.query(Method).filter(Method.method_type == method_type).all() 