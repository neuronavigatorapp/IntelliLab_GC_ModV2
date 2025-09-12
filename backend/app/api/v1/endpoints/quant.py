#!/usr/bin/env python3
"""
Quantitation endpoints for running quantitation on chromatogram runs
"""

from fastapi import APIRouter, HTTPException
import logging

from app.models.schemas import QuantRequest, QuantResult
from app.services.quant_service import quant_service
from app.api.v1.endpoints.runs import runs_storage

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/", response_model=QuantResult)
async def quantitate_run(request: QuantRequest):
    """Quantitate a run using a calibration model"""
    try:
        logger.info(f"Quantitating run {request.run_id} with calibration {request.calibration_id}")
        
        # Get the run record
        if request.run_id not in runs_storage:
            raise HTTPException(status_code=404, detail="Run not found")
        
        run_record = runs_storage[request.run_id]
        
        # Get the calibration model
        if request.calibration_id not in quant_service.calibrations:
            raise HTTPException(status_code=404, detail="Calibration not found")
        
        calibration = quant_service.calibrations[request.calibration_id]
        
        # Perform enhanced quantitation (supports IS mode)
        quant_result = quant_service.quantitate_enhanced(run_record, calibration, request.map)
        
        logger.info(f"Quantitation completed for run {request.run_id}")
        return quant_result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Quantitation failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

