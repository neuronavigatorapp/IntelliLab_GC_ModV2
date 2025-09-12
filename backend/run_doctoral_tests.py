#!/usr/bin/env python3
"""
Simplified doctoral test runner for demonstration
"""

import sys
import traceback
from datetime import datetime

def test_uncertainty_propagation():
    """Test uncertainty propagation"""
    print("📊 Testing Uncertainty Propagation...")
    
    try:
        from app.services.uncertainty_calculator import uncertainty_calculator
        
        # Test flow uncertainty
        result = uncertainty_calculator.calculate_flow_uncertainty(
            flow=1.2,
            temperature=100.0,
            pressure=25.0
        )
        
        assert "expanded_uncertainty" in result
        assert "±" in result["reported_value"]
        assert result["confidence_level"] == "95%"
        
        print(f"  ✓ Flow uncertainty: {result['reported_value']}")
        print(f"  ✓ Relative uncertainty: {result['relative_uncertainty_percent']:.2f}%")
        print(f"  ✓ Coverage factor: {result['coverage_factor']:.2f}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False


def test_mcreynolds_constants():
    """Test McReynolds constants"""
    print("\n🧪 Testing McReynolds Constants...")
    
    try:
        from app.services.stationary_phases import stationary_phase_selector, CompoundClass
        
        # Test aromatic compound recommendations
        recommendations = stationary_phase_selector.recommend_phase(CompoundClass.AROMATICS)
        
        assert len(recommendations) > 0
        assert "mcreynolds_sum" in recommendations[0]
        
        print(f"  ✓ Aromatic recommendations: {[r['phase'] for r in recommendations[:3]]}")
        
        # Test DB-5 constants
        db5_details = stationary_phase_selector.get_phase_details("DB-5")
        constants = {k: v["value"] for k, v in db5_details["mcreynolds_constants"].items()}
        
        print(f"  ✓ DB-5 McReynolds constants: {constants}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False


def test_sop_generation():
    """Test SOP generation"""
    print("\n📋 Testing SOP Generation...")
    
    try:
        from app.services.sop_generator import sop_generator, SOPMetadata, RegulatoryStandard
        
        # Test regulatory template
        epa_template = sop_generator.generate_regulatory_template(RegulatoryStandard.EPA)
        
        assert "required_sections" in epa_template
        assert len(epa_template["required_sections"]) > 10
        
        print(f"  ✓ EPA template sections: {len(epa_template['required_sections'])}")
        print(f"  ✓ QC requirements: {list(epa_template['qc_requirements'].keys())}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False


def test_lims_integration():
    """Test LIMS integration"""
    print("\n🔗 Testing LIMS Integration...")
    
    try:
        from app.services.lims_integration import (
            lims_service, LIMSType, LIMSCredentials, SampleResult
        )
        
        # Test LIMS registration
        credentials = LIMSCredentials(
            endpoint="http://test-labware.com/api",
            username="test_user",
            password="test_pass"
        )
        
        lims_service.register_lims("test_labware", LIMSType.LABWARE, credentials)
        
        assert "test_labware" in lims_service.connectors
        
        # Test supported formats
        formats = lims_service.get_supported_formats(LIMSType.LABWARE)
        
        print(f"  ✓ LIMS registered: test_labware")
        print(f"  ✓ LabWare formats: {[f.value for f in formats]}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False


def test_method_templates():
    """Test method templates"""
    print("\n📝 Testing Method Templates...")
    
    try:
        from app.services.method_templates import method_template_service, MethodStandard
        
        # Test EPA 8260 template
        template = method_template_service.get_method_template(MethodStandard.EPA_8260)
        
        assert template is not None
        assert template.method_id == "EPA_8260D"
        
        # Test available methods
        methods = method_template_service.get_available_methods()
        
        print(f"  ✓ EPA 8260 template loaded: {template.title}")
        print(f"  ✓ Available methods: {len(methods)}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False


def test_integrated_workflow():
    """Test integrated workflow"""
    print("\n🔄 Testing Integrated Workflow...")
    
    try:
        from app.services.stationary_phases import stationary_phase_selector, CompoundClass
        from app.services.uncertainty_calculator import uncertainty_calculator
        from app.services.method_templates import method_template_service, MethodStandard
        
        # 1. Select phase for pesticides
        phase_recs = stationary_phase_selector.recommend_phase(CompoundClass.PESTICIDES)
        selected_phase = phase_recs[0]["phase"]
        
        # 2. Calculate flow with uncertainty
        flow_uncertainty = uncertainty_calculator.calculate_flow_uncertainty(flow=1.2)
        
        # 3. Get EPA method template
        method = method_template_service.generate_method_from_template(MethodStandard.EPA_8270)
        
        print(f"  ✓ Selected phase for pesticides: {selected_phase}")
        print(f"  ✓ Flow with uncertainty: {flow_uncertainty['reported_value']}")
        print(f"  ✓ EPA method generated: {method['method_id']}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False


def main():
    """Run all doctoral tests"""
    print("🎓 DOCTORAL COMMITTEE EXAMINATION - TESTING PHASE")
    print("=" * 60)
    
    tests = [
        ("Uncertainty Propagation (Dr. Claude)", test_uncertainty_propagation),
        ("McReynolds Constants (Dr. Smith)", test_mcreynolds_constants),
        ("SOP Generation (Dr. Williams)", test_sop_generation),
        ("LIMS Integration (Dr. Williams)", test_lims_integration),
        ("Method Templates (EPA/USP)", test_method_templates),
        ("Integrated Workflow", test_integrated_workflow)
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f"\n❌ {test_name} FAILED: {e}")
            traceback.print_exc()
            failed += 1
    
    print("\n" + "=" * 60)
    print("🏆 DOCTORAL EXAMINATION RESULTS")
    print("=" * 60)
    print(f"✅ PASSED: {passed}")
    print(f"❌ FAILED: {failed}")
    print(f"📊 SUCCESS RATE: {(passed/(passed+failed)*100):.1f}%")
    
    if failed == 0:
        print("\n🎓 ALL TESTS PASSED - READY FOR DOCTORAL COMMITTEE REVIEW!")
        return True
    else:
        print(f"\n⚠️  {failed} TESTS FAILED - NEEDS ATTENTION")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
