#!/usr/bin/env python3
"""
Reports endpoints for IntelliLab GC API
"""

from fastapi import APIRouter, HTTPException, Depends, Response
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.schemas import ReportGenerationRequest
from app.services.reporting_service import ReportingService, reporting_service
from fastapi import Query

router = APIRouter()

@router.post("/generate")
async def generate_report(
    request: ReportGenerationRequest,
    db: Session = Depends(get_db)
):
    """
    Generate a report in the specified format
    """
    try:
        service = ReportingService()
        
        # Generate the report
        # Placeholder for legacy path; prefer specialized endpoints below
        report_data = service._generate_json_report(request.data_source)  # type: ignore
        
        # Determine filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"intellilab_{request.report_type}_{timestamp}.{request.format}"
        
        # Set response headers for file download
        headers = {
            "Content-Disposition": f"attachment; filename={filename}",
            "Content-Type": _get_content_type(request.format)
        }
        
        return Response(
            content=report_data,
            headers=headers
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")

@router.get("/history")
async def get_report_history(db: Session = Depends(get_db)):
    """
    Get report generation history
    """
    # Placeholder - would come from database
    history = [
        {
            "id": 1,
            "title": "Low Stock Inventory Report",
            "type": "inventory",
            "format": "pdf",
            "generated_at": datetime.now().isoformat(),
            "file_size": "1.2 MB"
        },
        {
            "id": 2,
            "title": "Fleet Summary Report",
            "type": "fleet",
            "format": "xlsx",
            "generated_at": (datetime.now() - timedelta(days=1)).isoformat(),
            "file_size": "856 KB"
        },
        {
            "id": 3,
            "title": "Method Performance Analysis",
            "type": "methods",
            "format": "pdf",
            "generated_at": (datetime.now() - timedelta(days=3)).isoformat(),
            "file_size": "2.1 MB"
        }
    ]
    
    return {"history": history}

@router.get("/templates")
async def get_report_templates(db: Session = Depends(get_db)):
    """
    Get available report templates
    """
    templates = [
        {
            "id": "low-stock",
            "name": "Low Stock Inventory",
            "description": "Items below reorder threshold",
            "type": "inventory",
            "format": "pdf",
            "category": "inventory"
        },
        {
            "id": "fleet-summary",
            "name": "Fleet Summary",
            "description": "Instrument status and maintenance",
            "type": "fleet",
            "format": "xlsx",
            "category": "fleet"
        },
        {
            "id": "method-performance",
            "name": "Method Performance",
            "description": "Recent method analysis results",
            "type": "methods",
            "format": "pdf",
            "category": "methods"
        },
        {
            "id": "cost-analysis",
            "name": "Cost Analysis",
            "description": "Consumable and operational costs",
            "type": "summary",
            "format": "xlsx",
            "category": "summary"
        }
    ]
    
    return {"templates": templates}


# Stage 2: Specialized reporting endpoints

@router.get("/calibration/{calibration_id}")
async def export_calibration_report(
    calibration_id: str,
    format: str = Query("pdf", description="pdf|csv|xlsx|json"),
):
    try:
        data = reporting_service.generate_calibration_report(calibration_id, format)
        return data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/sequence/{sequence_id}")
async def export_sequence_report(
    sequence_id: str,
    format: str = Query("csv", description="csv|json"),
):
    try:
        data = reporting_service.generate_sequence_report(sequence_id, format)
        return data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/qc")
async def export_qc_report(
    limit: int = Query(100, ge=1, le=1000),
    format: str = Query("csv", description="csv|json"),
):
    try:
        data = reporting_service.generate_qc_report(limit, format)
        return data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/audit")
async def export_audit_report(
    format: str = Query("csv", description="csv|json"),
):
    try:
        data = reporting_service.generate_audit_report(format)
        return data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

def _get_content_type(format_type: str) -> str:
    """Get content type for file format"""
    content_types = {
        "pdf": "application/pdf",
        "csv": "text/csv",
        "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }
    return content_types.get(format_type, "application/octet-stream")
