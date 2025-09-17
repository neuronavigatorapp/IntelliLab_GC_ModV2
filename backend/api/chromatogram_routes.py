"""
Chromatogram Analysis API Routes
Professional chromatogram analysis endpoints
"""

from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from typing import Dict, Any
import base64
import logging

from backend.services.chromatogram_analyzer import ChromatogramVisionAI, ChromatogramAnalysis

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Chromatogram Analysis"])

# Create global AI analyzer instance
chromatogram_ai = ChromatogramVisionAI()

@router.post("/analyze", response_model=Dict[str, Any])
async def analyze_chromatogram(
    image: UploadFile = File(..., description="Chromatogram image file")
):
    """
    🔬 **Chromatogram Vision AI Analysis**
    
    Upload a chromatogram image and get professional AI analysis including:
    - Peak detection and quantification
    - Baseline and noise analysis  
    - Troubleshooting suggestions
    - Method optimization recommendations
    - Overall quality scoring
    
    **Perfect for LinkedIn demos!** 📸
    """
    
    try:
        # Validate file type
        if not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read and encode image
        image_data = await image.read()
        base64_image = base64.b64encode(image_data).decode('utf-8')
        image_data_url = f"data:{image.content_type};base64,{base64_image}"
        
        # Analyze chromatogram
        analysis = await chromatogram_ai.analyze_chromatogram_image(image_data_url)
        
        # Format response for frontend
        response = {
            "success": True,
            "filename": image.filename,
            "analysis": {
                "peaks": [
                    {
                        "retention_time": peak.retention_time,
                        "height": peak.height,
                        "area": peak.area,
                        "width": peak.width,
                        "shape_quality": peak.shape_quality,
                        "confidence": peak.confidence
                    }
                    for peak in analysis.peaks
                ],
                "baseline_quality": analysis.baseline_quality,
                "noise_level": analysis.noise_level,
                "resolution_issues": analysis.resolution_issues,
                "troubleshooting_suggestions": analysis.troubleshooting_suggestions,
                "method_recommendations": analysis.method_recommendations,
                "overall_quality_score": analysis.overall_quality_score
            },
            "ai_insights": {
                "peak_count": len(analysis.peaks),
                "quality_grade": _get_quality_grade(analysis.overall_quality_score),
                "primary_issue": _get_primary_issue(analysis),
                "confidence_level": "high"
            }
        }
        
        logger.info(f"Successfully analyzed chromatogram: {image.filename}")
        return response
        
    except Exception as e:
        logger.error(f"Error in chromatogram analysis: {e}")
        raise HTTPException(status_code=500, detail="Analysis failed")

@router.post("/analyze-base64", response_model=Dict[str, Any])
async def analyze_chromatogram_base64(data: Dict[str, str]):
    """
    🖼️ **Direct Base64 Image Analysis**
    
    Analyze chromatogram from base64 image data (perfect for camera uploads)
    """
    
    try:
        if "image" not in data:
            raise HTTPException(status_code=400, detail="Missing image data")
        
        # Analyze chromatogram
        analysis = await chromatogram_ai.analyze_chromatogram_image(data["image"])
        
        # Format response
        response = {
            "success": True,
            "analysis": {
                "peaks": [
                    {
                        "retention_time": peak.retention_time,
                        "height": peak.height,
                        "area": peak.area,
                        "width": peak.width,
                        "shape_quality": peak.shape_quality,
                        "confidence": peak.confidence
                    }
                    for peak in analysis.peaks
                ],
                "baseline_quality": analysis.baseline_quality,
                "noise_level": analysis.noise_level,
                "resolution_issues": analysis.resolution_issues,
                "troubleshooting_suggestions": analysis.troubleshooting_suggestions,
                "method_recommendations": analysis.method_recommendations,
                "overall_quality_score": analysis.overall_quality_score
            },
            "ai_insights": {
                "peak_count": len(analysis.peaks),
                "quality_grade": _get_quality_grade(analysis.overall_quality_score),
                "primary_issue": _get_primary_issue(analysis),
                "confidence_level": "high"
            }
        }
        
        return response
        
    except Exception as e:
        logger.error(f"Error in base64 analysis: {e}")
        raise HTTPException(status_code=500, detail="Analysis failed")

@router.get("/demo-suggestions")
async def get_demo_suggestions():
    """
    💡 **Demo Suggestions for LinkedIn**
    
    Get suggestions for chromatogram types that showcase the AI capabilities
    """
    
    return {
        "demo_scenarios": [
            {
                "title": "Peak Tailing Diagnosis",
                "description": "Show AI identifying tailing peaks and suggesting liner replacement",
                "impact": "Demonstrates troubleshooting expertise"
            },
            {
                "title": "Baseline Drift Analysis", 
                "description": "AI detects column bleed and recommends bakeout temperature",
                "impact": "Shows preventive maintenance knowledge"
            },
            {
                "title": "Resolution Optimization",
                "description": "AI suggests temperature program changes for better separation",
                "impact": "Demonstrates method development skills"
            },
            {
                "title": "Noise Reduction Strategy",
                "description": "AI identifies detector issues and suggests sensitivity adjustments", 
                "impact": "Shows instrument optimization expertise"
            }
        ],
        "linkedin_tips": [
            "Record a time-lapse video of the analysis process",
            "Show before/after chromatograms with AI suggestions implemented",
            "Create carousel posts explaining each AI recommendation",
            "Share the technical approach and algorithms used"
        ]
    }

def _get_quality_grade(score: float) -> str:
    """Convert quality score to letter grade"""
    if score >= 90:
        return "A+ (Excellent)"
    elif score >= 80:
        return "A (Very Good)"
    elif score >= 70:
        return "B+ (Good)"
    elif score >= 60:
        return "B (Fair)"
    else:
        return "C (Needs Improvement)"

def _get_primary_issue(analysis: ChromatogramAnalysis) -> str:
    """Identify the primary issue to address"""
    
    if analysis.baseline_quality == "poor":
        return "Baseline contamination"
    elif analysis.noise_level > 0.1:
        return "High noise level"
    elif any(p.shape_quality == "tailing" for p in analysis.peaks):
        return "Peak tailing"
    elif any(p.shape_quality == "fronting" for p in analysis.peaks):
        return "Peak fronting"
    elif analysis.resolution_issues:
        return "Poor peak resolution"
    else:
        return "Method optimization needed"