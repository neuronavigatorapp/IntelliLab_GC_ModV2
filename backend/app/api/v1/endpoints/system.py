#!/usr/bin/env python3
"""
System endpoints for database backup and management
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import subprocess
import sys
import json
import os
import shutil
import tempfile
from pathlib import Path
from datetime import datetime

router = APIRouter()


@router.post("/backup")
async def create_backup() -> Dict[str, Any]:
    """Create a timestamped backup of the database via /api/v1/system/backup"""
    try:
        # Import here to avoid circular imports
        from app.core.config import Settings
        
        # Run the backup script directly
        script_path = Path(__file__).parent.parent.parent.parent.parent / "scripts" / "backup_database.py"
        
        if not script_path.exists():
            raise HTTPException(status_code=500, detail="Backup script not found")
        
        result = subprocess.run([sys.executable, str(script_path), "backup"], 
                               capture_output=True, text=True, timeout=60)
        
        if result.returncode == 0:
            # Extract backup path from output
            output_lines = result.stdout.strip().split('\n')
            backup_path = None
            for line in output_lines:
                if line.startswith("✅ Backup created successfully:"):
                    backup_path = line.split(":", 1)[1].strip()
                    break
            
            return {
                "success": True, 
                "message": "Backup created successfully",
                "backup_path": backup_path,
                "output": result.stdout.strip()
            }
        else:
            raise HTTPException(status_code=500, detail=f"Backup failed: {result.stderr}")
            
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=500, detail="Backup operation timed out")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create backup: {str(e)}")


@router.get("/data-location")
async def get_data_location() -> Dict[str, Any]:
    """Get database and backup directory locations"""
    try:
        from app.core.config import Settings
        
        settings = Settings()
        db_path = settings.get_database_path()
        backup_dir = settings.get_backup_dir()
        data_dir = settings.get_data_dir()
        
        info = {
            "data_directory": data_dir,
            "database_path": db_path,
            "backup_directory": backup_dir,
            "database_exists": os.path.exists(db_path),
            "backup_dir_exists": os.path.exists(backup_dir)
        }
        
        if os.path.exists(db_path):
            info["database_size"] = os.path.getsize(db_path)
            info["database_size_mb"] = round(info["database_size"] / (1024 * 1024), 2)
            info["last_modified"] = datetime.fromtimestamp(os.path.getmtime(db_path)).isoformat()
        
        return {"success": True, "location": info}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get data location: {str(e)}")


@router.get("/backup/list")
async def list_backups() -> Dict[str, Any]:
    """List all available database backups"""
    try:
        from app.core.config import Settings
        
        settings = Settings()
        backup_dir = Path(settings.get_backup_dir())
        
        backups = []
        if backup_dir.exists():
            for backup_file in backup_dir.glob("intellilab_backup_*.db"):
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
        
        return {"success": True, "backups": backups, "count": len(backups)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list backups: {str(e)}")


@router.get("/health")
async def system_health() -> Dict[str, Any]:
    """Check system health and database connectivity"""
    try:
        from app.core.config import Settings
        from app.core.database import engine
        
        settings = Settings()
        db_path = settings.get_database_path()
        
        health_info = {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "database": {
                "path": db_path,
                "exists": os.path.exists(db_path),
                "accessible": False,
                "size": 0
            },
            "directories": {
                "data_dir": settings.get_data_dir(),
                "backup_dir": settings.get_backup_dir()
            }
        }
        
        # Test database connectivity
        try:
            with engine.connect() as conn:
                result = conn.execute("SELECT 1").fetchone()
                if result:
                    health_info["database"]["accessible"] = True
                    health_info["database"]["size"] = os.path.getsize(db_path)
                    health_info["database"]["size_mb"] = round(health_info["database"]["size"] / (1024 * 1024), 2)
        except Exception as db_error:
            health_info["status"] = "degraded"
            health_info["database"]["error"] = str(db_error)
        
        # Check directory accessibility
        for dir_key, dir_path in health_info["directories"].items():
            try:
                Path(dir_path).mkdir(parents=True, exist_ok=True)
                health_info["directories"][f"{dir_key}_accessible"] = True
            except Exception as dir_error:
                health_info["directories"][f"{dir_key}_accessible"] = False
                health_info["directories"][f"{dir_key}_error"] = str(dir_error)
                health_info["status"] = "degraded"
        
        return health_info
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }


@router.post("/migrate")
async def migrate_database() -> Dict[str, Any]:
    """Run database migrations to ensure schema is up to date"""
    try:
        from app.core.database import Base, engine
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        return {
            "success": True,
            "message": "Database migration completed successfully",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Migration failed: {str(e)}")


@router.get("/selftest")
async def selftest() -> Dict[str, Any]:
    """Comprehensive self-test for system integrity and functionality"""
    try:
        from app.core.config import Settings
        from app.core.database import engine
        
        settings = Settings()
        db_path = settings.get_database_path()
        data_dir = settings.get_data_dir()
        backup_dir = settings.get_backup_dir()
        
        selftest_results = {
            "status": "PASS",
            "timestamp": datetime.now().isoformat(),
            "version": "1.0.2",
            "tests_run": 0,
            "tests_passed": 0,
            "tests_failed": 0,
            "results": {}
        }
        
        def run_test(test_name: str, test_func, *args, **kwargs):
            """Helper to run a test and record results"""
            selftest_results["tests_run"] += 1
            try:
                result = test_func(*args, **kwargs)
                selftest_results["results"][test_name] = {
                    "status": "PASS",
                    "result": result,
                    "error": None
                }
                selftest_results["tests_passed"] += 1
                return True
            except Exception as e:
                selftest_results["results"][test_name] = {
                    "status": "FAIL",
                    "result": None,
                    "error": str(e)
                }
                selftest_results["tests_failed"] += 1
                selftest_results["status"] = "FAIL"
                return False
        
        # Test 1: Database connectivity
        def test_db_connectivity():
            with engine.connect() as conn:
                result = conn.execute("SELECT 1").fetchone()
                return {"accessible": True, "test_query": "SELECT 1", "result": result[0] if result else None}
        
        run_test("database_connectivity", test_db_connectivity)
        
        # Test 2: Database integrity
        def test_db_integrity():
            with engine.connect() as conn:
                result = conn.execute("PRAGMA integrity_check").fetchall()
                integrity_ok = len(result) == 1 and result[0][0] == "ok"
                return {"integrity_check": "ok" if integrity_ok else "failed", "details": [row[0] for row in result]}
        
        run_test("database_integrity", test_db_integrity)
        
        # Test 3: Database path and size
        def test_db_path():
            exists = os.path.exists(db_path)
            size = os.path.getsize(db_path) if exists else 0
            size_mb = round(size / (1024 * 1024), 2)
            return {"path": db_path, "exists": exists, "size_bytes": size, "size_mb": size_mb}
        
        run_test("database_path", test_db_path)
        
        # Test 4: Write test to data directory
        def test_write_access():
            test_file = os.path.join(data_dir, f"selftest_{datetime.now().strftime('%Y%m%d_%H%M%S')}.tmp")
            test_content = f"IntelliLab GC Self-Test - {datetime.now().isoformat()}"
            
            try:
                # Ensure directory exists
                os.makedirs(data_dir, exist_ok=True)
                
                # Write test file
                with open(test_file, 'w') as f:
                    f.write(test_content)
                
                # Read test file
                with open(test_file, 'r') as f:
                    read_content = f.read()
                
                # Verify content
                content_match = read_content == test_content
                
                # Clean up
                os.remove(test_file)
                
                return {"write_ok": True, "content_verified": content_match, "test_file": test_file}
            except Exception as e:
                # Clean up on error
                if os.path.exists(test_file):
                    try:
                        os.remove(test_file)
                    except:
                        pass
                raise e
        
        run_test("write_access", test_write_access)
        
        # Test 5: Free disk space
        def test_free_space():
            data_dir_path = Path(data_dir)
            data_dir_path.mkdir(parents=True, exist_ok=True)
            
            # Get disk usage for data directory
            usage = shutil.disk_usage(data_dir)
            free_gb = round(usage.free / (1024**3), 2)
            total_gb = round(usage.total / (1024**3), 2)
            used_gb = round(usage.used / (1024**3), 2)
            percent_free = round((usage.free / usage.total) * 100, 1)
            
            return {
                "free_gb": free_gb,
                "total_gb": total_gb,
                "used_gb": used_gb,
                "percent_free": percent_free,
                "data_directory": str(data_dir_path)
            }
        
        run_test("free_disk_space", test_free_space)
        
        # Test 6: Backup directory accessibility
        def test_backup_directory():
            backup_path = Path(backup_dir)
            backup_path.mkdir(parents=True, exist_ok=True)
            
            # Test write access to backup directory
            test_backup_file = backup_path / f"selftest_{datetime.now().strftime('%Y%m%d_%H%M%S')}.tmp"
            test_content = "backup test"
            
            try:
                with open(test_backup_file, 'w') as f:
                    f.write(test_content)
                
                backup_writable = True
                os.remove(test_backup_file)
            except:
                backup_writable = False
            
            return {
                "path": str(backup_path),
                "exists": backup_path.exists(),
                "writable": backup_writable
            }
        
        run_test("backup_directory", test_backup_directory)
        
        # Test 7: Schema version check
        def test_schema_versions():
            # Check if key tables exist
            with engine.connect() as conn:
                # Get list of tables
                tables_result = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
                tables = [row[0] for row in tables_result]
                
                # Key tables that should exist
                expected_tables = ['users', 'instruments', 'methods', 'calculations', 'file_uploads']
                missing_tables = [table for table in expected_tables if table not in tables]
                
                return {
                    "tables_found": len(tables),
                    "tables_list": sorted(tables),
                    "expected_tables": expected_tables,
                    "missing_tables": missing_tables,
                    "schema_complete": len(missing_tables) == 0
                }
        
        run_test("schema_versions", test_schema_versions)
        
        # Test 8: Application settings
        def test_application_settings():
            try:
                settings_info = {
                    "data_dir": settings.get_data_dir(),
                    "backup_dir": settings.get_backup_dir(),
                    "database_path": settings.get_database_path(),
                    "log_level": getattr(settings, 'log_level', 'INFO'),
                    "config_loaded": True
                }
                return settings_info
            except Exception as e:
                return {"config_loaded": False, "error": str(e)}
        
        run_test("application_settings", test_application_settings)
        
        # Add overall assessment
        selftest_results["summary"] = {
            "overall_status": selftest_results["status"],
            "success_rate": round((selftest_results["tests_passed"] / selftest_results["tests_run"]) * 100, 1) if selftest_results["tests_run"] > 0 else 0,
            "critical_systems": {
                "database": selftest_results["results"].get("database_connectivity", {}).get("status") == "PASS",
                "storage": selftest_results["results"].get("write_access", {}).get("status") == "PASS",
                "integrity": selftest_results["results"].get("database_integrity", {}).get("status") == "PASS"
            }
        }
        
        return selftest_results
        
    except Exception as e:
        return {
            "status": "FAIL",
            "timestamp": datetime.now().isoformat(),
            "error": f"Self-test failed to execute: {str(e)}",
            "tests_run": 0,
            "tests_passed": 0,
            "tests_failed": 1
        }


@router.get("/version")
async def get_version() -> Dict[str, Any]:
    """Get system version information"""
    try:
        import platform
        
        version_info = {
            "application": "IntelliLab GC",
            "version": "1.0.2",
            "build": "Production-Hardened",
            "platform": {
                "system": platform.system(),
                "version": platform.version(),
                "architecture": platform.architecture()[0],
                "python_version": platform.python_version()
            },
            "timestamp": datetime.now().isoformat()
        }
        
        return version_info
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get version info: {str(e)}")
