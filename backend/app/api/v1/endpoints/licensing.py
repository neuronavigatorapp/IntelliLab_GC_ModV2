#!/usr/bin/env python3
"""
Licensing endpoints for IntelliLab GC API
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.schemas import LicenseInfo, LicenseValidationRequest, LicenseValidationResponse

router = APIRouter()

@router.get("/license", response_model=LicenseInfo)
async def get_license_info(db: Session = Depends(get_db)):
    """
    Get current license information
    """
    try:
        # Placeholder license info - in a real implementation, this would come from database
        # or license validation service
        return LicenseInfo(
            plan="Developer",
            status="active",
            expiresAt=(datetime.now() + timedelta(days=365)).isoformat()
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to retrieve license information: {str(e)}"
        )

@router.post("/license/validate", response_model=LicenseValidationResponse)
async def validate_license(
    request: LicenseValidationRequest,
    db: Session = Depends(get_db)
):
    """
    Validate a license key
    """
    # Placeholder validation logic
    # In a real implementation, this would validate against a license server
    license_key = request.license_key
    
    # Simple validation for demo purposes
    if not license_key or len(license_key) < 10:
        return LicenseValidationResponse(
            status="invalid",
            message="Invalid license key format"
        )
    
    # Check for demo/development keys
    if license_key.startswith("DEMO-") or license_key.startswith("DEV-"):
        return LicenseValidationResponse(
            status="active",
            message="Development license activated successfully"
        )
    
    # Check for expired keys
    if license_key.startswith("EXP-"):
        return LicenseValidationResponse(
            status="expired",
            message="License has expired"
        )
    
    # Default to valid for demo purposes
    return LicenseValidationResponse(
        status="active",
        message="License validated successfully"
    )

@router.get("/license/features")
async def get_license_features(db: Session = Depends(get_db)):
    """
    Get features available with current license
    """
    # Placeholder features based on license plan
    features = {
        "Developer": {
            "simulation_tools": True,
            "fleet_management": True,
            "inventory_tracking": True,
            "reporting": True,
            "ai_features": True,
            "method_templates": True,
            "data_export": True,
            "api_access": True,
            "user_limit": 10,
            "storage_limit": "10GB"
        },
        "Professional": {
            "simulation_tools": True,
            "fleet_management": True,
            "inventory_tracking": True,
            "reporting": True,
            "ai_features": True,
            "method_templates": True,
            "data_export": True,
            "api_access": True,
            "user_limit": 50,
            "storage_limit": "100GB"
        },
        "Enterprise": {
            "simulation_tools": True,
            "fleet_management": True,
            "inventory_tracking": True,
            "reporting": True,
            "ai_features": True,
            "method_templates": True,
            "data_export": True,
            "api_access": True,
            "user_limit": -1,  # Unlimited
            "storage_limit": "1TB"
        }
    }
    
    # Get current license plan
    current_plan = "Developer"  # Placeholder
    
    return {
        "plan": current_plan,
        "features": features.get(current_plan, {}),
        "usage": {
            "users": 3,  # Placeholder
            "storage_used": "2.1GB",  # Placeholder
            "reports_generated": 15  # Placeholder
        }
    }

@router.get("/license/usage")
async def get_license_usage(db: Session = Depends(get_db)):
    """
    Get current license usage statistics
    """
    # Placeholder usage data
    return {
        "users_active": 3,
        "users_limit": 10,
        "storage_used_gb": 2.1,
        "storage_limit_gb": 10,
        "reports_generated": 15,
        "api_calls_today": 45,
        "last_activity": datetime.now().isoformat()
    }
