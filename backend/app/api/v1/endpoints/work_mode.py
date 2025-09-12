#!/usr/bin/env python3
"""
Work Mode endpoints for managing user work mode preferences.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.models.schemas import WorkMode, WorkModeCreate, WorkModeUpdate
from app.services.work_mode_service import work_mode_service
from app.core.database import get_db


router = APIRouter()


@router.get("/current", response_model=Optional[WorkMode])
async def get_current_work_mode(
    user_id: int = Query(1),  # TODO: Get from auth
    db: Session = Depends(get_db)
):
    """Get current work mode for authenticated user."""
    try:
        work_mode = work_mode_service.get_user_work_mode(user_id)
        return work_mode
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get work mode: {str(e)}")


@router.post("/", response_model=WorkMode)
async def create_work_mode(
    work_mode_data: WorkModeCreate,
    user_id: int = Query(1),  # TODO: Get from auth
    db: Session = Depends(get_db)
):
    """Create or update work mode for authenticated user."""
    try:
        # Validate the work mode configuration
        validation = work_mode_service.validate_work_mode(work_mode_data.dict())
        if not validation["valid"]:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid work mode configuration: {', '.join(validation['errors'])}"
            )
        
        work_mode = work_mode_service.create_user_work_mode(user_id, work_mode_data)
        return work_mode
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create work mode: {str(e)}")


@router.put("/", response_model=WorkMode)
async def update_work_mode(
    work_mode_data: WorkModeUpdate,
    user_id: int = Query(1),  # TODO: Get from auth
    db: Session = Depends(get_db)
):
    """Update work mode for authenticated user."""
    try:
        work_mode = work_mode_service.update_user_work_mode(user_id, work_mode_data)
        if not work_mode:
            raise HTTPException(status_code=404, detail="Work mode not found for user")
        return work_mode
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update work mode: {str(e)}")


@router.post("/predefined/{mode_name}", response_model=WorkMode)
async def set_predefined_mode(
    mode_name: str,
    user_id: int = Query(1),  # TODO: Get from auth
    db: Session = Depends(get_db)
):
    """Set a predefined work mode for authenticated user."""
    try:
        work_mode = work_mode_service.set_predefined_mode(user_id, mode_name)
        return work_mode
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to set predefined mode: {str(e)}")


@router.get("/predefined")
async def get_predefined_modes():
    """Get list of available predefined work modes."""
    try:
        modes = work_mode_service.get_predefined_modes()
        return {
            "predefined_modes": modes,
            "total_modes": len(modes)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get predefined modes: {str(e)}")


@router.get("/modules")
async def get_available_modules():
    """Get information about all available modules for work mode configuration."""
    try:
        modules = work_mode_service.get_module_availability()
        return {
            "modules": modules,
            "categories": list(set(module["category"] for module in modules.values())),
            "total_modules": len(modules)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get modules: {str(e)}")


@router.post("/validate")
async def validate_work_mode_config(config: dict):
    """Validate a work mode configuration."""
    try:
        validation_result = work_mode_service.validate_work_mode(config)
        return validation_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to validate configuration: {str(e)}")


@router.get("/statistics")
async def get_work_mode_statistics(db: Session = Depends(get_db)):
    """Get statistics about work mode usage (admin endpoint)."""
    try:
        stats = work_mode_service.get_work_mode_statistics()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get statistics: {str(e)}")


@router.post("/last-used")
async def update_last_used(
    user_id: int = Query(1),  # TODO: Get from auth
    db: Session = Depends(get_db)
):
    """Update last used timestamp for user's work mode."""
    try:
        from app.core.database import WorkMode as WorkModeModel
        from datetime import datetime
        
        # Update last_used timestamp
        work_mode = db.query(WorkModeModel).filter(WorkModeModel.user_id == user_id).first()
        if work_mode:
            work_mode.last_used = datetime.now()
            db.commit()
            
        return {"success": True, "timestamp": datetime.now().isoformat()}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update timestamp: {str(e)}")


@router.get("/launch-config")
async def get_launch_config(
    user_id: int = Query(1),  # TODO: Get from auth
    db: Session = Depends(get_db)
):
    """
    Get launch configuration for user including auto-launch module and dashboard config.
    This endpoint is called on application startup.
    """
    try:
        work_mode = work_mode_service.get_user_work_mode(user_id)
        
        if not work_mode:
            # Return default full mode if no work mode set
            default_config = work_mode_service.predefined_modes["full"]
            return {
                "has_work_mode": False,
                "auto_launch_module": default_config["auto_launch_module"],
                "enabled_modules": default_config["enabled_modules"],
                "dashboard_config": default_config["dashboard_config"],
                "quick_access_tools": default_config["quick_access_tools"],
                "mode_name": "full"
            }
        
        return {
            "has_work_mode": True,
            "auto_launch_module": work_mode.auto_launch_module,
            "enabled_modules": work_mode.enabled_modules,
            "dashboard_config": work_mode.dashboard_config,
            "quick_access_tools": work_mode.quick_access_tools,
            "mode_name": work_mode.mode_name,
            "last_used": work_mode.last_used.isoformat() if work_mode.last_used else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get launch config: {str(e)}")


@router.post("/quick-switch")
async def quick_switch_mode(
    mode_name: str,
    user_id: int = Query(1),  # TODO: Get from auth
    db: Session = Depends(get_db)
):
    """
    Quick switch to a predefined mode without full configuration.
    Useful for temporary mode switching during work sessions.
    """
    try:
        # Get current work mode to preserve custom settings if any
        current_mode = work_mode_service.get_user_work_mode(user_id)
        
        # Set the predefined mode
        new_mode = work_mode_service.set_predefined_mode(user_id, mode_name)
        
        return {
            "success": True,
            "previous_mode": current_mode.mode_name if current_mode else None,
            "new_mode": new_mode.mode_name,
            "auto_launch_module": new_mode.auto_launch_module,
            "enabled_modules": new_mode.enabled_modules,
            "timestamp": new_mode.last_used.isoformat() if new_mode.last_used else None
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to switch mode: {str(e)}")
