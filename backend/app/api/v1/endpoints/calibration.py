#!/usr/bin/env python3
"""
Enhanced calibration endpoints with versioning, IS support, and outlier handling
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
import logging

from app.models.schemas import (
    CalibrationModel, CalibrationFitRequest, CalibrationListResponse,
    CalibrationActivateRequest, CalibrationVersion
)
from app.services.quant_service import quant_service
from app.services.audit_service import audit_service
from app.services.esign_service import esign_service
from app.services.auth_service import get_current_user
from app.models.schemas import User
from app.services.reporting_service import reporting_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/fit", response_model=CalibrationModel)
async def fit_calibration(request: CalibrationFitRequest, current_user: User = Depends(get_current_user)):
    """Fit a calibration curve with enhanced features (IS mode, outlier detection)"""
    try:
        logger.info(f"Fitting calibration for {request.target_name} with {len(request.levels)} levels "
                   f"(mode: {request.mode.value}, outlier_policy: {request.outlier_policy.value})")
        
        calibration = quant_service.fit_calibration_enhanced(request)
        try:
            audit_service.log_action(
                user=current_user.email,
                action="calibration_fitted",
                entity_type="calibration",
                entity_id=str(calibration.id) if calibration.id else None,
                details={"request": request.model_dump(), "result": calibration.model_dump()}
            )
        except Exception:
            pass
        
        logger.info(f"Calibration fitted successfully: {calibration.id} "
                   f"(R²: {calibration.r2:.4f}, excluded points: {len(calibration.excluded_points or [])})")
        return calibration
        
    except Exception as e:
        logger.error(f"Enhanced calibration fitting failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/versions", response_model=List[CalibrationVersion])
async def list_calibration_versions(
    method_id: Optional[int] = Query(None, description="Filter by method ID"),
    instrument_id: Optional[int] = Query(None, description="Filter by instrument ID"),
    target_name: Optional[str] = Query(None, description="Filter by target name")
):
    """List calibration versions with optional filtering"""
    try:
        versions = quant_service.list_calibration_versions(method_id, instrument_id, target_name)
        
        logger.info(f"Found {len(versions)} calibration versions")
        return versions
        
    except Exception as e:
        logger.error(f"Failed to list calibration versions: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/activate", response_model=dict)
async def activate_calibration(request: CalibrationActivateRequest, current_user: User = Depends(get_current_user)):
    """Activate a specific calibration version"""
    try:
        success = quant_service.activate_calibration(request.calibration_id)
        try:
            audit_service.log_action(
                user=current_user.email,
                action="calibration_activated",
                entity_type="calibration",
                entity_id=str(request.calibration_id),
                details={"ok": success}
            )
        except Exception:
            pass
        
        logger.info(f"Activated calibration {request.calibration_id}")
        return {"ok": success, "calibration_id": request.calibration_id}
        
    except Exception as e:
        logger.error(f"Failed to activate calibration: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/active", response_model=Optional[CalibrationModel])
async def get_active_calibration(
    method_id: int = Query(..., description="Method ID"),
    instrument_id: Optional[int] = Query(None, description="Instrument ID")
):
    """Get the active calibration for a method/instrument"""
    try:
        calibration = quant_service.get_active_calibration(method_id, instrument_id)
        
        if calibration:
            logger.info(f"Found active calibration {calibration.id} for method {method_id}")
        else:
            logger.info(f"No active calibration found for method {method_id}")
        
        return calibration
        
    except Exception as e:
        logger.error(f"Failed to get active calibration: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{calibration_id}", response_model=CalibrationModel)
async def get_calibration(calibration_id: str):
    """Get a specific calibration model"""
    try:
        if calibration_id not in quant_service.calibrations:
            raise HTTPException(status_code=404, detail="Calibration not found")
        
        calibration = quant_service.calibrations[calibration_id]
        logger.info(f"Retrieved calibration {calibration_id}")
        return calibration
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get calibration: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{calibration_id}")
async def delete_calibration(calibration_id: str, current_user: User = Depends(get_current_user)):
    """Delete a calibration model"""
    try:
        # Block deletion if signed
        esign_service.assert_not_signed("calibration", calibration_id)
        success = quant_service.delete_calibration(calibration_id)
        try:
            audit_service.log_action(
                user=current_user.email,
                action="calibration_deleted",
                entity_type="calibration",
                entity_id=str(calibration_id),
                details={"ok": success}
            )
        except Exception:
            pass
        
        logger.info(f"Deleted calibration {calibration_id}")
        return {"ok": success}
        
    except Exception as e:
        logger.error(f"Failed to delete calibration: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=CalibrationListResponse)
async def list_calibrations(
    method_id: Optional[int] = Query(None, description="Filter by method ID"),
    instrument_id: Optional[int] = Query(None, description="Filter by instrument ID"),
    target_name: Optional[str] = Query(None, description="Filter by target name")
):
    """List calibrations with optional filtering"""
    try:
        calibrations = quant_service.list_calibrations(method_id, instrument_id, target_name)
        
        # Find active calibration
        active_calibration_id = None
        if method_id:
            active_cal = quant_service.get_active_calibration(method_id, instrument_id)
            if active_cal:
                active_calibration_id = active_cal.id
        
        logger.info(f"Found {len(calibrations)} calibrations (active: {active_calibration_id})")
        
        return CalibrationListResponse(
            calibrations=calibrations,
            total=len(calibrations),
            active_calibration_id=active_calibration_id
        )
        
    except Exception as e:
        logger.error(f"Failed to list calibrations: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{calibration_id}/residuals", response_model=dict)
async def get_calibration_residuals(calibration_id: str):
    """Get residuals data for a calibration (for plotting)"""
    try:
        if calibration_id not in quant_service.calibrations:
            raise HTTPException(status_code=404, detail="Calibration not found")
        
        calibration = quant_service.calibrations[calibration_id]
        
        # Prepare residuals plot data
        plot_data = {
            "concentrations": [level.amount for level in calibration.levels if level.included],
            "residuals": calibration.residuals or [],
            "excluded_points": calibration.excluded_points or [],
            "r2": calibration.r2,
            "model_type": calibration.model_type,
            "mode": calibration.mode.value,
            "target_name": calibration.target_name
        }
        
        logger.info(f"Retrieved residuals data for calibration {calibration_id}")
        return plot_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get calibration residuals: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{calibration_id}/validation", response_model=dict)
async def validate_calibration(calibration_id: str):
    """Validate a calibration model (check quality metrics)"""
    try:
        if calibration_id not in quant_service.calibrations:
            raise HTTPException(status_code=404, detail="Calibration not found")
        
        calibration = quant_service.calibrations[calibration_id]
        
        # Perform validation checks
        validation_results = {
            "calibration_id": calibration_id,
            "r2": calibration.r2,
            "r2_acceptable": (calibration.r2 or 0) >= 0.99,  # R² ≥ 0.99
            "point_count": len([l for l in calibration.levels if l.included]),
            "point_count_acceptable": len([l for l in calibration.levels if l.included]) >= 5,
            "excluded_points": len(calibration.excluded_points or []),
            "lod": calibration.lod,
            "loq": calibration.loq,
            "lod_method": calibration.lod_method,
            "slope": calibration.slope,
            "intercept": calibration.intercept,
            "mode": calibration.mode.value,
            "outlier_policy": calibration.outlier_policy.value,
            "warnings": [],
            "errors": []
        }
        
        # Add validation warnings/errors
        if (calibration.r2 or 0) < 0.99:
            validation_results["warnings"].append(f"R² ({calibration.r2:.4f}) is below 0.99")
        
        if len([l for l in calibration.levels if l.included]) < 5:
            validation_results["warnings"].append("Less than 5 calibration points")
        
        if len(calibration.excluded_points or []) > 0:
            validation_results["warnings"].append(f"{len(calibration.excluded_points)} points excluded as outliers")
        
        if not calibration.lod or not calibration.loq:
            validation_results["warnings"].append("LOD/LOQ not calculated")
        
        # Overall validation status
        validation_results["overall_status"] = "pass" if not validation_results["errors"] else "fail"
        if validation_results["warnings"]:
            validation_results["overall_status"] = "warning"
        
        logger.info(f"Validated calibration {calibration_id}: {validation_results['overall_status']}")
        return validation_results
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to validate calibration: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{calibration_id}/export", response_model=dict)
async def export_calibration(
    calibration_id: str,
    format: str = Query("csv", description="Export format: csv, pdf, xlsx, json")
):
    """Export calibration report in specified format"""
    try:
        report_data = reporting_service.generate_calibration_report(calibration_id, format)
        
        logger.info(f"Generated {format.upper()} report for calibration {calibration_id}")
        return report_data
        
    except Exception as e:
        logger.error(f"Failed to export calibration: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))