#!/usr/bin/env python3
"""
Enhanced quantitation service with IS support, outlier detection, and robust LOD/LOQ calculation
"""

import numpy as np
import uuid
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import logging
import scipy.stats as stats
from scipy import sparse
from scipy.sparse.linalg import spsolve

from app.models.schemas import (
    CalibrationModel, CalibrationLevel, QuantRequest, QuantResult,
    RunRecord, Peak, CalibrationMode, OutlierPolicy, InternalStandard,
    CalibrationFitRequest, CalibrationVersion
)

logger = logging.getLogger(__name__)


class QuantitationService:
    """Enhanced service for calibration fitting and quantitation calculations"""
    
    def __init__(self):
        # In-memory storage for demo purposes
        # In production, this would be a database
        self.calibrations = {}
        self.calibration_versions = {}
        self.active_calibrations = {}  # method_id -> calibration_id
        self.blank_runs = []  # Store blank runs for LOD/LOQ calculation
    
    def detect_outliers_grubbs(self, data: np.ndarray, alpha: float = 0.05) -> List[int]:
        """
        Detect outliers using Grubbs test (two-sided)
        
        Args:
            data: Array of residuals or values
            alpha: Significance level (default 0.05)
            
        Returns:
            List of outlier indices
        """
        if len(data) < 3:
            return []
        
        outliers = []
        data_copy = data.copy()
        indices = list(range(len(data)))
        
        while len(data_copy) >= 3:
            n = len(data_copy)
            mean = np.mean(data_copy)
            std = np.std(data_copy, ddof=1)
            
            if std == 0:
                break
            
            # Calculate Grubbs statistic for each point
            g_stats = np.abs(data_copy - mean) / std
            max_g = np.max(g_stats)
            max_idx = np.argmax(g_stats)
            
            # Critical value for Grubbs test
            t_crit = stats.t.ppf(1 - alpha / (2 * n), n - 2)
            g_crit = ((n - 1) / np.sqrt(n)) * np.sqrt(t_crit**2 / (n - 2 + t_crit**2))
            
            if max_g > g_crit:
                # Found outlier
                original_idx = indices[max_idx]
                outliers.append(original_idx)
                
                # Remove outlier and continue
                data_copy = np.delete(data_copy, max_idx)
                indices.pop(max_idx)
            else:
                break
        
        return outliers
    
    def detect_outliers_iqr(self, data: np.ndarray, factor: float = 1.5) -> List[int]:
        """
        Detect outliers using IQR method
        
        Args:
            data: Array of residuals or values
            factor: IQR factor (default 1.5)
            
        Returns:
            List of outlier indices
        """
        if len(data) < 4:
            return []
        
        q1 = np.percentile(data, 25)
        q3 = np.percentile(data, 75)
        iqr = q3 - q1
        
        lower_bound = q1 - factor * iqr
        upper_bound = q3 + factor * iqr
        
        outliers = []
        for i, value in enumerate(data):
            if value < lower_bound or value > upper_bound:
                outliers.append(i)
        
        return outliers
    
    def calculate_lod_loq_from_blanks(self, blank_runs: List[RunRecord], 
                                     target_name: str, slope: float) -> Tuple[float, float, str]:
        """
        Calculate LOD/LOQ from blank runs
        
        Args:
            blank_runs: List of blank run records
            target_name: Target compound name
            slope: Calibration slope
            
        Returns:
            Tuple of (LOD, LOQ, method)
        """
        if not blank_runs or slope == 0:
            return None, None, "insufficient_data"
        
        blank_areas = []
        for run in blank_runs:
            # Find target peak in blank
            for peak in run.peaks:
                if peak.name and peak.name.lower() == target_name.lower():
                    blank_areas.append(peak.area)
                    break
            else:
                # No peak found, use baseline noise
                noise = self.estimate_noise_from_run(run)
                blank_areas.append(noise)
        
        if len(blank_areas) < 3:
            return None, None, "insufficient_blanks"
        
        # Calculate standard deviation of blank areas
        blank_std = np.std(blank_areas, ddof=1)
        
        # LOD = 3 * SD_blank / slope
        # LOQ = 10 * SD_blank / slope
        lod = 3 * blank_std / abs(slope)
        loq = 10 * blank_std / abs(slope)
        
        return lod, loq, "blank_based"
    
    def calculate_lod_loq_from_baseline(self, runs: List[RunRecord], slope: float) -> Tuple[float, float, str]:
        """
        Calculate LOD/LOQ from baseline noise
        
        Args:
            runs: List of run records
            slope: Calibration slope
            
        Returns:
            Tuple of (LOD, LOQ, method)
        """
        if not runs or slope == 0:
            return None, None, "insufficient_data"
        
        noise_levels = []
        for run in runs:
            noise = self.estimate_noise_from_run(run)
            noise_levels.append(noise)
        
        if not noise_levels:
            return None, None, "no_noise_data"
        
        # Use average noise level
        avg_noise = np.mean(noise_levels)
        
        # LOD = 3 * noise / slope
        # LOQ = 10 * noise / slope
        lod = 3 * avg_noise / abs(slope)
        loq = 10 * avg_noise / abs(slope)
        
        return lod, loq, "baseline_noise"
    
    def fit_calibration_enhanced(self, request: CalibrationFitRequest) -> CalibrationModel:
        """
        Enhanced calibration fitting with IS support and outlier detection
        
        Args:
            request: Calibration fit request
            
        Returns:
            Fitted calibration model
        """
        try:
            levels = request.levels
            
            # Prepare data based on mode
            if request.mode == CalibrationMode.INTERNAL_STANDARD:
                if not request.internal_standard:
                    raise ValueError("Internal standard configuration required for IS mode")
                
                # Calculate response factors (RF = Area_target / Area_IS)
                x_data = []
                y_data = []
                
                for level in levels:
                    if (level.amount is not None and level.area is not None and 
                        level.is_area is not None and level.is_area > 0):
                        x_data.append(level.amount)
                        rf = level.area / level.is_area
                        y_data.append(rf)
                
                if len(x_data) < 2:
                    raise ValueError("Need at least 2 valid IS calibration points")
                
            else:
                # External standard mode
                x_data = []
                y_data = []
                
                for level in levels:
                    if level.amount is not None and level.area is not None:
                        x_data.append(level.amount)
                        y_data.append(level.area)
                
                if len(x_data) < 2:
                    raise ValueError("Need at least 2 valid calibration points")
            
            x = np.array(x_data)
            y = np.array(y_data)
            
            # Calculate weights based on model type
            weights = None
            if request.model_type == "weighted_1/x":
                weights = 1.0 / np.maximum(x, 1e-10)
            elif request.model_type == "weighted_1/x2":
                weights = 1.0 / np.maximum(x**2, 1e-10)
            
            # Initial fit
            if request.model_type == "linear_through_zero":
                slope = np.sum(x * y) / np.sum(x**2)
                intercept = 0.0
            else:
                if weights is not None:
                    # Weighted least squares
                    w = weights / np.sum(weights)
                    slope = np.sum(w * x * y) / np.sum(w * x**2)
                    intercept = np.sum(w * y) - slope * np.sum(w * x)
                else:
                    # Ordinary least squares
                    if len(x) == len(y) and len(x) > 1:
                        slope = (np.sum(x * y) - np.sum(x) * np.sum(y) / len(x)) / \
                               (np.sum(x**2) - np.sum(x)**2 / len(x))
                        intercept = np.mean(y) - slope * np.mean(x)
                    else:
                        raise ValueError("Insufficient data for fitting")
            
            # Calculate residuals
            y_pred = slope * x + intercept
            residuals = y - y_pred
            
            # Outlier detection
            excluded_points = []
            included_mask = np.ones(len(levels), dtype=bool)
            
            # Track which levels were used in the fit (have valid data)
            valid_level_indices = []
            for i, level in enumerate(levels):
                if request.mode == CalibrationMode.INTERNAL_STANDARD:
                    if (level.amount is not None and level.area is not None and 
                        level.is_area is not None and level.is_area > 0):
                        valid_level_indices.append(i)
                else:
                    if level.amount is not None and level.area is not None:
                        valid_level_indices.append(i)
            
            if request.outlier_policy == OutlierPolicy.GRUBBS:
                outlier_data_indices = self.detect_outliers_grubbs(residuals)
                # Map data indices back to original level indices
                excluded_points = [valid_level_indices[i] for i in outlier_data_indices if i < len(valid_level_indices)]
            elif request.outlier_policy == OutlierPolicy.IQR:
                outlier_data_indices = self.detect_outliers_iqr(residuals)
                # Map data indices back to original level indices
                excluded_points = [valid_level_indices[i] for i in outlier_data_indices if i < len(valid_level_indices)]
            
            # Update level inclusion status
            for i, level in enumerate(levels):
                if i in excluded_points:
                    level.included = False
                    level.outlier_reason = f"Excluded by {request.outlier_policy.value} test"
                    included_mask[i] = False
                else:
                    level.included = True
                    level.outlier_reason = None
            
            # Refit without outliers if any were found
            if excluded_points:
                x_clean = x[included_mask[:len(x)]]
                y_clean = y[included_mask[:len(y)]]
                
                if len(x_clean) >= 2:
                    if request.model_type == "linear_through_zero":
                        slope = np.sum(x_clean * y_clean) / np.sum(x_clean**2)
                        intercept = 0.0
                    else:
                        if weights is not None:
                            w_clean = weights[included_mask[:len(weights)]]
                            w_clean = w_clean / np.sum(w_clean)
                            slope = np.sum(w_clean * x_clean * y_clean) / np.sum(w_clean * x_clean**2)
                            intercept = np.sum(w_clean * y_clean) - slope * np.sum(w_clean * x_clean)
                        else:
                            slope = (np.sum(x_clean * y_clean) - np.sum(x_clean) * np.sum(y_clean) / len(x_clean)) / \
                                   (np.sum(x_clean**2) - np.sum(x_clean)**2 / len(x_clean))
                            intercept = np.mean(y_clean) - slope * np.mean(x_clean)
                    
                    # Recalculate residuals for all points
                    y_pred = slope * x + intercept
                    residuals = y - y_pred
            
            # Calculate R-squared
            y_mean = np.mean(y[included_mask[:len(y)]])
            ss_res = np.sum((y[included_mask[:len(y)]] - y_pred[included_mask[:len(y_pred)]])**2)
            ss_tot = np.sum((y[included_mask[:len(y)]] - y_mean)**2)
            r2 = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0.0
            
            # Calculate LOD/LOQ
            lod, loq, lod_method = self.calculate_lod_loq_from_blanks(self.blank_runs, request.target_name, slope)
            if lod is None:
                # Fallback to baseline noise method
                lod, loq, lod_method = self.calculate_lod_loq_from_baseline([], slope)
                if lod is None:
                    # Use residual-based estimation
                    noise_std = np.std(residuals[included_mask[:len(residuals)]])
                    lod = 3 * noise_std / abs(slope) if slope != 0 else float('inf')
                    loq = 10 * noise_std / abs(slope) if slope != 0 else float('inf')
                    lod_method = "residual_based"
            
            # Create version ID
            version_id = str(uuid.uuid4())
            
            # Create calibration model
            calibration = CalibrationModel(
                id=str(uuid.uuid4()),
                version_id=version_id,
                method_id=request.method_id,
                instrument_id=request.instrument_id,
                target_name=request.target_name,
                model_type=request.model_type,
                mode=request.mode,
                internal_standard=request.internal_standard.model_dump() if request.internal_standard and hasattr(request.internal_standard, 'model_dump') else request.internal_standard,
                outlier_policy=request.outlier_policy,
                levels=[l.model_dump() if hasattr(l, 'model_dump') else l for l in levels],
                slope=float(slope),
                intercept=float(intercept),
                r2=float(r2),
                residuals=residuals.tolist(),
                excluded_points=excluded_points,
                lod=float(lod) if lod is not None else None,
                loq=float(loq) if loq is not None else None,
                lod_method=lod_method,
                notes=request.notes if hasattr(request, 'notes') else None,
                active=False
            )
            
            # Store calibration and version
            self.calibrations[calibration.id] = calibration
            
            version = CalibrationVersion(
                id=version_id,
                created_at=datetime.now(),
                model=calibration
            )
            self.calibration_versions[version_id] = version
            
            logger.info(f"Created calibration {calibration.id} for {request.target_name} (mode: {request.mode.value})")
            return calibration
            
        except Exception as e:
            logger.error(f"Enhanced calibration fitting failed: {str(e)}")
            raise ValueError(f"Enhanced calibration fitting failed: {str(e)}")
    
    def quantitate_enhanced(self, run: RunRecord, calibration: CalibrationModel, 
                           mapping: Optional[Dict[str, str]] = None) -> QuantResult:
        """
        Enhanced quantitation with IS support
        
        Args:
            run: Run record to quantitate
            calibration: Calibration model to use
            mapping: Optional peak name to target name mapping
            
        Returns:
            Quantitation results
        """
        try:
            results = []
            target_name = calibration.target_name
            
            # Find target peak
            target_peak = self.match_peak(run.peaks, target_name)
            
            if target_peak:
                if calibration.mode == CalibrationMode.INTERNAL_STANDARD:
                    # Internal standard mode
                    if not calibration.internal_standard:
                        raise ValueError("Internal standard configuration missing")
                    
                    # Find IS peak
                    is_peak = self.match_peak(run.peaks, calibration.internal_standard.peak_name)
                    
                    if is_peak and is_peak.area > 0:
                        # Calculate response factor
                        rf = target_peak.area / is_peak.area
                        
                        # Calculate concentration from RF
                        if calibration.slope != 0:
                            concentration = (rf - calibration.intercept) / calibration.slope
                        else:
                            concentration = 0.0
                        
                        # Get unit from calibration
                        unit = calibration.levels[0].unit if calibration.levels else "ppm"
                        
                        # Calculate flags
                        flags = []
                        if calibration.lod and concentration < calibration.lod:
                            flags.append("<LOD")
                        elif calibration.loq and concentration < calibration.loq:
                            flags.append("<LOQ")
                        
                        # Check calibration range
                        max_calib = max(level.amount for level in calibration.levels if level.included)
                        if concentration > max_calib:
                            flags.append("OOR")
                        
                        results.append({
                            "targetName": target_name,
                            "rt": target_peak.rt,
                            "area": target_peak.area,
                            "is_area": is_peak.area,
                            "response_factor": rf,
                            "concentration": concentration,
                            "unit": unit,
                            "snr": target_peak.snr,
                            "flags": flags,
                            "mode": "internal_standard"
                        })
                    else:
                        # IS peak not found
                        results.append({
                            "targetName": target_name,
                            "rt": target_peak.rt,
                            "area": target_peak.area,
                            "is_area": 0.0,
                            "response_factor": 0.0,
                            "concentration": 0.0,
                            "unit": calibration.levels[0].unit if calibration.levels else "ppm",
                            "snr": target_peak.snr,
                            "flags": ["NoISPeak"],
                            "mode": "internal_standard"
                        })
                else:
                    # External standard mode
                    area = target_peak.area
                    
                    if calibration.slope is None:
                        raise ValueError("Calibration not fitted")
                    
                    # Calculate concentration
                    if calibration.slope != 0:
                        concentration = (area - calibration.intercept) / calibration.slope
                    else:
                        concentration = 0.0
                    
                    unit = calibration.levels[0].unit if calibration.levels else "ppm"
                    
                    # Calculate flags
                    flags = []
                    if calibration.lod and concentration < calibration.lod:
                        flags.append("<LOD")
                    elif calibration.loq and concentration < calibration.loq:
                        flags.append("<LOQ")
                    
                    # Check calibration range
                    max_calib = max(level.amount for level in calibration.levels if level.included)
                    if concentration > max_calib:
                        flags.append("OOR")
                    
                    results.append({
                        "targetName": target_name,
                        "rt": target_peak.rt,
                        "area": area,
                        "response": area - (calibration.intercept or 0),
                        "concentration": concentration,
                        "unit": unit,
                        "snr": target_peak.snr,
                        "flags": flags,
                        "mode": "external"
                    })
            else:
                # No target peak found
                results.append({
                    "targetName": target_name,
                    "rt": None,
                    "area": 0.0,
                    "concentration": 0.0,
                    "unit": calibration.levels[0].unit if calibration.levels else "ppm",
                    "snr": None,
                    "flags": ["NoPeak"],
                    "mode": calibration.mode.value
                })
            
            return QuantResult(
                run_id=run.id,
                sample_name=run.sample_name,
                results=results
            )
            
        except Exception as e:
            logger.error(f"Enhanced quantitation failed: {str(e)}")
            raise ValueError(f"Enhanced quantitation failed: {str(e)}")
    
    def estimate_noise_from_run(self, run: RunRecord) -> float:
        """Estimate noise level from a run record"""
        if not run.signal or len(run.signal) < 10:
            return 0.1  # Default noise level
        
        signal = np.array(run.signal)
        
        # Use baseline if available, otherwise estimate from signal
        if run.baseline and len(run.baseline) == len(run.signal):
            baseline = np.array(run.baseline)
            noise = signal - baseline
        else:
            # Simple noise estimation from signal variation
            noise = signal - np.roll(signal, 1)
            noise = noise[1:]  # Remove first element (undefined)
        
        return float(np.std(noise))
    
    def match_peak(self, peaks: List[Peak], target_name: str, rt_window: float = 0.1) -> Optional[Peak]:
        """Match a peak to a target compound"""
        if not peaks:
            return None
        
        # First try exact name match
        for peak in peaks:
            if peak.name and peak.name.lower() == target_name.lower():
                return peak
        
        # If no exact match, return the first peak as placeholder
        return peaks[0] if peaks else None
    
    def activate_calibration(self, calibration_id: str) -> bool:
        """Activate a calibration for its method/instrument"""
        if calibration_id not in self.calibrations:
            raise ValueError("Calibration not found")
        
        calibration = self.calibrations[calibration_id]
        
        # Deactivate other calibrations for this method
        for cal_id, cal in self.calibrations.items():
            if (cal.method_id == calibration.method_id and 
                cal.instrument_id == calibration.instrument_id):
                cal.active = False
        
        # Activate this calibration
        calibration.active = True
        self.active_calibrations[calibration.method_id] = calibration_id
        
        logger.info(f"Activated calibration {calibration_id}")
        return True
    
    def get_active_calibration(self, method_id: int, instrument_id: Optional[int] = None) -> Optional[CalibrationModel]:
        """Get the active calibration for a method/instrument"""
        for cal in self.calibrations.values():
            if (cal.method_id == method_id and 
                cal.instrument_id == instrument_id and 
                cal.active):
                return cal
        return None
    
    def list_calibrations(self, method_id: Optional[int] = None, 
                         instrument_id: Optional[int] = None,
                         target_name: Optional[str] = None) -> List[CalibrationModel]:
        """List calibrations with optional filtering"""
        calibrations = list(self.calibrations.values())
        
        if method_id is not None:
            calibrations = [cal for cal in calibrations if cal.method_id == method_id]
        
        if instrument_id is not None:
            calibrations = [cal for cal in calibrations if cal.instrument_id == instrument_id]
        
        if target_name is not None:
            calibrations = [cal for cal in calibrations if cal.target_name == target_name]
        
        return calibrations
    
    def list_calibration_versions(self, method_id: Optional[int] = None,
                                 instrument_id: Optional[int] = None,
                                 target_name: Optional[str] = None) -> List[CalibrationVersion]:
        """List calibration versions with optional filtering"""
        versions = []
        for version in self.calibration_versions.values():
            cal = version.model
            if (method_id is None or cal.method_id == method_id) and \
               (instrument_id is None or cal.instrument_id == instrument_id) and \
               (target_name is None or cal.target_name == target_name):
                versions.append(version)
        
        # Sort by creation date (newest first)
        versions.sort(key=lambda v: v.created_at, reverse=True)
        return versions
    
    def delete_calibration(self, calibration_id: str) -> bool:
        """Delete a calibration"""
        if calibration_id not in self.calibrations:
            raise ValueError("Calibration not found")
        
        calibration = self.calibrations[calibration_id]
        
        # Remove from active calibrations if active
        if calibration.active:
            self.active_calibrations.pop(calibration.method_id, None)
        
        # Remove version
        if calibration.version_id in self.calibration_versions:
            del self.calibration_versions[calibration.version_id]
        
        del self.calibrations[calibration_id]
        
        logger.info(f"Deleted calibration {calibration_id}")
        return True
    
    def add_blank_run(self, run: RunRecord):
        """Add a blank run for LOD/LOQ calculation"""
        self.blank_runs.append(run)
        # Keep only recent blank runs (last 10)
        if len(self.blank_runs) > 10:
            self.blank_runs = self.blank_runs[-10:]


# Global service instance
quant_service = QuantitationService()