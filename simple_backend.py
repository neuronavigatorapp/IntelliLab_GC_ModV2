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
