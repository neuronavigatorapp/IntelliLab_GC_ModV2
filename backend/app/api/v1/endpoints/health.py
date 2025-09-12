#!/usr/bin/env python3
"""
Health endpoints for IntelliLab GC API

Provides liveness and readiness probes.
"""

from __future__ import annotations

from datetime import datetime
from fastapi import APIRouter
from sqlalchemy import text
from loguru import logger

from app.core.database import engine
from app.core.config import settings


router = APIRouter()


@router.get("/live")
async def liveness() -> dict:
    """Simple liveness probe."""
    return {
        "status": "ok",
        "service": "intellilab-gc-api",
        "time": datetime.utcnow().isoformat() + "Z",
    }


@router.get("/ready")
async def readiness() -> dict:
    """Readiness probe: verifies DB connectivity and critical subsystems."""
    checks = {"database": False, "storage": False}
    details = {}

    # Database check
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        checks["database"] = True
    except Exception as e:
        logger.exception("Readiness DB check failed: {}", e)
        details["database_error"] = str(e)

    # Storage check (uploads directory)
    try:
        import os
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        test_path = os.path.join(settings.UPLOAD_DIR, ".readycheck")
        with open(test_path, "w", encoding="utf-8") as f:
            f.write("ok")
        os.remove(test_path)
        checks["storage"] = True
    except Exception as e:
        logger.exception("Readiness storage check failed: {}", e)
        details["storage_error"] = str(e)

    status = "ready" if all(checks.values()) else "degraded"
    return {
        "status": status,
        "checks": checks,
        "details": details,
        "time": datetime.utcnow().isoformat() + "Z",
    }


