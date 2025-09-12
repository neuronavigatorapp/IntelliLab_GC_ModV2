from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from ...services.sync_service import sync_service
from ...models.schemas import SyncEnvelope, SyncPullResponse, PushResult

router = APIRouter()


class PullRequest(BaseModel):
    since: Optional[datetime] = None


@router.post("/pull", response_model=SyncPullResponse)
async def pull_changes(request: PullRequest):
    """Pull changes from server since the given timestamp"""
    try:
        return sync_service.pull_changes(request.since)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sync pull failed: {str(e)}")


@router.post("/push", response_model=PushResult)
async def push_changes(envelope: SyncEnvelope):
    """Push client changes to server with conflict resolution"""
    try:
        return sync_service.apply_changes(envelope)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sync push failed: {str(e)}")


@router.get("/status")
async def get_sync_status():
    """Get current sync status and server time"""
    try:
        versions = sync_service.get_current_versions()
        return {
            "server_time": datetime.now(),
            "versions": versions,
            "status": "online"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Status check failed: {str(e)}")
