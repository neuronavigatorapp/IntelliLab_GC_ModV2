#!/usr/bin/env python3
"""
Analytics endpoints for Phase 4 - Advanced Analytics & AI Tools
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging

from app.models.schemas import (
    AIRecommendation, MaintenancePrediction, OptimizationSuggestion,
    DiagnosticsRequest, MethodOptimizationRequest, CostOptimizationRequest,
    CostOptimizationResult, AnalyticsSummary, RunQuery, InstrumentFilter
)
from app.services.analytics_service import AnalyticsService

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize analytics service
analytics_service = AnalyticsService()

# Feature flag for analytics
ENABLE_ANALYTICS = True

@router.post("/diagnostics", response_model=List[AIRecommendation])
async def run_diagnostics(request: DiagnosticsRequest):
    """
    Run comprehensive diagnostics analysis on instrument and method performance.
    
    Analyzes retention drift, ghost peaks, and sensitivity drops to provide
    actionable recommendations for method optimization and instrument maintenance.
    """
    if not ENABLE_ANALYTICS:
        raise HTTPException(status_code=503, detail="Analytics feature is disabled")
    
    try:
        # Mock run history data for demonstration
        run_history = _get_mock_run_history(request.instrument_id, request.method_id)
        
        recommendations = []
        
        # Retention drift analysis
        if request.include_drift_analysis:
            drift_results = analytics_service.compute_retention_drift(run_history)
            for drift in drift_results:
                if drift.is_drifting:
                    recommendations.append(AIRecommendation(
                        id=len(recommendations) + 1,
                        category="diagnostic",
                        title=f"Retention Drift Detected: {drift.compound}",
                        details=f"Compound {drift.compound} shows {drift.trend} retention drift "
                               f"({drift.slope:.2f} sec/run, R²={drift.r_squared:.2f}). "
                               f"Consider column conditioning or method adjustment.",
                        confidence=min(drift.r_squared, 0.9),
                        created_at=datetime.now(),
                        instrument_id=request.instrument_id,
                        method_id=request.method_id,
                        severity="warning" if abs(drift.slope) < 1.0 else "error"
                    ))
        
        # Ghost peak detection
        if request.include_ghost_peaks and run_history:
            method_baseline = _get_mock_method_baseline(request.method_id)
            ghost_peaks = analytics_service.detect_ghost_peaks(run_history[-1], method_baseline)
            
            for peak in ghost_peaks:
                recommendations.append(AIRecommendation(
                    id=len(recommendations) + 1,
                    category="diagnostic",
                    title=f"Ghost Peak Detected at {peak.retention_time:.2f} min",
                    details=f"Unexpected peak detected at {peak.retention_time:.2f} min "
                           f"with area {peak.area:.0f}. Possible contamination or "
                           f"column degradation. Investigate sample preparation and column condition.",
                    confidence=peak.confidence,
                    created_at=datetime.now(),
                    instrument_id=request.instrument_id,
                    method_id=request.method_id,
                    severity="warning"
                ))
        
        # Sensitivity analysis
        if request.include_sensitivity_analysis:
            sensitivity_results = analytics_service.sensitivity_drop(run_history)
            for sensitivity in sensitivity_results:
                if sensitivity.is_significant:
                    recommendations.append(AIRecommendation(
                        id=len(recommendations) + 1,
                        category="diagnostic",
                        title=f"Sensitivity Drop: {sensitivity.compound}",
                        details=f"Compound {sensitivity.compound} shows {sensitivity.drop_percentage:.1%} "
                               f"sensitivity drop. Current median: {sensitivity.current_median:.0f}, "
                               f"Previous median: {sensitivity.previous_median:.0f}. "
                               f"Check detector condition and inlet maintenance.",
                        confidence=0.8,
                        created_at=datetime.now(),
                        instrument_id=request.instrument_id,
                        method_id=request.method_id,
                        severity="error" if sensitivity.drop_percentage > 0.5 else "warning"
                    ))
        
        # Add general recommendations if no specific issues found
        if not recommendations:
            recommendations.append(AIRecommendation(
                id=1,
                category="diagnostic",
                title="System Performance Good",
                details="No significant issues detected in the analyzed runs. "
                       "Continue monitoring for trends.",
                confidence=0.9,
                created_at=datetime.now(),
                instrument_id=request.instrument_id,
                method_id=request.method_id,
                severity="info"
            ))
        
        return recommendations
        
    except Exception as e:
        logger.error(f"Error in diagnostics analysis: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to run diagnostics analysis")


@router.post("/optimize-method", response_model=OptimizationSuggestion)
async def optimize_method(request: MethodOptimizationRequest):
    """
    Suggest method optimizations based on historical performance data.
    
    Analyzes oven ramp rates, inlet parameters, and detector settings to
    suggest improvements in analysis time, resolution, and sensitivity.
    """
    if not ENABLE_ANALYTICS:
        raise HTTPException(status_code=503, detail="Analytics feature is disabled")
    
    try:
        # Get method parameters
        method_params = request.method_parameters or _get_mock_method_params(request.method_id)
        run_history = _get_mock_run_history(request.instrument_id, request.method_id)
        
        # Run optimization analysis
        optimization_result = analytics_service.optimize_method_simple(method_params, run_history)
        
        # Create optimization suggestion
        suggestion = OptimizationSuggestion(
            id=1,
            target="method",
            suggested_changes=optimization_result,
            expected_effects={
                "runtime": "Expected 10-15% reduction in analysis time",
                "resolution": "Maintained or improved peak separation",
                "sensitivity": "Optimized for target compounds"
            },
            confidence=optimization_result.get('confidence', 0.7),
            created_at=datetime.now(),
            method_id=request.method_id,
            instrument_id=request.instrument_id,
            time_savings=optimization_result.get('oven_optimization', {}).get('expected_runtime_reduction', 0)
        )
        
        return suggestion
        
    except Exception as e:
        logger.error(f"Error in method optimization: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to optimize method")


@router.get("/maintenance", response_model=List[MaintenancePrediction])
async def get_maintenance_predictions(
    instrument_id: Optional[int] = Query(None, description="Filter by instrument ID")
):
    """
    Get predictive maintenance predictions for consumables and critical components.
    
    Uses EWMA analysis on usage patterns to predict when components will need
    replacement or maintenance.
    """
    if not ENABLE_ANALYTICS:
        raise HTTPException(status_code=503, detail="Analytics feature is disabled")
    
    try:
        # Mock consumable usage data
        consumable_usage = _get_mock_consumable_usage(instrument_id)
        alerts_history = _get_mock_alerts_history(instrument_id)
        
        # Get maintenance predictions
        predictions_data = analytics_service.predict_maintenance(consumable_usage, alerts_history)
        
        # Convert to MaintenancePrediction objects
        predictions = []
        for i, pred in enumerate(predictions_data):
            predictions.append(MaintenancePrediction(
                id=i + 1,
                asset_type=pred['asset_type'],
                asset_id=i + 1,
                health_score=pred['health_score'],
                days_remaining=pred['days_remaining'],
                rationale=pred['rationale'],
                updated_at=datetime.now(),
                instrument_id=instrument_id or 1,
                confidence=pred['confidence'],
                recommended_action=pred['recommended_action']
            ))
        
        return predictions
        
    except Exception as e:
        logger.error(f"Error in maintenance prediction: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get maintenance predictions")


@router.post("/cost-optimizer", response_model=CostOptimizationResult)
async def optimize_costs(request: CostOptimizationRequest):
    """
    Analyze and suggest cost optimizations for consumables and method parameters.
    
    Identifies opportunities to reduce per-analysis costs through consumable
    alternatives, usage optimization, and method parameter adjustments.
    """
    if not ENABLE_ANALYTICS:
        raise HTTPException(status_code=503, detail="Analytics feature is disabled")
    
    try:
        # Mock consumables data
        consumables = _get_mock_consumables_data(request.instrument_id)
        method_params = _get_mock_method_params(request.method_id)
        
        # Run cost optimization analysis
        optimization_result = analytics_service.cost_optimization(consumables, method_params)
        
        # Convert to CostOptimizationResult
        suggestions = []
        for i, suggestion in enumerate(optimization_result.get('suggestions', [])):
            suggestions.append(OptimizationSuggestion(
                id=i + 1,
                target="cost",
                suggested_changes=suggestion,
                expected_effects={"cost_savings": f"${suggestion.get('cost_savings', 0):.2f} per analysis"},
                confidence=0.8,
                created_at=datetime.now(),
                method_id=request.method_id,
                instrument_id=request.instrument_id,
                cost_savings=suggestion.get('cost_savings', 0)
            ))
        
        return CostOptimizationResult(
            current_cost_per_analysis=optimization_result['current_cost_per_analysis'],
            proposed_cost_per_analysis=optimization_result['proposed_cost_per_analysis'],
            savings_percentage=optimization_result['savings_percentage'],
            suggestions=suggestions,
            line_items=_get_mock_cost_line_items(),
            payback_period_days=optimization_result.get('payback_period_days')
        )
        
    except Exception as e:
        logger.error(f"Error in cost optimization: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to optimize costs")


@router.get("/summary", response_model=AnalyticsSummary)
async def get_analytics_summary():
    """
    Get summary statistics for analytics features.
    
    Returns overview of analyzed runs, recommendations, and potential savings.
    """
    if not ENABLE_ANALYTICS:
        raise HTTPException(status_code=503, detail="Analytics feature is disabled")
    
    try:
        return AnalyticsSummary(
            total_runs_analyzed=25,
            total_recommendations=8,
            critical_alerts=2,
            maintenance_predictions=3,
            cost_savings_potential=15.50,
            last_analysis_date=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Error getting analytics summary: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get analytics summary")


# Mock data functions for demonstration
def _get_mock_run_history(instrument_id: Optional[int], method_id: Optional[int]) -> List[Dict[str, Any]]:
    """Generate mock run history data"""
    runs = []
    base_time = datetime.now() - timedelta(days=30)
    
    for i in range(10):
        run_time = base_time + timedelta(days=i * 3)
        runs.append({
            'id': i + 1,
            'instrument_id': instrument_id or 1,
            'method_id': method_id or 1,
            'timestamp': run_time,
            'retention_times': {
                'Benzene': 3.2 + (i * 0.1),  # Simulate drift
                'Toluene': 4.8 + (i * 0.05),
                'Ethylbenzene': 6.1 + (i * 0.08)
            },
            'peak_areas': {
                'Benzene': 50000 - (i * 1000),  # Simulate sensitivity drop
                'Toluene': 45000 - (i * 800),
                'Ethylbenzene': 40000 - (i * 600)
            },
            'baseline_noise': 0.5 + (i * 0.1)
        })
    
    return runs


def _get_mock_method_baseline(method_id: Optional[int]) -> Dict[str, Any]:
    """Generate mock method baseline data"""
    return {
        'compounds': ['Benzene', 'Toluene', 'Ethylbenzene'],
        'retention_times': {
            'Benzene': 3.2,
            'Toluene': 4.8,
            'Ethylbenzene': 6.1
        }
    }


def _get_mock_method_params(method_id: Optional[int]) -> Dict[str, Any]:
    """Generate mock method parameters"""
    return {
        'oven': {
            'initial_temp': 50,
            'final_temp': 200,
            'ramp_rate': 10,
            'hold_time': 5
        },
        'inlet': {
            'temperature': 250,
            'split_ratio': 10,
            'flow': 1.0
        }
    }


def _get_mock_consumable_usage(instrument_id: Optional[int]) -> List[Dict[str, Any]]:
    """Generate mock consumable usage data"""
    usage = []
    base_date = datetime.now() - timedelta(days=90)
    
    # Column usage
    for i in range(5):
        usage.append({
            'asset_type': 'column',
            'usage_date': (base_date + timedelta(days=i * 20)).isoformat(),
            'instrument_id': instrument_id or 1
        })
    
    # Liner usage
    for i in range(8):
        usage.append({
            'asset_type': 'liner',
            'usage_date': (base_date + timedelta(days=i * 10)).isoformat(),
            'instrument_id': instrument_id or 1
        })
    
    # Septa usage
    for i in range(12):
        usage.append({
            'asset_type': 'septa',
            'usage_date': (base_date + timedelta(days=i * 7)).isoformat(),
            'instrument_id': instrument_id or 1
        })
    
    return usage


def _get_mock_alerts_history(instrument_id: Optional[int]) -> List[Dict[str, Any]]:
    """Generate mock alerts history"""
    return [
        {
            'type': 'maintenance',
            'severity': 'warning',
            'message': 'Column performance degrading',
            'timestamp': (datetime.now() - timedelta(days=5)).isoformat()
        }
    ]


def _get_mock_consumables_data(instrument_id: Optional[int]) -> List[Dict[str, Any]]:
    """Generate mock consumables data"""
    return [
        {
            'name': 'Premium Liner',
            'category': 'liner',
            'cost_per_analysis': 2.50,
            'usage_rate': 0.1
        },
        {
            'name': 'Standard Liner',
            'category': 'liner',
            'cost_per_analysis': 1.80,
            'usage_rate': 0.1
        },
        {
            'name': 'Premium Septa',
            'category': 'septa',
            'cost_per_analysis': 0.80,
            'usage_rate': 0.05
        }
    ]


def _get_mock_cost_line_items() -> List[Dict[str, Any]]:
    """Generate mock cost line items"""
    return [
        {'name': 'Liner Replacement', 'value': 2.50, 'unit': 'USD'},
        {'name': 'Septa Replacement', 'value': 0.80, 'unit': 'USD'},
        {'name': 'Column Amortization', 'value': 1.20, 'unit': 'USD'},
        {'name': 'Gas Consumption', 'value': 0.50, 'unit': 'USD'}
    ]
