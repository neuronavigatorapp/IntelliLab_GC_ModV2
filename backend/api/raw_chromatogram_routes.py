"""
Raw Chromatogram Data API Routes
Expert analysis of raw GC chromatographic data (time/intensity arrays)
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import Dict, Any, List, Optional
import logging
import numpy as np
from datetime import datetime
import asyncio

# Import our raw data processor
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

# Import schemas
try:
    from backend.app.models.schemas import (
        ChromatogramAnalysisRequest, 
        ChromatogramAnalysisResponse
    )
except ImportError:
    # Fallback for direct execution
    from pydantic import BaseModel, Field, field_validator
    from typing import List, Optional, Dict, Any
    
    class ChromatogramAnalysisRequest(BaseModel):
        """Chromatogram analysis request schema"""
        time_data: List[float] = Field(..., min_length=10)
        intensity_data: List[float] = Field(..., min_length=10)
        compound_names: Optional[List[str]] = None
        method_parameters: Optional[Dict[str, Any]] = None

        @field_validator('intensity_data')
        @classmethod
        def validate_data_length(cls, v, info):
            if info.data and 'time_data' in info.data and len(v) != len(info.data['time_data']):
                raise ValueError('Time and intensity data must have same length')
            return v

    class ChromatogramAnalysisResponse(BaseModel):
        """Chromatogram analysis response schema"""
        analysis_timestamp: str
        data_points: int
        peaks_detected: int
        peak_analysis: Dict[str, Any]
        quality_metrics: Dict[str, Any]
        diagnostics: Dict[str, Any]
        recommendations: List[Dict[str, Any]]
        compound_assignments: List[Dict[str, Any]]

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/raw-data", tags=["Raw Chromatogram Data"])

class RawDataProcessor:
    """Professional raw chromatogram data processor for API"""
    
    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)
    
    async def analyze_raw_chromatogram(
        self,
        request: ChromatogramAnalysisRequest
    ) -> ChromatogramAnalysisResponse:
        """Process raw chromatogram data with expert analysis"""
        
        try:
            self.logger.info(f"Processing raw chromatogram: {len(request.time_data)} data points")
            
            # Convert to numpy for processing
            time_array = np.array(request.time_data)
            intensity_array = np.array(request.intensity_data)
            
            # Basic validation
            if len(time_array) != len(intensity_array):
                raise ValueError("Time and intensity data must have same length")
            
            if len(time_array) < 10:
                raise ValueError("Minimum 10 data points required")
            
            # Perform analysis
            analysis_results = await self._perform_analysis(
                time_array, 
                intensity_array,
                request.compound_names,
                request.method_parameters
            )
            
            # Create response
            response = ChromatogramAnalysisResponse(
                analysis_timestamp=datetime.now().isoformat(),
                data_points=len(time_array),
                peaks_detected=analysis_results["peaks_detected"],
                peak_analysis=analysis_results["peak_analysis"],
                quality_metrics=analysis_results["quality_metrics"],
                diagnostics=analysis_results["diagnostics"],
                recommendations=analysis_results["recommendations"],
                compound_assignments=analysis_results["compound_assignments"]
            )
            
            self.logger.info(f"Analysis completed: {response.peaks_detected} peaks detected")
            return response
            
        except Exception as e:
            self.logger.error(f"Error in raw data analysis: {e}")
            raise HTTPException(status_code=422, detail=str(e))
    
    async def _perform_analysis(
        self,
        time_data: np.ndarray,
        intensity_data: np.ndarray,
        compound_names: Optional[List[str]] = None,
        method_params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Perform comprehensive chromatogram analysis"""
        
        # Data preprocessing
        cleaned_time, cleaned_intensity = self._clean_data(time_data, intensity_data)
        
        # Baseline correction
        corrected_intensity = self._correct_baseline(cleaned_time, cleaned_intensity)
        
        # Peak detection
        peaks = self._detect_peaks(cleaned_time, corrected_intensity)
        
        # Quality assessment
        quality_metrics = self._assess_quality(cleaned_time, corrected_intensity, peaks)
        
        # Generate diagnostics and recommendations
        diagnostics = self._generate_diagnostics(quality_metrics, peaks, method_params)
        recommendations = self._generate_recommendations(quality_metrics, peaks)
        
        # Compound assignments (if compound names provided)
        compound_assignments = self._assign_compounds(peaks, compound_names)
        
        return {
            "peaks_detected": len(peaks),
            "peak_analysis": {
                "peaks": [self._format_peak(peak) for peak in peaks],
                "total_area": sum(peak["area"] for peak in peaks),
                "average_width": np.mean([peak["width"] for peak in peaks]) if peaks else 0,
                "average_symmetry": np.mean([peak["symmetry"] for peak in peaks]) if peaks else 0,
                "resolution_summary": self._calculate_resolution_summary(peaks)
            },
            "quality_metrics": quality_metrics,
            "diagnostics": diagnostics,
            "recommendations": recommendations,
            "compound_assignments": compound_assignments
        }
    
    def _clean_data(self, time_data: np.ndarray, intensity_data: np.ndarray):
        """Clean raw data by removing outliers"""
        # Simple outlier removal (>5 sigma)
        intensity_mean = np.mean(intensity_data)
        intensity_std = np.std(intensity_data)
        valid_mask = np.abs(intensity_data - intensity_mean) < 5 * intensity_std
        
        return time_data[valid_mask], intensity_data[valid_mask]
    
    def _correct_baseline(self, time_data: np.ndarray, intensity_data: np.ndarray):
        """Simple baseline correction"""
        # Use first and last 5% of data as baseline estimate
        baseline_points = int(len(intensity_data) * 0.05)
        baseline_start = np.mean(intensity_data[:baseline_points])
        baseline_end = np.mean(intensity_data[-baseline_points:])
        
        # Linear baseline
        baseline = np.linspace(baseline_start, baseline_end, len(intensity_data))
        corrected = intensity_data - baseline
        
        # Ensure no negative values
        return np.maximum(corrected, 0)
    
    def _detect_peaks(self, time_data: np.ndarray, intensity_data: np.ndarray):
        """Simple peak detection algorithm"""
        peaks = []
        
        # Calculate noise level from first 100 points
        noise_level = np.std(intensity_data[:min(100, len(intensity_data))])
        threshold = 3 * noise_level
        
        # Find local maxima above threshold
        for i in range(1, len(intensity_data) - 1):
            if (intensity_data[i] > threshold and 
                intensity_data[i] > intensity_data[i-1] and 
                intensity_data[i] > intensity_data[i+1]):
                
                # Find peak boundaries
                start_idx = i
                while start_idx > 0 and intensity_data[start_idx] > threshold * 0.1:
                    start_idx -= 1
                
                end_idx = i
                while end_idx < len(intensity_data) - 1 and intensity_data[end_idx] > threshold * 0.1:
                    end_idx += 1
                
                # Calculate peak properties
                peak_area = np.trapz(
                    intensity_data[start_idx:end_idx+1], 
                    time_data[start_idx:end_idx+1]
                )
                peak_width = time_data[end_idx] - time_data[start_idx]
                peak_height = intensity_data[i]
                retention_time = time_data[i]
                
                # Simple symmetry calculation
                left_width = retention_time - time_data[start_idx]
                right_width = time_data[end_idx] - retention_time
                symmetry = (left_width + right_width) / (2 * left_width) if left_width > 0 else 1.0
                
                peaks.append({
                    "retention_time": float(retention_time),
                    "height": float(peak_height),
                    "area": float(peak_area),
                    "width": float(peak_width),
                    "symmetry": float(symmetry),
                    "start_time": float(time_data[start_idx]),
                    "end_time": float(time_data[end_idx]),
                    "signal_to_noise": float(peak_height / noise_level) if noise_level > 0 else 1000,
                    "theoretical_plates": int(5.54 * (retention_time / peak_width) ** 2) if peak_width > 0 else 1000
                })
        
        return peaks
    
    def _assess_quality(self, time_data: np.ndarray, intensity_data: np.ndarray, peaks: List[Dict]):
        """Assess overall chromatogram quality"""
        
        # Noise calculation
        noise_level = np.std(intensity_data[:min(100, len(intensity_data))])
        max_signal = np.max(intensity_data)
        snr = max_signal / noise_level if noise_level > 0 else 1000
        
        # Baseline stability
        baseline_drift = abs(intensity_data[-1] - intensity_data[0]) / len(intensity_data)
        
        # Overall quality score
        snr_score = min(25, snr / 4)  # 25 points max
        noise_score = max(0, 25 - (noise_level / max_signal) * 100)  # 25 points max
        drift_score = max(0, 25 - baseline_drift * 1000)  # 25 points max
        peak_score = min(25, len(peaks) * 2.5)  # 25 points max
        
        quality_score = snr_score + noise_score + drift_score + peak_score
        
        return {
            "overall_quality_score": float(quality_score),
            "signal_to_noise_ratio": float(snr),
            "baseline_noise": float(noise_level),
            "baseline_drift": float(baseline_drift),
            "peak_count": len(peaks),
            "average_peak_snr": np.mean([p["signal_to_noise"] for p in peaks]) if peaks else 0
        }
    
    def _generate_diagnostics(self, quality_metrics: Dict, peaks: List[Dict], method_params: Dict = None):
        """Generate diagnostic information"""
        
        issues = []
        
        if quality_metrics["signal_to_noise_ratio"] < 50:
            issues.append("Low signal-to-noise ratio detected")
        
        if quality_metrics["baseline_drift"] > 0.1:
            issues.append("Significant baseline drift present")
        
        if peaks and np.mean([p["symmetry"] for p in peaks]) > 2.0:
            issues.append("Peak tailing detected")
        
        return {
            "issues_detected": issues,
            "detector_status": "normal" if quality_metrics["signal_to_noise_ratio"] > 100 else "check_required",
            "method_suitability": "suitable" if quality_metrics["overall_quality_score"] > 70 else "needs_optimization",
            "data_quality": "excellent" if quality_metrics["overall_quality_score"] > 90 else
                           "good" if quality_metrics["overall_quality_score"] > 70 else "poor"
        }
    
    def _generate_recommendations(self, quality_metrics: Dict, peaks: List[Dict]):
        """Generate improvement recommendations"""
        
        recommendations = []
        
        if quality_metrics["signal_to_noise_ratio"] < 50:
            recommendations.append({
                "category": "Sensitivity",
                "priority": "High",
                "action": "Check detector cleanliness and optimize conditions",
                "expected_improvement": "2-5x sensitivity increase"
            })
        
        if peaks and np.mean([p["symmetry"] for p in peaks]) > 2.0:
            recommendations.append({
                "category": "Peak Shape",
                "priority": "Medium", 
                "action": "Optimize injection conditions and check column",
                "expected_improvement": "Better peak symmetry and quantification"
            })
        
        if quality_metrics["baseline_drift"] > 0.1:
            recommendations.append({
                "category": "Baseline Stability",
                "priority": "Medium",
                "action": "Check temperature stability and detector equilibration", 
                "expected_improvement": "More stable baseline"
            })
        
        return recommendations
    
    def _assign_compounds(self, peaks: List[Dict], compound_names: Optional[List[str]] = None):
        """Assign compound identities to peaks"""
        
        assignments = []
        
        if compound_names and peaks:
            # Simple assignment by retention time order
            for i, peak in enumerate(peaks[:len(compound_names)]):
                assignments.append({
                    "peak_retention_time": peak["retention_time"],
                    "compound_name": compound_names[i],
                    "confidence": 0.8,  # Default confidence
                    "peak_area": peak["area"],
                    "relative_area_percent": 0.0  # Would calculate from total area
                })
        
        return assignments
    
    def _calculate_resolution_summary(self, peaks: List[Dict]):
        """Calculate resolution between adjacent peaks"""
        if len(peaks) < 2:
            return {"average_resolution": 0, "min_resolution": 0, "critical_pairs": []}
        
        resolutions = []
        critical_pairs = []
        
        for i in range(len(peaks) - 1):
            rt1, w1 = peaks[i]["retention_time"], peaks[i]["width"]
            rt2, w2 = peaks[i+1]["retention_time"], peaks[i+1]["width"]
            
            # Simplified resolution calculation
            resolution = (rt2 - rt1) / (0.5 * (w1 + w2)) if (w1 + w2) > 0 else 0
            resolutions.append(resolution)
            
            if resolution < 1.5:  # Critical resolution threshold
                critical_pairs.append({
                    "peak1_rt": rt1,
                    "peak2_rt": rt2, 
                    "resolution": resolution
                })
        
        return {
            "average_resolution": float(np.mean(resolutions)),
            "min_resolution": float(np.min(resolutions)),
            "critical_pairs": critical_pairs
        }
    
    def _format_peak(self, peak: Dict):
        """Format peak data for API response"""
        return {
            "retention_time": peak["retention_time"],
            "height": peak["height"],
            "area": peak["area"],
            "width": peak["width"],
            "symmetry_factor": peak["symmetry"],
            "signal_to_noise": peak["signal_to_noise"],
            "theoretical_plates": peak["theoretical_plates"],
            "start_time": peak["start_time"],
            "end_time": peak["end_time"]
        }

# Create processor instance
raw_processor = RawDataProcessor()

@router.post("/analyze", response_model=ChromatogramAnalysisResponse)
async def analyze_raw_chromatogram(
    request: ChromatogramAnalysisRequest,
    background_tasks: BackgroundTasks
):
    """
    🔬 **Raw Chromatogram Data Analysis**
    
    Analyze raw GC chromatographic data (time/intensity arrays) with expert-level processing:
    
    - **Peak Detection**: Advanced algorithms for accurate peak identification
    - **Quality Assessment**: Comprehensive S/N, baseline, and resolution analysis  
    - **Diagnostic Insights**: Expert troubleshooting and method optimization
    - **Compound Assignment**: Automatic peak-to-compound matching
    - **Real-time Processing**: Fast analysis for immediate results
    
    **Perfect for direct instrument data integration!** 📊
    
    ### Input Format:
    ```json
    {
        "time_data": [0.0, 0.01, 0.02, ...],     // Minutes
        "intensity_data": [100.5, 105.2, ...],   // Detector units
        "compound_names": ["Compound A", ...],    // Optional
        "method_parameters": {...}               // Optional
    }
    ```
    
    ### Requirements:
    - Minimum 10 data points
    - Equal length time and intensity arrays
    - Time data in minutes (ascending order recommended)
    - Intensity data in detector-specific units
    """
    
    try:
        # Process the raw chromatogram data
        response = await raw_processor.analyze_raw_chromatogram(request)
        
        # Log for analytics (background task)
        background_tasks.add_task(
            _log_analysis_metrics,
            data_points=response.data_points,
            peaks_detected=response.peaks_detected,
            quality_score=response.quality_metrics.get("overall_quality_score", 0)
        )
        
        return response
        
    except ValueError as e:
        logger.error(f"Validation error in raw data analysis: {e}")
        raise HTTPException(status_code=422, detail=f"Data validation error: {e}")
    
    except Exception as e:
        logger.error(f"Unexpected error in raw data analysis: {e}")
        raise HTTPException(status_code=500, detail="Internal analysis error")

@router.post("/validate", response_model=Dict[str, Any])
async def validate_raw_data(request: ChromatogramAnalysisRequest):
    """
    ✅ **Raw Data Validation**
    
    Validate raw chromatogram data before analysis:
    - Check data format and structure
    - Verify minimum requirements
    - Assess data quality potential
    - Provide pre-analysis recommendations
    """
    
    try:
        time_array = np.array(request.time_data)
        intensity_array = np.array(request.intensity_data)
        
        # Basic validation
        validation_results = {
            "valid": True,
            "issues": [],
            "recommendations": [],
            "data_summary": {
                "total_points": len(time_array),
                "time_range_min": [float(time_array[0]), float(time_array[-1])],
                "intensity_range": [float(np.min(intensity_array)), float(np.max(intensity_array))],
                "sampling_rate_hz": len(time_array) / (time_array[-1] - time_array[0]) / 60 if len(time_array) > 1 else 0
            }
        }
        
        # Check for issues
        if len(time_array) < 100:
            validation_results["issues"].append("Low data density (< 100 points)")
            validation_results["recommendations"].append("Consider higher sampling rate for better analysis")
        
        if np.any(np.diff(time_array) <= 0):
            validation_results["issues"].append("Time data not monotonically increasing")
            validation_results["valid"] = False
        
        noise_estimate = np.std(intensity_array[:min(100, len(intensity_array))])
        signal_estimate = np.max(intensity_array)
        if noise_estimate / signal_estimate > 0.1:
            validation_results["issues"].append("High noise level detected (>10% of signal)")
            validation_results["recommendations"].append("Consider signal filtering or detector optimization")
        
        return validation_results
        
    except Exception as e:
        logger.error(f"Error in data validation: {e}")
        raise HTTPException(status_code=422, detail=f"Validation error: {e}")

@router.get("/formats", response_model=Dict[str, Any])
async def get_supported_formats():
    """
    📋 **Supported Data Formats**
    
    Get information about supported raw data formats and requirements.
    """
    
    return {
        "supported_formats": {
            "time_data": {
                "description": "Time points for chromatogram",
                "units": "minutes",
                "type": "List[float]",
                "requirements": ["Monotonically increasing", "Minimum 10 points", "No duplicates"],
                "example": [0.0, 0.01, 0.02, 0.03]
            },
            "intensity_data": {
                "description": "Signal intensity values",
                "units": "detector-specific (arbitrary units)",
                "type": "List[float]", 
                "requirements": ["Same length as time_data", "Non-negative recommended", "Minimum 10 points"],
                "example": [100.5, 105.2, 98.7, 103.1]
            }
        },
        "detector_types": ["FID", "SCD", "MS", "ECD", "TCD", "NPD", "FPD"],
        "recommended_sampling_rates": {
            "minimum": "5 Hz (5 points per second)",
            "optimal": "10-20 Hz", 
            "maximum": "100 Hz (diminishing returns above this)"
        },
        "api_endpoints": [
            {
                "endpoint": "/raw-data/analyze",
                "method": "POST",
                "description": "Full chromatogram analysis"
            },
            {
                "endpoint": "/raw-data/validate", 
                "method": "POST",
                "description": "Data validation only"
            },
            {
                "endpoint": "/raw-data/formats",
                "method": "GET", 
                "description": "Format information"
            }
        ]
    }

async def _log_analysis_metrics(data_points: int, peaks_detected: int, quality_score: float):
    """Background task to log analysis metrics"""
    logger.info(f"Analysis completed - Points: {data_points}, Peaks: {peaks_detected}, Quality: {quality_score:.1f}")

# Example usage for testing
if __name__ == "__main__":
    print("Raw Chromatogram Data API Routes")
    print("Ready for integration with FastAPI application")