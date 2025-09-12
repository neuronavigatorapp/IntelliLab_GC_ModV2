#!/usr/bin/env python3
"""
21 CFR Part 11 Compliance Service
Addresses Dr. Claude's critique on GLP/GMP compliance features
"""

import hashlib
import json
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, relationship
from enum import Enum
from dataclasses import dataclass
import uuid
from loguru import logger


class AuditAction(str, Enum):
    """Audit trail action types"""
    CREATE = "CREATE"
    READ = "READ"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    APPROVE = "APPROVE"
    REJECT = "REJECT"
    SIGN = "SIGN"
    PRINT = "PRINT"
    EXPORT = "EXPORT"


class RecordStatus(str, Enum):
    """Record status for regulatory compliance"""
    DRAFT = "DRAFT"
    REVIEW = "REVIEW"
    APPROVED = "APPROVED"
    ACTIVE = "ACTIVE"
    OBSOLETE = "OBSOLETE"
    ARCHIVED = "ARCHIVED"


@dataclass
class ElectronicSignature:
    """Electronic signature data structure"""
    user_id: str
    timestamp: datetime
    meaning: str  # What the signature means (e.g., "Approved by", "Reviewed by")
    signature_hash: str
    ip_address: str
    workstation_id: str


Base = declarative_base()


class AuditTrail(Base):
    """21 CFR Part 11 compliant audit trail"""
    __tablename__ = "audit_trail"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    user_id = Column(String(50), nullable=False, index=True)
    user_name = Column(String(100), nullable=False)
    action = Column(String(20), nullable=False, index=True)
    table_name = Column(String(50), index=True)
    record_id = Column(String(50), index=True)
    old_value = Column(Text)  # JSON serialized
    new_value = Column(Text)  # JSON serialized
    reason_for_change = Column(String(500))
    electronic_signature = Column(String(128))  # SHA-256 hash
    ip_address = Column(String(45))  # IPv6 compatible
    workstation_id = Column(String(100))
    session_id = Column(String(100))
    application_version = Column(String(20))
    data_integrity_hash = Column(String(128))  # For tamper detection
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Generate data integrity hash
        self.data_integrity_hash = self._generate_integrity_hash()
    
    def _generate_integrity_hash(self) -> str:
        """Generate hash for data integrity verification"""
        data_string = f"{self.user_id}{self.timestamp}{self.action}{self.table_name}{self.record_id}"
        return hashlib.sha256(data_string.encode()).hexdigest()
    
    def verify_integrity(self) -> bool:
        """Verify record has not been tampered with"""
        expected_hash = self._generate_integrity_hash()
        return self.data_integrity_hash == expected_hash


class MethodVersion(Base):
    """Version control for analytical methods (21 CFR Part 11)"""
    __tablename__ = "method_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    method_id = Column(String(50), nullable=False, index=True)
    version_number = Column(String(20), nullable=False)  # e.g., "1.2.3"
    major_version = Column(Integer, nullable=False)
    minor_version = Column(Integer, nullable=False)
    patch_version = Column(Integer, nullable=False)
    
    created_date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_by = Column(String(50), nullable=False)
    created_by_name = Column(String(100), nullable=False)
    
    approved_by = Column(String(50))
    approved_by_name = Column(String(100))
    approval_date = Column(DateTime(timezone=True))
    
    status = Column(String(20), default=RecordStatus.DRAFT.value, nullable=False)
    change_description = Column(Text, nullable=False)
    method_parameters = Column(Text, nullable=False)  # JSON
    validation_data = Column(Text)  # JSON
    
    locked = Column(Boolean, default=False)  # True = locked for compliance
    locked_date = Column(DateTime(timezone=True))
    locked_by = Column(String(50))
    
    # Electronic signatures
    signatures = Column(Text)  # JSON array of ElectronicSignature objects
    
    def add_signature(self, signature: ElectronicSignature):
        """Add electronic signature to method version"""
        if self.signatures:
            sigs = json.loads(self.signatures)
        else:
            sigs = []
        
        sigs.append({
            "user_id": signature.user_id,
            "timestamp": signature.timestamp.isoformat(),
            "meaning": signature.meaning,
            "signature_hash": signature.signature_hash,
            "ip_address": signature.ip_address,
            "workstation_id": signature.workstation_id
        })
        
        self.signatures = json.dumps(sigs)


class ComplianceService:
    """21 CFR Part 11 compliance service"""
    
    def __init__(self, db: Session):
        self.db = db
        
    def create_audit_entry(self,
                          user_id: str,
                          user_name: str,
                          action: AuditAction,
                          table_name: str = None,
                          record_id: str = None,
                          old_value: Any = None,
                          new_value: Any = None,
                          reason_for_change: str = None,
                          ip_address: str = None,
                          workstation_id: str = None,
                          session_id: str = None) -> AuditTrail:
        """Create audit trail entry"""
        
        # Serialize values to JSON
        old_json = json.dumps(old_value, default=str) if old_value else None
        new_json = json.dumps(new_value, default=str) if new_value else None
        
        audit_entry = AuditTrail(
            user_id=user_id,
            user_name=user_name,
            action=action.value,
            table_name=table_name,
            record_id=str(record_id) if record_id else None,
            old_value=old_json,
            new_value=new_json,
            reason_for_change=reason_for_change,
            ip_address=ip_address,
            workstation_id=workstation_id,
            session_id=session_id,
            application_version="1.0.0"  # Should come from config
        )
        
        try:
            self.db.add(audit_entry)
            self.db.commit()
            logger.info(f"Audit entry created: {action.value} by {user_name}")
            return audit_entry
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to create audit entry: {e}")
            raise
    
    def generate_electronic_signature(self,
                                    user_id: str,
                                    password_hash: str,
                                    meaning: str,
                                    data_to_sign: Dict,
                                    ip_address: str,
                                    workstation_id: str) -> ElectronicSignature:
        """Generate electronic signature"""
        
        timestamp = datetime.now(timezone.utc)
        
        # Create signature data
        signature_data = {
            "user_id": user_id,
            "timestamp": timestamp.isoformat(),
            "meaning": meaning,
            "data": data_to_sign,
            "ip_address": ip_address,
            "workstation_id": workstation_id
        }
        
        # Create signature hash (includes password hash for authentication)
        signature_string = json.dumps(signature_data, sort_keys=True) + password_hash
        signature_hash = hashlib.sha256(signature_string.encode()).hexdigest()
        
        return ElectronicSignature(
            user_id=user_id,
            timestamp=timestamp,
            meaning=meaning,
            signature_hash=signature_hash,
            ip_address=ip_address,
            workstation_id=workstation_id
        )
    
    def create_method_version(self,
                            method_id: str,
                            method_parameters: Dict,
                            change_description: str,
                            created_by: str,
                            created_by_name: str,
                            version_type: str = "minor") -> MethodVersion:
        """Create new method version with proper versioning"""
        
        # Get latest version
        latest_version = self.db.query(MethodVersion).filter(
            MethodVersion.method_id == method_id
        ).order_by(
            MethodVersion.major_version.desc(),
            MethodVersion.minor_version.desc(),
            MethodVersion.patch_version.desc()
        ).first()
        
        if latest_version:
            major = latest_version.major_version
            minor = latest_version.minor_version
            patch = latest_version.patch_version
            
            if version_type == "major":
                major += 1
                minor = 0
                patch = 0
            elif version_type == "minor":
                minor += 1
                patch = 0
            else:  # patch
                patch += 1
        else:
            major, minor, patch = 1, 0, 0
        
        version_number = f"{major}.{minor}.{patch}"
        
        method_version = MethodVersion(
            method_id=method_id,
            version_number=version_number,
            major_version=major,
            minor_version=minor,
            patch_version=patch,
            created_by=created_by,
            created_by_name=created_by_name,
            change_description=change_description,
            method_parameters=json.dumps(method_parameters),
            status=RecordStatus.DRAFT.value
        )
        
        try:
            self.db.add(method_version)
            self.db.commit()
            
            # Create audit entry
            self.create_audit_entry(
                user_id=created_by,
                user_name=created_by_name,
                action=AuditAction.CREATE,
                table_name="method_versions",
                record_id=str(method_version.id),
                new_value=method_version.__dict__,
                reason_for_change=f"Created new method version: {change_description}"
            )
            
            logger.info(f"Method version {version_number} created for method {method_id}")
            return method_version
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to create method version: {e}")
            raise
    
    def approve_method_version(self,
                             version_id: int,
                             approved_by: str,
                             approved_by_name: str,
                             signature: ElectronicSignature) -> MethodVersion:
        """Approve method version with electronic signature"""
        
        method_version = self.db.query(MethodVersion).filter(
            MethodVersion.id == version_id
        ).first()
        
        if not method_version:
            raise ValueError(f"Method version {version_id} not found")
        
        if method_version.status != RecordStatus.DRAFT.value:
            raise ValueError(f"Cannot approve method version in status {method_version.status}")
        
        # Update method version
        old_value = method_version.__dict__.copy()
        
        method_version.approved_by = approved_by
        method_version.approved_by_name = approved_by_name
        method_version.approval_date = datetime.now(timezone.utc)
        method_version.status = RecordStatus.APPROVED.value
        method_version.add_signature(signature)
        
        try:
            self.db.commit()
            
            # Create audit entry
            self.create_audit_entry(
                user_id=approved_by,
                user_name=approved_by_name,
                action=AuditAction.APPROVE,
                table_name="method_versions",
                record_id=str(version_id),
                old_value=old_value,
                new_value=method_version.__dict__,
                reason_for_change="Method version approved"
            )
            
            logger.info(f"Method version {method_version.version_number} approved by {approved_by_name}")
            return method_version
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to approve method version: {e}")
            raise
    
    def lock_method_version(self,
                          version_id: int,
                          locked_by: str,
                          reason: str) -> MethodVersion:
        """Lock method version to prevent changes"""
        
        method_version = self.db.query(MethodVersion).filter(
            MethodVersion.id == version_id
        ).first()
        
        if not method_version:
            raise ValueError(f"Method version {version_id} not found")
        
        if method_version.locked:
            raise ValueError("Method version is already locked")
        
        old_value = method_version.__dict__.copy()
        
        method_version.locked = True
        method_version.locked_date = datetime.now(timezone.utc)
        method_version.locked_by = locked_by
        
        try:
            self.db.commit()
            
            # Create audit entry
            self.create_audit_entry(
                user_id=locked_by,
                user_name="System",
                action=AuditAction.UPDATE,
                table_name="method_versions",
                record_id=str(version_id),
                old_value=old_value,
                new_value=method_version.__dict__,
                reason_for_change=f"Method version locked: {reason}"
            )
            
            logger.info(f"Method version {method_version.version_number} locked")
            return method_version
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to lock method version: {e}")
            raise
    
    def get_audit_trail(self,
                       table_name: str = None,
                       record_id: str = None,
                       user_id: str = None,
                       start_date: datetime = None,
                       end_date: datetime = None,
                       limit: int = 100) -> List[AuditTrail]:
        """Retrieve audit trail records"""
        
        query = self.db.query(AuditTrail)
        
        if table_name:
            query = query.filter(AuditTrail.table_name == table_name)
        if record_id:
            query = query.filter(AuditTrail.record_id == str(record_id))
        if user_id:
            query = query.filter(AuditTrail.user_id == user_id)
        if start_date:
            query = query.filter(AuditTrail.timestamp >= start_date)
        if end_date:
            query = query.filter(AuditTrail.timestamp <= end_date)
        
        return query.order_by(AuditTrail.timestamp.desc()).limit(limit).all()
    
    def verify_data_integrity(self, audit_id: int) -> bool:
        """Verify audit trail record integrity"""
        
        audit_record = self.db.query(AuditTrail).filter(AuditTrail.id == audit_id).first()
        if not audit_record:
            return False
        
        return audit_record.verify_integrity()
    
    def generate_compliance_report(self,
                                 start_date: datetime,
                                 end_date: datetime) -> Dict:
        """Generate compliance report for regulatory inspection"""
        
        audit_records = self.get_audit_trail(
            start_date=start_date,
            end_date=end_date,
            limit=10000
        )
        
        # Analyze audit trail
        users = set()
        actions = {}
        tables = {}
        integrity_issues = []
        
        for record in audit_records:
            users.add(record.user_id)
            
            if record.action not in actions:
                actions[record.action] = 0
            actions[record.action] += 1
            
            if record.table_name:
                if record.table_name not in tables:
                    tables[record.table_name] = 0
                tables[record.table_name] += 1
            
            # Check integrity
            if not record.verify_integrity():
                integrity_issues.append(record.id)
        
        return {
            "report_period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "summary": {
                "total_audit_records": len(audit_records),
                "unique_users": len(users),
                "integrity_issues": len(integrity_issues)
            },
            "activity_breakdown": {
                "by_action": actions,
                "by_table": tables
            },
            "integrity_status": {
                "verified_records": len(audit_records) - len(integrity_issues),
                "integrity_issues": integrity_issues
            },
            "compliance_status": "COMPLIANT" if len(integrity_issues) == 0 else "NON_COMPLIANT"
        }
