#!/usr/bin/env python3
"""
Method Comparison Service for IntelliLab GC
Provides side-by-side method comparison with statistical analysis
"""

from typing import Dict, List
import statistics

class MethodComparisonService:
    def __init__(self, db):
        self.db = db
    
    def compare_methods(self, method1_data: Dict, method2_data: Dict) -> Dict:
        """Compare two GC methods with statistical analysis"""
        
        # Calculate performance metrics for both methods
        method1_metrics = self._calculate_method_metrics(method1_data)
        method2_metrics = self._calculate_method_metrics(method2_data)
        
        # Perform statistical comparison
        comparison = {
            "method1": {
                "name": method1_data.get("name", "Method 1"),
                "metrics": method1_metrics
            },
            "method2": {
                "name": method2_data.get("name", "Method 2"), 
                "metrics": method2_metrics
            },
            "comparison": self._statistical_comparison(method1_metrics, method2_metrics),
            "recommendations": self._generate_comparison_recommendations(method1_metrics, method2_metrics)
        }
        
        return comparison
    
    def _calculate_method_metrics(self, method_data: Dict) -> Dict:
        """Calculate comprehensive method performance metrics"""
        
        # Detection limit calculation
        detection_limit = self._calculate_detection_limit(method_data)
        
        # Analysis time calculation  
        analysis_time = self._calculate_analysis_time(method_data)
        
        # Efficiency score (0-100)
        efficiency_score = self._calculate_efficiency_score(method_data)
        
        # Cost per analysis
        cost_per_analysis = self._calculate_method_cost(method_data)
        
        # Resolution score (estimated)
        resolution_score = self._calculate_resolution_score(method_data)
        
        return {
            "detection_limit": detection_limit,
            "analysis_time": analysis_time,
            "efficiency_score": efficiency_score,
            "cost_per_analysis": cost_per_analysis,
            "resolution_score": resolution_score,
            "throughput_per_day": 480 / analysis_time  # 8 hour day in minutes
        }
    
    def _calculate_detection_limit(self, method_data: Dict) -> float:
        """Simplified detection limit calculation"""
        
        base_dl = 0.5  # Base detection limit in ppm
        
        # Adjust based on detector type
        detector_factors = {
            'FID': 1.0,
            'ECD': 0.1,  # More sensitive
            'MS': 0.05,  # Most sensitive
            'TCD': 5.0   # Less sensitive
        }
        
        detector = method_data.get('detector_type', 'FID')
        dl_factor = detector_factors.get(detector, 1.0)
        
        # Adjust for injection parameters
        injection_volume = method_data.get('injection_volume', 1.0)
        split_ratio = method_data.get('split_ratio', 10)
        
        # More injection volume and lower split = better detection limit
        injection_factor = (injection_volume / 1.0) * (10 / split_ratio)
        
        detection_limit = base_dl * dl_factor * (1 / injection_factor)
        
        return round(detection_limit, 4)
    
    def _calculate_analysis_time(self, method_data: Dict) -> float:
        """Calculate total analysis time in minutes"""
        
        # Base time for equilibration and injection
        base_time = 5.0
        
        # Temperature program time
        initial_temp = method_data.get('initial_temp', 50)
        final_temp = method_data.get('final_temp', 300)
        ramp_rate = method_data.get('ramp_rate', 10)
        hold_time = method_data.get('hold_time', 5)
        
        ramp_time = (final_temp - initial_temp) / ramp_rate
        program_time = ramp_time + hold_time
        
        # Cool down time
        cooldown_time = (final_temp - 50) / 50  # Assume 50°C/min cooldown
        
        total_time = base_time + program_time + cooldown_time
        
        return round(total_time, 1)
    
    def _calculate_efficiency_score(self, method_data: Dict) -> float:
        """Calculate overall method efficiency score (0-100)"""
        
        # Factors that contribute to efficiency
        scores = []
        
        # Analysis time score (faster = higher score)
        analysis_time = self._calculate_analysis_time(method_data)
        time_score = max(0, 100 - (analysis_time - 20) * 2)  # Penalty after 20 min
        scores.append(max(0, min(100, time_score)))
        
        # Temperature efficiency (optimal range usage)
        temp_range = method_data.get('final_temp', 300) - method_data.get('initial_temp', 50)
        temp_score = 100 - abs(temp_range - 200) / 5  # Optimal ~200°C range
        scores.append(max(0, min(100, temp_score)))
        
        # Injection efficiency
        split_ratio = method_data.get('split_ratio', 10)
        injection_score = 100 - abs(split_ratio - 20) / 2  # Optimal ~20:1 split
        scores.append(max(0, min(100, injection_score)))
        
        return round(statistics.mean(scores), 1)
    
    def _calculate_method_cost(self, method_data: Dict) -> float:
        """Simplified cost calculation"""
        
        analysis_time = self._calculate_analysis_time(method_data)
        
        # Base costs
        consumable_cost = 5.0  # Base consumables per analysis
        labor_cost = (analysis_time / 60) * 30  # $30/hour
        instrument_cost = (analysis_time / 60) * 100  # $100/hour
        
        return round(consumable_cost + labor_cost + instrument_cost, 2)
    
    def _calculate_resolution_score(self, method_data: Dict) -> float:
        """Estimate chromatographic resolution score"""
        
        # Simplified resolution estimation based on temperature program
        ramp_rate = method_data.get('ramp_rate', 10)
        temp_range = method_data.get('final_temp', 300) - method_data.get('initial_temp', 50)
        
        # Slower ramp rates generally give better resolution
        ramp_score = max(0, 100 - (ramp_rate - 5) * 5)
        
        # Adequate temperature range
        range_score = min(100, temp_range / 3)
        
        resolution_score = (ramp_score + range_score) / 2
        
        return round(resolution_score, 1)
    
    def _statistical_comparison(self, metrics1: Dict, metrics2: Dict) -> Dict:
        """Statistical comparison between methods"""
        
        comparisons = {}
        
        for metric in metrics1.keys():
            if metric in metrics2:
                value1 = metrics1[metric]
                value2 = metrics2[metric]
                
                # Calculate percentage difference
                if value1 != 0:
                    pct_diff = ((value2 - value1) / value1) * 100
                else:
                    pct_diff = 0
                
                # Determine which is better (lower is better for DL, time, cost)
                lower_better = metric in ['detection_limit', 'analysis_time', 'cost_per_analysis']
                
                if lower_better:
                    better = "Method 1" if value1 < value2 else "Method 2"
                else:
                    better = "Method 1" if value1 > value2 else "Method 2"
                
                comparisons[metric] = {
                    "method1_value": value1,
                    "method2_value": value2,
                    "percent_difference": round(pct_diff, 1),
                    "better_method": better,
                    "improvement": round(abs(pct_diff), 1)
                }
        
        return comparisons
    
    def _generate_comparison_recommendations(self, metrics1: Dict, metrics2: Dict) -> List[str]:
        """Generate recommendations based on method comparison"""
        
        recommendations = []
        
        # Detection limit comparison
        if metrics1["detection_limit"] < metrics2["detection_limit"]:
            improvement = ((metrics2["detection_limit"] - metrics1["detection_limit"]) / metrics2["detection_limit"]) * 100
            recommendations.append(f"Method 1 provides {improvement:.1f}% better detection limit")
        
        # Analysis time comparison
        if metrics1["analysis_time"] < metrics2["analysis_time"]:
            time_saved = metrics2["analysis_time"] - metrics1["analysis_time"]
            recommendations.append(f"Method 1 saves {time_saved:.1f} minutes per analysis")
        
        # Cost comparison
        if metrics1["cost_per_analysis"] < metrics2["cost_per_analysis"]:
            cost_saved = metrics2["cost_per_analysis"] - metrics1["cost_per_analysis"]
            recommendations.append(f"Method 1 saves ${cost_saved:.2f} per analysis")
        
        # Overall efficiency
        if metrics1["efficiency_score"] > metrics2["efficiency_score"]:
            recommendations.append("Method 1 shows higher overall efficiency")
        elif metrics2["efficiency_score"] > metrics1["efficiency_score"]:
            recommendations.append("Method 2 shows higher overall efficiency")
        
        if not recommendations:
            recommendations.append("Methods show similar performance characteristics")
        
        return recommendations
