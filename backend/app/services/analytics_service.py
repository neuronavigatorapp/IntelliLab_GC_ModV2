#!/usr/bin/env python3
"""
Analytics service for Phase 4 - Advanced Analytics & AI Tools
"""

import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import statistics
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)

# Constants and thresholds
DRIFT_THRESHOLD_SEC_PER_RUN = 0.5  # seconds per run
DRIFT_R2_THRESHOLD = 0.5  # minimum R² for drift detection
GHOST_PEAK_AREA_THRESHOLD = 1000  # minimum area for ghost peak detection
SENSITIVITY_DROP_THRESHOLD = 0.2  # 20% drop threshold
MAINTENANCE_EWMA_ALPHA = 0.3  # EWMA smoothing factor
MIN_MAINTENANCE_CONFIDENCE = 0.6  # minimum confidence for maintenance predictions

@dataclass
class DriftResult:
    """Retention drift analysis result"""
    compound: str
    slope: float  # seconds per run
    r_squared: float
    is_drifting: bool
    trend: str  # "increasing", "decreasing", "stable"


@dataclass
class GhostPeakResult:
    """Ghost peak detection result"""
    retention_time: float
    area: float
    confidence: float
    possible_contaminant: Optional[str] = None


@dataclass
class SensitivityResult:
    """Sensitivity analysis result"""
    compound: str
    current_median: float
    previous_median: float
    drop_percentage: float
    is_significant: bool


class AnalyticsService:
    """Analytics service for GC method optimization and diagnostics"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def compute_retention_drift(self, run_history: List[Dict[str, Any]]) -> List[DriftResult]:
        """
        Compute retention time drift for each compound across runs.
        
        Args:
            run_history: List of run records with retention_times
            
        Returns:
            List of drift analysis results
        """
        if len(run_history) < 3:
            return []
        
        # Group by compound
        compounds = set()
        for run in run_history:
            compounds.update(run.get('retention_times', {}).keys())
        
        results = []
        for compound in compounds:
            # Extract retention times and run indices
            data_points = []
            for i, run in enumerate(run_history):
                rt = run.get('retention_times', {}).get(compound)
                if rt is not None:
                    data_points.append((i, rt))
            
            if len(data_points) < 3:
                continue
            
            x_values = [point[0] for point in data_points]
            y_values = [point[1] for point in data_points]
            
            # Linear regression
            slope, r_squared = self._linear_regression(x_values, y_values)
            
            is_drifting = abs(slope) > DRIFT_THRESHOLD_SEC_PER_RUN and r_squared > DRIFT_R2_THRESHOLD
            trend = "increasing" if slope > 0 else "decreasing" if slope < 0 else "stable"
            
            results.append(DriftResult(
                compound=compound,
                slope=slope,
                r_squared=r_squared,
                is_drifting=is_drifting,
                trend=trend
            ))
        
        return results
    
    def detect_ghost_peaks(self, run: Dict[str, Any], method_baseline: Dict[str, Any]) -> List[GhostPeakResult]:
        """
        Detect unexpected peaks not in the method compound list.
        
        Args:
            run: Current run data
            method_baseline: Method compound list and expected retention times
            
        Returns:
            List of detected ghost peaks
        """
        expected_compounds = method_baseline.get('compounds', [])
        expected_rts = method_baseline.get('retention_times', {})
        
        # Find peaks in the run data
        # This is a simplified implementation - in practice, you'd use peak detection algorithms
        peaks = self._extract_peaks_from_run(run)
        
        ghost_peaks = []
        for peak in peaks:
            # Check if peak is near any expected compound
            is_expected = False
            for compound, expected_rt in expected_rts.items():
                if abs(peak['retention_time'] - expected_rt) < 0.1:  # 0.1 min tolerance
                    is_expected = True
                    break
            
            if not is_expected and peak['area'] > GHOST_PEAK_AREA_THRESHOLD:
                confidence = min(peak['area'] / 10000, 1.0)  # Simple confidence based on area
                ghost_peaks.append(GhostPeakResult(
                    retention_time=peak['retention_time'],
                    area=peak['area'],
                    confidence=confidence,
                    possible_contaminant=None
                ))
        
        return ghost_peaks
    
    def sensitivity_drop(self, run_history: List[Dict[str, Any]]) -> List[SensitivityResult]:
        """
        Detect significant drops in peak sensitivity.
        
        Args:
            run_history: List of run records with peak areas
            
        Returns:
            List of sensitivity analysis results
        """
        if len(run_history) < 5:
            return []
        
        # Group by compound
        compounds = set()
        for run in run_history:
            compounds.update(run.get('peak_areas', {}).keys())
        
        results = []
        for compound in compounds:
            areas = []
            for run in run_history:
                area = run.get('peak_areas', {}).get(compound)
                if area is not None:
                    areas.append(area)
            
            if len(areas) < 5:
                continue
            
            # Split into current and previous windows
            split_point = len(areas) // 2
            current_areas = areas[split_point:]
            previous_areas = areas[:split_point]
            
            if len(current_areas) < 2 or len(previous_areas) < 2:
                continue
            
            current_median = statistics.median(current_areas)
            previous_median = statistics.median(previous_areas)
            
            if previous_median > 0:
                drop_percentage = (previous_median - current_median) / previous_median
                is_significant = drop_percentage > SENSITIVITY_DROP_THRESHOLD
                
                results.append(SensitivityResult(
                    compound=compound,
                    current_median=current_median,
                    previous_median=previous_median,
                    drop_percentage=drop_percentage,
                    is_significant=is_significant
                ))
        
        return results
    
    def optimize_method_simple(self, method: Dict[str, Any], run_history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Suggest method optimizations based on historical performance.
        
        Args:
            method: Current method parameters
            run_history: Historical run data
            
        Returns:
            Optimization suggestions
        """
        suggestions = {
            'oven_optimization': {},
            'inlet_optimization': {},
            'confidence': 0.7
        }
        
        # Oven ramp optimization
        if 'oven' in method:
            current_ramp = method['oven'].get('ramp_rate', 10)
            current_initial = method['oven'].get('initial_temp', 50)
            current_final = method['oven'].get('final_temp', 200)
            
            # Analyze retention times to suggest ramp adjustments
            avg_runtime = self._calculate_average_runtime(run_history)
            target_runtime = 15  # minutes
            
            if avg_runtime > target_runtime:
                # Suggest faster ramp
                suggested_ramp = min(current_ramp * 1.2, 20)
                suggestions['oven_optimization'] = {
                    'current_ramp_rate': current_ramp,
                    'suggested_ramp_rate': suggested_ramp,
                    'expected_runtime_reduction': (avg_runtime - target_runtime) * 0.8,
                    'reason': 'Reduce analysis time while maintaining resolution'
                }
        
        # Inlet optimization
        if 'inlet' in method:
            current_split = method['inlet'].get('split_ratio', 10)
            current_temp = method['inlet'].get('temperature', 250)
            
            # Analyze peak areas to optimize split ratio
            avg_peak_area = self._calculate_average_peak_area(run_history)
            target_area = 50000  # arbitrary target
            
            if avg_peak_area < target_area * 0.5:
                # Suggest lower split ratio for better sensitivity
                suggested_split = max(current_split * 0.8, 5)
                suggestions['inlet_optimization'] = {
                    'current_split_ratio': current_split,
                    'suggested_split_ratio': suggested_split,
                    'expected_sensitivity_improvement': 1.25,
                    'reason': 'Improve peak sensitivity'
                }
            elif avg_peak_area > target_area * 2:
                # Suggest higher split ratio to prevent detector saturation
                suggested_split = min(current_split * 1.2, 50)
                suggestions['inlet_optimization'] = {
                    'current_split_ratio': current_split,
                    'suggested_split_ratio': suggested_split,
                    'expected_sensitivity_improvement': 0.8,
                    'reason': 'Prevent detector saturation'
                }
        
        return suggestions
    
    def predict_maintenance(self, consumable_usage: List[Dict[str, Any]], alerts_history: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Predict maintenance needs using EWMA on usage patterns.
        
        Args:
            consumable_usage: List of consumable usage records
            alerts_history: List of maintenance alerts
            
        Returns:
            List of maintenance predictions
        """
        predictions = []
        
        # Group by asset type
        asset_types = ['column', 'liner', 'septa']
        
        for asset_type in asset_types:
            # Filter usage by asset type
            asset_usage = [u for u in consumable_usage if u.get('asset_type') == asset_type]
            
            if not asset_usage:
                continue
            
            # Calculate EWMA of usage rate
            usage_dates = [datetime.fromisoformat(u['usage_date']) for u in asset_usage]
            usage_dates.sort()
            
            # Calculate days between usages
            intervals = []
            for i in range(1, len(usage_dates)):
                interval = (usage_dates[i] - usage_dates[i-1]).days
                intervals.append(interval)
            
            if not intervals:
                continue
            
            # EWMA calculation
            ewma_interval = intervals[0]
            for interval in intervals[1:]:
                ewma_interval = MAINTENANCE_EWMA_ALPHA * interval + (1 - MAINTENANCE_EWMA_ALPHA) * ewma_interval
            
            # Calculate health score based on usage pattern
            avg_interval = statistics.mean(intervals)
            health_score = min(1.0, avg_interval / ewma_interval)
            
            # Estimate days remaining
            days_remaining = int(ewma_interval * health_score)
            
            # Calculate confidence based on data quality
            confidence = min(len(intervals) / 10, 1.0)
            
            if confidence >= MIN_MAINTENANCE_CONFIDENCE:
                predictions.append({
                    'asset_type': asset_type,
                    'health_score': health_score,
                    'days_remaining': days_remaining,
                    'confidence': confidence,
                    'rationale': f'Based on {len(intervals)} usage intervals, average {avg_interval:.1f} days',
                    'recommended_action': self._get_maintenance_action(asset_type, health_score, days_remaining)
                })
        
        return predictions
    
    def cost_optimization(self, consumables: List[Dict[str, Any]], method: Dict[str, Any]) -> Dict[str, Any]:
        """
        Suggest cost optimizations for consumables and method parameters.
        
        Args:
            consumables: Current consumable costs and usage
            method: Current method parameters
            
        Returns:
            Cost optimization suggestions
        """
        current_cost = self._calculate_current_cost(consumables, method)
        suggestions = []
        
        # Analyze each consumable type
        for consumable in consumables:
            current_cost_per_analysis = consumable.get('cost_per_analysis', 0)
            
            # Suggest cheaper alternatives
            if consumable.get('category') == 'liner':
                cheaper_alternatives = self._find_cheaper_alternatives(consumable, 0.8)  # 20% cheaper
                if cheaper_alternatives:
                    suggestions.append({
                        'type': 'consumable_replacement',
                        'current_item': consumable['name'],
                        'suggested_item': cheaper_alternatives[0]['name'],
                        'cost_savings': current_cost_per_analysis - cheaper_alternatives[0]['cost_per_analysis'],
                        'reason': 'Cheaper alternative available'
                    })
            
            # Suggest usage optimization
            usage_optimization = self._suggest_usage_optimization(consumable, method)
            if usage_optimization:
                suggestions.append(usage_optimization)
        
        # Method parameter optimization
        method_optimizations = self._suggest_method_cost_optimizations(method)
        suggestions.extend(method_optimizations)
        
        # Calculate total savings
        total_savings = sum(s.get('cost_savings', 0) for s in suggestions)
        proposed_cost = current_cost - total_savings
        
        return {
            'current_cost_per_analysis': current_cost,
            'proposed_cost_per_analysis': proposed_cost,
            'savings_percentage': (total_savings / current_cost * 100) if current_cost > 0 else 0,
            'suggestions': suggestions,
            'payback_period_days': self._calculate_payback_period(suggestions)
        }
    
    def _linear_regression(self, x: List[float], y: List[float]) -> Tuple[float, float]:
        """Simple linear regression returning slope and R²"""
        if len(x) != len(y) or len(x) < 2:
            return 0.0, 0.0
        
        n = len(x)
        sum_x = sum(x)
        sum_y = sum(y)
        sum_xy = sum(x[i] * y[i] for i in range(n))
        sum_x2 = sum(x[i] ** 2 for i in range(n))
        
        # Calculate slope
        slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x ** 2)
        
        # Calculate R²
        y_mean = sum_y / n
        ss_tot = sum((y[i] - y_mean) ** 2 for i in range(n))
        ss_res = sum((y[i] - (slope * x[i] + (sum_y - slope * sum_x) / n)) ** 2 for i in range(n))
        
        r_squared = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0
        
        return slope, r_squared
    
    def _extract_peaks_from_run(self, run: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract peaks from run data (simplified implementation)"""
        # This would typically use peak detection algorithms
        # For now, return mock peaks based on retention times
        peaks = []
        retention_times = run.get('retention_times', {})
        peak_areas = run.get('peak_areas', {})
        
        for compound, rt in retention_times.items():
            area = peak_areas.get(compound, 1000)
            peaks.append({
                'retention_time': rt,
                'area': area,
                'compound': compound
            })
        
        return peaks
    
    def _calculate_average_runtime(self, run_history: List[Dict[str, Any]]) -> float:
        """Calculate average runtime from run history"""
        if not run_history:
            return 15.0  # default
        
        # Mock calculation - in practice, you'd extract actual runtime
        return 15.0
    
    def _calculate_average_peak_area(self, run_history: List[Dict[str, Any]]) -> float:
        """Calculate average peak area from run history"""
        if not run_history:
            return 50000.0  # default
        
        all_areas = []
        for run in run_history:
            areas = run.get('peak_areas', {}).values()
            all_areas.extend(areas)
        
        return statistics.mean(all_areas) if all_areas else 50000.0
    
    def _get_maintenance_action(self, asset_type: str, health_score: float, days_remaining: int) -> str:
        """Get recommended maintenance action"""
        if days_remaining < 7:
            return f"Replace {asset_type} immediately"
        elif days_remaining < 30:
            return f"Schedule {asset_type} replacement within 2 weeks"
        elif health_score < 0.5:
            return f"Monitor {asset_type} closely - consider replacement"
        else:
            return f"{asset_type} in good condition"
    
    def _calculate_current_cost(self, consumables: List[Dict[str, Any]], method: Dict[str, Any]) -> float:
        """Calculate current cost per analysis"""
        total_cost = 0.0
        
        for consumable in consumables:
            cost_per_analysis = consumable.get('cost_per_analysis', 0)
            total_cost += cost_per_analysis
        
        return total_cost
    
    def _find_cheaper_alternatives(self, consumable: Dict[str, Any], target_ratio: float) -> List[Dict[str, Any]]:
        """Find cheaper alternatives for a consumable"""
        # Mock implementation - in practice, you'd query a database
        return []
    
    def _suggest_usage_optimization(self, consumable: Dict[str, Any], method: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Suggest usage optimizations for a consumable"""
        # Mock implementation
        return None
    
    def _suggest_method_cost_optimizations(self, method: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Suggest method parameter changes to reduce costs"""
        suggestions = []
        
        # Example: optimize split ratio to reduce consumable usage
        if 'inlet' in method:
            current_split = method['inlet'].get('split_ratio', 10)
            if current_split < 20:
                suggestions.append({
                    'type': 'method_parameter',
                    'parameter': 'split_ratio',
                    'current_value': current_split,
                    'suggested_value': min(current_split * 1.5, 30),
                    'cost_savings': 0.5,  # Mock savings
                    'reason': 'Increase split ratio to reduce consumable usage'
                })
        
        return suggestions
    
    def _calculate_payback_period(self, suggestions: List[Dict[str, Any]]) -> Optional[float]:
        """Calculate payback period for cost optimizations"""
        total_savings = sum(s.get('cost_savings', 0) for s in suggestions)
        if total_savings <= 0:
            return None
        
        # Mock calculation - in practice, you'd consider implementation costs
        return 30.0  # 30 days
