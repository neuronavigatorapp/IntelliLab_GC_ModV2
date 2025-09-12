#!/usr/bin/env python3
"""
QC Rules Evaluation Service - Westgard Rules Implementation
"""

import logging
from typing import List, Dict, Tuple, Any
from datetime import datetime

from app.models.schemas import QCTimeSeriesPoint, QCRuleHit, QCResult, QCPolicy

logger = logging.getLogger(__name__)


class QCRulesService:
    """Service for evaluating Westgard QC rules"""
    
    def __init__(self):
        self.rule_functions = {
            "1-2s": self._rule_1_2s,
            "1-3s": self._rule_1_3s,
            "2-2s": self._rule_2_2s,
            "R-4s": self._rule_r_4s,
            "4-1s": self._rule_4_1s,
            "10-x": self._rule_10_x
        }
    
    def evaluate_rules(self, points: List[QCTimeSeriesPoint], policy: QCPolicy) -> Tuple[List[QCRuleHit], Dict[str, QCResult]]:
        """
        Evaluate Westgard rules for QC time series data
        
        Args:
            points: List of QC time series points (should be ordered by timestamp)
            policy: QC evaluation policy
            
        Returns:
            Tuple of (rule hits, analyte QC results)
        """
        try:
            if not points:
                return [], {}
            
            # Group points by analyte
            analyte_points = self._group_by_analyte(points)
            
            all_rule_hits = []
            analyte_results = {}
            
            for analyte, analyte_series in analyte_points.items():
                # Sort by timestamp to ensure proper order
                analyte_series.sort(key=lambda p: p.timestamp)
                
                # Calculate z-scores for the series
                z_scores = self._calculate_z_scores(analyte_series)
                
                # Evaluate rules for this analyte
                rule_hits = self._evaluate_analyte_rules(analyte, analyte_series, z_scores, policy)
                all_rule_hits.extend(rule_hits)
                
                # Create QC result for the latest point
                if analyte_series:
                    latest_point = analyte_series[-1]
                    latest_z = z_scores[-1] if z_scores else 0.0
                    
                    # Determine flags and status
                    flags = [hit.rule for hit in rule_hits if hit.analyte == analyte and hit.timestamp == latest_point.timestamp]
                    status = self._determine_status(flags, latest_z, policy)
                    
                    analyte_results[analyte] = QCResult(
                        analyte=analyte,
                        value=latest_point.value,
                        unit="ppm",  # Default unit, could be from target
                        zscore=latest_z,
                        flags=flags,
                        status=status
                    )
            
            logger.info(f"Evaluated QC rules for {len(analyte_points)} analytes, found {len(all_rule_hits)} rule hits")
            return all_rule_hits, analyte_results
            
        except Exception as e:
            logger.error(f"Failed to evaluate QC rules: {str(e)}")
            raise
    
    def _group_by_analyte(self, points: List[QCTimeSeriesPoint]) -> Dict[str, List[QCTimeSeriesPoint]]:
        """Group QC points by analyte"""
        analyte_groups = {}
        for point in points:
            if point.analyte not in analyte_groups:
                analyte_groups[point.analyte] = []
            analyte_groups[point.analyte].append(point)
        return analyte_groups
    
    def _calculate_z_scores(self, points: List[QCTimeSeriesPoint]) -> List[float]:
        """Calculate z-scores for a series of QC points"""
        z_scores = []
        for point in points:
            if point.sd > 0:
                z_score = (point.value - point.mean) / point.sd
            else:
                z_score = 0.0
            z_scores.append(z_score)
        return z_scores
    
    def _evaluate_analyte_rules(self, analyte: str, points: List[QCTimeSeriesPoint], 
                               z_scores: List[float], policy: QCPolicy) -> List[QCRuleHit]:
        """Evaluate all Westgard rules for a single analyte"""
        rule_hits = []
        
        # Only evaluate latest point for rule violations
        if not points or not z_scores:
            return rule_hits
        
        latest_point = points[-1]
        
        # Determine which rules to apply based on series length
        n_points = len(points)
        strict_rules = n_points >= policy.requireNBeforeStrict
        
        # Evaluate each rule
        for rule_name, rule_func in self.rule_functions.items():
            try:
                violations = rule_func(z_scores, strict_rules, policy)
                
                # Create rule hits for violations
                for violation_index in violations:
                    if 0 <= violation_index < len(points):
                        violation_point = points[violation_index]
                        violation_z = z_scores[violation_index]
                        
                        rule_hit = QCRuleHit(
                            rule=rule_name,
                            analyte=analyte,
                            value=violation_point.value,
                            zscore=violation_z,
                            runId=f"qc_{violation_point.timestamp.isoformat()}",
                            timestamp=violation_point.timestamp
                        )
                        rule_hits.append(rule_hit)
                        
            except Exception as e:
                logger.warning(f"Failed to evaluate rule {rule_name} for analyte {analyte}: {str(e)}")
        
        return rule_hits
    
    def _rule_1_2s(self, z_scores: List[float], strict_rules: bool, policy: QCPolicy) -> List[int]:
        """1-2s rule: Single point beyond ±2σ"""
        violations = []
        if not z_scores:
            return violations
        
        latest_z = z_scores[-1]
        if abs(latest_z) >= 2.0:
            violations.append(len(z_scores) - 1)
        
        return violations
    
    def _rule_1_3s(self, z_scores: List[float], strict_rules: bool, policy: QCPolicy) -> List[int]:
        """1-3s rule: Single point beyond ±3σ"""
        violations = []
        if not z_scores:
            return violations
        
        latest_z = z_scores[-1]
        if abs(latest_z) >= 3.0:
            violations.append(len(z_scores) - 1)
        
        return violations
    
    def _rule_2_2s(self, z_scores: List[float], strict_rules: bool, policy: QCPolicy) -> List[int]:
        """2-2s rule: Two consecutive points beyond ±2σ on the same side"""
        violations = []
        if len(z_scores) < 2:
            return violations
        
        if not strict_rules:
            return violations  # Only apply in strict mode
        
        # Check last two points
        z1, z2 = z_scores[-2], z_scores[-1]
        
        if (abs(z1) >= 2.0 and abs(z2) >= 2.0 and 
            ((z1 >= 2.0 and z2 >= 2.0) or (z1 <= -2.0 and z2 <= -2.0))):
            violations.extend([len(z_scores) - 2, len(z_scores) - 1])
        
        return violations
    
    def _rule_r_4s(self, z_scores: List[float], strict_rules: bool, policy: QCPolicy) -> List[int]:
        """R-4s rule: Two consecutive points differing by ≥4σ (opposite sides)"""
        violations = []
        if len(z_scores) < 2:
            return violations
        
        if not strict_rules:
            return violations  # Only apply in strict mode
        
        # Check last two points
        z1, z2 = z_scores[-2], z_scores[-1]
        
        if abs(z2 - z1) >= 4.0 and z1 * z2 < 0:  # Opposite sides of mean
            violations.extend([len(z_scores) - 2, len(z_scores) - 1])
        
        return violations
    
    def _rule_4_1s(self, z_scores: List[float], strict_rules: bool, policy: QCPolicy) -> List[int]:
        """4-1s rule: Four consecutive points beyond ±1σ on the same side"""
        violations = []
        if len(z_scores) < 4:
            return violations
        
        if not strict_rules:
            return violations  # Only apply in strict mode
        
        # Check last four points
        last_four = z_scores[-4:]
        
        # All on positive side
        if all(z >= 1.0 for z in last_four):
            violations.extend(range(len(z_scores) - 4, len(z_scores)))
        # All on negative side
        elif all(z <= -1.0 for z in last_four):
            violations.extend(range(len(z_scores) - 4, len(z_scores)))
        
        return violations
    
    def _rule_10_x(self, z_scores: List[float], strict_rules: bool, policy: QCPolicy) -> List[int]:
        """10-x rule: Ten consecutive points on the same side of the mean"""
        violations = []
        if len(z_scores) < 10:
            return violations
        
        if not strict_rules:
            return violations  # Only apply in strict mode
        
        # Check last ten points
        last_ten = z_scores[-10:]
        
        # All on positive side
        if all(z > 0 for z in last_ten):
            violations.extend(range(len(z_scores) - 10, len(z_scores)))
        # All on negative side
        elif all(z < 0 for z in last_ten):
            violations.extend(range(len(z_scores) - 10, len(z_scores)))
        
        return violations
    
    def _determine_status(self, flags: List[str], z_score: float, policy: QCPolicy) -> str:
        """Determine QC status based on rule flags"""
        if not flags:
            return "PASS"
        
        # Critical failures
        if "1-3s" in flags or "2-2s" in flags or "R-4s" in flags or "4-1s" in flags or "10-x" in flags:
            return "FAIL"
        
        # Warning conditions
        if "1-2s" in flags:
            return "WARN" if policy.warnOn1_2s else "PASS"
        
        return "PASS"


# Global service instance
qc_rules_service = QCRulesService()
