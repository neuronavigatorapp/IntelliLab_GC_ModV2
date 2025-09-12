#!/usr/bin/env python3
"""
Run history and reporting endpoints for filtering, searching, and exporting runs.
"""

import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional

from app.services.run_history_service import run_history_service
from app.core.database import get_db


router = APIRouter()


@router.get("/search")
async def search_runs(
    search_query: Optional[str] = Query(None, description="Search in sample names"),
    instrument_ids: Optional[str] = Query(None, description="Comma-separated instrument IDs"),
    method_ids: Optional[str] = Query(None, description="Comma-separated method IDs"),
    date_from: Optional[str] = Query(None, description="Start date (ISO format)"),
    date_to: Optional[str] = Query(None, description="End date (ISO format)"),
    has_peaks: Optional[bool] = Query(None, description="Filter runs with/without peaks"),
    min_peaks: Optional[int] = Query(None, ge=0, description="Minimum number of peaks"),
    max_peaks: Optional[int] = Query(None, ge=0, description="Maximum number of peaks"),
    sample_name_filter: Optional[str] = Query(None, description="Filter by sample name"),
    limit: int = Query(100, ge=1, le=1000, description="Number of results to return"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    db: Session = Depends(get_db)
):
    """
    Search and filter runs with various criteria.
    Supports pagination and multiple filter types.
    """
    try:
        # Parse instrument and method IDs
        instrument_id_list = None
        if instrument_ids:
            try:
                instrument_id_list = [int(id.strip()) for id in instrument_ids.split(",")]
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid instrument IDs format")
        
        method_id_list = None
        if method_ids:
            try:
                method_id_list = [int(id.strip()) for id in method_ids.split(",")]
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid method IDs format")
        
        # Parse dates
        date_from_parsed = None
        if date_from:
            try:
                date_from_parsed = datetime.datetime.fromisoformat(date_from.replace('Z', '+00:00'))
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date_from format. Use ISO format.")
        
        date_to_parsed = None
        if date_to:
            try:
                date_to_parsed = datetime.datetime.fromisoformat(date_to.replace('Z', '+00:00'))
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date_to format. Use ISO format.")
        
        # Perform search
        runs, total_count = run_history_service.search_runs(
            search_query=search_query,
            instrument_ids=instrument_id_list,
            method_ids=method_id_list,
            date_from=date_from_parsed,
            date_to=date_to_parsed,
            has_peaks=has_peaks,
            min_peaks=min_peaks,
            max_peaks=max_peaks,
            sample_name_filter=sample_name_filter,
            limit=limit,
            offset=offset
        )
        
        return {
            "runs": runs,
            "total_count": total_count,
            "limit": limit,
            "offset": offset,
            "has_more": offset + limit < total_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.get("/{run_id}/summary")
async def get_run_summary(run_id: int, db: Session = Depends(get_db)):
    """
    Get detailed summary for a specific run including peaks analysis,
    signal analysis, and any available diagnostics.
    """
    try:
        summary = run_history_service.get_run_summary(run_id)
        if not summary:
            raise HTTPException(status_code=404, detail="Run not found")
        
        return summary
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get run summary: {str(e)}")


@router.post("/export")
async def export_runs(
    request: dict,  # Contains run_ids, format, and options
    db: Session = Depends(get_db)
):
    """
    Export selected runs to specified format (PDF, Excel, CSV).
    Request body should contain:
    - run_ids: List of run IDs to export
    - format: "pdf", "excel", or "csv"
    - include_chromatograms: Boolean (optional)
    """
    try:
        run_ids = request.get("run_ids", [])
        export_format = request.get("format", "excel")
        include_chromatograms = request.get("include_chromatograms", False)
        
        if not run_ids:
            raise HTTPException(status_code=400, detail="No run IDs provided")
        
        if export_format not in ["pdf", "excel", "csv"]:
            raise HTTPException(status_code=400, detail="Invalid export format. Use 'pdf', 'excel', or 'csv'")
        
        # Limit number of runs to prevent large exports
        if len(run_ids) > 1000:
            raise HTTPException(status_code=400, detail="Too many runs selected. Maximum 1000 runs per export.")
        
        export_result = run_history_service.export_runs(
            run_ids=run_ids,
            export_format=export_format,
            include_chromatograms=include_chromatograms
        )
        
        return {
            "success": True,
            "file_content": export_result["content"],
            "filename": export_result["filename"],
            "mime_type": export_result["mime_type"],
            "file_size": export_result["size"],
            "export_format": export_format,
            "runs_exported": len(run_ids),
            "timestamp": datetime.datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


@router.get("/statistics")
async def get_run_statistics(
    date_from: Optional[str] = Query(None, description="Start date for statistics (ISO format)"),
    date_to: Optional[str] = Query(None, description="End date for statistics (ISO format)"),
    db: Session = Depends(get_db)
):
    """
    Get run statistics for a date range including total runs,
    peak counts, instrument usage, and daily trends.
    """
    try:
        # Parse dates
        date_from_parsed = None
        if date_from:
            try:
                date_from_parsed = datetime.datetime.fromisoformat(date_from.replace('Z', '+00:00'))
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date_from format. Use ISO format.")
        
        date_to_parsed = None
        if date_to:
            try:
                date_to_parsed = datetime.datetime.fromisoformat(date_to.replace('Z', '+00:00'))
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date_to format. Use ISO format.")
        
        statistics = run_history_service.get_run_statistics(
            date_from=date_from_parsed,
            date_to=date_to_parsed
        )
        
        return statistics
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get statistics: {str(e)}")


@router.get("/filters/options")
async def get_filter_options(db: Session = Depends(get_db)):
    """
    Get available filter options for the search interface.
    Returns lists of instruments, methods, and other filter values.
    """
    try:
        from app.core.database import Instrument, Method
        
        # Get available instruments
        instruments = db.query(Instrument).all()
        instrument_options = [
            {"id": inst.id, "name": inst.name, "model": inst.model}
            for inst in instruments
        ]
        
        # Get available methods
        methods = db.query(Method).all()
        method_options = [
            {"id": method.id, "name": method.name, "type": method.method_type}
            for method in methods
        ]
        
        # Get method types
        method_types = list(set(method.method_type for method in methods if method.method_type))
        
        return {
            "instruments": instrument_options,
            "methods": method_options,
            "method_types": method_types,
            "export_formats": ["pdf", "excel", "csv"],
            "date_range_presets": [
                {"label": "Last 7 days", "days": 7},
                {"label": "Last 30 days", "days": 30},
                {"label": "Last 90 days", "days": 90},
                {"label": "Last year", "days": 365}
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get filter options: {str(e)}")


@router.delete("/bulk")
async def delete_runs(
    request: dict,  # Contains run_ids to delete
    db: Session = Depends(get_db)
):
    """
    Delete multiple runs by IDs.
    Use with caution - this is permanent deletion.
    """
    try:
        run_ids = request.get("run_ids", [])
        
        if not run_ids:
            raise HTTPException(status_code=400, detail="No run IDs provided")
        
        if len(run_ids) > 100:
            raise HTTPException(status_code=400, detail="Too many runs selected. Maximum 100 runs per deletion.")
        
        from app.core.database import SandboxRun
        
        # Delete runs
        deleted_count = db.query(SandboxRun).filter(SandboxRun.id.in_(run_ids)).delete(synchronize_session=False)
        db.commit()
        
        return {
            "success": True,
            "deleted_count": deleted_count,
            "requested_count": len(run_ids),
            "timestamp": datetime.datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Deletion failed: {str(e)}")


@router.get("/{run_id}/chromatogram")
async def get_run_chromatogram(run_id: int, db: Session = Depends(get_db)):
    """
    Get chromatogram data for a specific run for visualization.
    """
    try:
        from app.core.database import SandboxRun
        
        run = db.query(SandboxRun).filter(SandboxRun.id == run_id).first()
        if not run:
            raise HTTPException(status_code=404, detail="Run not found")
        
        return {
            "run_id": run.id,
            "sample_name": run.sample_name,
            "time": run.time,
            "signal": run.signal,
            "peaks": run.peaks,
            "baseline": run.baseline,
            "metrics": run.metrics
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get chromatogram: {str(e)}")


@router.post("/{run_id}/favorite")
async def toggle_run_favorite(run_id: int, db: Session = Depends(get_db)):
    """
    Toggle favorite status for a run (placeholder for future implementation).
    """
    try:
        from app.core.database import SandboxRun
        
        run = db.query(SandboxRun).filter(SandboxRun.id == run_id).first()
        if not run:
            raise HTTPException(status_code=404, detail="Run not found")
        
        # For now, just return success (would need to add favorite field to schema)
        return {
            "success": True,
            "run_id": run_id,
            "message": "Favorite toggle successful (feature pending schema update)"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to toggle favorite: {str(e)}")
