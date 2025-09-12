#!/usr/bin/env python3
"""
Comprehensive test suite for doctoral committee requirements
Tests all implemented doctoral defense improvements
"""

import pytest
import numpy as np
from datetime import datetime, timezone
from typing import Dict, List
import json
import asyncio

# Import services to test
from app.services.uncertainty_calculator import uncertainty_calculator, UncertaintyComponent, UncertaintyType
from app.services.stationary_phases import stationary_phase_selector, CompoundClass
from app.services.sop_generator import sop_generator, SOPMetadata, RegulatoryStandard
from app.services.lims_integration import (
    lims_service, LIMSType, LIMSCredentials, SampleResult, 
    LabWareLIMS, StarLIMS, SampleManagerLIMS
)
from app.services.method_templates import method_template_service, MethodStandard
from app.services.compliance_service import ComplianceService, AuditAction, ElectronicSignature


class TestUncertaintyPropagation:
    """Test ISO GUM-compliant uncertainty propagation"""
    
    def test_flow_uncertainty_calculation(self):
        """Test that flow calculations include proper uncertainty"""
        result = uncertainty_calculator.calculate_flow_uncertainty(
            flow=1.2,
            temperature=100.0,
            pressure=25.0,
            flow_accuracy=0.02,
            temperature_uncertainty=1.0,
            pressure_uncertainty=0.5
        )
        
        # Verify uncertainty is provided
        assert "combined_uncertainty" in result
        assert "expanded_uncertainty" in result
        assert "confidence_level" in result
        assert result["confidence_level"] == "95%"
        
        # Verify format includes ± symbol
        assert "±" in result["reported_value"]
        
        # Verify uncertainty budget is provided
        assert "uncertainty_budget" in result
        assert len(result["uncertainty_budget"]) > 0
        
        # Verify relative uncertainty is reasonable (should be < 10% for good measurements)
        assert result["relative_uncertainty_percent"] < 10.0
        
        print(f"✓ Flow uncertainty: {result['reported_value']}")
    
    def test_temperature_uncertainty_calculation(self):
        """Test temperature uncertainty propagation"""
        result = uncertainty_calculator.calculate_temperature_uncertainty(
            temperature=250.0,
            calibration_uncertainty=1.0,
            stability_uncertainty=0.5,
            uniformity_uncertainty=2.0
        )
        
        assert result["expanded_uncertainty"] > result["combined_uncertainty"]
        assert result["coverage_factor"] > 1.0
        assert "uncertainty_budget" in result
        
        # Temperature uncertainty should be dominated by uniformity
        budget = result["uncertainty_budget"]
        uniformity_contribution = next(
            item for item in budget if "Uniformity" in item["component"]
        )["percent_contribution"]
        assert uniformity_contribution > 50.0  # Should be largest contributor
        
        print(f"✓ Temperature uncertainty: {result['reported_value']}")
    
    def test_split_ratio_uncertainty_calculation(self):
        """Test split ratio uncertainty with error propagation"""
        result = uncertainty_calculator.calculate_split_ratio_uncertainty(
            split_flow=50.0,
            column_flow=1.0,
            split_flow_uncertainty=1.0,
            column_flow_uncertainty=0.02
        )
        
        assert "combined_uncertainty" in result
        assert result["nominal_value"] == 50.0  # 50:1 split ratio
        
        # Split flow should dominate uncertainty
        budget = result["uncertainty_budget"]
        split_contribution = next(
            item for item in budget if "Split Flow" in item["component"]
        )["percent_contribution"]
        assert split_contribution > 80.0  # Should be largest contributor
        
        print(f"✓ Split ratio uncertainty: {result['reported_value']}")
    
    def test_uncertainty_components(self):
        """Test individual uncertainty components"""
        component = UncertaintyComponent(
            name="Test Component",
            value=10.0,
            uncertainty=0.1,
            uncertainty_type=UncertaintyType.TYPE_B,
            distribution="rectangular",
            sensitivity_coefficient=1.0
        )
        
        assert component.name == "Test Component"
        assert component.uncertainty_type == UncertaintyType.TYPE_B
        assert component.sensitivity_coefficient == 1.0
        
        print("✓ Uncertainty components working correctly")


class TestMcReynoldsConstants:
    """Test McReynolds constants for stationary phase selection"""
    
    def test_phase_recommendation(self):
        """Test stationary phase recommendation system"""
        recommendations = stationary_phase_selector.recommend_phase(CompoundClass.AROMATICS)
        
        assert len(recommendations) > 0
        assert "mcreynolds_sum" in recommendations[0]
        assert recommendations[0]["phase"] in ["DB-5", "DB-17", "DB-35"]
        
        # Verify McReynolds constants are present
        constants = recommendations[0]["mcreynolds_constants"]
        assert all(key in constants for key in ["X", "Y", "Z", "U", "S"])
        assert all(isinstance(constants[key], int) for key in constants)
        
        print(f"✓ Aromatic compound recommendations: {[r['phase'] for r in recommendations[:3]]}")
    
    def test_mcreynolds_constants_accuracy(self):
        """Test that McReynolds constants match literature values"""
        db5_details = stationary_phase_selector.get_phase_details("DB-5")
        
        # DB-5 literature values (approximately)
        expected_constants = {"X": 32, "Y": 72, "Z": 66, "U": 99, "S": 67}
        actual_constants = {
            k: v["value"] for k, v in db5_details["mcreynolds_constants"].items()
        }
        
        for constant, expected in expected_constants.items():
            actual = actual_constants[constant]
            # Allow ±5 units tolerance for literature variations
            assert abs(actual - expected) <= 5, f"DB-5 {constant} constant mismatch: {actual} vs {expected}"
        
        print(f"✓ DB-5 McReynolds constants verified: {actual_constants}")
    
    def test_phase_comparison(self):
        """Test stationary phase comparison functionality"""
        comparison = stationary_phase_selector.compare_phases(["DB-1", "DB-5", "DB-WAX"])
        
        assert "phases" in comparison
        assert "mcreynolds_comparison" in comparison
        assert "polarity_ranking" in comparison
        
        # Verify polarity ranking (DB-1 < DB-5 < DB-WAX)
        polarity_ranking = comparison["polarity_ranking"]
        db1_polarity = next(p[1] for p in polarity_ranking if p[0] == "DB-1")
        db5_polarity = next(p[1] for p in polarity_ranking if p[0] == "DB-5")
        dbwax_polarity = next(p[1] for p in polarity_ranking if p[0] == "DB-WAX")
        
        assert db1_polarity < db5_polarity < dbwax_polarity
        
        print(f"✓ Phase comparison working: polarity order verified")
    
    def test_compound_class_specificity(self):
        """Test that different compound classes get different recommendations"""
        hydrocarbon_recs = stationary_phase_selector.recommend_phase(CompoundClass.HYDROCARBONS)
        alcohol_recs = stationary_phase_selector.recommend_phase(CompoundClass.ALCOHOLS)
        
        # Hydrocarbons should prefer non-polar phases (DB-1, DB-5)
        hc_phases = [r["phase"] for r in hydrocarbon_recs[:2]]
        assert "DB-1" in hc_phases or "DB-5" in hc_phases
        
        # Alcohols should prefer polar phases (DB-WAX, DB-FFAP)
        alcohol_phases = [r["phase"] for r in alcohol_recs[:2]]
        assert "DB-WAX" in alcohol_phases or "DB-FFAP" in alcohol_phases
        
        print(f"✓ Compound-specific recommendations: HC={hc_phases}, Alcohols={alcohol_phases}")


class TestSOPGenerator:
    """Test SOP generation functionality"""
    
    def test_method_sop_generation(self):
        """Test generation of method SOP"""
        metadata = SOPMetadata(
            sop_number="GC-001",
            title="Test GC Method",
            version="1.0",
            effective_date="2024-01-01",
            author="Test Author",
            reviewer="Test Reviewer",
            approver="Test Approver",
            department="Analytical Chemistry",
            regulatory_standard=RegulatoryStandard.EPA,
            next_review_date="2025-01-01"
        )
        
        method_data = {
            "purpose": "Test method for doctoral committee",
            "gc_model": "Agilent 7890B",
            "column": "DB-5ms",
            "column_dims": "30m x 0.25mm x 0.25μm",
            "detector": "FID",
            "detector_temp": 300,
            "inlet_temp": 250,
            "split_ratio": 50,
            "flow_rate": 1.2,
            "oven_initial": 40,
            "ramp_rate": 10,
            "oven_final": 300
        }
        
        filename = "test_sop.pdf"
        result = sop_generator.generate_method_sop(method_data, metadata, filename)
        
        assert result == filename
        print("✓ SOP generation completed successfully")
    
    def test_regulatory_template_generation(self):
        """Test regulatory template generation"""
        epa_template = sop_generator.generate_regulatory_template(RegulatoryStandard.EPA)
        
        assert "required_sections" in epa_template
        assert "qc_requirements" in epa_template
        assert len(epa_template["required_sections"]) > 10
        
        # EPA should require specific sections
        required_sections = epa_template["required_sections"]
        assert "Quality Control" in required_sections
        assert "Calibration and Standardization" in required_sections
        
        print(f"✓ EPA template has {len(required_sections)} required sections")
    
    def test_sop_completeness_validation(self):
        """Test SOP completeness validation"""
        method_data = {
            "scope": "Test scope",
            "equipment": {"gc": "test"},
            "procedure": ["step 1", "step 2"],
            "qc": {"blanks": "1 per batch"}
        }
        
        validation = sop_generator.validate_sop_completeness(method_data, RegulatoryStandard.EPA)
        
        assert "completeness_score" in validation
        assert "missing_sections" in validation
        assert "recommendations" in validation
        assert validation["completeness_score"] >= 0
        
        print(f"✓ SOP completeness: {validation['completeness_score']}%")


class TestLIMSIntegration:
    """Test LIMS integration functionality"""
    
    def test_lims_service_registration(self):
        """Test LIMS system registration"""
        credentials = LIMSCredentials(
            endpoint="http://test-labware.com/api",
            username="test_user",
            password="test_pass",
            api_key="test_key"
        )
        
        lims_service.register_lims("test_labware", LIMSType.LABWARE, credentials)
        
        assert "test_labware" in lims_service.connectors
        assert isinstance(lims_service.connectors["test_labware"], LabWareLIMS)
        
        print("✓ LIMS registration successful")
    
    def test_sample_result_structure(self):
        """Test sample result data structure"""
        sample_result = SampleResult(
            sample_id="TEST-001",
            sample_name="Test Sample",
            analysis_date=datetime.now(timezone.utc),
            method_name="EPA 8260",
            operator="Test Operator",
            instrument="GC-MS-001",
            results=[
                {
                    "compound_name": "Benzene",
                    "cas_number": "71-43-2",
                    "concentration": 1.23,
                    "units": "μg/L",
                    "detection_limit": 0.1,
                    "uncertainty": 0.12,
                    "flag": ""
                }
            ],
            qc_flags=["Surrogate recovery OK"],
            comments="Test sample for doctoral committee"
        )
        
        assert sample_result.sample_id == "TEST-001"
        assert len(sample_result.results) == 1
        assert sample_result.results[0]["compound_name"] == "Benzene"
        
        print("✓ Sample result structure validated")
    
    def test_supported_formats(self):
        """Test supported data formats for different LIMS"""
        labware_formats = lims_service.get_supported_formats(LIMSType.LABWARE)
        starlims_formats = lims_service.get_supported_formats(LIMSType.STARLIMS)
        
        assert "XML" in [f.value for f in labware_formats]
        assert "JSON" in [f.value for f in starlims_formats]
        
        print(f"✓ LabWare formats: {[f.value for f in labware_formats]}")
        print(f"✓ STARLIMS formats: {[f.value for f in starlims_formats]}")


class TestMethodTemplates:
    """Test EPA/USP method templates"""
    
    def test_epa_8260_template(self):
        """Test EPA 8260 method template"""
        template = method_template_service.get_method_template(MethodStandard.EPA_8260)
        
        assert template is not None
        assert template.method_id == "EPA_8260D"
        assert "purge and trap" in template.principle.lower()
        
        # Verify required components
        assert "DB-624" in template.column_specifications["stationary_phase"]
        assert template.calibration_requirements["calibration_type"] == "Internal standard"
        
        # Check QC requirements
        qc_types = [qc.qc_type for qc in template.qc_requirements]
        assert "Method Blank" in qc_types
        assert "Matrix Spike" in qc_types
        
        print("✓ EPA 8260 template validated")
    
    def test_usp_467_template(self):
        """Test USP 467 method template"""
        template = method_template_service.get_method_template(MethodStandard.USP_467)
        
        assert template is not None
        assert template.method_id == "USP_467"
        assert "residual solvents" in template.title.lower()
        
        # Verify system suitability tests
        sst_parameters = [sst.parameter for sst in template.system_suitability]
        assert "Resolution" in sst_parameters
        assert "Tailing Factor" in sst_parameters
        
        print("✓ USP 467 template validated")
    
    def test_method_compliance_validation(self):
        """Test method compliance validation"""
        method_data = {
            "instrument_requirements": {
                "gc_system": "Test GC",
                "detector": "FID"
            },
            "operating_conditions": {
                "carrier_gas": "Helium",
                "injection_port_temp": 250
            },
            "calibration_requirements": {
                "calibration_type": "External standard",
                "calibration_levels": 5
            },
            "qc_requirements": [
                {"qc_type": "Method Blank"}
            ],
            "system_suitability": [
                {"parameter": "Resolution"}
            ]
        }
        
        validation = method_template_service.validate_method_compliance(
            method_data, MethodStandard.EPA_8260
        )
        
        assert "compliance_score" in validation
        assert validation["compliance_score"] >= 0
        assert "compliance_issues" in validation
        
        print(f"✓ Method compliance: {validation['compliance_score']}%")
    
    def test_method_generation_from_template(self):
        """Test method generation from template"""
        customizations = {
            "operating_conditions": {
                "carrier_flow": "1.5 mL/min",
                "detector_temp": "320°C"
            }
        }
        
        method = method_template_service.generate_method_from_template(
            MethodStandard.USP_467, customizations
        )
        
        assert "method_id" in method
        assert method["standard"] == "USP_467"
        assert method["operating_conditions"]["detector_temp"] == "320°C"
        
        print("✓ Method generation from template successful")


class TestIntegratedWorkflow:
    """Test integrated workflow combining all doctoral requirements"""
    
    def test_complete_analytical_workflow(self):
        """Test complete workflow with uncertainty, McReynolds, and compliance"""
        
        # 1. Select stationary phase based on compound class
        phase_recs = stationary_phase_selector.recommend_phase(CompoundClass.PESTICIDES)
        selected_phase = phase_recs[0]["phase"]
        
        # 2. Calculate flow rate with uncertainty
        flow_uncertainty = uncertainty_calculator.calculate_flow_uncertainty(
            flow=1.2,
            temperature=250.0,
            pressure=20.0
        )
        
        # 3. Generate method from EPA template
        method = method_template_service.generate_method_from_template(
            MethodStandard.EPA_8270,
            customizations={
                "column_specifications": {"stationary_phase": selected_phase},
                "operating_conditions": {"carrier_flow_uncertainty": flow_uncertainty["reported_value"]}
            }
        )
        
        # 4. Validate compliance
        compliance = method_template_service.validate_method_compliance(
            method, MethodStandard.EPA_8270
        )
        
        # Verify integrated results
        assert selected_phase in ["DB-5", "DB-1701", "DB-17"]  # Good for pesticides
        assert "±" in flow_uncertainty["reported_value"]  # Has uncertainty
        assert method["standard"] == "EPA_8270"
        assert compliance["compliance_score"] > 80  # Should be mostly compliant
        
        print("✓ Integrated analytical workflow completed successfully")
        print(f"  Selected phase: {selected_phase}")
        print(f"  Flow with uncertainty: {flow_uncertainty['reported_value']}")
        print(f"  Compliance score: {compliance['compliance_score']}%")
    
    def test_regulatory_documentation_package(self):
        """Test complete regulatory documentation package"""
        
        # Generate method from template
        method = method_template_service.generate_method_from_template(MethodStandard.EPA_8260)
        
        # Create SOP
        metadata = SOPMetadata(
            sop_number="EPA-8260-001",
            title="Volatile Organic Compounds by GC/MS",
            version="1.0",
            effective_date=datetime.now().strftime("%Y-%m-%d"),
            author="Analytical Chemist",
            reviewer="QA Manager",
            approver="Laboratory Director",
            department="Environmental Chemistry",
            regulatory_standard=RegulatoryStandard.EPA,
            next_review_date="2025-12-31"
        )
        
        sop_filename = "epa_8260_sop.pdf"
        sop_result = sop_generator.generate_method_sop(method, metadata, sop_filename)
        
        # Validate completeness
        sop_validation = sop_generator.validate_sop_completeness(method, RegulatoryStandard.EPA)
        
        assert sop_result == sop_filename
        assert sop_validation["compliance_status"] in ["COMPLIANT", "NON_COMPLIANT"]
        
        print("✓ Complete regulatory documentation package generated")
        print(f"  SOP file: {sop_result}")
        print(f"  SOP compliance: {sop_validation['compliance_status']}")


def run_doctoral_tests():
    """Run all doctoral committee tests"""
    print("🎓 DOCTORAL COMMITTEE EXAMINATION - TESTING PHASE")
    print("=" * 60)
    
    # Initialize test classes
    uncertainty_tests = TestUncertaintyPropagation()
    mcreynolds_tests = TestMcReynoldsConstants()
    sop_tests = TestSOPGenerator()
    lims_tests = TestLIMSIntegration()
    template_tests = TestMethodTemplates()
    workflow_tests = TestIntegratedWorkflow()
    
    test_results = []
    
    try:
        print("\n📊 Testing Uncertainty Propagation (Dr. Claude's Requirements)")
        print("-" * 50)
        uncertainty_tests.test_flow_uncertainty_calculation()
        uncertainty_tests.test_temperature_uncertainty_calculation()
        uncertainty_tests.test_split_ratio_uncertainty_calculation()
        uncertainty_tests.test_uncertainty_components()
        test_results.append("✅ Uncertainty Propagation: PASSED")
        
        print("\n🧪 Testing McReynolds Constants (Dr. Smith's Requirements)")
        print("-" * 50)
        mcreynolds_tests.test_phase_recommendation()
        mcreynolds_tests.test_mcreynolds_constants_accuracy()
        mcreynolds_tests.test_phase_comparison()
        mcreynolds_tests.test_compound_class_specificity()
        test_results.append("✅ McReynolds Constants: PASSED")
        
        print("\n📋 Testing SOP Generation (Dr. Williams' Requirements)")
        print("-" * 50)
        sop_tests.test_method_sop_generation()
        sop_tests.test_regulatory_template_generation()
        sop_tests.test_sop_completeness_validation()
        test_results.append("✅ SOP Generation: PASSED")
        
        print("\n🔗 Testing LIMS Integration (Dr. Williams' Requirements)")
        print("-" * 50)
        lims_tests.test_lims_service_registration()
        lims_tests.test_sample_result_structure()
        lims_tests.test_supported_formats()
        test_results.append("✅ LIMS Integration: PASSED")
        
        print("\n📝 Testing Method Templates (EPA/USP Requirements)")
        print("-" * 50)
        template_tests.test_epa_8260_template()
        template_tests.test_usp_467_template()
        template_tests.test_method_compliance_validation()
        template_tests.test_method_generation_from_template()
        test_results.append("✅ Method Templates: PASSED")
        
        print("\n🔄 Testing Integrated Workflows")
        print("-" * 50)
        workflow_tests.test_complete_analytical_workflow()
        workflow_tests.test_regulatory_documentation_package()
        test_results.append("✅ Integrated Workflows: PASSED")
        
        print("\n" + "=" * 60)
        print("🏆 DOCTORAL EXAMINATION RESULTS")
        print("=" * 60)
        
        for result in test_results:
            print(result)
        
        print(f"\n📈 OVERALL STATUS: {len(test_results)}/6 TEST SUITES PASSED")
        print("🎓 READY FOR DOCTORAL COMMITTEE REVIEW")
        
        return True
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {str(e)}")
        return False


if __name__ == "__main__":
    success = run_doctoral_tests()
    exit(0 if success else 1)
