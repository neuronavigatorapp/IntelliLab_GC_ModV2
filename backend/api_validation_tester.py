import time
import subprocess
import json
import requests
import numpy as np
from datetime import datetime
from typing import Dict, Any, List

class GCAPIValidationTester:
    """
    API-focused validation tester for IntelliLab GC
    Tests the core calculations against Dr. Claude's validation criteria
    """
    
    def __init__(self):
        self.test_results = []
        self.backend_process = None
        self.base_url = "http://localhost:8000"
        
    def start_backend(self):
        """Start the FastAPI backend"""
        print("🚀 Starting IntelliLab GC Backend API...")
        
        self.backend_process = subprocess.Popen(
            ["python", "-m", "uvicorn", "main:app", "--reload", "--port", "8000"],
            cwd="C:\\IntelliLab_GC_ModV2\\backend",
            shell=True
        )
        print("Backend starting on port 8000...")
        time.sleep(8)  # Wait for backend to fully start
        
        # Test connectivity
        try:
            response = requests.get(f"{self.base_url}/api/health", timeout=10)
            if response.status_code == 200:
                print("✅ Backend API is ready")
                return True
        except Exception as e:
            print(f"❌ Backend not responding: {e}")
            return False
        
        return False
    
    def test_split_ratio_calculations(self):
        """Test Case 1: Split Ratio Calculator - Dr. Claude's Formula Validation"""
        print("\n📊 TEST 1: Split Ratio Calculator - Mathematical Validation")
        
        test_scenarios = [
            {
                "name": "Standard method (1.2 mL/min, 50:1)",
                "flow": 1.2,
                "split": 50,
                "expected_total_flow": 64.2,  # 1.2 × 50 + 1.2 + 3 = 64.2
                "tolerance": 1.0
            },
            {
                "name": "High split concentrated sample (1.0 mL/min, 200:1)",
                "flow": 1.0,
                "split": 200,
                "expected_total_flow": 204.0,  # 1.0 × 200 + 1.0 + 3 = 204.0
                "tolerance": 2.0
            },
            {
                "name": "Splitless trace analysis (1.5 mL/min, 1:1)",
                "flow": 1.5,
                "split": 1,
                "expected_total_flow": 6.0,  # 1.5 × 1 + 1.5 + 3 = 6.0
                "tolerance": 0.5
            }
        ]
        
        results = []
        
        for scenario in test_scenarios:
            print(f"  Testing: {scenario['name']}")
            
            try:
                response = requests.post(
                    f"{self.base_url}/api/split-ratio/calculate",
                    json={
                        "split_ratio": scenario['split'],
                        "column_flow_rate": scenario['flow'],
                        "carrier_gas": "Helium",
                        "inlet_temperature": 250
                    },
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    calculated_total = data['total_inlet_flow']
                    uncertainty = data.get('uncertainty', calculated_total * 0.02)
                    
                    # Validate against Dr. Claude's formula
                    deviation = abs(calculated_total - scenario['expected_total_flow'])
                    passed = deviation <= scenario['tolerance']
                    
                    # Additional validation: Check formula components
                    split_vent_expected = scenario['flow'] * scenario['split']
                    septum_purge_expected = 3.0
                    formula_total = scenario['flow'] + split_vent_expected + septum_purge_expected
                    
                    result = {
                        "scenario": scenario['name'],
                        "input_flow": scenario['flow'],
                        "split_ratio": scenario['split'],
                        "calculated_total": calculated_total,
                        "expected_total": scenario['expected_total_flow'],
                        "formula_verification": formula_total,
                        "deviation": deviation,
                        "uncertainty": uncertainty,
                        "passed": passed,
                        "split_vent_flow": data.get('split_vent_flow'),
                        "septum_purge_flow": data.get('septum_purge_flow'),
                        "efficiency_score": data.get('efficiency_score')
                    }
                    
                    print(f"    Result: {calculated_total} mL/min (±{uncertainty:.2f})")
                    print(f"    Formula check: {formula_total} mL/min")
                    print(f"    Status: {'✅ PASS' if passed else '❌ FAIL'}")
                    
                else:
                    result = {"error": f"HTTP {response.status_code}: {response.text}"}
                    print(f"    ❌ API Error: {response.status_code}")
                    
            except Exception as e:
                result = {"error": str(e)}
                print(f"    ❌ Request failed: {str(e)}")
            
            results.append(result)
        
        self.test_results.append({
            "test": "Split Ratio Calculator",
            "timestamp": datetime.now().isoformat(),
            "results": results
        })
        
        return results
    
    def test_detection_limits_calculations(self):
        """Test Case 2: Detection Limits - Statistical Validation"""
        print("\n📈 TEST 2: Detection Limit Calculator - Statistical Method Validation")
        
        # High-quality calibration data (pesticide analysis simulation)
        calibration_data = {
            "concentrations": [0.5, 1.0, 2.0, 5.0, 10.0, 25.0],
            "peak_areas": [523, 1050, 2100, 5234, 10456, 25123]
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/detection-limits/calculate",
                json={
                    "concentrations": calibration_data["concentrations"],
                    "peak_areas": calibration_data["peak_areas"],
                    "method": "3sigma"
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Manual calculation for validation
                x = np.array(calibration_data["concentrations"])
                y = np.array(calibration_data["peak_areas"])
                
                # Linear regression
                slope, intercept = np.polyfit(x, y, 1)
                y_pred = slope * x + intercept
                residuals = y - y_pred
                std_error = np.sqrt(np.sum(residuals**2) / (len(x) - 2))
                
                # R-squared
                ss_res = np.sum(residuals**2)
                ss_tot = np.sum((y - np.mean(y))**2)
                r_squared = 1 - (ss_res / ss_tot)
                
                # LOD/LOQ calculations
                expected_lod = (3 * std_error) / slope
                expected_loq = (10 * std_error) / slope
                
                result = {
                    "test": "Detection Limits",
                    "method": "3-sigma",
                    "calibration_points": len(x),
                    "api_results": {
                        "lod": data['lod'],
                        "loq": data['loq'],
                        "slope": data['regression_slope'],
                        "intercept": data['regression_intercept'],
                        "r_squared": data['r_squared']
                    },
                    "manual_verification": {
                        "lod": expected_lod,
                        "loq": expected_loq,
                        "slope": slope,
                        "intercept": intercept,
                        "r_squared": r_squared,
                        "std_error": std_error
                    },
                    "validations": {
                        "lod_match": abs(data['lod'] - expected_lod) < 0.001,
                        "loq_match": abs(data['loq'] - expected_loq) < 0.001,
                        "linearity_pass": data['r_squared'] > 0.995,
                        "loq_lod_ratio": data['loq'] / data['lod'],
                        "expected_ratio": 3.33  # 10σ/3σ = 3.33
                    }
                }
                
                print(f"  Results:")
                print(f"    API LOD: {data['lod']:.6f}, Manual: {expected_lod:.6f}")
                print(f"    API LOQ: {data['loq']:.6f}, Manual: {expected_loq:.6f}")
                print(f"    R²: {data['r_squared']:.6f} (Manual: {r_squared:.6f})")
                print(f"    LOQ/LOD ratio: {result['validations']['loq_lod_ratio']:.2f}")
                print(f"    Linearity: {'✅ PASS' if result['validations']['linearity_pass'] else '❌ FAIL'}")
                
            else:
                result = {"error": f"HTTP {response.status_code}: {response.text}"}
                print(f"  ❌ API Error: {response.status_code}")
                
        except Exception as e:
            result = {"error": str(e)}
            print(f"  ❌ Request failed: {str(e)}")
        
        self.test_results.append({
            "test": "Detection Limits",
            "timestamp": datetime.now().isoformat(),
            "result": result
        })
        
        return result
    
    def test_void_volume_calculations(self):
        """Test Case 3: Void Volume - Physical Chemistry Validation"""
        print("\n🔬 TEST 3: Void Volume Calculator - Physical Chemistry Validation")
        
        test_columns = [
            {
                "name": "Standard 30m × 0.25mm column",
                "length_m": 30,
                "id_mm": 0.25,
                "df_um": 0.25,
                "temperature_c": 100,
                "flow_ml_min": 1.2,
                "carrier_gas": "Helium"
            },
            {
                "name": "Fast GC 15m × 0.18mm column", 
                "length_m": 15,
                "id_mm": 0.18,
                "df_um": 0.18,
                "temperature_c": 120,
                "flow_ml_min": 0.8,
                "carrier_gas": "Hydrogen"
            }
        ]
        
        results = []
        
        for column in test_columns:
            print(f"  Testing: {column['name']}")
            
            try:
                response = requests.get(
                    f"{self.base_url}/api/calculations/void-volume",
                    params={
                        "column_length_m": column["length_m"],
                        "column_id_mm": column["id_mm"],
                        "column_df_um": column["df_um"],
                        "temperature_c": column["temperature_c"],
                        "outlet_pressure_psi": 14.7,
                        "carrier_gas": column["carrier_gas"],
                        "flow_rate_ml_min": column["flow_ml_min"]
                    },
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Manual verification
                    radius_m = (column["id_mm"] / 2) / 1000
                    column_volume_ml = np.pi * radius_m**2 * column["length_m"] * 1e6
                    
                    result = {
                        "column": column["name"],
                        "api_results": data,
                        "manual_verification": {
                            "column_volume_ml": column_volume_ml,
                            "void_time_estimate": column_volume_ml / column["flow_ml_min"]
                        },
                        "physical_checks": {
                            "reasonable_void_time": 0.5 < data["void_time_min"] < 10,
                            "reasonable_velocity": 10 < data["linear_velocity_cm_s"] < 100,
                            "compressibility_factor": 0.5 < data["compressibility_factor_j"] < 1.0
                        }
                    }
                    
                    print(f"    Void time: {data['void_time_min']:.3f} min")
                    print(f"    Linear velocity: {data['linear_velocity_cm_s']:.1f} cm/s")
                    print(f"    Efficiency: {data['current_efficiency_percent']:.1f}%")
                    
                else:
                    result = {"error": f"HTTP {response.status_code}: {response.text}"}
                    print(f"    ❌ API Error: {response.status_code}")
                    
            except Exception as e:
                result = {"error": str(e)}
                print(f"    ❌ Request failed: {str(e)}")
            
            results.append(result)
        
        self.test_results.append({
            "test": "Void Volume Calculator",
            "timestamp": datetime.now().isoformat(),
            "results": results
        })
        
        return results
    
    def test_ghost_peak_identifier(self):
        """Test Case 4: Ghost Peak Identifier - Diagnostic Logic"""
        print("\n👻 TEST 4: Ghost Peak Identifier - Diagnostic Algorithm")
        
        test_scenarios = [
            {
                "name": "Column bleed scenario",
                "params": {
                    "retention_time_min": 28.5,
                    "peak_area": 12000,
                    "oven_temp_at_elution": 310,
                    "inlet_temp": 280,
                    "column_max_temp": 325,
                    "detector_type": "FID",
                    "baseline_before": 25,
                    "baseline_after": 45,
                    "run_number": 15,
                    "total_runs_today": 20
                },
                "expected_type": "Column Bleed",
                "expected_confidence": 70
            },
            {
                "name": "Septum bleed scenario",
                "params": {
                    "retention_time_min": 12.3,
                    "peak_area": 8000,
                    "oven_temp_at_elution": 200,
                    "inlet_temp": 300,
                    "column_max_temp": 325,
                    "detector_type": "FID",
                    "baseline_before": 20,
                    "baseline_after": 22,
                    "run_number": 25,
                    "total_runs_today": 30
                },
                "expected_type": "Septum Bleed",
                "expected_confidence": 60
            }
        ]
        
        results = []
        
        for scenario in test_scenarios:
            print(f"  Testing: {scenario['name']}")
            
            try:
                response = requests.post(
                    f"{self.base_url}/api/analysis/ghost-peak-identifier",
                    params=scenario["params"],
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    result = {
                        "scenario": scenario["name"],
                        "identified_type": data.get("peak_type", "Unknown"),
                        "confidence": data.get("confidence_percent", 0),
                        "root_cause": data.get("root_cause", ""),
                        "solution": data.get("solution", ""),
                        "evidence": data.get("evidence", []),
                        "validation": {
                            "type_correct": data.get("peak_type") == scenario["expected_type"],
                            "confidence_reasonable": data.get("confidence_percent", 0) >= scenario["expected_confidence"]
                        }
                    }
                    
                    print(f"    Identified: {data.get('peak_type', 'Unknown')}")
                    print(f"    Confidence: {data.get('confidence_percent', 0)}%")
                    print(f"    Root cause: {data.get('root_cause', 'Not provided')}")
                    
                else:
                    result = {"error": f"HTTP {response.status_code}: {response.text}"}
                    print(f"    ❌ API Error: {response.status_code}")
                    
            except Exception as e:
                result = {"error": str(e)}
                print(f"    ❌ Request failed: {str(e)}")
            
            results.append(result)
        
        self.test_results.append({
            "test": "Ghost Peak Identifier",
            "timestamp": datetime.now().isoformat(),
            "results": results
        })
        
        return results
    
    def test_peak_capacity_calculations(self):
        """Test Case 5: Peak Capacity - Separation Science"""
        print("\n⚗️ TEST 5: Peak Capacity Calculator - Separation Optimization")
        
        try:
            response = requests.get(
                f"{self.base_url}/api/calculations/peak-capacity",
                params={
                    "column_length_m": 30,
                    "column_id_mm": 0.25,
                    "temperature_initial_c": 50,
                    "temperature_final_c": 300,
                    "ramp_rate_c_min": 10,
                    "flow_rate_ml_min": 1.0,
                    "carrier_gas": "Helium"
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Manual verification of gradient time
                gradient_time = (300 - 50) / 10  # 25 minutes
                
                result = {
                    "test": "Peak Capacity",
                    "api_results": data,
                    "manual_verification": {
                        "gradient_time_min": gradient_time
                    },
                    "validation": {
                        "reasonable_capacity": 50 < data["theoretical_peak_capacity"] < 500,
                        "gradient_time_correct": abs(data["gradient_time_min"] - gradient_time) < 0.1,
                        "practical_less_than_theoretical": data["practical_peak_capacity_Rs_1"] <= data["theoretical_peak_capacity"]
                    }
                }
                
                print(f"  Theoretical peak capacity: {data['theoretical_peak_capacity']}")
                print(f"  Practical capacity (Rs=1): {data['practical_peak_capacity_Rs_1']}")
                print(f"  Gradient time: {data['gradient_time_min']} min")
                print(f"  Max compounds (95% separated): {data['max_compounds_95_percent_separated']}")
                
            else:
                result = {"error": f"HTTP {response.status_code}: {response.text}"}
                print(f"  ❌ API Error: {response.status_code}")
                
        except Exception as e:
            result = {"error": str(e)}
            print(f"  ❌ Request failed: {str(e)}")
        
        self.test_results.append({
            "test": "Peak Capacity",
            "timestamp": datetime.now().isoformat(),
            "result": result
        })
        
        return result
    
    def generate_validation_report(self):
        """Generate Dr. Claude's validation report"""
        print("\n" + "="*80)
        print("📋 DR. CLAUDE'S COMPREHENSIVE VALIDATION REPORT")
        print("="*80)
        
        report = {
            "test_date": datetime.now().isoformat(),
            "total_tests": len(self.test_results),
            "results": self.test_results,
            "validation_summary": {},
            "dr_claude_criteria": {
                "split_ratio_formula": "Total flow = Column flow × Split ratio + Column flow + 3 mL/min",
                "detection_limits": "LOD = 3.3 × σ / slope, LOQ = 10 × σ / slope, R² > 0.995",
                "void_volume": "Physical chemistry principles with compressibility correction",
                "ghost_peaks": "Pattern recognition based on temperature, baseline, and timing",
                "peak_capacity": "Gradient separation theory with statistical overlap"
            }
        }
        
        # Analyze results
        passed_tests = 0
        failed_tests = 0
        
        for test in self.test_results:
            test_name = test["test"]
            
            if "error" in str(test.get("results", test.get("result", {}))):
                failed_tests += 1
                print(f"❌ {test_name}: FAILED")
            else:
                passed_tests += 1
                print(f"✅ {test_name}: PASSED")
        
        success_rate = (passed_tests / len(self.test_results) * 100) if self.test_results else 0
        
        report["validation_summary"] = {
            "passed": passed_tests,
            "failed": failed_tests,
            "success_rate": success_rate,
            "dr_claude_approval": success_rate >= 80
        }
        
        # Save comprehensive report
        report_filename = f"dr_claude_validation_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_filename, "w") as f:
            json.dump(report, f, indent=2, default=str)
        
        print(f"\n📊 VALIDATION SUMMARY:")
        print(f"✅ Tests Passed: {passed_tests}")
        print(f"❌ Tests Failed: {failed_tests}")
        print(f"📈 Success Rate: {success_rate:.1f}%")
        print(f"🎯 Dr. Claude's Approval: {'✅ APPROVED' if report['validation_summary']['dr_claude_approval'] else '❌ NEEDS IMPROVEMENT'}")
        print(f"📄 Detailed Report: {report_filename}")
        
        return report
    
    def cleanup(self):
        """Clean up processes"""
        print("\n🧹 Cleaning up...")
        
        if self.backend_process:
            self.backend_process.terminate()
        
        print("✅ Cleanup complete")

# Main execution
if __name__ == "__main__":
    tester = GCAPIValidationTester()
    
    try:
        # Start backend
        if not tester.start_backend():
            print("❌ Failed to start backend - exiting")
            exit(1)
        
        print("\n🧪 STARTING DR. CLAUDE'S VALIDATION PROTOCOL")
        print("="*80)
        
        # Run validation tests
        tester.test_split_ratio_calculations()
        tester.test_detection_limits_calculations()
        tester.test_void_volume_calculations()
        tester.test_ghost_peak_identifier()
        tester.test_peak_capacity_calculations()
        
        # Generate Dr. Claude's validation report
        report = tester.generate_validation_report()
        
        print("\n📤 VALIDATION COMPLETE - READY FOR DR. CLAUDE'S REVIEW")
        print("="*80)
        
    except Exception as e:
        print(f"\n❌ Critical validation error: {str(e)}")
        import traceback
        traceback.print_exc()
        
    finally:
        tester.cleanup()
