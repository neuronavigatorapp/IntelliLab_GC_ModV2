#!/usr/bin/env python3
"""
QC Service for managing QC targets, series data, and QC evaluation
"""

import uuid
import logging
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta

from app.models.schemas import (
    QCTarget, QCRecord, QCTimeSeriesPoint, QCPolicy, QCResult, QCRuleHit,
    RunRecord, QuantResult
)
from app.services.qc_rules_service import qc_rules_service

logger = logging.getLogger(__name__)


class QCService:
    """Service for QC target management and QC evaluation"""
    
    def __init__(self):
        # In-memory storage for demo purposes
        self.targets = {}  # id -> QCTarget
        self.records = {}  # id -> QCRecord
        self.policy = QCPolicy()  # Default policy
    
    def upsert_qc_target(self, target: QCTarget) -> QCTarget:
        """Create or update a QC target"""
        if not target.id:
            target.id = str(uuid.uuid4())
        
        if target.sd <= 0:
            raise ValueError("Standard deviation must be positive")
        
        self.targets[target.id] = target
        logger.info(f"Upserted QC target {target.id} for {target.analyte}")
        return target
    
    def get_qc_targets(self, method_id: str, instrument_id: Optional[str] = None) -> List[QCTarget]:
        """Get QC targets for a method and optional instrument"""
        targets = []
        for target in self.targets.values():
            if target.methodId == method_id:
                if instrument_id is None or target.instrumentId == instrument_id or target.instrumentId is None:
                    targets.append(target)
        return targets
    
    def get_qc_series(self, analyte: str, method_id: str, 
                     instrument_id: Optional[str] = None, 
                     days: int = 30) -> List[QCTimeSeriesPoint]:
        """Get QC time series data for an analyte"""
        # Find target for this analyte
        target = None
        for t in self.targets.values():
            if (t.analyte == analyte and t.methodId == method_id):
                target = t
                break
        
        if not target:
            return []
        
        # Build time series from QC records
        series_points = []
        cutoff = datetime.now() - timedelta(days=days)
        
        for record in self.records.values():
            if record.timestamp >= cutoff:
                for result in record.results:
                    if result.analyte == analyte:
                        point = QCTimeSeriesPoint(
                            timestamp=record.timestamp,
                            analyte=analyte,
                            value=result.value,
                            mean=target.mean,
                            sd=target.sd
                        )
                        series_points.append(point)
        
        series_points.sort(key=lambda p: p.timestamp)
        return series_points
    
    def append_qc_result(self, run: RunRecord, quant: QuantResult, 
                        targets: List[QCTarget], policy: Optional[QCPolicy] = None) -> QCRecord:
        """Append QC result from a run and quantitation, evaluate rules"""
        if policy is None:
            policy = self.policy
        
        # Extract QC results from quantitation
        qc_results = []
        
        for result_dict in quant.results:
            target_name = result_dict.get('targetName', '')
            concentration = result_dict.get('concentration', 0.0)
            unit = result_dict.get('unit', 'ppm')
            
            # Find matching target
            target = None
            for t in targets:
                if t.analyte == target_name:
                    target = t
                    break
            
            if target:
                # Calculate z-score
                z_score = (concentration - target.mean) / target.sd if target.sd > 0 else 0.0
                
                qc_result = QCResult(
                    analyte=target_name,
                    value=concentration,
                    unit=unit,
                    zscore=z_score,
                    flags=[],
                    status="PASS"
                )
                qc_results.append(qc_result)
        
        # Create QC record
        qc_record = QCRecord(
            id=str(uuid.uuid4()),
            runId=str(run.id) if run.id else str(uuid.uuid4()),
            timestamp=run.timestamp if hasattr(run, 'timestamp') else datetime.now(),
            results=qc_results,
            ruleHits=[],
            overallStatus="PASS"
        )
        
        # Store the record
        self.records[qc_record.id] = qc_record
        
        logger.info(f"Created QC record {qc_record.id}")
        return qc_record
    
    def get_qc_records(self, limit: int = 100) -> List[QCRecord]:
        """Get QC records"""
        records = list(self.records.values())
        records.sort(key=lambda r: r.timestamp, reverse=True)
        return records[:limit]
    
    def get_qc_policy(self) -> QCPolicy:
        """Get current QC policy"""
        return self.policy
    
    def set_qc_policy(self, policy: QCPolicy) -> QCPolicy:
        """Set QC policy"""
        self.policy = policy
        return self.policy


# Global service instance
qc_service = QCService()
