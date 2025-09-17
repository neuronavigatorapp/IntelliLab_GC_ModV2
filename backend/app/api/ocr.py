#!/usr/bin/env python3
"""
OCR API Endpoints for Chromatogram Processing
FastAPI endpoints for image upload, OCR processing, and result retrieval
"""

import logging
import tempfile
import os
from typing import Dict, Any, List, Optional
from io import BytesIO
from datetime import datetime
import base64

from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, BackgroundTasks, status
from fastapi.responses import JSONResponse
from PIL import Image
import cv2
import numpy as np

from backend.app.models.schemas import (
    OCRProcessingRequest, OCRProcessingResult, OCRBatchRequest, OCRBatchResult,
    OCRImageType, OCRQualityLevel, ImagePreprocessingOptions,
    OCRTextRegion, OCRPeakData, OCRMethodParameters, OCRSampleInfo
)
from backend.app.services.ocr_service import get_ocr_engine
from backend.app.services.image_processor import get_image_processor
from backend.app.services.auth_service import get_current_user
from backend.database import get_db


# =================== ROUTER SETUP ===================

router = APIRouter(
    prefix="/api/ocr",
    tags=["OCR Processing"],
    responses={404: {"description": "Not found"}},
)

logger = logging.getLogger('IntelliLab.OCR.API')


# =================== UTILITY FUNCTIONS ===================

async def validate_image_file(file: UploadFile) -> Dict[str, Any]:
    """Validate uploaded image file"""
    
    # Check file size (max 50MB)
    max_size = 50 * 1024 * 1024  # 50MB
    if file.size and file.size > max_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {max_size // (1024*1024)}MB"
        )
    
    # Check content type
    allowed_types = ["image/jpeg", "image/png", "image/tiff", "image/bmp", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type. Allowed types: {', '.join(allowed_types)}"
        )
    
    try:
        # Read and validate image
        file_content = await file.read()
        image = Image.open(BytesIO(file_content))
        
        # Convert PIL image to OpenCV format
        image_array = np.array(image)
        if len(image_array.shape) == 3:
            image_cv = cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)
        else:
            image_cv = image_array
        
        return {
            "image": image_cv,
            "filename": file.filename,
            "content_type": file.content_type,
            "size": file.size or len(file_content),
            "dimensions": {"width": image.width, "height": image.height}
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image file: {str(e)}"
        )
    finally:
        # Reset file position for potential re-reading
        await file.seek(0)


def encode_image_to_base64(image: np.ndarray) -> str:
    """Encode OpenCV image to base64 string"""
    try:
        _, buffer = cv2.imencode('.png', image)
        image_base64 = base64.b64encode(buffer).decode('utf-8')
        return image_base64
    except Exception as e:
        logger.error(f"Failed to encode image to base64: {str(e)}")
        return ""


# =================== API ENDPOINTS ===================

@router.post("/process", response_model=OCRProcessingResult)
async def process_chromatogram_image(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    image_type: OCRImageType = OCRImageType.CHROMATOGRAM,
    quality_level: OCRQualityLevel = OCRQualityLevel.BALANCED,
    extract_peaks: bool = True,
    extract_methods: bool = True,
    extract_sample_info: bool = True,
    enhance_contrast: bool = True,
    denoise: bool = True,
    deskew: bool = True,
    binarize: Optional[bool] = None,
    scale_factor: float = 2.0,
    gaussian_blur: Optional[bool] = None,
    current_user: Dict = Depends(get_current_user)
):
    """
    Process a single chromatogram image using OCR
    
    - **file**: Image file to process (JPEG, PNG, TIFF, BMP, WebP)
    - **image_type**: Type of chromatogram image (CHROMATOGRAM, PEAK_TABLE, METHOD_PARAMETERS)
    - **quality_level**: OCR quality vs speed tradeoff (FAST, BALANCED, HIGH_ACCURACY)
    - **extract_peaks**: Whether to extract peak data from the image
    - **extract_methods**: Whether to extract method parameters
    - **extract_sample_info**: Whether to extract sample information
    - **enhance_contrast**: Apply contrast enhancement preprocessing
    - **denoise**: Apply noise reduction preprocessing
    - **deskew**: Correct image skew/rotation
    - **binarize**: Convert to black & white (auto-detected if None)
    - **scale_factor**: Image scaling factor for better OCR
    - **gaussian_blur**: Apply Gaussian blur (auto-detected if None)
    """
    
    try:
        logger.info(f"Processing OCR request from user {current_user.get('username', 'unknown')}")
        
        # Validate image file
        image_data = await validate_image_file(file)
        
        # Set auto-detection for preprocessing options
        if binarize is None:
            binarize = image_type in [OCRImageType.PEAK_TABLE, OCRImageType.METHOD_PARAMETERS]
        
        if gaussian_blur is None:
            gaussian_blur = image_type == OCRImageType.METHOD_PARAMETERS
        
        # Create preprocessing options
        preprocessing_options = ImagePreprocessingOptions(
            enhance_contrast=enhance_contrast,
            denoise=denoise,
            deskew=deskew,
            binarize=binarize,
            scale_factor=scale_factor,
            gaussian_blur=gaussian_blur
        )
        
        # Create OCR request
        ocr_request = OCRProcessingRequest(
            image_type=image_type,
            quality_level=quality_level,
            extract_peaks=extract_peaks,
            extract_methods=extract_methods,
            extract_sample_info=extract_sample_info,
            preprocessing_options=preprocessing_options,
            batch_id=None  # Single image processing
        )
        
        # Get services
        ocr_engine = get_ocr_engine()
        image_processor = get_image_processor()
        
        # Process image
        processing_start = datetime.utcnow()
        
        # Step 1: Preprocess image
        preprocessing_result = image_processor.process_image_pipeline(
            image_data["image"], preprocessing_options, image_type
        )
        
        if not preprocessing_result["success"]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Image preprocessing failed: {preprocessing_result['error']}"
            )
        
        # Step 2: OCR processing
        ocr_result = await ocr_engine.process_image_async(
            preprocessing_result["processed_image"], ocr_request
        )
        
        processing_time = (datetime.utcnow() - processing_start).total_seconds()
        
        # Add metadata
        ocr_result.processing_metadata.update({
            "original_filename": image_data["filename"],
            "file_size_bytes": image_data["size"],
            "original_dimensions": image_data["dimensions"],
            "preprocessing_steps": preprocessing_result["processing_steps"],
            "processing_time_seconds": processing_time,
            "user_id": current_user.get("user_id"),
            "processed_at": datetime.utcnow().isoformat()
        })
        
        # Encode processed image for response (optional)
        if preprocessing_result.get("processed_image") is not None:
            processed_image_b64 = encode_image_to_base64(preprocessing_result["processed_image"])
            if processed_image_b64:
                ocr_result.processing_metadata["processed_image_base64"] = processed_image_b64
        
        logger.info(f"OCR processing completed in {processing_time:.2f}s with confidence {ocr_result.confidence_score:.2f}")
        
        return ocr_result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OCR processing failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OCR processing failed: {str(e)}"
        )


@router.post("/batch", response_model=OCRBatchResult)
async def process_batch_images(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    image_type: OCRImageType = OCRImageType.CHROMATOGRAM,
    quality_level: OCRQualityLevel = OCRQualityLevel.BALANCED,
    extract_peaks: bool = True,
    extract_methods: bool = True,
    extract_sample_info: bool = True,
    enhance_contrast: bool = True,
    denoise: bool = True,
    deskew: bool = True,
    binarize: Optional[bool] = None,
    scale_factor: float = 2.0,
    gaussian_blur: Optional[bool] = None,
    current_user: Dict = Depends(get_current_user)
):
    """
    Process multiple chromatogram images in batch
    
    - **files**: List of image files to process
    - **image_type**: Type of chromatogram images
    - **quality_level**: OCR quality vs speed tradeoff
    - Other parameters same as single image processing
    """
    
    try:
        logger.info(f"Processing OCR batch request for {len(files)} images from user {current_user.get('username', 'unknown')}")
        
        # Validate file count
        max_batch_size = 20
        if len(files) > max_batch_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Too many files in batch. Maximum is {max_batch_size}, got {len(files)}"
            )
        
        # Generate batch ID
        batch_id = f"batch_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{len(files)}"
        
        # Set auto-detection for preprocessing options
        if binarize is None:
            binarize = image_type in [OCRImageType.PEAK_TABLE, OCRImageType.METHOD_PARAMETERS]
        
        if gaussian_blur is None:
            gaussian_blur = image_type == OCRImageType.METHOD_PARAMETERS
        
        # Create preprocessing options
        preprocessing_options = ImagePreprocessingOptions(
            enhance_contrast=enhance_contrast,
            denoise=denoise,
            deskew=deskew,
            binarize=binarize,
            scale_factor=scale_factor,
            gaussian_blur=gaussian_blur
        )
        
        # Create batch request
        batch_request = OCRBatchRequest(
            batch_id=batch_id,
            image_type=image_type,
            quality_level=quality_level,
            extract_peaks=extract_peaks,
            extract_methods=extract_methods,
            extract_sample_info=extract_sample_info,
            preprocessing_options=preprocessing_options
        )
        
        # Process each image
        results = []
        errors = []
        total_processing_time = 0.0
        
        ocr_engine = get_ocr_engine()
        image_processor = get_image_processor()
        
        for i, file in enumerate(files):
            try:
                # Validate image file
                image_data = await validate_image_file(file)
                
                # Create individual request
                individual_request = OCRProcessingRequest(
                    image_type=image_type,
                    quality_level=quality_level,
                    extract_peaks=extract_peaks,
                    extract_methods=extract_methods,
                    extract_sample_info=extract_sample_info,
                    preprocessing_options=preprocessing_options,
                    batch_id=batch_id
                )
                
                # Process image
                processing_start = datetime.utcnow()
                
                # Preprocess
                preprocessing_result = image_processor.process_image_pipeline(
                    image_data["image"], preprocessing_options, image_type
                )
                
                if preprocessing_result["success"]:
                    # OCR processing
                    ocr_result = await ocr_engine.process_image_async(
                        preprocessing_result["processed_image"], individual_request
                    )
                    
                    processing_time = (datetime.utcnow() - processing_start).total_seconds()
                    total_processing_time += processing_time
                    
                    # Add metadata
                    ocr_result.processing_metadata.update({
                        "batch_index": i,
                        "original_filename": image_data["filename"],
                        "file_size_bytes": image_data["size"],
                        "processing_time_seconds": processing_time
                    })
                    
                    results.append(ocr_result)
                    
                else:
                    error_msg = f"Preprocessing failed for {image_data['filename']}: {preprocessing_result['error']}"
                    errors.append(error_msg)
                    logger.error(error_msg)
                
            except Exception as e:
                error_msg = f"Failed to process {file.filename}: {str(e)}"
                errors.append(error_msg)
                logger.error(error_msg)
        
        # Create batch result
        batch_result = OCRBatchResult(
            batch_id=batch_id,
            total_images=len(files),
            successful_images=len(results),
            failed_images=len(errors),
            results=results,
            errors=errors,
            processing_metadata={
                "total_processing_time_seconds": total_processing_time,
                "average_processing_time_seconds": total_processing_time / len(files) if files else 0,
                "user_id": current_user.get("user_id"),
                "processed_at": datetime.utcnow().isoformat(),
                "batch_settings": {
                    "image_type": image_type,
                    "quality_level": quality_level,
                    "preprocessing_options": preprocessing_options.model_dump()
                }
            }
        )
        
        logger.info(f"Batch OCR processing completed: {len(results)}/{len(files)} successful")
        
        return batch_result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Batch OCR processing failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch OCR processing failed: {str(e)}"
        )


@router.get("/health")
async def ocr_health_check():
    """Check OCR service health and dependencies"""
    
    try:
        # Check OCR engine
        ocr_engine = get_ocr_engine()
        ocr_health = await ocr_engine.health_check()
        
        # Check image processor
        image_processor = get_image_processor()
        
        # Test basic image processing
        test_image = np.ones((100, 100), dtype=np.uint8) * 255
        test_options = ImagePreprocessingOptions()
        preprocessing_result = image_processor.process_image_pipeline(
            test_image, test_options, OCRImageType.CHROMATOGRAM
        )
        
        health_status = {
            "status": "healthy" if ocr_health["status"] == "healthy" and preprocessing_result["success"] else "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "components": {
                "ocr_engine": ocr_health,
                "image_processor": {
                    "status": "healthy" if preprocessing_result["success"] else "unhealthy",
                    "test_preprocessing": preprocessing_result["success"],
                    "available_profiles": len(image_processor.profiles)
                }
            }
        }
        
        if health_status["status"] == "unhealthy":
            return JSONResponse(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                content=health_status
            )
        
        return health_status
        
    except Exception as e:
        logger.error(f"OCR health check failed: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "timestamp": datetime.utcnow().isoformat(),
                "error": str(e)
            }
        )


@router.get("/capabilities")
async def get_ocr_capabilities():
    """Get OCR service capabilities and supported features"""
    
    try:
        ocr_engine = get_ocr_engine()
        image_processor = get_image_processor()
        
        capabilities = {
            "supported_image_types": [t.value for t in OCRImageType],
            "supported_quality_levels": [q.value for q in OCRQualityLevel],
            "supported_file_formats": ["image/jpeg", "image/png", "image/tiff", "image/bmp", "image/webp"],
            "max_file_size_mb": 50,
            "max_batch_size": 20,
            "preprocessing_features": {
                "contrast_enhancement": True,
                "noise_reduction": True,
                "deskewing": True,
                "binarization": True,
                "scaling": True,
                "gaussian_blur": True,
                "custom_filters": ["sharpen", "noise_reduction", "text_enhancement", 
                                 "morphological_cleanup", "edge_enhancement"]
            },
            "extraction_capabilities": {
                "text_regions": True,
                "peak_data": True,
                "method_parameters": True,
                "sample_information": True,
                "confidence_scoring": True
            },
            "processing_profiles": {
                name: {
                    "description": profile.description,
                    "optimized_for": name
                } 
                for name, profile in image_processor.profiles.items()
            }
        }
        
        return capabilities
        
    except Exception as e:
        logger.error(f"Failed to get OCR capabilities: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get OCR capabilities: {str(e)}"
        )