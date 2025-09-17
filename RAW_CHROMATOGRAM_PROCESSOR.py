#!/usr/bin/env python3
"""
Raw Chromatogram Data Processor
Comprehensive analysis of raw GC chromatographic data with expert diagnostics
"""

import numpy as np
import logging
from typing import List, Dict, Tuple, Any, Optional
from dataclasses import dataclass
from enum import Enum
import sys
import os
from datetime import datetime

# Add performance analyzer
sys.path.append(os.path.join(os.path.dirname(__file__), 'core', 'performance_monitor'))
sys.path.append(os.path.join(os.path.dirname(__file__), 'core', 'integration'))

@dataclass
class RawChromatogramData:
    """Raw chromatogram data structure"""
    time_data: List[float]          # Time points (minutes)
    intensity_data: List[float]     # Signal intensity (arbitrary units)
    sampling_rate: float            # Data points per minute
    detector_type: str              # FID, SCD, MS, etc.
    method_name: Optional[str] = None
    injection_time: Optional[datetime] = None
    total_runtime: Optional[float] = None

@dataclass
class PeakData:
    """Individual peak analysis results"""
    retention_time: float           # Peak apex time (min)
    peak_height: float             # Maximum intensity
    peak_area: float               # Integrated area
    peak_width: float              # Width at half height
    symmetry_factor: float         # Peak tailing factor
    theoretical_plates: int        # Chromatographic efficiency
    signal_to_noise: float         # S/N ratio
    start_time: float              # Peak start
    end_time: float                # Peak end
    compound_id: Optional[str] = None

@dataclass
class ChromatogramQuality:
    """Overall chromatogram quality assessment"""
    baseline_noise: float          # RMS noise level
    baseline_drift: float          # Baseline slope
    overall_snr: float             # Average S/N ratio
    resolution_index: float        # Average resolution
    peak_capacity: int             # Number of resolvable peaks
    analysis_efficiency: float     # Peaks per minute
    data_quality_score: float      # Overall quality (0-100)

class ChromatogramProcessor:
    """Expert-level raw chromatogram data processor"""
    
    def __init__(self):
        self.logger = self._setup_logging()
        self.logger.info("Initializing Raw Chromatogram Processor")
        
        # Processing parameters
        self.noise_window = 0.5        # Minutes for noise calculation
        self.peak_threshold = 3.0      # S/N threshold for peak detection
        self.min_peak_width = 0.01     # Minimum peak width (min)
        self.max_peak_width = 2.0      # Maximum peak width (min)
        
    def _setup_logging(self) -> logging.Logger:
        """Setup enterprise logging"""
        logger = logging.getLogger('ChromatogramProcessor')
        if not logger.handlers:
            logger.setLevel(logging.INFO)
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        return logger
    
    def process_raw_data(
        self, 
        chromatogram: RawChromatogramData,
        auto_baseline: bool = True,
        peak_detection: bool = True
    ) -> Dict[str, Any]:
        """Process raw chromatogram data with comprehensive analysis"""
        
        self.logger.info(f"Processing chromatogram: {len(chromatogram.time_data)} data points")
        
        # Validate data
        if len(chromatogram.time_data) != len(chromatogram.intensity_data):
            raise ValueError("Time and intensity data must have same length")
        
        if len(chromatogram.time_data) < 100:
            raise ValueError("Insufficient data points for analysis (minimum 100)")
        
        # Convert to numpy arrays
        time_array = np.array(chromatogram.time_data)
        intensity_array = np.array(chromatogram.intensity_data)
        
        # Basic data cleaning
        time_array, intensity_array = self._clean_data(time_array, intensity_array)
        
        # Baseline correction
        if auto_baseline:
            intensity_corrected = self._correct_baseline(time_array, intensity_array)
        else:
            intensity_corrected = intensity_array
        
        # Calculate quality metrics
        quality = self._assess_quality(time_array, intensity_corrected)
        
        # Peak detection and analysis
        peaks = []
        if peak_detection:
            peaks = self._detect_and_analyze_peaks(time_array, intensity_corrected)
        
        # Generate comprehensive analysis
        analysis_results = {
            "data_summary": {
                "total_data_points": len(time_array),
                "time_range_min": [float(time_array[0]), float(time_array[-1])],
                "intensity_range": [float(np.min(intensity_array)), float(np.max(intensity_array))],
                "sampling_rate_hz": len(time_array) / (time_array[-1] - time_array[0]) / 60,
                "analysis_time_min": float(time_array[-1] - time_array[0])
            },
            "quality_assessment": {
                "baseline_noise": quality.baseline_noise,
                "baseline_drift": quality.baseline_drift,
                "overall_snr": quality.overall_snr,
                "resolution_index": quality.resolution_index,
                "peak_capacity": quality.peak_capacity,
                "data_quality_score": quality.data_quality_score
            },
            "peak_analysis": {
                "peaks_detected": len(peaks),
                "peak_data": [self._peak_to_dict(peak) for peak in peaks],
                "average_peak_width": np.mean([p.peak_width for p in peaks]) if peaks else 0,
                "average_symmetry": np.mean([p.symmetry_factor for p in peaks]) if peaks else 0,
                "average_efficiency": np.mean([p.theoretical_plates for p in peaks]) if peaks else 0
            },
            "diagnostics": self._generate_diagnostics(quality, peaks, chromatogram),
            "recommendations": self._generate_recommendations(quality, peaks)
        }
        
        self.logger.info(f"Analysis completed: {len(peaks)} peaks detected, quality score: {quality.data_quality_score:.1f}")
        
        return analysis_results
    
    def _clean_data(self, time_data: np.ndarray, intensity_data: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Clean raw data by removing outliers and smoothing if needed"""
        
        # Remove obvious outliers (>5 sigma)
        intensity_mean = np.mean(intensity_data)
        intensity_std = np.std(intensity_data)
        outlier_threshold = 5 * intensity_std
        
        valid_indices = np.abs(intensity_data - intensity_mean) < outlier_threshold
        
        if np.sum(valid_indices) < len(intensity_data) * 0.95:
            self.logger.warning(f"Removed {len(intensity_data) - np.sum(valid_indices)} outlier points")
        
        # Optional light smoothing for very noisy data
        noise_level = np.std(intensity_data[:min(100, len(intensity_data))])
        signal_level = np.max(intensity_data)
        
        if noise_level / signal_level > 0.1:  # >10% noise
            # Apply light Gaussian smoothing
            from scipy import ndimage
            intensity_data = ndimage.gaussian_filter1d(intensity_data, sigma=1.0)
        
        return time_data[valid_indices], intensity_data[valid_indices]
    
    def _correct_baseline(self, time_data: np.ndarray, intensity_data: np.ndarray) -> np.ndarray:
        """Automatic baseline correction using polynomial fitting"""
        
        # Find baseline points (bottom 10% of data in sliding windows)
        window_size = max(50, len(intensity_data) // 20)
        baseline_points = []
        baseline_times = []
        
        for i in range(0, len(intensity_data) - window_size, window_size // 2):
            window_data = intensity_data[i:i + window_size]
            baseline_level = np.percentile(window_data, 10)  # Bottom 10%
            
            # Find points close to baseline in this window
            baseline_indices = np.where(
                (intensity_data[i:i + window_size] <= baseline_level * 1.2) &
                (intensity_data[i:i + window_size] >= baseline_level * 0.8)
            )[0] + i
            
            if len(baseline_indices) > 0:
                baseline_points.extend(intensity_data[baseline_indices])
                baseline_times.extend(time_data[baseline_indices])
        
        if len(baseline_points) < 10:
            self.logger.warning("Insufficient baseline points found, using linear detrend")
            # Simple linear detrend
            coeffs = np.polyfit(time_data, intensity_data, 1)
            baseline = np.polyval(coeffs, time_data)
        else:
            # Fit polynomial to baseline points
            baseline_coeffs = np.polyfit(baseline_times, baseline_points, 
                                       min(3, len(set(baseline_times)) - 1))
            baseline = np.polyval(baseline_coeffs, time_data)
        
        corrected_intensity = intensity_data - baseline
        
        # Ensure no negative values
        corrected_intensity = np.maximum(corrected_intensity, 0)
        
        return corrected_intensity
    
    def _assess_quality(self, time_data: np.ndarray, intensity_data: np.ndarray) -> ChromatogramQuality:
        """Comprehensive quality assessment of chromatogram"""
        
        # Baseline noise (RMS of first and last portions)
        noise_points = min(len(intensity_data) // 10, 100)
        start_noise = np.std(intensity_data[:noise_points])
        end_noise = np.std(intensity_data[-noise_points:])
        baseline_noise = (start_noise + end_noise) / 2
        
        # Baseline drift (linear trend)
        if len(intensity_data) > 100:
            time_subset = time_data[::len(time_data)//50]  # Sample points for trend
            intensity_subset = intensity_data[::len(intensity_data)//50]
            drift_coeffs = np.polyfit(time_subset, intensity_subset, 1)
            baseline_drift = abs(drift_coeffs[0])  # Slope magnitude
        else:
            baseline_drift = 0
        
        # Overall signal-to-noise ratio
        max_signal = np.max(intensity_data)
        overall_snr = max_signal / baseline_noise if baseline_noise > 0 else 1000
        
        # Estimate peak capacity (simplified)
        analysis_time = time_data[-1] - time_data[0]
        typical_peak_width = 0.1  # Assume 0.1 min average peak width
        peak_capacity = int(analysis_time / (4 * typical_peak_width))
        
        # Analysis efficiency
        significant_peaks = len(np.where(intensity_data > 5 * baseline_noise)[0])
        analysis_efficiency = significant_peaks / analysis_time if analysis_time > 0 else 0
        
        # Overall quality score (0-100)
        snr_score = min(100, (overall_snr / 100) * 25)          # 25 points for S/N
        noise_score = max(0, 25 - (baseline_noise / max_signal) * 100)  # 25 points for low noise
        drift_score = max(0, 25 - (baseline_drift / max_signal) * 1000)  # 25 points for low drift
        efficiency_score = min(25, analysis_efficiency * 5)     # 25 points for efficiency
        
        data_quality_score = snr_score + noise_score + drift_score + efficiency_score
        
        return ChromatogramQuality(
            baseline_noise=baseline_noise,
            baseline_drift=baseline_drift,
            overall_snr=overall_snr,
            resolution_index=0.0,  # Will be calculated with peaks
            peak_capacity=peak_capacity,
            analysis_efficiency=analysis_efficiency,
            data_quality_score=data_quality_score
        )
    
    def _detect_and_analyze_peaks(self, time_data: np.ndarray, intensity_data: np.ndarray) -> List[PeakData]:
        """Advanced peak detection and analysis"""
        
        # Calculate noise level
        noise_level = np.std(intensity_data[:min(100, len(intensity_data))])
        peak_threshold = self.peak_threshold * noise_level
        
        # Find peaks using gradient analysis
        peaks = []
        
        # Smooth data slightly for peak detection
        from scipy import signal
        smoothed_intensity = signal.savgol_filter(intensity_data, 
                                                window_length=min(11, len(intensity_data)//10), 
                                                polyorder=2)
        
        # Find local maxima
        peak_indices = signal.find_peaks(
            smoothed_intensity,
            height=peak_threshold,
            distance=max(5, int(self.min_peak_width * len(time_data) / (time_data[-1] - time_data[0]))),
            width=1
        )[0]
        
        for peak_idx in peak_indices:
            try:
                peak_data = self._analyze_single_peak(
                    time_data, intensity_data, peak_idx, noise_level
                )
                if peak_data:
                    peaks.append(peak_data)
            except Exception as e:
                self.logger.warning(f"Failed to analyze peak at index {peak_idx}: {e}")
        
        return peaks
    
    def _analyze_single_peak(
        self, 
        time_data: np.ndarray, 
        intensity_data: np.ndarray, 
        peak_idx: int,
        noise_level: float
    ) -> Optional[PeakData]:
        """Detailed analysis of individual peak"""
        
        peak_height = intensity_data[peak_idx]
        peak_time = time_data[peak_idx]
        
        # Find peak boundaries (where signal drops to 5% of peak height)
        height_threshold = max(noise_level * 2, peak_height * 0.05)
        
        # Search left for peak start
        start_idx = peak_idx
        for i in range(peak_idx, max(0, peak_idx - 200), -1):
            if intensity_data[i] <= height_threshold:
                start_idx = i
                break
        
        # Search right for peak end
        end_idx = peak_idx
        for i in range(peak_idx, min(len(intensity_data), peak_idx + 200)):
            if intensity_data[i] <= height_threshold:
                end_idx = i
                break
        
        # Skip peaks that are too narrow or too wide
        peak_width_points = end_idx - start_idx
        if peak_width_points < 3:
            return None
        
        # Calculate peak area (trapezoidal integration)
        peak_area = np.trapz(
            intensity_data[start_idx:end_idx+1], 
            time_data[start_idx:end_idx+1]
        )
        
        # Width at half maximum
        half_height = peak_height / 2 + height_threshold
        half_indices = np.where(intensity_data[start_idx:end_idx+1] >= half_height)[0]
        if len(half_indices) > 0:
            width_at_half = time_data[start_idx + half_indices[-1]] - time_data[start_idx + half_indices[0]]
        else:
            width_at_half = time_data[end_idx] - time_data[start_idx]
        
        # Symmetry factor (tailing factor)
        # T = (a + b) / (2 * a) where a is left half-width, b is right half-width
        peak_center_idx = peak_idx
        left_half_idx = start_idx + half_indices[0] if len(half_indices) > 0 else start_idx
        right_half_idx = start_idx + half_indices[-1] if len(half_indices) > 0 else end_idx
        
        a = time_data[peak_center_idx] - time_data[left_half_idx]
        b = time_data[right_half_idx] - time_data[peak_center_idx]
        
        if a > 0:
            symmetry_factor = (a + b) / (2 * a)
        else:
            symmetry_factor = 1.0
        
        # Theoretical plates (chromatographic efficiency)
        if width_at_half > 0:
            theoretical_plates = int(5.54 * (peak_time / width_at_half) ** 2)
        else:
            theoretical_plates = 1000  # Default for very sharp peaks
        
        # Signal-to-noise ratio
        signal_to_noise = peak_height / noise_level if noise_level > 0 else 1000
        
        return PeakData(
            retention_time=peak_time,
            peak_height=peak_height,
            peak_area=peak_area,
            peak_width=width_at_half,
            symmetry_factor=symmetry_factor,
            theoretical_plates=theoretical_plates,
            signal_to_noise=signal_to_noise,
            start_time=time_data[start_idx],
            end_time=time_data[end_idx]
        )
    
    def _generate_diagnostics(
        self, 
        quality: ChromatogramQuality, 
        peaks: List[PeakData],
        chromatogram: RawChromatogramData
    ) -> Dict[str, Any]:
        """Generate expert diagnostic assessment"""
        
        diagnostics = {
            "data_quality_issues": [],
            "peak_quality_issues": [],
            "method_performance": {},
            "detector_status": "unknown"
        }
        
        # Data quality diagnostics
        if quality.baseline_noise > 1000:  # Adjust threshold based on detector
            diagnostics["data_quality_issues"].append("High baseline noise detected")
        
        if quality.baseline_drift > 100:  # Adjust threshold
            diagnostics["data_quality_issues"].append("Significant baseline drift present")
        
        if quality.overall_snr < 50:
            diagnostics["data_quality_issues"].append("Poor signal-to-noise ratio")
        
        # Peak quality diagnostics
        if peaks:
            avg_symmetry = np.mean([p.symmetry_factor for p in peaks])
            if avg_symmetry > 2.0:
                diagnostics["peak_quality_issues"].append("Peak tailing detected (poor column performance)")
            
            avg_efficiency = np.mean([p.theoretical_plates for p in peaks])
            if avg_efficiency < 1000:
                diagnostics["peak_quality_issues"].append("Low chromatographic efficiency")
            
            poor_peaks = [p for p in peaks if p.signal_to_noise < 10]
            if len(poor_peaks) > len(peaks) * 0.3:
                diagnostics["peak_quality_issues"].append("Multiple peaks with poor S/N ratio")
        
        # Method performance assessment
        diagnostics["method_performance"] = {
            "analysis_efficiency": quality.analysis_efficiency,
            "peak_capacity_utilization": len(peaks) / quality.peak_capacity if quality.peak_capacity > 0 else 0,
            "average_peak_quality": np.mean([p.signal_to_noise for p in peaks]) if peaks else 0
        }
        
        # Detector status inference
        if chromatogram.detector_type:
            if quality.overall_snr > 100:
                diagnostics["detector_status"] = "good"
            elif quality.overall_snr > 50:
                diagnostics["detector_status"] = "acceptable"
            else:
                diagnostics["detector_status"] = "poor"
        
        return diagnostics
    
    def _generate_recommendations(
        self, 
        quality: ChromatogramQuality, 
        peaks: List[PeakData]
    ) -> List[Dict[str, Any]]:
        """Generate expert recommendations for improvement"""
        
        recommendations = []
        
        # Noise recommendations
        if quality.baseline_noise > 1000:
            recommendations.append({
                "category": "Noise Reduction",
                "priority": "High",
                "action": "Check detector cleanliness and gas purity",
                "expected_improvement": "50-80% noise reduction"
            })
        
        # Drift recommendations  
        if quality.baseline_drift > 100:
            recommendations.append({
                "category": "Baseline Stability", 
                "priority": "Medium",
                "action": "Verify temperature stability and detector equilibration",
                "expected_improvement": "Improved baseline stability"
            })
        
        # Peak shape recommendations
        if peaks:
            avg_symmetry = np.mean([p.symmetry_factor for p in peaks])
            if avg_symmetry > 2.0:
                recommendations.append({
                    "category": "Peak Shape",
                    "priority": "High", 
                    "action": "Check injection technique and column condition",
                    "expected_improvement": "Better peak symmetry and resolution"
                })
        
        # Sensitivity recommendations
        if quality.overall_snr < 50:
            recommendations.append({
                "category": "Sensitivity",
                "priority": "Critical",
                "action": "Optimize detector conditions and check for contamination",
                "expected_improvement": "2-5x sensitivity improvement"
            })
        
        # Method efficiency recommendations
        if quality.analysis_efficiency < 1.0:  # Less than 1 peak per minute
            recommendations.append({
                "category": "Method Efficiency",
                "priority": "Medium",
                "action": "Consider faster temperature program or shorter column",
                "expected_improvement": "Reduced analysis time"
            })
        
        return recommendations
    
    def _peak_to_dict(self, peak: PeakData) -> Dict[str, Any]:
        """Convert peak data to dictionary format"""
        return {
            "retention_time": peak.retention_time,
            "height": peak.peak_height,
            "area": peak.peak_area,
            "width": peak.peak_width,
            "symmetry_factor": peak.symmetry_factor,
            "theoretical_plates": peak.theoretical_plates,
            "signal_to_noise": peak.signal_to_noise,
            "start_time": peak.start_time,
            "end_time": peak.end_time,
            "compound_id": peak.compound_id
        }

def main():
    """Demonstration of raw chromatogram processing"""
    
    print("🔬 RAW CHROMATOGRAM DATA PROCESSOR")
    print("=" * 60)
    print("Expert analysis of raw GC chromatographic data")
    print()
    
    # Initialize processor
    processor = ChromatogramProcessor()
    
    # Generate synthetic chromatogram data for demonstration
    print("📊 Generating synthetic chromatogram data...")
    
    # Time data (20 minute analysis, 10 Hz sampling)
    time_data = np.linspace(0, 20, 12000).tolist()
    
    # Base intensity with noise and drift
    baseline_level = 100
    noise_level = 5
    drift_rate = 2  # units per minute
    
    intensity_data = []
    for i, t in enumerate(time_data):
        # Baseline with drift and noise
        baseline = baseline_level + drift_rate * t + np.random.normal(0, noise_level)
        
        # Add some peaks
        peak_signal = 0
        
        # Peak 1: Strong peak at 3.5 min
        if 3.0 <= t <= 4.0:
            peak_signal += 2000 * np.exp(-((t - 3.5) / 0.1) ** 2)
        
        # Peak 2: Medium peak at 7.2 min
        if 6.8 <= t <= 7.6:
            peak_signal += 800 * np.exp(-((t - 7.2) / 0.08) ** 2)
        
        # Peak 3: Small peak at 12.1 min
        if 11.7 <= t <= 12.5:
            peak_signal += 300 * np.exp(-((t - 12.1) / 0.12) ** 2)
        
        # Peak 4: Tailing peak at 15.8 min
        if 15.0 <= t <= 17.0:
            # Asymmetric peak with tailing
            if t <= 15.8:
                peak_signal += 600 * np.exp(-((t - 15.8) / 0.15) ** 2)
            else:
                peak_signal += 600 * np.exp(-((t - 15.8) / 0.3) ** 2)
        
        intensity_data.append(baseline + peak_signal)
    
    # Create chromatogram data structure
    chromatogram = RawChromatogramData(
        time_data=time_data,
        intensity_data=intensity_data,
        sampling_rate=10.0,  # Hz
        detector_type="FID",
        method_name="Test Method"
    )
    
    print("✅ Synthetic chromatogram generated:")
    print(f"  • Data points: {len(time_data):,}")
    print(f"  • Time range: {time_data[0]:.1f} - {time_data[-1]:.1f} minutes")
    print(f"  • Sampling rate: {chromatogram.sampling_rate} Hz")
    print(f"  • Detector type: {chromatogram.detector_type}")
    print()
    
    # Process the raw data
    print("🔍 Processing raw chromatogram data...")
    results = processor.process_raw_data(chromatogram)
    
    # Display results
    print("📈 ANALYSIS RESULTS:")
    print("-" * 40)
    
    data_summary = results["data_summary"]
    print(f"📊 Data Summary:")
    print(f"  • Total data points: {data_summary['total_data_points']:,}")
    print(f"  • Analysis time: {data_summary['analysis_time_min']:.1f} minutes")
    print(f"  • Sampling rate: {data_summary['sampling_rate_hz']:.1f} Hz")
    print(f"  • Intensity range: {data_summary['intensity_range'][0]:.0f} - {data_summary['intensity_range'][1]:.0f}")
    print()
    
    quality = results["quality_assessment"]
    print(f"🎯 Quality Assessment:")
    print(f"  • Data Quality Score: {quality['data_quality_score']:.1f}/100")
    print(f"  • Overall S/N Ratio: {quality['overall_snr']:.1f}:1")
    print(f"  • Baseline Noise: {quality['baseline_noise']:.1f}")
    print(f"  • Baseline Drift: {quality['baseline_drift']:.2f}")
    print(f"  • Peak Capacity: {quality['peak_capacity']}")
    print()
    
    peak_analysis = results["peak_analysis"]
    print(f"🏔️ Peak Analysis:")
    print(f"  • Peaks Detected: {peak_analysis['peaks_detected']}")
    print(f"  • Average Peak Width: {peak_analysis['average_peak_width']:.3f} min")
    print(f"  • Average Symmetry: {peak_analysis['average_symmetry']:.2f}")
    print(f"  • Average Efficiency: {peak_analysis['average_efficiency']:.0f} plates")
    print()
    
    if peak_analysis["peak_data"]:
        print("🔍 Individual Peaks:")
        for i, peak in enumerate(peak_analysis["peak_data"][:5], 1):  # Show first 5 peaks
            print(f"  Peak {i}: RT={peak['retention_time']:.2f} min, "
                  f"Height={peak['height']:.0f}, S/N={peak['signal_to_noise']:.1f}")
        print()
    
    # Show diagnostics and recommendations
    diagnostics = results["diagnostics"]
    if diagnostics["data_quality_issues"]:
        print("⚠️ Data Quality Issues:")
        for issue in diagnostics["data_quality_issues"]:
            print(f"  • {issue}")
        print()
    
    recommendations = results["recommendations"]
    if recommendations:
        print("💡 Recommendations:")
        for rec in recommendations:
            print(f"  • {rec['category']} ({rec['priority']}): {rec['action']}")
        print()
    
    print("🏆 Raw chromatogram processing completed successfully!")
    print("The system can analyze any GC chromatogram data with time/intensity arrays!")
    
    return True

if __name__ == "__main__":
    try:
        main()
    except ImportError as e:
        print(f"⚠️ Import error (scipy not available): {e}")
        print("Basic processing would work, advanced features require scipy")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()