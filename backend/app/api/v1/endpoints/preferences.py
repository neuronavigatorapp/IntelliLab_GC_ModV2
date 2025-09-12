#!/usr/bin/env python3
"""
User preferences endpoints for IntelliLab GC API
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any
from datetime import datetime

from app.core.database import get_db
from app.models.schemas import UserPreferences

router = APIRouter()

@router.get("/user/preferences")
async def get_user_preferences(db: Session = Depends(get_db)):
    """
    Get user preferences
    """
    # Placeholder - in a real implementation, this would come from database
    # and be associated with the current user
    return UserPreferences(
        darkMode=False,
        defaultModule="dashboard",
        refreshInterval=60,
        notifications=True
    )

@router.post("/user/preferences")
async def update_user_preferences(
    preferences: UserPreferences,
    db: Session = Depends(get_db)
):
    """
    Update user preferences
    """
    # Placeholder - in a real implementation, this would save to database
    # and be associated with the current user
    
    # Validate preferences
    if preferences.refreshInterval < 0:
        raise HTTPException(status_code=400, detail="Refresh interval must be positive")
    
    if preferences.refreshInterval > 3600:  # Max 1 hour
        raise HTTPException(status_code=400, detail="Refresh interval cannot exceed 1 hour")
    
    # Return updated preferences
    return {
        "message": "Preferences updated successfully",
        "preferences": preferences,
        "updated_at": datetime.now().isoformat()
    }

@router.get("/user/preferences/defaults")
async def get_default_preferences():
    """
    Get default user preferences
    """
    return UserPreferences(
        darkMode=False,
        defaultModule="dashboard",
        refreshInterval=60,
        notifications=True
    )
