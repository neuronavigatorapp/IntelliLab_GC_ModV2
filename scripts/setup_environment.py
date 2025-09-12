#!/usr/bin/env python3
"""
Environment Setup Script for IntelliLab GC - Pass 1 Persistent Storage
Handles database migration, data loading, and environment initialization
"""

import argparse
import os
import csv
import json
import sys
import platform
from pathlib import Path

# Add the parent directory to sys.path so we can import from backend
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.app.core.database import Base, engine, SessionLocal, Compound as CompoundModel, MethodPreset as PresetModel
from backend.app.core.config import Settings


def print_header():
    """Print setup header"""
    print("=" * 60)
    print("IntelliLab GC - Environment Setup (Pass 1)")
    print("Local Persistent Storage Configuration")
    print("=" * 60)
    print(f"Platform: {platform.system()} {platform.version()}")
    print(f"Python: {platform.python_version()}")
    print()


def migrate_db():
    """Create/update database schema"""
    try:
        settings = Settings()
        db_path = settings.get_database_path()
        data_dir = settings.get_data_dir()
        
        print(f"📁 Data directory: {data_dir}")
        print(f"🗄️  Database path: {db_path}")
        
        # Ensure data directory exists
        Path(data_dir).mkdir(parents=True, exist_ok=True)
        print(f"✅ Data directory ready")
        
        # Create database tables
        Base.metadata.create_all(bind=engine)
        
        # Verify database was created
        if os.path.exists(db_path):
            size_mb = os.path.getsize(db_path) / (1024 * 1024)
            print(f"✅ Database migrated: {db_path} ({size_mb:.2f} MB)")
        else:
            print(f"❌ Database creation failed: {db_path}")
            return False
            
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        return False


def load_compounds(csv_path: str):
    """Load compounds from CSV file"""
    try:
        if not os.path.exists(csv_path):
            print(f"⚠️  Compound CSV not found: {csv_path}")
            return 0
            
        print(f"📄 Loading compounds from: {csv_path}")
        
        with open(csv_path, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            count = 0
            updated = 0
            
            with SessionLocal() as db:
                for row in reader:
                    name = row.get('name')
                    if not name:
                        continue
                        
                    existing = db.query(CompoundModel).filter(CompoundModel.name == name).first()
                    if existing:
                        # Update existing compound
                        existing.retention_time = float(row.get('rt', existing.retention_time or 1.0))
                        existing.molecular_weight = float(row.get('molecular_weight', existing.molecular_weight or 0) or 0)
                        existing.category = row.get('category') or existing.category
                        existing.default_intensity = float(row.get('intensity', existing.default_intensity or 100) or 100)
                        existing.default_width = float(row.get('width', existing.default_width or 0.1) or 0.1)
                        updated += 1
                    else:
                        # Create new compound
                        obj = CompoundModel(
                            name=name,
                            retention_time=float(row.get('rt', 1.0)),
                            molecular_weight=float(row.get('molecular_weight', 0) or 0),
                            category=row.get('category'),
                            default_intensity=float(row.get('intensity', 100) or 100),
                            default_width=float(row.get('width', 0.1) or 0.1),
                        )
                        db.add(obj)
                        count += 1
                        
                db.commit()
                
        print(f"✅ Loaded {count} new compounds, updated {updated} existing")
        return count + updated
        
    except Exception as e:
        print(f"❌ Failed to load compounds: {str(e)}")
        return 0


def load_faults(json_path: str):
    """Load fault library from JSON file"""
    try:
        if not os.path.exists(json_path):
            print(f"⚠️  Fault library not found: {json_path} (optional)")
            return True
            
        print(f"📄 Fault library available: {json_path}")
        
        with open(json_path, 'r') as f:
            faults = json.load(f)
            
        print(f"✅ Fault library loaded: {len(faults)} fault types available")
        return True
        
    except Exception as e:
        print(f"❌ Failed to load fault library: {str(e)}")
        return False


def reset_database():
    """Reset database (wipe and recreate)"""
    try:
        settings = Settings()
        db_path = settings.get_database_path()
        
        if os.path.exists(db_path):
            print(f"🗑️  Removing existing database: {db_path}")
            os.remove(db_path)
            
        return migrate_db()
        
    except Exception as e:
        print(f"❌ Reset failed: {str(e)}")
        return False


def create_sample_data():
    """Create sample data for testing"""
    try:
        print("🧪 Creating sample data...")
        
        with SessionLocal() as db:
            # Create sample instruments if none exist
            from backend.app.core.database import Instrument
            if db.query(Instrument).count() == 0:
                sample_instrument = Instrument(
                    name="GC-2014 Sample",
                    model="Shimadzu GC-2014",
                    serial_number="SAMPLE001",
                    location="Lab 1",
                    notes="Sample instrument for testing"
                )
                db.add(sample_instrument)
                
            # Create sample methods if none exist
            from backend.app.core.database import Method
            if db.query(Method).count() == 0:
                sample_method = Method(
                    name="Basic Hydrocarbon Analysis",
                    description="Standard method for C1-C6 analysis",
                    method_type="complete",
                    parameters={
                        "inlet_temp": 250,
                        "column_flow": 1.0,
                        "oven_program": [
                            {"temp": 40, "rate": 0, "hold": 2},
                            {"temp": 200, "rate": 10, "hold": 5}
                        ]
                    }
                )
                db.add(sample_method)
                
            db.commit()
            
        print("✅ Sample data created")
        return True
        
    except Exception as e:
        print(f"❌ Failed to create sample data: {str(e)}")
        return False


def check_environment():
    """Check environment status"""
    try:
        settings = Settings()
        db_path = settings.get_database_path()
        backup_dir = settings.get_backup_dir()
        
        print("📊 Environment Status:")
        print(f"   Database: {'✅ Exists' if os.path.exists(db_path) else '❌ Missing'}")
        print(f"   Backup Dir: {'✅ Exists' if os.path.exists(backup_dir) else '❌ Missing'}")
        
        if os.path.exists(db_path):
            size_mb = os.path.getsize(db_path) / (1024 * 1024)
            print(f"   DB Size: {size_mb:.2f} MB")
            
            # Count records
            with SessionLocal() as db:
                from backend.app.core.database import Compound, Method, Instrument, SandboxRun
                compound_count = db.query(Compound).count()
                method_count = db.query(Method).count()
                instrument_count = db.query(Instrument).count()
                run_count = db.query(SandboxRun).count()
                
                print(f"   Records: {compound_count} compounds, {method_count} methods, {instrument_count} instruments, {run_count} runs")
        
        return True
        
    except Exception as e:
        print(f"❌ Environment check failed: {str(e)}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="IntelliLab GC Environment Setup",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Full setup with migration and data loading
  python setup_environment.py --migrate --load-compounds backend/ai/compound_library.csv --load-faults backend/ai/fault_library.json
  
  # Reset everything and reload
  python setup_environment.py --reset --sample-data
  
  # Check current status
  python setup_environment.py --check
        """
    )
    
    parser.add_argument('--migrate', action='store_true', help='Create/update database schema')
    parser.add_argument('--load-compounds', type=str, help='Load compounds from CSV file')
    parser.add_argument('--load-faults', type=str, help='Load fault library from JSON file')
    parser.add_argument('--reset', action='store_true', help='Reset database (wipe and recreate)')
    parser.add_argument('--sample-data', action='store_true', help='Create sample data for testing')
    parser.add_argument('--check', action='store_true', help='Check environment status')
    
    args = parser.parse_args()
    
    print_header()
    
    success = True
    
    # Handle operations in order
    if args.check:
        success &= check_environment()
        
    if args.reset:
        success &= reset_database()
        
    if args.migrate:
        success &= migrate_db()
        
    if args.load_compounds:
        load_compounds(args.load_compounds)
        
    if args.load_faults:
        success &= load_faults(args.load_faults)
        
    if args.sample_data:
        success &= create_sample_data()
    
    # If no specific actions requested, run basic setup
    if not any([args.migrate, args.load_compounds, args.load_faults, args.reset, args.sample_data, args.check]):
        print("🚀 Running basic setup...")
        success &= migrate_db()
        success &= check_environment()
    
    print()
    print("=" * 60)
    if success:
        print("✅ Setup completed successfully!")
        print()
        print("Next steps:")
        print("1. cd backend")
        print("2. python -m uvicorn app.main:app --reload --host 0.0.0.0")
        print("3. Open http://localhost:8000 in your browser")
        print("4. API docs available at http://localhost:8000/docs")
    else:
        print("❌ Setup completed with errors - check messages above")
        return 1
    
    return 0


if __name__ == '__main__':
    sys.exit(main())
