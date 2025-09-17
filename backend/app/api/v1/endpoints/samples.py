#!/usr/bin/env python3
"""
Sample Tracking API endpoints for IntelliLab GC
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.models.schemas import (
    Sample,
    SampleCreate,
    SampleUpdate,
    SampleStatus,
    SamplePriority,
    User
)
from app.services.sample_tracking_service import sample_tracking_service
from app.services.auth_service import get_current_user

router = APIRouter()


@router.post("/", response_model=Sample, status_code=status.HTTP_201_CREATED)
async def create_sample(
    sample_data: SampleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new sample"""
    try:
        sample = sample_tracking_service.create_sample(
            db=db,
            sample_data=sample_data.model_dump(),
            created_by=current_user.id
        )
        return sample
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create sample: {str(e)}"
        )


@router.get("/", response_model=List[Sample])
async def get_samples(
    status: Optional[SampleStatus] = Query(None, description="Filter by status"),
    priority: Optional[SamplePriority] = Query(None, description="Filter by priority"),
    matrix: Optional[str] = Query(None, description="Filter by matrix type"),
    analyst_id: Optional[int] = Query(None, description="Filter by analyst"),
    date_from: Optional[datetime] = Query(None, description="Filter from date"),
    date_to: Optional[datetime] = Query(None, description="Filter to date"),
    search: Optional[str] = Query(None, description="Search in sample ID, name, and notes"),
    skip: int = Query(0, ge=0, description="Number of samples to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of samples to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get samples with optional filtering"""
    try:
        samples = sample_tracking_service.get_samples(
            db=db,
            status=status,
            priority=priority,
            matrix=matrix,
            analyst_id=analyst_id,
            date_from=date_from,
            date_to=date_to,
            search=search,
            skip=skip,
            limit=limit
        )
        return samples
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve samples: {str(e)}"
        )


@router.get("/matrix-types", response_model=List[str])
async def get_matrix_types():
    """Get available matrix types"""
    return sample_tracking_service.get_matrix_types()


@router.get("/status-workflow", response_model=Dict[str, List[str]])
async def get_status_workflow():
    """Get valid status transitions"""
    return sample_tracking_service.get_status_workflow()


@router.get("/statistics", response_model=Dict[str, Any])
async def get_laboratory_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get laboratory-wide sample statistics"""
    try:
        stats = sample_tracking_service.get_laboratory_statistics(db)
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve statistics: {str(e)}"
        )


@router.get("/analyst/{analyst_id}/workload", response_model=Dict[str, int])
async def get_analyst_workload(
    analyst_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current workload for an analyst"""
    try:
        workload = sample_tracking_service.get_analyst_workload(db, analyst_id)
        return workload
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve workload: {str(e)}"
        )


@router.get("/overdue", response_model=List[Sample])
async def get_overdue_samples(
    days_overdue: int = Query(7, ge=1, description="Number of days to consider overdue"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get samples that are overdue for processing"""
    try:
        samples = sample_tracking_service.get_overdue_samples(db, days_overdue)
        return samples
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve overdue samples: {str(e)}"
        )


@router.get("/{sample_id}", response_model=Sample)
async def get_sample(
    sample_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific sample by ID"""
    sample = sample_tracking_service.get_sample(db, sample_id)
    if not sample:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sample not found"
        )
    return sample


@router.put("/{sample_id}", response_model=Sample)
async def update_sample(
    sample_id: int,
    sample_data: SampleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing sample"""
    try:
        sample = sample_tracking_service.update_sample(
            db=db,
            sample_id=sample_id,
            sample_data=sample_data.dict(exclude_unset=True),
            updated_by=current_user.id
        )
        if not sample:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sample not found"
            )
        return sample
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update sample: {str(e)}"
        )


@router.post("/{sample_id}/transfer", response_model=Sample)
async def transfer_sample(
    sample_id: int,
    to_user_id: int,
    transfer_notes: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Transfer sample to another analyst"""
    try:
        sample = sample_tracking_service.transfer_sample(
            db=db,
            sample_id=sample_id,
            from_user_id=current_user.id,
            to_user_id=to_user_id,
            transfer_notes=transfer_notes
        )
        if not sample:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sample not found"
            )
        return sample
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to transfer sample: {str(e)}"
        )


@router.post("/{sample_id}/results", response_model=Sample)
async def add_analysis_results(
    sample_id: int,
    results: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add analysis results to a sample"""
    try:
        sample = sample_tracking_service.add_analysis_results(
            db=db,
            sample_id=sample_id,
            results=results,
            analyst_id=current_user.id
        )
        if not sample:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sample not found"
            )
        return sample
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add results: {str(e)}"
        )


@router.post("/batch", response_model=List[Sample])
async def create_batch_samples(
    samples_data: List[SampleCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create multiple samples in batch"""
    try:
        samples = sample_tracking_service.create_batch_samples(
            db=db,
            samples_data=[sample.model_dump() for sample in samples_data],
            created_by=current_user.id
        )
        return samples
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create batch samples: {str(e)}"
        )


@router.delete("/{sample_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sample(
    sample_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete (cancel) a sample"""
    try:
        success = sample_tracking_service.delete_sample(db, sample_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sample not found"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete sample: {str(e)}"
        )
