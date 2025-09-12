#!/usr/bin/env python3
"""
Audit Service for IntelliLab GC
Handles audit trail logging and retrieval for 21 CFR Part 11 compliance
"""

import sqlite3
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from pathlib import Path

from app.models.schemas import AuditLogEntry, AuditLogFilter
from .security_service import hash_record, chain_hash


class AuditService:
    """Audit trail management service"""
    
    def __init__(self, db_path: str = "intellilab_gc.db"):
        self.db_path = db_path
        self._init_db()
    
    def _init_db(self):
        """Initialize audit database tables"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS audit_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
                    user TEXT NOT NULL,
                    action TEXT NOT NULL,
                    entity_type TEXT NOT NULL,
                    entity_id TEXT,
                    details TEXT,
                    ip_address TEXT,
                    user_agent TEXT,
                    object_hash TEXT,
                    prev_hash TEXT,
                    chain_hash TEXT
                )
            """)
            
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp 
                ON audit_log (timestamp)
            """)
            
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_audit_log_user 
                ON audit_log (user)
            """)
            
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_audit_log_entity 
                ON audit_log (entity_type, entity_id)
            """)
    
    def log_action(
        self,
        user: str,
        action: str,
        entity_type: str,
        entity_id: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> AuditLogEntry:
        """Log an audit action"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            details_json = json.dumps(details) if details else None

            # Compute per-object hash and chain
            object_payload = {
                "entity_type": entity_type,
                "entity_id": entity_id,
                "action": action,
                "details": details or {},
            }
            object_hash_val = hash_record(object_payload)

            # Fetch previous chain hash for this object
            prev_row = None
            if entity_id is not None:
                prev_cur = conn.execute(
                    """
                    SELECT chain_hash FROM audit_log
                    WHERE entity_type = ? AND entity_id = ?
                    ORDER BY id DESC LIMIT 1
                    """,
                    (entity_type, entity_id),
                )
                prev_row = prev_cur.fetchone()
            prev_hash_val = prev_row["chain_hash"] if prev_row else None
            chain_hash_val = chain_hash(prev_hash_val, object_hash_val)
            
            cursor = conn.execute("""
                INSERT INTO audit_log (
                    user, action, entity_type, entity_id, details,
                    ip_address, user_agent, object_hash, prev_hash, chain_hash
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user, action, entity_type, entity_id, details_json,
                ip_address, user_agent, object_hash_val, prev_hash_val, chain_hash_val
            ))
            
            entry_id = cursor.lastrowid
            
            # Return the created entry
            cursor = conn.execute("""
                SELECT * FROM audit_log WHERE id = ?
            """, (entry_id,))
            
            row = cursor.fetchone()
            return AuditLogEntry(**dict(row))
    
    def get_audit_log(self, filters: Optional[AuditLogFilter] = None) -> List[AuditLogEntry]:
        """Get audit log entries with optional filters"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            
            query = "SELECT * FROM audit_log WHERE 1=1"
            params = []
            
            if filters:
                if filters.start_date:
                    query += " AND timestamp >= ?"
                    params.append(filters.start_date.isoformat())
                
                if filters.end_date:
                    query += " AND timestamp <= ?"
                    params.append(filters.end_date.isoformat())
                
                if filters.user:
                    query += " AND user = ?"
                    params.append(filters.user)
                
                if filters.action:
                    query += " AND action = ?"
                    params.append(filters.action)
                
                if filters.entity_type:
                    query += " AND entity_type = ?"
                    params.append(filters.entity_type)
                
                if filters.entity_id:
                    query += " AND entity_id = ?"
                    params.append(filters.entity_id)
                
                limit = filters.limit
            else:
                limit = 100
            
            query += " ORDER BY timestamp DESC LIMIT ?"
            params.append(limit)
            
            cursor = conn.execute(query, params)
            return [AuditLogEntry(**dict(row)) for row in cursor.fetchall()]
    
    def get_audit_entry(self, entry_id: int) -> Optional[AuditLogEntry]:
        """Get a specific audit log entry"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute("""
                SELECT * FROM audit_log WHERE id = ?
            """, (entry_id,))
            
            row = cursor.fetchone()
            if row:
                return AuditLogEntry(**dict(row))
            return None
    
    def get_entity_audit_trail(
        self, 
        entity_type: str, 
        entity_id: int,
        limit: int = 50
    ) -> List[AuditLogEntry]:
        """Get audit trail for a specific entity"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute("""
                SELECT * FROM audit_log 
                WHERE entity_type = ? AND entity_id = ?
                ORDER BY timestamp DESC 
                LIMIT ?
            """, (entity_type, entity_id, limit))
            
            return [AuditLogEntry(**dict(row)) for row in cursor.fetchall()]
    
    def get_user_audit_trail(
        self, 
        user: str, 
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100
    ) -> List[AuditLogEntry]:
        """Get audit trail for a specific user"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            
            query = "SELECT * FROM audit_log WHERE user = ?"
            params = [user]
            
            if start_date:
                query += " AND timestamp >= ?"
                params.append(start_date.isoformat())
            
            if end_date:
                query += " AND timestamp <= ?"
                params.append(end_date.isoformat())
            
            query += " ORDER BY timestamp DESC LIMIT ?"
            params.append(limit)
            
            cursor = conn.execute(query, params)
            return [AuditLogEntry(**dict(row)) for row in cursor.fetchall()]
    
    def get_audit_summary(
        self, 
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Get audit log summary statistics"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            
            query = "SELECT * FROM audit_log WHERE 1=1"
            params = []
            
            if start_date:
                query += " AND timestamp >= ?"
                params.append(start_date.isoformat())
            
            if end_date:
                query += " AND timestamp <= ?"
                params.append(end_date.isoformat())
            
            cursor = conn.execute(query, params)
            entries = [AuditLogEntry(**dict(row)) for row in cursor.fetchall()]
            
            if not entries:
                return {
                    "total_entries": 0,
                    "unique_users": 0,
                    "action_counts": {},
                    "entity_type_counts": {},
                    "date_range": None
                }
            
            # Calculate summary statistics
            unique_users = len(set(e.user for e in entries))
            action_counts = {}
            entity_type_counts = {}
            
            for entry in entries:
                action_counts[entry.action] = action_counts.get(entry.action, 0) + 1
                entity_type_counts[entry.entity_type] = entity_type_counts.get(entry.entity_type, 0) + 1
            
            return {
                "total_entries": len(entries),
                "unique_users": unique_users,
                "action_counts": action_counts,
                "entity_type_counts": entity_type_counts,
                "date_range": {
                    "start": min(e.timestamp for e in entries),
                    "end": max(e.timestamp for e in entries)
                }
            }
    
    def export_audit_log(
        self, 
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        format: str = "json"
    ) -> str:
        """Export audit log in specified format"""
        entries = self.get_audit_log(AuditLogFilter(
            start_date=start_date,
            end_date=end_date,
            limit=10000  # Large limit for export
        ))
        
        if format.lower() == "json":
            return json.dumps([entry.dict() for entry in entries], indent=2)
        elif format.lower() == "csv":
            import csv
            import io
            
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Write header
            writer.writerow([
                "ID", "Timestamp", "User", "Action", "Entity Type", 
                "Entity ID", "Details", "IP Address", "User Agent"
            ])
            
            # Write data
            for entry in entries:
                writer.writerow([
                    entry.id, entry.timestamp, entry.user, entry.action,
                    entry.entity_type, entry.entity_id, entry.details,
                    entry.ip_address, entry.user_agent
                ])
            
            return output.getvalue()
        else:
            raise ValueError(f"Unsupported format: {format}")
    
    def cleanup_old_entries(self, days_to_keep: int = 365) -> int:
        """Clean up audit log entries older than specified days"""
        cutoff_date = datetime.now() - timedelta(days=days_to_keep)
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                DELETE FROM audit_log 
                WHERE timestamp < ?
            """, (cutoff_date.isoformat(),))
            
            return cursor.rowcount


# Global audit service instance
audit_service = AuditService()
