#!/usr/bin/env python3
"""
Method Comparison API endpoints for IntelliLab GC
"""

from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.schemas import (
    MethodComparisonRequest,
    MethodComparisonResult,
    User
)
from app.services.method_comparison_service import method_comparison_service
from app.services.auth_service import get_current_user

router = APIRouter()


@router.post("/compare", response_model=MethodComparisonResult)
async def compare_methods(
    comparison_request: MethodComparisonRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Compare two methods across specified metrics"""
    try:
        result = method_comparison_service.compare_methods(
            method1=comparison_request.method1,
            method2=comparison_request.method2,
            tool_type=comparison_request.tool_type,
            metrics=comparison_request.metrics
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compare methods: {str(e)}"
        )
