#!/usr/bin/env python3
"""
Simple IntelliLab GC Backend - Basic Working Version
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import math
import numpy as np
import random

# Create FastAPI app
app = FastAPI(
    title="IntelliLab GC API",
    description="Simple GC instrumentation API",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data Models
class DetectionLimitRequest(BaseModel):
    signal_intensity: float = 1000.0
    noise_level: float = 10.0
    sample_concentration: float = 1.0
    injection_volume: float = 1.0
    dilution_factor: float = 1.0

class DetectionLimitResponse(BaseModel):
    detection_limit: float
    signal_to_noise: float
    confidence_level: float
    method_recommendation: str

class OvenRampRequest(BaseModel):
    initial_temp: float = 50.0
    final_temp: float = 300.0
    ramp_rate: float = 10.0
    hold_time: float = 5.0

class OvenRampResponse(BaseModel):
    total_time: float
    temperature_profile: List[dict]
    efficiency_score: float
    recommendations: List[str]

class InletSimRequest(BaseModel):
    carrier_gas: str = "Helium"
    flow_rate: float = 1.0
    pressure: float = 15.0
    temperature: float = 250.0
    split_ratio: str = "10:1"

class InletSimResponse(BaseModel):
    linear_velocity: float
    residence_time: float
    efficiency: float
    recommendations: List[str]

# Sample instrument data
instruments = [
    {
        "id": 1,
        "name": "GC-MS System 1",
        "model": "Agilent 7890B/5977A",
        "status": "Online",
        "last_maintenance": "2024-01-15",
        "utilization": 85.2
    },
    {
        "id": 2,
        "name": "GC-FID System 2", 
        "model": "Shimadzu GC-2030",
        "status": "Maintenance",
        "last_maintenance": "2024-01-10",
        "utilization": 72.8
    },
    {
        "id": 3,
        "name": "GC-TCD System 3",
        "model": "PerkinElmer Clarus 690",
        "status": "Online",
        "last_maintenance": "2024-01-20",
        "utilization": 91.5
    }
]

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "IntelliLab GC API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/database/status")
async def database_status():
    """Check database connectivity and status"""
    try:
        import sqlite3
        import os
        
        # Check for database files
        db_files = [
            "intellilab_gc.db",
            "intellilab_sessions.db", 
            "intellilab_analytics.db"
        ]
        
        db_status = {}
        overall_status = "healthy"
        
        for db_file in db_files:
            if os.path.exists(db_file):
                try:
                    conn = sqlite3.connect(db_file)
                    cursor = conn.cursor()
                    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
                    tables = cursor.fetchall()
                    conn.close()
                    
                    db_status[db_file] = {
                        "exists": True,
                        "accessible": True,
                        "table_count": len(tables),
                        "size_kb": round(os.path.getsize(db_file) / 1024, 2)
                    }
                except Exception as e:
                    db_status[db_file] = {
                        "exists": True,
                        "accessible": False,
                        "error": str(e)
                    }
                    overall_status = "degraded"
            else:
                db_status[db_file] = {
                    "exists": False,
                    "accessible": False
                }
                
        return {
            "status": overall_status,
            "databases": db_status,
            "timestamp": "2024-01-01T12:00:00Z"
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "timestamp": "2024-01-01T12:00:00Z"
        }

@app.post("/api/v1/persistence/test")
async def test_persistence():
    """Test persistence operations"""
    try:
        import sqlite3
        import tempfile
        import os
        
        # Create a temporary database to test operations
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as temp_db:
            temp_path = temp_db.name
            
        try:
            # Test SQLite operations
            conn = sqlite3.connect(temp_path)
            cursor = conn.cursor()
            
            # Create test table
            cursor.execute("""
                CREATE TABLE test_persistence (
                    id INTEGER PRIMARY KEY,
                    test_data TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Insert test data
            cursor.execute(
                "INSERT INTO test_persistence (test_data) VALUES (?)",
                ("Test persistence data",)
            )
            
            # Query test data
            cursor.execute("SELECT * FROM test_persistence")
            results = cursor.fetchall()
            
            conn.commit()
            conn.close()
            
            # Clean up
            os.unlink(temp_path)
            
            return {
                "status": "success",
                "test_results": {
                    "database_creation": "passed",
                    "data_insertion": "passed", 
                    "data_retrieval": "passed",
                    "record_count": len(results)
                },
                "message": "All persistence operations successful"
            }
            
        except Exception as e:
            # Clean up on error
            if os.path.exists(temp_path):
                os.unlink(temp_path)
            raise e
            
    except Exception as e:
        return {
            "status": "failed",
            "error": str(e),
            "message": "Persistence test failed"
        }

# Instruments
@app.get("/api/v1/instruments")
async def get_instruments():
    return instruments

# Detection Limit Calculator
@app.post("/api/v1/calculations/detection-limit", response_model=DetectionLimitResponse)
async def calculate_detection_limit(request: DetectionLimitRequest):
    try:
        # Calculate signal-to-noise ratio
        snr = request.signal_intensity / request.noise_level
        
        # Calculate detection limit (3 * noise / slope)
        # Simplified calculation assuming linear response
        slope = request.signal_intensity / request.sample_concentration
        detection_limit = (3 * request.noise_level) / slope
        
        # Apply dilution and volume corrections
        detection_limit = detection_limit * request.dilution_factor / request.injection_volume
        
        # Calculate confidence level based on S/N ratio
        confidence_level = min(95.0, 50.0 + (snr - 3) * 5)
        
        # Generate recommendation
        if snr > 10:
            recommendation = "Excellent sensitivity. Method is suitable for trace analysis."
        elif snr > 6:
            recommendation = "Good sensitivity. Consider optimizing injection parameters."
        elif snr > 3:
            recommendation = "Acceptable sensitivity. Improve sample prep or increase injection volume."
        else:
            recommendation = "Poor sensitivity. Significant method optimization required."
        
        return DetectionLimitResponse(
            detection_limit=round(detection_limit, 6),
            signal_to_noise=round(snr, 2),
            confidence_level=round(confidence_level, 1),
            method_recommendation=recommendation
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Oven Ramp Visualizer
@app.post("/api/v1/calculations/oven-ramp", response_model=OvenRampResponse)
async def calculate_oven_ramp(request: OvenRampRequest):
    try:
        # Calculate ramp time
        temp_diff = request.final_temp - request.initial_temp
        ramp_time = temp_diff / request.ramp_rate
        total_time = ramp_time + request.hold_time
        
        # Generate temperature profile
        profile = []
        time_points = np.linspace(0, total_time, 50)
        
        for t in time_points:
            if t <= ramp_time:
                temp = request.initial_temp + (request.ramp_rate * t)
            else:
                temp = request.final_temp
            
            profile.append({
                "time": round(t, 2),
                "temperature": round(temp, 1)
            })
        
        # Calculate efficiency score (simplified)
        efficiency_score = min(10.0, (request.ramp_rate / 5.0) * 8 + 2)
        
        # Generate recommendations
        recommendations = []
        if request.ramp_rate > 20:
            recommendations.append("High ramp rate may cause poor peak resolution")
        elif request.ramp_rate < 5:
            recommendations.append("Low ramp rate will increase analysis time")
        
        if request.hold_time < 2:
            recommendations.append("Consider longer hold time for complete elution")
        elif request.hold_time > 10:
            recommendations.append("Long hold time may not be necessary")
        
        if not recommendations:
            recommendations.append("Optimal temperature program parameters")
        
        return OvenRampResponse(
            total_time=round(total_time, 2),
            temperature_profile=profile,
            efficiency_score=round(efficiency_score, 1),
            recommendations=recommendations
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Inlet Simulator
@app.post("/api/v1/calculations/inlet-simulator", response_model=InletSimResponse)
async def simulate_inlet(request: InletSimRequest):
    try:
        # Calculate linear velocity (cm/s)
        # Simplified calculation based on column properties
        column_length = 30  # meters
        column_diameter = 0.25  # mm
        
        # Convert flow rate to linear velocity
        linear_velocity = (request.flow_rate * 60) / (math.pi * (column_diameter/2000)**2)
        
        # Calculate residence time
        residence_time = (column_length * 100) / linear_velocity  # seconds
        
        # Calculate efficiency (simplified)
        optimal_velocity = 30  # cm/s for typical column
        efficiency = 100 * math.exp(-abs(linear_velocity - optimal_velocity) / optimal_velocity)
        
        # Generate recommendations
        recommendations = []
        if linear_velocity > 50:
            recommendations.append("Flow rate too high - reduce for better resolution")
        elif linear_velocity < 20:
            recommendations.append("Flow rate too low - increase for faster analysis")
        
        if request.temperature < 200:
            recommendations.append("Consider higher inlet temperature for better vaporization")
        elif request.temperature > 300:
            recommendations.append("High temperature may cause sample degradation")
        
        if not recommendations:
            recommendations.append("Optimal inlet conditions")
        
        return InletSimResponse(
            linear_velocity=round(linear_velocity, 2),
            residence_time=round(residence_time, 2),
            efficiency=round(efficiency, 1),
            recommendations=recommendations
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Calculation History Storage
@app.post("/api/v1/calculations/store")
async def store_calculation(calculation: dict):
    """Store calculation result for history tracking"""
    try:
        import sqlite3
        import json
        from datetime import datetime
        
        # Connect to calculations database
        conn = sqlite3.connect("calculations_history.db")
        cursor = conn.cursor()
        
        # Create table if it doesn't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS calculation_history (
                id TEXT PRIMARY KEY,
                type TEXT NOT NULL,
                inputs TEXT NOT NULL,
                outputs TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                execution_time INTEGER
            )
        """)
        
        # Store calculation
        cursor.execute("""
            INSERT OR REPLACE INTO calculation_history 
            (id, type, inputs, outputs, execution_time)
            VALUES (?, ?, ?, ?, ?)
        """, (
            calculation.get("id"),
            calculation.get("type"),
            json.dumps(calculation.get("inputs", {})),
            json.dumps(calculation.get("outputs", {})),
            calculation.get("execution_time", 0)
        ))
        
        conn.commit()
        conn.close()
        
        return {
            "status": "success",
            "message": "Calculation stored successfully",
            "calculation_id": calculation.get("id")
        }
        
    except Exception as e:
        return {
            "status": "error", 
            "message": f"Failed to store calculation: {str(e)}"
        }

@app.get("/api/v1/calculations/history")
async def get_calculation_history(limit: int = 20):
    """Retrieve calculation history"""
    try:
        import sqlite3
        import json
        
        conn = sqlite3.connect("calculations_history.db")
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, type, inputs, outputs, timestamp, execution_time
            FROM calculation_history
            ORDER BY timestamp DESC
            LIMIT ?
        """, (limit,))
        
        results = cursor.fetchall()
        conn.close()
        
        # Format results
        history = []
        for row in results:
            history.append({
                "id": row[0],
                "type": row[1],
                "inputs": json.loads(row[2]),
                "outputs": json.loads(row[3]),
                "timestamp": row[4],
                "execution_time": row[5]
            })
        
        return {
            "status": "success",
            "calculations": history,
            "count": len(history)
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to retrieve calculation history: {str(e)}",
            "calculations": []
        }

# AI Troubleshooting (simplified)
@app.post("/api/v1/ai/troubleshooting")
async def ai_troubleshooting(problem: dict):
    problem_text = problem.get("problem", "").lower()
    
    # Simple rule-based responses
    if "peak" in problem_text and "shape" in problem_text:
        response = "Poor peak shape can be caused by: 1) Overloaded column, 2) Wrong injection temperature, 3) Column degradation. Try reducing injection volume and check inlet temperature."
    elif "baseline" in problem_text:
        response = "Baseline issues: 1) Check for leaks in system, 2) Verify carrier gas purity, 3) Condition column at higher temperature."
    elif "retention" in problem_text:
        response = "Retention time issues: 1) Check flow rate consistency, 2) Verify oven temperature, 3) Check for column contamination."
    elif "pressure" in problem_text:
        response = "Pressure problems: 1) Check for blockages, 2) Verify septum condition, 3) Check column connections."
    else:
        response = "For general troubleshooting: 1) Check all connections, 2) Verify gas supplies, 3) Run system diagnostics, 4) Check maintenance schedule."
    
    return {
        "response": response,
        "severity": "medium",
        "confidence": 85,
        "recommended_actions": [
            "Run system diagnostics",
            "Check maintenance log", 
            "Verify operating conditions"
        ]
    }

# Chromatogram Simulation Models
class ChromatogramSimRequest(BaseModel):
    column_temp: float = 40.0
    ramp_rate: float = 10.0
    flow_rate: float = 1.0
    split_ratio: float = 50.0
    column_length: float = 30.0
    column_diameter: float = 0.25

class PeakData(BaseModel):
    compound: str
    retention_time: float
    peak_height: float
    peak_area: float
    boiling_point: float
    peak_width: float

class ChromatogramSimResponse(BaseModel):
    peaks: List[PeakData]
    total_runtime: float
    data_points: List[dict]

# ChromaVision Analysis Models
class ChromaVisionRequest(BaseModel):
    image: str  # Base64 encoded image

class ChromaVisionResponse(BaseModel):
    analysis: dict
    ai_insights: dict

@app.post("/api/chromatogram/analyze-base64", response_model=ChromaVisionResponse)
async def analyze_chromatogram_base64(request: ChromaVisionRequest):
    """
    Analyze chromatogram from base64 image for Method Development Tracker
    """
    try:
        import base64
        import random
        
        # Extract image data (simplified validation)
        if not request.image.startswith('data:image'):
            raise HTTPException(status_code=400, detail="Invalid base64 image format")
        
        # Simulate ChromaVision AI analysis
        # In reality, this would use actual image processing and AI models
        
        # Generate realistic analysis results
        peak_count = random.randint(3, 8)
        quality_score = random.uniform(45, 92)
        
        # Create peak data
        peaks = []
        for i in range(peak_count):
            peaks.append({
                "retention_time": round(random.uniform(2, 18), 2),
                "area": random.randint(1000, 50000),
                "height": random.randint(100, 5000),
                "width": round(random.uniform(0.1, 0.8), 2),
                "symmetry": round(random.uniform(0.8, 1.5), 2),
                "resolution": round(random.uniform(1.2, 8.5), 2) if i > 0 else None
            })
        
        # Sort peaks by retention time
        peaks.sort(key=lambda x: x["retention_time"])
        
        # Determine quality grade based on score
        if quality_score >= 85:
            quality_grade = "Excellent"
            primary_issue = "Method meets all acceptance criteria"
        elif quality_score >= 75:
            quality_grade = "Good"
            primary_issue = "Minor optimization opportunities exist"
        elif quality_score >= 60:
            quality_grade = "Acceptable"
            primary_issue = "Some peak resolution or baseline issues"
        elif quality_score >= 45:
            quality_grade = "Poor"
            primary_issue = "Significant peak overlap or baseline problems"
        else:
            quality_grade = "Unacceptable"
            primary_issue = "Major chromatographic issues detected"
        
        # Generate troubleshooting suggestions based on quality
        troubleshooting = []
        if quality_score < 70:
            troubleshooting.extend([
                "Consider adjusting mobile phase composition",
                "Evaluate column temperature optimization",
                "Check injection technique and volume"
            ])
        if quality_score < 60:
            troubleshooting.extend([
                "Assess column condition and efficiency",
                "Review sample preparation procedures",
                "Consider gradient optimization"
            ])
        if quality_score < 50:
            troubleshooting.extend([
                "Investigate baseline drift issues",
                "Check for column contamination",
                "Evaluate detector settings"
            ])
        
        # Build response
        analysis_data = {
            "overall_quality_score": round(quality_score, 1),
            "peak_count": len(peaks),
            "peaks": peaks,
            "baseline_quality": round(random.uniform(60, 95), 1),
            "noise_level": round(random.uniform(1, 15), 1),
            "troubleshooting_suggestions": troubleshooting
        }
        
        ai_insights_data = {
            "quality_grade": quality_grade,
            "primary_issue": primary_issue,
            "confidence_score": round(random.uniform(85, 98), 1),
            "analysis_timestamp": "2024-01-01T12:00:00Z"
        }
        
        return ChromaVisionResponse(
            analysis=analysis_data,
            ai_insights=ai_insights_data
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/api/chromatogram/simulate", response_model=ChromatogramSimResponse)
async def simulate_chromatogram(request: ChromatogramSimRequest):
    """
    Simulate C1-C6 paraffin chromatogram separation
    """
    try:
        # Define C1-C6 paraffin compounds with their boiling points
        compounds = [
            {"name": "C1 (Methane)", "bp": -161.5, "formula": "CH4"},
            {"name": "C2 (Ethane)", "bp": -88.6, "formula": "C2H6"},
            {"name": "C3 (Propane)", "bp": -42.1, "formula": "C3H8"},
            {"name": "C4 (Butane)", "bp": -0.5, "formula": "C4H10"},
            {"name": "C5 (Pentane)", "bp": 36.1, "formula": "C5H12"},
            {"name": "C6 (Hexane)", "bp": 68.7, "formula": "C6H14"}
        ]
        
        # Calculate retention times based on boiling points and GC conditions
        peaks = []
        for i, compound in enumerate(compounds):
            # Empirical retention time calculation based on boiling point and conditions
            # Higher temps = faster elution, higher flow = faster elution
            base_rt = (compound["bp"] + 200) / 50  # Convert BP to approximate RT
            temp_factor = 100 / request.column_temp  # Higher temp = lower RT
            flow_factor = 1.0 / request.flow_rate  # Higher flow = lower RT
            
            retention_time = base_rt * temp_factor * flow_factor
            
            # Ensure proper elution order and minimum separation
            if i > 0:
                min_rt = peaks[i-1].retention_time + 0.5
                if retention_time < min_rt:
                    retention_time = min_rt
            
            # Calculate peak properties
            peak_height = random.uniform(500, 2000) * (1 + i * 0.2)  # Later peaks slightly larger
            peak_width = random.uniform(0.05, 0.15)
            peak_area = peak_height * peak_width * 1.065  # Gaussian peak area approximation
            
            peak = PeakData(
                compound=compound["name"],
                retention_time=round(retention_time, 2),
                peak_height=round(peak_height, 1),
                peak_area=round(peak_area, 1),
                boiling_point=compound["bp"],
                peak_width=round(peak_width, 3)
            )
            peaks.append(peak)
        
        # Calculate total runtime (last peak + 2 minutes)
        total_runtime = peaks[-1].retention_time + 2.0
        
        # Generate chromatogram data points
        data_points = []
        time_points = np.linspace(0, total_runtime, 300)  # 300 data points
        
        for t in time_points:
            signal = 0
            
            # Add baseline noise
            signal += random.uniform(-5, 5)
            
            # Add peaks (Gaussian profiles)
            for peak in peaks:
                # Gaussian peak equation
                amplitude = peak.peak_height
                center = peak.retention_time
                width = peak.peak_width
                
                gaussian = amplitude * np.exp(-0.5 * ((t - center) / width) ** 2)
                signal += gaussian
            
            data_points.append({
                "time": round(t, 3),
                "signal": max(0, round(signal, 2))  # Ensure non-negative signal
            })
        
        return ChromatogramSimResponse(
            peaks=peaks,
            total_runtime=round(total_runtime, 2),
            data_points=data_points
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chromatogram simulation failed: {str(e)}")

if __name__ == "__main__":
    print("Starting IntelliLab GC Simple Backend...")
    print("API Documentation: http://localhost:8000/docs")
    print("Health Check: http://localhost:8000/health")
    print("Press Ctrl+C to stop the server")
    try:
        uvicorn.run(app, host="0.0.0.0", port=8000, reload=False, log_level="info")
    except KeyboardInterrupt:
        print("\nShutting down server...")
    except Exception as e:
        print(f"Server error: {e}")
        input("Press Enter to exit...")
