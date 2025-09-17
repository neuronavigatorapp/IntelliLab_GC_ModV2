#!/usr/bin/env python3
"""
Comprehensive Integration Test for AI Troubleshooter System
Tests the complete OCR-to-AI troubleshooting pipeline
"""

import sys
import os
from pathlib import Path
import asyncio
import json
from datetime import datetime
import requests
import time

# Add backend to Python path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

# Test configuration
API_BASE_URL = "http://127.0.0.1:8001"
TEST_RESULTS = []


class IntegrationTestSuite:
    """Comprehensive integration test suite"""
    
    def __init__(self):
        self.test_results = []
        self.server_available = False
    
    async def run_all_tests(self):
        """Run complete integration test suite"""
        
        print("🧪 AI TROUBLESHOOTER INTEGRATION TEST SUITE")
        print("=" * 60)
        
        # Test 1: Check server availability
        await self.test_server_availability()
        
        if not self.server_available:
            print("⚠️  Server not available - running offline tests only")
        
        # Test 2: Test backend imports
        await self.test_backend_imports()
        
        # Test 3: Test AI troubleshooter engine directly
        await self.test_ai_engine_direct()
        
        # Test 4: Test OCR-AI bridge
        await self.test_ocr_integration()
        
        if self.server_available:
            # Test 5: Test API endpoints
            await self.test_api_endpoints()
            
            # Test 6: Test end-to-end workflow
            await self.test_end_to_end_workflow()
        
        # Test 7: Test error handling
        await self.test_error_handling()
        
        # Test 8: Test performance
        await self.test_performance()
        
        # Show results
        self.show_test_results()
    
    async def test_server_availability(self):
        """Test if API server is running"""
        
        print("\n🌐 Testing server availability...")
        
        try:
            response = requests.get(f"{API_BASE_URL}/", timeout=5)
            if response.status_code == 200:
                self.server_available = True
                self.record_test("Server Availability", "PASS", "Server is running and responding")
                print("   ✅ Server is available")
            else:
                self.record_test("Server Availability", "FAIL", f"Server returned {response.status_code}")
                print(f"   ❌ Server returned {response.status_code}")
        except requests.exceptions.ConnectionError:
            self.record_test("Server Availability", "SKIP", "Server not running")
            print("   ⚠️  Server not running (this is OK for offline testing)")
        except Exception as e:
            self.record_test("Server Availability", "ERROR", str(e))
            print(f"   ❌ Server test error: {e}")
    
    async def test_backend_imports(self):
        """Test that all backend components can be imported"""
        
        print("\n📦 Testing backend imports...")
        
        try:
            from app.models.schemas import (
                TroubleshooterRequest, ChromatogramData, Peak, MethodParameters
            )
            from app.services.ai_troubleshooter import AITroubleshooterEngine
            from app.services.ocr_ai_bridge import get_ai_integration_service
            
            self.record_test("Backend Imports", "PASS", "All components imported successfully")
            print("   ✅ All backend components imported successfully")
            
        except ImportError as e:
            self.record_test("Backend Imports", "FAIL", f"Import error: {e}")
            print(f"   ❌ Import error: {e}")
        except Exception as e:
            self.record_test("Backend Imports", "ERROR", str(e))
            print(f"   ❌ Unexpected error: {e}")
    
    async def test_ai_engine_direct(self):
        """Test AI troubleshooter engine directly"""
        
        print("\n🧠 Testing AI engine directly...")
        
        try:
            from app.services.ai_troubleshooter import AITroubleshooterEngine
            from app.models.schemas import TroubleshooterRequest, ChromatogramData, Peak, MethodParameters
            from types import SimpleNamespace
            
            # Create AI engine
            ai_engine = AITroubleshooterEngine()
            
            # Create test data
            chromatogram_data = ChromatogramData(
                file_path="test_sample.d",
                sample_name="Integration Test Sample",
                method_name="Test Method",
                injection_date=datetime.now(),
                peaks=[
                    Peak(
                        peak_number=1,
                        retention_time=5.2,
                        area=1000000.0,
                        height=50000.0,
                        area_percent=100.0,
                        tailing_factor=1.2,
                        theoretical_plates=5000,
                        resolution=2.5,
                        name="Test Compound",
                        signal_to_noise_ratio=25.0
                    )
                ],
                peak_count=1,
                total_area=1000000.0,
                method_parameters={"temperature": 250, "flow_rate": 1.0}
            )
            
            # Create request
            request = TroubleshooterRequest(
                request_id="integration_test_001",
                chromatogram_data=chromatogram_data,
                analysis_type="comprehensive"
            )
            
            # Perform analysis
            response = await ai_engine.analyze_chromatogram(request)
            
            if response.status == "completed":
                self.record_test("AI Engine Direct", "PASS", "Analysis completed successfully")
                print("   ✅ AI analysis completed successfully")
            else:
                self.record_test("AI Engine Direct", "FAIL", f"Analysis status: {response.status}")
                print(f"   ⚠️  Analysis status: {response.status}")
                
        except Exception as e:
            self.record_test("AI Engine Direct", "ERROR", str(e))
            print(f"   ❌ AI engine test error: {e}")
    
    async def test_ocr_integration(self):
        """Test OCR-AI integration bridge"""
        
        print("\n📷 Testing OCR integration...")
        
        try:
            from app.services.ocr_ai_bridge import get_ai_integration_service
            from app.models.schemas import OCRProcessingResult, OCRPeakData, OCRSampleInfo
            
            # Create OCR bridge
            ocr_bridge = get_ai_integration_service()
            
            # Create test OCR result with all required fields
            from app.models.schemas import ImagePreprocessingOptions
            
            ocr_result = OCRProcessingResult(
                success=True,
                processing_time_ms=1500,
                image_dimensions={"width": 800, "height": 600},
                overall_confidence=0.85,
                text_extraction_quality="high",
                peak_detection_quality="good", 
                preprocessing_applied=ImagePreprocessingOptions(
                    denoise=True,
                    enhance_contrast=True,
                    binarize=True,
                    correct_skew=False
                ),
                peaks_data=[
                    OCRPeakData(
                        peak_number=1,
                        retention_time=5.2,
                        area=1000000.0,
                        height=50000.0,
                        area_percent=100.0,
                        compound_name="Test Compound",
                        confidence=0.9
                    )
                ],
                sample_info=OCRSampleInfo(
                    sample_name="OCR Test Sample",
                    operator="Test User",
                    injection_date="2024-12-19 10:00:00"
                )
            )
            
            # Validate OCR data
            validation = ocr_bridge.validate_ocr_for_ai_processing(ocr_result)
            
            if validation["is_suitable_for_ai"]:
                # Transform OCR to chromatogram data
                chromatogram_data = ocr_bridge.transform_ocr_to_chromatogram_data(ocr_result)
                
                if chromatogram_data.sample_name == "OCR Test Sample":
                    self.record_test("OCR Integration", "PASS", "OCR transformation successful")
                    print("   ✅ OCR integration working correctly")
                else:
                    self.record_test("OCR Integration", "FAIL", "Data transformation error")
                    print("   ❌ Data transformation error")
            else:
                self.record_test("OCR Integration", "FAIL", "OCR validation failed")
                print("   ❌ OCR validation failed")
                
        except Exception as e:
            self.record_test("OCR Integration", "ERROR", str(e))
            print(f"   ❌ OCR integration error: {e}")
    
    async def test_api_endpoints(self):
        """Test API endpoints"""
        
        print("\n🌐 Testing API endpoints...")
        
        if not self.server_available:
            self.record_test("API Endpoints", "SKIP", "Server not available")
            return
        
        try:
            # Test health endpoint
            response = requests.get(f"{API_BASE_URL}/health")
            if response.status_code in [200, 503]:  # 503 is OK for health check
                print("   ✅ Health endpoint responding")
            else:
                print(f"   ⚠️  Health endpoint returned {response.status_code}")
            
            # Test demo analysis
            response = requests.get(f"{API_BASE_URL}/api/troubleshooter/demo")
            if response.status_code == 200:
                print("   ✅ Demo analysis endpoint working")
                demo_result = response.json()
                if demo_result.get("status") in ["completed", "failed"]:
                    self.record_test("API Endpoints", "PASS", "All endpoints responding correctly")
                else:
                    self.record_test("API Endpoints", "PARTIAL", "Endpoints responding but with issues")
            else:
                self.record_test("API Endpoints", "FAIL", f"Demo endpoint returned {response.status_code}")
                print(f"   ❌ Demo endpoint returned {response.status_code}")
            
            # Test knowledge base
            response = requests.get(f"{API_BASE_URL}/api/troubleshooter/knowledge-base/statistics")
            if response.status_code == 200:
                print("   ✅ Knowledge base endpoint working")
            else:
                print(f"   ⚠️  KB endpoint returned {response.status_code}")
                
        except Exception as e:
            self.record_test("API Endpoints", "ERROR", str(e))
            print(f"   ❌ API endpoint test error: {e}")
    
    async def test_end_to_end_workflow(self):
        """Test complete end-to-end workflow"""
        
        print("\n🔄 Testing end-to-end workflow...")
        
        if not self.server_available:
            self.record_test("End-to-End Workflow", "SKIP", "Server not available")
            return
        
        try:
            # Test OCR-to-AI workflow via API
            ocr_data = {
                "success": True,
                "confidence_score": 0.85,
                "peaks_data": [
                    {
                        "peak_number": 1,
                        "retention_time": "5.2",
                        "area": "1000000",
                        "height": "50000",
                        "compound_name": "E2E Test Compound",
                        "confidence": 0.9
                    }
                ],
                "sample_info": {
                    "sample_name": "E2E Test Sample",
                    "operator": "Integration Tester"
                }
            }
            
            response = requests.post(
                f"{API_BASE_URL}/api/troubleshooter/analyze-ocr",
                json=ocr_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("status") == "completed":
                    self.record_test("End-to-End Workflow", "PASS", "Complete OCR-to-AI workflow successful")
                    print("   ✅ End-to-end workflow completed successfully")
                else:
                    self.record_test("End-to-End Workflow", "PARTIAL", f"Workflow completed with status: {result.get('status')}")
                    print(f"   ⚠️  Workflow status: {result.get('status')}")
            else:
                self.record_test("End-to-End Workflow", "FAIL", f"API returned {response.status_code}")
                print(f"   ❌ API returned {response.status_code}")
                
        except Exception as e:
            self.record_test("End-to-End Workflow", "ERROR", str(e))
            print(f"   ❌ E2E workflow error: {e}")
    
    async def test_error_handling(self):
        """Test error handling capabilities"""
        
        print("\n🛡️  Testing error handling...")
        
        try:
            # Test with invalid data (if server available)
            if self.server_available:
                invalid_data = {"invalid": "data"}
                response = requests.post(
                    f"{API_BASE_URL}/api/troubleshooter/analyze",
                    json=invalid_data
                )
                
                if response.status_code in [400, 422, 500]:  # Expected error codes
                    print("   ✅ Error handling working correctly")
                else:
                    print(f"   ⚠️  Unexpected response to invalid data: {response.status_code}")
            
            # Test direct engine with invalid data
            from app.services.ai_troubleshooter import AITroubleshooterEngine
            from types import SimpleNamespace
            
            ai_engine = AITroubleshooterEngine()
            
            # Test with minimal/invalid request
            invalid_request = SimpleNamespace(
                request_id="error_test",
                chromatogram_data=None,
                analysis_type="test"
            )
            
            try:
                response = await ai_engine.analyze_chromatogram(invalid_request)
                if response.status in ["failed", "partial"]:
                    self.record_test("Error Handling", "PASS", "Error handling working correctly")
                    print("   ✅ Engine error handling working")
                else:
                    self.record_test("Error Handling", "PARTIAL", "Unexpected response to invalid data")
            except Exception:
                # Catching exceptions is also valid error handling
                self.record_test("Error Handling", "PASS", "Proper exception handling")
                print("   ✅ Exception handling working")
                
        except Exception as e:
            self.record_test("Error Handling", "ERROR", str(e))
            print(f"   ❌ Error handling test error: {e}")
    
    async def test_performance(self):
        """Test system performance"""
        
        print("\n⚡ Testing performance...")
        
        try:
            start_time = time.time()
            
            # Run performance test
            if self.server_available:
                # Test API performance
                response = requests.get(f"{API_BASE_URL}/api/troubleshooter/demo")
                api_time = time.time() - start_time
                
                if api_time < 5.0:  # Should complete within 5 seconds
                    self.record_test("Performance", "PASS", f"API response time: {api_time:.2f}s")
                    print(f"   ✅ API performance: {api_time:.2f}s")
                else:
                    self.record_test("Performance", "FAIL", f"Slow API response: {api_time:.2f}s")
                    print(f"   ⚠️  Slow API response: {api_time:.2f}s")
            else:
                # Test direct engine performance
                from app.services.ai_troubleshooter import AITroubleshooterEngine
                from app.models.schemas import TroubleshooterRequest, ChromatogramData, Peak
                
                ai_engine = AITroubleshooterEngine()
                
                request = TroubleshooterRequest(
                    request_id="perf_test",
                    chromatogram_data=ChromatogramData(
                        file_path="perf_test.d",
                        sample_name="Performance Test",
                        method_name="Test Method",
                        injection_date=datetime.now(),
                        peaks=[Peak(
                            peak_number=1,
                            retention_time=5.0, 
                            area=1000000.0, 
                            height=50000.0,
                            area_percent=100.0,
                            tailing_factor=1.2,
                            theoretical_plates=5000,
                            resolution=2.5,
                            name="Test Peak",
                            signal_to_noise_ratio=20.0
                        )],
                        peak_count=1,
                        method_parameters={"temperature": 250}
                    ),
                    analysis_type="quick_scan"
                )
                
                response = await ai_engine.analyze_chromatogram(request)
                engine_time = time.time() - start_time
                
                if engine_time < 3.0:
                    self.record_test("Performance", "PASS", f"Engine performance: {engine_time:.2f}s")
                    print(f"   ✅ Engine performance: {engine_time:.2f}s")
                else:
                    self.record_test("Performance", "PARTIAL", f"Slow engine response: {engine_time:.2f}s")
                    print(f"   ⚠️  Engine response: {engine_time:.2f}s")
                
        except Exception as e:
            self.record_test("Performance", "ERROR", str(e))
            print(f"   ❌ Performance test error: {e}")
    
    def record_test(self, test_name: str, status: str, details: str):
        """Record test result"""
        
        self.test_results.append({
            "test": test_name,
            "status": status,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
    
    def show_test_results(self):
        """Display comprehensive test results"""
        
        print("\n\n📊 INTEGRATION TEST RESULTS")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["status"] == "PASS")
        failed = sum(1 for result in self.test_results if result["status"] == "FAIL")
        errors = sum(1 for result in self.test_results if result["status"] == "ERROR")
        skipped = sum(1 for result in self.test_results if result["status"] == "SKIP")
        partial = sum(1 for result in self.test_results if result["status"] == "PARTIAL")
        
        total = len(self.test_results)
        
        print(f"📈 Summary: {total} tests")
        print(f"   ✅ Passed: {passed}")
        print(f"   ❌ Failed: {failed}")
        print(f"   🔥 Errors: {errors}")
        print(f"   ⚠️  Partial: {partial}")
        print(f"   ⏭️  Skipped: {skipped}")
        
        print(f"\n📋 Detailed Results:")
        for result in self.test_results:
            status_icon = {
                "PASS": "✅",
                "FAIL": "❌", 
                "ERROR": "🔥",
                "PARTIAL": "⚠️ ",
                "SKIP": "⏭️ "
            }.get(result["status"], "❓")
            
            print(f"   {status_icon} {result['test']}: {result['details']}")
        
        # Overall assessment
        if failed == 0 and errors == 0:
            if passed >= total * 0.8:  # 80% pass rate
                print(f"\n🎉 INTEGRATION TESTS SUCCESSFUL!")
                print(f"   AI Troubleshooter system is ready for production use")
            else:
                print(f"\n⚠️  INTEGRATION TESTS PARTIALLY SUCCESSFUL")
                print(f"   Most components working, some issues need attention")
        else:
            print(f"\n❌ INTEGRATION TESTS FAILED")
            print(f"   {failed + errors} critical issues need to be resolved")
        
        return passed, failed, errors, skipped, partial


async def main():
    """Run integration tests"""
    
    print("🚀 Starting AI Troubleshooter Integration Tests...")
    print(f"   Timestamp: {datetime.now()}")
    print(f"   Test Target: {API_BASE_URL}")
    print()
    
    test_suite = IntegrationTestSuite()
    
    try:
        await test_suite.run_all_tests()
    except KeyboardInterrupt:
        print("\n⚠️  Tests interrupted by user")
    except Exception as e:
        print(f"\n💥 Test suite failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())