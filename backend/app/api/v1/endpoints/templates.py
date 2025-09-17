#!/usr/bin/env python3
"""
Method Template API endpoints for IntelliLab GC
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.schemas import (
    MethodTemplate, 
    MethodTemplateCreate, 
    MethodTemplateUpdate,
    ToolType,
    MethodTemplateCategory
)
from app.services.method_template_service import method_template_service
from app.services.auth_service import get_current_user
from app.models.schemas import User

router = APIRouter()


@router.post("/", response_model=MethodTemplate, status_code=status.HTTP_201_CREATED)
async def create_template(
    template_data: MethodTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new method template"""
    try:
        template = method_template_service.create_template(
            db=db,
            template_data=template_data.model_dump(),
            user_id=current_user.id
        )
        return template
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create template: {str(e)}"
        )


@router.get("/", response_model=List[MethodTemplate])
async def get_templates(
    category: Optional[str] = Query(None, description="Filter by category"),
    tool_type: Optional[str] = Query(None, description="Filter by tool type"),
    search: Optional[str] = Query(None, description="Search in name, description, and tags"),
    is_public: Optional[bool] = Query(None, description="Filter by public templates"),
    skip: int = Query(0, ge=0, description="Number of templates to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of templates to return"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Get method templates with optional filtering"""
    try:
        user_id = current_user.id if current_user else None
        templates = method_template_service.get_templates(
            db=db,
            user_id=user_id,
            category=category,
            tool_type=tool_type,
            is_public=is_public,
            search=search,
            skip=skip,
            limit=limit
        )
        return templates
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve templates: {str(e)}"
        )


@router.get("/categories", response_model=List[str])
async def get_template_categories():
    """Get available template categories"""
    return method_template_service.get_categories()


@router.get("/tool-types", response_model=List[str])
async def get_tool_types():
    """Get available tool types"""
    return method_template_service.get_tool_types()


@router.get("/{template_id}", response_model=MethodTemplate)
async def get_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Get a specific template by ID"""
    template = method_template_service.get_template(db=db, template_id=template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    # Check access permissions
    user_id = current_user.id if current_user else None
    if not template.is_public and (not user_id or template.created_by != user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this template"
        )
    
    return template


@router.put("/{template_id}", response_model=MethodTemplate)
async def update_template(
    template_id: int,
    template_data: MethodTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing template"""
    try:
        template = method_template_service.update_template(
            db=db,
            template_id=template_id,
            template_data=template_data.dict(exclude_unset=True),
            user_id=current_user.id
        )
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        return template
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update template: {str(e)}"
        )


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a template"""
    try:
        success = method_template_service.delete_template(
            db=db,
            template_id=template_id,
            user_id=current_user.id
        )
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete template: {str(e)}"
        )


@router.post("/{template_id}/use", response_model=dict)
async def use_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Mark template as used (increment usage count)"""
    try:
        success = method_template_service.increment_usage(
            db=db,
            template_id=template_id
        )
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        return {"message": "Template usage recorded successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record template usage: {str(e)}"
        )


@router.post("/initialize-defaults", response_model=List[MethodTemplate])
async def initialize_default_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Initialize predefined templates (admin only)"""
    # Check if user is admin
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users can initialize default templates"
        )
    
    try:
        templates = method_template_service.create_predefined_templates(
            db=db,
            admin_user_id=current_user.id
        )
        return templates
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize default templates: {str(e)}"
        )
