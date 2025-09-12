#!/usr/bin/env python3
"""
File upload/download API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
from loguru import logger
import os
import shutil
from datetime import datetime
import uuid

from app.core.database import get_db, FileUpload as FileUploadModel
from app.models.schemas import FileUploadResponse
from app.core.config import settings

router = APIRouter()


@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload a file"""
    try:
        # Validate file size
        if file.size and file.size > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size exceeds maximum allowed size of {settings.MAX_FILE_SIZE / (1024*1024):.1f}MB"
            )
        
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1] if file.filename else ""
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Get file size
        file_size = os.path.getsize(file_path)
        
        # Create database record
        db_file = FileUploadModel(
            filename=unique_filename,
            original_filename=file.filename or "unknown",
            file_path=file_path,
            file_size=file_size,
            file_type=file.content_type or "application/octet-stream"
        )
        db.add(db_file)
        db.commit()
        db.refresh(db_file)
        
        logger.info(f"File uploaded: {file.filename} -> {unique_filename}")
        return db_file
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error uploading file"
        )


@router.get("/download/{file_id}")
async def download_file(
    file_id: int,
    db: Session = Depends(get_db)
):
    """Download a file by ID"""
    try:
        db_file = db.query(FileUploadModel).filter(FileUploadModel.id == file_id).first()
        
        if not db_file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )
        
        if not os.path.exists(db_file.file_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found on disk"
            )
        
        return FileResponse(
            path=db_file.file_path,
            filename=db_file.original_filename,
            media_type=db_file.file_type
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading file {file_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error downloading file"
        )


@router.get("/", response_model=List[FileUploadResponse])
async def get_files(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all uploaded files"""
    try:
        files = db.query(FileUploadModel).offset(skip).limit(limit).all()
        return files
    except Exception as e:
        logger.error(f"Error getting files: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving files"
        )


@router.delete("/{file_id}")
async def delete_file(
    file_id: int,
    db: Session = Depends(get_db)
):
    """Delete a file"""
    try:
        db_file = db.query(FileUploadModel).filter(FileUploadModel.id == file_id).first()
        
        if not db_file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )
        
        # Delete file from disk
        if os.path.exists(db_file.file_path):
            os.remove(db_file.file_path)
        
        # Delete database record
        db.delete(db_file)
        db.commit()
        
        logger.info(f"File deleted: {db_file.original_filename}")
        return {"message": f"File '{db_file.original_filename}' deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting file {file_id}: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting file"
        )


@router.post("/export/method")
async def export_method(
    method_data: dict,
    filename: str = "method_export.json",
    db: Session = Depends(get_db)
):
    """Export method data to file"""
    try:
        # Generate unique filename
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
        
        # Write method data to file
        with open(file_path, "w") as f:
            import json
            json.dump(method_data, f, indent=2)
        
        # Get file size
        file_size = os.path.getsize(file_path)
        
        # Create database record
        db_file = FileUploadModel(
            filename=unique_filename,
            original_filename=filename,
            file_path=file_path,
            file_size=file_size,
            file_type="application/json"
        )
        db.add(db_file)
        db.commit()
        db.refresh(db_file)
        
        logger.info(f"Method exported: {filename} -> {unique_filename}")
        return db_file
        
    except Exception as e:
        logger.error(f"Error exporting method: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error exporting method"
        )


@router.post("/import/method")
async def import_method(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Import method data from file"""
    try:
        # Validate file type
        if not file.filename or not file.filename.endswith(('.json', '.txt')):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only JSON and TXT files are supported for method import"
            )
        
        # Read file content
        content = await file.read()
        
        try:
            import json
            method_data = json.loads(content.decode())
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid JSON format"
            )
        
        # Validate method data structure
        required_fields = ["name", "method_type", "parameters"]
        for field in required_fields:
            if field not in method_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Missing required field: {field}"
                )
        
        logger.info(f"Method imported: {file.filename}")
        return {
            "message": "Method imported successfully",
            "method_data": method_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error importing method: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error importing method"
        )


@router.get("/stats")
async def get_file_stats(db: Session = Depends(get_db)):
    """Get file upload statistics"""
    try:
        total_files = db.query(FileUploadModel).count()
        total_size = db.query(FileUploadModel.file_size).all()
        total_size = sum(size[0] for size in total_size) if total_size else 0
        
        # File type distribution
        file_types = db.query(FileUploadModel.file_type).all()
        type_distribution = {}
        for file_type in file_types:
            type_distribution[file_type[0]] = type_distribution.get(file_type[0], 0) + 1
        
        return {
            "total_files": total_files,
            "total_size_bytes": total_size,
            "total_size_mb": round(total_size / (1024*1024), 2),
            "type_distribution": type_distribution,
            "upload_directory": settings.UPLOAD_DIR
        }
        
    except Exception as e:
        logger.error(f"Error getting file stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving file statistics"
        ) 