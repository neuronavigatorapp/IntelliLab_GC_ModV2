#!/usr/bin/env python3
"""
Chromatography endpoints for peak detection, simulation, and data processing
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
import logging

from app.models.schemas import (
    PeakDetectionRequest, PeakDetectionResponse,
    ChromatogramSimulationRequest, ChromatogramSimulationResponse,
    ChromatogramImportRequest, ChromatogramImportResponse,
    ChromatogramExportRequest, ChromatogramExportResponse
)
from app.services.chromatography_service import chromatography_service
from app.models.schemas import RunRecord
from app.core.database import get_db
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/detect", response_model=PeakDetectionResponse)
async def detect_peaks(request: PeakDetectionRequest):
    """Detect peaks in chromatogram data"""
    try:
        logger.info(f"Peak detection request received for {len(request.time)} data points")
        response = chromatography_service.detect_peaks(request)
        logger.info(f"Peak detection completed: {len(response.peaks)} peaks found")
        return response
    except Exception as e:
        logger.error(f"Peak detection failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/simulate", response_model=ChromatogramSimulationResponse)
async def simulate_chromatogram(request: ChromatogramSimulationRequest):
    """Simulate chromatogram based on method parameters"""
    try:
        logger.info(f"Chromatogram simulation request received for sample: {request.sample_name}")
        response = chromatography_service.simulate_chromatogram(request)
        logger.info(f"Simulation completed: {len(response.run_record.peaks)} peaks generated")
        return response
    except Exception as e:
        logger.error(f"Chromatogram simulation failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/quick-run", response_model=RunRecord)
async def quick_run(
    instrument_id: int,
    method_id: int,
    compounds: List[Dict[str, Any]] | None = None,
    sample_name: str = "Quick Run",
    db: Session = Depends(get_db)
):
    """
    Quick-run endpoint: simulates a chromatogram and returns the RunRecord.
    Also stores the run in sandbox_runs table for persistence.
    """
    try:
        from app.core.database import SandboxRun as SandboxRunModel
        import json
        
        sim_req = ChromatogramSimulationRequest(
            instrument_id=instrument_id,
            method_id=method_id,
            sample_name=sample_name,
            compounds=compounds,
        )
        response = chromatography_service.simulate_chromatogram(sim_req)
        run_record = response.run_record
        
        # Store in sandbox_runs table for persistence
        try:
            sandbox_run = SandboxRunModel(
                instrument_id=instrument_id,
                method_id=method_id,
                sample_name=sample_name,
                compound_ids=[c.get('id', 0) for c in (compounds or [])],
                fault_params={},  # No faults for quick run
                time=run_record.time,
                signal=run_record.signal,
                peaks=run_record.peaks,
                baseline=run_record.baseline,
                metrics=run_record.metadata
            )
            
            db.add(sandbox_run)
            db.commit()
            db.refresh(sandbox_run)
            
            # Add the database ID to the run record metadata
            if run_record.metadata is None:
                run_record.metadata = {}
            run_record.metadata["sandbox_run_id"] = sandbox_run.id
            
            logger.info(f"Quick run stored in database with ID: {sandbox_run.id}")
            
        except Exception as db_error:
            logger.warning(f"Failed to store quick run in database: {db_error}")
            # Don't fail the whole request if DB storage fails
            db.rollback()
        
        return run_record
        
    except Exception as e:
        logger.error(f"Quick run failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/import", response_model=ChromatogramImportResponse)
async def import_chromatogram(request: ChromatogramImportRequest):
    """Import chromatogram from file"""
    try:
        logger.info(f"Chromatogram import request received: {request.file_type} file for {request.sample_name}")
        response = chromatography_service.import_chromatogram(request)
        logger.info(f"Import completed: {response.import_metadata['data_points']} data points imported")
        return response
    except Exception as e:
        logger.error(f"Chromatogram import failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/export", response_model=ChromatogramExportResponse)
async def export_chromatogram(request: ChromatogramExportRequest):
    """Export chromatogram data"""
    try:
        logger.info(f"Chromatogram export request received: {request.format} format for run {request.run_id}")
        response = chromatography_service.export_chromatogram(request)
        logger.info(f"Export completed: {response.filename}")
        return response
    except Exception as e:
        logger.error(f"Chromatogram export failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
