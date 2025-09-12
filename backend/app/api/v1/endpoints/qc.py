#!/usr/bin/env python3
"""
QC API endpoints for auto-flagging, control charts, and QC-aware sequences
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from datetime import datetime

from app.models.schemas import (
    QCTarget, QCRecord, QCTimeSeriesPoint, QCPolicy,
    QCResult, QCRuleHit
)
from app.services.qc_service import qc_service
from app.services.audit_service import audit_service
from app.services.esign_service import esign_service
from app.services.auth_service import get_current_user
from app.models.schemas import User

router = APIRouter()


@router.get("/targets", response_model=List[QCTarget])
async def get_qc_targets(
    methodId: str = Query(..., description="Method ID"),
    instrumentId: Optional[str] = Query(None, description="Instrument ID (optional)")
):
    """Get QC targets for a method and optional instrument"""
    try:
        targets = qc_service.get_qc_targets(methodId, instrumentId)
        return targets
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/targets", response_model=QCTarget)
async def create_or_update_qc_target(target: QCTarget, current_user: User = Depends(get_current_user)):
    """Create or update a QC target"""
    try:
        esign_service.assert_not_signed("qcRecord", target.id or "")
        result = qc_service.upsert_qc_target(target)
        try:
            audit_service.log_action(
                user=current_user.email,
                action="qc_target_upserted",
                entity_type="qcRecord",
                entity_id=result.id,
                details={"target": result.dict()}
            )
        except Exception:
            pass
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/series", response_model=List[QCTimeSeriesPoint])
async def get_qc_series(
    analyte: str = Query(..., description="Analyte name"),
    methodId: str = Query(..., description="Method ID"),
    instrumentId: Optional[str] = Query(None, description="Instrument ID (optional)"),
    days: int = Query(30, ge=1, le=365, description="Number of days to retrieve")
):
    """Get QC time series data for an analyte"""
    try:
        series = qc_service.get_qc_series(analyte, methodId, instrumentId, days)
        return series
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/records", response_model=List[QCRecord])
async def get_qc_records(
    methodId: Optional[str] = Query(None, description="Method ID"),
    instrumentId: Optional[str] = Query(None, description="Instrument ID"),
    fromDate: Optional[datetime] = Query(None, description="Start date"),
    toDate: Optional[datetime] = Query(None, description="End date"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records")
):
    """Get QC records with optional filtering"""
    try:
        records = qc_service.get_qc_records(limit)
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/policy", response_model=QCPolicy)
async def get_qc_policy():
    """Get current QC policy"""
    try:
        policy = qc_service.get_qc_policy()
        return policy
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/policy", response_model=QCPolicy)
async def set_qc_policy(policy: QCPolicy):
    """Set QC policy"""
    try:
        result = qc_service.set_qc_policy(policy)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Additional endpoints for QC management

@router.get("/targets/{target_id}", response_model=QCTarget)
async def get_qc_target(target_id: str):
    """Get a specific QC target by ID"""
    try:
        target = qc_service.targets.get(target_id)
        if not target:
            raise HTTPException(status_code=404, detail="QC target not found")
        return target
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/targets/{target_id}")
async def delete_qc_target(target_id: str, current_user: User = Depends(get_current_user)):
    """Delete a QC target"""
    try:
        esign_service.assert_not_signed("qcRecord", target_id)
        success = target_id in qc_service.targets
        if success:
            del qc_service.targets[target_id]
            try:
                audit_service.log_action(
                    user=current_user.email,
                    action="qc_target_deleted",
                    entity_type="qcRecord",
                    entity_id=target_id,
                    details={"ok": True}
                )
            except Exception:
                pass
            return {"message": "QC target deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="QC target not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_qc_status():
    """Get QC system status and statistics"""
    try:
        total_targets = len(qc_service.targets)
        total_records = len(qc_service.records)
        
        # Count recent failures
        recent_failures = sum(1 for record in qc_service.records.values() 
                             if record.overallStatus == "FAIL")
        
        status = {
            "total_targets": total_targets,
            "total_records": total_records,
            "recent_failures": recent_failures,
            "policy": qc_service.get_qc_policy(),
            "system_status": "operational"
        }
        
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/override/{record_id}")
async def override_qc_record(record_id: str, payload: dict, current_user: User = Depends(get_current_user)):
    """Manual override for a QC record with a reason. Logs an audit entry."""
    try:
        reason = payload.get('reason') or 'override'
        record = qc_service.records.get(record_id)
        if not record:
            raise HTTPException(status_code=404, detail='QC record not found')
        # Apply an override flag to the record
        record.notes = (record.notes or '') + f"\nOVERRIDE: {reason} by {current_user.email}"
        qc_service.records[record_id] = record
        # Audit
        audit_service.log_action(
            user=current_user.email,
            action='qc_override',
            entity_type='qcRecord',
            entity_id=record_id,
            details={'reason': reason}
        )
        return {'ok': True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))