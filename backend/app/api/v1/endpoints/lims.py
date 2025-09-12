#!/usr/bin/env python3
"""
LIMS endpoints for IntelliLab GC API
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.models.schemas import (
    LIMSConfig, LIMSConfigCreate, LIMSConfigUpdate,
    LIMSExportRequest, LIMSImportRequest, LIMSConnectionResult
)
from app.services.lims_service import lims_service
from app.services.audit_service import audit_service

router = APIRouter()


@router.post("/configs", response_model=LIMSConfig)
async def create_lims_config(config: LIMSConfigCreate):
    """Create a new LIMS configuration"""
    try:
        lims_config = lims_service.create_lims_config(config)
        
        # Log audit action
        audit_service.log_action(
            user="system",  # Would be actual user in real implementation
            action="lims_config_created",
            entity_type="lims_config",
            entity_id=lims_config.id,
            details={"connection_name": config.connection_name, "base_url": config.base_url}
        )
        
        return lims_config
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/configs", response_model=List[LIMSConfig])
async def get_lims_configs():
    """Get all LIMS configurations"""
    configs = lims_service.get_all_lims_configs()
    return configs


@router.get("/configs/{config_id}", response_model=LIMSConfig)
async def get_lims_config(config_id: int):
    """Get a LIMS configuration by ID"""
    config = lims_service.get_lims_config(config_id)
    if not config:
        raise HTTPException(status_code=404, detail="LIMS configuration not found")
    return config


@router.put("/configs/{config_id}", response_model=LIMSConfig)
async def update_lims_config(config_id: int, update: LIMSConfigUpdate):
    """Update a LIMS configuration"""
    config = lims_service.update_lims_config(config_id, update)
    if not config:
        raise HTTPException(status_code=404, detail="LIMS configuration not found")
    
    # Log audit action
    audit_service.log_action(
        user="system",  # Would be actual user in real implementation
        action="lims_config_updated",
        entity_type="lims_config",
        entity_id=config_id,
        details=update.dict(exclude_unset=True)
    )
    
    return config


@router.delete("/configs/{config_id}")
async def delete_lims_config(config_id: int):
    """Delete a LIMS configuration"""
    success = lims_service.delete_lims_config(config_id)
    if not success:
        raise HTTPException(status_code=404, detail="LIMS configuration not found")
    
    # Log audit action
    audit_service.log_action(
        user="system",  # Would be actual user in real implementation
        action="lims_config_deleted",
        entity_type="lims_config",
        entity_id=config_id,
        details={"deleted_at": datetime.now().isoformat()}
    )
    
    return {"message": "LIMS configuration deleted successfully"}


@router.post("/configs/{config_id}/test", response_model=LIMSConnectionResult)
async def test_lims_connection(config_id: int):
    """Test connection to LIMS"""
    try:
        result = lims_service.test_lims_connection(config_id)
        
        # Log audit action
        audit_service.log_action(
            user="system",  # Would be actual user in real implementation
            action="lims_connection_tested",
            entity_type="lims_config",
            entity_id=config_id,
            details={"success": result.success, "message": result.message}
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/export", response_model=Dict[str, Any])
async def export_data_to_lims(request: LIMSExportRequest):
    """Export data to LIMS"""
    try:
        result = lims_service.export_data_to_lims(request)
        
        # Log audit action
        audit_service.log_action(
            user="system",  # Would be actual user in real implementation
            action="data_exported_to_lims",
            entity_type="lims_export",
            details={
                "config_id": request.config_id,
                "data_type": request.data_type,
                "format": request.format,
                "success": result.get("success", False),
                "records_exported": result.get("records_exported", 0)
            }
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/import", response_model=Dict[str, Any])
async def import_data_from_lims(
    config_id: int,
    data_type: str,
    format: str,
    validate_only: bool = False,
    file: UploadFile = File(...)
):
    """Import data from LIMS"""
    try:
        # Save uploaded file temporarily
        import tempfile
        import os
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{format}") as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        try:
            request = LIMSImportRequest(
                config_id=config_id,
                data_type=data_type,
                file_path=tmp_file_path,
                format=format,
                validate_only=validate_only
            )
            
            result = lims_service.import_data_from_lims(request)
            
            # Log audit action
            audit_service.log_action(
                user="system",  # Would be actual user in real implementation
                action="data_imported_from_lims",
                entity_type="lims_import",
                details={
                    "config_id": config_id,
                    "data_type": data_type,
                    "format": format,
                    "validate_only": validate_only,
                    "success": result.get("success", False),
                    "records_imported": result.get("records_imported", 0)
                }
            )
            
            return result
            
        finally:
            # Clean up temporary file
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)
                
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/supported-formats", response_model=List[str])
async def get_supported_formats():
    """Get list of supported data formats"""
    return ["json", "xml", "csv"]


@router.get("/supported-data-types", response_model=List[str])
async def get_supported_data_types():
    """Get list of supported data types for export/import"""
    return ["methods", "runs", "qc", "audit"]


@router.get("/configs/{config_id}/status")
async def get_lims_config_status(config_id: int):
    """Get status information for a LIMS configuration"""
    config = lims_service.get_lims_config(config_id)
    if not config:
        raise HTTPException(status_code=404, detail="LIMS configuration not found")
    
    # Test connection
    connection_result = lims_service.test_lims_connection(config_id)
    
    return {
        "config_id": config_id,
        "connection_name": config.connection_name,
        "base_url": config.base_url,
        "format": config.format,
        "is_active": config.is_active,
        "connection_status": {
            "success": connection_result.success,
            "message": connection_result.message,
            "response_time": connection_result.response_time
        },
        "last_modified": config.modified_date
    }


@router.get("/health")
async def get_lims_health():
    """Get overall LIMS connectivity health"""
    configs = lims_service.get_all_lims_configs()
    
    health_status = {
        "total_configs": len(configs),
        "active_configs": len([c for c in configs if c.is_active]),
        "connection_tests": []
    }
    
    for config in configs:
        if config.is_active:
            result = lims_service.test_lims_connection(config.id)
            health_status["connection_tests"].append({
                "config_id": config.id,
                "connection_name": config.connection_name,
                "success": result.success,
                "response_time": result.response_time
            })
    
    return health_status
