#!/usr/bin/env python3
"""
Security utilities for 21 CFR Part 11 support
 - Canonical record hashing
 - Hash-chain utilities
 - Simple RBAC helper
"""

from __future__ import annotations

import hashlib
import hmac
import json
from typing import Any, Dict, Optional

from app.models.schemas import User


def _to_canonical_json(data: Any) -> str:
    """Serialize data into a canonical JSON string for stable hashing."""
    try:
        return json.dumps(data, sort_keys=True, separators=(",", ":"), ensure_ascii=False, default=str)
    except Exception:
        # Fallback: stringify if data contains non-serializable objects
        return json.dumps(str(data))


def hash_record(record: Dict[str, Any]) -> str:
    """Compute a SHA-256 hash over a canonical representation of the record."""
    canonical = _to_canonical_json(record)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def chain_hash(prev_hash: Optional[str], current_hash: str) -> str:
    """Derive a new chain hash by combining previous hash with current object hash."""
    base = (prev_hash or "").encode("utf-8") + current_hash.encode("utf-8")
    return hashlib.sha256(base).hexdigest()


def hmac_signature(secret: str, payload: str) -> str:
    """Create an HMAC-SHA256 signature of the payload with the given secret."""
    return hmac.new(secret.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).hexdigest()


# Very simple RBAC helper
def can(user: User, action: str, object_type: str) -> bool:
    """
    Determine whether a user can perform an action on an object type.

    Mapping strategy:
      - ADMIN -> full access
      - SCIENTIST/TECHNICIAN -> analyst-level (create/update most domain objects)
      - VIEWER -> read-only
      - If department appears to be QC, treat as qc role with signing permissions on QC records
    """
    role_value = getattr(user.role, "value", str(user.role)).lower()
    department = (user.department or "").lower()

    if role_value == "admin":
        return True

    if role_value in ("scientist", "technician"):
        # Analyst privileges: can create/update calibrations, sequences, runs; not delete signed objects
        if action in ("read", "create", "update"):
            return True
        return False

    if role_value == "viewer":
        return action == "read"

    # QC department specific rules
    if "qc" in department:
        if object_type in ("qcRecord", "sequence") and action in ("read", "create", "update", "sign"):
            return True

    # Default deny
    return False


