#!/usr/bin/env python3
"""
Comprehensive tests for sandbox and quick-run integration
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
import json

from app.main import app
from app.core.database import get_db, Instrument, Method, Compound
from app.models.schemas import Peak


class TestSandboxIntegration:
    """Test sandbox functionality with real CRUD integration"""
    
    @pytest.fixture
    def client(self):
        return TestClient(app)
    
    @pytest.fixture
    def db_session(self):
        # This would use a test database in production
        from app.core.database import SessionLocal
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()
    
    @pytest.fixture
    def sample_instrument(self, db_session):
        """Create a sample instrument for testing"""
        instrument = Instrument(
            name="Test GC-1",
            model="7890A",
            serial_number="TEST001",
            location="Test Lab",
            age_years=2.5,
            maintenance_level="Good"
        )
        db_session.add(instrument)
        db_session.commit()
        db_session.refresh(instrument)
        return instrument
    
    @pytest.fixture
    def sample_method(self, db_session):
        """Create a sample method for testing"""
        method = Method(
            name="Test Method - Hydrocarbons",
            description="Test method for sandbox",
            method_type="general_gc",
            parameters={
                "column_type": "DB-5",
                "column_length": 30,
                "initial_temp": 40,
                "final_temp": 300,
                "flow_rate": 1.2
            }
        )
        db_session.add(method)
        db_session.commit()
        db_session.refresh(method)
        return method
    
    @pytest.fixture
    def sample_compounds(self, db_session):
        """Create sample compounds for testing"""
        compounds = [
            Compound(
                name="Methane",
                category="Hydrocarbon",
                retention_time=1.5,
                molecular_weight=16.04,
                default_intensity=1000,
                default_width=0.1
            ),
            Compound(
                name="Ethane",
                category="Hydrocarbon", 
                retention_time=2.3,
                molecular_weight=30.07,
                default_intensity=800,
                default_width=0.12
            ),
            Compound(
                name="Propane",
                category="Hydrocarbon",
                retention_time=3.8,
                molecular_weight=44.10,
                default_intensity=600,
                default_width=0.15
            )
        ]
        
        for compound in compounds:
            db_session.add(compound)
        
        db_session.commit()
        
        for compound in compounds:
            db_session.refresh(compound)
        
        return compounds

    def test_quick_run_basic(self, client, sample_instrument, sample_method):
        """Test basic quick-run functionality"""
        response = client.post(
            "/api/v1/chromatography/quick-run",
            json={
                "instrument_id": sample_instrument.id,
                "method_id": sample_method.id,
                "sample_name": "Test Quick Run"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "sample_name" in data
        assert "time" in data
        assert "signal" in data
        assert "peaks" in data
        assert data["sample_name"] == "Test Quick Run"
        assert isinstance(data["time"], list)
        assert isinstance(data["signal"], list)
        assert len(data["time"]) == len(data["signal"])
        assert len(data["time"]) > 100  # Should have reasonable number of points

    def test_quick_run_with_compounds(self, client, sample_instrument, sample_method, sample_compounds):
        """Test quick-run with specific compounds"""
        compound_data = [
            {
                "name": compound.name,
                "retention_time": compound.retention_time,
                "intensity": compound.default_intensity,
                "width": compound.default_width
            }
            for compound in sample_compounds
        ]
        
        response = client.post(
            "/api/v1/chromatography/quick-run",
            json={
                "instrument_id": sample_instrument.id,
                "method_id": sample_method.id,
                "sample_name": "Compound Test Run",
                "compounds": compound_data
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should have peaks corresponding to compounds
        assert len(data["peaks"]) >= len(sample_compounds)
        
        # Verify peak structure
        for peak in data["peaks"]:
            assert "rt" in peak
            assert "area" in peak
            assert "height" in peak
            assert "width" in peak
            assert peak["rt"] > 0
            assert peak["area"] > 0
            assert peak["height"] > 0

    def test_sandbox_run_with_faults(self, client, sample_instrument, sample_method):
        """Test sandbox run with fault simulation"""
        response = client.post(
            "/api/v1/sandbox/run",
            json={
                "instrument_id": sample_instrument.id,
                "method_id": sample_method.id,
                "sample_name": "Fault Test Run",
                "fault_params": {
                    "noise_level": 1.5,
                    "rt_shift": 0.1,
                    "drift": 0.2,
                    "ghost_peak_probability": 0.3
                }
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify sandbox response structure
        assert "run_record" in data
        assert "quality_metrics" in data
        assert "applied_faults" in data
        
        run_record = data["run_record"]
        assert "sample_name" in run_record
        assert run_record["sample_name"] == "Fault Test Run"

    def test_crud_compounds_integration(self, client):
        """Test compound CRUD operations"""
        # Create compound
        compound_data = {
            "name": "Test Benzene",
            "category": "Aromatic",
            "retention_time": 5.4,
            "molecular_weight": 78.11,
            "default_intensity": 750,
            "default_width": 0.2
        }
        
        response = client.post("/api/v1/compounds/", json=compound_data)
        assert response.status_code == 200
        created = response.json()
        assert created["name"] == compound_data["name"]
        compound_id = created["id"]
        
        # Read compound
        response = client.get("/api/v1/compounds/")
        assert response.status_code == 200
        compounds = response.json()
        assert any(c["id"] == compound_id for c in compounds)
        
        # Update compound
        update_data = {"retention_time": 5.6, "default_intensity": 800}
        response = client.put(f"/api/v1/compounds/{compound_id}", json=update_data)
        assert response.status_code == 200
        updated = response.json()
        assert updated["retention_time"] == 5.6
        assert updated["default_intensity"] == 800
        
        # Delete compound
        response = client.delete(f"/api/v1/compounds/{compound_id}")
        assert response.status_code == 200

    def test_crud_methods_integration(self, client):
        """Test method CRUD operations"""
        # Create method
        method_data = {
            "name": "Test EPA Method",
            "description": "EPA test method for integration",
            "method_type": "environmental",
            "parameters": {
                "column_type": "DB-624",
                "initial_temp": 35,
                "final_temp": 250,
                "detector_type": "MS"
            }
        }
        
        response = client.post("/api/v1/methods/", json=method_data)
        assert response.status_code == 200
        created = response.json()
        assert created["name"] == method_data["name"]
        method_id = created["id"]
        
        # Read method
        response = client.get(f"/api/v1/methods/{method_id}")
        assert response.status_code == 200
        method = response.json()
        assert method["method_type"] == "environmental"
        
        # Update method
        update_data = {
            "description": "Updated description",
            "parameters": {
                "column_type": "DB-624",
                "initial_temp": 40,
                "final_temp": 280,
                "detector_type": "MS"
            }
        }
        response = client.put(f"/api/v1/methods/{method_id}", json=update_data)
        assert response.status_code == 200
        updated = response.json()
        assert updated["parameters"]["initial_temp"] == 40
        
        # Delete method
        response = client.delete(f"/api/v1/methods/{method_id}")
        assert response.status_code == 200

    def test_runs_crud_integration(self, client):
        """Test run records CRUD operations"""
        # Create run record
        run_data = {
            "sample_name": "Integration Test Sample",
            "instrument_id": 1,
            "method_id": 1,
            "time": [0.0, 0.1, 0.2, 0.3, 0.4, 0.5],
            "signal": [100, 120, 150, 130, 110, 105],
            "peaks": [
                {
                    "rt": 0.25,
                    "area": 1000,
                    "height": 50,
                    "width": 0.1,
                    "name": "Test Peak"
                }
            ],
            "notes": "Integration test run"
        }
        
        response = client.post("/api/v1/runs/", json=run_data)
        assert response.status_code == 200
        created = response.json()
        assert created["sample_name"] == run_data["sample_name"]
        run_id = created["id"]
        
        # Read run
        response = client.get(f"/api/v1/runs/{run_id}")
        assert response.status_code == 200
        run = response.json()
        assert len(run["peaks"]) == 1
        assert run["peaks"][0]["name"] == "Test Peak"
        
        # Update run
        update_data = {
            "notes": "Updated notes",
            "peaks": [
                {
                    "rt": 0.25,
                    "area": 1200,
                    "height": 60,
                    "width": 0.1,
                    "name": "Updated Test Peak"
                }
            ]
        }
        response = client.put(f"/api/v1/runs/{run_id}", json=update_data)
        assert response.status_code == 200
        updated = response.json()
        assert updated["notes"] == "Updated notes"
        assert updated["peaks"][0]["area"] == 1200
        
        # List runs
        response = client.get("/api/v1/runs/")
        assert response.status_code == 200
        runs = response.json()
        assert any(r["id"] == run_id for r in runs)
        
        # Delete run
        response = client.delete(f"/api/v1/runs/{run_id}")
        assert response.status_code == 200

    def test_peak_detection_integration(self, client):
        """Test peak detection with simulated data"""
        # Generate test chromatogram data
        import numpy as np
        
        time = np.linspace(0, 10, 1000).tolist()
        # Create baseline with some peaks
        signal = [100 + 10 * np.sin(t) for t in time]
        
        # Add artificial peaks
        for peak_rt in [2.5, 5.2, 7.8]:
            for i, t in enumerate(time):
                if abs(t - peak_rt) < 0.3:
                    signal[i] += 500 * np.exp(-((t - peak_rt) / 0.1) ** 2)
        
        detection_request = {
            "time": time,
            "signal": signal,
            "prominence_threshold": 3.0,
            "min_distance": 0.2,
            "noise_window": 50
        }
        
        response = client.post("/api/v1/chromatography/detect", json=detection_request)
        assert response.status_code == 200
        result = response.json()
        
        assert "peaks" in result
        assert "baseline" in result
        assert "noise_level" in result
        assert len(result["peaks"]) >= 3  # Should detect the 3 artificial peaks

    def test_full_workflow_integration(self, client, sample_instrument, sample_method, sample_compounds):
        """Test complete workflow from CRUD to simulation to analysis"""
        
        # 1. Use existing compound data for simulation
        compound_data = [
            {
                "name": compound.name,
                "retention_time": compound.retention_time,
                "intensity": compound.default_intensity,
                "width": compound.default_width
            }
            for compound in sample_compounds[:2]  # Use first 2 compounds
        ]
        
        # 2. Run quick simulation
        response = client.post(
            "/api/v1/chromatography/quick-run",
            json={
                "instrument_id": sample_instrument.id,
                "method_id": sample_method.id,
                "sample_name": "Full Workflow Test",
                "compounds": compound_data
            }
        )
        assert response.status_code == 200
        simulation_result = response.json()
        
        # 3. Save run record
        response = client.post("/api/v1/runs/", json=simulation_result)
        assert response.status_code == 200
        saved_run = response.json()
        run_id = saved_run["id"]
        
        # 4. Detect peaks in the simulated data
        detection_request = {
            "time": simulation_result["time"],
            "signal": simulation_result["signal"],
            "prominence_threshold": 2.0,
            "min_distance": 0.1
        }
        
        response = client.post("/api/v1/chromatography/detect", json=detection_request)
        assert response.status_code == 200
        detection_result = response.json()
        
        # 5. Update run with detected peaks
        update_data = {
            "peaks": detection_result["peaks"],
            "baseline": detection_result["baseline"],
            "notes": "Workflow test - peaks detected"
        }
        
        response = client.put(f"/api/v1/runs/{run_id}", json=update_data)
        assert response.status_code == 200
        
        # 6. Verify final result
        response = client.get(f"/api/v1/runs/{run_id}")
        assert response.status_code == 200
        final_run = response.json()
        
        assert final_run["sample_name"] == "Full Workflow Test"
        assert len(final_run["peaks"]) > 0
        assert "baseline" in final_run
        assert final_run["notes"] == "Workflow test - peaks detected"

    def test_error_handling(self, client):
        """Test proper error handling in API endpoints"""
        
        # Test invalid instrument ID
        response = client.post(
            "/api/v1/chromatography/quick-run",
            json={
                "instrument_id": 99999,
                "method_id": 1,
                "sample_name": "Error Test"
            }
        )
        assert response.status_code == 400
        
        # Test invalid compound data
        response = client.post(
            "/api/v1/compounds/",
            json={
                "name": "",  # Empty name should fail
                "retention_time": -1  # Negative RT should fail
            }
        )
        assert response.status_code == 400
        
        # Test invalid peak detection data
        response = client.post(
            "/api/v1/chromatography/detect",
            json={
                "time": [1, 2, 3],
                "signal": [1, 2]  # Mismatched lengths should fail
            }
        )
        assert response.status_code == 400

    def test_performance_benchmarks(self, client, sample_instrument, sample_method):
        """Test performance benchmarks for critical operations"""
        import time
        
        # Benchmark quick-run performance
        start_time = time.time()
        response = client.post(
            "/api/v1/chromatography/quick-run",
            json={
                "instrument_id": sample_instrument.id,
                "method_id": sample_method.id,
                "sample_name": "Performance Test"
            }
        )
        end_time = time.time()
        
        assert response.status_code == 200
        assert (end_time - start_time) < 5.0  # Should complete within 5 seconds
        
        # Benchmark compound list retrieval
        start_time = time.time()
        response = client.get("/api/v1/compounds/")
        end_time = time.time()
        
        assert response.status_code == 200
        assert (end_time - start_time) < 1.0  # Should complete within 1 second
