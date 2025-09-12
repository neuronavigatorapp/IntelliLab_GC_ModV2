#!/usr/bin/env python3
"""
Electronic signature endpoints
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, Dict, Any

from app.services.esign_service import esign_service
from app.services.auth_service import get_current_user
from app.models.schemas import User

router = APIRouter()


@router.post("/")
async def create_esign(
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_user),
):
    """
    Create an electronic signature for an object.
    Expected payload: { objectType, objectId, reason, objectData }
    """
    try:
        object_type = payload.get("objectType")
        object_id = str(payload.get("objectId"))
        reason = payload.get("reason")
        object_data = payload.get("objectData") or {}
        if not object_type or not object_id or not reason:
            raise HTTPException(status_code=400, detail="Missing required fields")
        result = esign_service.sign(
            user_id=current_user.id,
            object_type=object_type,
            object_id=object_id,
            reason=reason,
            object_data=object_data,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/")
async def list_esigns(
    objectType: Optional[str] = None,
    objectId: Optional[str] = None,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
):
    _ = current_user  # ensure auth
    return esign_service.list(object_type=objectType, object_id=objectId, limit=limit)


