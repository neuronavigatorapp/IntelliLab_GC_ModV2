#!/usr/bin/env python3
"""
AI-powered chromatogram diagnostics service for fault detection and method optimization.
"""

import json
import time
import numpy as np
import uuid
from typing import Dict, List, Any, Optional, Tuple, Union
from dataclasses import dataclass
from pathlib import Path

from app.models.schemas import (
    ChromatogramDiagnostic, ChromatogramDiagnosticCreate,
    Peak, RunRecord
)
from app.core.database import SessionLocal, ChromatogramDiagnostic as DiagnosticModel


@dataclass
class FaultPattern:
    """Fault pattern definition for AI analysis"""
    name: str
    description: str
    indicators: List[str]
    severity: str  # critical, high, medium, low
    confidence_threshold: float
    method_adjustments: List[Dict[str, Any]]


class AIChromDiagnosticsService:
    """AI-powered chromatogram analysis and fault detection."""
    
    def __init__(self):
        self.fault_patterns = self._load_fault_patterns()
        self.model_version = "v1.0"
        
    def _load_fault_patterns(self) -> List[FaultPattern]:
        """Load pre-defined fault patterns for chromatogram analysis."""
        return [
            FaultPattern(
                name="baseline_drift",
                description="Baseline drift indicating detector or column issues",
                indicators=["upward_baseline_trend", "baseline_noise_increase"],
                severity="medium",
                confidence_threshold=0.7,
                method_adjustments=[
                    {"parameter": "detector_temp", "adjustment": "+25°C", "reason": "Improve baseline stability"},
                    {"parameter": "column_conditioning", "adjustment": "2h at max temp", "reason": "Remove contamination"}
                ]
            ),
            FaultPattern(
                name="peak_tailing",
                description="Peak tailing suggesting active sites or overloading",
                indicators=["asymmetry_factor_high", "peak_width_excessive"],
                severity="medium",
                confidence_threshold=0.75,
                method_adjustments=[
                    {"parameter": "injection_volume", "adjustment": "-50%", "reason": "Reduce sample overloading"},
                    {"parameter": "split_ratio", "adjustment": "increase 2x", "reason": "Reduce sample amount on column"},
                    {"parameter": "liner_type", "adjustment": "deactivated liner", "reason": "Reduce active sites"}
                ]
            ),
            FaultPattern(
                name="ghost_peaks",
                description="Unexpected peaks indicating contamination or carryover",
                indicators=["unidentified_peaks", "variable_peak_areas"],
                severity="high",
                confidence_threshold=0.8,
                method_adjustments=[
                    {"parameter": "inlet_temp", "adjustment": "+50°C", "reason": "Improve volatilization"},
                    {"parameter": "septum_replacement", "adjustment": "immediate", "reason": "Eliminate contamination source"},
                    {"parameter": "blank_injection", "adjustment": "after each sample", "reason": "Monitor carryover"}
                ]
            ),
            FaultPattern(
                name="poor_resolution",
                description="Insufficient peak separation",
                indicators=["peak_overlap", "low_resolution_values"],
                severity="medium",
                confidence_threshold=0.7,
                method_adjustments=[
                    {"parameter": "oven_ramp", "adjustment": "slower initial rate", "reason": "Improve early elution separation"},
                    {"parameter": "column_flow", "adjustment": "-0.2 mL/min", "reason": "Increase resolution"},
                    {"parameter": "column_length", "adjustment": "30m → 60m", "reason": "Double theoretical plates"}
                ]
            ),
            FaultPattern(
                name="sensitivity_loss",
                description="Low signal intensity indicating detector or injection issues",
                indicators=["low_peak_heights", "poor_signal_to_noise"],
                severity="high",
                confidence_threshold=0.75,
                method_adjustments=[
                    {"parameter": "detector_makeup_flow", "adjustment": "+5 mL/min", "reason": "Optimize detector response"},
                    {"parameter": "injection_technique", "adjustment": "splitless mode", "reason": "Maximize sample transfer"},
                    {"parameter": "detector_cleaning", "adjustment": "immediate", "reason": "Remove contamination"}
                ]
            ),
            FaultPattern(
                name="retention_time_shift",
                description="Systematic RT shifts indicating flow or temperature issues",
                indicators=["rt_drift", "rt_variability"],
                severity="medium",
                confidence_threshold=0.8,
                method_adjustments=[
                    {"parameter": "carrier_pressure", "adjustment": "constant pressure mode", "reason": "Stabilize flow"},
                    {"parameter": "oven_equilibration", "adjustment": "+2 minutes", "reason": "Improve temperature stability"},
                    {"parameter": "inlet_pressure", "adjustment": "check for leaks", "reason": "Ensure consistent flow"}
                ]
            )
        ]
    
    def analyze_chromatogram_file(self, file_path: str, file_type: str, run_parameters: Optional[Dict[str, Any]] = None) -> ChromatogramDiagnostic:
        """Analyze a chromatogram file (CSV or image) for faults and issues."""
        start_time = time.time()
        
        try:
            # Parse chromatogram data based on file type
            if file_type.lower() == 'csv':
                time_data, signal_data = self._parse_csv_chromatogram(file_path)
            elif file_type.lower() in ['png', 'jpg', 'jpeg']:
                time_data, signal_data = self._parse_image_chromatogram(file_path)
            else:
                raise ValueError(f"Unsupported file type: {file_type}")
            
            # Perform AI analysis
            analysis_result = self._analyze_chromatogram_data(time_data, signal_data, run_parameters)
            
            processing_time = time.time() - start_time
            
            # Create diagnostic record
            diagnostic = ChromatogramDiagnosticCreate(
                file_type=file_type,
                ai_analysis=analysis_result["analysis"],
                fault_causes=analysis_result["fault_causes"],
                method_adjustments=analysis_result["method_adjustments"],
                confidence_score=analysis_result["confidence_score"],
                processing_time=processing_time,
                model_version=self.model_version
            )
            
            # Save to database
            return self._save_diagnostic(diagnostic, file_path)
            
        except Exception as e:
            # Return error diagnostic
            return self._create_error_diagnostic(str(e), file_path, file_type)
    
    def analyze_run_record(self, run_record: RunRecord, run_parameters: Optional[Dict[str, Any]] = None) -> ChromatogramDiagnostic:
        """Analyze a run record for faults and issues."""
        start_time = time.time()
        
        try:
            # Perform AI analysis on existing run data
            analysis_result = self._analyze_chromatogram_data(
                run_record.time, 
                run_record.signal, 
                run_parameters,
                peaks=run_record.peaks
            )
            
            processing_time = time.time() - start_time
            
            # Create diagnostic record
            diagnostic = ChromatogramDiagnosticCreate(
                run_id=run_record.id,
                file_type="run_record",
                ai_analysis=analysis_result["analysis"],
                fault_causes=analysis_result["fault_causes"],
                method_adjustments=analysis_result["method_adjustments"],
                confidence_score=analysis_result["confidence_score"],
                processing_time=processing_time,
                model_version=self.model_version
            )
            
            # Save to database
            return self._save_diagnostic(diagnostic)
            
        except Exception as e:
            # Return error diagnostic
            return self._create_error_diagnostic(str(e), run_id=run_record.id)
    
    def _analyze_chromatogram_data(self, time_data: List[float], signal_data: List[float], 
                                 run_parameters: Optional[Dict[str, Any]] = None,
                                 peaks: Optional[List[Peak]] = None) -> Dict[str, Any]:
        """Core AI analysis of chromatogram data."""
        
        time_array = np.array(time_data)
        signal_array = np.array(signal_data)
        
        # Basic signal statistics
        analysis = {
            "data_points": len(signal_data),
            "run_time": float(time_array[-1] - time_array[0]),
            "max_signal": float(np.max(signal_array)),
            "min_signal": float(np.min(signal_array)),
            "signal_range": float(np.max(signal_array) - np.min(signal_array)),
            "baseline_mean": float(np.mean(signal_array[:100])),  # First 100 points as baseline
            "noise_level": float(np.std(signal_array[:100])),
        }
        
        # Detect potential issues
        detected_faults = []
        all_adjustments = []
        confidence_scores = []
        
        # Check for baseline drift
        baseline_drift = self._detect_baseline_drift(signal_array)
        if baseline_drift["detected"]:
            detected_faults.append("baseline_drift")
            confidence_scores.append(baseline_drift["confidence"])
            
        # Check for peak tailing (if peaks provided)
        if peaks:
            tailing_analysis = self._detect_peak_tailing(peaks)
            if tailing_analysis["detected"]:
                detected_faults.append("peak_tailing")
                confidence_scores.append(tailing_analysis["confidence"])
        
        # Check for ghost peaks
        ghost_peaks = self._detect_ghost_peaks(time_array, signal_array, peaks)
        if ghost_peaks["detected"]:
            detected_faults.append("ghost_peaks")
            confidence_scores.append(ghost_peaks["confidence"])
            
        # Check for poor resolution
        if peaks and len(peaks) > 1:
            resolution_analysis = self._analyze_resolution(peaks)
            if resolution_analysis["poor_resolution"]:
                detected_faults.append("poor_resolution")
                confidence_scores.append(resolution_analysis["confidence"])
                
        # Check for sensitivity issues
        sensitivity_analysis = self._analyze_sensitivity(signal_array, peaks)
        if sensitivity_analysis["low_sensitivity"]:
            detected_faults.append("sensitivity_loss")
            confidence_scores.append(sensitivity_analysis["confidence"])
            
        # Check for retention time issues (requires historical data - simplified here)
        rt_analysis = self._analyze_retention_times(peaks, run_parameters)
        if rt_analysis["rt_issues"]:
            detected_faults.append("retention_time_shift")
            confidence_scores.append(rt_analysis["confidence"])
        
        # Generate method adjustments based on detected faults
        for fault_name in detected_faults:
            fault_pattern = next((fp for fp in self.fault_patterns if fp.name == fault_name), None)
            if fault_pattern:
                all_adjustments.extend(fault_pattern.method_adjustments)
        
        # Calculate overall confidence
        overall_confidence = np.mean(confidence_scores) if confidence_scores else 0.5
        
        analysis.update({
            "detected_issues": len(detected_faults),
            "issues_detail": {
                "baseline_drift": baseline_drift,
                "ghost_peaks": ghost_peaks,
                "sensitivity": sensitivity_analysis,
                "resolution": resolution_analysis if peaks else {"analyzed": False},
                "retention_times": rt_analysis
            }
        })
        
        return {
            "analysis": analysis,
            "fault_causes": detected_faults,
            "method_adjustments": all_adjustments,
            "confidence_score": float(overall_confidence)
        }
    
    def _detect_baseline_drift(self, signal_array: np.ndarray) -> Dict[str, Any]:
        """Detect baseline drift in chromatogram."""
        # Simple linear trend detection
        x = np.arange(len(signal_array))
        coeffs = np.polyfit(x, signal_array, 1)
        slope = coeffs[0]
        
        # Normalize slope by signal range
        signal_range = np.max(signal_array) - np.min(signal_array)
        normalized_slope = abs(slope) / (signal_range / len(signal_array))
        
        drift_detected = normalized_slope > 0.01  # Threshold for drift detection
        confidence = min(1.0, normalized_slope * 10)  # Convert to confidence score
        
        return {
            "detected": drift_detected,
            "confidence": confidence,
            "slope": float(slope),
            "normalized_slope": float(normalized_slope)
        }
    
    def _detect_peak_tailing(self, peaks: List[Peak]) -> Dict[str, Any]:
        """Detect peak tailing issues."""
        if not peaks:
            return {"detected": False, "confidence": 0.0}
            
        # Calculate asymmetry factors (simplified)
        asymmetry_factors = []
        for peak in peaks:
            # Simplified asymmetry calculation (would need actual peak shape data)
            estimated_asymmetry = peak.width / 0.1  # Rough estimate
            asymmetry_factors.append(estimated_asymmetry)
        
        avg_asymmetry = np.mean(asymmetry_factors)
        tailing_detected = avg_asymmetry > 2.0  # USP tailing factor threshold
        confidence = min(1.0, (avg_asymmetry - 1.0) / 3.0)  # Confidence based on severity
        
        return {
            "detected": tailing_detected,
            "confidence": confidence,
            "avg_asymmetry": float(avg_asymmetry),
            "peaks_affected": len([af for af in asymmetry_factors if af > 2.0])
        }
    
    def _detect_ghost_peaks(self, time_array: np.ndarray, signal_array: np.ndarray, known_peaks: Optional[List[Peak]]) -> Dict[str, Any]:
        """Detect unexpected peaks (contamination/carryover)."""
        # Simple peak detection using signal threshold
        signal_threshold = np.mean(signal_array) + 3 * np.std(signal_array)
        
        # Find signal above threshold
        above_threshold = signal_array > signal_threshold
        
        # Count potential peaks (simplified)
        potential_peaks = 0
        in_peak = False
        for i, above in enumerate(above_threshold):
            if above and not in_peak:
                potential_peaks += 1
                in_peak = True
            elif not above:
                in_peak = False
        
        known_peak_count = len(known_peaks) if known_peaks else 0
        unexpected_peaks = max(0, potential_peaks - known_peak_count)
        
        ghost_detected = unexpected_peaks > 0
        confidence = min(1.0, unexpected_peaks / max(1, known_peak_count))
        
        return {
            "detected": ghost_detected,
            "confidence": confidence,
            "potential_peaks": potential_peaks,
            "known_peaks": known_peak_count,
            "unexpected_peaks": unexpected_peaks
        }
    
    def _analyze_resolution(self, peaks: List[Peak]) -> Dict[str, Any]:
        """Analyze peak resolution."""
        if len(peaks) < 2:
            return {"poor_resolution": False, "confidence": 0.0, "analyzed": False}
        
        # Sort peaks by retention time
        sorted_peaks = sorted(peaks, key=lambda p: p.rt)
        
        resolutions = []
        for i in range(len(sorted_peaks) - 1):
            peak1, peak2 = sorted_peaks[i], sorted_peaks[i + 1]
            
            # Simplified resolution calculation: R = 2(t2-t1)/(w1+w2)
            rt_diff = peak2.rt - peak1.rt
            width_sum = peak1.width + peak2.width
            resolution = 2 * rt_diff / width_sum if width_sum > 0 else 0
            resolutions.append(resolution)
        
        min_resolution = min(resolutions) if resolutions else 1.5
        poor_resolution = min_resolution < 1.5  # USP resolution requirement
        confidence = min(1.0, (1.5 - min_resolution) / 1.5) if poor_resolution else 0.0
        
        return {
            "poor_resolution": poor_resolution,
            "confidence": confidence,
            "analyzed": True,
            "min_resolution": float(min_resolution),
            "avg_resolution": float(np.mean(resolutions)) if resolutions else 0.0,
            "resolution_pairs": len(resolutions)
        }
    
    def _analyze_sensitivity(self, signal_array: np.ndarray, peaks: Optional[List[Peak]]) -> Dict[str, Any]:
        """Analyze signal sensitivity issues."""
        # Calculate signal-to-noise ratio
        baseline_noise = np.std(signal_array[:100])  # First 100 points as noise reference
        max_signal = np.max(signal_array)
        snr = max_signal / baseline_noise if baseline_noise > 0 else 0
        
        # Check peak heights if available
        avg_peak_height = 0
        if peaks:
            peak_heights = [p.height for p in peaks if hasattr(p, 'height')]
            avg_peak_height = np.mean(peak_heights) if peak_heights else 0
        
        low_sensitivity = snr < 10 or avg_peak_height < 1000  # Arbitrary thresholds
        confidence = min(1.0, (10 - snr) / 10) if snr < 10 else 0.0
        
        return {
            "low_sensitivity": low_sensitivity,
            "confidence": confidence,
            "snr": float(snr),
            "avg_peak_height": float(avg_peak_height),
            "baseline_noise": float(baseline_noise)
        }
    
    def _analyze_retention_times(self, peaks: Optional[List[Peak]], run_parameters: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze retention time stability (simplified without historical data)."""
        if not peaks:
            return {"rt_issues": False, "confidence": 0.0}
        
        # In a real implementation, this would compare to historical RT data
        # For now, we'll do a simplified analysis
        retention_times = [p.rt for p in peaks]
        rt_variability = np.std(retention_times) / np.mean(retention_times) if retention_times else 0
        
        rt_issues = rt_variability > 0.05  # 5% variability threshold
        confidence = min(1.0, rt_variability / 0.05) if rt_issues else 0.0
        
        return {
            "rt_issues": rt_issues,
            "confidence": confidence,
            "rt_variability": float(rt_variability),
            "analyzed": True
        }
    
    def _parse_csv_chromatogram(self, file_path: str) -> Tuple[List[float], List[float]]:
        """Parse CSV chromatogram file."""
        import csv
        
        time_data = []
        signal_data = []
        
        with open(file_path, 'r') as csvfile:
            reader = csv.reader(csvfile)
            next(reader)  # Skip header if present
            
            for row in reader:
                if len(row) >= 2:
                    try:
                        time_data.append(float(row[0]))
                        signal_data.append(float(row[1]))
                    except ValueError:
                        continue  # Skip invalid rows
        
        return time_data, signal_data
    
    def _parse_image_chromatogram(self, file_path: str) -> Tuple[List[float], List[float]]:
        """Parse image chromatogram file (placeholder - would need image processing)."""
        # This would require image processing libraries like OpenCV or PIL
        # For now, return dummy data
        time_data = list(np.linspace(0, 20, 1000))
        signal_data = list(np.random.normal(100, 10, 1000))
        
        return time_data, signal_data
    
    def _save_diagnostic(self, diagnostic: ChromatogramDiagnosticCreate, file_path: Optional[str] = None) -> ChromatogramDiagnostic:
        """Save diagnostic to database."""
        with SessionLocal() as db:
            db_diagnostic = DiagnosticModel(
                run_id=diagnostic.run_id,
                file_path=file_path,
                file_type=diagnostic.file_type,
                ai_analysis=diagnostic.ai_analysis,
                fault_causes=diagnostic.fault_causes,
                method_adjustments=diagnostic.method_adjustments,
                confidence_score=diagnostic.confidence_score,
                processing_time=diagnostic.processing_time,
                model_version=diagnostic.model_version
            )
            db.add(db_diagnostic)
            db.commit()
            db.refresh(db_diagnostic)
            
            return ChromatogramDiagnostic.from_orm(db_diagnostic)
    
    def _create_error_diagnostic(self, error_message: str, file_path: Optional[str] = None, 
                                file_type: str = "unknown", run_id: Optional[int] = None) -> ChromatogramDiagnostic:
        """Create error diagnostic record."""
        diagnostic = ChromatogramDiagnosticCreate(
            run_id=run_id,
            file_type=file_type,
            ai_analysis={"error": error_message, "status": "failed"},
            fault_causes=["analysis_error"],
            method_adjustments=[{"parameter": "troubleshooting", "adjustment": "check file format", "reason": error_message}],
            confidence_score=0.0,
            processing_time=0.0,
            model_version=self.model_version
        )
        
        return self._save_diagnostic(diagnostic, file_path)
    
    def get_diagnostic_history(self, run_id: Optional[int] = None, limit: int = 50) -> List[ChromatogramDiagnostic]:
        """Get diagnostic history for a run or all diagnostics."""
        with SessionLocal() as db:
            query = db.query(DiagnosticModel)
            
            if run_id:
                query = query.filter(DiagnosticModel.run_id == run_id)
                
            diagnostics = query.order_by(DiagnosticModel.created_date.desc()).limit(limit).all()
            return [ChromatogramDiagnostic.from_orm(d) for d in diagnostics]


# Service instance
ai_diagnostics_service = AIChromDiagnosticsService()
