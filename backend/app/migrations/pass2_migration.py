#!/usr/bin/env python3
"""
Pass 2 Database Migration Script
Adds new tables and columns for enhanced simulation, AI diagnostics, and work modes.
"""

import os
import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, text
from app.core.config import settings
from app.core.database import Base, engine
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def run_pass2_migration():
    """Run Pass 2 database migration."""
    
    logger.info("Starting Pass 2 database migration...")
    
    try:
        # Create all new tables (this will only create tables that don't exist)
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Created new tables for Pass 2")
        
        # Check if new columns need to be added to existing tables
        with engine.connect() as conn:
            # Check and add any missing columns
            _add_missing_columns(conn)
            
            # Populate method presets if they don't exist
            _populate_method_presets(conn)
            
            # Create indexes for performance
            _create_indexes(conn)
            
        logger.info("✅ Pass 2 migration completed successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {str(e)}")
        return False


def _add_missing_columns(conn):
    """Add any missing columns to existing tables."""
    logger.info("Checking for missing columns...")
    
    # List of columns to check/add
    column_checks = [
        # Example: Add favorite column to sandbox_runs if needed
        {
            "table": "sandbox_runs", 
            "column": "is_favorite", 
            "definition": "BOOLEAN DEFAULT FALSE"
        },
    ]
    
    for check in column_checks:
        try:
            # Check if column exists
            result = conn.execute(text(f"""
                SELECT COUNT(*) as count 
                FROM pragma_table_info('{check['table']}') 
                WHERE name = '{check['column']}'
            """))
            
            count = result.fetchone()[0]
            
            if count == 0:
                # Column doesn't exist, add it
                conn.execute(text(f"""
                    ALTER TABLE {check['table']} 
                    ADD COLUMN {check['column']} {check['definition']}
                """))
                logger.info(f"✅ Added column {check['column']} to {check['table']}")
            else:
                logger.info(f"✅ Column {check['column']} already exists in {check['table']}")
                
        except Exception as e:
            logger.warning(f"⚠️ Could not add column {check['column']}: {str(e)}")


def _populate_method_presets(conn):
    """Populate standard method presets if they don't exist."""
    logger.info("Checking method presets...")
    
    try:
        # Check if any ASTM presets exist
        result = conn.execute(text("""
            SELECT COUNT(*) as count 
            FROM method_presets 
            WHERE standard_body = 'ASTM'
        """))
        
        count = result.fetchone()[0] if result else 0
        
        if count == 0:
            logger.info("No ASTM presets found. They will be initialized via API endpoint.")
            logger.info("Run: POST /api/v1/method-presets/initialize-standards")
        else:
            logger.info(f"✅ Found {count} ASTM presets")
            
    except Exception as e:
        logger.warning(f"⚠️ Could not check method presets: {str(e)}")


def _create_indexes(conn):
    """Create performance indexes."""
    logger.info("Creating performance indexes...")
    
    indexes = [
        # Simulation profiles indexes
        "CREATE INDEX IF NOT EXISTS idx_simulation_profiles_user ON simulation_profiles(created_by)",
        "CREATE INDEX IF NOT EXISTS idx_simulation_profiles_usage ON simulation_profiles(usage_count DESC)",
        "CREATE INDEX IF NOT EXISTS idx_simulation_profiles_public ON simulation_profiles(is_public)",
        
        # Chromatogram diagnostics indexes
        "CREATE INDEX IF NOT EXISTS idx_chromatogram_diagnostics_run ON chromatogram_diagnostics(run_id)",
        "CREATE INDEX IF NOT EXISTS idx_chromatogram_diagnostics_confidence ON chromatogram_diagnostics(confidence_score DESC)",
        "CREATE INDEX IF NOT EXISTS idx_chromatogram_diagnostics_date ON chromatogram_diagnostics(created_date DESC)",
        
        # Work modes indexes
        "CREATE INDEX IF NOT EXISTS idx_work_modes_user ON work_modes(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_work_modes_last_used ON work_modes(last_used DESC)",
        
        # Enhanced sandbox runs indexes
        "CREATE INDEX IF NOT EXISTS idx_sandbox_runs_sample_name ON sandbox_runs(sample_name)",
        "CREATE INDEX IF NOT EXISTS idx_sandbox_runs_date ON sandbox_runs(created_date DESC)",
        "CREATE INDEX IF NOT EXISTS idx_sandbox_runs_instrument_method ON sandbox_runs(instrument_id, method_id)",
    ]
    
    for index_sql in indexes:
        try:
            conn.execute(text(index_sql))
            logger.info(f"✅ Created index")
        except Exception as e:
            logger.warning(f"⚠️ Could not create index: {str(e)}")


def check_migration_status():
    """Check if Pass 2 migration is needed."""
    
    try:
        with engine.connect() as conn:
            # Check if new tables exist
            tables_to_check = [
                "simulation_profiles",
                "chromatogram_diagnostics", 
                "work_modes"
            ]
            
            existing_tables = []
            for table in tables_to_check:
                result = conn.execute(text(f"""
                    SELECT name FROM sqlite_master 
                    WHERE type='table' AND name='{table}'
                """))
                
                if result.fetchone():
                    existing_tables.append(table)
            
            logger.info(f"Existing Pass 2 tables: {existing_tables}")
            logger.info(f"Missing tables: {set(tables_to_check) - set(existing_tables)}")
            
            return len(existing_tables) == len(tables_to_check)
            
    except Exception as e:
        logger.error(f"Error checking migration status: {str(e)}")
        return False


def rollback_pass2_migration():
    """Rollback Pass 2 migration (use with caution)."""
    
    logger.warning("⚠️ Rolling back Pass 2 migration...")
    
    try:
        with engine.connect() as conn:
            # Drop new tables
            tables_to_drop = [
                "work_modes",
                "chromatogram_diagnostics",
                "simulation_profiles"
            ]
            
            for table in tables_to_drop:
                try:
                    conn.execute(text(f"DROP TABLE IF EXISTS {table}"))
                    logger.info(f"✅ Dropped table {table}")
                except Exception as e:
                    logger.warning(f"⚠️ Could not drop table {table}: {str(e)}")
            
            # Drop indexes
            indexes_to_drop = [
                "idx_simulation_profiles_user",
                "idx_simulation_profiles_usage", 
                "idx_simulation_profiles_public",
                "idx_chromatogram_diagnostics_run",
                "idx_chromatogram_diagnostics_confidence",
                "idx_chromatogram_diagnostics_date",
                "idx_work_modes_user",
                "idx_work_modes_last_used",
                "idx_sandbox_runs_sample_name",
                "idx_sandbox_runs_date",
                "idx_sandbox_runs_instrument_method"
            ]
            
            for index in indexes_to_drop:
                try:
                    conn.execute(text(f"DROP INDEX IF EXISTS {index}"))
                    logger.info(f"✅ Dropped index {index}")
                except Exception as e:
                    logger.warning(f"⚠️ Could not drop index {index}: {str(e)}")
        
        logger.info("✅ Pass 2 rollback completed")
        return True
        
    except Exception as e:
        logger.error(f"❌ Rollback failed: {str(e)}")
        return False


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Pass 2 Database Migration")
    parser.add_argument("--check", action="store_true", help="Check migration status")
    parser.add_argument("--rollback", action="store_true", help="Rollback migration")
    parser.add_argument("--force", action="store_true", help="Force migration even if already applied")
    
    args = parser.parse_args()
    
    if args.check:
        status = check_migration_status()
        if status:
            print("✅ Pass 2 migration appears to be applied")
        else:
            print("❌ Pass 2 migration needed")
        sys.exit(0 if status else 1)
    
    elif args.rollback:
        success = rollback_pass2_migration()
        sys.exit(0 if success else 1)
    
    else:
        # Check if migration is needed
        if not args.force and check_migration_status():
            logger.info("✅ Pass 2 migration already applied. Use --force to reapply.")
            sys.exit(0)
        
        success = run_pass2_migration()
        sys.exit(0 if success else 1)
