"""
Chromatogram Analysis Service
Advanced AI diagnostics for chromatographic data analysis with enhanced capabilities
"""

import numpy as np
import pandas as pd
from scipy import signal
from scipy.optimize import curve_fit
from scipy.stats import linregress
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime
import json
from loguru import logger
from ..core.config import settings

class ChromatogramAnalysisService:
    def __init__(self):
        self.peak_detection_sensitivity = getattr(settings, 'PEAK_DETECTION_SENSITIVITY', 0.1)
        self.baseline_correction = getattr(settings, 'BASELINE_CORRECTION', True)
        self.min_peak_width = 5  # Minimum peak width in data points
        self.noise_threshold = 0.05  # Noise threshold for peak detection
        
    async def analyze_chromatogram(
        self,
        time_data: List[float],
        intensity_data: List[float],
        compound_names: Optional[List[str]] = None,
        method_parameters: Optional[Dict[str, Any]] = None,
        analysis_type: str = "comprehensive"
    ) -> Dict:
        """
        Comprehensive chromatogram analysis with enhanced diagnostics
        """
        try:
            # Validate input data
            if len(time_data) != len(intensity_data):
                return {
                    "error": "Time and intensity data must have the same length",
                    "timestamp": datetime.now().isoformat()
                }
            
            if len(time_data) < 10:
                return {
                    "error": "Insufficient data points for analysis",
                    "timestamp": datetime.now().isoformat()
                }
            
            # Convert to numpy arrays
            time_array = np.array(time_data)
            intensity_array = np.array(intensity_data)
            
            # Perform baseline correction if enabled
            if self.baseline_correction:
                corrected_intensity = self._correct_baseline(intensity_array)
            else:
                corrected_intensity = intensity_array
            
            # Detect peaks with enhanced algorithm
            peaks = self._detect_peaks_enhanced(corrected_intensity, time_array)
            
            # Analyze peak shapes and quality
            peak_analysis = self._analyze_peak_shapes(corrected_intensity, time_array, peaks)
            
            # Calculate quality metrics
            quality_metrics = self._calculate_quality_metrics(
                corrected_intensity, time_array, peaks, method_parameters
            )
            
            # Perform diagnostics
            diagnostics = self._perform_diagnostics(
                corrected_intensity, time_array, peaks, peak_analysis, quality_metrics
            )
            
            # Generate recommendations
            recommendations = self._generate_recommendations(
                diagnostics, quality_metrics, method_parameters
            )
            
            # Assign compounds if provided
            compound_assignments = self._assign_compounds(
                peaks, compound_names, time_array, corrected_intensity
            )
            
            # Calculate resolution metrics
            resolution_metrics = self._calculate_resolution_metrics(peaks, time_array)
            
            return {
                "analysis_timestamp": datetime.now().isoformat(),
                "data_points": len(time_data),
                "peaks_detected": len(peaks),
                "peak_analysis": peak_analysis,
                "quality_metrics": quality_metrics,
                "diagnostics": diagnostics,
                "recommendations": recommendations,
                "compound_assignments": compound_assignments,
                "resolution_metrics": resolution_metrics,
                "baseline_corrected": self.baseline_correction,
                "analysis_type": analysis_type
            }
            
        except Exception as e:
            logger.error(f"Error in chromatogram analysis: {str(e)}")
            return {
                "error": f"Chromatogram analysis error: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }

    def _correct_baseline(self, intensity_data: np.ndarray) -> np.ndarray:
        """Enhanced baseline correction using asymmetric least squares"""
        try:
            # Use asymmetric least squares for baseline correction
            from scipy.sparse import diags
            from scipy.sparse.linalg import spsolve
            
            # Parameters for baseline correction
            lam = 1000  # Smoothness parameter
            p = 0.001   # Asymmetry parameter
            
            # Create sparse matrix for baseline calculation
            n = len(intensity_data)
            D = diags([1, -2, 1], [0, -1, -2], shape=(n, n))
            D = lam * D.dot(D.transpose())
            
            # Solve for baseline
            baseline = spsolve(D + diags([1], [0], shape=(n, n)), intensity_data)
            
            # Return corrected data
            return intensity_data - baseline
            
        except Exception as e:
            logger.warning(f"Baseline correction failed: {str(e)}")
            return intensity_data

    def _detect_peaks_enhanced(
        self,
        intensity_data: np.ndarray,
        time_data: np.ndarray
    ) -> List[Dict[str, Any]]:
        """Enhanced peak detection with multiple algorithms"""
        peaks = []
        
        try:
            # Method 1: Find peaks using scipy
            peak_indices, properties = signal.find_peaks(
                intensity_data,
                height=np.max(intensity_data) * self.peak_detection_sensitivity,
                distance=self.min_peak_width,
                prominence=np.max(intensity_data) * 0.1
            )
            
            # Method 2: Find peaks using peak width analysis
            width_indices, width_properties = signal.find_peaks(
                intensity_data,
                height=np.max(intensity_data) * self.peak_detection_sensitivity,
                width=self.min_peak_width
            )
            
            # Combine and deduplicate peaks
            all_indices = list(set(list(peak_indices) + list(width_indices)))
            
            for idx in all_indices:
                if idx < len(intensity_data):
                    # Calculate peak properties
                    peak_height = intensity_data[idx]
                    peak_time = time_data[idx]
                    
                    # Calculate peak width at half height
                    half_height = peak_height / 2
                    left_idx = idx
                    right_idx = idx
                    
                    # Find left boundary
                    while left_idx > 0 and intensity_data[left_idx] > half_height:
                        left_idx -= 1
                    
                    # Find right boundary
                    while right_idx < len(intensity_data) - 1 and intensity_data[right_idx] > half_height:
                        right_idx += 1
                    
                    peak_width = time_data[right_idx] - time_data[left_idx]
                    
                    # Calculate area (trapezoidal rule)
                    area = np.trapz(
                        intensity_data[left_idx:right_idx + 1],
                        time_data[left_idx:right_idx + 1]
                    )
                    
                    # Calculate asymmetry
                    left_half = intensity_data[left_idx:idx]
                    right_half = intensity_data[idx:right_idx + 1]
                    
                    if len(left_half) > 0 and len(right_half) > 0:
                        asymmetry = (len(right_half) - len(left_half)) / (len(right_half) + len(left_half))
                    else:
                        asymmetry = 0
                    
                    peaks.append({
                        "peak_index": int(idx),
                        "retention_time": float(peak_time),
                        "height": float(peak_height),
                        "width": float(peak_width),
                        "area": float(area),
                        "asymmetry": float(asymmetry),
                        "left_boundary": int(left_idx),
                        "right_boundary": int(right_idx)
                    })
            
            # Sort peaks by retention time
            peaks.sort(key=lambda x: x["retention_time"])
            
            return peaks
            
        except Exception as e:
            logger.error(f"Error in peak detection: {str(e)}")
            return []

    def _analyze_peak_shapes(
        self,
        intensity_data: np.ndarray,
        time_data: np.ndarray,
        peaks: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Analyze peak shapes and quality"""
        try:
            peak_shapes = []
            total_area = 0
            total_width = 0
            
            for i, peak in enumerate(peaks):
                # Determine peak shape
                asymmetry = peak["asymmetry"]
                width = peak["width"]
                height = peak["height"]
                
                if abs(asymmetry) < 0.1:
                    shape = "Gaussian"
                elif asymmetry > 0.1:
                    shape = "Tailing"
                else:
                    shape = "Fronting"
                
                # Determine quality
                if width > 0 and height > 0:
                    efficiency = (peak["retention_time"] / width) ** 2
                    if efficiency > 10000:
                        quality = "Excellent"
                    elif efficiency > 5000:
                        quality = "Good"
                    elif efficiency > 1000:
                        quality = "Fair"
                    else:
                        quality = "Poor"
                else:
                    quality = "Unknown"
                
                peak_shapes.append({
                    "peak_index": i,
                    "shape": shape,
                    "asymmetry": asymmetry,
                    "quality": quality,
                    "efficiency": efficiency if width > 0 and height > 0 else 0,
                    "retention_time": peak["retention_time"],
                    "height": peak["height"],
                    "width": peak["width"],
                    "area": peak["area"]
                })
                
                total_area += peak["area"]
                total_width += peak["width"]
            
            return {
                "total_peaks": len(peaks),
                "average_resolution": self._calculate_average_resolution(peaks),
                "minimum_resolution": self._calculate_minimum_resolution(peaks),
                "peak_shapes": peak_shapes,
                "total_area": total_area,
                "average_peak_width": total_width / len(peaks) if peaks else 0,
                "shape_distribution": self._calculate_shape_distribution(peak_shapes)
            }
            
        except Exception as e:
            logger.error(f"Error in peak shape analysis: {str(e)}")
            return {
                "total_peaks": len(peaks),
                "average_resolution": 0,
                "minimum_resolution": 0,
                "peak_shapes": [],
                "total_area": 0,
                "average_peak_width": 0,
                "shape_distribution": {}
            }

    def _calculate_quality_metrics(
        self,
        intensity_data: np.ndarray,
        time_data: np.ndarray,
        peaks: List[Dict[str, Any]],
        method_parameters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Calculate comprehensive quality metrics"""
        try:
            # Calculate signal-to-noise ratio
            noise_level = np.std(intensity_data[:len(intensity_data)//10])  # Use first 10% for noise
            max_signal = np.max(intensity_data)
            signal_to_noise = max_signal / noise_level if noise_level > 0 else 0
            
            # Calculate baseline stability
            baseline_stability = 1.0 - (np.std(intensity_data) / np.mean(intensity_data)) if np.mean(intensity_data) > 0 else 0
            
            # Calculate peak capacity
            total_time = time_data[-1] - time_data[0]
            average_peak_width = np.mean([p["width"] for p in peaks]) if peaks else 0
            peak_capacity = total_time / average_peak_width if average_peak_width > 0 else 0
            
            # Calculate total analysis time
            total_analysis_time = time_data[-1] - time_data[0]
            
            # Calculate method efficiency
            method_efficiency = self._calculate_method_efficiency(peaks, method_parameters)
            
            return {
                "signal_to_noise_ratio": float(signal_to_noise),
                "baseline_stability": float(baseline_stability),
                "peak_capacity": float(peak_capacity),
                "total_analysis_time": float(total_analysis_time),
                "noise_level": float(noise_level),
                "max_signal": float(max_signal),
                "method_efficiency": method_efficiency,
                "data_quality_score": self._calculate_data_quality_score(
                    signal_to_noise, baseline_stability, peak_capacity
                )
            }
            
        except Exception as e:
            logger.error(f"Error calculating quality metrics: {str(e)}")
            return {
                "signal_to_noise_ratio": 0,
                "baseline_stability": 0,
                "peak_capacity": 0,
                "total_analysis_time": 0,
                "noise_level": 0,
                "max_signal": 0,
                "method_efficiency": 0,
                "data_quality_score": 0
            }

    def _perform_diagnostics(
        self,
        intensity_data: np.ndarray,
        time_data: np.ndarray,
        peaks: List[Dict[str, Any]],
        peak_analysis: Dict[str, Any],
        quality_metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Perform comprehensive diagnostics"""
        try:
            issues = []
            severity_levels = []
            
            # Check for insufficient peaks
            if len(peaks) < 2:
                issues.append("Insufficient peaks detected for meaningful analysis")
                severity_levels.append("HIGH")
            
            # Check signal-to-noise ratio
            if quality_metrics["signal_to_noise_ratio"] < 10:
                issues.append("Low signal-to-noise ratio - consider detector optimization")
                severity_levels.append("MEDIUM")
            
            # Check baseline stability
            if quality_metrics["baseline_stability"] < 0.8:
                issues.append("Unstable baseline - check for contamination or column issues")
                severity_levels.append("HIGH")
            
            # Check peak shapes
            tailing_peaks = [p for p in peak_analysis["peak_shapes"] if p["shape"] == "Tailing"]
            fronting_peaks = [p for p in peak_analysis["peak_shapes"] if p["shape"] == "Fronting"]
            
            if len(tailing_peaks) > len(peaks) * 0.5:
                issues.append("Excessive peak tailing - check column condition and inlet liner")
                severity_levels.append("HIGH")
            
            if len(fronting_peaks) > len(peaks) * 0.3:
                issues.append("Peak fronting detected - check column overload or inlet issues")
                severity_levels.append("MEDIUM")
            
            # Check resolution
            if peak_analysis["average_resolution"] < 1.5:
                issues.append("Poor peak resolution - consider method optimization")
                severity_levels.append("HIGH")
            
            # Check analysis time
            if quality_metrics["total_analysis_time"] > 60:  # More than 1 hour
                issues.append("Long analysis time - consider method optimization")
                severity_levels.append("MEDIUM")
            
            # Determine overall severity
            if "HIGH" in severity_levels:
                overall_severity = "HIGH"
            elif "MEDIUM" in severity_levels:
                overall_severity = "MEDIUM"
            else:
                overall_severity = "LOW"
            
            # Calculate diagnosis confidence
            diagnosis_confidence = self._calculate_diagnosis_confidence(
                len(issues), quality_metrics, peak_analysis
            )
            
            return {
                "issues_detected": len(issues),
                "issues": issues,
                "severity_levels": severity_levels,
                "overall_severity": overall_severity,
                "diagnosis_confidence": diagnosis_confidence,
                "peak_quality_summary": {
                    "excellent_peaks": len([p for p in peak_analysis["peak_shapes"] if p["quality"] == "Excellent"]),
                    "good_peaks": len([p for p in peak_analysis["peak_shapes"] if p["quality"] == "Good"]),
                    "fair_peaks": len([p for p in peak_analysis["peak_shapes"] if p["quality"] == "Fair"]),
                    "poor_peaks": len([p for p in peak_analysis["peak_shapes"] if p["quality"] == "Poor"])
                }
            }
            
        except Exception as e:
            logger.error(f"Error in diagnostics: {str(e)}")
            return {
                "issues_detected": 0,
                "issues": ["Error in diagnostic analysis"],
                "severity_levels": ["UNKNOWN"],
                "overall_severity": "UNKNOWN",
                "diagnosis_confidence": 0,
                "peak_quality_summary": {}
            }

    def _generate_recommendations(
        self,
        diagnostics: Dict[str, Any],
        quality_metrics: Dict[str, Any],
        method_parameters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, str]]:
        """Generate actionable recommendations"""
        recommendations = []
        
        try:
            # Recommendations based on diagnostics
            for issue in diagnostics["issues"]:
                if "signal-to-noise" in issue.lower():
                    recommendations.append({
                        "category": "Detector Optimization",
                        "action": "Increase detector sensitivity or check detector gas flow",
                        "priority": "HIGH",
                        "expected_benefit": "Improved detection limits"
                    })
                
                elif "baseline" in issue.lower():
                    recommendations.append({
                        "category": "Column Maintenance",
                        "action": "Clean or replace column, check for contamination",
                        "priority": "HIGH",
                        "expected_benefit": "Stable baseline and improved peak shapes"
                    })
                
                elif "tailing" in issue.lower():
                    recommendations.append({
                        "category": "Inlet Maintenance",
                        "action": "Replace inlet liner and septum, check for contamination",
                        "priority": "HIGH",
                        "expected_benefit": "Improved peak shapes"
                    })
                
                elif "resolution" in issue.lower():
                    recommendations.append({
                        "category": "Method Optimization",
                        "action": "Optimize temperature program or flow rate",
                        "priority": "MEDIUM",
                        "expected_benefit": "Better peak separation"
                    })
                
                elif "analysis time" in issue.lower():
                    recommendations.append({
                        "category": "Method Optimization",
                        "action": "Optimize temperature program for faster analysis",
                        "priority": "MEDIUM",
                        "expected_benefit": "Reduced analysis time"
                    })
            
            # General recommendations based on quality metrics
            if quality_metrics["signal_to_noise_ratio"] < 20:
                recommendations.append({
                    "category": "Detector Maintenance",
                    "action": "Clean detector and check detector gas purity",
                    "priority": "MEDIUM",
                    "expected_benefit": "Improved signal-to-noise ratio"
                })
            
            if quality_metrics["data_quality_score"] < 0.7:
                recommendations.append({
                    "category": "System Maintenance",
                    "action": "Perform comprehensive system maintenance and calibration",
                    "priority": "HIGH",
                    "expected_benefit": "Overall system performance improvement"
                })
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {str(e)}")
            return [{
                "category": "System Error",
                "action": "Check system configuration and try again",
                "priority": "HIGH",
                "expected_benefit": "Resolve analysis issues"
            }]

    def _assign_compounds(
        self,
        peaks: List[Dict[str, Any]],
        compound_names: Optional[List[str]],
        time_data: np.ndarray,
        intensity_data: np.ndarray
    ) -> List[Dict[str, Any]]:
        """Assign compounds to peaks if compound names are provided"""
        assignments = []
        
        try:
            if not compound_names or len(compound_names) != len(peaks):
                # Generate generic peak names
                for i, peak in enumerate(peaks):
                    assignments.append({
                        "peak_index": i,
                        "compound_name": f"Peak_{i+1}",
                        "retention_time": peak["retention_time"],
                        "area": peak["area"],
                        "confidence": 0.0
                    })
            else:
                # Assign provided compound names
                for i, (peak, compound_name) in enumerate(zip(peaks, compound_names)):
                    assignments.append({
                        "peak_index": i,
                        "compound_name": compound_name,
                        "retention_time": peak["retention_time"],
                        "area": peak["area"],
                        "confidence": 0.8  # Assume good confidence for provided names
                    })
            
            return assignments
            
        except Exception as e:
            logger.error(f"Error assigning compounds: {str(e)}")
            return []

    def _calculate_resolution_metrics(
        self,
        peaks: List[Dict[str, Any]],
        time_data: np.ndarray
    ) -> Dict[str, Any]:
        """Calculate resolution metrics between peaks"""
        try:
            resolutions = []
            
            for i in range(len(peaks) - 1):
                peak1 = peaks[i]
                peak2 = peaks[i + 1]
                
                # Calculate resolution
                rt1, rt2 = peak1["retention_time"], peak2["retention_time"]
                w1, w2 = peak1["width"], peak2["width"]
                
                resolution = 2 * (rt2 - rt1) / (w1 + w2) if (w1 + w2) > 0 else 0
                resolutions.append(resolution)
            
            return {
                "average_resolution": np.mean(resolutions) if resolutions else 0,
                "minimum_resolution": np.min(resolutions) if resolutions else 0,
                "maximum_resolution": np.max(resolutions) if resolutions else 0,
                "resolution_distribution": {
                    "excellent": len([r for r in resolutions if r >= 2.0]),
                    "good": len([r for r in resolutions if 1.5 <= r < 2.0]),
                    "fair": len([r for r in resolutions if 1.0 <= r < 1.5]),
                    "poor": len([r for r in resolutions if r < 1.0])
                }
            }
            
        except Exception as e:
            logger.error(f"Error calculating resolution metrics: {str(e)}")
            return {
                "average_resolution": 0,
                "minimum_resolution": 0,
                "maximum_resolution": 0,
                "resolution_distribution": {}
            }

    def _calculate_average_resolution(self, peaks: List[Dict[str, Any]]) -> float:
        """Calculate average resolution between peaks"""
        if len(peaks) < 2:
            return 0.0
        
        resolutions = []
        for i in range(len(peaks) - 1):
            peak1 = peaks[i]
            peak2 = peaks[i + 1]
            
            rt1, rt2 = peak1["retention_time"], peak2["retention_time"]
            w1, w2 = peak1["width"], peak2["width"]
            
            resolution = 2 * (rt2 - rt1) / (w1 + w2) if (w1 + w2) > 0 else 0
            resolutions.append(resolution)
        
        return float(np.mean(resolutions)) if resolutions else 0.0

    def _calculate_minimum_resolution(self, peaks: List[Dict[str, Any]]) -> float:
        """Calculate minimum resolution between peaks"""
        if len(peaks) < 2:
            return 0.0
        
        resolutions = []
        for i in range(len(peaks) - 1):
            peak1 = peaks[i]
            peak2 = peaks[i + 1]
            
            rt1, rt2 = peak1["retention_time"], peak2["retention_time"]
            w1, w2 = peak1["width"], peak2["width"]
            
            resolution = 2 * (rt2 - rt1) / (w1 + w2) if (w1 + w2) > 0 else 0
            resolutions.append(resolution)
        
        return float(np.min(resolutions)) if resolutions else 0.0

    def _calculate_shape_distribution(self, peak_shapes: List[Dict[str, Any]]) -> Dict[str, int]:
        """Calculate distribution of peak shapes"""
        distribution = {"Gaussian": 0, "Tailing": 0, "Fronting": 0}
        
        for peak in peak_shapes:
            shape = peak.get("shape", "Unknown")
            if shape in distribution:
                distribution[shape] += 1
        
        return distribution

    def _calculate_method_efficiency(
        self,
        peaks: List[Dict[str, Any]],
        method_parameters: Optional[Dict[str, Any]] = None
    ) -> float:
        """Calculate method efficiency score"""
        try:
            if not peaks:
                return 0.0
            
            # Calculate efficiency based on peak quality and resolution
            total_efficiency = 0.0
            
            for peak in peaks:
                # Efficiency based on peak width and retention time
                if peak["width"] > 0:
                    efficiency = (peak["retention_time"] / peak["width"]) ** 2
                    total_efficiency += efficiency
            
            average_efficiency = total_efficiency / len(peaks)
            
            # Normalize to 0-1 scale
            normalized_efficiency = min(1.0, average_efficiency / 10000)
            
            return float(normalized_efficiency)
            
        except Exception as e:
            logger.error(f"Error calculating method efficiency: {str(e)}")
            return 0.0

    def _calculate_data_quality_score(
        self,
        signal_to_noise: float,
        baseline_stability: float,
        peak_capacity: float
    ) -> float:
        """Calculate overall data quality score"""
        try:
            # Normalize metrics to 0-1 scale
            snr_score = min(1.0, signal_to_noise / 100)
            baseline_score = max(0.0, min(1.0, baseline_stability))
            capacity_score = min(1.0, peak_capacity / 50)
            
            # Weighted average
            quality_score = (snr_score * 0.4 + baseline_score * 0.3 + capacity_score * 0.3)
            
            return float(quality_score)
            
        except Exception as e:
            logger.error(f"Error calculating data quality score: {str(e)}")
            return 0.0

    def _calculate_diagnosis_confidence(
        self,
        issue_count: int,
        quality_metrics: Dict[str, Any],
        peak_analysis: Dict[str, Any]
    ) -> float:
        """Calculate confidence in diagnostic results"""
        try:
            # Base confidence on data quality
            base_confidence = quality_metrics.get("data_quality_score", 0.5)
            
            # Adjust based on number of issues detected
            if issue_count == 0:
                confidence_boost = 0.1
            elif issue_count <= 2:
                confidence_boost = 0.05
            else:
                confidence_boost = -0.1
            
            # Adjust based on peak quality
            excellent_peaks = peak_analysis.get("peak_shapes", [])
            if excellent_peaks:
                excellent_count = len([p for p in excellent_peaks if p.get("quality") == "Excellent"])
                peak_quality_boost = excellent_count / len(excellent_peaks) * 0.1
            else:
                peak_quality_boost = 0
            
            final_confidence = base_confidence + confidence_boost + peak_quality_boost
            return max(0.0, min(1.0, final_confidence))
            
        except Exception as e:
            logger.error(f"Error calculating diagnosis confidence: {str(e)}")
            return 0.5

    async def get_service_status(self) -> Dict:
        """Get service status and capabilities"""
        return {
            "status": "operational",
            "peak_detection_sensitivity": self.peak_detection_sensitivity,
            "baseline_correction": self.baseline_correction,
            "capabilities": [
                "enhanced_peak_detection",
                "baseline_correction",
                "peak_shape_analysis",
                "quality_metrics",
                "diagnostic_analysis",
                "compound_assignment",
                "resolution_calculation"
            ],
            "enhanced_features": [
                "multiple_peak_detection_algorithms",
                "asymmetric_least_squares_baseline",
                "comprehensive_quality_metrics",
                "intelligent_diagnostics",
                "actionable_recommendations"
            ],
            "timestamp": datetime.now().isoformat()
        }

# Global instance
chromatogram_analysis_service = ChromatogramAnalysisService() 