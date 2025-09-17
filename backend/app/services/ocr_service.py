#!/usr/bin/env python3
"""
Enterprise OCR Service for IntelliLab GC
Advanced chromatogram image processing and data extraction
"""

import cv2
import numpy as np
import pytesseract
import base64
import io
import time
import logging
import re
from PIL import Image, ImageEnhance, ImageFilter
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
import json
from datetime import datetime

# Import our schemas
from app.models.schemas import (
    OCRProcessingRequest, OCRProcessingResult, OCRTextRegion, OCRPeakData,
    OCRMethodParameters, OCRSampleInfo, ImagePreprocessingOptions,
    OCRQualityLevel, OCRImageType, OCRCalibrationData, OCRHealthStatus
)


# =================== BULLETPROOF LOGGING INFRASTRUCTURE ===================

def setup_ocr_logging() -> logging.Logger:
    """Setup bulletproof logging for OCR service"""
    logger = logging.getLogger('IntelliLab.OCR.Service')
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        
        # File handler
        handler = logging.FileHandler('ocr_service.log', encoding='utf-8')
        handler.setLevel(logging.INFO)
        
        # Formatter
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    
    return logger


# =================== OCR PROCESSING ENGINE ===================

class ChromatogramOCREngine:
    """Enterprise-grade OCR engine for chromatogram analysis"""
    
    def __init__(self):
        self.logger = setup_ocr_logging()
        self.logger.info("Initializing ChromatogramOCREngine")
        
        # Performance tracking
        self.total_processed = 0
        self.successful_extractions = 0
        self.total_processing_time = 0
        self.last_error = None
        
        # Initialize Tesseract configuration
        self.tesseract_configs = {
            OCRQualityLevel.FAST: '--psm 6 --oem 3',
            OCRQualityLevel.BALANCED: '--psm 4 --oem 3 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,:-()[]°µ%',
            OCRQualityLevel.HIGH_ACCURACY: '--psm 4 --oem 1 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,:-()[]°µ%'
        }
        
        # Chromatogram-specific patterns
        self.peak_patterns = {
            'retention_time': r'(\d+\.?\d*)\s*min',
            'area': r'Area[:\s]*(\d+\.?\d*)',
            'height': r'Height[:\s]*(\d+\.?\d*)',
            'area_percent': r'(\d+\.?\d*)\s*%',
            'peak_number': r'Peak\s*#?(\d+)'
        }
        
        self.method_patterns = {
            'column': r'Column[:\s]*([^,\n]+)',
            'carrier_gas': r'Carrier[:\s]*(Helium|Hydrogen|Nitrogen|He|H2|N2)',
            'flow_rate': r'Flow[:\s]*(\d+\.?\d*)\s*(mL/min|ml/min)',
            'temperature': r'(\d+)\s*°?C',
            'injection_volume': r'(\d+\.?\d*)\s*(µL|uL|μL)'
        }
        
        self.logger.info("ChromatogramOCREngine initialized successfully")
    
    def preprocess_image(self, image: np.ndarray, options: ImagePreprocessingOptions) -> np.ndarray:
        """Advanced image preprocessing for optimal OCR results"""
        self.logger.info(f"Preprocessing image with options: {options}")
        
        processed = image.copy()
        
        try:
            # Scale image for better OCR
            if options.scale_factor != 1.0:
                height, width = processed.shape[:2]
                new_width = int(width * options.scale_factor)
                new_height = int(height * options.scale_factor)
                processed = cv2.resize(processed, (new_width, new_height), interpolation=cv2.INTER_CUBIC)
                
            # Convert to grayscale if needed
            if len(processed.shape) == 3:
                processed = cv2.cvtColor(processed, cv2.COLOR_BGR2GRAY)
            
            # Gaussian blur for smoothing
            if options.gaussian_blur:
                processed = cv2.GaussianBlur(processed, (5, 5), 0)
            
            # Denoising
            if options.denoise:
                processed = cv2.fastNlMeansDenoising(processed)
            
            # Contrast enhancement
            if options.enhance_contrast:
                clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
                processed = clahe.apply(processed)
            
            # Deskewing
            if options.deskew:
                processed = self._deskew_image(processed)
            
            # Binarization
            if options.binarize:
                _, processed = cv2.threshold(processed, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            self.logger.info("Image preprocessing completed successfully")
            return processed
            
        except Exception as e:
            self.logger.error(f"Image preprocessing failed: {str(e)}")
            return image  # Return original if preprocessing fails
    
    def _deskew_image(self, image: np.ndarray) -> np.ndarray:
        """Automatically correct image skew"""
        try:
            # Find lines using HoughLinesP
            edges = cv2.Canny(image, 50, 150, apertureSize=3)
            lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=100, minLineLength=100, maxLineGap=10)
            
            if lines is not None:
                # Calculate average angle
                angles = []
                for line in lines:
                    x1, y1, x2, y2 = line[0]
                    angle = np.arctan2(y2 - y1, x2 - x1) * 180 / np.pi
                    angles.append(angle)
                
                if angles:
                    median_angle = np.median(angles)
                    
                    # Rotate image if significant skew detected
                    if abs(median_angle) > 0.5:
                        center = tuple(np.array(image.shape[1::-1]) / 2)
                        rotation_matrix = cv2.getRotationMatrix2D(center, median_angle, 1.0)
                        image = cv2.warpAffine(image, rotation_matrix, image.shape[1::-1], flags=cv2.INTER_LINEAR)
            
            return image
            
        except Exception as e:
            self.logger.warning(f"Deskewing failed: {str(e)}")
            return image
    
    def extract_text_regions(self, image: np.ndarray, quality_level: OCRQualityLevel) -> List[OCRTextRegion]:
        """Extract all text regions with bounding boxes and confidence scores"""
        self.logger.info(f"Extracting text regions with quality level: {quality_level}")
        
        try:
            config = self.tesseract_configs[quality_level]
            
            # Get detailed data from Tesseract
            data = pytesseract.image_to_data(image, config=config, output_type=pytesseract.Output.DICT)
            
            text_regions = []
            n_boxes = len(data['level'])
            
            for i in range(n_boxes):
                confidence = int(data['conf'][i])
                text = data['text'][i].strip()
                
                # Filter out low confidence and empty text
                if confidence > 30 and text:
                    x, y, w, h = data['left'][i], data['top'][i], data['width'][i], data['height'][i]
                    
                    # Classify region type based on content
                    region_type = self._classify_text_region(text)
                    
                    region = OCRTextRegion(
                        text=text,
                        confidence=confidence / 100.0,
                        bbox={"x": x, "y": y, "width": w, "height": h},
                        region_type=region_type
                    )
                    text_regions.append(region)
            
            self.logger.info(f"Extracted {len(text_regions)} text regions")
            return text_regions
            
        except Exception as e:
            self.logger.error(f"Text extraction failed: {str(e)}")
            return []
    
    def _classify_text_region(self, text: str) -> str:
        """Classify text region based on content patterns"""
        text_lower = text.lower()
        
        # Check for different types of content
        if re.search(r'\d+\.?\d*\s*min', text):
            return "retention_time"
        elif re.search(r'area|height', text_lower):
            return "peak_data"
        elif re.search(r'column|carrier|flow|temperature', text_lower):
            return "method_parameter"
        elif re.search(r'sample|operator|date|time', text_lower):
            return "sample_info"
        elif re.search(r'peak\s*#?\d+', text_lower):
            return "peak_label"
        elif re.search(r'\d+\.?\d*\s*%', text):
            return "percentage"
        elif text.replace('.', '').replace('-', '').isdigit():
            return "numeric_value"
        elif len(text) > 20:
            return "description"
        else:
            return "label"
    
    def extract_peaks_data(self, text_regions: List[OCRTextRegion]) -> List[OCRPeakData]:
        """Extract chromatogram peak information from text regions"""
        self.logger.info("Extracting peak data from text regions")
        
        peaks_data = []
        
        try:
            # Group text regions that might belong to the same peak
            peak_groups = self._group_peak_related_text(text_regions)
            
            for group in peak_groups:
                peak_data = OCRPeakData()
                
                for region in group:
                    text = region.text
                    
                    # Extract retention time
                    rt_match = re.search(self.peak_patterns['retention_time'], text)
                    if rt_match and not peak_data.retention_time:
                        peak_data.retention_time = float(rt_match.group(1))
                    
                    # Extract area
                    area_match = re.search(self.peak_patterns['area'], text, re.IGNORECASE)
                    if area_match and not peak_data.area:
                        peak_data.area = float(area_match.group(1))
                    
                    # Extract height
                    height_match = re.search(self.peak_patterns['height'], text, re.IGNORECASE)
                    if height_match and not peak_data.height:
                        peak_data.height = float(height_match.group(1))
                    
                    # Extract area percentage
                    percent_match = re.search(self.peak_patterns['area_percent'], text)
                    if percent_match and not peak_data.area_percent:
                        peak_data.area_percent = float(percent_match.group(1))
                    
                    # Extract peak number
                    peak_num_match = re.search(self.peak_patterns['peak_number'], text, re.IGNORECASE)
                    if peak_num_match and not peak_data.peak_number:
                        peak_data.peak_number = int(peak_num_match.group(1))
                
                # Only add if we found meaningful data
                if any([peak_data.retention_time, peak_data.area, peak_data.height]):
                    peaks_data.append(peak_data)
            
            self.logger.info(f"Extracted {len(peaks_data)} peaks")
            return peaks_data
            
        except Exception as e:
            self.logger.error(f"Peak extraction failed: {str(e)}")
            return []
    
    def _group_peak_related_text(self, text_regions: List[OCRTextRegion]) -> List[List[OCRTextRegion]]:
        """Group text regions that likely belong to the same peak"""
        groups = []
        
        # Simple spatial grouping - regions close to each other likely belong together
        for region in text_regions:
            if region.region_type in ['retention_time', 'peak_data', 'peak_label', 'percentage', 'numeric_value']:
                # Find existing group or create new one
                added_to_group = False
                
                for group in groups:
                    # Check if region is spatially close to any region in the group
                    for existing_region in group:
                        if self._are_regions_close(region, existing_region):
                            group.append(region)
                            added_to_group = True
                            break
                    if added_to_group:
                        break
                
                if not added_to_group:
                    groups.append([region])
        
        return groups
    
    def _are_regions_close(self, region1: OCRTextRegion, region2: OCRTextRegion, threshold: int = 50) -> bool:
        """Check if two text regions are spatially close"""
        bbox1 = region1.bbox
        bbox2 = region2.bbox
        
        center1_x = bbox1['x'] + bbox1['width'] / 2
        center1_y = bbox1['y'] + bbox1['height'] / 2
        center2_x = bbox2['x'] + bbox2['width'] / 2
        center2_y = bbox2['y'] + bbox2['height'] / 2
        
        distance = np.sqrt((center1_x - center2_x)**2 + (center1_y - center2_y)**2)
        return distance < threshold
    
    def extract_method_parameters(self, text_regions: List[OCRTextRegion]) -> OCRMethodParameters:
        """Extract GC method parameters from text regions"""
        self.logger.info("Extracting method parameters")
        
        method_params = OCRMethodParameters()
        
        try:
            all_text = " ".join([region.text for region in text_regions])
            
            # Extract column information
            column_match = re.search(self.method_patterns['column'], all_text, re.IGNORECASE)
            if column_match:
                method_params.column_type = column_match.group(1).strip()
            
            # Extract carrier gas
            carrier_match = re.search(self.method_patterns['carrier_gas'], all_text, re.IGNORECASE)
            if carrier_match:
                method_params.carrier_gas = carrier_match.group(1).strip()
            
            # Extract flow rate
            flow_match = re.search(self.method_patterns['flow_rate'], all_text, re.IGNORECASE)
            if flow_match:
                method_params.flow_rate = f"{flow_match.group(1)} {flow_match.group(2)}"
            
            # Extract injection volume
            injection_match = re.search(self.method_patterns['injection_volume'], all_text, re.IGNORECASE)
            if injection_match:
                method_params.injection_volume = f"{injection_match.group(1)} {injection_match.group(2)}"
            
            # Extract temperatures
            temp_matches = re.findall(self.method_patterns['temperature'], all_text)
            if temp_matches:
                # Assume first temperature is inlet, others are oven program
                method_params.inlet_temperature = f"{temp_matches[0]}°C"
                if len(temp_matches) > 1:
                    method_params.oven_program = [f"{temp}°C" for temp in temp_matches[1:]]
            
            self.logger.info("Method parameters extraction completed")
            return method_params
            
        except Exception as e:
            self.logger.error(f"Method parameters extraction failed: {str(e)}")
            return method_params
    
    def extract_sample_info(self, text_regions: List[OCRTextRegion]) -> OCRSampleInfo:
        """Extract sample information from text regions"""
        self.logger.info("Extracting sample information")
        
        sample_info = OCRSampleInfo()
        
        try:
            all_text = " ".join([region.text for region in text_regions])
            
            # Extract sample name (often appears as "Sample: name" or "Sample name")
            sample_match = re.search(r'Sample[:\s]*([^,\n]+)', all_text, re.IGNORECASE)
            if sample_match:
                sample_info.sample_name = sample_match.group(1).strip()
            
            # Extract operator
            operator_match = re.search(r'Operator[:\s]*([^,\n]+)', all_text, re.IGNORECASE)
            if operator_match:
                sample_info.operator = operator_match.group(1).strip()
            
            # Extract date/time
            date_match = re.search(r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', all_text)
            if date_match:
                sample_info.injection_date = date_match.group(1)
            
            # Extract vial position
            vial_match = re.search(r'Vial[:\s]*(\d+)', all_text, re.IGNORECASE)
            if vial_match:
                sample_info.vial_position = vial_match.group(1)
            
            self.logger.info("Sample information extraction completed")
            return sample_info
            
        except Exception as e:
            self.logger.error(f"Sample information extraction failed: {str(e)}")
            return sample_info
    
    def calculate_confidence_metrics(self, text_regions: List[OCRTextRegion], 
                                   peaks_data: List[OCRPeakData]) -> Tuple[float, str, str]:
        """Calculate overall confidence and quality assessments"""
        try:
            # Overall confidence (weighted average)
            if text_regions:
                confidences = [region.confidence for region in text_regions]
                overall_confidence = np.mean(confidences)
            else:
                overall_confidence = 0.0
            
            # Text extraction quality assessment
            if overall_confidence >= 0.8:
                text_quality = "excellent"
            elif overall_confidence >= 0.6:
                text_quality = "good"
            elif overall_confidence >= 0.4:
                text_quality = "fair"
            else:
                text_quality = "poor"
            
            # Peak detection quality assessment
            if len(peaks_data) >= 5:
                peak_quality = "excellent"
            elif len(peaks_data) >= 3:
                peak_quality = "good" 
            elif len(peaks_data) >= 1:
                peak_quality = "fair"
            else:
                peak_quality = "poor"
            
            return overall_confidence, text_quality, peak_quality
            
        except Exception as e:
            self.logger.error(f"Confidence calculation failed: {str(e)}")
            return 0.0, "unknown", "unknown"
    
    def process_chromatogram_image(self, request: OCRProcessingRequest) -> OCRProcessingResult:
        """Main processing method for chromatogram OCR"""
        start_time = time.time()
        self.total_processed += 1
        
        self.logger.info(f"Processing chromatogram image of type: {request.image_type}")
        
        try:
            # Decode base64 image
            image_data = base64.b64decode(request.image_base64)
            image = cv2.imdecode(np.frombuffer(image_data, np.uint8), cv2.IMREAD_COLOR)
            
            if image is None:
                raise ValueError("Failed to decode image data")
            
            original_dimensions = {"width": image.shape[1], "height": image.shape[0]}
            
            # Preprocess image
            processed_image = self.preprocess_image(image, request.preprocessing)
            
            # Extract text regions
            text_regions = self.extract_text_regions(processed_image, request.quality_level)
            
            # Extract specific data types based on request
            peaks_data = []
            method_parameters = None
            sample_info = None
            
            if request.extract_peaks:
                peaks_data = self.extract_peaks_data(text_regions)
            
            if request.extract_method_params:
                method_parameters = self.extract_method_parameters(text_regions)
            
            if request.extract_sample_info:
                sample_info = self.extract_sample_info(text_regions)
            
            # Calculate confidence metrics
            overall_confidence, text_quality, peak_quality = self.calculate_confidence_metrics(
                text_regions, peaks_data
            )
            
            processing_time = int((time.time() - start_time) * 1000)
            self.total_processing_time += processing_time
            self.successful_extractions += 1
            
            result = OCRProcessingResult(
                success=True,
                processing_time_ms=processing_time,
                image_dimensions=original_dimensions,
                text_regions=text_regions,
                peaks_data=peaks_data,
                method_parameters=method_parameters,
                sample_info=sample_info,
                overall_confidence=overall_confidence,
                text_extraction_quality=text_quality,
                peak_detection_quality=peak_quality,
                preprocessing_applied=request.preprocessing,
                warnings=[],
                errors=[]
            )
            
            self.logger.info(f"OCR processing completed successfully in {processing_time}ms")
            return result
            
        except Exception as e:
            processing_time = int((time.time() - start_time) * 1000)
            self.total_processing_time += processing_time
            self.last_error = str(e)
            
            self.logger.error(f"OCR processing failed: {str(e)}")
            
            return OCRProcessingResult(
                success=False,
                processing_time_ms=processing_time,
                image_dimensions={"width": 0, "height": 0},
                text_regions=[],
                peaks_data=[],
                method_parameters=None,
                sample_info=None,
                overall_confidence=0.0,
                text_extraction_quality="failed",
                peak_detection_quality="failed",
                preprocessing_applied=request.preprocessing,
                warnings=[],
                errors=[str(e)]
            )
    
    def get_health_status(self) -> OCRHealthStatus:
        """Get OCR service health status"""
        try:
            tesseract_version = pytesseract.get_tesseract_version()
            opencv_version = cv2.__version__
            
            success_rate = (
                (self.successful_extractions / self.total_processed * 100) 
                if self.total_processed > 0 else 100.0
            )
            
            avg_processing_time = (
                self.total_processing_time / self.total_processed 
                if self.total_processed > 0 else 0.0
            )
            
            # Determine service status
            if success_rate >= 90 and avg_processing_time < 5000:
                status = "healthy"
            elif success_rate >= 70:
                status = "degraded"
            else:
                status = "offline"
            
            return OCRHealthStatus(
                service_status=status,
                tesseract_version=str(tesseract_version),
                opencv_version=opencv_version,
                total_processed=self.total_processed,
                average_processing_time_ms=avg_processing_time,
                success_rate_percent=success_rate,
                last_error=self.last_error
            )
            
        except Exception as e:
            self.logger.error(f"Health status check failed: {str(e)}")
            return OCRHealthStatus(
                service_status="offline",
                tesseract_version="unknown",
                opencv_version="unknown",
                total_processed=self.total_processed,
                average_processing_time_ms=0.0,
                success_rate_percent=0.0,
                last_error=str(e)
            )


# =================== SERVICE SINGLETON ===================

_ocr_engine_instance = None

def get_ocr_engine() -> ChromatogramOCREngine:
    """Get singleton OCR engine instance"""
    global _ocr_engine_instance
    if _ocr_engine_instance is None:
        _ocr_engine_instance = ChromatogramOCREngine()
    return _ocr_engine_instance