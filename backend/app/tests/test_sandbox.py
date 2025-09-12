#!/usr/bin/env python3

import pytest
from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_list_faults():
    r = client.get("/api/v1/sandbox/faults")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert any(f["name"] == "noise" for f in data)


def test_run_sandbox_basic():
    payload = {
        "instrument_id": 1,
        "method_id": 1,
        "compound_ids": [],
        "fault_params": {"noise_level": 0.2},
        "sample_name": "Test",
    }
    r = client.post("/api/v1/sandbox/run", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert "run_record" in data
    assert len(data["run_record"]["time"]) > 100


