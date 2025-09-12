#!/usr/bin/env python3
"""
Audit endpoints for IntelliLab GC API
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.models.schemas import AuditLogEntry, AuditLogFilter
from app.services.audit_service import audit_service
from app.services.auth_service import get_current_user
from app.models.schemas import User

router = APIRouter()


@router.get("/", response_model=List[AuditLogEntry])
async def get_audit_log(
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    user: Optional[str] = Query(None, description="Filter by user"),
    action: Optional[str] = Query(None, description="Filter by action"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
    entity_id: Optional[int] = Query(None, description="Filter by entity ID"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of entries")
    ,
    current_user: User = Depends(get_current_user)
):
    """Get audit log entries with optional filters"""
    try:
        # Parse dates if provided
        start_dt = None
        end_dt = None
        
        if start_date:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        if end_date:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        
        filters = AuditLogFilter(
            start_date=start_dt,
            end_date=end_dt,
            user=user,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            limit=limit
        )
        
        entries = audit_service.get_audit_log(filters)
        return entries
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{entry_id}", response_model=AuditLogEntry)
async def get_audit_entry(entry_id: int, current_user: User = Depends(get_current_user)):
    """Get a specific audit log entry"""
    entry = audit_service.get_audit_entry(entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Audit log entry not found")
    return entry


@router.get("/entity/{entity_type}/{entity_id}", response_model=List[AuditLogEntry])
async def get_entity_audit_trail(
    entity_type: str,
    entity_id: int,
    limit: int = Query(50, ge=1, le=500, description="Maximum number of entries"),
    current_user: User = Depends(get_current_user)
):
    """Get audit trail for a specific entity"""
    entries = audit_service.get_entity_audit_trail(entity_type, entity_id, limit)
    return entries


@router.get("/user/{user}", response_model=List[AuditLogEntry])
async def get_user_audit_trail(
    user: str,
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of entries"),
    current_user: User = Depends(get_current_user)
):
    """Get audit trail for a specific user"""
    try:
        # Parse dates if provided
        start_dt = None
        end_dt = None
        
        if start_date:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        if end_date:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        
        entries = audit_service.get_user_audit_trail(user, start_dt, end_dt, limit)
        return entries
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/summary/", response_model=Dict[str, Any])
async def get_audit_summary(
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)")
    ,
    current_user: User = Depends(get_current_user)
):
    """Get audit log summary statistics"""
    try:
        # Parse dates if provided
        start_dt = None
        end_dt = None
        
        if start_date:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        if end_date:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        
        summary = audit_service.get_audit_summary(start_dt, end_dt)
        return summary
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/export/")
async def export_audit_log(
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    format: str = Query("json", description="Export format (json, csv)"),
    current_user: User = Depends(get_current_user)
):
    """Export audit log in specified format"""
    try:
        # Parse dates if provided
        start_dt = None
        end_dt = None
        
        if start_date:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        if end_date:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        
        if format.lower() not in ["json", "csv"]:
            raise HTTPException(status_code=400, detail="Unsupported format. Use 'json' or 'csv'")
        
        exported_data = audit_service.export_audit_log(start_dt, end_dt, format)
        
        return {
            "format": format,
            "data": exported_data,
            "export_date": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/actions/", response_model=List[str])
async def get_audit_actions(current_user: User = Depends(get_current_user)):
    """Get list of available audit actions"""
    # This would query the database for unique actions
    # For demo purposes, return sample actions
    return [
        "qc_record_created",
        "qc_record_updated",
        "qc_alert_acknowledged",
        "method_created",
        "method_updated",
        "method_deleted",
        "instrument_created",
        "instrument_updated",
        "user_login",
        "user_logout",
        "data_exported",
        "data_imported"
    ]


@router.get("/entity-types/", response_model=List[str])
async def get_audit_entity_types(current_user: User = Depends(get_current_user)):
    """Get list of available audit entity types"""
    # This would query the database for unique entity types
    # For demo purposes, return sample entity types
    return [
        "qc_record",
        "qc_alert",
        "method",
        "instrument",
        "user",
        "sample",
        "report",
        "template"
    ]


@router.get("/users/", response_model=List[str])
async def get_audit_users(current_user: User = Depends(get_current_user)):
    """Get list of users with audit entries"""
    # This would query the database for unique users
    # For demo purposes, return sample users
    return [
        "analyst1",
        "analyst2",
        "supervisor1",
        "admin",
        "system"
    ]
