import os
import uuid
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, BinaryIO
from fastapi import UploadFile, HTTPException
from fastapi.responses import FileResponse

from ..models.schemas import AttachmentMeta


class AttachmentsService:
    def __init__(self, upload_dir: str = "uploads/attachments"):
        self.upload_dir = Path(upload_dir)
        self.upload_dir.mkdir(parents=True, exist_ok=True)
    
    def save_attachment(self, file: UploadFile, entity_type: str, entity_id: str) -> AttachmentMeta:
        """Save uploaded file and return metadata"""
        # Generate unique filename
        file_id = str(uuid.uuid4())
        file_extension = Path(file.filename).suffix if file.filename else ""
        filename = f"{file_id}{file_extension}"
        
        # Create entity directory
        entity_dir = self.upload_dir / entity_type / entity_id
        entity_dir.mkdir(parents=True, exist_ok=True)
        
        file_path = entity_dir / filename
        
        # Save file
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
        
        # Create metadata
        attachment = AttachmentMeta(
            id=file_id,
            entity_type=entity_type,
            entity_id=entity_id,
            filename=file.filename or filename,
            mime_type=file.content_type or "application/octet-stream",
            size=file_path.stat().st_size,
            created_at=datetime.now(timezone.utc),
            uploaded_at=datetime.now(timezone.utc)
        )
        
        return attachment
    
    def get_attachment_path(self, attachment_id: str) -> Optional[Path]:
        """Find attachment file path by ID"""
        # Search through all entity directories
        for entity_dir in self.upload_dir.iterdir():
            if entity_dir.is_dir():
                for subdir in entity_dir.iterdir():
                    if subdir.is_dir():
                        for file_path in subdir.iterdir():
                            if file_path.stem == attachment_id:
                                return file_path
        return None
    
    def get_attachment_meta(self, attachment_id: str) -> Optional[AttachmentMeta]:
        """Get attachment metadata by ID"""
        file_path = self.get_attachment_path(attachment_id)
        if not file_path:
            return None
        
        # Extract metadata from path
        parts = file_path.parts
        if len(parts) >= 4:
            entity_type = parts[-3]
            entity_id = parts[-2]
            
            return AttachmentMeta(
                id=attachment_id,
                entity_type=entity_type,
                entity_id=entity_id,
                filename=file_path.name,
                mime_type=self._guess_mime_type(file_path),
                size=file_path.stat().st_size,
                uploaded_at=datetime.fromtimestamp(file_path.stat().st_mtime, tz=timezone.utc)
            )
        
        return None
    
    def delete_attachment(self, attachment_id: str) -> bool:
        """Delete attachment by ID"""
        file_path = self.get_attachment_path(attachment_id)
        if file_path and file_path.exists():
            file_path.unlink()
            return True
        return False
    
    def list_attachments(self, entity_type: Optional[str] = None, entity_id: Optional[str] = None) -> list[AttachmentMeta]:
        """List attachments, optionally filtered by entity"""
        attachments = []
        
        if entity_type and entity_id:
            entity_dir = self.upload_dir / entity_type / entity_id
            if entity_dir.exists():
                for file_path in entity_dir.iterdir():
                    if file_path.is_file():
                        attachment = self.get_attachment_meta(file_path.stem)
                        if attachment:
                            attachments.append(attachment)
        else:
            # Search all attachments
            for entity_dir in self.upload_dir.iterdir():
                if entity_dir.is_dir():
                    for subdir in entity_dir.iterdir():
                        if subdir.is_dir():
                            for file_path in subdir.iterdir():
                                if file_path.is_file():
                                    attachment = self.get_attachment_meta(file_path.stem)
                                    if attachment:
                                        attachments.append(attachment)
        
        return attachments
    
    def _guess_mime_type(self, file_path: Path) -> str:
        """Guess MIME type from file extension"""
        extension = file_path.suffix.lower()
        mime_types = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.pdf': 'application/pdf',
            '.txt': 'text/plain',
            '.csv': 'text/csv',
            '.json': 'application/json'
        }
        return mime_types.get(extension, 'application/octet-stream')
    
    def create_file_response(self, attachment_id: str) -> Optional[FileResponse]:
        """Create FastAPI FileResponse for attachment download"""
        file_path = self.get_attachment_path(attachment_id)
        if not file_path or not file_path.exists():
            return None
        
        attachment_meta = self.get_attachment_meta(attachment_id)
        if not attachment_meta:
            return None
        
        return FileResponse(
            path=str(file_path),
            filename=attachment_meta.filename,
            media_type=attachment_meta.mime_type
        )


# Global instance
attachments_service = AttachmentsService()
