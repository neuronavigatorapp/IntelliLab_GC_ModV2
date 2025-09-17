#!/usr/bin/env python3
"""
Bulletproof GC Performance Analyzer & Troubleshooting Recommender
Enterprise-grade performance monitoring with intelligent troubleshooting recommendations
"""

import logging
import time
import functools
from typing import Dict, List, Tuple, Any, Optional
from dataclasses import dataclass
from enum import Enum
import numpy as np
from datetime import datetime
import sys
import os

# Add tool paths for integration
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'tools', 'backflush_calculator'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'tools', 'agilent_scd_simulator'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'tools', 'integrated_gc_simulator'))

# =================== BULLETPROOF ENTERPRISE INFRASTRUCTURE ===================

class PerformanceIssue(Enum):
    """Performance issue categories"""
    POOR_SENSITIVITY = "Poor Sensitivity"
    BASELINE_DRIFT = "Baseline Drift/Noise" 
    PEAK_TAILING = "Peak Tailing/Shape Issues"
    POOR_RESOLUTION = "Poor Chromatographic Resolution"
    LONG_ANALYSIS_TIME = "Extended Analysis Time"
    DETECTOR_CONTAMINATION = "Detector Contamination"
    INLET_DISCRIMINATION = "Inlet Discrimination Issues"
    COLUMN_DEGRADATION = "Column Performance Degradation"
    GAS_FLOW_ISSUES = "Gas Flow/Pressure Problems"
    TEMPERATURE_INSTABILITY = "Temperature Control Issues"

class SeverityLevel(Enum):
    """Issue severity levels"""
    CRITICAL = "Critical - Immediate Action Required"
    HIGH = "High - Schedule Maintenance Soon"
    MEDIUM = "Medium - Monitor and Optimize"
    LOW = "Low - Routine Optimization"

@dataclass
class PerformanceMetrics:
    """Real-time GC performance metrics"""
    signal_to_noise_ratio: float
    baseline_stability_percent: float
    peak_symmetry_factor: float
    resolution_average: float
    sensitivity_pg_ul: float
    analysis_time_min: float
    detector_response_factor: float
    column_efficiency_plates: int
    carrier_flow_stability: float
    temperature_stability: float

@dataclass
class TroubleshootingRecommendation:
    """Intelligent troubleshooting recommendation"""
    issue: PerformanceIssue
    severity: SeverityLevel
    confidence_score: float
    symptoms_detected: List[str]
    root_causes: List[str]
    recommended_tools: List[str]
    immediate_actions: List[str]
    preventive_measures: List[str]
    estimated_impact: str

def setup_bulletproof_logging(name: str) -> logging.Logger:
    """Setup enterprise logging"""
    logger = logging.getLogger(name)
    
    if not logger.handlers:
        logger.setLevel(logging.DEBUG)
        
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        
        try:
            file_handler = logging.FileHandler('gc_performance_analyzer.log', encoding='utf-8')
            file_handler.setLevel(logging.DEBUG)
            
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s'
            )
            
            console_handler.setFormatter(formatter)
            file_handler.setFormatter(formatter)
            
            logger.addHandler(console_handler) 
            logger.addHandler(file_handler)
            
        except Exception:
            logger.addHandler(console_handler)
    
    return logger

def monitor_performance(func):
    """Enterprise performance monitoring decorator"""
    @functools.wraps(func)
    def wrapper(self, *args, **kwargs):
        start_time = time.time()
        method_name = f"{self.__class__.__name__}.{func.__name__}"
        
        self.logger.info(f"Starting {func.__name__} with args: {len(args)}, kwargs: {len(kwargs)}")
        
        try:
            result = func(self, *args, **kwargs)
            execution_time = time.time() - start_time
            self.logger.info(f"Completed {func.__name__} in {execution_time:.3f}s")
            return result
            
        except Exception as e:
            execution_time = time.time() - start_time
            self.logger.error(f"{method_name} failed after {execution_time:.3f}s: {str(e)}")
            raise
    
    return wrapper

class GCPerformanceAnalyzer:
    """Bulletproof Enterprise GC Performance Analyzer & Troubleshooting Recommender"""
    
    def __init__(self):
        # =================== BULLETPROOF INITIALIZATION ===================
        self.logger = setup_bulletproof_logging('core.performance.GCPerformanceAnalyzer')
        self.logger.info("Initializing Bulletproof GC Performance Analyzer")
        
        # Performance monitoring metrics
        self.analyses_performed = 0
        self.recommendations_generated = 0
        self.total_analysis_time = 0.0
        
        # Performance thresholds and diagnostic databases
        self.performance_thresholds = self._load_performance_thresholds()
        self.diagnostic_rules = self._load_diagnostic_rules()
        self.troubleshooting_tools = self._load_troubleshooting_tools()
        self.performance_history = []
        
        # Integration with advanced troubleshooting tools
        self.backflush_calculator = None
        self.scd_simulator = None
        self.integrated_simulator = None
        
        self.logger.info("GC Performance Analyzer initialized successfully")
    
    def _load_performance_thresholds(self) -> Dict[str, Dict]:
        """Load performance thresholds for issue detection"""
        return {
            "signal_to_noise": {
                "excellent": 100.0,
                "good": 50.0,
                "acceptable": 20.0,
                "poor": 10.0,
                "critical": 5.0
            },
            "baseline_stability": {
                "excellent": 95.0,
                "good": 90.0,
                "acceptable": 80.0,
                "poor": 70.0,
                "critical": 50.0
            },
            "peak_symmetry": {
                "excellent": 1.2,
                "good": 1.5,
                "acceptable": 2.0,
                "poor": 3.0,
                "critical": 5.0
            },
            "resolution": {
                "excellent": 2.0,
                "good": 1.5,
                "acceptable": 1.2,
                "poor": 1.0,
                "critical": 0.8
            },
            "analysis_time": {
                "fast": 15.0,
                "normal": 30.0,
                "slow": 45.0,
                "very_slow": 60.0,
                "critical": 90.0
            }
        }
    
    def _load_diagnostic_rules(self) -> Dict[PerformanceIssue, Dict]:
        """Load intelligent diagnostic rules for issue identification"""
        return {
            PerformanceIssue.POOR_SENSITIVITY: {
                "primary_indicators": ["signal_to_noise_ratio", "detector_response_factor"],
                "thresholds": {"signal_to_noise_ratio": 20.0, "detector_response_factor": 0.5},
                "secondary_symptoms": ["weak_peaks", "high_detection_limits"],
                "common_causes": [
                    "Detector contamination or fouling",
                    "Insufficient detector temperature",
                    "Poor gas flow rates (FID: Air/H2, SCD: Air/H2/Ozone)",
                    "Column degradation affecting transfer",
                    "Sample preparation issues",
                    "Inlet discrimination (split injection)"
                ],
                "recommended_tools": ["SCD Simulator", "Detector Simulator", "Inlet Simulator"]
            },
            PerformanceIssue.BASELINE_DRIFT: {
                "primary_indicators": ["baseline_stability_percent", "temperature_stability"],
                "thresholds": {"baseline_stability_percent": 80.0, "temperature_stability": 2.0},
                "secondary_symptoms": ["drifting_baseline", "noise_spikes", "thermal_cycling"],
                "common_causes": [
                    "Temperature control instability",
                    "Gas flow fluctuations",
                    "Detector aging (PMT, electrometer)",
                    "Contaminated gas supply",
                    "Electronic interference",
                    "Column bleed at high temperatures"
                ],
                "recommended_tools": ["SCD Simulator", "Oven Ramp Visualizer", "Temperature Monitor"]
            },
            PerformanceIssue.PEAK_TAILING: {
                "primary_indicators": ["peak_symmetry_factor"],
                "thresholds": {"peak_symmetry_factor": 2.0},
                "secondary_symptoms": ["asymmetric_peaks", "poor_quantitation", "carryover"],
                "common_causes": [
                    "Active sites in column or inlet",
                    "Insufficient temperature (cold spots)",
                    "Column degradation or contamination",
                    "Injector liner contamination",
                    "Dead volume in connections"
                ],
                "recommended_tools": ["Column Analyzer", "Inlet Simulator", "Temperature Optimizer"]
            },
            PerformanceIssue.POOR_RESOLUTION: {
                "primary_indicators": ["resolution_average", "column_efficiency_plates"],
                "thresholds": {"resolution_average": 1.5, "column_efficiency_plates": 50000},
                "secondary_symptoms": ["overlapping_peaks", "poor_separation", "broad_peaks"],
                "common_causes": [
                    "Column degradation or damage",
                    "Incorrect carrier gas flow rate",
                    "Poor temperature programming",
                    "Overloaded column (too much sample)",
                    "Wrong column selection for application"
                ],
                "recommended_tools": ["Oven Ramp Visualizer", "Column Optimizer", "Method Optimizer"]
            },
            PerformanceIssue.LONG_ANALYSIS_TIME: {
                "primary_indicators": ["analysis_time_min"],
                "thresholds": {"analysis_time_min": 45.0},
                "secondary_symptoms": ["extended_runtime", "late_eluting_peaks", "long_cycles"],
                "common_causes": [
                    "Suboptimal temperature programming",
                    "Low carrier gas flow rate",
                    "Heavy matrix contamination",
                    "No backflush implementation",
                    "Conservative method parameters"
                ],
                "recommended_tools": ["Backflush Calculator", "Oven Ramp Optimizer", "Method Accelerator"]
            },
            PerformanceIssue.DETECTOR_CONTAMINATION: {
                "primary_indicators": ["detector_response_factor", "baseline_stability_percent"],
                "thresholds": {"detector_response_factor": 0.7, "baseline_stability_percent": 75.0},
                "secondary_symptoms": ["reduced_sensitivity", "baseline_rise", "memory_effects"],
                "common_causes": [
                    "Sample matrix contamination",
                    "Column bleed contamination",
                    "Inadequate detector maintenance",
                    "Heavy compound accumulation",
                    "Dirty detector surfaces"
                ],
                "recommended_tools": ["SCD Simulator", "Detector Cleaner", "Backflush Calculator"]
            }
        }
    
    def _load_troubleshooting_tools(self) -> Dict[str, Dict]:
        """Load available troubleshooting tools and their capabilities"""
        return {
            "Backflush Calculator": {
                "description": "Optimizes backflush timing for column protection and cycle time reduction",
                "best_for": ["Long analysis times", "Matrix contamination", "Column protection"],
                "output": "Optimal backflush timing and efficiency analysis",
                "integration_method": "calculate_optimal_backflush_timing"
            },
            "Agilent SCD Simulator": {
                "description": "Complete SCD performance simulation and diagnostic system",
                "best_for": ["SCD sensitivity issues", "Sulfur detection problems", "SCD troubleshooting"],
                "output": "SCD performance metrics and component diagnostics",
                "integration_method": "simulate_scd_performance"
            },
            "Integrated GC Simulator": {
                "description": "End-to-end GC method simulation and optimization",
                "best_for": ["Method development", "Performance prediction", "Comprehensive analysis"],
                "output": "Complete method performance analysis and recommendations",
                "integration_method": "simulate_complete_gc_analysis"
            },
            "Inlet Simulator": {
                "description": "Split/splitless inlet optimization and discrimination analysis",
                "best_for": ["Injection issues", "Split discrimination", "Inlet optimization"],
                "output": "Injection efficiency and discrimination factors",
                "integration_method": "calculate_inlet_parameters"
            },
            "Oven Ramp Visualizer": {
                "description": "Temperature program optimization and visualization",
                "best_for": ["Resolution issues", "Analysis time optimization", "Temperature programming"],
                "output": "Optimized temperature programs and retention predictions",
                "integration_method": "optimize_temperature_program"
            },
            "Detector Simulator": {
                "description": "Multi-detector response simulation and optimization",
                "best_for": ["Detector optimization", "Response prediction", "Multi-detector setup"],
                "output": "Detector performance metrics and optimization recommendations",
                "integration_method": "simulate_detector_response"
            }
        }
    
    @monitor_performance
    def analyze_gc_performance(
        self,
        performance_metrics: PerformanceMetrics,
        instrument_config: Dict[str, Any],
        method_parameters: Dict[str, Any]
    ) -> List[TroubleshootingRecommendation]:
        """Analyze GC performance and generate intelligent troubleshooting recommendations"""
        
        self.logger.info("Starting comprehensive GC performance analysis")
        
        # Store performance data for trend analysis
        self.performance_history.append({
            "timestamp": datetime.now(),
            "metrics": performance_metrics,
            "config": instrument_config
        })
        
        recommendations = []
        
        # Analyze each potential performance issue
        for issue_type, diagnostic_rules in self.diagnostic_rules.items():
            confidence_score = self._calculate_issue_confidence(
                performance_metrics, diagnostic_rules
            )
            
            if confidence_score > 0.3:  # Threshold for recommendation
                severity = self._determine_severity(confidence_score, performance_metrics, issue_type)
                
                recommendation = self._generate_recommendation(
                    issue_type, confidence_score, severity, performance_metrics,
                    instrument_config, method_parameters
                )
                
                recommendations.append(recommendation)
        
        # Sort by severity and confidence
        recommendations.sort(key=lambda r: (r.severity.value, -r.confidence_score))
        
        self.analyses_performed += 1
        self.recommendations_generated += len(recommendations)
        
        self.logger.info(f"Performance analysis completed: {len(recommendations)} recommendations generated")
        
        return recommendations
    
    def _calculate_issue_confidence(
        self, 
        metrics: PerformanceMetrics, 
        rules: Dict
    ) -> float:
        """Calculate confidence score for a specific issue type"""
        
        confidence = 0.0
        indicators_checked = 0
        
        # Check primary indicators
        for indicator in rules.get("primary_indicators", []):
            if hasattr(metrics, indicator):
                current_value = getattr(metrics, indicator)
                threshold = rules["thresholds"].get(indicator, 0)
                
                # Calculate deviation from threshold
                if indicator in ["signal_to_noise_ratio", "baseline_stability_percent", 
                              "resolution_average", "detector_response_factor", "column_efficiency_plates"]:
                    # Higher is better
                    if current_value < threshold:
                        deviation = (threshold - current_value) / threshold
                        confidence += min(1.0, deviation * 2)  # Scale deviation to confidence
                else:
                    # Lower is better (like peak_symmetry_factor, analysis_time)
                    if current_value > threshold:
                        deviation = (current_value - threshold) / threshold
                        confidence += min(1.0, deviation)
                
                indicators_checked += 1
        
        # Normalize confidence by number of indicators
        if indicators_checked > 0:
            confidence = confidence / indicators_checked
        
        return min(confidence, 1.0)
    
    def _determine_severity(
        self, 
        confidence: float, 
        metrics: PerformanceMetrics,
        issue_type: PerformanceIssue
    ) -> SeverityLevel:
        """Determine severity level based on confidence and impact"""
        
        # Critical issues based on safety or data integrity
        if (metrics.signal_to_noise_ratio < 5.0 or 
            metrics.baseline_stability_percent < 50.0 or
            issue_type == PerformanceIssue.DETECTOR_CONTAMINATION and confidence > 0.8):
            return SeverityLevel.CRITICAL
        
        # High severity for significant performance degradation
        elif (confidence > 0.7 or 
              metrics.signal_to_noise_ratio < 20.0 or
              metrics.resolution_average < 1.0):
            return SeverityLevel.HIGH
        
        # Medium severity for moderate issues
        elif confidence > 0.5 or metrics.analysis_time_min > 60.0:
            return SeverityLevel.MEDIUM
        
        else:
            return SeverityLevel.LOW
    
    def _generate_recommendation(
        self,
        issue_type: PerformanceIssue,
        confidence: float,
        severity: SeverityLevel,
        metrics: PerformanceMetrics,
        instrument_config: Dict,
        method_parameters: Dict
    ) -> TroubleshootingRecommendation:
        """Generate comprehensive troubleshooting recommendation"""
        
        rules = self.diagnostic_rules[issue_type]
        
        # Detect specific symptoms
        symptoms = self._detect_symptoms(metrics, rules)
        
        # Identify likely root causes
        root_causes = self._identify_root_causes(issue_type, metrics, instrument_config)
        
        # Recommend specific tools
        recommended_tools = self._select_troubleshooting_tools(issue_type, instrument_config)
        
        # Generate immediate actions
        immediate_actions = self._generate_immediate_actions(issue_type, severity, metrics)
        
        # Suggest preventive measures
        preventive_measures = self._generate_preventive_measures(issue_type)
        
        # Estimate impact of resolution
        impact_estimate = self._estimate_resolution_impact(issue_type, metrics)
        
        return TroubleshootingRecommendation(
            issue=issue_type,
            severity=severity,
            confidence_score=confidence,
            symptoms_detected=symptoms,
            root_causes=root_causes,
            recommended_tools=recommended_tools,
            immediate_actions=immediate_actions,
            preventive_measures=preventive_measures,
            estimated_impact=impact_estimate
        )
    
    def _detect_symptoms(self, metrics: PerformanceMetrics, rules: Dict) -> List[str]:
        """Detect specific symptoms from performance metrics"""
        symptoms = []
        
        if metrics.signal_to_noise_ratio < 20:
            symptoms.append("Low signal-to-noise ratio detected")
        
        if metrics.baseline_stability_percent < 80:
            symptoms.append("Baseline instability observed")
        
        if metrics.peak_symmetry_factor > 2.0:
            symptoms.append("Peak tailing/asymmetry detected")
        
        if metrics.resolution_average < 1.5:
            symptoms.append("Poor chromatographic resolution")
        
        if metrics.analysis_time_min > 45:
            symptoms.append("Extended analysis time")
        
        if metrics.detector_response_factor < 0.7:
            symptoms.append("Reduced detector response")
        
        return symptoms
    
    def _identify_root_causes(
        self, 
        issue_type: PerformanceIssue, 
        metrics: PerformanceMetrics,
        instrument_config: Dict
    ) -> List[str]:
        """Identify likely root causes based on issue type and configuration"""
        
        rules = self.diagnostic_rules[issue_type]
        base_causes = rules["common_causes"]
        
        # Filter and prioritize causes based on specific conditions
        likely_causes = []
        
        if issue_type == PerformanceIssue.POOR_SENSITIVITY:
            detector_type = instrument_config.get("detector_type", "Unknown")
            
            if detector_type == "SCD":
                likely_causes.extend([
                    "SCD burner contamination or temperature issues",
                    "PMT voltage optimization needed",
                    "Ozone generator performance degradation"
                ])
            elif detector_type == "FID":
                likely_causes.extend([
                    "FID flame instability or gas flow issues",
                    "Detector contamination from matrix"
                ])
            
            if metrics.detector_response_factor < 0.5:
                likely_causes.append("Severe detector contamination suspected")
        
        elif issue_type == PerformanceIssue.LONG_ANALYSIS_TIME:
            if "backflush" not in instrument_config.get("techniques", []):
                likely_causes.append("No backflush implementation - heavy matrix accumulation")
            
            if metrics.analysis_time_min > 60:
                likely_causes.append("Method requires significant optimization")
        
        # Add base causes
        likely_causes.extend(base_causes[:3])  # Top 3 common causes
        
        return likely_causes[:5]  # Limit to 5 most likely causes
    
    def _select_troubleshooting_tools(
        self, 
        issue_type: PerformanceIssue, 
        instrument_config: Dict
    ) -> List[str]:
        """Select most appropriate troubleshooting tools for the issue"""
        
        recommended_tools = []
        
        # Issue-specific tool selection
        if issue_type == PerformanceIssue.LONG_ANALYSIS_TIME:
            recommended_tools.append("Backflush Calculator")
            recommended_tools.append("Oven Ramp Visualizer") 
        
        elif issue_type == PerformanceIssue.POOR_SENSITIVITY:
            detector_type = instrument_config.get("detector_type", "")
            
            if "SCD" in detector_type:
                recommended_tools.append("Agilent SCD Simulator")
            
            recommended_tools.extend(["Detector Simulator", "Inlet Simulator"])
        
        elif issue_type == PerformanceIssue.POOR_RESOLUTION:
            recommended_tools.extend(["Oven Ramp Visualizer", "Integrated GC Simulator"])
        
        elif issue_type == PerformanceIssue.BASELINE_DRIFT:
            recommended_tools.extend(["SCD Simulator", "Detector Simulator"])
        
        elif issue_type == PerformanceIssue.DETECTOR_CONTAMINATION:
            recommended_tools.extend(["Backflush Calculator", "SCD Simulator"])
        
        # Always suggest integrated simulator for comprehensive analysis
        if "Integrated GC Simulator" not in recommended_tools:
            recommended_tools.append("Integrated GC Simulator")
        
        return recommended_tools[:3]  # Limit to top 3 tools
    
    def _generate_immediate_actions(
        self,
        issue_type: PerformanceIssue,
        severity: SeverityLevel,
        metrics: PerformanceMetrics
    ) -> List[str]:
        """Generate immediate action steps"""
        
        actions = []
        
        if severity == SeverityLevel.CRITICAL:
            actions.append("🚨 STOP analysis - investigate immediately")
            actions.append("Check system safety and gas flows")
        
        if issue_type == PerformanceIssue.POOR_SENSITIVITY:
            actions.extend([
                "Run SCD Simulator for component diagnostics",
                "Check detector gas flows and temperatures",
                "Verify sample concentration and injection volume"
            ])
        
        elif issue_type == PerformanceIssue.LONG_ANALYSIS_TIME:
            actions.extend([
                "Calculate optimal backflush timing",
                "Review temperature program for optimization",
                "Consider method acceleration techniques"
            ])
        
        elif issue_type == PerformanceIssue.BASELINE_DRIFT:
            actions.extend([
                "Check temperature stability across system",
                "Verify carrier gas purity and flow stability",
                "Inspect detector for contamination signs"
            ])
        
        return actions
    
    def _generate_preventive_measures(self, issue_type: PerformanceIssue) -> List[str]:
        """Generate preventive maintenance recommendations"""
        
        measures = []
        
        if issue_type == PerformanceIssue.DETECTOR_CONTAMINATION:
            measures.extend([
                "Implement regular backflush cycles",
                "Schedule detector maintenance every 6 months",
                "Use guard columns for matrix protection"
            ])
        
        elif issue_type == PerformanceIssue.POOR_SENSITIVITY:
            measures.extend([
                "Regular SCD component inspection (PMT, burner)",
                "Monthly gas purity verification",
                "Quarterly calibration verification"
            ])
        
        # Universal preventive measures
        measures.extend([
            "Implement predictive maintenance scheduling",
            "Monitor performance trends weekly",
            "Document all maintenance activities"
        ])
        
        return measures
    
    def _estimate_resolution_impact(
        self, 
        issue_type: PerformanceIssue, 
        metrics: PerformanceMetrics
    ) -> str:
        """Estimate impact of resolving the issue"""
        
        if issue_type == PerformanceIssue.LONG_ANALYSIS_TIME:
            potential_reduction = max(20, (metrics.analysis_time_min - 20) / metrics.analysis_time_min * 100)
            return f"Potential {potential_reduction:.0f}% cycle time reduction with backflush optimization"
        
        elif issue_type == PerformanceIssue.POOR_SENSITIVITY:
            return "Expected 2-10x sensitivity improvement with detector optimization"
        
        elif issue_type == PerformanceIssue.POOR_RESOLUTION:
            return "Resolution improvement of 50-200% with method optimization"
        
        elif issue_type == PerformanceIssue.BASELINE_DRIFT:
            return "Baseline stability improvement to >90% with proper maintenance"
        
        else:
            return "Significant performance improvement expected"
    
    @monitor_performance
    def generate_performance_report(
        self, 
        recommendations: List[TroubleshootingRecommendation],
        performance_metrics: PerformanceMetrics
    ) -> str:
        """Generate comprehensive performance analysis report"""
        
        critical_issues = [r for r in recommendations if r.severity == SeverityLevel.CRITICAL]
        high_issues = [r for r in recommendations if r.severity == SeverityLevel.HIGH]
        
        # Calculate overall performance score
        performance_score = self._calculate_overall_score(performance_metrics)
        
        report_lines = [
            "🔍 GC PERFORMANCE ANALYSIS REPORT",
            "=" * 50,
            f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            f"Performance Score: {performance_score:.1f}/100",
            "",
            "📊 CURRENT PERFORMANCE METRICS:",
            f"  • Signal-to-Noise Ratio: {performance_metrics.signal_to_noise_ratio:.1f}:1",
            f"  • Baseline Stability: {performance_metrics.baseline_stability_percent:.1f}%",
            f"  • Peak Symmetry Factor: {performance_metrics.peak_symmetry_factor:.2f}",
            f"  • Average Resolution: {performance_metrics.resolution_average:.2f}",
            f"  • Analysis Time: {performance_metrics.analysis_time_min:.1f} minutes",
            f"  • Detector Response: {performance_metrics.detector_response_factor:.2f}",
            "",
            f"🚨 PERFORMANCE ISSUES DETECTED: {len(recommendations)}",
            f"  • Critical: {len(critical_issues)}",
            f"  • High Priority: {len(high_issues)}",
            f"  • Total Recommendations: {len(recommendations)}",
            ""
        ]
        
        if critical_issues:
            report_lines.extend([
                "🚨 CRITICAL ISSUES - IMMEDIATE ACTION REQUIRED:",
                ""
            ])
            for rec in critical_issues:
                report_lines.extend([
                    f"Issue: {rec.issue.value}",
                    f"Confidence: {rec.confidence_score:.0%}",
                    f"Symptoms: {', '.join(rec.symptoms_detected[:2])}",
                    f"Recommended Tools: {', '.join(rec.recommended_tools)}",
                    f"Immediate Action: {rec.immediate_actions[0] if rec.immediate_actions else 'Contact support'}",
                    ""
                ])
        
        if high_issues:
            report_lines.extend([
                "⚠️ HIGH PRIORITY ISSUES:",
                ""
            ])
            for rec in high_issues:
                report_lines.extend([
                    f"• {rec.issue.value} ({rec.confidence_score:.0%} confidence)",
                    f"  Tools: {', '.join(rec.recommended_tools)}",
                    f"  Impact: {rec.estimated_impact}",
                    ""
                ])
        
        # Tool usage recommendations
        all_tools = set()
        for rec in recommendations:
            all_tools.update(rec.recommended_tools)
        
        if all_tools:
            report_lines.extend([
                "🔧 RECOMMENDED TROUBLESHOOTING TOOLS:",
                ""
            ])
            for tool in sorted(all_tools):
                tool_info = self.troubleshooting_tools.get(tool, {})
                description = tool_info.get("description", "Advanced diagnostic tool")
                report_lines.append(f"  • {tool}: {description}")
            report_lines.append("")
        
        report_lines.extend([
            "📈 ANALYSIS STATISTICS:",
            f"  • Total Analyses Performed: {self.analyses_performed}",
            f"  • Recommendations Generated: {self.recommendations_generated}",
            f"  • Performance History: {len(self.performance_history)} records",
            "",
            "Generated by Bulletproof GC Performance Analyzer v1.0"
        ])
        
        return "\n".join(report_lines)
    
    def _calculate_overall_score(self, metrics: PerformanceMetrics) -> float:
        """Calculate overall GC performance score"""
        
        # Scoring weights for different metrics
        snr_score = min(100, (metrics.signal_to_noise_ratio / 100) * 25)  # 25% weight
        stability_score = (metrics.baseline_stability_percent / 100) * 20  # 20% weight
        symmetry_score = max(0, min(20, (3.0 - metrics.peak_symmetry_factor) / 2.0 * 20))  # 20% weight
        resolution_score = min(20, (metrics.resolution_average / 2.0) * 20)  # 20% weight
        response_score = min(15, metrics.detector_response_factor * 15)  # 15% weight
        
        total_score = snr_score + stability_score + symmetry_score + resolution_score + response_score
        
        return max(0, min(100, total_score))
    
    def get_health_status(self) -> Dict[str, Any]:
        """Get analyzer health status"""
        return {
            "status": "healthy",
            "analyses_performed": self.analyses_performed,
            "recommendations_generated": self.recommendations_generated,
            "average_analysis_time": self.total_analysis_time / max(1, self.analyses_performed),
            "performance_history_size": len(self.performance_history),
            "diagnostic_rules_loaded": len(self.diagnostic_rules),
            "troubleshooting_tools_available": len(self.troubleshooting_tools)
        }

def main():
    """Bulletproof main entry point for performance analysis"""
    logger = setup_bulletproof_logging('core.performance.main')
    
    try:
        logger.info("=== Starting Bulletproof GC Performance Analyzer ===")
        
        analyzer = GCPerformanceAnalyzer()
        
        # Example performance analysis with poor metrics
        poor_metrics = PerformanceMetrics(
            signal_to_noise_ratio=15.0,  # Poor SNR
            baseline_stability_percent=70.0,  # Unstable baseline
            peak_symmetry_factor=3.5,  # Severe tailing
            resolution_average=0.9,  # Poor resolution
            sensitivity_pg_ul=10.0,  # Low sensitivity
            analysis_time_min=65.0,  # Long analysis time
            detector_response_factor=0.4,  # Poor detector response
            column_efficiency_plates=30000,  # Low efficiency
            carrier_flow_stability=85.0,  # Acceptable flow
            temperature_stability=3.0  # Poor temperature control
        )
        
        instrument_config = {
            "detector_type": "Agilent 355 SCD",
            "column": "DB-5ms 30m x 0.25mm",
            "carrier_gas": "Nitrogen"
        }
        
        method_parameters = {
            "injection_volume": 1.0,
            "split_ratio": 10.0,
            "techniques": ["split_injection"]
        }
        
        # Analyze performance and generate recommendations
        recommendations = analyzer.analyze_gc_performance(
            poor_metrics, instrument_config, method_parameters
        )
        
        # Generate comprehensive report
        report = analyzer.generate_performance_report(recommendations, poor_metrics)
        print(report)
        
        print("\n" + "="*60)
        print("🎯 INTELLIGENT TROUBLESHOOTING SYSTEM ACTIVE!")
        print("✅ Performance issues automatically detected")
        print("✅ Advanced tools recommended based on symptoms")
        print("✅ Immediate actions prioritized by severity")
        print("✅ Preventive measures suggested")
        print("="*60)
        
        logger.info("GC performance analysis completed successfully")
        
    except Exception as e:
        logger.error(f"GC performance analysis failed: {str(e)}")
        print(f"❌ Error: {str(e)}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())