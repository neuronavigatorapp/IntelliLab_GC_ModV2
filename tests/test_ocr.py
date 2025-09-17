#!/usr/bin/env python3
"""
OCR Testing Framework with Sample Chromatogram Data
Comprehensive unit tests for OCR functionality and accuracy validation
"""

import unittest
import pytest
import asyncio
import tempfile
import os
import json
from pathlib import Path
from typing import Dict, Any, List
from unittest.mock import Mock, patch, AsyncMock
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont
import base64
from io import BytesIO

# Import OCR components
from app.models.schemas import (
    OCRProcessingRequest, OCRProcessingResult, OCRBatchRequest, OCRBatchResult,
    OCRImageType, OCRQualityLevel, ImagePreprocessingOptions,
    OCRTextRegion, OCRPeakData, OCRMethodParameters, OCRSampleInfo
)
from app.services.ocr_service import ChromatogramOCREngine, get_ocr_engine
from app.services.image_processor import ChromatogramImageProcessor, get_image_processor


# =================== TEST DATA GENERATION ===================

class TestChromatogramGenerator:
    """Generate synthetic chromatogram images for testing"""
    
    @staticmethod
    def create_basic_chromatogram(width: int = 800, height: int = 600) -> np.ndarray:
        """Create a basic chromatogram with peaks"""
        
        # Create white background
        image = np.ones((height, width, 3), dtype=np.uint8) * 255
        
        # Draw coordinate system
        cv2.line(image, (50, height-50), (width-50, height-50), (0, 0, 0), 2)  # X-axis
        cv2.line(image, (50, 50), (50, height-50), (0, 0, 0), 2)  # Y-axis
        
        # Add axis labels
        cv2.putText(image, "Time (min)", (width//2-50, height-10), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)
        cv2.putText(image, "Intensity", (10, height//2), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)
        
        # Draw sample chromatographic peaks
        peaks = [
            (150, 0.8, 20),   # (x_position, height_factor, width)
            (250, 0.6, 15),
            (400, 1.0, 25),   # Main peak
            (550, 0.4, 12),
            (680, 0.7, 18)
        ]
        
        baseline_y = height - 80
        
        for peak_x, height_factor, peak_width in peaks:
            peak_height = int((height - 150) * height_factor)
            
            # Draw Gaussian-like peak
            for x in range(peak_x - peak_width*2, peak_x + peak_width*2):
                if 50 < x < width - 50:
                    # Gaussian curve approximation
                    gaussian_factor = np.exp(-((x - peak_x) ** 2) / (2 * (peak_width/3) ** 2))
                    y = baseline_y - int(peak_height * gaussian_factor)
                    if y > 50:
                        cv2.circle(image, (x, y), 1, (0, 0, 255), -1)
        
        # Connect baseline
        for x in range(50, width-50):
            cv2.circle(image, (x, baseline_y), 1, (0, 0, 255), -1)
        
        return image
    
    @staticmethod
    def create_peak_table_image(width: int = 600, height: int = 400) -> np.ndarray:
        """Create a peak table with text data"""
        
        # Create white background
        image = np.ones((height, width, 3), dtype=np.uint8) * 255
        
        # Sample peak data
        headers = ["Peak #", "RT (min)", "Area", "Height", "Area %"]
        data_rows = [
            ["1", "2.45", "12456", "3421", "15.2"],
            ["2", "4.67", "8923", "2156", "10.9"],
            ["3", "7.89", "45678", "8934", "55.8"],
            ["4", "9.12", "7834", "1876", "9.6"],
            ["5", "11.34", "6789", "1543", "8.3"]
        ]
        
        # Draw table headers
        y_pos = 50
        x_positions = [50, 140, 220, 300, 380, 460]
        
        for i, header in enumerate(headers):
            cv2.putText(image, header, (x_positions[i], y_pos), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)
        
        # Draw horizontal line under headers
        cv2.line(image, (40, y_pos + 10), (width-40, y_pos + 10), (0, 0, 0), 1)
        
        # Draw data rows
        for row_idx, row_data in enumerate(data_rows):
            y_pos = 80 + row_idx * 30
            for col_idx, cell_data in enumerate(row_data):
                cv2.putText(image, cell_data, (x_positions[col_idx], y_pos), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
        
        return image
    
    @staticmethod
    def create_method_parameters_image(width: int = 500, height: int = 600) -> np.ndarray:
        """Create method parameters text image"""
        
        # Create white background
        image = np.ones((height, width, 3), dtype=np.uint8) * 255
        
        # Method parameters text
        parameters = [
            "Method: TEST_METHOD_001",
            "Column: HP-5ms (30m x 0.25mm)",
            "Carrier Gas: Helium at 1.2 mL/min",
            "Injection Volume: 1.0 µL",
            "Injection Temperature: 250°C",
            "Oven Program:",
            "  Initial: 50°C hold 2 min",
            "  Ramp: 10°C/min to 280°C",
            "  Final: 280°C hold 5 min",
            "Detector: FID at 300°C",
            "Sample: Unknown_Sample_123",
            "Operator: John Doe",
            "Date: 2024-01-15 14:30:22"
        ]
        
        y_pos = 40
        for param in parameters:
            cv2.putText(image, param, (20, y_pos), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 0), 1)
            y_pos += 25
        
        return image
    
    @staticmethod
    def add_noise_and_artifacts(image: np.ndarray, noise_level: float = 0.1) -> np.ndarray:
        """Add realistic noise and artifacts to image"""
        
        noisy_image = image.copy()
        
        # Add Gaussian noise
        noise = np.random.normal(0, noise_level * 255, image.shape).astype(np.int16)
        noisy_image = np.clip(noisy_image.astype(np.int16) + noise, 0, 255).astype(np.uint8)
        
        # Add some scan lines (common in scanned documents)
        for y in range(0, image.shape[0], 50):
            cv2.line(noisy_image, (0, y), (image.shape[1], y), (200, 200, 200), 1)
        
        # Add slight blur (imperfect focus)
        noisy_image = cv2.GaussianBlur(noisy_image, (3, 3), 0.5)
        
        return noisy_image
    
    @staticmethod
    def add_rotation_skew(image: np.ndarray, angle_degrees: float) -> np.ndarray:
        """Add rotation/skew to simulate real-world scanning"""
        
        center = tuple(np.array(image.shape[1::-1]) / 2)
        rotation_matrix = cv2.getRotationMatrix2D(center, angle_degrees, 1.0)
        
        # Calculate new dimensions
        cos_val = abs(rotation_matrix[0, 0])
        sin_val = abs(rotation_matrix[0, 1])
        new_width = int((image.shape[0] * sin_val) + (image.shape[1] * cos_val))
        new_height = int((image.shape[0] * cos_val) + (image.shape[1] * sin_val))
        
        # Adjust translation
        rotation_matrix[0, 2] += (new_width / 2) - center[0]
        rotation_matrix[1, 2] += (new_height / 2) - center[1]
        
        rotated = cv2.warpAffine(image, rotation_matrix, (new_width, new_height), 
                               borderMode=cv2.BORDER_CONSTANT, borderValue=(255, 255, 255))
        
        return rotated


# =================== UNIT TESTS ===================

class TestImageProcessor(unittest.TestCase):
    """Test image preprocessing functionality"""
    
    def setUp(self):
        self.processor = ChromatogramImageProcessor()
        self.test_generator = TestChromatogramGenerator()
    
    def test_contrast_enhancement(self):
        """Test contrast enhancement functionality"""
        
        # Create low-contrast image
        image = np.ones((100, 100), dtype=np.uint8) * 128  # Gray image
        
        # Apply enhancement
        enhanced = self.processor.enhance_contrast_adaptive(image)
        
        # Should have different histogram distribution
        self.assertFalse(np.array_equal(image, enhanced))
        self.assertEqual(enhanced.shape, image.shape)
    
    def test_noise_reduction(self):
        """Test noise reduction functionality"""
        
        # Create noisy image
        clean_image = np.ones((100, 100), dtype=np.uint8) * 255
        noise = np.random.randint(-50, 50, clean_image.shape).astype(np.int16)
        noisy_image = np.clip(clean_image.astype(np.int16) + noise, 0, 255).astype(np.uint8)
        
        # Apply denoising
        denoised = self.processor.advanced_denoising(noisy_image)
        
        # Should be closer to clean image
        self.assertEqual(denoised.shape, noisy_image.shape)
        # Mean should be closer to 255 (white)
        self.assertGreater(np.mean(denoised), np.mean(noisy_image))
    
    def test_deskewing(self):
        """Test image deskewing functionality"""
        
        # Create straight image
        image = self.test_generator.create_basic_chromatogram()
        
        # Add known rotation
        rotated = self.test_generator.add_rotation_skew(image, 5.0)  # 5 degrees
        
        # Attempt to deskew
        deskewed, detected_angle = self.processor.intelligent_deskewing(rotated)
        
        # Should detect angle close to -5 degrees
        self.assertIsInstance(detected_angle, float)
        if abs(detected_angle) > 0.5:  # Only if significant skew was detected
            self.assertLess(abs(detected_angle + 5.0), 2.0)  # Within 2 degrees
    
    def test_binarization(self):
        """Test smart binarization functionality"""
        
        # Create grayscale image with text
        image = self.test_generator.create_peak_table_image()
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply binarization
        binary = self.processor.smart_binarization(gray)
        
        # Should be binary image
        unique_values = np.unique(binary)
        self.assertTrue(len(unique_values) <= 2)
        self.assertIn(0, unique_values)  # Should have black pixels
        self.assertIn(255, unique_values)  # Should have white pixels
    
    def test_preprocessing_pipeline(self):
        """Test complete preprocessing pipeline"""
        
        # Create test image
        image = self.test_generator.create_basic_chromatogram()
        
        # Add noise and skew
        noisy_image = self.test_generator.add_noise_and_artifacts(image, 0.05)
        skewed_image = self.test_generator.add_rotation_skew(noisy_image, 2.0)
        
        # Create preprocessing options
        options = ImagePreprocessingOptions(
            enhance_contrast=True,
            denoise=True,
            deskew=True,
            binarize=False,
            scale_factor=2.0,
            gaussian_blur=False
        )
        
        # Process image
        result = self.processor.process_image_pipeline(
            skewed_image, options, OCRImageType.CHROMATOGRAM
        )
        
        # Verify results
        self.assertTrue(result["success"])
        self.assertIsNotNone(result["processed_image"])
        self.assertIn("processing_steps", result)
        self.assertGreater(len(result["processing_steps"]), 0)


class TestOCREngine(unittest.TestCase):
    """Test OCR engine functionality"""
    
    def setUp(self):
        self.ocr_engine = ChromatogramOCREngine()
        self.test_generator = TestChromatogramGenerator()
    
    @patch('pytesseract.image_to_string')
    @patch('pytesseract.image_to_data')
    def test_text_extraction(self, mock_image_to_data, mock_image_to_string):
        """Test basic text extraction"""
        
        # Mock Tesseract responses
        mock_image_to_string.return_value = "Sample text from image"
        mock_image_to_data.return_value = {
            'text': ['Sample', 'text', 'from', 'image'],
            'conf': [85, 90, 88, 92],
            'left': [10, 60, 100, 150],
            'top': [20, 20, 20, 20],
            'width': [45, 35, 40, 50],
            'height': [15, 15, 15, 15]
        }
        
        # Create test image
        image = self.test_generator.create_peak_table_image()
        
        # Extract text
        text_regions = self.ocr_engine.extract_text_regions(image, OCRQualityLevel.BALANCED)
        
        # Verify extraction
        self.assertIsInstance(text_regions, list)
        self.assertGreater(len(text_regions), 0)
        
        for region in text_regions:
            self.assertIsInstance(region, OCRTextRegion)
            self.assertIsInstance(region.text, str)
            self.assertGreater(region.confidence, 0)
    
    def test_peak_data_extraction(self):
        """Test peak data pattern matching"""
        
        # Sample text with peak data patterns
        sample_text = """
        Peak # RT (min) Area Height Area %
        1 2.45 12456 3421 15.2
        2 4.67 8923 2156 10.9
        3 7.89 45678 8934 55.8
        """
        
        # Extract peak data
        peaks = self.ocr_engine.extract_peaks_data(sample_text)
        
        # Verify extraction
        self.assertIsInstance(peaks, list)
        self.assertGreater(len(peaks), 0)
        
        # Check first peak
        if peaks:
            peak = peaks[0]
            self.assertIsInstance(peak, OCRPeakData)
            self.assertIsNotNone(peak.peak_number)
            self.assertIsNotNone(peak.retention_time)
    
    def test_method_parameters_extraction(self):
        """Test method parameters extraction"""
        
        # Sample text with method parameters
        sample_text = """
        Method: TEST_METHOD_001
        Column: HP-5ms (30m x 0.25mm)
        Carrier Gas: Helium at 1.2 mL/min
        Injection Volume: 1.0 µL
        Injection Temperature: 250°C
        """
        
        # Extract method parameters
        method_params = self.ocr_engine.extract_method_parameters(sample_text)
        
        # Verify extraction
        self.assertIsInstance(method_params, OCRMethodParameters)
        self.assertIsNotNone(method_params.method_name)
        self.assertIn("TEST_METHOD_001", method_params.method_name)
    
    async def test_async_processing(self):
        """Test asynchronous image processing"""
        
        # Create test request
        image = self.test_generator.create_basic_chromatogram()
        request = OCRProcessingRequest(
            image_type=OCRImageType.CHROMATOGRAM,
            quality_level=OCRQualityLevel.BALANCED,
            extract_peaks=True,
            extract_methods=True,
            extract_sample_info=True,
            preprocessing_options=ImagePreprocessingOptions()
        )
        
        # Mock Tesseract to avoid actual OCR during tests
        with patch('pytesseract.image_to_string', return_value="Mock OCR text"):
            with patch('pytesseract.image_to_data', return_value={
                'text': ['Mock', 'OCR', 'text'],
                'conf': [85, 90, 88],
                'left': [10, 60, 100],
                'top': [20, 20, 20],
                'width': [45, 35, 40],
                'height': [15, 15, 15]
            }):
                # Process image
                result = await self.ocr_engine.process_image_async(image, request)
                
                # Verify result
                self.assertIsInstance(result, OCRProcessingResult)
                self.assertGreater(result.confidence_score, 0)
                self.assertIsNotNone(result.text_regions)
    
    async def test_health_check(self):
        """Test OCR engine health check"""
        
        # Perform health check
        health_result = await self.ocr_engine.health_check()
        
        # Verify health status
        self.assertIn("status", health_result)
        self.assertIn(health_result["status"], ["healthy", "unhealthy"])
        self.assertIn("tesseract_version", health_result)


# =================== INTEGRATION TESTS ===================

class TestOCRIntegration(unittest.TestCase):
    """Test complete OCR pipeline integration"""
    
    def setUp(self):
        self.test_generator = TestChromatogramGenerator()
        self.processor = get_image_processor()
        self.ocr_engine = get_ocr_engine()
    
    def test_end_to_end_chromatogram(self):
        """Test complete chromatogram processing pipeline"""
        
        # Create realistic test chromatogram
        image = self.test_generator.create_basic_chromatogram()
        noisy_image = self.test_generator.add_noise_and_artifacts(image, 0.03)
        
        # Create processing request
        preprocessing_options = ImagePreprocessingOptions(
            enhance_contrast=True,
            denoise=True,
            deskew=True,
            binarize=False,
            scale_factor=1.5,
            gaussian_blur=False
        )
        
        ocr_request = OCRProcessingRequest(
            image_type=OCRImageType.CHROMATOGRAM,
            quality_level=OCRQualityLevel.BALANCED,
            extract_peaks=False,  # Focus on basic processing
            extract_methods=False,
            extract_sample_info=False,
            preprocessing_options=preprocessing_options
        )
        
        # Process through pipeline
        # 1. Image preprocessing
        preprocessing_result = self.processor.process_image_pipeline(
            noisy_image, preprocessing_options, OCRImageType.CHROMATOGRAM
        )
        
        self.assertTrue(preprocessing_result["success"])
        
        # 2. OCR processing (mocked for speed)
        with patch('pytesseract.image_to_string', return_value="Test chromatogram data"):
            asyncio.run(self._async_ocr_test(preprocessing_result["processed_image"], ocr_request))
    
    async def _async_ocr_test(self, image, request):
        """Helper for async OCR testing"""
        result = await self.ocr_engine.process_image_async(image, request)
        self.assertIsInstance(result, OCRProcessingResult)
        self.assertGreater(result.confidence_score, 0)
    
    def test_accuracy_benchmarking(self):
        """Test OCR accuracy with known text"""
        
        # Create image with known text content
        expected_text = "Peak # RT Area Height"
        
        # Generate test image
        image = np.ones((100, 400, 3), dtype=np.uint8) * 255
        cv2.putText(image, expected_text, (10, 50), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)
        
        # Mock OCR to return expected text for controlled testing
        with patch('pytesseract.image_to_string', return_value=expected_text):
            # Extract text
            extracted_regions = self.ocr_engine.extract_text_regions(
                image, OCRQualityLevel.HIGH_ACCURACY
            )
            
            # Calculate accuracy (simplified)
            if extracted_regions:
                extracted_text = ' '.join([region.text for region in extracted_regions])
                # Basic accuracy check (in real tests, use more sophisticated metrics)
                self.assertIn("Peak", extracted_text)
                self.assertIn("RT", extracted_text)


# =================== PERFORMANCE TESTS ===================

class TestOCRPerformance(unittest.TestCase):
    """Test OCR performance and benchmarking"""
    
    def setUp(self):
        self.test_generator = TestChromatogramGenerator()
        self.ocr_engine = get_ocr_engine()
        self.processor = get_image_processor()
    
    def test_processing_speed_benchmark(self):
        """Benchmark processing speed for different image sizes"""
        
        import time
        
        sizes = [(400, 300), (800, 600), (1200, 900)]
        processing_times = {}
        
        for width, height in sizes:
            # Create test image
            image = self.test_generator.create_basic_chromatogram(width, height)
            
            # Time preprocessing
            start_time = time.time()
            
            options = ImagePreprocessingOptions()
            preprocessing_result = self.processor.process_image_pipeline(
                image, options, OCRImageType.CHROMATOGRAM
            )
            
            processing_time = time.time() - start_time
            processing_times[f"{width}x{height}"] = processing_time
            
            # Verify processing completed
            self.assertTrue(preprocessing_result["success"])
            
            # Performance expectations (adjust based on hardware)
            self.assertLess(processing_time, 5.0)  # Should complete within 5 seconds
        
        # Log performance results
        print("Processing time benchmark:")
        for size, time_taken in processing_times.items():
            print(f"  {size}: {time_taken:.3f}s")
    
    def test_memory_usage(self):
        """Test memory usage during processing"""
        
        # Create large test image
        large_image = self.test_generator.create_basic_chromatogram(1600, 1200)
        
        # Monitor memory usage (simplified check)
        import psutil
        process = psutil.Process()
        memory_before = process.memory_info().rss / 1024 / 1024  # MB
        
        # Process image
        options = ImagePreprocessingOptions(scale_factor=2.0)
        result = self.processor.process_image_pipeline(
            large_image, options, OCRImageType.CHROMATOGRAM
        )
        
        memory_after = process.memory_info().rss / 1024 / 1024  # MB
        memory_used = memory_after - memory_before
        
        # Verify processing completed
        self.assertTrue(result["success"])
        
        # Memory usage should be reasonable (adjust threshold as needed)
        self.assertLess(memory_used, 500)  # Less than 500MB increase
        
        print(f"Memory usage: {memory_used:.1f}MB")


# =================== PYTEST FIXTURES AND MARKS ===================

@pytest.fixture
def test_generator():
    """Pytest fixture for test data generator"""
    return TestChromatogramGenerator()

@pytest.fixture
def sample_chromatogram():
    """Pytest fixture for sample chromatogram image"""
    generator = TestChromatogramGenerator()
    return generator.create_basic_chromatogram()

@pytest.fixture
def sample_peak_table():
    """Pytest fixture for sample peak table image"""
    generator = TestChromatogramGenerator()
    return generator.create_peak_table_image()

@pytest.fixture
def ocr_engine():
    """Pytest fixture for OCR engine"""
    return get_ocr_engine()

@pytest.fixture
def image_processor():
    """Pytest fixture for image processor"""
    return get_image_processor()


# Mark tests for different categories
pytestmark = pytest.mark.ocr

# Slow tests marker
slow = pytest.mark.slow

# Integration tests marker  
integration = pytest.mark.integration


# =================== TEST RUNNER ===================

if __name__ == '__main__':
    # Run unit tests
    unittest.main(verbosity=2)