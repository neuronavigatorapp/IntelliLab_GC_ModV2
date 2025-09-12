#!/usr/bin/env python3
"""
Comprehensive test suite for Pass 2 features.
Tests simulation enhancements, AI diagnostics, run history, work modes, and method presets.
"""

import pytest
import json
import datetime
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from unittest.mock import patch, MagicMock

from app.main import app
from app.core.database import get_db, Base
from app.services.sandbox_service import sandbox_service
from app.services.ai_diagnostics_service import ai_diagnostics_service
from app.services.run_history_service import run_history_service
from app.services.work_mode_service import work_mode_service
from app.services.method_presets_service import method_presets_service


# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_pass2.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(scope="module")
def setup_database():
    """Set up test database."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def sample_run_data():
    """Sample run data for testing."""
    return {
        "instrument_id": 1,
        "method_id": 1,
        "sample_name": "Test Sample",
        "compound_ids": [1, 2, 3],
        "fault_params": {
            "noise_level": 0.5,
            "rt_shift": 0.1,
            "drift": 0.0
        }
    }


@pytest.fixture
def sample_simulation_profile():
    """Sample simulation profile data."""
    return {
        "name": "Test Profile",
        "description": "Test simulation profile",
        "instrument_id": 1,
        "method_id": 1,
        "inlet_type": "split",
        "oven_ramp_config": {
            "steps": [
                {
                    "initial_temp": 50,
                    "hold_time": 2,
                    "ramp_rate": 10,
                    "final_temp": 200
                }
            ],
            "post_run_temp": 50,
            "equilibration_time": 1.0
        },
        "flow_config": {
            "carrier_flow": 1.0,
            "split_ratio": 50,
            "septum_purge": 3.0,
            "column_flow": 1.0
        },
        "detector_config": {
            "detector_type": "FID",
            "temp": 250,
            "h2_flow": 30,
            "air_flow": 300,
            "attenuation": 1,
            "data_rate": 10.0
        },
        "compound_ids": [1, 2, 3],
        "tags": ["test", "validation"]
    }


class TestSimulationEnhancements:
    """Test enhanced simulation features."""
    
    def test_simulation_profile_crud(self, setup_database, sample_simulation_profile):
        """Test simulation profile CRUD operations."""
        
        # Create profile
        response = client.post("/api/v1/sandbox/profiles", json=sample_simulation_profile)
        assert response.status_code == 200
        profile_data = response.json()
        assert profile_data["name"] == sample_simulation_profile["name"]
        assert profile_data["inlet_type"] == sample_simulation_profile["inlet_type"]
        profile_id = profile_data["id"]
        
        # Get profile
        response = client.get(f"/api/v1/sandbox/profiles/{profile_id}")
        assert response.status_code == 200
        assert response.json()["name"] == sample_simulation_profile["name"]
        
        # Update profile
        update_data = {"name": "Updated Test Profile", "description": "Updated description"}
        response = client.put(f"/api/v1/sandbox/profiles/{profile_id}", json=update_data)
        assert response.status_code == 200
        assert response.json()["name"] == "Updated Test Profile"
        
        # List profiles
        response = client.get("/api/v1/sandbox/profiles")
        assert response.status_code == 200
        profiles = response.json()
        assert len(profiles) >= 1
        
        # Delete profile
        response = client.delete(f"/api/v1/sandbox/profiles/{profile_id}")
        assert response.status_code == 200
    
    def test_enhanced_sandbox_run(self, setup_database, sample_run_data):
        """Test enhanced sandbox simulation with new features."""
        
        # Mock the database models that might not exist
        with patch('app.services.sandbox_service.SessionLocal') as mock_session:
            mock_db = MagicMock()
            mock_session.return_value.__enter__.return_value = mock_db
            
            # Mock compound query
            mock_compounds = [
                MagicMock(name="Methane", retention_time=1.2, default_intensity=100, default_width=0.05),
                MagicMock(name="Ethane", retention_time=1.8, default_intensity=120, default_width=0.06)
            ]
            mock_db.query.return_value.filter.return_value.all.return_value = mock_compounds
            
            # Test sandbox run with enhanced parameters
            response = client.post("/api/v1/sandbox/run", json=sample_run_data)
            
            # Should return chromatogram data
            assert response.status_code == 200
            result = response.json()
            assert "run_record" in result
            assert "quality_metrics" in result
            assert "applied_faults" in result
    
    def test_inlet_effects_simulation(self):
        """Test inlet type effects on simulation."""
        from app.models.schemas import InletType, FlowConfig
        
        compounds = [
            {"name": "Test Compound", "rt": 5.0, "intensity": 100, "width": 0.1, "molecular_weight": 80}
        ]
        
        flow_config = FlowConfig(
            carrier_flow=1.0,
            split_ratio=50,
            septum_purge=3.0,
            column_flow=1.0
        )
        
        # Test split inlet
        modified = sandbox_service.simulate_inlet_effects(InletType.SPLIT, flow_config, compounds)
        assert len(modified) == 1
        assert modified[0]["intensity"] < compounds[0]["intensity"]  # Should be reduced due to split
        
        # Test splitless inlet
        modified = sandbox_service.simulate_inlet_effects(InletType.SPLITLESS, flow_config, compounds)
        assert len(modified) == 1
        assert modified[0]["intensity"] > compounds[0]["intensity"]  # Should be increased


class TestAIDiagnostics:
    """Test AI diagnostics features."""
    
    def test_fault_pattern_detection(self):
        """Test fault pattern detection logic."""
        
        # Test baseline drift detection
        import numpy as np
        
        # Create signal with drift
        time_points = np.linspace(0, 20, 1000)
        signal_with_drift = np.random.normal(100, 5, 1000) + np.linspace(0, 50, 1000)
        
        drift_analysis = ai_diagnostics_service._detect_baseline_drift(signal_with_drift)
        assert drift_analysis["detected"] == True
        assert drift_analysis["confidence"] > 0.5
    
    def test_peak_tailing_detection(self):
        """Test peak tailing detection."""
        from app.models.schemas import Peak
        
        # Create peaks with tailing
        peaks = [
            Peak(rt=5.0, area=1000, height=100, width=0.3),  # Wide peak (tailing)
            Peak(rt=8.0, area=800, height=80, width=0.15),   # Normal peak
        ]
        
        tailing_analysis = ai_diagnostics_service._detect_peak_tailing(peaks)
        assert "detected" in tailing_analysis
        assert "confidence" in tailing_analysis
        assert "avg_asymmetry" in tailing_analysis
    
    def test_chromatogram_analysis_endpoint(self, setup_database):
        """Test chromatogram analysis API endpoint."""
        
        # Create test CSV data
        csv_content = "Time,Signal\n1.0,100\n2.0,150\n3.0,120\n4.0,95\n"
        
        with patch('builtins.open', create=True) as mock_open:
            mock_open.return_value.__enter__.return_value.read.return_value = csv_content
            
            with patch('os.makedirs'), patch('os.remove'):
                files = {"file": ("test.csv", csv_content, "text/csv")}
                
                # Mock file upload and analysis
                with patch('app.services.ai_diagnostics_service.ai_diagnostics_service.analyze_chromatogram_file') as mock_analyze:
                    mock_analyze.return_value = MagicMock(
                        id=1,
                        file_type="csv",
                        confidence_score=0.85,
                        fault_causes=["baseline_drift"],
                        method_adjustments=[{"parameter": "detector_temp", "adjustment": "+25°C"}]
                    )
                    
                    response = client.post("/api/v1/ai-diagnostics/analyze-file", files=files)
                    assert response.status_code == 200


class TestRunHistory:
    """Test run history and reporting features."""
    
    def test_run_search_filtering(self, setup_database):
        """Test run search with various filters."""
        
        # Mock database query
        with patch('app.services.run_history_service.SessionLocal') as mock_session:
            mock_db = MagicMock()
            mock_session.return_value.__enter__.return_value = mock_db
            
            # Mock search results
            mock_runs = [
                MagicMock(
                    id=1, sample_name="Test Sample 1", instrument_id=1, method_id=1,
                    peaks=[], signal=[100, 120, 95], time=[1, 2, 3],
                    created_date=datetime.datetime.now()
                )
            ]
            mock_db.query.return_value.filter.return_value.count.return_value = 1
            mock_db.query.return_value.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = mock_runs
            
            # Mock instrument and method queries
            mock_db.query.return_value.filter.return_value.first.return_value = MagicMock(
                name="Test Instrument", model="GC-2030"
            )
            
            response = client.get("/api/v1/run-history/search?search_query=Test&limit=10")
            assert response.status_code == 200
            result = response.json()
            assert "runs" in result
            assert "total_count" in result
    
    def test_run_export(self, setup_database):
        """Test run export functionality."""
        
        with patch('app.services.run_history_service.SessionLocal') as mock_session:
            mock_db = MagicMock()
            mock_session.return_value.__enter__.return_value = mock_db
            
            # Mock runs for export
            mock_runs = [
                MagicMock(
                    id=1, sample_name="Test Sample", instrument_id=1, method_id=1,
                    peaks=[], signal=[100, 120, 95], time=[1, 2, 3],
                    created_date=datetime.datetime.now()
                )
            ]
            mock_db.query.return_value.filter.return_value.all.return_value = mock_runs
            
            export_request = {
                "run_ids": [1],
                "format": "csv",
                "include_chromatograms": False
            }
            
            response = client.post("/api/v1/run-history/export", json=export_request)
            assert response.status_code == 200
            result = response.json()
            assert "file_content" in result
            assert "filename" in result
            assert result["export_format"] == "csv"
    
    def test_run_statistics(self, setup_database):
        """Test run statistics generation."""
        
        with patch('app.services.run_history_service.SessionLocal') as mock_session:
            mock_db = MagicMock()
            mock_session.return_value.__enter__.return_value = mock_db
            
            # Mock statistical data
            mock_runs = [
                MagicMock(
                    peaks=[{"rt": 1.0}, {"rt": 2.0}],
                    instrument_id=1, method_id=1,
                    created_date=datetime.datetime.now()
                )
            ]
            mock_db.query.return_value.all.return_value = mock_runs
            
            response = client.get("/api/v1/run-history/statistics")
            assert response.status_code == 200
            stats = response.json()
            assert "total_runs" in stats
            assert "total_peaks" in stats
            assert "avg_peaks_per_run" in stats


class TestWorkMode:
    """Test work mode functionality."""
    
    def test_predefined_work_modes(self):
        """Test predefined work mode configurations."""
        
        modes = work_mode_service.get_predefined_modes()
        assert len(modes) >= 4  # Should have at least full, work, troubleshooting, maintenance
        
        mode_names = [mode["name"] for mode in modes]
        assert "full" in mode_names
        assert "work" in mode_names
        assert "troubleshooting" in mode_names
        assert "maintenance" in mode_names
    
    def test_work_mode_crud(self, setup_database):
        """Test work mode CRUD operations via API."""
        
        # Get predefined modes
        response = client.get("/api/v1/work-mode/predefined")
        assert response.status_code == 200
        assert "predefined_modes" in response.json()
        
        # Set predefined mode
        response = client.post("/api/v1/work-mode/predefined/work?user_id=1")
        assert response.status_code == 200
        work_mode = response.json()
        assert work_mode["mode_name"] == "work"
        assert "enabled_modules" in work_mode
        
        # Get current work mode
        response = client.get("/api/v1/work-mode/current?user_id=1")
        assert response.status_code == 200
        current_mode = response.json()
        assert current_mode["mode_name"] == "work"
        
        # Get launch config
        response = client.get("/api/v1/work-mode/launch-config?user_id=1")
        assert response.status_code == 200
        launch_config = response.json()
        assert launch_config["has_work_mode"] == True
        assert "auto_launch_module" in launch_config
    
    def test_work_mode_validation(self):
        """Test work mode configuration validation."""
        
        # Valid configuration
        valid_config = {
            "mode_name": "custom",
            "enabled_modules": ["dashboard", "sandbox", "instruments"],
            "auto_launch_module": "dashboard"
        }
        
        validation = work_mode_service.validate_work_mode(valid_config)
        assert validation["valid"] == True
        assert len(validation["errors"]) == 0
        
        # Invalid configuration
        invalid_config = {
            "mode_name": "custom",
            "enabled_modules": ["nonexistent_module"],
            "auto_launch_module": "also_nonexistent"
        }
        
        validation = work_mode_service.validate_work_mode(invalid_config)
        assert validation["valid"] == False
        assert len(validation["errors"]) > 0


class TestMethodPresets:
    """Test enhanced method presets functionality."""
    
    def test_standard_presets_initialization(self):
        """Test standard method presets initialization."""
        
        standard_presets = method_presets_service.standard_presets
        assert len(standard_presets) >= 5  # Should have ASTM and GPA presets
        
        # Check for specific standards
        codes = [preset["code"] for preset in standard_presets]
        assert "D2163" in codes
        assert "D6730" in codes
        assert "D5623" in codes
        assert "2177" in codes
        assert "2186" in codes
    
    def test_preset_search_and_categories(self, setup_database):
        """Test preset search and categorization."""
        
        # Mock database for search
        with patch('app.services.method_presets_service.SessionLocal') as mock_session:
            mock_db = MagicMock()
            mock_session.return_value.__enter__.return_value = mock_db
            
            # Mock search results
            mock_presets = [
                MagicMock(
                    id=1, standard_body="ASTM", code="D2163",
                    name="Test Preset", method_type="hydrocarbon_analysis"
                )
            ]
            mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = mock_presets
            
            response = client.get("/api/v1/method-presets/search/?q=ASTM")
            assert response.status_code == 200
            
            # Test categories endpoint
            mock_db.query.return_value.distinct.return_value.all.return_value = [("ASTM", "hydrocarbon_analysis")]
            
            response = client.get("/api/v1/method-presets/categories/")
            assert response.status_code == 200
    
    def test_preset_cloning(self, setup_database):
        """Test method preset cloning functionality."""
        
        with patch('app.services.method_presets_service.SessionLocal') as mock_session:
            mock_db = MagicMock()
            mock_session.return_value.__enter__.return_value = mock_db
            
            # Mock original preset
            original_preset = MagicMock(
                id=1, standard_body="ASTM", code="D2163",
                name="Original Preset", method_type="hydrocarbon_analysis",
                parameters={"column": {"length": "6 ft"}}
            )
            mock_db.query.return_value.filter.return_value.first.return_value = original_preset
            
            # Mock cloned preset creation
            cloned_preset = MagicMock()
            mock_db.add.return_value = None
            mock_db.commit.return_value = None
            mock_db.refresh.return_value = None
            
            response = client.post("/api/v1/method-presets/1/clone?new_name=Cloned Preset")
            assert response.status_code == 200


def test_database_migration():
    """Test Pass 2 database migration."""
    
    from app.migrations.pass2_migration import check_migration_status, run_pass2_migration
    
    # This would typically run against a test database
    # For now, just test that the functions exist and can be called
    assert callable(check_migration_status)
    assert callable(run_pass2_migration)


def test_api_endpoints_availability():
    """Test that all new API endpoints are available."""
    
    endpoints_to_test = [
        "/api/v1/sandbox/profiles",
        "/api/v1/ai-diagnostics/fault-patterns", 
        "/api/v1/run-history/search",
        "/api/v1/work-mode/predefined",
        "/api/v1/method-presets/categories/"
    ]
    
    for endpoint in endpoints_to_test:
        response = client.get(endpoint)
        # Should not return 404 (endpoint exists)
        assert response.status_code != 404


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
