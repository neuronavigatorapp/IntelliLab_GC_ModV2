import os
import json
import sqlite3
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
from pathlib import Path

from ..models.schemas import SyncEnvelope, PushResult, SyncPullResponse, SyncCursor


class SyncService:
    def __init__(self, db_path: str = "intellilab_gc.db"):
        self.db_path = db_path
        self.ensure_sync_tables()
    
    def ensure_sync_tables(self):
        """Create sync-related tables if they don't exist"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Add version columns to existing tables if not present
        tables_to_version = ['instruments', 'methods', 'qc_records', 'inventory']
        for table in tables_to_version:
            try:
                cursor.execute(f"ALTER TABLE {table} ADD COLUMN version INTEGER DEFAULT 1")
            except sqlite3.OperationalError:
                pass  # Column already exists
        
        # Create sync metadata table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sync_metadata (
                entity_type TEXT PRIMARY KEY,
                last_sync_at TEXT,
                version TEXT
            )
        """)
        
        conn.commit()
        conn.close()
    
    def collect_changes(self, since: Optional[datetime] = None) -> Dict[str, List[Dict[str, Any]]]:
        """Collect all changes since the given timestamp"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        changes = {}
        since_str = since.isoformat() if since else "1970-01-01T00:00:00"
        
        # Collect changes from key tables
        tables = {
            'instruments': 'instruments',
            'methods': 'methods', 
            'qc_records': 'qc_records',
            'inventory': 'inventory'
        }
        
        for entity_type, table_name in tables.items():
            cursor.execute(f"""
                SELECT * FROM {table_name} 
                WHERE updated_at > ? OR created_at > ?
                ORDER BY updated_at DESC
            """, (since_str, since_str))
            
            rows = cursor.fetchall()
            changes[entity_type] = [dict(row) for row in rows]
        
        conn.close()
        return changes
    
    def get_current_versions(self) -> Dict[str, str]:
        """Get current version hashes for all entities"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        versions = {}
        tables = ['instruments', 'methods', 'qc_records', 'inventory']
        
        for table in tables:
            cursor.execute(f"SELECT COUNT(*), MAX(updated_at) FROM {table}")
            count, max_updated = cursor.fetchone()
            versions[table] = f"{count}_{max_updated or '0'}"
        
        conn.close()
        return versions
    
    def apply_changes(self, envelope: SyncEnvelope) -> PushResult:
        """Apply client changes with conflict resolution"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        accepted = []
        rejected = []
        conflicts = []
        
        for entity_type, changes in envelope.changes.items():
            for change in changes:
                try:
                    result = self._apply_single_change(cursor, entity_type, change)
                    if result['status'] == 'accepted':
                        accepted.append(f"{entity_type}:{change.get('id', 'new')}")
                    elif result['status'] == 'conflict':
                        conflicts.append({
                            'entity': entity_type,
                            'id': change.get('id'),
                            'client_version': change.get('version'),
                            'server_version': result.get('server_version')
                        })
                    else:
                        rejected.append({
                            'entity': entity_type,
                            'id': change.get('id'),
                            'reason': result.get('reason', 'Unknown error')
                        })
                except Exception as e:
                    rejected.append({
                        'entity': entity_type,
                        'id': change.get('id'),
                        'reason': str(e)
                    })
        
        conn.commit()
        conn.close()
        
        return PushResult(
            accepted=accepted,
            rejected=rejected,
            conflicts=conflicts,
            server_time=datetime.now(timezone.utc)
        )
    
    def _apply_single_change(self, cursor, entity_type: str, change: Dict[str, Any]) -> Dict[str, Any]:
        """Apply a single change with conflict detection"""
        table_name = entity_type
        change_id = change.get('id')
        
        if change_id:
            # Check for conflicts on existing records
            cursor.execute(f"SELECT version, updated_at FROM {table_name} WHERE id = ?", (change_id,))
            existing = cursor.fetchone()
            
            if existing:
                server_version = existing[0]
                client_version = change.get('version', 1)
                
                if client_version < server_version:
                    return {
                        'status': 'conflict',
                        'server_version': server_version
                    }
        
        # Apply the change (upsert)
        if change_id:
            # Update existing
            fields = [k for k in change.keys() if k != 'id' and k != 'created_at']
            set_clause = ', '.join([f"{f} = ?" for f in fields])
            values = [change[f] for f in fields]
            values.append(change_id)
            
            cursor.execute(f"UPDATE {table_name} SET {set_clause} WHERE id = ?", values)
        else:
            # Insert new
            fields = [k for k in change.keys() if k != 'id']
            placeholders = ', '.join(['?' for _ in fields])
            field_names = ', '.join(fields)
            values = [change[f] for f in fields]
            
            cursor.execute(f"INSERT INTO {table_name} ({field_names}) VALUES ({placeholders})", values)
        
        return {'status': 'accepted'}
    
    def pull_changes(self, since: Optional[datetime] = None) -> SyncPullResponse:
        """Pull changes since the given timestamp"""
        changes = self.collect_changes(since)
        versions = self.get_current_versions()
        
        return SyncPullResponse(
            server_time=datetime.now(timezone.utc),
            changes=changes,
            versions=versions
        )


# Global instance
sync_service = SyncService()
