#!/usr/bin/env python3
"""
Stress Testing Framework for IntelliLab GC
Tests edge cases, extreme values, and high load conditions
"""

import asyncio
import aiohttp
import time
import random
import numpy as np
from typing import List, Dict, Any
import json
from datetime import datetime
import logging
import traceback
from concurrent.futures import ThreadPoolExecutor
import statistics

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("IntelliLab_Stress_Test")


class StressTester:
    """Comprehensive stress testing for the application"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.results = []
        self.performance_data = []
        
    async def test_edge_cases(self):
        """Test with extreme and edge case values that should be handled gracefully"""
        
        print("⚠️ Testing edge cases and boundary conditions...")
        
        edge_cases = [
            # Inlet Simulation Edge Cases
            {
                "endpoint": "/api/v1/calculations/inlet-simulator",
                "data": {
                    "inlet_temp": 50.0,  # Minimum temperature
                    "split_ratio": 1.0,  # Minimum split
                    "injection_volume": 0.1,  # Minimum volume
                    "liner_type": "Split Liner",
                    "injection_mode": "Split",
                    "carrier_gas": "Helium",
                    "carrier_flow_rate": 0.1,  # Minimum flow
                    "septum_purge": 0.0,  # No purge
                    "instrument_age": 0.0,  # Brand new
                    "maintenance_level": "Excellent",
                    "vacuum_integrity": 100.0,  # Perfect vacuum
                    "septum_condition": "New",
                    "liner_condition": "Clean",
                    "purge_flow": 0.0,
                    "matrix_type": "Light Hydrocarbon",
                    "is_calibrated": False
                },
                "description": "Minimum inlet simulation values",
                "should_succeed": True
            },
            {
                "endpoint": "/api/v1/calculations/inlet-simulator",
                "data": {
                    "inlet_temp": 400.0,  # Maximum temperature
                    "split_ratio": 1000.0,  # Maximum split
                    "injection_volume": 10.0,  # Maximum volume
                    "liner_type": "Split Liner",
                    "injection_mode": "Split",
                    "carrier_gas": "Nitrogen",
                    "carrier_flow_rate": 10.0,  # Maximum flow
                    "septum_purge": 10.0,  # Maximum purge
                    "instrument_age": 50.0,  # Very old
                    "maintenance_level": "Neglected",
                    "vacuum_integrity": 0.0,  # No vacuum
                    "septum_condition": "Badly Damaged",
                    "liner_condition": "Heavily Contaminated",
                    "purge_flow": 100.0,
                    "matrix_type": "Complex Matrix",
                    "is_calibrated": False
                },
                "description": "Maximum inlet simulation values",
                "should_succeed": True
            },
            
            # Detection Limit Edge Cases
            {
                "endpoint": "/api/v1/calculations/detection-limit",
                "data": {
                    "detector_type": "FID",
                    "carrier_gas": "Helium",
                    "column_type": "DB-1",
                    "injector_temp": 50.0,  # Minimum temperature
                    "detector_temp": 50.0,  # Minimum temperature
                    "oven_temp": 30.0,  # Minimum oven temp
                    "flow_rate": 0.5,  # Minimum flow
                    "split_ratio": 1.0,  # No split
                    "h2_flow": 0.0,  # No H2
                    "air_flow": 0.0,  # No air
                    "makeup_flow": 0.0,  # No makeup
                    "injection_volume": 0.1,  # Minimum volume
                    "sample_concentration": 0.1,  # Minimum concentration
                    "target_compound": "Test",
                    "instrument_age": 0.0,  # New instrument
                    "maintenance_level": "Excellent",
                    "detector_calibration": "Good",
                    "column_condition": "New",
                    "noise_level": "Very Low",
                    "sample_matrix": "Clean",
                    "analysis_type": "Test"
                },
                "description": "Minimum detection limit values",
                "should_succeed": True
            },
            {
                "endpoint": "/api/v1/calculations/detection-limit",
                "data": {
                    "detector_type": "TCD",
                    "carrier_gas": "Nitrogen",
                    "column_type": "Packed",
                    "injector_temp": 400.0,  # Maximum temperature
                    "detector_temp": 400.0,  # Maximum temperature
                    "oven_temp": 350.0,  # Maximum oven temp
                    "flow_rate": 10.0,  # Maximum flow
                    "split_ratio": 1000.0,  # Maximum split
                    "h2_flow": 100.0,  # Maximum H2
                    "air_flow": 1000.0,  # Maximum air
                    "makeup_flow": 100.0,  # Maximum makeup
                    "injection_volume": 10.0,  # Maximum volume
                    "sample_concentration": 10000.0,  # Maximum concentration
                    "target_compound": "VeryLongCompoundNameThatShouldStillWork",
                    "instrument_age": 50.0,  # Very old
                    "maintenance_level": "Neglected",
                    "detector_calibration": "Badly Damaged",
                    "column_condition": "Needs Replacement",
                    "noise_level": "Extremely High",
                    "sample_matrix": "Extremely Complex Matrix",
                    "analysis_type": "Emergency Analysis"
                },
                "description": "Maximum detection limit values",
                "should_succeed": True
            },
            
            # Column Parameter Edge Cases
            {
                "endpoint": "/api/v1/calculations/column-parameters",
                "data": {
                    "length_m": 1.0,  # Minimum length
                    "id_mm": 0.1,  # Minimum ID
                    "flow_ml_min": 0.1,  # Minimum flow
                    "temperature_c": 30.0,  # Minimum temperature
                    "carrier_gas": "Helium",
                    "outlet_pressure_psi": 10.0  # Minimum pressure
                },
                "description": "Minimum column parameter values",
                "should_succeed": True
            },
            {
                "endpoint": "/api/v1/calculations/column-parameters",
                "data": {
                    "length_m": 100.0,  # Maximum length
                    "id_mm": 5.0,  # Maximum ID
                    "flow_ml_min": 20.0,  # Maximum flow
                    "temperature_c": 400.0,  # Maximum temperature
                    "carrier_gas": "Nitrogen",
                    "outlet_pressure_psi": 50.0  # Maximum pressure
                },
                "description": "Maximum column parameter values",
                "should_succeed": True
            },
            
            # Pressure Drop Edge Cases
            {
                "endpoint": "/api/v1/calculations/pressure-drop",
                "data": {
                    "length_m": 100.0,  # Very long
                    "id_mm": 0.1,  # Very narrow
                    "flow_ml_min": 10.0,  # High flow
                    "temperature_c": 400.0,  # High temperature
                    "carrier_gas": "Nitrogen",
                    "particle_size_um": 500.0  # Large particles
                },
                "description": "High pressure drop conditions",
                "should_succeed": True  # Should succeed but warn
            },
            
            # Invalid/Malformed Data Tests
            {
                "endpoint": "/api/v1/calculations/inlet-simulator",
                "data": {
                    "inlet_temp": -100.0,  # Negative temperature
                    "split_ratio": 0.0,  # Zero split ratio
                    "injection_volume": 0.0,  # Zero volume
                    "liner_type": "",  # Empty string
                    "injection_mode": "InvalidMode",  # Invalid mode
                    "carrier_gas": "InvalidGas",  # Invalid gas
                    "carrier_flow_rate": -1.0,  # Negative flow
                    "septum_purge": -5.0,  # Negative purge
                    "instrument_age": -10.0,  # Negative age
                    "maintenance_level": "InvalidLevel",
                    "vacuum_integrity": 150.0,  # > 100%
                    "septum_condition": "InvalidCondition",
                    "liner_condition": "InvalidCondition",
                    "purge_flow": -10.0,
                    "matrix_type": "",
                    "is_calibrated": "not_boolean"  # Wrong type
                },
                "description": "Invalid inlet simulation data",
                "should_succeed": False  # Should return validation errors
            },
            
            # Extreme Numeric Values
            {
                "endpoint": "/api/v1/calculations/detection-limit",
                "data": {
                    "detector_type": "FID",
                    "carrier_gas": "Helium",
                    "column_type": "DB-1",
                    "injector_temp": 1e6,  # Extremely high
                    "detector_temp": 1e6,
                    "oven_temp": 1e6,
                    "flow_rate": 1e6,
                    "split_ratio": 1e6,
                    "h2_flow": 1e6,
                    "air_flow": 1e6,
                    "makeup_flow": 1e6,
                    "injection_volume": 1e6,
                    "sample_concentration": 1e6,
                    "target_compound": "Test",
                    "instrument_age": 1e6,
                    "maintenance_level": "Good",
                    "detector_calibration": "Good",
                    "column_condition": "Good",
                    "noise_level": "Low",
                    "sample_matrix": "Clean",
                    "analysis_type": "Test"
                },
                "description": "Extremely large numeric values",
                "should_succeed": False  # Should be rejected
            },
            
            # Unicode and Special Characters
            {
                "endpoint": "/api/v1/calculations/detection-limit",
                "data": {
                    "detector_type": "FID",
                    "carrier_gas": "Helium",
                    "column_type": "DB-1 🧪",  # Unicode emoji
                    "injector_temp": 280.0,
                    "detector_temp": 280.0,
                    "oven_temp": 100.0,
                    "flow_rate": 1.0,
                    "split_ratio": 10.0,
                    "h2_flow": 30.0,
                    "air_flow": 300.0,
                    "makeup_flow": 25.0,
                    "injection_volume": 1.0,
                    "sample_concentration": 100.0,
                    "target_compound": "Benzène-d6 (α,β-δ)",  # Special characters
                    "instrument_age": 5.0,
                    "maintenance_level": "Excellent",
                    "detector_calibration": "Good",
                    "column_condition": "Good",
                    "noise_level": "Low",
                    "sample_matrix": "Матрица",  # Cyrillic
                    "analysis_type": "定量分析"  # Chinese
                },
                "description": "Unicode and special characters",
                "should_succeed": True  # Should handle Unicode
            }
        ]
        
        results = []
        async with aiohttp.ClientSession() as session:
            for case in edge_cases:
                try:
                    start_time = time.time()
                    async with session.post(
                        f"{self.base_url}{case['endpoint']}",
                        json=case["data"],
                        timeout=aiohttp.ClientTimeout(total=30)  # 30 second timeout
                    ) as response:
                        response_time = time.time() - start_time
                        response_text = await response.text()
                        
                        # Determine if test passed based on expectations
                        if case["should_succeed"]:
                            passed = response.status == 200
                            if not passed:
                                logger.warning(f"Expected success but got {response.status}: {response_text[:200]}")
                        else:
                            passed = response.status in [400, 422]  # Validation errors expected
                            if not passed:
                                logger.warning(f"Expected validation error but got {response.status}")
                        
                        result = {
                            "test": case["description"],
                            "endpoint": case["endpoint"],
                            "status_code": response.status,
                            "response_time_s": response_time,
                            "passed": passed,
                            "expected_success": case["should_succeed"],
                            "response_size": len(response_text),
                            "response_preview": response_text[:200] if not passed else "OK"
                        }
                        results.append(result)
                        
                except asyncio.TimeoutError:
                    results.append({
                        "test": case["description"],
                        "endpoint": case["endpoint"],
                        "passed": False,
                        "error": "Request timeout (>30s)",
                        "response_time_s": 30.0
                    })
                except Exception as e:
                    results.append({
                        "test": case["description"],
                        "endpoint": case["endpoint"],
                        "passed": False,
                        "error": str(e),
                        "traceback": traceback.format_exc()
                    })
        
        return results
    
    async def load_test(self, concurrent_requests: int = 100, duration_seconds: int = 60):
        """Test with high concurrent load over time"""
        
        print(f"🔥 Load testing with {concurrent_requests} concurrent requests for {duration_seconds} seconds...")
        
        # Generate realistic test requests
        request_templates = [
            {
                "endpoint": "/api/v1/calculations/inlet-simulator",
                "data_generator": self._generate_inlet_data
            },
            {
                "endpoint": "/api/v1/calculations/detection-limit",
                "data_generator": self._generate_detection_limit_data
            },
            {
                "endpoint": "/api/v1/calculations/column-parameters",
                "data_generator": self._generate_column_data
            },
            {
                "endpoint": "/api/v1/calculations/pressure-drop",
                "data_generator": self._generate_pressure_data
            }
        ]
        
        async def make_request(session, template):
            """Make a single request with random data"""
            start_time = time.time()
            try:
                data = template["data_generator"]()
                async with session.post(
                    f"{self.base_url}{template['endpoint']}",
                    json=data,
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    await response.text()  # Read response
                    return {
                        "endpoint": template["endpoint"],
                        "status_code": response.status,
                        "response_time": time.time() - start_time,
                        "success": response.status == 200
                    }
            except Exception as e:
                return {
                    "endpoint": template["endpoint"],
                    "status_code": 500,
                    "response_time": time.time() - start_time,
                    "success": False,
                    "error": str(e)
                }
        
        # Run load test
        start_time = time.time()
        all_results = []
        
        async with aiohttp.ClientSession() as session:
            while time.time() - start_time < duration_seconds:
                # Create batch of concurrent requests
                tasks = []
                for _ in range(concurrent_requests):
                    template = random.choice(request_templates)
                    tasks.append(make_request(session, template))
                
                # Execute batch
                batch_results = await asyncio.gather(*tasks, return_exceptions=True)
                
                # Process results
                for result in batch_results:
                    if isinstance(result, Exception):
                        all_results.append({
                            "status_code": 500,
                            "response_time": 10.0,
                            "success": False,
                            "error": str(result)
                        })
                    else:
                        all_results.append(result)
                
                # Brief pause between batches
                await asyncio.sleep(0.1)
        
        # Calculate performance metrics
        response_times = [r["response_time"] for r in all_results]
        success_count = sum(1 for r in all_results if r["success"])
        
        # Group by endpoint
        endpoint_stats = {}
        for result in all_results:
            endpoint = result.get("endpoint", "unknown")
            if endpoint not in endpoint_stats:
                endpoint_stats[endpoint] = {"times": [], "successes": 0, "total": 0}
            
            endpoint_stats[endpoint]["times"].append(result["response_time"])
            endpoint_stats[endpoint]["total"] += 1
            if result["success"]:
                endpoint_stats[endpoint]["successes"] += 1
        
        # Calculate detailed stats per endpoint
        for endpoint, stats in endpoint_stats.items():
            times = stats["times"]
            stats["avg_response_time"] = statistics.mean(times)
            stats["median_response_time"] = statistics.median(times)
            stats["p95_response_time"] = np.percentile(times, 95)
            stats["p99_response_time"] = np.percentile(times, 99)
            stats["success_rate"] = stats["successes"] / stats["total"] * 100
        
        return {
            "test_duration_s": time.time() - start_time,
            "total_requests": len(all_results),
            "successful_requests": success_count,
            "failed_requests": len(all_results) - success_count,
            "overall_success_rate": success_count / len(all_results) * 100 if all_results else 0,
            "avg_response_time": statistics.mean(response_times) if response_times else 0,
            "median_response_time": statistics.median(response_times) if response_times else 0,
            "p95_response_time": np.percentile(response_times, 95) if response_times else 0,
            "p99_response_time": np.percentile(response_times, 99) if response_times else 0,
            "max_response_time": max(response_times) if response_times else 0,
            "min_response_time": min(response_times) if response_times else 0,
            "requests_per_second": len(all_results) / (time.time() - start_time),
            "endpoint_breakdown": endpoint_stats
        }
    
    def _generate_inlet_data(self):
        """Generate random but valid inlet simulation data"""
        return {
            "inlet_temp": random.uniform(200, 350),
            "split_ratio": random.uniform(5, 200),
            "injection_volume": random.uniform(0.5, 5.0),
            "liner_type": random.choice(["Split Liner", "Splitless Liner", "Purge Liner"]),
            "injection_mode": random.choice(["Split", "Splitless"]),
            "carrier_gas": random.choice(["Helium", "Hydrogen", "Nitrogen"]),
            "carrier_flow_rate": random.uniform(0.8, 3.0),
            "septum_purge": random.uniform(1.0, 5.0),
            "instrument_age": random.uniform(1, 20),
            "maintenance_level": random.choice(["Excellent", "Good", "Fair", "Poor"]),
            "vacuum_integrity": random.uniform(80, 100),
            "septum_condition": random.choice(["New", "Good", "Worn"]),
            "liner_condition": random.choice(["Clean", "Lightly Contaminated", "Contaminated"]),
            "purge_flow": random.uniform(2.0, 5.0),
            "matrix_type": random.choice(["Light Hydrocarbon", "Heavy Hydrocarbon", "Oxygenated", "Aqueous"]),
            "is_calibrated": random.choice([True, False])
        }
    
    def _generate_detection_limit_data(self):
        """Generate random but valid detection limit data"""
        return {
            "detector_type": random.choice(["FID", "TCD", "MS"]),
            "carrier_gas": random.choice(["Helium", "Hydrogen", "Nitrogen"]),
            "column_type": random.choice(["DB-1", "DB-5", "DB-WAX"]),
            "injector_temp": random.uniform(200, 350),
            "detector_temp": random.uniform(200, 350),
            "oven_temp": random.uniform(50, 300),
            "flow_rate": random.uniform(0.8, 5.0),
            "split_ratio": random.uniform(5, 100),
            "h2_flow": random.uniform(20, 50),
            "air_flow": random.uniform(200, 500),
            "makeup_flow": random.uniform(10, 50),
            "injection_volume": random.uniform(0.5, 3.0),
            "sample_concentration": random.uniform(1, 1000),
            "target_compound": random.choice(["Benzene", "Toluene", "Octane", "Decane"]),
            "instrument_age": random.uniform(1, 15),
            "maintenance_level": random.choice(["Excellent", "Good", "Fair"]),
            "detector_calibration": random.choice(["Good", "Worn"]),
            "column_condition": random.choice(["New", "Good", "Worn"]),
            "noise_level": random.choice(["Low", "Medium", "High"]),
            "sample_matrix": random.choice(["Clean", "Light Matrix", "Complex"]),
            "analysis_type": random.choice(["Quantitative", "Qualitative", "Screening"])
        }
    
    def _generate_column_data(self):
        """Generate random but valid column parameter data"""
        return {
            "length_m": random.choice([15, 30, 60]),
            "id_mm": random.choice([0.25, 0.32, 0.53]),
            "flow_ml_min": random.uniform(0.8, 3.0),
            "temperature_c": random.uniform(50, 250),
            "carrier_gas": random.choice(["Helium", "Hydrogen", "Nitrogen"]),
            "outlet_pressure_psi": 14.7  # Atmospheric
        }
    
    def _generate_pressure_data(self):
        """Generate random but valid pressure drop data"""
        return {
            "length_m": random.choice([15, 30, 60]),
            "id_mm": random.choice([0.25, 0.32, 0.53]),
            "flow_ml_min": random.uniform(0.8, 3.0),
            "temperature_c": random.uniform(50, 250),
            "carrier_gas": random.choice(["Helium", "Hydrogen", "Nitrogen"])
        }
    
    async def memory_stress_test(self):
        """Test memory usage under stress"""
        print("🧠 Testing memory usage under stress...")
        
        # Generate large payloads
        large_requests = []
        for i in range(10):
            # Create request with large calibration data
            calibration_data = {
                f"point_{j}": {"concentration": j, "area": j * 1000 + random.randint(-100, 100)}
                for j in range(1000)  # 1000 calibration points
            }
            
            large_requests.append({
                "endpoint": "/api/v1/calculations/inlet-simulator",
                "data": {
                    **self._generate_inlet_data(),
                    "is_calibrated": True,
                    "calibration_data": calibration_data
                },
                "description": f"Large payload test {i+1}"
            })
        
        results = []
        async with aiohttp.ClientSession() as session:
            for req in large_requests:
                try:
                    start_time = time.time()
                    payload_size = len(json.dumps(req["data"]))
                    
                    async with session.post(
                        f"{self.base_url}{req['endpoint']}",
                        json=req["data"],
                        timeout=aiohttp.ClientTimeout(total=30)
                    ) as response:
                        response_time = time.time() - start_time
                        response_text = await response.text()
                        
                        results.append({
                            "test": req["description"],
                            "payload_size_bytes": payload_size,
                            "status_code": response.status,
                            "response_time_s": response_time,
                            "response_size_bytes": len(response_text),
                            "passed": response.status == 200
                        })
                        
                except Exception as e:
                    results.append({
                        "test": req["description"],
                        "passed": False,
                        "error": str(e)
                    })
        
        return results
    
    async def run_all_stress_tests(self):
        """Run complete stress test suite"""
        print("🚀 Starting comprehensive stress testing...")
        
        start_time = time.time()
        
        # Run all stress tests
        edge_case_results = await self.test_edge_cases()
        load_test_results = await self.load_test(concurrent_requests=50, duration_seconds=30)
        memory_test_results = await self.memory_stress_test()
        
        # Compile results
        total_time = time.time() - start_time
        
        # Calculate summary statistics
        edge_passed = sum(1 for r in edge_case_results if r.get("passed", False))
        memory_passed = sum(1 for r in memory_test_results if r.get("passed", False))
        
        summary = {
            "total_test_time_s": total_time,
            "edge_cases": {
                "total": len(edge_case_results),
                "passed": edge_passed,
                "failed": len(edge_case_results) - edge_passed,
                "pass_rate": edge_passed / len(edge_case_results) * 100 if edge_case_results else 0
            },
            "load_testing": load_test_results,
            "memory_testing": {
                "total": len(memory_test_results),
                "passed": memory_passed,
                "failed": len(memory_test_results) - memory_passed,
                "pass_rate": memory_passed / len(memory_test_results) * 100 if memory_test_results else 0
            }
        }
        
        return {
            "summary": summary,
            "edge_case_results": edge_case_results,
            "load_test_results": load_test_results,
            "memory_test_results": memory_test_results,
            "timestamp": datetime.now().isoformat()
        }


async def main():
    """Main stress testing function"""
    tester = StressTester()
    results = await tester.run_all_stress_tests()
    
    # Save results
    with open("stress_test_results.json", "w") as f:
        json.dump(results, f, indent=2)
    
    # Print summary
    print("\n" + "="*60)
    print("STRESS TEST RESULTS SUMMARY")
    print("="*60)
    
    summary = results["summary"]
    print(f"Total Test Time: {summary['total_test_time_s']:.1f} seconds")
    print(f"\nEdge Cases: {summary['edge_cases']['passed']}/{summary['edge_cases']['total']} passed ({summary['edge_cases']['pass_rate']:.1f}%)")
    print(f"Memory Tests: {summary['memory_testing']['passed']}/{summary['memory_testing']['total']} passed ({summary['memory_testing']['pass_rate']:.1f}%)")
    
    load_results = summary['load_testing']
    print(f"\nLoad Testing:")
    print(f"  Requests: {load_results['total_requests']}")
    print(f"  Success Rate: {load_results['overall_success_rate']:.1f}%")
    print(f"  Avg Response Time: {load_results['avg_response_time']:.3f}s")
    print(f"  P95 Response Time: {load_results['p95_response_time']:.3f}s")
    print(f"  Requests/Second: {load_results['requests_per_second']:.1f}")
    
    # Print failed edge cases
    failed_edge_cases = [r for r in results["edge_case_results"] if not r.get("passed", False)]
    if failed_edge_cases:
        print(f"\n❌ Failed Edge Cases:")
        for case in failed_edge_cases[:5]:  # Show first 5
            print(f"  • {case['test']}: {case.get('error', 'Check response')}")
    
    print(f"\n✅ Stress test results saved to stress_test_results.json")
    
    return results


if __name__ == "__main__":
    results = asyncio.run(main())
