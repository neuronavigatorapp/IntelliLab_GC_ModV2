#!/usr/bin/env python3
"""
Cost Calculation API endpoints for IntelliLab GC
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.schemas import (
    CostItem,
    CostItemCreate,
    CostItemUpdate,
    CostCalculationRequest,
    CostCalculationResult,
    User
)
from app.services.cost_service import cost_service
from app.services.auth_service import get_current_user

router = APIRouter()


@router.post("/items", response_model=CostItem, status_code=status.HTTP_201_CREATED)
async def create_cost_item(
    cost_data: CostItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new cost item (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users can create cost items"
        )
    
    try:
        cost_item = cost_service.create_cost_item(
            db=db,
            cost_data=cost_data.dict()
        )
        return cost_item
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create cost item: {str(e)}"
        )


@router.get("/items", response_model=List[CostItem])
async def get_cost_items(
    category: Optional[str] = Query(None, description="Filter by category"),
    is_active: Optional[bool] = Query(True, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search in name and description"),
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of items to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get cost items with optional filtering"""
    try:
        items = cost_service.get_cost_items(
            db=db,
            category=category,
            is_active=is_active,
            search=search,
            skip=skip,
            limit=limit
        )
        return items
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve cost items: {str(e)}"
        )


@router.get("/items/{item_id}", response_model=CostItem)
async def get_cost_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific cost item by ID"""
    item = cost_service.get_cost_item(db, item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cost item not found"
        )
    return item


@router.put("/items/{item_id}", response_model=CostItem)
async def update_cost_item(
    item_id: int,
    cost_data: CostItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing cost item (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users can update cost items"
        )
    
    try:
        item = cost_service.update_cost_item(
            db=db,
            item_id=item_id,
            cost_data=cost_data.dict(exclude_unset=True)
        )
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cost item not found"
            )
        return item
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update cost item: {str(e)}"
        )


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cost_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete (deactivate) a cost item (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users can delete cost items"
        )
    
    try:
        success = cost_service.delete_cost_item(db, item_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cost item not found"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete cost item: {str(e)}"
        )


@router.post("/calculate", response_model=CostCalculationResult)
async def calculate_method_cost(
    calculation_request: CostCalculationRequest,
    custom_rates: Optional[Dict[str, Dict[str, float]]] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Calculate total cost for a method"""
    try:
        result = cost_service.calculate_method_cost(
            db=db,
            method_parameters=calculation_request.method_parameters,
            analysis_count=calculation_request.analysis_count,
            include_overhead=calculation_request.include_overhead,
            overhead_percentage=calculation_request.overhead_percentage,
            custom_rates=custom_rates
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate method cost: {str(e)}"
        )


@router.post("/optimize", response_model=Dict[str, Any])
async def get_cost_optimization(
    calculation_request: CostCalculationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get cost optimization suggestions for a method"""
    try:
        # First calculate the cost
        cost_result = cost_service.calculate_method_cost(
            db=db,
            method_parameters=calculation_request.method_parameters,
            analysis_count=calculation_request.analysis_count,
            include_overhead=calculation_request.include_overhead,
            overhead_percentage=calculation_request.overhead_percentage
        )
        
        # Get optimization suggestions
        suggestions = cost_service.get_cost_optimization_suggestions(
            cost_result=cost_result,
            method_parameters=calculation_request.method_parameters
        )
        
        return {
            "cost_analysis": cost_result,
            "optimization_suggestions": suggestions
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate optimization suggestions: {str(e)}"
        )


@router.get("/categories", response_model=List[str])
async def get_cost_categories():
    """Get available cost categories"""
    return ["consumables", "labor", "instrument_time", "overhead"]


@router.post("/initialize-defaults", response_model=List[CostItem])
async def initialize_default_cost_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Initialize default cost items (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users can initialize default cost items"
        )
    
    try:
        items = cost_service.initialize_default_cost_items(db)
        return items
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize default cost items: {str(e)}"
        )
