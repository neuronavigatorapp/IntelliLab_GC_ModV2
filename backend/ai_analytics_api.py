"""
IntelliLab GC - Phase 4A: AI Analytics Foundation
================================================

AI-driven analytics backend for advanced method optimization,
predictive maintenance, and cost optimization.

Author: IntelliLab Development Team
Date: September 13, 2025
Phase: 4A - Foundation Setup
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import sqlite3
import json
import numpy as np
from datetime import datetime, timedelta
import pandas as pd
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="IntelliLab GC AI Analytics API",
    description="Advanced AI-driven analytics for GC instrumentation",
    version="4.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
DB_PATH = "intellilab_ai_analytics.db"

def init_ai_database():
    """Initialize AI analytics database with required tables"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # AI Analysis Results Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ai_analysis_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            analysis_type VARCHAR(50) NOT NULL,
            instrument_id INTEGER,
            method_id INTEGER,
            analysis_data JSON,
            confidence_score FLOAT,
            recommendations JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Run History Aggregation Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS run_history_aggregation (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            instrument_id INTEGER NOT NULL,
            aggregation_period VARCHAR(20) NOT NULL,
            period_start DATE NOT NULL,
            period_end DATE NOT NULL,
            total_runs INTEGER,
            avg_runtime FLOAT,
            performance_metrics JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Maintenance Predictions Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS maintenance_predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            instrument_id INTEGER NOT NULL,
            component_type VARCHAR(50) NOT NULL,
            current_condition VARCHAR(20),
            predicted_failure_date DATE,
            confidence_level FLOAT,
            recommended_actions JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Cost Analysis Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cost_analysis (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            analysis_period VARCHAR(20) NOT NULL,
            period_start DATE NOT NULL,
            period_end DATE NOT NULL,
            total_cost FLOAT,
            cost_breakdown JSON,
            optimization_opportunities JSON,
            potential_savings FLOAT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    conn.commit()
    conn.close()
    logger.info("AI Analytics database initialized successfully")

# Pydantic models
class AIMethodOptimization(BaseModel):
    compound_name: str
    method_type: str = Field(..., description="GC-FID, GC-MS, etc.")
    current_parameters: Dict[str, Any]
    target_analytes: List[str]
    optimization_goals: List[str] = Field(default=["resolution", "runtime", "sensitivity"])

class AIAnalysisResult(BaseModel):
    analysis_type: str
    confidence_score: float = Field(..., ge=0, le=1)
    recommendations: Dict[str, Any]
    predicted_improvements: Dict[str, float]
    implementation_steps: List[str]

class PredictiveMaintenanceRequest(BaseModel):
    instrument_id: int
    component_types: List[str] = Field(default=["column", "detector", "inlet", "pump"])
    analysis_period_days: int = Field(default=30, ge=1, le=365)

class MaintenancePrediction(BaseModel):
    component_type: str
    current_condition: str
    predicted_failure_date: Optional[datetime]
    confidence_level: float
    recommended_actions: List[str]
    estimated_cost: float

class CostOptimizationRequest(BaseModel):
    analysis_period_days: int = Field(default=90, ge=1, le=365)
    cost_categories: List[str] = Field(default=["consumables", "maintenance", "utilities"])
    optimization_targets: List[str] = Field(default=["reduce_waste", "bulk_purchasing", "energy_efficiency"])

class CostOptimizationResult(BaseModel):
    current_cost: float
    optimization_opportunities: List[Dict[str, Any]]
    potential_annual_savings: float
    implementation_priority: List[str]

# AI Analytics Engine Classes
class MethodOptimizationAI:
    """AI engine for method optimization recommendations"""
    
    def __init__(self):
        self.optimization_models = {
            "resolution": self._resolution_model,
            "runtime": self._runtime_model,
            "sensitivity": self._sensitivity_model
        }
    
    def optimize_method(self, request: AIMethodOptimization) -> AIAnalysisResult:
        """Generate AI-driven method optimization recommendations"""
        
        # Simulate AI analysis based on method parameters
        current_params = request.current_parameters
        recommendations = {}
        predicted_improvements = {}
        implementation_steps = []
        
        # Temperature optimization
        if "temperature" in current_params:
            temp_recommendation = self._optimize_temperature(current_params["temperature"], request.target_analytes)
            recommendations["temperature"] = temp_recommendation
            predicted_improvements["resolution"] = 0.15  # 15% improvement
            implementation_steps.append("Adjust oven temperature ramp rate")
        
        # Flow rate optimization
        if "flow_rate" in current_params:
            flow_recommendation = self._optimize_flow_rate(current_params["flow_rate"], request.method_type)
            recommendations["flow_rate"] = flow_recommendation
            predicted_improvements["runtime"] = -0.12  # 12% faster
            implementation_steps.append("Optimize carrier gas flow rate")
        
        # Injection parameters
        if "injection_volume" in current_params:
            injection_rec = self._optimize_injection(current_params["injection_volume"])
            recommendations["injection"] = injection_rec
            predicted_improvements["sensitivity"] = 0.25  # 25% improvement
            implementation_steps.append("Adjust injection parameters")
        
        confidence_score = self._calculate_confidence(request, recommendations)
        
        return AIAnalysisResult(
            analysis_type="method_optimization",
            confidence_score=confidence_score,
            recommendations=recommendations,
            predicted_improvements=predicted_improvements,
            implementation_steps=implementation_steps
        )
    
    def _optimize_temperature(self, current_temp: float, analytes: List[str]) -> Dict[str, Any]:
        """AI temperature optimization"""
        # Simulate AI recommendations based on analyte properties
        if "benzene" in str(analytes).lower():
            return {
                "initial_temp": 40,
                "ramp_rate": 10,
                "final_temp": 250,
                "hold_time": 2,
                "reasoning": "Optimized for aromatic compound separation"
            }
        else:
            return {
                "initial_temp": max(35, current_temp - 10),
                "ramp_rate": 8,
                "final_temp": min(300, current_temp + 20),
                "hold_time": 1.5,
                "reasoning": "General optimization for improved separation"
            }
    
    def _optimize_flow_rate(self, current_flow: float, method_type: str) -> Dict[str, Any]:
        """AI flow rate optimization"""
        if "MS" in method_type:
            optimal_flow = 1.2  # Optimal for MS
        else:
            optimal_flow = 2.0  # Optimal for FID
        
        return {
            "carrier_gas_flow": optimal_flow,
            "split_ratio": "10:1",
            "reasoning": f"Optimized for {method_type} detection"
        }
    
    def _optimize_injection(self, current_volume: float) -> Dict[str, Any]:
        """AI injection optimization"""
        return {
            "volume": min(2.0, current_volume * 0.8),
            "temperature": 250,
            "mode": "splitless",
            "reasoning": "Optimized for maximum sensitivity"
        }
    
    def _calculate_confidence(self, request: AIMethodOptimization, recommendations: Dict) -> float:
        """Calculate AI confidence score"""
        base_confidence = 0.75
        
        # Increase confidence based on data quality
        if len(request.target_analytes) > 0:
            base_confidence += 0.1
        if len(recommendations) >= 3:
            base_confidence += 0.1
        
        return min(0.95, base_confidence)

class PredictiveMaintenanceAI:
    """AI engine for predictive maintenance"""
    
    def __init__(self):
        self.component_models = {
            "column": self._column_health_model,
            "detector": self._detector_health_model,
            "inlet": self._inlet_health_model,
            "pump": self._pump_health_model
        }
    
    def predict_maintenance(self, request: PredictiveMaintenanceRequest) -> List[MaintenancePrediction]:
        """Generate predictive maintenance recommendations"""
        
        predictions = []
        
        for component in request.component_types:
            if component in self.component_models:
                prediction = self.component_models[component](request.instrument_id, request.analysis_period_days)
                predictions.append(prediction)
        
        return predictions
    
    def _column_health_model(self, instrument_id: int, period_days: int) -> MaintenancePrediction:
        """AI model for column health prediction"""
        # Simulate AI analysis of column degradation
        degradation_rate = np.random.uniform(0.02, 0.05)  # 2-5% per month
        current_condition = "good" if degradation_rate < 0.03 else "fair"
        
        days_to_failure = int(30 / degradation_rate) if degradation_rate > 0 else None
        failure_date = datetime.now() + timedelta(days=days_to_failure) if days_to_failure else None
        
        return MaintenancePrediction(
            component_type="column",
            current_condition=current_condition,
            predicted_failure_date=failure_date,
            confidence_level=0.82,
            recommended_actions=["Monitor peak resolution", "Track retention time drift", "Plan replacement in 60 days"],
            estimated_cost=850.0
        )
    
    def _detector_health_model(self, instrument_id: int, period_days: int) -> MaintenancePrediction:
        """AI model for detector health prediction"""
        return MaintenancePrediction(
            component_type="detector",
            current_condition="excellent",
            predicted_failure_date=datetime.now() + timedelta(days=120),
            confidence_level=0.75,
            recommended_actions=["Clean FID jet monthly", "Monitor baseline stability"],
            estimated_cost=450.0
        )
    
    def _inlet_health_model(self, instrument_id: int, period_days: int) -> MaintenancePrediction:
        """AI model for inlet health prediction"""
        return MaintenancePrediction(
            component_type="inlet",
            current_condition="good",
            predicted_failure_date=datetime.now() + timedelta(days=45),
            confidence_level=0.88,
            recommended_actions=["Replace inlet liner", "Check septum condition", "Verify injection port temperature"],
            estimated_cost=125.0
        )
    
    def _pump_health_model(self, instrument_id: int, period_days: int) -> MaintenancePrediction:
        """AI model for pump health prediction"""
        return MaintenancePrediction(
            component_type="pump",
            current_condition="excellent",
            predicted_failure_date=None,  # No predicted failure
            confidence_level=0.92,
            recommended_actions=["Monitor pressure stability", "Annual pump service recommended"],
            estimated_cost=200.0
        )

class CostOptimizationAI:
    """AI engine for cost optimization analysis"""
    
    def analyze_costs(self, request: CostOptimizationRequest) -> CostOptimizationResult:
        """Generate cost optimization recommendations"""
        
        # Simulate cost analysis
        current_monthly_cost = 2500.0  # Base monthly cost
        
        optimization_opportunities = []
        
        if "consumables" in request.cost_categories:
            optimization_opportunities.append({
                "category": "consumables",
                "opportunity": "Bulk purchasing of columns and syringes",
                "current_cost": 1200.0,
                "potential_savings": 180.0,
                "implementation_effort": "low"
            })
        
        if "maintenance" in request.cost_categories:
            optimization_opportunities.append({
                "category": "maintenance",
                "opportunity": "Predictive maintenance scheduling",
                "current_cost": 800.0,
                "potential_savings": 120.0,
                "implementation_effort": "medium"
            })
        
        if "utilities" in request.cost_categories:
            optimization_opportunities.append({
                "category": "utilities",
                "opportunity": "Optimized run scheduling and energy management",
                "current_cost": 500.0,
                "potential_savings": 75.0,
                "implementation_effort": "low"
            })
        
        total_potential_savings = sum(op["potential_savings"] for op in optimization_opportunities)
        annual_savings = total_potential_savings * 12
        
        implementation_priority = sorted(
            optimization_opportunities,
            key=lambda x: x["potential_savings"] / (1 if x["implementation_effort"] == "low" else 2),
            reverse=True
        )
        
        return CostOptimizationResult(
            current_cost=current_monthly_cost,
            optimization_opportunities=optimization_opportunities,
            potential_annual_savings=annual_savings,
            implementation_priority=[op["opportunity"] for op in implementation_priority]
        )

# Initialize AI engines
method_ai = MethodOptimizationAI()
maintenance_ai = PredictiveMaintenanceAI()
cost_ai = CostOptimizationAI()

# API Routes
@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    init_ai_database()
    logger.info("IntelliLab GC AI Analytics API started successfully")

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "IntelliLab GC AI Analytics API v4.0.0", "status": "operational"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "4.0.0",
        "ai_engines": ["method_optimization", "predictive_maintenance", "cost_optimization"]
    }

# Method Optimization Endpoints
@app.post("/ai/method-optimization", response_model=AIAnalysisResult)
async def optimize_method(request: AIMethodOptimization):
    """AI-driven method parameter optimization"""
    try:
        result = method_ai.optimize_method(request)
        
        # Store result in database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO ai_analysis_results 
            (analysis_type, analysis_data, confidence_score, recommendations) 
            VALUES (?, ?, ?, ?)
        """, (
            "method_optimization",
            json.dumps(request.model_dump()),
            result.confidence_score,
            json.dumps(result.recommendations)
        ))
        conn.commit()
        conn.close()
        
        return result
    except Exception as e:
        logger.error(f"Method optimization error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

# Predictive Maintenance Endpoints
@app.post("/ai/maintenance-predictions", response_model=List[MaintenancePrediction])
async def get_maintenance_predictions(request: PredictiveMaintenanceRequest):
    """Get predictive maintenance recommendations"""
    try:
        predictions = maintenance_ai.predict_maintenance(request)
        
        # Store predictions in database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        for prediction in predictions:
            cursor.execute("""
                INSERT INTO maintenance_predictions 
                (instrument_id, component_type, current_condition, predicted_failure_date, confidence_level, recommended_actions)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                request.instrument_id,
                prediction.component_type,
                prediction.current_condition,
                prediction.predicted_failure_date.isoformat() if prediction.predicted_failure_date else None,
                prediction.confidence_level,
                json.dumps(prediction.recommended_actions)
            ))
        
        conn.commit()
        conn.close()
        
        return predictions
    except Exception as e:
        logger.error(f"Predictive maintenance error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Maintenance prediction failed: {str(e)}")

# Cost Optimization Endpoints
@app.post("/ai/cost-optimization", response_model=CostOptimizationResult)
async def analyze_cost_optimization(request: CostOptimizationRequest):
    """AI-driven cost optimization analysis"""
    try:
        result = cost_ai.analyze_costs(request)
        
        # Store analysis in database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO cost_analysis 
            (analysis_period, period_start, period_end, total_cost, cost_breakdown, optimization_opportunities, potential_savings)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            f"{request.analysis_period_days}_days",
            (datetime.now() - timedelta(days=request.analysis_period_days)).date().isoformat(),
            datetime.now().date().isoformat(),
            result.current_cost,
            json.dumps({"categories": request.cost_categories}),
            json.dumps(result.optimization_opportunities),
            result.potential_annual_savings
        ))
        conn.commit()
        conn.close()
        
        return result
    except Exception as e:
        logger.error(f"Cost optimization error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Cost analysis failed: {str(e)}")

# Data Analysis Endpoints
@app.get("/ai/analysis-history")
async def get_analysis_history():
    """Get historical AI analysis results"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT analysis_type, confidence_score, created_at, COUNT(*) as count
            FROM ai_analysis_results 
            GROUP BY analysis_type 
            ORDER BY created_at DESC
        """)
        
        results = cursor.fetchall()
        conn.close()
        
        return {
            "analysis_summary": [
                {
                    "type": row[0],
                    "avg_confidence": row[1],
                    "last_analysis": row[2],
                    "total_count": row[3]
                }
                for row in results
            ]
        }
    except Exception as e:
        logger.error(f"Analysis history error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve analysis history: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)