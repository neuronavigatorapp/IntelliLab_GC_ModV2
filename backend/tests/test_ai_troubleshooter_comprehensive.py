"""
Comprehensive Test Suite for AI Troubleshooter System
Tests all components: OCR integration, AI analysis, recommendations, API endpoints
"""

import pytest
import asyncio
from datetime import datetime
from typing import Dict, Any, List
import json
import numpy as np

from app.models.schemas import (
    TroubleshooterRequest, TroubleshooterResponse, ChromatogramData,
    OCRProcessingResult, OCRTextRegion, OCRPeakData, OCRMethodParameters, OCRSampleInfo,
    Peak, MethodParameters, DiagnosticIssue, TroubleshootingSolution
)
from app.services.ai_troubleshooter import AITroubleshooterEngine
from app.services.ocr_ai_bridge import get_ai_integration_service
from app.services.knowledge_base import GCMSKnowledgeBase
from app.services.recommendation_engine import AIRecommendationEngine


class TestAITroubleshooterSystem:
    """Comprehensive test suite for AI troubleshooter system"""
    
    @pytest.fixture
    def ai_engine(self):
        """Create AI troubleshooter engine for testing"""
        return AITroubleshooterEngine()
    
    @pytest.fixture
    def ocr_bridge(self):
        """Create OCR-AI bridge for testing"""
        return get_ai_integration_service()
    
    @pytest.fixture
    def sample_chromatogram_data(self):
        """Create sample chromatogram data for testing"""
        return ChromatogramData(
            file_path="test_chromatogram.d",
            sample_name="Test Sample",
            method_name="Test Method",
            injection_date=datetime.now(),
            peaks=[
                Peak(
                    retention_time=5.2,
                    area=1250000.0,
                    height=85000.0,
                    width=0.15,
                    name="Benzene"
                ),
                Peak(
                    retention_time=8.7,
                    area=2100000.0,
                    height=120000.0,
                    width=0.18,
                    name="Toluene"
                ),
                Peak(
                    retention_time=12.1,
                    area=890000.0,
                    height=45000.0,
                    width=0.25,
                    name="Xylene",
                    confidence_score=0.6  # Lower confidence peak
                )
            ],
            method_parameters=MethodParameters(
                inlet_temperature=250.0,
                column_temperature=100.0,
                carrier_gas_flow=1.2,
                injection_volume=1.0
            ),
            total_area=4240000.0,
            peak_count=3,
            baseline_noise=150.0,
            signal_to_noise_ratio=25.0
        )
    
    @pytest.fixture
    def sample_ocr_result(self):
        """Create sample OCR result for testing"""
        return OCRProcessingResult(
            success=True,
            confidence_score=0.85,
            peaks_data=[
                OCRPeakData(
                    peak_number=1,
                    retention_time="5.2",
                    area="1250000",
                    height="85000",
                    area_percent="29.5",
                    compound_name="Benzene",
                    confidence=0.9
                ),
                OCRPeakData(
                    peak_number=2,
                    retention_time="8.7", 
                    area="2100000",
                    height="120000",
                    area_percent="49.5",
                    compound_name="Toluene",
                    confidence=0.95
                ),
                OCRPeakData(
                    peak_number=3,
                    retention_time="12.1",
                    area="890000",
                    height="45000",
                    area_percent="21.0",
                    compound_name="Xylene",
                    confidence=0.7
                )
            ],
            method_parameters=OCRMethodParameters(
                column_type="DB-5MS",
                column_length="30m x 0.25mm",
                carrier_gas="Helium",
                flow_rate="1.2 mL/min",
                injection_volume=1.0,
                inlet_temperature=250.0,
                detector_type="MS",
                oven_program=["100°C (2 min)", "10°C/min to 300°C", "300°C (5 min)"]
            ),
            sample_info=OCRSampleInfo(
                sample_name="Test Sample OCR",
                operator="Test Operator",
                injection_date="2024-12-19 10:30:00",
                dilution_factor="1.0",
                vial_position="A1",
                sequence_number=1
            ),
            text_regions=[
                OCRTextRegion(
                    text="Peak\tRT(min)\tArea\tHeight\t%Area\tCompound",
                    confidence=0.95,
                    bounding_box=(100, 200, 600, 220)
                ),
                OCRTextRegion(
                    text="1\t5.2\t1250000\t85000\t29.5\tBenzene",
                    confidence=0.9,
                    bounding_box=(100, 220, 600, 240)
                )
            ]
        )
    
    # =================== CORE AI ENGINE TESTS ===================
    
    @pytest.mark.asyncio
    async def test_basic_analysis(self, ai_engine, sample_chromatogram_data):
        """Test basic AI troubleshooting analysis"""
        
        request = TroubleshooterRequest(
            request_id="test_001",
            chromatogram_data=sample_chromatogram_data,
            analysis_type="comprehensive"
        )
        
        response = await ai_engine.analyze_chromatogram(request)
        
        assert response.status == "completed"
        assert response.diagnostic_result is not None
        assert len(response.diagnostic_result.issues) >= 0
        assert response.diagnostic_result.overall_score >= 0.0
        assert response.diagnostic_result.overall_score <= 1.0
        assert len(response.recommendations) >= 0
    
    @pytest.mark.asyncio
    async def test_peak_quality_assessment(self, ai_engine, sample_chromatogram_data):
        """Test peak quality assessment functionality"""
        
        # Create data with quality issues
        poor_quality_data = sample_chromatogram_data
        poor_quality_data.peaks[2].width = 0.8  # Very wide peak (tailing)
        poor_quality_data.signal_to_noise_ratio = 5.0  # Poor S/N
        
        request = TroubleshooterRequest(
            request_id="test_peak_quality",
            chromatogram_data=poor_quality_data,
            analysis_type="peak_analysis"
        )
        
        response = await ai_engine.analyze_chromatogram(request)
        
        # Should detect peak quality issues
        peak_issues = [issue for issue in response.diagnostic_result.issues 
                      if issue.category == "peak_quality"]
        
        assert len(peak_issues) > 0
        assert any("tailing" in issue.description.lower() or "wide" in issue.description.lower() 
                  for issue in peak_issues)
    
    @pytest.mark.asyncio
    async def test_method_parameter_analysis(self, ai_engine, sample_chromatogram_data):
        """Test method parameter evaluation"""
        
        # Create data with method issues
        method_issue_data = sample_chromatogram_data
        method_issue_data.method_parameters.inlet_temperature = 400.0  # Too high
        method_issue_data.method_parameters.carrier_gas_flow = 5.0  # Too high
        
        request = TroubleshooterRequest(
            request_id="test_method_params",
            chromatogram_data=method_issue_data,
            analysis_type="method_validation"
        )
        
        response = await ai_engine.analyze_chromatogram(request)
        
        # Should detect method parameter issues
        method_issues = [issue for issue in response.diagnostic_result.issues 
                        if issue.category == "method_parameters"]
        
        assert len(method_issues) > 0
    
    # =================== OCR INTEGRATION TESTS ===================
    
    def test_ocr_to_chromatogram_transformation(self, ocr_bridge, sample_ocr_result):
        """Test OCR data transformation to chromatogram format"""
        
        chromatogram_data = ocr_bridge.transform_ocr_to_chromatogram_data(sample_ocr_result)
        
        assert chromatogram_data is not None
        assert chromatogram_data.sample_name == "Test Sample OCR"
        assert len(chromatogram_data.peaks) == 3
        assert chromatogram_data.peaks[0].retention_time == 5.2
        assert chromatogram_data.peaks[0].area == 1250000.0
        assert chromatogram_data.peaks[0].name == "Benzene"
    
    def test_ocr_validation(self, ocr_bridge, sample_ocr_result):
        """Test OCR result validation for AI processing"""
        
        validation = ocr_bridge.validate_ocr_for_ai_processing(sample_ocr_result)
        
        assert validation["is_suitable_for_ai"] == True
        assert validation["confidence_score"] == 0.85
        assert validation["data_completeness"]["peaks_extracted"] == True
        assert validation["data_completeness"]["method_parameters"] == True
        assert validation["data_completeness"]["sample_info"] == True
    
    @pytest.mark.asyncio
    async def test_end_to_end_ocr_analysis(self, ai_engine, ocr_bridge, sample_ocr_result):
        """Test complete OCR-to-analysis pipeline"""
        
        # Transform OCR to chromatogram data
        chromatogram_data = ocr_bridge.transform_ocr_to_chromatogram_data(sample_ocr_result)
        
        # Create analysis request
        request = TroubleshooterRequest(
            request_id="test_ocr_e2e",
            chromatogram_data=chromatogram_data,
            ocr_data=sample_ocr_result,
            analysis_type="comprehensive"
        )
        
        # Perform analysis
        response = await ai_engine.analyze_chromatogram(request)
        
        assert response.status == "completed"
        assert response.diagnostic_result is not None
        assert "ocr_extraction" in response.metadata["data_source"]
    
    # =================== KNOWLEDGE BASE TESTS ===================
    
    def test_knowledge_base_search(self, ai_engine):
        """Test knowledge base search functionality"""
        
        kb = ai_engine.knowledge_base
        
        # Test category search
        peak_solutions = kb.get_solutions_by_category("peak_quality")
        assert len(peak_solutions) > 0
        
        # Test tag search
        tailing_solutions = kb.search_by_tags(["tailing"])
        assert len(tailing_solutions) > 0
        
        # Test statistics
        stats = kb.get_statistics()
        assert stats["total_entries"] > 0
        assert stats["total_solutions"] > 0
    
    def test_solution_retrieval(self, ai_engine):
        """Test individual solution retrieval"""
        
        kb = ai_engine.knowledge_base
        
        # Get a known solution
        solutions = list(kb.solutions.keys())
        if solutions:
            solution_id = solutions[0]
            solution = kb.get_solution_by_id(solution_id)
            
            assert solution is not None
            assert solution.title is not None
            assert solution.description is not None
            assert solution.category is not None
    
    # =================== RECOMMENDATION ENGINE TESTS ===================
    
    def test_recommendation_generation(self, ai_engine):
        """Test AI recommendation engine"""
        
        # Create sample issues
        issues = [
            DiagnosticIssue(
                category="peak_quality",
                severity="major",
                description="Severe peak tailing observed",
                affected_peaks=[1, 2],
                confidence=0.9
            ),
            DiagnosticIssue(
                category="method_parameters",
                severity="minor",
                description="Inlet temperature slightly high",
                confidence=0.7
            )
        ]
        
        # Generate recommendations
        recommendations = ai_engine.recommendation_engine.generate_recommendations(
            issues=issues,
            context={"sample_type": "aromatics", "urgency": "high"}
        )
        
        assert len(recommendations) > 0
        
        # Check recommendation structure
        for rec in recommendations:
            assert hasattr(rec, 'solution')
            assert hasattr(rec, 'priority_score')
            assert hasattr(rec, 'implementation_difficulty')
            assert 0.0 <= rec.priority_score <= 1.0
    
    def test_step_by_step_guide_generation(self, ai_engine):
        """Test step-by-step guide generation"""
        
        # Get a sample solution
        kb = ai_engine.knowledge_base
        solutions = list(kb.solutions.values())
        
        if solutions:
            solution = solutions[0]
            
            guide = ai_engine.recommendation_engine.create_step_by_step_guide(
                solution,
                context={"user_level": "beginner"}
            )
            
            assert guide is not None
            assert "steps" in guide
            assert len(guide["steps"]) > 0
            assert "estimated_time" in guide
    
    # =================== DATA QUALITY TESTS ===================
    
    @pytest.mark.asyncio
    async def test_low_quality_data_handling(self, ai_engine):
        """Test handling of low-quality input data"""
        
        # Create minimal/poor quality data
        poor_data = ChromatogramData(
            file_path="poor_test.d",
            sample_name="Poor Sample",
            method_name="Unknown",
            injection_date=datetime.now(),
            peaks=[],  # No peaks
            peak_count=0,
            total_area=0.0
        )
        
        request = TroubleshooterRequest(
            request_id="test_poor_data",
            chromatogram_data=poor_data,
            analysis_type="quick_scan"
        )
        
        response = await ai_engine.analyze_chromatogram(request)
        
        # Should handle gracefully with appropriate warnings
        assert response.status in ["completed", "completed_with_warnings"]
        assert response.diagnostic_result is not None
        
        # Should identify data quality issues
        data_quality_issues = [issue for issue in response.diagnostic_result.issues 
                              if "data" in issue.description.lower() or "quality" in issue.description.lower()]
        assert len(data_quality_issues) > 0
    
    @pytest.mark.asyncio
    async def test_missing_data_handling(self, ai_engine):
        """Test handling of requests with missing required data"""
        
        # Create request with no chromatogram data
        request = TroubleshooterRequest(
            request_id="test_missing_data",
            analysis_type="comprehensive"
        )
        
        with pytest.raises(Exception):  # Should raise appropriate error
            await ai_engine.analyze_chromatogram(request)
    
    # =================== PERFORMANCE TESTS ===================
    
    @pytest.mark.asyncio
    async def test_analysis_performance(self, ai_engine, sample_chromatogram_data):
        """Test analysis performance and timing"""
        
        import time
        
        request = TroubleshooterRequest(
            request_id="test_performance",
            chromatogram_data=sample_chromatogram_data,
            analysis_type="comprehensive"
        )
        
        start_time = time.time()
        response = await ai_engine.analyze_chromatogram(request)
        end_time = time.time()
        
        processing_time = end_time - start_time
        
        # Analysis should complete within reasonable time (5 seconds)
        assert processing_time < 5.0
        assert response.processing_time > 0
    
    @pytest.mark.asyncio
    async def test_batch_processing_capability(self, ai_engine, sample_chromatogram_data):
        """Test capability to handle multiple analyses"""
        
        requests = []
        
        # Create multiple requests
        for i in range(5):
            request = TroubleshooterRequest(
                request_id=f"batch_test_{i}",
                chromatogram_data=sample_chromatogram_data,
                analysis_type="quick_scan"
            )
            requests.append(request)
        
        # Process all requests
        responses = []
        for request in requests:
            response = await ai_engine.analyze_chromatogram(request)
            responses.append(response)
            assert response.status == "completed"
        
        assert len(responses) == 5
    
    # =================== ERROR HANDLING TESTS ===================
    
    @pytest.mark.asyncio
    async def test_invalid_input_handling(self, ai_engine):
        """Test handling of various invalid inputs"""
        
        # Test with invalid chromatogram data
        invalid_data = ChromatogramData(
            file_path="",
            sample_name="",
            method_name="",
            injection_date=datetime.now(),
            peaks=[
                Peak(retention_time=-1.0, area=-1000.0)  # Invalid values
            ],
            peak_count=1
        )
        
        request = TroubleshooterRequest(
            request_id="test_invalid",
            chromatogram_data=invalid_data,
            analysis_type="comprehensive"
        )
        
        response = await ai_engine.analyze_chromatogram(request)
        
        # Should handle gracefully
        assert response.status in ["completed", "failed", "completed_with_warnings"]
    
    def test_health_check(self, ai_engine):
        """Test AI troubleshooter health check"""
        
        health = ai_engine.get_health_status()
        
        assert health is not None
        assert hasattr(health, 'service_status')
        assert hasattr(health, 'knowledge_base_entries')
        assert hasattr(health, 'model_version')
        assert health.service_status in ["healthy", "degraded", "unhealthy"]


# =================== INTEGRATION TESTS ===================

class TestAITroubleshooterAPI:
    """Test API endpoints for AI troubleshooter"""
    
    def test_api_imports(self):
        """Test that API components can be imported"""
        
        try:
            from app.api.troubleshooter import router, troubleshooter_engine, ocr_bridge
            assert router is not None
            assert troubleshooter_engine is not None
            assert ocr_bridge is not None
        except ImportError as e:
            pytest.fail(f"Failed to import API components: {e}")
    
    def test_mock_auth_function(self):
        """Test mock authentication function"""
        
        from app.api.troubleshooter import get_current_user
        
        user = get_current_user()
        assert user is not None
        assert "username" in user
        assert "experience_level" in user


# =================== UTILITY FUNCTIONS ===================

def create_test_suite():
    """Create comprehensive test suite"""
    
    test_cases = [
        # Core functionality tests
        "test_basic_analysis",
        "test_peak_quality_assessment", 
        "test_method_parameter_analysis",
        
        # OCR integration tests
        "test_ocr_to_chromatogram_transformation",
        "test_ocr_validation",
        "test_end_to_end_ocr_analysis",
        
        # Knowledge base tests
        "test_knowledge_base_search",
        "test_solution_retrieval",
        
        # Recommendation engine tests
        "test_recommendation_generation",
        "test_step_by_step_guide_generation",
        
        # Data quality tests
        "test_low_quality_data_handling",
        "test_missing_data_handling",
        
        # Performance tests
        "test_analysis_performance",
        "test_batch_processing_capability",
        
        # Error handling tests
        "test_invalid_input_handling",
        "test_health_check",
        
        # API tests
        "test_api_imports",
        "test_mock_auth_function"
    ]
    
    return test_cases


def run_comprehensive_tests():
    """Run all AI troubleshooter tests"""
    
    print("🧪 Starting AI Troubleshooter Comprehensive Test Suite")
    print("=" * 60)
    
    # Run tests with pytest
    test_results = pytest.main([
        __file__, 
        "-v",
        "--tb=short",
        "--capture=no"
    ])
    
    if test_results == 0:
        print("\n✅ All tests passed successfully!")
        return True
    else:
        print("\n❌ Some tests failed. Check output above.")
        return False


if __name__ == "__main__":
    # Run tests when script is executed directly
    success = run_comprehensive_tests()
    exit(0 if success else 1)