from typing import List, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from fastapi.responses import FileResponse

from ...services.attachments_service import attachments_service
from ...models.schemas import AttachmentMeta

router = APIRouter()


@router.post("/upload", response_model=AttachmentMeta)
async def upload_attachment(
    file: UploadFile = File(...),
    entity_type: str = Form(...),
    entity_id: str = Form(...)
):
    """Upload a file attachment for an entity"""
    try:
        return attachments_service.save_attachment(file, entity_type, entity_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/{attachment_id}", response_class=FileResponse)
async def download_attachment(attachment_id: str):
    """Download an attachment by ID"""
    try:
        response = attachments_service.create_file_response(attachment_id)
        if not response:
            raise HTTPException(status_code=404, detail="Attachment not found")
        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")


@router.get("/{attachment_id}/meta", response_model=AttachmentMeta)
async def get_attachment_meta(attachment_id: str):
    """Get attachment metadata by ID"""
    try:
        meta = attachments_service.get_attachment_meta(attachment_id)
        if not meta:
            raise HTTPException(status_code=404, detail="Attachment not found")
        return meta
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Metadata retrieval failed: {str(e)}")


@router.get("/list/{entity_type}/{entity_id}", response_model=List[AttachmentMeta])
async def list_entity_attachments(entity_type: str, entity_id: str):
    """List all attachments for a specific entity"""
    try:
        return attachments_service.list_attachments(entity_type, entity_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"List failed: {str(e)}")


@router.delete("/{attachment_id}")
async def delete_attachment(attachment_id: str):
    """Delete an attachment by ID"""
    try:
        success = attachments_service.delete_attachment(attachment_id)
        if not success:
            raise HTTPException(status_code=404, detail="Attachment not found")
        return {"message": "Attachment deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")
