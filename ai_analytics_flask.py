#!/usr/bin/env python3
"""
IntelliLab GC AI Analytics Backend - Flask Version
=================================================

Flask-based AI analytics server for reliable Windows operation.
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import random
import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

PORT = 8001

@app.route("/", methods=["GET"])
def home():
    """API root endpoint"""
    return jsonify({
        "message": "IntelliLab GC AI Analytics API v4.0.0 - Flask Edition", 
        "status": "operational",
        "engines": ["method-optimization", "predictive-maintenance", "cost-optimization"]
    })

@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.datetime.now().isoformat(),
        "engines_available": 3,
        "server": "Flask"
    })

@app.route("/ai/method-optimization", methods=["POST"])
def method_optimization():
    """Method Optimization AI Engine"""
    data = request.get_json() or {}
    compound = data.get('compound_name', 'Unknown')
    method_type = data.get('method_type', 'GC-MS')
    
    # Generate realistic optimization suggestions
    optimizations = [
        {
            "parameter": "Injection Temperature",
            "current_value": 250,
            "optimized_value": 280,
            "improvement": "15% better sensitivity",
            "confidence": 0.92
        },
        {
            "parameter": "Column Flow Rate",
            "current_value": "1.0 mL/min",
            "optimized_value": "1.2 mL/min",
            "improvement": "8% faster analysis",
            "confidence": 0.87
        },
        {
            "parameter": "Detector Temperature",
            "current_value": 300,
            "optimized_value": 320,
            "improvement": "12% improved detection",
            "confidence": 0.89
        }
    ]
    
    return jsonify({
        "compound_analyzed": compound,
        "method_type": method_type,
        "optimizations": optimizations,
        "performance_improvement": random.randint(10, 25),
        "estimated_time_savings": f"{random.randint(5, 15)} minutes",
        "confidence_score": round(random.uniform(0.85, 0.95), 2),
        "generated_at": datetime.datetime.now().isoformat()
    })

@app.route("/ai/maintenance-predictions", methods=["POST"])
def maintenance_predictions():
    """Predictive Maintenance AI Engine"""
    data = request.get_json() or {}
    instruments = data.get('instruments', [1, 2, 3])
    
    predictions = []
    components = ["Injector", "Column", "Detector", "Pump", "Autosampler"]
    
    for i, instrument_id in enumerate(instruments):
        component = components[i % len(components)]
        condition = random.choice(["Excellent", "Good", "Fair", "Poor"])
        
        # Calculate failure prediction based on condition
        if condition == "Poor":
            days_to_failure = random.randint(5, 15)
            confidence = random.uniform(0.85, 0.95)
        elif condition == "Fair":
            days_to_failure = random.randint(15, 45)
            confidence = random.uniform(0.75, 0.85)
        elif condition == "Good":
            days_to_failure = random.randint(45, 90)
            confidence = random.uniform(0.65, 0.75)
        else:  # Excellent
            days_to_failure = random.randint(90, 180)
            confidence = random.uniform(0.55, 0.65)
        
        failure_date = datetime.datetime.now() + datetime.timedelta(days=days_to_failure)
        
        predictions.append({
            "instrument_id": instrument_id,
            "component_type": component,
            "current_condition": condition,
            "predicted_failure_date": failure_date.isoformat(),
            "days_until_failure": days_to_failure,
            "confidence_level": round(confidence, 2),
            "recommended_actions": [
                f"Schedule {component.lower()} inspection",
                "Order replacement parts",
                "Plan maintenance window"
            ] if condition in ["Fair", "Poor"] else ["Continue monitoring"]
        })
    
    return jsonify(predictions)

@app.route("/ai/cost-optimization", methods=["POST"])
def cost_optimization():
    """Cost Optimization AI Engine"""
    data = request.get_json() or {}
    period = data.get('analysis_period', 'monthly')
    departments = data.get('departments', ['lab1', 'lab2'])
    
    # Generate realistic cost analysis
    base_cost = random.randint(15000, 35000)
    potential_savings = random.randint(1500, 5000)
    
    opportunities = [
        {
            "category": "Consumables Optimization",
            "current_cost": base_cost * 0.4,
            "potential_savings": potential_savings * 0.3,
            "implementation": "Bulk purchasing, supplier negotiation"
        },
        {
            "category": "Energy Efficiency",
            "current_cost": base_cost * 0.25,
            "potential_savings": potential_savings * 0.2,
            "implementation": "Equipment scheduling, power management"
        },
        {
            "category": "Maintenance Planning",
            "current_cost": base_cost * 0.35,
            "potential_savings": potential_savings * 0.5,
            "implementation": "Predictive maintenance, spare parts inventory"
        }
    ]
    
    return jsonify({
        "analysis_period": period,
        "departments_analyzed": departments,
        "current_cost": base_cost,
        "potential_savings": potential_savings,
        "savings_percentage": round((potential_savings / base_cost) * 100, 1),
        "optimization_opportunities": opportunities,
        "payback_period": f"{random.randint(3, 8)} months",
        "roi_estimate": f"{random.randint(150, 300)}%",
        "generated_at": datetime.datetime.now().isoformat()
    })

if __name__ == "__main__":
    print("🧪 IntelliLab GC AI Analytics API - Flask Edition")
    print("=" * 55)
    print(f"🚀 Starting Flask server on http://localhost:{PORT}")
    print("🤖 AI Engines: Method Optimization, Predictive Maintenance, Cost Analysis")
    print("\nPress Ctrl+C to stop the server\n")
    
    try:
        app.run(host='0.0.0.0', port=PORT, debug=False)
    except KeyboardInterrupt:
        print("\n🛑 AI Analytics API server stopped")