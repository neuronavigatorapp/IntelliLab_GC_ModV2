#!/usr/bin/env python3
"""
Test suite for persistence functionality in IntelliLab GC Pass 1
Tests database operations, backup/restore, and data integrity
"""

import pytest
import os
import tempfile
import shutil
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys

# Add the parent directory to sys.path so we can import from app
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import Base, Compound, Method, MethodPreset, SandboxRun, Instrument
from app.core.config import Settings


class TestPersistence:
    """Test suite for database persistence functionality"""
    
    @pytest.fixture
    def temp_db(self):
        """Create a temporary database for testing"""
        # Create temporary directory
        temp_dir = tempfile.mkdtemp()
        db_path = os.path.join(temp_dir, "test_intellilab.db")
        
        # Create test database
        engine = create_engine(f"sqlite:///{db_path}", connect_args={"check_same_thread": False})
        Base.metadata.create_all(bind=engine)
        
        # Create session factory
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        
        yield db_path, engine, SessionLocal
        
        # Cleanup
        shutil.rmtree(temp_dir)
    
    def test_database_creation(self, temp_db):
        """Test that database and tables are created correctly"""
        db_path, engine, SessionLocal = temp_db
        
        # Verify database file exists
        assert os.path.exists(db_path)
        
        # Verify tables exist
        with engine.connect() as conn:
            # Check if main tables exist
            result = conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [row[0] for row in result]
            
            expected_tables = ['compounds', 'methods', 'method_presets', 'sandbox_runs', 'instruments']
            for table in expected_tables:
                assert table in tables, f"Table {table} not found in database"
    
    def test_compound_crud_operations(self, temp_db):
        """Test compound CRUD operations persist correctly"""
        db_path, engine, SessionLocal = temp_db
        
        with SessionLocal() as db:
            # Create compound
            compound = Compound(
                name="Test Methane",
                category="Hydrocarbon",
                retention_time=1.5,
                molecular_weight=16.04,
                default_intensity=100.0,
                default_width=0.1
            )
            db.add(compound)
            db.commit()
            compound_id = compound.id
        
        # Verify persistence by opening new session
        with SessionLocal() as db:
            retrieved = db.query(Compound).filter(Compound.id == compound_id).first()
            assert retrieved is not None
            assert retrieved.name == "Test Methane"
            assert retrieved.category == "Hydrocarbon"
            assert retrieved.retention_time == 1.5
            
            # Update compound
            retrieved.retention_time = 2.0
            db.commit()
        
        # Verify update persisted
        with SessionLocal() as db:
            updated = db.query(Compound).filter(Compound.id == compound_id).first()
            assert updated.retention_time == 2.0
            
            # Delete compound
            db.delete(updated)
            db.commit()
        
        # Verify deletion persisted
        with SessionLocal() as db:
            deleted = db.query(Compound).filter(Compound.id == compound_id).first()
            assert deleted is None
    
    def test_method_crud_operations(self, temp_db):
        """Test method CRUD operations persist correctly"""
        db_path, engine, SessionLocal = temp_db
        
        with SessionLocal() as db:
            # Create method
            method = Method(
                name="Test GC Method",
                description="Test method for persistence",
                method_type="inlet",
                parameters={
                    "inlet_temp": 250,
                    "split_ratio": 10,
                    "flow_rate": 1.0
                }
            )
            db.add(method)
            db.commit()
            method_id = method.id
        
        # Verify persistence
        with SessionLocal() as db:
            retrieved = db.query(Method).filter(Method.id == method_id).first()
            assert retrieved is not None
            assert retrieved.name == "Test GC Method"
            assert retrieved.parameters["inlet_temp"] == 250
    
    def test_sandbox_run_persistence(self, temp_db):
        """Test sandbox run data persists correctly"""
        db_path, engine, SessionLocal = temp_db
        
        with SessionLocal() as db:
            # Create sandbox run
            run = SandboxRun(
                instrument_id=1,
                method_id=1,
                sample_name="Test Sample",
                compound_ids=[1, 2, 3],
                fault_params={"baseline_drift": 0.1},
                time=[0, 1, 2, 3, 4, 5],
                signal=[100, 120, 150, 180, 160, 100],
                peaks=[{"rt": 2.5, "area": 1000, "height": 200}],
                baseline=[95, 96, 97, 98, 99, 100],
                metrics={"total_area": 1000, "peak_count": 1}
            )
            db.add(run)
            db.commit()
            run_id = run.id
        
        # Verify persistence with complex data
        with SessionLocal() as db:
            retrieved = db.query(SandboxRun).filter(SandboxRun.id == run_id).first()
            assert retrieved is not None
            assert retrieved.sample_name == "Test Sample"
            assert len(retrieved.time) == 6
            assert len(retrieved.signal) == 6
            assert retrieved.peaks[0]["rt"] == 2.5
            assert retrieved.fault_params["baseline_drift"] == 0.1
    
    def test_data_relationships(self, temp_db):
        """Test that data relationships work correctly"""
        db_path, engine, SessionLocal = temp_db
        
        with SessionLocal() as db:
            # Create instrument
            instrument = Instrument(
                name="Test GC",
                model="Test Model",
                serial_number="TEST001",
                location="Test Lab"
            )
            db.add(instrument)
            
            # Create method
            method = Method(
                name="Related Method",
                description="Method linked to instrument",
                method_type="complete",
                parameters={"test": True}
            )
            db.add(method)
            db.commit()
            
            # Create sandbox run linking to both
            run = SandboxRun(
                instrument_id=instrument.id,
                method_id=method.id,
                sample_name="Linked Sample",
                compound_ids=[],
                fault_params={},
                time=[],
                signal=[],
                peaks=[],
                baseline=[],
                metrics={}
            )
            db.add(run)
            db.commit()
            
            run_id = run.id
        
        # Verify relationships persist
        with SessionLocal() as db:
            run = db.query(SandboxRun).filter(SandboxRun.id == run_id).first()
            assert run.instrument_id == instrument.id
            assert run.method_id == method.id
    
    def test_concurrent_access(self, temp_db):
        """Test that multiple sessions can access database safely"""
        db_path, engine, SessionLocal = temp_db
        
        # Session 1: Create data
        with SessionLocal() as db1:
            compound1 = Compound(name="Compound 1", retention_time=1.0)
            db1.add(compound1)
            db1.commit()
            
            # Session 2: Read while Session 1 is open
            with SessionLocal() as db2:
                compounds = db2.query(Compound).all()
                assert len(compounds) == 1
                
                # Add more data in Session 2
                compound2 = Compound(name="Compound 2", retention_time=2.0)
                db2.add(compound2)
                db2.commit()
        
        # Verify both transactions persisted
        with SessionLocal() as db:
            compounds = db.query(Compound).all()
            assert len(compounds) == 2
            names = [c.name for c in compounds]
            assert "Compound 1" in names
            assert "Compound 2" in names


class TestBackupFunctionality:
    """Test backup and restore functionality"""
    
    @pytest.fixture
    def test_environment(self):
        """Create test environment with database and backup directory"""
        temp_dir = tempfile.mkdtemp()
        data_dir = os.path.join(temp_dir, "data")
        backup_dir = os.path.join(temp_dir, "backups")
        
        os.makedirs(data_dir)
        os.makedirs(backup_dir)
        
        db_path = os.path.join(data_dir, "test_intellilab.db")
        
        # Create test database with sample data
        engine = create_engine(f"sqlite:///{db_path}", connect_args={"check_same_thread": False})
        Base.metadata.create_all(bind=engine)
        
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        
        # Add sample data
        with SessionLocal() as db:
            compounds = [
                Compound(name="Methane", retention_time=1.0),
                Compound(name="Ethane", retention_time=1.5),
                Compound(name="Propane", retention_time=2.0)
            ]
            for c in compounds:
                db.add(c)
            db.commit()
        
        yield temp_dir, db_path, backup_dir, SessionLocal
        
        # Cleanup
        shutil.rmtree(temp_dir)
    
    def test_backup_creation(self, test_environment):
        """Test that database backup is created correctly"""
        temp_dir, db_path, backup_dir, SessionLocal = test_environment
        
        # Import backup functionality
        sys.path.insert(0, str(Path(__file__).parent.parent.parent / "scripts"))
        from backup_database import backup_database
        
        # Create backup
        backup_path = backup_database(backup_dir)
        
        # Verify backup file exists
        assert os.path.exists(backup_path)
        assert backup_path.startswith(backup_dir)
        assert "intellilab_backup_" in os.path.basename(backup_path)
        
        # Verify backup has content
        assert os.path.getsize(backup_path) > 0
        
        # Verify metadata file exists
        metadata_path = backup_path + ".meta"
        assert os.path.exists(metadata_path)
    
    def test_backup_content_integrity(self, test_environment):
        """Test that backup contains correct data"""
        temp_dir, db_path, backup_dir, SessionLocal = test_environment
        
        # Import backup functionality
        sys.path.insert(0, str(Path(__file__).parent.parent.parent / "scripts"))
        from backup_database import backup_database
        
        # Create backup
        backup_path = backup_database(backup_dir)
        
        # Verify backup database has same data
        backup_engine = create_engine(f"sqlite:///{backup_path}", connect_args={"check_same_thread": False})
        BackupSession = sessionmaker(autocommit=False, autoflush=False, bind=backup_engine)
        
        with BackupSession() as backup_db:
            compounds = backup_db.query(Compound).all()
            assert len(compounds) == 3
            names = [c.name for c in compounds]
            assert "Methane" in names
            assert "Ethane" in names
            assert "Propane" in names


class TestSystemEndpoints:
    """Test system API endpoints for persistence management"""
    
    def test_config_paths(self):
        """Test that configuration returns correct paths"""
        settings = Settings()
        
        # Test data directory creation
        data_dir = settings.get_data_dir()
        assert data_dir is not None
        assert len(data_dir) > 0
        
        # Test database path
        db_path = settings.get_database_path()
        assert db_path is not None
        assert db_path.endswith("intellilab.db")
        assert data_dir in db_path
        
        # Test backup directory
        backup_dir = settings.get_backup_dir()
        assert backup_dir is not None
        assert "backups" in backup_dir
        assert data_dir in backup_dir
    
    def test_platform_specific_paths(self):
        """Test that paths are correctly set for different platforms"""
        import platform
        
        settings = Settings()
        data_dir = settings.get_data_dir()
        
        system = platform.system()
        if system == "Windows":
            assert "C:" in data_dir or data_dir.startswith("C:")
            assert "IntelliLab_GC" in data_dir
        else:  # macOS/Linux
            assert "IntelliLab_GC" in data_dir


# Integration test that simulates application restart
class TestApplicationRestart:
    """Test that data persists across application restarts"""
    
    def test_full_restart_simulation(self):
        """Simulate complete application restart and verify data persistence"""
        temp_dir = tempfile.mkdtemp()
        
        try:
            # Simulate first application startup
            db_path = os.path.join(temp_dir, "intellilab.db")
            engine1 = create_engine(f"sqlite:///{db_path}", connect_args={"check_same_thread": False})
            Base.metadata.create_all(bind=engine1)
            
            SessionLocal1 = sessionmaker(autocommit=False, autoflush=False, bind=engine1)
            
            # Create test data in "first session"
            with SessionLocal1() as db:
                test_data = [
                    Compound(name="Restart Test Compound", retention_time=3.14),
                    Method(name="Restart Test Method", method_type="test", parameters={"test": True}),
                    SandboxRun(
                        instrument_id=1,
                        method_id=1,
                        sample_name="Restart Test Run",
                        compound_ids=[1],
                        fault_params={},
                        time=[0, 1, 2],
                        signal=[100, 200, 100],
                        peaks=[],
                        baseline=[],
                        metrics={}
                    )
                ]
                for item in test_data:
                    db.add(item)
                db.commit()
            
            # Close first "application session"
            engine1.dispose()
            
            # Simulate application restart with new engine/sessions
            engine2 = create_engine(f"sqlite:///{db_path}", connect_args={"check_same_thread": False})
            SessionLocal2 = sessionmaker(autocommit=False, autoflush=False, bind=engine2)
            
            # Verify all data persisted across "restart"
            with SessionLocal2() as db:
                compounds = db.query(Compound).filter(Compound.name.like("Restart Test%")).all()
                methods = db.query(Method).filter(Method.name.like("Restart Test%")).all()
                runs = db.query(SandboxRun).filter(SandboxRun.sample_name.like("Restart Test%")).all()
                
                assert len(compounds) == 1
                assert len(methods) == 1
                assert len(runs) == 1
                
                assert compounds[0].retention_time == 3.14
                assert methods[0].parameters["test"] is True
                assert runs[0].instrument_id == 1
            
            engine2.dispose()
            
        finally:
            shutil.rmtree(temp_dir)


if __name__ == "__main__":
    # Run tests if executed directly
    pytest.main([__file__, "-v", "--tb=short"])
