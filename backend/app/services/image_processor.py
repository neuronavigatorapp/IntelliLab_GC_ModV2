#!/usr/bin/env python3
"""
Advanced Image Preprocessing Pipeline for Chromatogram OCR
Enterprise-grade image enhancement and preparation for optimal text extraction
"""

import cv2
import numpy as np
import logging
from typing import Tuple, List, Dict, Any, Optional
from PIL import Image, ImageEnhance, ImageFilter, ImageOps
from scipy import ndimage
import matplotlib.pyplot as plt
from dataclasses import dataclass

from app.models.schemas import ImagePreprocessingOptions, OCRImageType

# Optional imports for advanced features
try:
    from skimage import restoration, morphology, filters, exposure
    SKIMAGE_AVAILABLE = True
except ImportError:
    SKIMAGE_AVAILABLE = False


# =================== PREPROCESSING CONFIGURATION ===================

@dataclass
class PreprocessingProfile:
    """Preprocessing profile optimized for different image types"""
    name: str
    description: str
    enhance_contrast: bool
    denoise: bool
    deskew: bool
    binarize: bool
    scale_factor: float
    gaussian_blur: bool
    custom_filters: List[str]


class ChromatogramImageProcessor:
    """Advanced image preprocessing pipeline for chromatogram analysis"""
    
    def __init__(self):
        self.logger = logging.getLogger('IntelliLab.OCR.ImageProcessor')
        
        # Predefined profiles for different chromatogram types
        self.profiles = {
            OCRImageType.CHROMATOGRAM: PreprocessingProfile(
                name="chromatogram_standard",
                description="Standard chromatogram preprocessing",
                enhance_contrast=True,
                denoise=True,
                deskew=True,
                binarize=False,
                scale_factor=2.0,
                gaussian_blur=False,
                custom_filters=["sharpen", "noise_reduction"]
            ),
            OCRImageType.PEAK_TABLE: PreprocessingProfile(
                name="peak_table_text",
                description="Peak table text optimization", 
                enhance_contrast=True,
                denoise=True,
                deskew=True,
                binarize=True,
                scale_factor=2.5,
                gaussian_blur=False,
                custom_filters=["text_enhancement", "morphological_cleanup"]
            ),
            OCRImageType.METHOD_PARAMETERS: PreprocessingProfile(
                name="method_params_text",
                description="Method parameters text extraction",
                enhance_contrast=True,
                denoise=True,
                deskew=True,
                binarize=True,
                scale_factor=2.0,
                gaussian_blur=True,
                custom_filters=["text_enhancement", "edge_enhancement"]
            )
        }
        
        self.logger.info("ChromatogramImageProcessor initialized")
    
    def get_optimal_profile(self, image_type: OCRImageType) -> PreprocessingProfile:
        """Get optimal preprocessing profile for image type"""
        return self.profiles.get(image_type, self.profiles[OCRImageType.CHROMATOGRAM])
    
    def enhance_contrast_adaptive(self, image: np.ndarray) -> np.ndarray:
        """Advanced adaptive contrast enhancement"""
        try:
            self.logger.debug("Applying adaptive contrast enhancement")
            
            # Convert to LAB color space for better luminance processing
            if len(image.shape) == 3:
                lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
                l_channel = lab[:, :, 0]
            else:
                l_channel = image.copy()
            
            # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
            enhanced_l = clahe.apply(l_channel)
            
            # Combine back if color image
            if len(image.shape) == 3:
                lab[:, :, 0] = enhanced_l
                result = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
            else:
                result = enhanced_l
            
            return result
            
        except Exception as e:
            self.logger.error(f"Contrast enhancement failed: {str(e)}")
            return image
    
    def advanced_denoising(self, image: np.ndarray) -> np.ndarray:
        """Multi-stage noise reduction optimized for chromatograms"""
        try:
            self.logger.debug("Applying advanced denoising")
            
            if len(image.shape) == 3:
                # Color image denoising
                denoised = cv2.fastNlMeansDenoisingColored(image, None, 10, 10, 7, 21)
            else:
                # Grayscale denoising
                denoised = cv2.fastNlMeansDenoising(image, None, 10, 7, 21)
            
            # Additional Gaussian filtering for fine noise
            denoised = cv2.bilateralFilter(denoised, 9, 75, 75)
            
            return denoised
            
        except Exception as e:
            self.logger.error(f"Advanced denoising failed: {str(e)}")
            return image
    
    def intelligent_deskewing(self, image: np.ndarray) -> Tuple[np.ndarray, float]:
        """Intelligent document deskewing using multiple methods"""
        try:
            self.logger.debug("Applying intelligent deskewing")
            
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image.copy()
            
            # Method 1: Hough Line Transform
            angle_hough = self._detect_skew_hough(gray)
            
            # Method 2: Projection Profile Analysis
            angle_projection = self._detect_skew_projection(gray)
            
            # Method 3: Connected Components Analysis
            angle_components = self._detect_skew_components(gray)
            
            # Choose the most reliable angle
            angles = [angle_hough, angle_projection, angle_components]
            valid_angles = [angle for angle in angles if angle is not None]
            
            if valid_angles:
                # Use median angle for robustness
                final_angle = np.median(valid_angles)
                
                if abs(final_angle) > 0.5:  # Only correct significant skew
                    center = tuple(np.array(image.shape[1::-1]) / 2)
                    rotation_matrix = cv2.getRotationMatrix2D(center, final_angle, 1.0)
                    
                    # Calculate new dimensions to avoid cropping
                    cos_val = abs(rotation_matrix[0, 0])
                    sin_val = abs(rotation_matrix[0, 1])
                    new_width = int((image.shape[0] * sin_val) + (image.shape[1] * cos_val))
                    new_height = int((image.shape[0] * cos_val) + (image.shape[1] * sin_val))
                    
                    # Adjust translation
                    rotation_matrix[0, 2] += (new_width / 2) - center[0]
                    rotation_matrix[1, 2] += (new_height / 2) - center[1]
                    
                    deskewed = cv2.warpAffine(image, rotation_matrix, (new_width, new_height), 
                                            flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, 
                                            borderValue=(255, 255, 255))
                    
                    return deskewed, final_angle
            
            return image, 0.0
            
        except Exception as e:
            self.logger.error(f"Deskewing failed: {str(e)}")
            return image, 0.0
    
    def _detect_skew_hough(self, image: np.ndarray) -> Optional[float]:
        """Detect skew using Hough line transform"""
        try:
            # Edge detection
            edges = cv2.Canny(image, 50, 150, apertureSize=3)
            
            # Hough line detection
            lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=100, 
                                  minLineLength=100, maxLineGap=10)
            
            if lines is not None and len(lines) > 5:
                angles = []
                for line in lines:
                    x1, y1, x2, y2 = line[0]
                    angle = np.arctan2(y2 - y1, x2 - x1) * 180 / np.pi
                    # Filter out vertical lines
                    if abs(angle) < 45:
                        angles.append(angle)
                
                if angles:
                    return np.median(angles)
            
            return None
            
        except Exception:
            return None
    
    def _detect_skew_projection(self, image: np.ndarray) -> Optional[float]:
        """Detect skew using projection profile analysis"""
        try:
            # Binary threshold
            _, binary = cv2.threshold(image, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
            
            best_angle = 0
            max_variance = 0
            
            # Test angles from -5 to +5 degrees
            for angle in np.arange(-5, 5.1, 0.1):
                # Rotate image
                center = tuple(np.array(binary.shape[1::-1]) / 2)
                rotation_matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
                rotated = cv2.warpAffine(binary, rotation_matrix, binary.shape[1::-1])
                
                # Calculate horizontal projection
                h_projection = np.sum(rotated, axis=1)
                
                # Calculate variance (higher variance = better alignment)
                variance = np.var(h_projection)
                
                if variance > max_variance:
                    max_variance = variance
                    best_angle = angle
            
            return best_angle if abs(best_angle) > 0.1 else None
            
        except Exception:
            return None
    
    def _detect_skew_components(self, image: np.ndarray) -> Optional[float]:
        """Detect skew using connected components analysis"""
        try:
            # Binary threshold
            _, binary = cv2.threshold(image, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
            
            # Find connected components
            num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(binary)
            
            if num_labels > 10:  # Need sufficient components
                # Filter components by size
                min_area = 50
                large_components = []
                
                for i in range(1, num_labels):  # Skip background
                    if stats[i, cv2.CC_STAT_AREA] > min_area:
                        large_components.append(i)
                
                if len(large_components) > 5:
                    # Calculate orientation of components
                    angles = []
                    for comp_id in large_components:
                        mask = (labels == comp_id).astype(np.uint8) * 255
                        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                        
                        if contours:
                            # Fit ellipse to get orientation
                            if len(contours[0]) >= 5:
                                ellipse = cv2.fitEllipse(contours[0])
                                angle = ellipse[2]
                                # Convert to -90 to +90 range
                                if angle > 90:
                                    angle = angle - 180
                                angles.append(angle)
                    
                    if angles:
                        return np.median(angles)
            
            return None
            
        except Exception:
            return None
    
    def smart_binarization(self, image: np.ndarray) -> np.ndarray:
        """Smart binarization using multiple adaptive methods"""
        try:
            self.logger.debug("Applying smart binarization")
            
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image.copy()
            
            # Method 1: Otsu's thresholding
            _, binary_otsu = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            # Method 2: Adaptive Gaussian thresholding
            binary_adaptive = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                                  cv2.THRESH_BINARY, 11, 2)
            
            # Method 3: Sauvola binarization (local thresholding)
            if SKIMAGE_AVAILABLE:
                try:
                    thresh_sauvola = filters.threshold_sauvola(gray, window_size=25)
                    binary_sauvola = (gray > thresh_sauvola).astype(np.uint8) * 255
                except Exception:
                    binary_sauvola = binary_otsu
            else:
                binary_sauvola = binary_otsu
            
            # Combine methods using majority voting
            combined = np.zeros_like(gray)
            votes = (binary_otsu // 255) + (binary_adaptive // 255) + (binary_sauvola // 255)
            combined[votes >= 2] = 255
            
            return combined
            
        except Exception as e:
            self.logger.error(f"Smart binarization failed: {str(e)}")
            # Fallback to simple Otsu
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image
            _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            return binary
    
    def apply_custom_filters(self, image: np.ndarray, filters: List[str]) -> np.ndarray:
        """Apply custom filters optimized for chromatogram processing"""
        result = image.copy()
        
        for filter_name in filters:
            try:
                if filter_name == "sharpen":
                    result = self._apply_sharpening(result)
                elif filter_name == "noise_reduction":
                    result = self._apply_noise_reduction(result)
                elif filter_name == "text_enhancement":
                    result = self._apply_text_enhancement(result)
                elif filter_name == "morphological_cleanup":
                    result = self._apply_morphological_cleanup(result)
                elif filter_name == "edge_enhancement":
                    result = self._apply_edge_enhancement(result)
                else:
                    self.logger.warning(f"Unknown filter: {filter_name}")
                    
            except Exception as e:
                self.logger.error(f"Filter {filter_name} failed: {str(e)}")
        
        return result
    
    def _apply_sharpening(self, image: np.ndarray) -> np.ndarray:
        """Apply unsharp masking for better text clarity"""
        kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
        return cv2.filter2D(image, -1, kernel)
    
    def _apply_noise_reduction(self, image: np.ndarray) -> np.ndarray:
        """Advanced noise reduction preserving text edges"""
        return cv2.bilateralFilter(image, 9, 75, 75)
    
    def _apply_text_enhancement(self, image: np.ndarray) -> np.ndarray:
        """Enhance text readability"""
        # Morphological opening to remove noise
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
        opened = cv2.morphologyEx(image, cv2.MORPH_OPEN, kernel)
        
        # Close gaps in characters
        kernel_close = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        closed = cv2.morphologyEx(opened, cv2.MORPH_CLOSE, kernel_close)
        
        return closed
    
    def _apply_morphological_cleanup(self, image: np.ndarray) -> np.ndarray:
        """Clean up binary image using morphological operations"""
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        # Remove small noise
        kernel_noise = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2))
        cleaned = cv2.morphologyEx(gray, cv2.MORPH_OPEN, kernel_noise)
        
        # Fill small holes
        kernel_fill = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        filled = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, kernel_fill)
        
        return filled
    
    def _apply_edge_enhancement(self, image: np.ndarray) -> np.ndarray:
        """Enhance edges for better character recognition"""
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        # Sobel edge detection
        sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        
        # Combine and normalize
        sobel_combined = np.sqrt(sobelx**2 + sobely**2)
        sobel_normalized = cv2.normalize(sobel_combined, None, 0, 255, cv2.NORM_MINMAX, cv2.CV_8U)
        
        # Add to original image
        enhanced = cv2.addWeighted(gray, 0.7, sobel_normalized, 0.3, 0)
        
        return enhanced
    
    def process_image_pipeline(self, image: np.ndarray, options: ImagePreprocessingOptions, 
                             image_type: OCRImageType = OCRImageType.CHROMATOGRAM) -> Dict[str, Any]:
        """Complete image preprocessing pipeline"""
        
        self.logger.info(f"Starting image preprocessing pipeline for {image_type}")
        
        processing_steps = []
        result = image.copy()
        original_dimensions = {"width": image.shape[1], "height": image.shape[0]}
        
        try:
            # Get optimal profile for image type
            profile = self.get_optimal_profile(image_type)
            
            # Step 1: Scaling
            if options.scale_factor != 1.0:
                height, width = result.shape[:2]
                new_width = int(width * options.scale_factor)
                new_height = int(height * options.scale_factor)
                result = cv2.resize(result, (new_width, new_height), interpolation=cv2.INTER_CUBIC)
                processing_steps.append(f"scaled_{options.scale_factor}x")
            
            # Step 2: Convert to grayscale if needed
            if len(result.shape) == 3:
                result = cv2.cvtColor(result, cv2.COLOR_BGR2GRAY)
                processing_steps.append("converted_to_grayscale")
            
            # Step 3: Denoising
            if options.denoise:
                result = self.advanced_denoising(result)
                processing_steps.append("advanced_denoising")
            
            # Step 4: Deskewing
            if options.deskew:
                result, skew_angle = self.intelligent_deskewing(result)
                processing_steps.append(f"deskewed_{skew_angle:.2f}_degrees")
            
            # Step 5: Contrast enhancement
            if options.enhance_contrast:
                result = self.enhance_contrast_adaptive(result)
                processing_steps.append("adaptive_contrast_enhancement")
            
            # Step 6: Gaussian blur
            if options.gaussian_blur:
                result = cv2.GaussianBlur(result, (5, 5), 0)
                processing_steps.append("gaussian_blur")
            
            # Step 7: Custom filters from profile
            if profile.custom_filters:
                result = self.apply_custom_filters(result, profile.custom_filters)
                processing_steps.extend(profile.custom_filters)
            
            # Step 8: Binarization (last step for text images)
            if options.binarize:
                result = self.smart_binarization(result)
                processing_steps.append("smart_binarization")
            
            final_dimensions = {"width": result.shape[1], "height": result.shape[0]}
            
            return {
                "processed_image": result,
                "original_dimensions": original_dimensions,
                "final_dimensions": final_dimensions,
                "processing_steps": processing_steps,
                "profile_used": profile.name,
                "success": True,
                "error": None
            }
            
        except Exception as e:
            self.logger.error(f"Image preprocessing pipeline failed: {str(e)}")
            return {
                "processed_image": image,
                "original_dimensions": original_dimensions,
                "final_dimensions": original_dimensions,
                "processing_steps": processing_steps,
                "profile_used": "none",
                "success": False,
                "error": str(e)
            }


# =================== UTILITY FUNCTIONS ===================

def create_preprocessing_options_for_type(image_type: OCRImageType) -> ImagePreprocessingOptions:
    """Create optimal preprocessing options for specific image type"""
    
    if image_type == OCRImageType.CHROMATOGRAM:
        return ImagePreprocessingOptions(
            enhance_contrast=True,
            denoise=True,
            deskew=True,
            binarize=False,
            scale_factor=2.0,
            gaussian_blur=False
        )
    elif image_type == OCRImageType.PEAK_TABLE:
        return ImagePreprocessingOptions(
            enhance_contrast=True,
            denoise=True,
            deskew=True,
            binarize=True,
            scale_factor=2.5,
            gaussian_blur=False
        )
    elif image_type == OCRImageType.METHOD_PARAMETERS:
        return ImagePreprocessingOptions(
            enhance_contrast=True,
            denoise=True,
            deskew=True,
            binarize=True,
            scale_factor=2.0,
            gaussian_blur=True
        )
    else:
        # Default settings
        return ImagePreprocessingOptions()


# =================== SINGLETON INSTANCE ===================

_image_processor_instance = None

def get_image_processor() -> ChromatogramImageProcessor:
    """Get singleton image processor instance"""
    global _image_processor_instance
    if _image_processor_instance is None:
        _image_processor_instance = ChromatogramImageProcessor()
    return _image_processor_instance