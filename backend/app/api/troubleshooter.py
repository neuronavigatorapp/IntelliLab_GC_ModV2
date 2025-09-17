"""
AI Troubleshooter FastAPI Routes
REST API endpoints for GC-MS AI troubleshooting and diagnostics
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, status
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
import logging
import uuid
from datetime import datetime

from app.models.schemas import (
    TroubleshooterRequest, TroubleshooterResponse, DiagnosticResult,
    AITroubleshooterHealth, OCRProcessingResult, ChromatogramData,
    KnowledgeBaseEntry, TroubleshootingSolution
)
from app.services.ai_troubleshooter import AITroubleshooterEngine
from app.services.ocr_ai_bridge import get_ai_integration_service
# from app.services.auth_service import get_current_user
# Mock authentication for development - replace with real auth in production
def get_current_user():
    return {"username": "test_user", "experience_level": "intermediate"}


# Create router
router = APIRouter(prefix="/api/troubleshooter", tags=["AI Troubleshooter"])

# Global troubleshooter engine instance
troubleshooter_engine = AITroubleshooterEngine()
ocr_bridge = get_ai_integration_service()

logger = logging.getLogger(__name__)


@router.post("/analyze", response_model=TroubleshooterResponse)
async def analyze_chromatogram(
    request: TroubleshooterRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """
    Perform comprehensive AI troubleshooting analysis of chromatogram data
    
    This endpoint provides intelligent diagnosis of chromatographic issues including:
    - Peak quality assessment
    - Method parameter evaluation  
    - Instrument performance analysis
    - Prioritized solution recommendations
    - Step-by-step troubleshooting guidance
    """
    
    try:
        logger.info(f"Starting AI troubleshooting analysis for user {current_user.get('username')}")
        
        # Validate request
        if not request.chromatogram_data and not request.ocr_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either chromatogram_data or ocr_data must be provided"
            )
        
        # If OCR data provided but no chromatogram data, convert OCR to chromatogram data
        if request.ocr_data and not request.chromatogram_data:
            try:
                # The OCR bridge returns ChromatogramData which is compatible with AI troubleshooter
                transformed_data = ocr_bridge.transform_ocr_to_chromatogram_data(request.ocr_data)
                
                # Create a compatible ChromatogramData object for the troubleshooter request
                # The OCR bridge already returns the correct format
                request.chromatogram_data = transformed_data
                logger.info("Successfully converted OCR data to chromatogram format")
            except Exception as e:
                logger.error(f"Failed to convert OCR data: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Failed to process OCR data: {str(e)}"
                )
        
        # Perform analysis
        response = await troubleshooter_engine.analyze_chromatogram(request)
        
        # Log analysis for audit trail
        background_tasks.add_task(
            log_analysis,
            request.request_id,
            current_user.get("username"),
            response.status,
            len(response.diagnostic_result.issues) if response.diagnostic_result else 0
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )


@router.post("/analyze-ocr", response_model=TroubleshooterResponse)
async def analyze_from_ocr(
    ocr_result: OCRProcessingResult,
    analysis_type: str = "comprehensive",
    sensitivity_level: str = "medium",
    include_solutions: bool = True,
    current_user: dict = Depends(get_current_user)
):
    """
    Perform AI troubleshooting analysis directly from OCR-extracted data
    
    This is a convenience endpoint that automatically converts OCR data to
    chromatogram format and performs troubleshooting analysis.
    """
    
    try:
        # Create troubleshooter request from OCR data
        request = TroubleshooterRequest(
            request_id=f"ocr_analysis_{uuid.uuid4().hex[:8]}",
            analysis_type=analysis_type,
            ocr_data=ocr_result,
            sensitivity_level=sensitivity_level,
            include_solutions=include_solutions,
            user_context={"source": "ocr_direct", "username": current_user.get("username")}
        )
        
        # Perform analysis
        return await analyze_chromatogram(request, BackgroundTasks(), current_user)
        
    except Exception as e:
        logger.error(f"OCR analysis failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OCR analysis failed: {str(e)}"
        )


@router.post("/batch-analyze")
async def batch_analyze(
    requests: List[TroubleshooterRequest],
    current_user: dict = Depends(get_current_user)
):
    """
    Perform batch troubleshooting analysis on multiple chromatogram datasets
    
    Useful for analyzing multiple samples or historical data for trend analysis.
    Returns summary statistics and consolidated recommendations.
    """
    
    if len(requests) > 50:  # Limit batch size
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Batch size limited to 50 requests"
        )
    
    try:
        results = []
        failed_analyses = []
        
        for i, request in enumerate(requests):
            try:
                response = await troubleshooter_engine.analyze_chromatogram(request)
                results.append({
                    "request_index": i,
                    "request_id": request.request_id,
                    "result": response
                })
            except Exception as e:
                failed_analyses.append({
                    "request_index": i,
                    "request_id": request.request_id,
                    "error": str(e)
                })
                logger.error(f"Batch analysis failed for request {i}: {str(e)}")
        
        # Generate batch summary
        batch_summary = _generate_batch_summary(results)
        
        return {
            "batch_id": f"batch_{uuid.uuid4().hex[:8]}",
            "total_requests": len(requests),
            "successful_analyses": len(results),
            "failed_analyses": len(failed_analyses),
            "results": results,
            "failures": failed_analyses,
            "batch_summary": batch_summary,
            "processed_at": datetime.utcnow()
        }
        
    except Exception as e:
        logger.error(f"Batch analysis failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch analysis failed: {str(e)}"
        )


@router.get("/health", response_model=AITroubleshooterHealth)
async def get_health_status():
    """
    Get AI troubleshooter service health status
    
    Returns comprehensive health metrics including:
    - Service operational status
    - Knowledge base statistics
    - Analysis performance metrics
    - Active AI models information
    """
    
    try:
        return troubleshooter_engine.get_health_status()
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Health check failed: {str(e)}"
        )


@router.get("/knowledge-base/entries")
async def get_knowledge_base_entries(
    category: Optional[str] = None,
    tags: Optional[List[str]] = None,
    current_user: dict = Depends(get_current_user)
) -> List[KnowledgeBaseEntry]:
    """
    Retrieve troubleshooting knowledge base entries
    
    Filter by category or tags to find specific troubleshooting information.
    Useful for browsing available diagnostic patterns and solutions.
    """
    
    try:
        kb = troubleshooter_engine.knowledge_base
        
        if category:
            entries = kb.get_entry_by_category(category)
        elif tags:
            entries = kb.search_by_tags(tags)
        else:
            entries = list(kb.entries.values())
        
        return entries
        
    except Exception as e:
        logger.error(f"Knowledge base query failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Knowledge base query failed: {str(e)}"
        )


@router.get("/knowledge-base/solutions/{solution_id}")
async def get_solution_details(
    solution_id: str,
    include_guide: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """
    Get detailed information about a specific troubleshooting solution
    
    Optionally include step-by-step implementation guide with enhanced details.
    """
    
    try:
        kb = troubleshooter_engine.knowledge_base
        
        if solution_id not in kb.solutions:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Solution {solution_id} not found"
            )
        
        solution = kb.solutions[solution_id]
        
        result = {
            "solution": solution,
            "metadata": {
                "solution_id": solution_id,
                "retrieved_at": datetime.utcnow(),
                "user": current_user.get("username")
            }
        }
        
        # Include step-by-step guide if requested
        if include_guide:
            guide = troubleshooter_engine.recommendation_engine.create_step_by_step_guide(
                solution,
                context={"user_level": current_user.get("experience_level", "intermediate")}
            )
            result["implementation_guide"] = guide
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Solution details query failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Solution details query failed: {str(e)}"
        )


@router.get("/knowledge-base/statistics")
async def get_knowledge_base_statistics(
    current_user: dict = Depends(get_current_user)
):
    """
    Get comprehensive knowledge base statistics
    
    Returns statistics about entries, solutions, categories, and usage patterns.
    """
    
    try:
        kb = troubleshooter_engine.knowledge_base
        stats = kb.get_statistics()
        
        # Add service statistics
        service_stats = {
            "total_analyses": troubleshooter_engine.total_analyses,
            "successful_analyses": troubleshooter_engine.successful_analyses,
            "success_rate": troubleshooter_engine.successful_analyses / max(1, troubleshooter_engine.total_analyses),
            "model_version": troubleshooter_engine.model_version
        }
        
        return {
            "knowledge_base": stats,
            "service_performance": service_stats,
            "generated_at": datetime.utcnow()
        }
        
    except Exception as e:
        logger.error(f"Statistics query failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Statistics query failed: {str(e)}"
        )


@router.post("/validate-data")
async def validate_analysis_data(
    data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """
    Validate chromatogram or OCR data quality for analysis
    
    Performs pre-analysis validation to assess data quality and provide
    recommendations for improving analysis accuracy.
    """
    
    try:
        # Create temporary request for validation
        temp_request = TroubleshooterRequest(
            request_id=f"validation_{uuid.uuid4().hex[:8]}",
            analysis_type="quick_scan"
        )
        
        # Set data based on type
        if "chromatogram_data" in data:
            temp_request.chromatogram_data = ChromatogramData(**data["chromatogram_data"])
        elif "ocr_data" in data:
            temp_request.ocr_data = OCRProcessingResult(**data["ocr_data"])
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Must provide either chromatogram_data or ocr_data"
            )
        
        # Assess data quality
        data_quality_score = await troubleshooter_engine._assess_data_quality(temp_request)
        
        # Generate validation report
        validation_report = {
            "data_quality_score": data_quality_score,
            "quality_level": _determine_quality_level(data_quality_score),
            "analysis_feasible": data_quality_score >= 0.3,
            "recommendations": _generate_quality_recommendations(data_quality_score, temp_request),
            "validated_at": datetime.utcnow()
        }
        
        return validation_report
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Data validation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Data validation failed: {str(e)}"
        )


# Helper functions

async def log_analysis(request_id: str, username: str, status: str, issue_count: int):
    """Log analysis for audit trail"""
    
    log_entry = {
        "timestamp": datetime.utcnow(),
        "request_id": request_id,
        "username": username,
        "status": status,
        "issue_count": issue_count
    }
    
    # In a real implementation, this would write to a database or log file
    logger.info(f"Analysis logged: {log_entry}")


def _generate_batch_summary(results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generate summary statistics for batch analysis"""
    
    if not results:
        return {"message": "No successful analyses"}
    
    # Extract diagnostic results
    diagnostic_results = [
        r["result"].diagnostic_result for r in results
        if r["result"].diagnostic_result is not None
    ]
    
    if not diagnostic_results:
        return {"message": "No diagnostic results available"}
    
    # Calculate summary statistics
    total_issues = sum(len(dr.issues) for dr in diagnostic_results)
    critical_issues = sum(dr.critical_issues_count for dr in diagnostic_results)
    major_issues = sum(dr.major_issues_count for dr in diagnostic_results)
    
    avg_score = sum(dr.overall_score for dr in diagnostic_results) / len(diagnostic_results)
    
    # Most common issue categories
    issue_categories = {}
    for dr in diagnostic_results:
        for issue in dr.issues:
            issue_categories[issue.category] = issue_categories.get(issue.category, 0) + 1
    
    return {
        "total_issues": total_issues,
        "critical_issues": critical_issues,
        "major_issues": major_issues,
        "average_quality_score": avg_score,
        "most_common_categories": sorted(issue_categories.items(), key=lambda x: x[1], reverse=True)[:5],
        "analyses_count": len(diagnostic_results)
    }


def _determine_quality_level(score: float) -> str:
    """Determine quality level from score"""
    
    if score >= 0.8:
        return "Excellent"
    elif score >= 0.6:
        return "Good"
    elif score >= 0.4:
        return "Fair"
    elif score >= 0.2:
        return "Poor"
    else:
        return "Insufficient"


def _generate_quality_recommendations(score: float, request: TroubleshooterRequest) -> List[str]:
    """Generate recommendations for improving data quality"""
    
    recommendations = []
    
    if score < 0.3:
        recommendations.append("Data quality too low for reliable analysis - consider re-acquiring data")
    
    if score < 0.5:
        recommendations.append("Consider providing more complete chromatogram information")
        
        if not request.chromatogram_data or not request.chromatogram_data.peaks:
            recommendations.append("No peak data available - extract peak information for better analysis")
    
    if score < 0.7:
        if request.ocr_data and request.ocr_data.confidence_score < 0.7:
            recommendations.append("OCR confidence low - manually verify extracted data")
        
        recommendations.append("Consider providing additional method parameters")
    
    if not recommendations:
        recommendations.append("Data quality is sufficient for comprehensive analysis")
    
    return recommendations