#!/usr/bin/env python3
"""
Comprehensive Test Runner for IntelliLab GC
Validates EVERY calculation and feature with expected results
"""

import pytest
import numpy as np
from fastapi.testclient import TestClient
from main import app
from database import SessionLocal, Base, engine
import json
from datetime import datetime
import logging
from typing import Dict, List, Any
import asyncio
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("IntelliLab_Test_Suite")

class GCTestValidator:
    """Comprehensive test suite for all GC calculations"""
    
    def __init__(self):
        self.client = TestClient(app)
        self.test_results = []
        self.failed_tests = []
        self.calculation_tolerances = {
            "split_ratio": 0.01,  # 1% tolerance
            "retention_time": 0.001,  # 0.1% tolerance
            "pressure": 0.1,  # 0.1 psi tolerance
            "temperature": 0.5,  # 0.5°C tolerance
            "flow_rate": 0.01,  # 0.01 mL/min tolerance
            "efficiency": 0.05,  # 5% tolerance
            "signal_to_noise": 0.1,  # 10% tolerance
            "detection_limit": 0.2,  # 20% tolerance (more variable)
        }
        
    def validate_calculation(self, 
                           endpoint: str, 
                           input_data: Dict,
                           expected_output: Dict,
                           calculation_name: str) -> Dict:
        """Validate a single calculation against expected results"""
        
        try:
            response = self.client.post(endpoint, json=input_data)
            
            if response.status_code != 200:
                return {
                    "test": calculation_name,
                    "status": "FAILED",
                    "error": f"HTTP {response.status_code}: {response.text}",
                    "input": input_data
                }
            
            actual_output = response.json()
            
            # Compare each expected field
            mismatches = []
            for key, expected_value in expected_output.items():
                if key not in actual_output:
                    mismatches.append(f"{key}: missing from output")
                    continue
                    
                actual_value = actual_output[key]
                
                # Determine tolerance based on field type
                if isinstance(expected_value, (int, float)):
                    tolerance = self.get_tolerance(key)
                    diff = abs(actual_value - expected_value)
                    relative_error = diff / expected_value if expected_value != 0 else diff
                    
                    if relative_error > tolerance:
                        mismatches.append(
                            f"{key}: expected {expected_value}, got {actual_value} "
                            f"(error: {relative_error*100:.2f}%)"
                        )
                elif expected_value != actual_value:
                    mismatches.append(f"{key}: expected '{expected_value}', got '{actual_value}'")
            
            if mismatches:
                return {
                    "test": calculation_name,
                    "status": "FAILED",
                    "mismatches": mismatches,
                    "input": input_data,
                    "expected": expected_output,
                    "actual": actual_output
                }
            
            return {
                "test": calculation_name,
                "status": "PASSED",
                "input": input_data,
                "output": actual_output
            }
            
        except Exception as e:
            return {
                "test": calculation_name,
                "status": "ERROR",
                "error": str(e),
                "traceback": traceback.format_exc(),
                "input": input_data
            }
    
    def get_tolerance(self, field_name: str) -> float:
        """Get appropriate tolerance for field type"""
        field_lower = field_name.lower()
        for key, tol in self.calculation_tolerances.items():
            if key in field_lower:
                return tol
        return 0.05  # Default 5% tolerance


class TestInletSimulations:
    """Test all inlet simulation calculations"""
    
    def test_split_injection_calculations(self):
        validator = GCTestValidator()
        
        test_cases = [
            {
                "name": "Standard 50:1 split injection",
                "input": {
                    "inlet_temp": 250.0,
                    "split_ratio": 50.0,
                    "injection_volume": 1.0,
                    "liner_type": "Split Liner",
                    "injection_mode": "Split",
                    "carrier_gas": "Helium",
                    "carrier_flow_rate": 1.2,
                    "septum_purge": 3.0,
                    "instrument_age": 5.0,
                    "maintenance_level": "Good",
                    "vacuum_integrity": 95.0,
                    "septum_condition": "Good",
                    "liner_condition": "Clean",
                    "purge_flow": 3.0,
                    "matrix_type": "Light Hydrocarbon",
                    "is_calibrated": False
                },
                "expected": {
                    "transfer_efficiency": 75.0,  # Expected efficiency range
                    "discrimination_factor": 1.05,  # Expected discrimination
                    "peak_shape_index": 0.95,  # Expected peak shape
                }
            },
            {
                "name": "Splitless injection for trace analysis",
                "input": {
                    "inlet_temp": 280.0,
                    "split_ratio": 1.0,  # Effectively splitless
                    "injection_volume": 2.0,
                    "liner_type": "Splitless Liner",
                    "injection_mode": "Splitless",
                    "carrier_gas": "Helium",
                    "carrier_flow_rate": 1.0,
                    "septum_purge": 3.0,
                    "instrument_age": 3.0,
                    "maintenance_level": "Excellent",
                    "vacuum_integrity": 98.0,
                    "septum_condition": "New",
                    "liner_condition": "Clean",
                    "purge_flow": 3.0,
                    "matrix_type": "Aqueous",
                    "is_calibrated": True,
                    "calibration_data": {"discrimination_ratio": 0.98}
                },
                "expected": {
                    "transfer_efficiency": 90.0,  # Higher efficiency for splitless
                    "discrimination_factor": 0.98,  # Less discrimination
                    "peak_shape_index": 0.92,  # Good peak shape
                }
            },
            {
                "name": "High split ratio for concentrated samples",
                "input": {
                    "inlet_temp": 300.0,
                    "split_ratio": 200.0,
                    "injection_volume": 0.5,
                    "liner_type": "Split Liner",
                    "injection_mode": "Split",
                    "carrier_gas": "Hydrogen",
                    "carrier_flow_rate": 2.0,
                    "septum_purge": 3.0,
                    "instrument_age": 10.0,
                    "maintenance_level": "Fair",
                    "vacuum_integrity": 85.0,
                    "septum_condition": "Worn",
                    "liner_condition": "Lightly Contaminated",
                    "purge_flow": 3.0,
                    "matrix_type": "Heavy Hydrocarbon",
                    "is_calibrated": False
                },
                "expected": {
                    "transfer_efficiency": 45.0,  # Lower due to high split
                    "discrimination_factor": 1.2,  # More discrimination
                    "peak_shape_index": 0.85,  # Degraded conditions
                }
            }
        ]
        
        results = []
        for test in test_cases:
            result = validator.validate_calculation(
                "/api/v1/calculations/inlet-simulator",
                test["input"],
                test["expected"],
                test["name"]
            )
            results.append(result)
            
        return results

    def test_extreme_conditions(self):
        """Test inlet simulation with extreme conditions"""
        validator = GCTestValidator()
        
        extreme_cases = [
            {
                "name": "Maximum temperature and split ratio",
                "input": {
                    "inlet_temp": 400.0,  # Maximum
                    "split_ratio": 1000.0,  # Maximum
                    "injection_volume": 0.1,  # Minimum
                    "liner_type": "Split Liner",
                    "injection_mode": "Split",
                    "carrier_gas": "Nitrogen",
                    "carrier_flow_rate": 0.5,
                    "septum_purge": 1.0,
                    "instrument_age": 50.0,  # Very old
                    "maintenance_level": "Neglected",
                    "vacuum_integrity": 50.0,  # Poor vacuum
                    "septum_condition": "Badly Damaged",
                    "liner_condition": "Heavily Contaminated",
                    "purge_flow": 1.0,
                    "matrix_type": "Complex Matrix",
                    "is_calibrated": False
                },
                "expected": {
                    "transfer_efficiency": 15.0,  # Very low efficiency
                    "discrimination_factor": 2.0,  # High discrimination
                    "peak_shape_index": 0.5,  # Poor peak shape
                }
            }
        ]
        
        results = []
        for test in extreme_cases:
            result = validator.validate_calculation(
                "/api/v1/calculations/inlet-simulator",
                test["input"],
                test["expected"],
                test["name"]
            )
            results.append(result)
            
        return results


class TestDetectionLimits:
    """Test detection limit calculations"""
    
    def test_fid_detection_limits(self):
        validator = GCTestValidator()
        
        test_cases = [
            {
                "name": "FID optimal conditions",
                "input": {
                    "detector_type": "FID",
                    "carrier_gas": "Helium",
                    "column_type": "DB-1",
                    "injector_temp": 280.0,
                    "detector_temp": 280.0,
                    "oven_temp": 100.0,
                    "flow_rate": 2.0,
                    "split_ratio": 10.0,
                    "h2_flow": 30.0,
                    "air_flow": 300.0,
                    "makeup_flow": 25.0,
                    "injection_volume": 1.0,
                    "sample_concentration": 100.0,
                    "target_compound": "n-Octane",
                    "instrument_age": 2.0,
                    "maintenance_level": "Excellent",
                    "detector_calibration": "Good",
                    "column_condition": "New",
                    "noise_level": "Low",
                    "sample_matrix": "Clean Solvent",
                    "analysis_type": "Quantitative"
                },
                "expected": {
                    "detection_limit": 0.5,  # pg (picograms)
                    "signal_to_noise": 3.0,  # 3:1 ratio
                    "confidence_level": 95.0,  # 95% confidence
                }
            },
            {
                "name": "FID with poor conditions",
                "input": {
                    "detector_type": "FID",
                    "carrier_gas": "Nitrogen",
                    "column_type": "DB-5",
                    "injector_temp": 200.0,  # Low temperature
                    "detector_temp": 200.0,  # Low temperature
                    "oven_temp": 150.0,
                    "flow_rate": 0.8,  # Low flow
                    "split_ratio": 100.0,  # High split
                    "h2_flow": 20.0,  # Low H2
                    "air_flow": 200.0,  # Low air
                    "makeup_flow": 10.0,
                    "injection_volume": 0.5,
                    "sample_concentration": 10.0,
                    "target_compound": "Benzene",
                    "instrument_age": 20.0,  # Old instrument
                    "maintenance_level": "Poor",
                    "detector_calibration": "Worn",
                    "column_condition": "Contaminated",
                    "noise_level": "High",
                    "sample_matrix": "Complex Matrix",
                    "analysis_type": "Screening"
                },
                "expected": {
                    "detection_limit": 50.0,  # Much higher LOD
                    "signal_to_noise": 1.5,  # Poor S/N
                    "confidence_level": 70.0,  # Lower confidence
                }
            }
        ]
        
        results = []
        for test in test_cases:
            result = validator.validate_calculation(
                "/api/v1/calculations/detection-limit",
                test["input"],
                test["expected"],
                test["name"]
            )
            results.append(result)
            
        return results

    def test_different_detectors(self):
        """Test detection limits for different detector types"""
        validator = GCTestValidator()
        
        detector_cases = [
            {
                "name": "TCD detection limits",
                "input": {
                    "detector_type": "TCD",
                    "carrier_gas": "Helium",
                    "column_type": "Porapak Q",
                    "injector_temp": 150.0,
                    "detector_temp": 150.0,
                    "oven_temp": 80.0,
                    "flow_rate": 3.0,
                    "split_ratio": 1.0,  # No split for TCD
                    "h2_flow": 0.0,  # No H2 for TCD
                    "air_flow": 0.0,  # No air for TCD
                    "makeup_flow": 5.0,
                    "injection_volume": 5.0,  # Larger volume for TCD
                    "sample_concentration": 1000.0,
                    "target_compound": "Methane",
                    "instrument_age": 5.0,
                    "maintenance_level": "Good",
                    "detector_calibration": "Good",
                    "column_condition": "Good",
                    "noise_level": "Medium",
                    "sample_matrix": "Gas Sample",
                    "analysis_type": "Quantitative"
                },
                "expected": {
                    "detection_limit": 100.0,  # ng (nanograms) - TCD less sensitive
                    "signal_to_noise": 3.0,
                    "confidence_level": 90.0,
                }
            },
            {
                "name": "MS detection limits",
                "input": {
                    "detector_type": "MS",
                    "carrier_gas": "Helium",
                    "column_type": "DB-5ms",
                    "injector_temp": 280.0,
                    "detector_temp": 280.0,
                    "oven_temp": 100.0,
                    "flow_rate": 1.0,
                    "split_ratio": 20.0,
                    "h2_flow": 0.0,  # No H2 for MS
                    "air_flow": 0.0,  # No air for MS
                    "makeup_flow": 0.0,  # No makeup for MS
                    "injection_volume": 1.0,
                    "sample_concentration": 10.0,
                    "target_compound": "Caffeine",
                    "instrument_age": 3.0,
                    "maintenance_level": "Excellent",
                    "detector_calibration": "Good",
                    "column_condition": "New",
                    "noise_level": "Very Low",
                    "sample_matrix": "Biological",
                    "analysis_type": "Trace Analysis"
                },
                "expected": {
                    "detection_limit": 0.1,  # fg (femtograms) - MS very sensitive
                    "signal_to_noise": 10.0,  # Better S/N
                    "confidence_level": 99.0,  # High confidence
                }
            }
        ]
        
        results = []
        for test in detector_cases:
            result = validator.validate_calculation(
                "/api/v1/calculations/detection-limit",
                test["input"],
                test["expected"],
                test["name"]
            )
            results.append(result)
            
        return results


class TestColumnCalculations:
    """Test column parameter calculations"""
    
    def test_van_deemter_optimization(self):
        validator = GCTestValidator()
        
        test_cases = [
            {
                "name": "30m x 0.25mm column optimization",
                "input": {
                    "length_m": 30.0,
                    "id_mm": 0.25,
                    "flow_ml_min": 1.2,
                    "temperature_c": 100.0,
                    "carrier_gas": "Helium",
                    "outlet_pressure_psi": 14.7
                },
                "expected": {
                    "void_time_min": 1.02,  # Calculated from column volume
                    "linear_velocity_cm_s": 49.0,
                    "optimal_flow_ml_min": 1.35,  # Van Deemter optimum
                    "current_plates": 95000,  # Approximate
                    "optimal_plates": 110000,  # Better at optimum
                    "efficiency_percent": 86.4,  # Current vs optimal
                }
            },
            {
                "name": "60m x 0.32mm column optimization",
                "input": {
                    "length_m": 60.0,
                    "id_mm": 0.32,
                    "flow_ml_min": 2.0,
                    "temperature_c": 150.0,
                    "carrier_gas": "Hydrogen",
                    "outlet_pressure_psi": 14.7
                },
                "expected": {
                    "void_time_min": 1.95,  # Longer column
                    "linear_velocity_cm_s": 51.3,
                    "optimal_flow_ml_min": 2.8,  # Higher for larger ID
                    "current_plates": 180000,  # More plates
                    "optimal_plates": 220000,
                    "efficiency_percent": 81.8,
                }
            }
        ]
        
        results = []
        for test in test_cases:
            result = validator.validate_calculation(
                "/api/v1/calculations/column-parameters",
                test["input"],
                test["expected"],
                test["name"]
            )
            results.append(result)
            
        return results


class TestPressureCalculations:
    """Test pressure drop calculations"""
    
    def test_capillary_pressure_drop(self):
        validator = GCTestValidator()
        
        test_cases = [
            {
                "name": "Standard 30m capillary pressure drop",
                "input": {
                    "length_m": 30.0,
                    "id_mm": 0.25,
                    "flow_ml_min": 1.2,
                    "temperature_c": 100.0,
                    "carrier_gas": "Helium"
                },
                "expected": {
                    "pressure_drop_psi": 24.5,  # Calculated from Hagen-Poiseuille
                    "inlet_pressure_required_psi": 39.2,  # 14.7 + drop
                    "viscosity_micropoise": 230.0,  # Helium at 100°C
                    "safe": True,
                    "max_recommended_psi": 100.0,
                }
            },
            {
                "name": "High pressure narrow column",
                "input": {
                    "length_m": 60.0,
                    "id_mm": 0.1,  # Very narrow
                    "flow_ml_min": 0.5,
                    "temperature_c": 200.0,
                    "carrier_gas": "Nitrogen"
                },
                "expected": {
                    "pressure_drop_psi": 180.0,  # High pressure drop
                    "inlet_pressure_required_psi": 194.7,
                    "viscosity_micropoise": 280.0,  # Nitrogen at 200°C
                    "safe": False,  # Exceeds safe limits
                    "max_recommended_psi": 100.0,
                    "warning": "Pressure exceeds safe operating limits"
                }
            }
        ]
        
        results = []
        for test in test_cases:
            result = validator.validate_calculation(
                "/api/v1/calculations/pressure-drop",
                test["input"],
                test["expected"],
                test["name"]
            )
            results.append(result)
            
        return results


class TestOvenRampCalculations:
    """Test oven temperature program calculations"""
    
    def test_standard_ramp_programs(self):
        validator = GCTestValidator()
        
        test_cases = [
            {
                "name": "Standard hydrocarbon ramp",
                "input": {
                    "initial_temp": 50.0,
                    "initial_hold": 2.0,
                    "ramp_rate_1": 10.0,
                    "final_temp_1": 200.0,
                    "hold_time_1": 5.0,
                    "ramp_rate_2": 20.0,
                    "final_temp_2": 300.0,
                    "final_hold": 10.0,
                    "instrument_age": 5.0,
                    "maintenance_level": "Good",
                    "oven_calibration": "Good",
                    "column_condition": "Good",
                    "heating_rate_limit": 50.0,
                    "compound_class": "Hydrocarbons",
                    "volatility_range": "C6-C20",
                    "sample_complexity": "Medium"
                },
                "expected": {
                    "total_runtime_min": 37.0,  # 2 + 15 + 5 + 5 + 10
                    "temperature_accuracy": 0.5,  # Expected accuracy
                    "ramp_linearity": 99.0,  # Linearity percentage
                    "optimization_score": 85.0,  # Overall score
                }
            }
        ]
        
        results = []
        for test in test_cases:
            result = validator.validate_calculation(
                "/api/v1/calculations/oven-ramp",
                test["input"],
                test["expected"],
                test["name"]
            )
            results.append(result)
            
        return results


class TestSplitlessTimingCalculations:
    """Test splitless injection timing calculations"""
    
    def test_solvent_focusing_calculations(self):
        validator = GCTestValidator()
        
        test_cases = [
            {
                "name": "Hexane splitless timing",
                "input": {
                    "solvent": "Hexane",
                    "column_temp_c": 50.0,
                    "inlet_temp_c": 280.0,
                    "liner_volume_ul": 800.0,
                    "column_flow_ml_min": 1.2
                },
                "expected": {
                    "recommended_splitless_time_s": 45.0,  # Calculated timing
                    "vapor_volume_ml_per_ul": 0.65,  # Hexane expansion
                    "total_sweep_volume_ml": 0.9,  # Volume to sweep
                    "solvent_focusing": True,  # Should focus
                    "focusing_assessment": "Good focusing conditions",
                }
            },
            {
                "name": "Methanol splitless timing",
                "input": {
                    "solvent": "Methanol",
                    "column_temp_c": 40.0,
                    "inlet_temp_c": 250.0,
                    "liner_volume_ul": 1000.0,
                    "column_flow_ml_min": 1.0
                },
                "expected": {
                    "recommended_splitless_time_s": 60.0,  # Longer for methanol
                    "vapor_volume_ml_per_ul": 0.45,  # Methanol expansion
                    "total_sweep_volume_ml": 1.0,
                    "solvent_focusing": True,
                    "focusing_assessment": "Excellent focusing conditions",
                }
            }
        ]
        
        results = []
        for test in test_cases:
            result = validator.validate_calculation(
                "/api/v1/calculations/splitless-timing",
                test["input"],
                test["expected"],
                test["name"]
            )
            results.append(result)
            
        return results


def run_all_calculation_tests():
    """Run all calculation tests and return results"""
    print("🔬 Starting IntelliLab GC Calculation Tests...")
    
    all_results = []
    
    # Test inlet simulations
    print("\n📊 Testing inlet simulations...")
    inlet_tests = TestInletSimulations()
    all_results.extend(inlet_tests.test_split_injection_calculations())
    all_results.extend(inlet_tests.test_extreme_conditions())
    
    # Test detection limits
    print("\n🎯 Testing detection limits...")
    detection_tests = TestDetectionLimits()
    all_results.extend(detection_tests.test_fid_detection_limits())
    all_results.extend(detection_tests.test_different_detectors())
    
    # Test column calculations
    print("\n🧮 Testing column calculations...")
    column_tests = TestColumnCalculations()
    all_results.extend(column_tests.test_van_deemter_optimization())
    
    # Test pressure calculations
    print("\n💨 Testing pressure calculations...")
    pressure_tests = TestPressureCalculations()
    all_results.extend(pressure_tests.test_capillary_pressure_drop())
    
    # Test oven ramp calculations
    print("\n🌡️ Testing oven ramp calculations...")
    oven_tests = TestOvenRampCalculations()
    all_results.extend(oven_tests.test_standard_ramp_programs())
    
    # Test splitless timing calculations
    print("\n⏱️ Testing splitless timing calculations...")
    splitless_tests = TestSplitlessTimingCalculations()
    all_results.extend(splitless_tests.test_solvent_focusing_calculations())
    
    # Calculate summary statistics
    total_tests = len(all_results)
    passed_tests = sum(1 for result in all_results if result["status"] == "PASSED")
    failed_tests = sum(1 for result in all_results if result["status"] == "FAILED")
    error_tests = sum(1 for result in all_results if result["status"] == "ERROR")
    
    summary = {
        "total": total_tests,
        "passed": passed_tests,
        "failed": failed_tests,
        "errors": error_tests,
        "pass_rate": (passed_tests / total_tests * 100) if total_tests > 0 else 0
    }
    
    print(f"\n📋 Test Summary:")
    print(f"   Total: {summary['total']}")
    print(f"   Passed: {summary['passed']}")
    print(f"   Failed: {summary['failed']}")
    print(f"   Errors: {summary['errors']}")
    print(f"   Pass Rate: {summary['pass_rate']:.1f}%")
    
    # Print failed tests for debugging
    if failed_tests > 0 or error_tests > 0:
        print(f"\n❌ Failed/Error Tests:")
        for result in all_results:
            if result["status"] in ["FAILED", "ERROR"]:
                print(f"   • {result['test']}: {result.get('error', 'Check mismatches')}")
    
    return {
        "summary": summary,
        "results": all_results,
        "timestamp": datetime.now().isoformat()
    }


if __name__ == "__main__":
    results = run_all_calculation_tests()
    
    # Save results to file
    with open("calculation_test_results.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"\n✅ Test results saved to calculation_test_results.json")
    
    # Exit with error code if tests failed
    if results["summary"]["failed"] > 0 or results["summary"]["errors"] > 0:
        exit(1)
    else:
        print("🎉 All calculation tests passed!")
        exit(0)
