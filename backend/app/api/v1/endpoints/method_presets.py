#!/usr/bin/env python3
"""
Method preset endpoints for ASTM/GPA/EPA presets.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db, MethodPreset as PresetModel
from app.models.schemas import MethodPreset, MethodPresetCreate, MethodPresetUpdate
from app.services.method_presets_service import method_presets_service


router = APIRouter()


@router.get("/", response_model=List[MethodPreset])
async def list_presets(standard_body: Optional[str] = Query(None)):
    """List method presets, optionally filtered by standard body"""
    try:
        return method_presets_service.get_presets(standard_body=standard_body)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/", response_model=MethodPreset)
async def create_preset(payload: MethodPresetCreate):
    """Create a new method preset"""
    try:
        return method_presets_service.create_preset(payload)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{preset_id}", response_model=MethodPreset)
async def get_preset(preset_id: int):
    """Get a specific method preset by ID"""
    try:
        preset = method_presets_service.get_preset(preset_id)
        if not preset:
            raise HTTPException(status_code=404, detail="Preset not found")
        return preset
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{preset_id}", response_model=MethodPreset)
async def update_preset(preset_id: int, payload: MethodPresetUpdate):
    """Update a method preset"""
    try:
        preset = method_presets_service.update_preset(preset_id, payload)
        if not preset:
            raise HTTPException(status_code=404, detail="Preset not found")
        return preset
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{preset_id}")
async def delete_preset(preset_id: int):
    """Delete a method preset"""
    try:
        success = method_presets_service.delete_preset(preset_id)
        if not success:
            raise HTTPException(status_code=404, detail="Preset not found")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{preset_id}/clone", response_model=MethodPreset)
async def clone_preset(
    preset_id: int,
    new_name: str = Query(...),
    modifications: Optional[dict] = None
):
    """Clone an existing preset with optional modifications"""
    try:
        preset = method_presets_service.clone_preset(preset_id, new_name, modifications)
        if not preset:
            raise HTTPException(status_code=404, detail="Original preset not found")
        return preset
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/initialize-standards")
async def initialize_standard_presets():
    """Initialize standard ASTM/GPA presets in the database"""
    try:
        created_presets = method_presets_service.initialize_standard_presets()
        return {
            "success": True,
            "created_presets": len(created_presets),
            "presets": created_presets
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/search/", response_model=List[MethodPreset])
async def search_presets(
    q: str = Query(..., min_length=2),
    method_type: Optional[str] = Query(None)
):
    """Search presets by name, code, or description"""
    try:
        return method_presets_service.search_presets(q, method_type)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/categories/")
async def get_preset_categories():
    """Get all available preset categories and method types"""
    try:
        categories = method_presets_service.get_preset_categories()
        return {
            "categories": categories,
            "total_standards": len(categories)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


