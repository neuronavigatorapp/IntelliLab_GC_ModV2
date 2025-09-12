#!/usr/bin/env python3
"""
Database backup script for IntelliLab GC
Creates timestamped backups of the SQLite database
"""

import os
import shutil
import sqlite3
import argparse
import logging
from datetime import datetime, timedelta
from pathlib import Path
import sys
import json
import gzip
import tempfile

# Add the parent directory to sys.path so we can import from backend
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.app.core.config import Settings


def setup_logging(log_file: str = None):
    """Setup logging for backup operations"""
    if not log_file:
        # Create logs directory if it doesn't exist
        script_dir = Path(__file__).parent
        app_root = script_dir.parent
        logs_dir = app_root / "logs"
        logs_dir.mkdir(exist_ok=True)
        log_file = logs_dir / "backup.log"
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler(sys.stdout)
        ]
    )
    return logging.getLogger(__name__)


def verify_database_integrity(db_path: str) -> bool:
    """Verify database integrity before backup"""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("PRAGMA integrity_check")
        result = cursor.fetchone()
        conn.close()
        
        if result and result[0] == "ok":
            return True
        else:
            logging.warning(f"Database integrity check failed: {result}")
            return False
    except Exception as e:
        logging.error(f"Database integrity check error: {e}")
        return False


def compress_backup(backup_path: str, compress: bool = False) -> str:
    """Optionally compress backup file"""
    if not compress:
        return backup_path
    
    compressed_path = backup_path + ".gz"
    try:
        with open(backup_path, 'rb') as f_in:
            with gzip.open(compressed_path, 'wb') as f_out:
                shutil.copyfileobj(f_in, f_out)
        
        # Remove uncompressed file
        os.remove(backup_path)
        logging.info(f"Backup compressed: {compressed_path}")
        return compressed_path
    except Exception as e:
        logging.error(f"Compression failed: {e}")
        return backup_path


def backup_database(custom_backup_dir: str = None, compress: bool = False, 
                   verify_integrity: bool = True) -> str:
    """
    Create a backup of the SQLite database with timestamp
    
    Args:
        custom_backup_dir: Optional custom backup directory
        compress: Whether to compress the backup file
        verify_integrity: Whether to verify database integrity before backup
        
    Returns:
        Path to the created backup file
    """
    logger = logging.getLogger(__name__)
    settings = Settings()
    
    # Get source database path
    source_db = settings.get_database_path()
    
    if not os.path.exists(source_db):
        raise FileNotFoundError(f"Database not found at: {source_db}")
    
    logger.info(f"Starting backup of database: {source_db}")
    
    # Verify database integrity before backup
    if verify_integrity:
        logger.info("Verifying database integrity...")
        if not verify_database_integrity(source_db):
            raise Exception("Database integrity check failed. Backup aborted.")
        logger.info("✓ Database integrity verified")
    
    # Get backup directory
    if custom_backup_dir:
        backup_dir = Path(custom_backup_dir)
        backup_dir.mkdir(parents=True, exist_ok=True)
    else:
        backup_dir = Path(settings.get_backup_dir())
        backup_dir.mkdir(parents=True, exist_ok=True)
    
    # Create timestamped backup filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"intellilab_backup_{timestamp}.db"
    backup_path = backup_dir / backup_filename
    
    logger.info(f"Backup destination: {backup_path}")
    
    start_time = datetime.now()
    
    try:
        # Use SQLite's backup API for proper database copying
        source_conn = sqlite3.connect(source_db)
        backup_conn = sqlite3.connect(str(backup_path))
        
        # Set WAL mode and other PRAGMAs for better performance
        source_conn.execute("PRAGMA journal_mode=WAL")
        
        # Perform the backup with progress tracking
        def progress_callback(status, remaining, total):
            if total > 0:
                percent = ((total - remaining) / total) * 100
                logger.info(f"Backup progress: {percent:.1f}%")
        
        source_conn.backup(backup_conn, pages=1000, progress=progress_callback)
        
        source_conn.close()
        backup_conn.close()
        
        # Verify backup was created and has content
        if os.path.exists(backup_path) and os.path.getsize(backup_path) > 0:
            backup_size = os.path.getsize(backup_path)
            backup_size_mb = backup_size / (1024 * 1024)
            duration = datetime.now() - start_time
            
            logger.info(f"✅ Backup created successfully: {backup_path}")
            logger.info(f"Backup size: {backup_size_mb:.2f} MB")
            logger.info(f"Backup duration: {duration.total_seconds():.2f} seconds")
            
            # Compress backup if requested
            final_backup_path = compress_backup(str(backup_path), compress)
            
            # Create backup metadata
            metadata = {
                "backup_time": datetime.now().isoformat(),
                "source_db": str(source_db),
                "backup_size": os.path.getsize(final_backup_path),
                "backup_size_mb": round(os.path.getsize(final_backup_path) / (1024 * 1024), 2),
                "duration_seconds": duration.total_seconds(),
                "compressed": compress,
                "integrity_verified": verify_integrity,
                "platform": os.name,
                "python_version": sys.version,
                "script_version": "1.0.2"
            }
            
            # Handle metadata for compressed files
            if compress and final_backup_path.endswith('.gz'):
                metadata_path = Path(final_backup_path).with_suffix('.db.gz.meta')
            else:
                metadata_path = Path(final_backup_path).with_suffix('.db.meta')
            
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            logger.info(f"Backup metadata saved: {metadata_path}")
            
            return final_backup_path
        else:
            raise Exception("Backup file was not created or is empty")
            
    except Exception as e:
        # Clean up failed backup
        if os.path.exists(backup_path):
            os.remove(backup_path)
        logger.error(f"Backup failed: {str(e)}")
        raise Exception(f"Backup failed: {str(e)}")


def list_backups() -> list:
    """List all available backups"""
    settings = Settings()
    backup_dir = Path(settings.get_backup_dir())
    
    if not backup_dir.exists():
        return []
    
    backups = []
    for backup_file in backup_dir.glob("intellilab_backup_*.db"):
        metadata_file = backup_file.with_suffix('.db.meta')
        
        backup_info = {
            "file": str(backup_file),
            "size": os.path.getsize(backup_file),
            "created": datetime.fromtimestamp(os.path.getmtime(backup_file)).isoformat()
        }
        
        # Add metadata if available
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
    return backups


def restore_database(backup_path: str) -> bool:
    """
    Restore database from backup
    
    Args:
        backup_path: Path to backup file
        
    Returns:
        True if successful
    """
    settings = Settings()
    target_db = settings.get_database_path()
    
    if not os.path.exists(backup_path):
        raise FileNotFoundError(f"Backup file not found: {backup_path}")
    
    print(f"Restoring from: {backup_path}")
    print(f"Target database: {target_db}")
    
    # Create backup of current database before restore
    if os.path.exists(target_db):
        current_backup = f"{target_db}.restore_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        shutil.copy2(target_db, current_backup)
        print(f"Current database backed up to: {current_backup}")
    
    try:
        # Copy backup to target location
        shutil.copy2(backup_path, target_db)
        print(f"✅ Database restored successfully")
        return True
        
    except Exception as e:
        print(f"❌ Restore failed: {str(e)}")
        return False


def cleanup_old_backups(keep_count: int = 14, keep_days: int = 30):
    """Remove old backup files, keeping only the most recent ones and those within specified days"""
    logger = logging.getLogger(__name__)
    backups = list_backups()
    
    if not backups:
        logger.info("No backups found for cleanup")
        return
    
    logger.info(f"Found {len(backups)} total backups")
    logger.info(f"Cleanup policy: Keep {keep_count} recent backups and all backups within {keep_days} days")
    
    cutoff_date = datetime.now() - timedelta(days=keep_days)
    to_delete = []
    
    # Keep recent backups by count
    recent_backups = backups[:keep_count]
    
    # Check remaining backups for age
    for backup in backups[keep_count:]:
        try:
            backup_date = datetime.fromisoformat(backup['created'].replace('Z', '+00:00'))
            if backup_date < cutoff_date:
                to_delete.append(backup)
            else:
                logger.info(f"Keeping backup within {keep_days} days: {Path(backup['file']).name}")
        except Exception as e:
            logger.warning(f"Could not parse date for {backup['file']}: {e}")
    
    if not to_delete:
        logger.info("No backups need cleanup")
        return
    
    logger.info(f"Will delete {len(to_delete)} old backup files")
    deleted_count = 0
    space_reclaimed = 0
    
    for backup in to_delete:
        try:
            backup_path = Path(backup['file'])
            
            # Handle compressed backups
            if backup_path.suffix == '.gz':
                metadata_path = backup_path.with_suffix('.db.gz.meta')
            else:
                metadata_path = backup_path.with_suffix('.db.meta')
            
            backup_size = backup['size'] if 'size' in backup else 0
            
            # Remove backup file
            if backup_path.exists():
                backup_path.unlink()
                deleted_count += 1
                space_reclaimed += backup_size
                logger.info(f"Deleted backup: {backup_path.name}")
            
            # Remove metadata file
            if metadata_path.exists():
                metadata_path.unlink()
                logger.info(f"Deleted metadata: {metadata_path.name}")
                
        except Exception as e:
            logger.error(f"Could not delete {backup['file']}: {e}")
    
    space_mb = space_reclaimed / (1024 * 1024)
    logger.info(f"✅ Cleanup completed: {deleted_count} files deleted, {space_mb:.2f} MB reclaimed")


def main():
    parser = argparse.ArgumentParser(description="IntelliLab GC Database Backup Tool v1.0.2")
    parser.add_argument('action', choices=['backup', 'list', 'restore', 'cleanup'], 
                       help="Action to perform")
    parser.add_argument('--backup-dir', help="Custom backup directory")
    parser.add_argument('--restore-file', help="Path to backup file for restore")
    parser.add_argument('--keep', type=int, default=14, help="Number of recent backups to keep during cleanup")
    parser.add_argument('--keep-days', type=int, default=30, help="Keep all backups within this many days")
    parser.add_argument('--compress', action='store_true', help="Compress backup files")
    parser.add_argument('--no-integrity-check', action='store_true', help="Skip database integrity check before backup")
    parser.add_argument('--log-file', help="Custom log file path")
    parser.add_argument('--verbose', '-v', action='store_true', help="Enable verbose logging")
    
    args = parser.parse_args()
    
    # Setup logging
    logger = setup_logging(args.log_file)
    if args.verbose:
        logger.setLevel(logging.DEBUG)
    
    logger.info(f"=== IntelliLab GC Database Backup Tool v1.0.2 ===")
    logger.info(f"Action: {args.action}")
    logger.info(f"Timestamp: {datetime.now().isoformat()}")
    
    try:
        if args.action == 'backup':
            backup_path = backup_database(
                custom_backup_dir=args.backup_dir,
                compress=args.compress,
                verify_integrity=not args.no_integrity_check
            )
            logger.info(f"🎉 Backup completed successfully: {backup_path}")
            
            # Auto-cleanup after successful backup
            try:
                cleanup_old_backups(args.keep, args.keep_days)
            except Exception as cleanup_error:
                logger.warning(f"Backup succeeded but cleanup failed: {cleanup_error}")
            
        elif args.action == 'list':
            backups = list_backups()
            if not backups:
                logger.info("No backups found")
            else:
                logger.info(f"Found {len(backups)} backup(s):")
                total_size = 0
                for i, backup in enumerate(backups, 1):
                    size_mb = backup['size'] / (1024 * 1024)
                    total_size += backup['size']
                    compressed_indicator = " (compressed)" if backup['file'].endswith('.gz') else ""
                    logger.info(f"  {i:2d}. {Path(backup['file']).name} ({size_mb:.1f} MB{compressed_indicator}) - {backup['created']}")
                
                total_size_mb = total_size / (1024 * 1024)
                logger.info(f"Total backup storage: {total_size_mb:.1f} MB")
                    
        elif args.action == 'restore':
            if not args.restore_file:
                logger.error("Error: --restore-file required for restore action")
                return 1
            
            logger.warning("⚠️  WARNING: This will replace your current database!")
            logger.warning("Make sure to backup current database before proceeding.")
            
            success = restore_database(args.restore_file)
            if success:
                logger.info("🎉 Database restored successfully")
            else:
                logger.error("❌ Database restore failed")
                return 1
            
        elif args.action == 'cleanup':
            cleanup_old_backups(args.keep, args.keep_days)
            
        return 0
        
    except KeyboardInterrupt:
        logger.warning("Operation cancelled by user")
        return 130
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        if args.verbose:
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
        return 1


if __name__ == '__main__':
    exit(main())
