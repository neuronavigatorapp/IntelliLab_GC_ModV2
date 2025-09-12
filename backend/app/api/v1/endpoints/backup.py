#!/usr/bin/env python3
"""
Backup/Restore endpoints
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse
from typing import Literal
from datetime import datetime

from app.services.backup_service import backup_service
from app.services.audit_service import audit_service
from app.services.auth_service import get_current_user
from app.models.schemas import User


router = APIRouter()


@router.get("/export")
async def export_backup(
    scope: Literal["all", "calibration", "qc", "sequences", "runs", "audit"] = Query("all"),
    current_user: User = Depends(get_current_user),
):
    """Export backup ZIP for the requested scope."""
    try:
        data = backup_service.export_backup(scope)  # bytes
        filename = f"intellilab_backup_{scope}_{datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')}.zip"

        audit_service.log_action(
            user=current_user.email,
            action="backup_export",
            entity_type="backup",
            details={"scope": scope, "filename": filename},
        )

        return StreamingResponse(
            iter([data]),
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/import")
async def import_backup(
    file: UploadFile = File(...),
    mode: Literal["merge", "replace"] = Query("merge"),
    current_user: User = Depends(get_current_user),
):
    """Import a backup ZIP created by export."""
    try:
        content = await file.read()
        result = backup_service.import_backup(content, mode=mode)

        audit_service.log_action(
            user=current_user.email,
            action="backup_import",
            entity_type="backup",
            details={"mode": mode, "applied_scopes": result.get("applied_scopes", [])},
        )

        return {"success": True, "result": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/db/export")
async def export_db(current_user: User = Depends(get_current_user)):
    """Export SQLite DB file as binary for backup."""
    try:
        import os
        from fastapi.responses import FileResponse
        db_path = os.getenv("DATABASE_URL", "sqlite:///./intellilab_gc.db").replace("sqlite:///", "")
        if not os.path.exists(db_path):
            raise HTTPException(status_code=404, detail="Database file not found")
        return FileResponse(db_path, filename=os.path.basename(db_path), media_type="application/octet-stream")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/create")
async def create_backup():
    """Create a timestamped backup of the database"""
    try:
        import subprocess
        import sys
        from pathlib import Path
        
        # Run the backup script
        script_path = Path(__file__).parent.parent.parent.parent.parent / "scripts" / "backup_database.py"
        result = subprocess.run([sys.executable, str(script_path), "backup"], 
                               capture_output=True, text=True)
        
        if result.returncode == 0:
            return {"success": True, "message": "Backup created successfully", "output": result.stdout}
        else:
            raise HTTPException(status_code=500, detail=f"Backup failed: {result.stderr}")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create backup: {str(e)}")


@router.get("/list")
async def list_backups():
    """List all available backups"""
    try:
        import subprocess
        import sys
        import json
        from pathlib import Path
        
        # Run the backup script to list backups
        script_path = Path(__file__).parent.parent.parent.parent.parent / "scripts" / "backup_database.py"
        result = subprocess.run([sys.executable, str(script_path), "list"], 
                               capture_output=True, text=True)
        
        if result.returncode == 0:
            # Parse the output to extract backup information
            from app.core.config import Settings
            settings = Settings()
            backup_dir = Path(settings.get_backup_dir())
            
            backups = []
            if backup_dir.exists():
                for backup_file in backup_dir.glob("intellilab_backup_*.db"):
                    import os
                    from datetime import datetime
                    
                    backup_info = {
                        "filename": backup_file.name,
                        "path": str(backup_file),
                        "size": os.path.getsize(backup_file),
                        "created": datetime.fromtimestamp(os.path.getmtime(backup_file)).isoformat(),
                        "size_mb": round(os.path.getsize(backup_file) / (1024 * 1024), 2)
                    }
                    
                    # Try to load metadata if available
                    metadata_file = backup_file.with_suffix('.db.meta')
                    if metadata_file.exists():
                        try:
                            with open(metadata_file, 'r') as f:
                                metadata = json.load(f)
                                backup_info.update(metadata)
                        except:
                            pass
                    
                    backups.append(backup_info)
            
            # Sort by creation time (newest first)
            backups.sort(key=lambda x: x['created'], reverse=True)
            
            return {"success": True, "backups": backups}
        else:
            raise HTTPException(status_code=500, detail=f"Failed to list backups: {result.stderr}")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list backups: {str(e)}")


@router.get("/info")
async def backup_info():
    """Get backup system information"""
    try:
        from app.core.config import Settings
        import os
        
        settings = Settings()
        db_path = settings.get_database_path()
        backup_dir = settings.get_backup_dir()
        
        info = {
            "database_path": db_path,
            "database_exists": os.path.exists(db_path),
            "database_size": os.path.getsize(db_path) if os.path.exists(db_path) else 0,
            "backup_directory": backup_dir,
            "backup_dir_exists": os.path.exists(backup_dir)
        }
        
        if os.path.exists(db_path):
            info["database_size_mb"] = round(info["database_size"] / (1024 * 1024), 2)
        
        return {"success": True, "info": info}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get backup info: {str(e)}")


