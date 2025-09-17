#!/usr/bin/env python3
"""
AI Integration Bridge for OCR-to-Troubleshooter Pipeline
Seamless connection between OCR output and AI troubleshooter data structures
"""

import logging
from typing import Dict, Any, List, Optional, Union
from datetime import datetime
import json
import numpy as np
from dataclasses import asdict

from app.models.schemas import (
    OCRProcessingResult, OCRTextRegion, OCRPeakData, OCRMethodParameters, OCRSampleInfo,
    OCRImageType, ChromatogramData, PeakData, InstrumentData, AnalysisRequest
)


# =================== AI INTEGRATION SERVICE ===================

class OCRAIIntegrationService:
    """Bridge service connecting OCR results to AI troubleshooter inputs"""
    
    def __init__(self):
        self.logger = logging.getLogger('IntelliLab.OCR.AIIntegration')
        self.logger.info("OCR AI Integration Service initialized")
    
    def transform_ocr_to_chromatogram_data(self, ocr_result: OCRProcessingResult) -> ChromatogramData:
        """
        Transform OCR processing result into ChromatogramData for AI analysis
        
        Args:
            ocr_result: Complete OCR processing result
            
        Returns:
            ChromatogramData: Structured data ready for AI troubleshooter
        """
        
        try:
            self.logger.info(f"Transforming OCR result to ChromatogramData")
            
            # Extract peaks from OCR result
            peaks = self._transform_peaks(ocr_result.peaks_data or [])
            
            # Extract method information
            method_info = self._transform_method_parameters(ocr_result.method_parameters)
            
            # Extract sample information  
            sample_info = self._transform_sample_info(ocr_result.sample_info)
            
            # Create instrument data from OCR metadata
            instrument_data = self._create_instrument_data_from_ocr(ocr_result)
            
            # Aggregate text regions for additional context
            text_context = self._aggregate_text_regions(ocr_result.text_regions or [])
            
            # Create ChromatogramData
            chromatogram_data = ChromatogramData(
                file_path=f"ocr_processed_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
                sample_name=sample_info.get("sample_name", "Unknown_Sample"),
                method_name=method_info.get("method_name", "Unknown_Method"),
                injection_date=sample_info.get("analysis_date") or datetime.utcnow(),
                peaks=peaks,
                total_runtime=method_info.get("total_runtime", 0.0),
                instrument_type=instrument_data.get("instrument_type", "GC-MS"),
                detector_type=method_info.get("detector_type") or "Unknown",
                column_info=method_info.get("column_info", {}),
                method_parameters=method_info,
                sample_info=sample_info,
                raw_data_available=False,  # OCR data doesn't include raw signal
                processing_metadata={
                    "source": "ocr_extraction",
                    "ocr_confidence": ocr_result.confidence_score,
                    "image_type": ocr_result.image_type.value if ocr_result.image_type else "unknown",
                    "extraction_timestamp": datetime.utcnow().isoformat(),
                    "text_context": text_context,
                    "original_processing_metadata": getattr(ocr_result, 'processing_metadata', {})
                }
            )
            
            self.logger.info(f"Successfully transformed OCR result to ChromatogramData with {len(peaks)} peaks")
            
            return chromatogram_data
            
        except Exception as e:
            self.logger.error(f"Failed to transform OCR result to ChromatogramData: {str(e)}")
            raise
    
    def _transform_peaks(self, ocr_peaks: List[OCRPeakData]) -> List[PeakData]:
        """Transform OCR peak data to AI-compatible PeakData"""
        
        transformed_peaks = []
        
        for ocr_peak in ocr_peaks:
            try:
                # Extract numeric values with proper handling
                retention_time = self._safe_float_conversion(ocr_peak.retention_time, 0.0)
                area = self._safe_float_conversion(ocr_peak.area, 0.0)
                height = self._safe_float_conversion(ocr_peak.height, 0.0)
                area_percent = self._safe_float_conversion(ocr_peak.area_percent, 0.0)
                
                # Create PeakData
                peak = PeakData(
                    peak_number=ocr_peak.peak_number or len(transformed_peaks) + 1,
                    retention_time=retention_time,
                    area=area,
                    height=height,
                    area_percent=area_percent,
                    width_at_half_height=0.0,  # Not typically available from OCR
                    tailing_factor=1.0,        # Default value
                    theoretical_plates=0,      # Not available from OCR
                    resolution=0.0,            # Not available from OCR
                    compound_name=getattr(ocr_peak, 'compound_name', None) or f"Unknown_{ocr_peak.peak_number}",
                    confidence=ocr_peak.confidence or 0.8,
                    processing_notes={
                        "source": "ocr_extraction",
                        "original_ocr_data": asdict(ocr_peak) if hasattr(ocr_peak, '__dataclass_fields__') else str(ocr_peak)
                    }
                )
                
                transformed_peaks.append(peak)
                
            except Exception as e:
                self.logger.warning(f"Failed to transform OCR peak {ocr_peak}: {str(e)}")
                continue
        
        return transformed_peaks
    
    def _transform_method_parameters(self, ocr_method: Optional[OCRMethodParameters]) -> Dict[str, Any]:
        """Transform OCR method parameters to AI-compatible format"""
        
        if not ocr_method:
            return {}
        
        try:
            method_info = {
                "method_name": "Unknown_Method",  # OCRMethodParameters doesn't have method_name field
                "column_info": {
                    "column_type": ocr_method.column_type,
                    "column_length": ocr_method.column_length,  # Keep as string initially
                },
                "carrier_gas": ocr_method.carrier_gas,
                "flow_rate": ocr_method.flow_rate,  # Keep as string initially
                "injection_volume": ocr_method.injection_volume,
                "inlet_temperature": ocr_method.inlet_temperature,
                "detector_type": ocr_method.detector_type,
                "oven_program": ocr_method.oven_program or [],
                "total_runtime": self._extract_total_runtime_from_program(ocr_method.oven_program or [])
            }
            
            return method_info
            
        except Exception as e:
            self.logger.warning(f"Failed to transform method parameters: {str(e)}")
            return {"method_name": "Unknown_Method"}
    
    def _transform_sample_info(self, ocr_sample: Optional[OCRSampleInfo]) -> Dict[str, Any]:
        """Transform OCR sample information to AI-compatible format"""
        
        if not ocr_sample:
            return {"sample_name": "Unknown_Sample"}
        
        try:
            sample_info = {
                "sample_name": ocr_sample.sample_name or "Unknown_Sample",
                "operator": ocr_sample.operator,
                "analysis_date": self._parse_date(ocr_sample.injection_date),  # Use injection_date field
                "dilution_factor": self._safe_float_conversion(ocr_sample.dilution_factor, 1.0),
                "vial_position": ocr_sample.vial_position,
                "sequence_number": ocr_sample.sequence_number,
            }
            
            return sample_info
            
        except Exception as e:
            self.logger.warning(f"Failed to transform sample info: {str(e)}")
            return {"sample_name": str(ocr_sample) if ocr_sample else "Unknown_Sample"}
    
    def _create_instrument_data_from_ocr(self, ocr_result: OCRProcessingResult) -> Dict[str, Any]:
        """Create instrument data context from OCR metadata"""
        
        try:
            instrument_data = {
                "instrument_type": "GC-MS",  # Default assumption
                "data_source": "ocr_extraction",
                "original_image_type": ocr_result.image_type.value if ocr_result.image_type else "unknown",
                "ocr_confidence": ocr_result.confidence_score,
                "processing_quality": self._assess_processing_quality(ocr_result.confidence_score),
                "extraction_metadata": ocr_result.processing_metadata or {}
            }
            
            return instrument_data
            
        except Exception as e:
            self.logger.warning(f"Failed to create instrument data: {str(e)}")
            return {"instrument_type": "Unknown"}
    
    def _aggregate_text_regions(self, text_regions: List[OCRTextRegion]) -> Dict[str, Any]:
        """Aggregate text regions for additional context"""
        
        try:
            aggregated = {
                "total_regions": len(text_regions),
                "average_confidence": np.mean([r.confidence for r in text_regions]) if text_regions else 0.0,
                "high_confidence_text": [],
                "low_confidence_text": [],
                "all_extracted_text": []
            }
            
            for region in text_regions:
                aggregated["all_extracted_text"].append(region.text)
                
                if region.confidence > 0.8:
                    aggregated["high_confidence_text"].append(region.text)
                elif region.confidence < 0.5:
                    aggregated["low_confidence_text"].append(region.text)
            
            return aggregated
            
        except Exception as e:
            self.logger.warning(f"Failed to aggregate text regions: {str(e)}")
            return {}
    
    def create_analysis_request_from_ocr(self, ocr_result: OCRProcessingResult, 
                                       analysis_type: str = "troubleshooting") -> AnalysisRequest:
        """
        Create an AI analysis request from OCR processing result
        
        Args:
            ocr_result: OCR processing result
            analysis_type: Type of AI analysis to perform
            
        Returns:
            AnalysisRequest: Request ready for AI troubleshooter
        """
        
        try:
            # Transform to chromatogram data
            chromatogram_data = self.transform_ocr_to_chromatogram_data(ocr_result)
            
            # Create analysis request
            analysis_request = AnalysisRequest(
                request_id=f"ocr_analysis_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
                analysis_type=analysis_type,
                chromatogram_data=chromatogram_data,
                priority="normal",
                user_context={
                    "data_source": "ocr_extraction",
                    "original_image_type": ocr_result.image_type.value if ocr_result.image_type else "unknown",
                    "extraction_confidence": ocr_result.confidence_score
                },
                analysis_parameters={
                    "focus_areas": self._determine_focus_areas(ocr_result),
                    "confidence_threshold": 0.7,
                    "include_recommendations": True,
                    "generate_report": True
                },
                requested_outputs=["peak_analysis", "method_validation", "troubleshooting_suggestions"],
                created_at=datetime.utcnow()
            )
            
            self.logger.info(f"Created analysis request {analysis_request.request_id} from OCR result")
            
            return analysis_request
            
        except Exception as e:
            self.logger.error(f"Failed to create analysis request from OCR: {str(e)}")
            raise
    
    def _determine_focus_areas(self, ocr_result: OCRProcessingResult) -> List[str]:
        """Determine analysis focus areas based on OCR extraction quality"""
        
        focus_areas = []
        
        # Always include basic analysis
        focus_areas.append("peak_identification")
        
        # Add method analysis if method parameters were extracted
        if ocr_result.method_parameters:
            focus_areas.append("method_validation")
        
        # Add sample analysis if sample info was extracted
        if ocr_result.sample_info:
            focus_areas.append("sample_analysis")
        
        # Add quality assessment if confidence is low
        if ocr_result.confidence_score < 0.7:
            focus_areas.append("data_quality_assessment")
        
        # Add peak analysis if peaks were found
        if ocr_result.peaks_data and len(ocr_result.peaks_data) > 0:
            focus_areas.append("peak_quality_analysis")
        
        return focus_areas
    
    def validate_ocr_for_ai_processing(self, ocr_result: OCRProcessingResult) -> Dict[str, Any]:
        """
        Validate OCR result quality for AI processing
        
        Args:
            ocr_result: OCR processing result to validate
            
        Returns:
            Dict containing validation results and recommendations
        """
        
        validation_result = {
            "is_suitable_for_ai": False,
            "confidence_score": ocr_result.confidence_score,
            "issues": [],
            "recommendations": [],
            "data_completeness": {},
            "processing_suggestions": []
        }
        
        try:
            # Check overall confidence
            if ocr_result.confidence_score < 0.5:
                validation_result["issues"].append("Low overall OCR confidence")
                validation_result["recommendations"].append("Consider re-processing with higher quality settings")
            elif ocr_result.confidence_score >= 0.7:
                validation_result["is_suitable_for_ai"] = True
            
            # Check data completeness
            completeness = {}
            
            # Check for peaks data
            if ocr_result.peaks_data and len(ocr_result.peaks_data) > 0:
                completeness["peaks_extracted"] = True
                completeness["peak_count"] = len(ocr_result.peaks_data)
            else:
                completeness["peaks_extracted"] = False
                validation_result["issues"].append("No peak data extracted")
                validation_result["recommendations"].append("Verify image contains peak table data")
            
            # Check for method parameters
            if ocr_result.method_parameters:
                completeness["method_parameters"] = True
            else:
                completeness["method_parameters"] = False
                validation_result["processing_suggestions"].append("Limited method information available")
            
            # Check for sample information
            if ocr_result.sample_info:
                completeness["sample_info"] = True
            else:
                completeness["sample_info"] = False
                validation_result["processing_suggestions"].append("Limited sample information available")
            
            validation_result["data_completeness"] = completeness
            
            # Determine overall suitability
            if (validation_result["confidence_score"] >= 0.6 and 
                completeness.get("peaks_extracted", False)):
                validation_result["is_suitable_for_ai"] = True
            
            # Add processing recommendations
            if validation_result["is_suitable_for_ai"]:
                validation_result["recommendations"].append("OCR data is suitable for AI analysis")
            else:
                validation_result["recommendations"].append("Consider improving image quality or OCR settings")
            
            return validation_result
            
        except Exception as e:
            self.logger.error(f"OCR validation failed: {str(e)}")
            validation_result["issues"].append(f"Validation error: {str(e)}")
            return validation_result
    
    # =================== UTILITY METHODS ===================
    
    def _safe_float_conversion(self, value: Any, default: float = 0.0) -> float:
        """Safely convert value to float with fallback"""
        try:
            if value is None:
                return default
            if isinstance(value, (int, float)):
                return float(value)
            if isinstance(value, str):
                # Remove common non-numeric characters
                clean_value = value.replace(',', '').replace('%', '').strip()
                if clean_value:
                    return float(clean_value)
            return default
        except (ValueError, TypeError):
            return default
    
    def _parse_date(self, date_string: Optional[str]) -> Optional[datetime]:
        """Parse date string with multiple format support"""
        if not date_string:
            return None
        
        date_formats = [
            '%Y-%m-%d %H:%M:%S',
            '%Y-%m-%d',
            '%m/%d/%Y %H:%M:%S',
            '%m/%d/%Y',
            '%d-%m-%Y %H:%M:%S',
            '%d-%m-%Y'
        ]
        
        for fmt in date_formats:
            try:
                return datetime.strptime(date_string, fmt)
            except ValueError:
                continue
        
        self.logger.warning(f"Could not parse date: {date_string}")
        return None
    
    def _extract_total_runtime_from_program(self, oven_program: Optional[List[str]]) -> float:
        """Extract total runtime from oven program steps"""
        try:
            if not oven_program:
                return 0.0
            
            # Simple heuristic - assume each program step adds some time
            # This is a very basic implementation for OCR data
            return len(oven_program) * 5.0  # Assume 5 minutes per step
            
        except Exception:
            return 0.0
    
    def _extract_total_runtime(self, oven_program: Optional[Dict]) -> float:
        """Extract total runtime from oven program"""
        try:
            if not oven_program:
                return 0.0
            
            # Simple calculation based on common oven program structure
            total_time = 0.0
            
            # Add initial hold time
            if "initial_hold_time" in oven_program:
                total_time += self._safe_float_conversion(oven_program["initial_hold_time"])
            
            # Add ramp time (simplified calculation)
            if "ramp_rate" in oven_program and "final_temperature" in oven_program and "initial_temperature" in oven_program:
                ramp_rate = self._safe_float_conversion(oven_program["ramp_rate"])
                temp_diff = (self._safe_float_conversion(oven_program["final_temperature"]) - 
                           self._safe_float_conversion(oven_program["initial_temperature"]))
                if ramp_rate > 0:
                    total_time += temp_diff / ramp_rate
            
            # Add final hold time
            if "final_hold_time" in oven_program:
                total_time += self._safe_float_conversion(oven_program["final_hold_time"])
            
            return total_time
            
        except Exception:
            return 0.0
    
    def _assess_processing_quality(self, confidence_score: float) -> str:
        """Assess processing quality based on confidence score"""
        if confidence_score >= 0.9:
            return "excellent"
        elif confidence_score >= 0.8:
            return "good"
        elif confidence_score >= 0.6:
            return "fair"
        elif confidence_score >= 0.4:
            return "poor"
        else:
            return "very_poor"


# =================== SINGLETON INSTANCE ===================

_ai_integration_service = None

def get_ai_integration_service() -> OCRAIIntegrationService:
    """Get singleton AI integration service instance"""
    global _ai_integration_service
    if _ai_integration_service is None:
        _ai_integration_service = OCRAIIntegrationService()
    return _ai_integration_service


# =================== CONVENIENCE FUNCTIONS ===================

async def process_ocr_for_ai_analysis(ocr_result: OCRProcessingResult, 
                                    analysis_type: str = "troubleshooting") -> AnalysisRequest:
    """
    Convenience function to process OCR result for AI analysis
    
    Args:
        ocr_result: OCR processing result
        analysis_type: Type of AI analysis to perform
        
    Returns:
        AnalysisRequest: Ready for AI troubleshooter
    """
    
    ai_service = get_ai_integration_service()
    
    # Validate OCR result
    validation = ai_service.validate_ocr_for_ai_processing(ocr_result)
    
    if not validation["is_suitable_for_ai"]:
        logger = logging.getLogger('IntelliLab.OCR.AIIntegration')
        logger.warning(f"OCR result may not be suitable for AI analysis: {validation['issues']}")
    
    # Create analysis request
    analysis_request = ai_service.create_analysis_request_from_ocr(ocr_result, analysis_type)
    
    return analysis_request


def extract_ai_ready_data(ocr_result: OCRProcessingResult) -> ChromatogramData:
    """
    Extract AI-ready chromatogram data from OCR result
    
    Args:
        ocr_result: OCR processing result
        
    Returns:
        ChromatogramData: Structured data for AI processing
    """
    
    ai_service = get_ai_integration_service()
    return ai_service.transform_ocr_to_chromatogram_data(ocr_result)