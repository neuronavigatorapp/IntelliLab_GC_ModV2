#!/usr/bin/env python3
"""
Electronic signature service for 21 CFR Part 11 features

- Create and list e-signatures
- Assert immutability of signed objects
"""

import sqlite3
from datetime import datetime
from typing import Any, Dict, List, Optional

from app.services.security_service import hash_record, hmac_signature


class ESignService:
    """Simple SQLite-backed e-signature registry."""

    def __init__(self, db_path: str = "intellilab_gc.db", secret_env: Optional[str] = None):
        self.db_path = db_path
        self.secret = secret_env or "intellilab-esign-secret"
        self._init_db()

    def _init_db(self) -> None:
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS esignatures (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
                    object_type TEXT NOT NULL,
                    object_id TEXT NOT NULL,
                    reason TEXT NOT NULL,
                    object_hash TEXT NOT NULL,
                    signature TEXT NOT NULL
                )
                """
            )
            conn.execute(
                """
                CREATE UNIQUE INDEX IF NOT EXISTS idx_esignatures_object
                ON esignatures (object_type, object_id)
                """
            )

    def is_signed(self, object_type: str, object_id: str) -> bool:
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cur = conn.execute(
                "SELECT 1 FROM esignatures WHERE object_type = ? AND object_id = ? LIMIT 1",
                (object_type, object_id),
            )
            return cur.fetchone() is not None

    def assert_not_signed(self, object_type: str, object_id: str) -> None:
        if self.is_signed(object_type, object_id):
            raise ValueError("Object is signed and cannot be modified. Create a new version instead.")

    def sign(self, *, user_id: int, object_type: str, object_id: str, reason: str, object_data: Dict[str, Any]) -> Dict[str, Any]:
        obj_hash = hash_record(object_data)
        payload = f"{object_type}:{object_id}:{obj_hash}:{reason}:{datetime.utcnow().isoformat()}"
        signature = hmac_signature(self.secret, payload)

        with sqlite3.connect(self.db_path) as conn:
            cur = conn.execute(
                """
                INSERT INTO esignatures (user_id, object_type, object_id, reason, object_hash, signature)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (user_id, object_type, object_id, reason, obj_hash, signature),
            )
            esign_id = cur.lastrowid

        return {
            "id": esign_id,
            "userId": user_id,
            "objectType": object_type,
            "objectId": object_id,
            "reason": reason,
            "objectHash": obj_hash,
            "signature": signature,
        }

    def list(self, *, object_type: Optional[str] = None, object_id: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            q = "SELECT * FROM esignatures WHERE 1=1"
            p: List[Any] = []
            if object_type:
                q += " AND object_type = ?"
                p.append(object_type)
            if object_id:
                q += " AND object_id = ?"
                p.append(object_id)
            q += " ORDER BY id DESC LIMIT ?"
            p.append(limit)
            cur = conn.execute(q, p)
            rows = [dict(r) for r in cur.fetchall()]
        return rows


esign_service = ESignService()


