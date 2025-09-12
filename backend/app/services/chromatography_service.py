#!/usr/bin/env python3
"""
Chromatography service for peak detection, simulation, and data processing
"""

import numpy as np
import time
import base64
import io
import csv
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import uuid
import json

from app.models.schemas import (
    Peak, RunRecord, PeakDetectionRequest, PeakDetectionResponse,
    ChromatogramSimulationRequest, ChromatogramSimulationResponse,
    ChromatogramImportRequest, ChromatogramImportResponse,
    ChromatogramExportRequest, ChromatogramExportResponse
)


class ChromatographyService:
    """Service for chromatogram analysis and processing"""
    
    def __init__(self):
        self.compound_libraries = {
            'light_hydrocarbons': [
                {'name': 'Methane', 'rt': 1.2, 'intensity': 50, 'width': 0.05},
                {'name': 'Ethane', 'rt': 1.8, 'intensity': 80, 'width': 0.06},
                {'name': 'Propane', 'rt': 2.5, 'intensity': 120, 'width': 0.08},
                {'name': 'n-Butane', 'rt': 3.8, 'intensity': 150, 'width': 0.10},
                {'name': 'n-Pentane', 'rt': 5.2, 'intensity': 180, 'width': 0.12},
                {'name': 'n-Hexane', 'rt': 7.1, 'intensity': 200, 'width': 0.15}
            ],
            'aromatics': [
                {'name': 'Benzene', 'rt': 8.5, 'intensity': 160, 'width': 0.12},
                {'name': 'Toluene', 'rt': 10.2, 'intensity': 190, 'width': 0.14},
                {'name': 'Ethylbenzene', 'rt': 12.8, 'intensity': 170, 'width': 0.16},
                {'name': 'o-Xylene', 'rt': 13.5, 'intensity': 180, 'width': 0.17},
                {'name': 'p-Xylene', 'rt': 14.1, 'intensity': 175, 'width': 0.16}
            ],
            'oxygenates': [
                {'name': 'Methanol', 'rt': 2.8, 'intensity': 90, 'width': 0.08},
                {'name': 'Ethanol', 'rt': 4.1, 'intensity': 110, 'width': 0.10},
                {'name': 'IPA', 'rt': 5.8, 'intensity': 130, 'width': 0.11},
                {'name': 'MTBE', 'rt': 3.2, 'intensity': 140, 'width': 0.09},
                {'name': 'Acetone', 'rt': 3.5, 'intensity': 100, 'width': 0.08}
            ]
        }
    
    def detect_peaks(self, request: PeakDetectionRequest) -> PeakDetectionResponse:
        """Detect peaks in chromatogram data"""
        start_time = time.time()
        
        time_data = np.array(request.time)
        signal_data = np.array(request.signal)
        
        # Calculate baseline
        baseline = self._calculate_baseline(signal_data, request.baseline_method)
        
        # Calculate noise level
        noise_level = self._calculate_noise_level(signal_data, baseline, request.noise_window)
        
        # Detect peaks
        peaks = self._detect_peaks_algorithm(
            time_data, signal_data, baseline, noise_level,
            request.prominence_threshold, request.min_distance
        )
        
        # Calculate SNR
        signal_to_noise = np.max(signal_data) / noise_level if noise_level > 0 else 0
        
        processing_time = time.time() - start_time
        
        return PeakDetectionResponse(
            peaks=peaks,
            baseline=baseline.tolist(),
            noise_level=noise_level,
            signal_to_noise_ratio=signal_to_noise,
            detection_parameters={
                'prominence_threshold': request.prominence_threshold,
                'min_distance': request.min_distance,
                'noise_window': request.noise_window,
                'baseline_method': request.baseline_method
            },
            processing_time=processing_time
        )
    
    def _calculate_baseline(self, signal: np.ndarray, method: str) -> np.ndarray:
        """Calculate baseline using specified method"""
        if method == "rolling_min":
            window = min(50, len(signal) // 10)
            baseline = np.array([
                np.min(signal[max(0, i-window//2):min(len(signal), i+window//2+1)])
                for i in range(len(signal))
            ])
            # Smooth the baseline
            from scipy.ndimage import gaussian_filter1d
            baseline = gaussian_filter1d(baseline, sigma=2)
        elif method == "polynomial":
            x = np.arange(len(signal))
            coeffs = np.polyfit(x, signal, 3)
            baseline = np.polyval(coeffs, x)
        else:  # none
            baseline = np.zeros_like(signal)
        
        return baseline
    
    def _calculate_noise_level(self, signal: np.ndarray, baseline: np.ndarray, window: int) -> float:
        """Calculate noise level using rolling standard deviation"""
        corrected_signal = signal - baseline
        noise_levels = []
        
        for i in range(len(corrected_signal)):
            start_idx = max(0, i - window // 2)
            end_idx = min(len(corrected_signal), i + window // 2 + 1)
            noise_levels.append(np.std(corrected_signal[start_idx:end_idx]))
        
        return np.median(noise_levels)
    
    def _detect_peaks_algorithm(self, time: np.ndarray, signal: np.ndarray, baseline: np.ndarray,
                               noise_level: float, prominence_threshold: float, min_distance: float) -> List[Peak]:
        """Detect peaks using prominence-based algorithm"""
        corrected_signal = signal - baseline
        
        # Find local maxima
        peaks = []
        for i in range(1, len(corrected_signal) - 1):
            if (corrected_signal[i] > corrected_signal[i-1] and 
                corrected_signal[i] > corrected_signal[i+1]):
                
                # Calculate prominence
                left_min = np.min(corrected_signal[max(0, i-50):i])
                right_min = np.min(corrected_signal[i:min(len(corrected_signal), i+50)])
                prominence = corrected_signal[i] - max(left_min, right_min)
                
                # Check prominence threshold
                if prominence > (prominence_threshold * noise_level):
                    # Check minimum distance from other peaks
                    too_close = False
                    for peak in peaks:
                        if abs(time[i] - peak.rt) < min_distance:
                            too_close = True
                            break
                    
                    if not too_close:
                        # Calculate peak properties
                        area = self._calculate_peak_area(time, corrected_signal, i)
                        width = self._calculate_peak_width(time, corrected_signal, i)
                        snr = corrected_signal[i] / noise_level if noise_level > 0 else 0
                        
                        peak = Peak(
                            id=str(uuid.uuid4()),
                            rt=float(time[i]),
                            area=float(area),
                            height=float(corrected_signal[i]),
                            width=float(width),
                            snr=float(snr)
                        )
                        peaks.append(peak)
        
        return peaks
    
    def _calculate_peak_area(self, time: np.ndarray, signal: np.ndarray, peak_idx: int) -> float:
        """Calculate peak area using trapezoidal integration"""
        # Find peak boundaries (where signal crosses baseline)
        left_bound = peak_idx
        right_bound = peak_idx
        
        # Search left
        for i in range(peak_idx, max(0, peak_idx-100), -1):
            if signal[i] <= 0:
                left_bound = i
                break
        
        # Search right
        for i in range(peak_idx, min(len(signal), peak_idx+100)):
            if signal[i] <= 0:
                right_bound = i
                break
        
        # Calculate area
        area = 0
        for i in range(left_bound, right_bound):
            if i < len(signal) - 1:
                area += (signal[i] + signal[i+1]) * (time[i+1] - time[i]) / 2
        
        return area
    
    def _calculate_peak_width(self, time: np.ndarray, signal: np.ndarray, peak_idx: int) -> float:
        """Calculate peak width at half height"""
        peak_height = signal[peak_idx]
        half_height = peak_height / 2
        
        # Find left crossing
        left_idx = peak_idx
        for i in range(peak_idx, max(0, peak_idx-100), -1):
            if signal[i] <= half_height:
                left_idx = i
                break
        
        # Find right crossing
        right_idx = peak_idx
        for i in range(peak_idx, min(len(signal), peak_idx+100)):
            if signal[i] <= half_height:
                right_idx = i
                break
        
        return time[right_idx] - time[left_idx]
    
    def simulate_chromatogram(self, request: ChromatogramSimulationRequest) -> ChromatogramSimulationResponse:
        """Simulate chromatogram based on method parameters"""
        # Set random seed for reproducibility
        if request.seed is not None:
            np.random.seed(request.seed)
        
        # Generate time axis
        total_time = 20.0  # minutes
        time_points = np.linspace(0, total_time, 2000)
        
        # Initialize signal with baseline noise
        signal = np.zeros_like(time_points)
        if request.include_noise:
            signal += np.random.normal(0, 0.5, len(time_points))
        
        # Add baseline drift if requested
        if request.include_drift:
            drift = np.linspace(0, 2.0, len(time_points))
            signal += drift
        
        # Get compounds for simulation
        compounds = self._get_compounds_for_simulation(request)
        
        # Generate peaks
        peaks = []
        compound_assignments = []
        
        for compound in compounds:
            # Add Gaussian peak
            peak_signal = self._generate_gaussian_peak(
                time_points, compound['rt'], compound['intensity'], compound['width']
            )
            signal += peak_signal
            
            # Create peak record
            peak = Peak(
                id=str(uuid.uuid4()),
                rt=compound['rt'],
                area=compound['intensity'] * compound['width'] * np.sqrt(2 * np.pi),
                height=compound['intensity'],
                width=compound['width'],
                name=compound['name'],
                snr=compound['intensity'] / 0.5  # Assuming noise level of 0.5
            )
            peaks.append(peak)
            
            compound_assignments.append({
                'compound_name': compound['name'],
                'retention_time': compound['rt'],
                'intensity': compound['intensity'],
                'width': compound['width']
            })
        
        # Create run record
        run_record = RunRecord(
            instrument_id=request.instrument_id,
            method_id=request.method_id,
            sample_name=request.sample_name,
            time=time_points.tolist(),
            signal=signal.tolist(),
            peaks=peaks,
            baseline=np.zeros_like(signal).tolist(),
            metadata={
                'simulation_parameters': {
                    'seed': request.seed,
                    'include_noise': request.include_noise,
                    'include_drift': request.include_drift
                }
            }
        )
        
        # Calculate quality metrics
        quality_metrics = {
            'total_peaks': len(peaks),
            'signal_to_noise': np.max(signal) / 0.5,
            'baseline_stability': np.std(signal[:100]),  # First 100 points
            'peak_resolution': self._calculate_peak_resolution(peaks)
        }
        
        return ChromatogramSimulationResponse(
            run_record=run_record,
            simulation_parameters={
                'seed': request.seed,
                'include_noise': request.include_noise,
                'include_drift': request.include_drift,
                'total_time': total_time
            },
            compound_assignments=compound_assignments,
            quality_metrics=quality_metrics
        )
    
    def _get_compounds_for_simulation(self, request: ChromatogramSimulationRequest) -> List[Dict[str, Any]]:
        """Get compounds for simulation based on method parameters"""
        if request.compounds:
            return request.compounds

        # If method_id provided, try to fetch compounds from DB method parameters
        if request.method_id is not None and not request.method_parameters:
            try:
                from app.core.database import SessionLocal, Method as MethodModel
                with SessionLocal() as db:
                    m = db.query(MethodModel).filter(MethodModel.id == request.method_id).first()
                    if m and m.parameters and isinstance(m.parameters, dict):
                        mp = m.parameters
                        if 'compounds' in mp and isinstance(mp['compounds'], list):
                            return mp['compounds']
            except Exception:
                pass

        # Default to light hydrocarbons
        return self.compound_libraries['light_hydrocarbons']
    
    def _generate_gaussian_peak(self, time: np.ndarray, rt: float, intensity: float, width: float) -> np.ndarray:
        """Generate Gaussian peak"""
        sigma = width / 2.355  # Convert FWHM to sigma
        peak = intensity * np.exp(-0.5 * ((time - rt) / sigma) ** 2)
        return peak
    
    def _calculate_peak_resolution(self, peaks: List[Peak]) -> float:
        """Calculate average peak resolution"""
        if len(peaks) < 2:
            return 0.0
        
        resolutions = []
        for i in range(len(peaks) - 1):
            rt1, rt2 = peaks[i].rt, peaks[i+1].rt
            width1, width2 = peaks[i].width, peaks[i+1].width
            resolution = 2 * (rt2 - rt1) / (width1 + width2)
            resolutions.append(resolution)
        
        return np.mean(resolutions)
    
    def import_chromatogram(self, request: ChromatogramImportRequest) -> ChromatogramImportResponse:
        """Import chromatogram from file"""
        try:
            # Decode file content
            file_content = base64.b64decode(request.file_content).decode('utf-8')
            
            if request.file_type.lower() == 'csv':
                time_data, signal_data = self._parse_csv_data(file_content)
            elif request.file_type.lower() == 'jcamp':
                time_data, signal_data = self._parse_jcamp_data(file_content)
            else:
                raise ValueError(f"Unsupported file type: {request.file_type}")
            
            # Validate data
            if len(time_data) != len(signal_data):
                raise ValueError("Time and signal data lengths do not match")
            
            if len(time_data) < 10:
                raise ValueError("Insufficient data points")
            
            # Create run record
            run_record = RunRecord(
                sample_name=request.sample_name,
                time=time_data,
                signal=signal_data,
                peaks=[],
                metadata={
                    'import_source': request.file_type,
                    'data_points': len(time_data)
                }
            )
            
            # Auto-detect peaks if requested
            if request.auto_detect_peaks:
                detection_request = PeakDetectionRequest(
                    time=time_data,
                    signal=signal_data,
                    prominence_threshold=3.0,
                    min_distance=0.1,
                    noise_window=50,
                    baseline_method="rolling_min"
                )
                detection_response = self.detect_peaks(detection_request)
                run_record.peaks = detection_response.peaks
                run_record.baseline = detection_response.baseline
            
            import_metadata = {
                'file_type': request.file_type,
                'data_points': len(time_data),
                'time_range': [min(time_data), max(time_data)],
                'signal_range': [min(signal_data), max(signal_data)],
                'peaks_detected': len(run_record.peaks) if run_record.peaks else 0
            }
            
            return ChromatogramImportResponse(
                run_record=run_record,
                import_metadata=import_metadata,
                validation_warnings=[]
            )
            
        except Exception as e:
            raise ValueError(f"Failed to import chromatogram: {str(e)}")
    
    def _parse_csv_data(self, content: str) -> Tuple[List[float], List[float]]:
        """Parse CSV chromatogram data"""
        lines = content.strip().split('\n')
        time_data = []
        signal_data = []
        
        # Skip header if present
        start_line = 0
        if lines and not self._is_numeric(lines[0].split(',')[0]):
            start_line = 1
        
        for line in lines[start_line:]:
            if line.strip():
                parts = line.split(',')
                if len(parts) >= 2:
                    try:
                        time_val = float(parts[0].strip())
                        signal_val = float(parts[1].strip())
                        time_data.append(time_val)
                        signal_data.append(signal_val)
                    except ValueError:
                        continue
        
        return time_data, signal_data
    
    def _parse_jcamp_data(self, content: str) -> Tuple[List[float], List[float]]:
        """Parse JCAMP-DX chromatogram data"""
        # Simplified JCAMP parser - looks for XY data
        lines = content.split('\n')
        time_data = []
        signal_data = []
        
        in_xy_data = False
        for line in lines:
            line = line.strip()
            if line.startswith('##XYDATA'):
                in_xy_data = True
                continue
            elif line.startswith('##END'):
                break
            elif in_xy_data and line:
                try:
                    # Parse XY pairs
                    parts = line.split()
                    for i in range(0, len(parts), 2):
                        if i + 1 < len(parts):
                            time_val = float(parts[i])
                            signal_val = float(parts[i + 1])
                            time_data.append(time_val)
                            signal_data.append(signal_val)
                except ValueError:
                    continue
        
        return time_data, signal_data
    
    def _is_numeric(self, value: str) -> bool:
        """Check if string is numeric"""
        try:
            float(value)
            return True
        except ValueError:
            return False
    
    def export_chromatogram(self, request: ChromatogramExportRequest) -> ChromatogramExportResponse:
        """Export chromatogram data"""
        # This would typically fetch the run record from database
        # For now, return a placeholder response
        if request.format.lower() == 'csv':
            content = "time,signal\n0.0,0.0\n1.0,1.0\n"
            filename = f"chromatogram_{request.run_id}.csv"
            mime_type = "text/csv"
        elif request.format.lower() == 'png':
            content = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="  # 1x1 transparent PNG
            filename = f"chromatogram_{request.run_id}.png"
            mime_type = "image/png"
        else:
            raise ValueError(f"Unsupported export format: {request.format}")
        
        return ChromatogramExportResponse(
            file_content=content,
            filename=filename,
            file_size=len(content),
            mime_type=mime_type
        )


# Create service instance
chromatography_service = ChromatographyService()
