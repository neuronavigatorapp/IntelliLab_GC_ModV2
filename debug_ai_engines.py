#!/usr/bin/env python3
"""
Quick test script to debug AI engine issues
"""

import sys
import json
import traceback

def test_method_optimization():
    """Test the method optimization engine directly"""
    try:
        # Import the enterprise AI analytics
        sys.path.append('.')
        from ai_analytics_enterprise import app, MethodOptimizationInput, method_optimizer
        
        # Test data with correct field names
        test_data = {
            "compound_name": "caffeine",
            "method_type": "GC-MS",
            "current_parameters": {
                "temperature": 280,
                "flow_rate": 1.2,
                "injection_volume": 1.0
            },
            "target_metrics": {
                "resolution": 2.0,
                "sensitivity": 1000
            },
            "constraints": {
                "max_time": 30,
                "min_resolution": 1.5,
                "max_temperature": 350
            }
        }
        
        print("Testing method optimization engine...")
        
        # Validate input
        try:
            input_validator = MethodOptimizationInput(**test_data)
            print("✓ Input validation passed")
        except Exception as e:
            print(f"✗ Input validation failed: {e}")
            return False
        
        # Test optimization
        try:
            result = method_optimizer.optimize_method(input_validator)
            print("✓ Method optimization successful")
            print(f"Result keys: {list(result.keys()) if isinstance(result, dict) else 'Not dict'}")
            return True
        except Exception as e:
            print(f"✗ Method optimization failed: {e}")
            print(f"Traceback: {traceback.format_exc()}")
            return False
            
    except Exception as e:
        print(f"✗ Import or setup failed: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return False

def test_predictive_maintenance():
    """Test the predictive maintenance engine"""
    try:
        from predictive_maintenance_enterprise import EnterprisePredictiveMaintenance
        
        maintenance_engine = EnterprisePredictiveMaintenance()
        
        test_data = {
            "instrument_ids": [1, 2],
            "timeframe_days": 90,
            "include_sensors": True,
            "maintenance_history": {
                1: [{"date": "2024-01-15", "type": "routine", "cost": 500}],
                2: [{"date": "2024-02-20", "type": "preventive", "cost": 800}]
            }
        }
        
        print("Testing predictive maintenance engine...")
        
        # Import validation class
        from ai_analytics_enterprise import MaintenanceInput
        
        # Create validation object
        try:
            input_validator = MaintenanceInput(**test_data)
            print("✓ Maintenance input validation passed")
        except Exception as e:
            print(f"✗ Maintenance input validation failed: {e}")
            return False
        
        try:
            result = maintenance_engine.predict_maintenance(input_validator)
            print("✓ Predictive maintenance successful")
            print(f"Result keys: {list(result.keys()) if isinstance(result, dict) else 'Not dict'}")
            return True
        except Exception as e:
            print(f"✗ Predictive maintenance failed: {e}")
            print(f"Traceback: {traceback.format_exc()}")
            return False
            
    except Exception as e:
        print(f"✗ Import failed: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return False

def test_cost_optimization():
    """Test the cost optimization engine"""
    try:
        from cost_optimization_enterprise import EnterpriseCostOptimization
        
        cost_engine = EnterpriseCostOptimization()
        
        test_data = {
            "analysis_period": "yearly",
            "departments": ["analytical_lab", "quality_control"],
            "cost_categories": ["consumables", "maintenance", "labor", "utilities"],
            "budget_constraints": {
                "total_budget": 250000,
                "max_increase": 0.1
            },
            "optimization_goals": ["reduce_costs", "improve_efficiency"]
        }
        
        print("Testing cost optimization engine...")
        
        # Import validation class
        from ai_analytics_enterprise import CostOptimizationInput
        
        # Create validation object
        try:
            input_validator = CostOptimizationInput(**test_data)
            print("✓ Cost input validation passed")
        except Exception as e:
            print(f"✗ Cost input validation failed: {e}")
            return False
        
        try:
            result = cost_engine.optimize_costs(input_validator)
            print("✓ Cost optimization successful")
            print(f"Result keys: {list(result.keys()) if isinstance(result, dict) else 'Not dict'}")
            return True
        except Exception as e:
            print(f"✗ Cost optimization failed: {e}")
            print(f"Traceback: {traceback.format_exc()}")
            return False
            
    except Exception as e:
        print(f"✗ Import failed: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("AI ENGINE DEBUG TEST")
    print("=" * 60)
    
    results = []
    results.append(test_method_optimization())
    results.append(test_predictive_maintenance()) 
    results.append(test_cost_optimization())
    
    print("\n" + "=" * 60)
    print("RESULTS")
    print("=" * 60)
    print(f"Method Optimization: {'PASS' if results[0] else 'FAIL'}")
    print(f"Predictive Maintenance: {'PASS' if results[1] else 'FAIL'}")
    print(f"Cost Optimization: {'PASS' if results[2] else 'FAIL'}")
    print(f"Overall: {sum(results)}/3 engines working")
    
    if sum(results) == 3:
        print("✓ All AI engines are working correctly")
    else:
        print("✗ Some AI engines have issues - check errors above")