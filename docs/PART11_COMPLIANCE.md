IntelliLab GC — 21 CFR Part 11 Implementation Overview

Scope
- Audit trails with per-object hash chain
- Electronic signatures with immutability enforcement
- Role-based access control (admin/analyst/qc/viewer)

Key Components
- backend/app/services/security_service.py: hashing, chain_hash, RBAC helper
- backend/app/services/audit_service.py: SQLite audit log with object_hash, prev_hash, chain_hash
- backend/app/services/esign_service.py: e-sign registry, assert_not_signed
- backend/app/api/v1/endpoints/audit.py: protected audit retrieval
- backend/app/api/v1/endpoints/esign.py: sign/list endpoints

Usage
- Any mutation endpoint calls assert_not_signed(objectType, objectId)
- On successful mutation, append audit event via audit_service.log_action(...)
- Users sign objects via POST /api/v1/esign with {objectType, objectId, reason, objectData}

Limitations
- SQLite backing store used for demo; migrate to enterprise RDBMS for production
- RBAC is coarse; integrate with org/OU policies for fine-grained controls


