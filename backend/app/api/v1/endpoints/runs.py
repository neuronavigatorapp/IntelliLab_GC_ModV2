#!/usr/bin/env python3
"""
Runs endpoints for managing chromatogram run records
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

from app.core.database import get_db, SandboxRun as SandboxRunModel
from app.models.schemas import (
    RunRecord, RunRecordCreate, RunRecordUpdate
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/", response_model=RunRecord)
async def create_run(run_data: RunRecordCreate, db: Session = Depends(get_db)):
    """Create a new run record in database"""
    try:
        logger.info(f"Creating run record for sample: {run_data.sample_name}")
        
        # Create database record
        db_run = SandboxRunModel(
            instrument_id=run_data.instrument_id or 1,
            method_id=run_data.method_id or 1,
            sample_name=run_data.sample_name,
            compound_ids=[],
            fault_params={},
            time=run_data.time,
            signal=run_data.signal,
            peaks=run_data.peaks,
            baseline=run_data.baseline,
            metrics=run_data.metadata or {}
        )
        
        db.add(db_run)
        db.commit()
        db.refresh(db_run)
        
        # Convert to RunRecord format for response
        run_record = RunRecord(
            id=db_run.id,
            instrument_id=db_run.instrument_id,
            method_id=db_run.method_id,
            sample_name=db_run.sample_name,
            time=db_run.time,
            signal=db_run.signal,
            peaks=db_run.peaks,
            baseline=db_run.baseline,
            notes=run_data.notes,
            metadata=db_run.metrics
        )
        
        logger.info(f"Run record created with ID: {run_record.id}")
        return run_record
        
    except Exception as e:
        logger.error(f"Failed to create run record: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{run_id}", response_model=RunRecord)
async def get_run(run_id: int, db: Session = Depends(get_db)):
    """Get a specific run record"""
    try:
        logger.info(f"Retrieving run record: {run_id}")
        
        db_run = db.query(SandboxRunModel).filter(SandboxRunModel.id == run_id).first()
        if not db_run:
            raise HTTPException(status_code=404, detail="Run record not found")
        
        # Convert to RunRecord format
        run_record = RunRecord(
            id=db_run.id,
            instrument_id=db_run.instrument_id,
            method_id=db_run.method_id,
            sample_name=db_run.sample_name,
            time=db_run.time,
            signal=db_run.signal,
            peaks=db_run.peaks,
            baseline=db_run.baseline,
            notes="",  # Notes not stored in SandboxRun model
            metadata=db_run.metrics
        )
        
        return run_record
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve run record {run_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[RunRecord])
async def list_runs(
    method_id: Optional[int] = Query(None, description="Filter by method ID"),
    instrument_id: Optional[int] = Query(None, description="Filter by instrument ID"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of runs to return"),
    db: Session = Depends(get_db)
):
    """List run records with optional filtering"""
    try:
        logger.info(f"Listing runs with filters: method_id={method_id}, instrument_id={instrument_id}")
        
        query = db.query(SandboxRunModel)
        
        # Apply filters
        if method_id is not None:
            query = query.filter(SandboxRunModel.method_id == method_id)
        
        if instrument_id is not None:
            query = query.filter(SandboxRunModel.instrument_id == instrument_id)
        
        # Sort by created_date (newest first) and apply limit
        db_runs = query.order_by(SandboxRunModel.created_date.desc()).limit(limit).all()
        
        # Convert to RunRecord format
        runs = []
        for db_run in db_runs:
            run_record = RunRecord(
                id=db_run.id,
                instrument_id=db_run.instrument_id,
                method_id=db_run.method_id,
                sample_name=db_run.sample_name,
                time=db_run.time,
                signal=db_run.signal,
                peaks=db_run.peaks,
                baseline=db_run.baseline,
                notes="",
                metadata=db_run.metrics
            )
            runs.append(run_record)
        
        logger.info(f"Returning {len(runs)} run records")
        return runs
        
    except Exception as e:
        logger.error(f"Failed to list runs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{run_id}", response_model=RunRecord)
async def update_run(run_id: int, run_update: RunRecordUpdate, db: Session = Depends(get_db)):
    """Update a run record"""
    try:
        logger.info(f"Updating run record: {run_id}")
        
        db_run = db.query(SandboxRunModel).filter(SandboxRunModel.id == run_id).first()
        if not db_run:
            raise HTTPException(status_code=404, detail="Run record not found")
        
        # Update fields
        if run_update.sample_name is not None:
            db_run.sample_name = run_update.sample_name
        
        if run_update.peaks is not None:
            db_run.peaks = run_update.peaks
        
        if run_update.baseline is not None:
            db_run.baseline = run_update.baseline
        
        if run_update.metadata is not None:
            # Update metrics with new metadata
            current_metrics = db_run.metrics or {}
            current_metrics.update(run_update.metadata)
            db_run.metrics = current_metrics
        
        db.commit()
        db.refresh(db_run)
        
        # Convert to RunRecord format
        run_record = RunRecord(
            id=db_run.id,
            instrument_id=db_run.instrument_id,
            method_id=db_run.method_id,
            sample_name=db_run.sample_name,
            time=db_run.time,
            signal=db_run.signal,
            peaks=db_run.peaks,
            baseline=db_run.baseline,
            notes=run_update.notes or "",
            metadata=db_run.metrics
        )
        
        logger.info(f"Run record {run_id} updated successfully")
        return run_record
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update run record {run_id}: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{run_id}")
async def delete_run(run_id: int, db: Session = Depends(get_db)):
    """Delete a run record"""
    try:
        logger.info(f"Deleting run record: {run_id}")
        
        db_run = db.query(SandboxRunModel).filter(SandboxRunModel.id == run_id).first()
        if not db_run:
            raise HTTPException(status_code=404, detail="Run record not found")
        
        db.delete(db_run)
        db.commit()
        
        logger.info(f"Run record {run_id} deleted successfully")
        return {"message": "Run record deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete run record {run_id}: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
