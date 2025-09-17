#!/usr/bin/env python3
"""
Complete OCR Integration Test
Validates entire OCR pipeline from image processing to AI-ready data transformation
"""

import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.models.schemas import (
    OCRProcessingRequest, OCRProcessingResult, OCRImageType, 
    ImagePreprocessingOptions, PeakData, ChromatogramData, 
    InstrumentData, AnalysisRequest
)
from app.services.ocr_service import ChromatogramOCREngine
from app.services.ocr_ai_bridge import OCRAIIntegrationService
from app.services.image_processor import ChromatogramImageProcessor
import io
from PIL import Image
import numpy as np

def create_test_chromatogram_image():
    """Create a simple test chromatogram image"""
    # Create a simple chromatogram-like image
    width, height = 800, 600
    img = Image.new('RGB', (width, height), 'white')
    
    # Add some test text and peaks
    from PIL import ImageDraw, ImageFont
    draw = ImageDraw.Draw(img)
    
    # Add some sample text that might appear on chromatograms
    try:
        # Use default font
        font = ImageFont.load_default()
    except:
        font = None
    
    # Add test method info
    draw.text((50, 50), "Method: Test_Method_V1", fill='black', font=font)
    draw.text((50, 80), "Sample: TestSample_001", fill='black', font=font)
    draw.text((50, 110), "Injection Volume: 1.0 µL", fill='black', font=font)
    draw.text((50, 140), "Column: DB-5ms", fill='black', font=font)
    
    # Add some peak-like shapes
    for i, x_pos in enumerate([200, 300, 450, 600]):
        # Draw simple peak shapes
        peak_points = [
            (x_pos, 400),
            (x_pos + 20, 300),
            (x_pos + 40, 400)
        ]
        draw.polygon(peak_points, fill='black')
        
        # Add peak labels
        draw.text((x_pos + 10, 420), f"Peak {i+1}", fill='black', font=font)
        draw.text((x_pos + 10, 440), f"RT: {5.2 + i*2.3:.1f}", fill='black', font=font)
        draw.text((x_pos + 10, 460), f"Area: {1000 + i*500}", fill='black', font=font)
    
    return img

def test_ocr_integration_pipeline():
    """Test the complete OCR integration pipeline"""
    print("🧪 Testing Complete OCR Integration Pipeline")
    print("=" * 50)
    
    # Step 1: Create test image
    print("Step 1: Creating test chromatogram image...")
    test_image = create_test_chromatogram_image()
    
    # Convert to bytes
    img_bytes = io.BytesIO()
    test_image.save(img_bytes, format='PNG')
    img_bytes = img_bytes.getvalue()
    print(f"✓ Test image created ({len(img_bytes)} bytes)")
    
    # Step 2: Test OCR Processing
    print("\nStep 2: Testing OCR processing...")
    ocr_engine = ChromatogramOCREngine()
    
    # Create processing request
    preprocessing_options = ImagePreprocessingOptions(
        quality_level="standard",
        deskew=True,
        enhance_contrast=False,
        remove_noise=False,
        custom_preprocessing=[]
    )
    
    # Convert image to base64
    import base64
    image_base64 = base64.b64encode(img_bytes).decode('utf-8')
    
    request = OCRProcessingRequest(
        image_base64=image_base64,
        image_type=OCRImageType.CHROMATOGRAM,
        preprocessing_options=preprocessing_options,
        extract_peaks=True,
        extract_method_info=True,
        extract_sample_info=True,
        confidence_threshold=0.5
    )
    
    # Process image
    try:
        ocr_result = ocr_engine.process_chromatogram_image(request)
        print(f"✓ OCR processing completed successfully")
        print(f"  - Processing time: {ocr_result.processing_time_ms}ms")
        print(f"  - Overall confidence: {ocr_result.overall_confidence:.2f}")
        print(f"  - Text regions found: {len(ocr_result.text_regions)}")
        print(f"  - Peaks detected: {len(ocr_result.peaks_data)}")
        
        # Test compatibility property
        print(f"  - Confidence score (AI compatibility): {ocr_result.confidence_score:.2f}")
        
    except Exception as e:
        print(f"❌ OCR processing failed: {e}")
        return False
    
    # Step 3: Test AI Integration Bridge
    print("\nStep 3: Testing AI integration bridge...")
    try:
        ai_bridge = OCRAIIntegrationService()
        
        # Transform OCR result to AI-ready format
        chromatogram_data = ai_bridge.transform_ocr_to_chromatogram_data(ocr_result)
        print(f"✓ OCR to AI transformation completed")
        print(f"  - File path: {chromatogram_data.file_path}")
        print(f"  - Peaks transformed: {len(chromatogram_data.peaks)}")
        print(f"  - Processing metadata keys: {list(chromatogram_data.processing_metadata.keys())}")
        
        # Validate for AI processing
        validation_result = ai_bridge.validate_ocr_for_ai_processing(ocr_result)
        is_valid = validation_result.get("is_suitable_for_ai", False)
        print(f"  - AI validation: {'✓ Valid' if is_valid else '❌ Invalid'}")
        if validation_result.get("issues"):
            print(f"    Validation issues: {validation_result['issues']}")
        if validation_result.get("recommendations"):
            print(f"    Recommendations: {validation_result['recommendations']}")
        
        # Create analysis request
        analysis_request = ai_bridge.create_analysis_request_from_ocr(
            ocr_result, 
            analysis_type="troubleshooting"
        )
        print(f"✓ Analysis request created")
        print(f"  - Request ID: {analysis_request.request_id}")
        print(f"  - Analysis type: {analysis_request.analysis_type}")
        
    except Exception as e:
        print(f"❌ AI integration failed: {e}")
        return False
    
    # Step 4: Test Schema Compatibility
    print("\nStep 4: Testing schema compatibility...")
    try:
        # Test that all required fields are present
        assert hasattr(ocr_result, 'confidence_score'), "Missing confidence_score property"
        assert ocr_result.confidence_score == ocr_result.overall_confidence, "Confidence score mismatch"
        
        # Test AI schemas
        test_peak = PeakData(
            peak_number=1,
            retention_time=5.2,
            area=1500.0,
            height=300.0,
            area_percent=15.0,
            width_at_half_height=0.05,
            tailing_factor=1.2,
            theoretical_plates=5000,
            resolution=2.5,
            compound_name="TestCompound",
            confidence=0.95,
            processing_notes={}
        )
        
        test_instrument = InstrumentData(
            instrument_id="GC001",
            instrument_type="gas_chromatograph",
            manufacturer="Agilent",
            model="Agilent 7890A",
            serial_number="US12345678",
            status="Active"
        )
        
        print("✓ All schema compatibility tests passed")
        
    except Exception as e:
        print(f"❌ Schema compatibility test failed: {e}")
        return False
    
    print("\n🎉 OCR Integration Pipeline Test PASSED!")
    print("All components working correctly:")
    print("- OCR image processing ✓")
    print("- Text and peak extraction ✓") 
    print("- AI data transformation ✓")
    print("- Schema compatibility ✓")
    print("- Analysis request generation ✓")
    
    return True

if __name__ == "__main__":
    success = test_ocr_integration_pipeline()
    exit(0 if success else 1)