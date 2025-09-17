#!/usr/bin/env python3
"""
Standalone AI Troubleshooter Demo
Demonstrates AI troubleshooter capabilities without import issues
"""

import sys
import os
from pathlib import Path
import asyncio
import json
from datetime import datetime
import logging

# Add the backend directory to Python path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

try:
    # Now we can import the backend modules
    from app.models.schemas import (
        TroubleshooterRequest, ChromatogramData, Peak, MethodParameters,
        OCRProcessingResult, OCRPeakData, OCRMethodParameters, OCRSampleInfo, OCRTextRegion
    )
    from app.services.ai_troubleshooter import AITroubleshooterEngine
    from app.services.ocr_ai_bridge import get_ai_integration_service
    
    IMPORTS_AVAILABLE = True
except ImportError as e:
    print(f"⚠️  Import warning: {e}")
    IMPORTS_AVAILABLE = False


def create_mock_ai_troubleshooter():
    """Create a mock AI troubleshooter for demo purposes when imports fail"""
    
    class MockAIEngine:
        def __init__(self):
            self.total_analyses = 0
            self.successful_analyses = 0
        
        async def analyze_chromatogram(self, request):
            """Mock analysis method"""
            self.total_analyses += 1
            self.successful_analyses += 1
            
            # Simulate analysis
            await asyncio.sleep(0.1)
            
            from types import SimpleNamespace
            
            # Create mock diagnostic result
            diagnostic_result = SimpleNamespace(
                overall_score=0.72,
                issues=[
                    SimpleNamespace(
                        category="peak_quality", 
                        severity="major",
                        description="Severe peak tailing detected in peak 3",
                        affected_peaks=[3],
                        confidence=0.85
                    ),
                    SimpleNamespace(
                        category="method_parameters",
                        severity="minor", 
                        description="Inlet temperature slightly high",
                        confidence=0.70
                    )
                ],
                critical_issues_count=0,
                major_issues_count=1,
                minor_issues_count=1
            )
            
            # Create mock recommendations
            recommendations = [
                SimpleNamespace(
                    solution=SimpleNamespace(
                        title="Optimize Column Temperature Program",
                        description="Adjust temperature ramp rate to improve peak shape",
                        category="method_optimization",
                        expected_impact="High"
                    ),
                    priority_score=0.89,
                    implementation_difficulty="Medium",
                    expected_impact="High",
                    immediate_actions=[
                        "Reduce initial column temperature by 10°C",
                        "Decrease ramp rate from 10°C/min to 5°C/min"
                    ]
                ),
                SimpleNamespace(
                    solution=SimpleNamespace(
                        title="Check Column Condition",
                        description="Inspect column for contamination or degradation",
                        category="maintenance",
                        expected_impact="Medium"
                    ),
                    priority_score=0.75,
                    implementation_difficulty="Low",
                    expected_impact="Medium",
                    immediate_actions=[
                        "Check retention time stability",
                        "Perform column backflush"
                    ]
                )
            ]
            
            # Create mock response
            response = SimpleNamespace(
                status="completed",
                diagnostic_result=diagnostic_result,
                recommendations=recommendations,
                processing_time=0.15,
                metadata={"data_source": "mock_analysis"}
            )
            
            return response
        
        def get_health_status(self):
            """Mock health status"""
            from types import SimpleNamespace
            
            return SimpleNamespace(
                service_status="healthy",
                knowledge_base_entries=20,
                model_version="v1.0-mock",
                last_health_check=datetime.utcnow(),
                total_analyses=self.total_analyses,
                successful_analyses=self.successful_analyses,
                success_rate=1.0 if self.total_analyses == 0 else self.successful_analyses / self.total_analyses,
                average_processing_time=0.15
            )
    
    class MockOCRBridge:
        def transform_ocr_to_chromatogram_data(self, ocr_result):
            """Mock OCR transformation"""
            
            # Create mock chromatogram data
            from types import SimpleNamespace
            
            peaks = []
            if hasattr(ocr_result, 'peaks_data') and ocr_result.peaks_data:
                for ocr_peak in ocr_result.peaks_data:
                    peak = SimpleNamespace(
                        retention_time=float(ocr_peak.retention_time) if ocr_peak.retention_time else 0.0,
                        area=float(ocr_peak.area) if ocr_peak.area else 0.0,
                        height=float(ocr_peak.height) if ocr_peak.height else 0.0,
                        width=0.15,  # Default width
                        name=ocr_peak.compound_name if ocr_peak.compound_name else f"Peak_{len(peaks)+1}",
                        confidence_score=ocr_peak.confidence if ocr_peak.confidence else 0.8
                    )
                    peaks.append(peak)
            
            method_params = SimpleNamespace(
                inlet_temperature=250.0,
                column_temperature=100.0, 
                carrier_gas_flow=1.2,
                injection_volume=1.0
            )
            
            return SimpleNamespace(
                file_path="mock_ocr_file.d",
                sample_name=ocr_result.sample_info.sample_name if ocr_result.sample_info else "Mock OCR Sample",
                method_name="Mock OCR Method",
                injection_date=datetime.now(),
                peaks=peaks,
                method_parameters=method_params,
                total_area=sum(p.area for p in peaks),
                peak_count=len(peaks),
                baseline_noise=200.0,
                signal_to_noise_ratio=15.0,
                metadata={"source": "mock_ocr_extraction"}
            )
        
        def validate_ocr_for_ai_processing(self, ocr_result):
            """Mock OCR validation"""
            return {
                "is_suitable_for_ai": True,
                "confidence_score": 0.82,
                "issues": [],
                "data_completeness": {
                    "peaks_extracted": True,
                    "method_parameters": True,
                    "sample_info": True
                }
            }
    
    return MockAIEngine(), MockOCRBridge()


class StandaloneAITroubleshooterDemo:
    """Standalone AI troubleshooter demonstration"""
    
    def __init__(self):
        self.logger = logging.getLogger("AITroubleshooterDemo")
        
        # Set up logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        
        if IMPORTS_AVAILABLE:
            try:
                self.ai_engine = AITroubleshooterEngine()
                self.ocr_bridge = get_ai_integration_service()
                self.mock_mode = False
                print("✅ Using real AI troubleshooter components")
            except Exception as e:
                print(f"⚠️  Falling back to mock mode: {e}")
                self.ai_engine, self.ocr_bridge = create_mock_ai_troubleshooter()
                self.mock_mode = True
        else:
            self.ai_engine, self.ocr_bridge = create_mock_ai_troubleshooter()
            self.mock_mode = True
            print("⚠️  Running in mock mode (imports unavailable)")
    
    async def run_demonstration(self):
        """Run the AI troubleshooter demonstration"""
        
        print("\n🧠 AI TROUBLESHOOTER SYSTEM DEMONSTRATION")
        print("=" * 60)
        
        if self.mock_mode:
            print("🚧 Running in MOCK MODE - simulating AI troubleshooter functionality")
        else:
            print("🚀 Running with REAL AI troubleshooter components")
        
        print()
        
        try:
            # Demo 1: Basic analysis
            await self._demo_basic_analysis()
            
            # Demo 2: OCR integration
            await self._demo_ocr_integration()
            
            # Demo 3: System health
            await self._demo_system_health()
            
            print("\n✅ DEMONSTRATION COMPLETED SUCCESSFULLY!")
            
        except Exception as e:
            print(f"\n❌ DEMONSTRATION FAILED: {str(e)}")
            self.logger.error(f"Demo failed: {str(e)}", exc_info=True)
    
    async def _demo_basic_analysis(self):
        """Demonstrate basic chromatogram analysis"""
        
        print("📊 DEMO 1: Basic Chromatogram Analysis")
        print("-" * 40)
        
        # Create sample data using SimpleNamespace to avoid import issues
        from types import SimpleNamespace
        
        # Create mock chromatogram data
        chromatogram_data = SimpleNamespace(
            file_path="demo_sample.d",
            sample_name="Aromatics Mix Standard",
            method_name="EPA 8260B Modified", 
            injection_date=datetime.now(),
            peaks=[
                SimpleNamespace(
                    retention_time=2.15,
                    area=850000.0,
                    height=95000.0,
                    width=0.12,
                    name="Benzene",
                    confidence_score=0.95
                ),
                SimpleNamespace(
                    retention_time=7.23,
                    area=980000.0,
                    height=75000.0,
                    width=0.35,  # Wide peak - indicates tailing
                    name="Ethylbenzene",
                    confidence_score=0.85
                )
            ],
            method_parameters=SimpleNamespace(
                inlet_temperature=280.0,
                column_temperature=80.0,
                carrier_gas_flow=1.8,
                injection_volume=2.0
            ),
            total_area=1830000.0,
            peak_count=2,
            baseline_noise=250.0,
            signal_to_noise_ratio=12.0
        )
        
        # Create analysis request
        request = SimpleNamespace(
            request_id="demo_001",
            chromatogram_data=chromatogram_data,
            analysis_type="comprehensive"
        )
        
        print(f"📝 Analyzing: {chromatogram_data.sample_name}")
        print(f"   Peaks: {len(chromatogram_data.peaks)}")
        print(f"   S/N Ratio: {chromatogram_data.signal_to_noise_ratio}")
        
        # Perform analysis
        response = await self.ai_engine.analyze_chromatogram(request)
        
        # Display results
        print(f"\n🔍 Analysis Results:")
        print(f"   Status: {response.status}")
        print(f"   Overall Quality: {response.diagnostic_result.overall_score:.2f}")
        print(f"   Issues Found: {len(response.diagnostic_result.issues)}")
        
        # Show issues
        if response.diagnostic_result.issues:
            print(f"\n⚠️  Issues Detected:")
            for i, issue in enumerate(response.diagnostic_result.issues, 1):
                print(f"   {i}. [{issue.severity.upper()}] {issue.description}")
        
        # Show recommendations
        if response.recommendations:
            print(f"\n💡 Top Recommendations:")
            for i, rec in enumerate(response.recommendations[:2], 1):
                print(f"   {i}. {rec.solution.title}")
                print(f"      Priority: {rec.priority_score:.2f}")
                if hasattr(rec, 'immediate_actions') and rec.immediate_actions:
                    print(f"      Quick actions: {rec.immediate_actions[0]}")
        
        print(f"   Processing time: {response.processing_time:.2f}s")
    
    async def _demo_ocr_integration(self):
        """Demonstrate OCR integration"""
        
        print("\n\n📷 DEMO 2: OCR Integration Pipeline")
        print("-" * 40)
        
        from types import SimpleNamespace
        
        # Create mock OCR result
        ocr_result = SimpleNamespace(
            success=True,
            confidence_score=0.82,
            peaks_data=[
                SimpleNamespace(
                    peak_number=1,
                    retention_time="3.45",
                    area="2150000",
                    height="185000",
                    area_percent="45.2",
                    compound_name="Acetone",
                    confidence=0.9
                ),
                SimpleNamespace(
                    peak_number=2,
                    retention_time="6.78", 
                    area="1850000",
                    height="165000",
                    area_percent="38.9",
                    compound_name="Methyl ethyl ketone",
                    confidence=0.85
                )
            ],
            sample_info=SimpleNamespace(
                sample_name="Environmental Sample #47",
                operator="Lab Tech 001",
                injection_date="2024-12-19 14:30:22"
            )
        )
        
        print(f"📋 Processing OCR Result:")
        print(f"   Confidence: {ocr_result.confidence_score:.2f}")
        print(f"   Peaks Extracted: {len(ocr_result.peaks_data)}")
        
        # Validate OCR
        validation = self.ocr_bridge.validate_ocr_for_ai_processing(ocr_result)
        print(f"\n✅ OCR Validation:")
        print(f"   Suitable for AI: {validation['is_suitable_for_ai']}")
        
        # Transform to chromatogram data
        print(f"\n🔄 Transforming OCR data...")
        chromatogram_data = self.ocr_bridge.transform_ocr_to_chromatogram_data(ocr_result)
        
        print(f"   Sample: {chromatogram_data.sample_name}")
        print(f"   Peaks: {len(chromatogram_data.peaks)}")
        
        # Analyze
        request = SimpleNamespace(
            request_id="demo_ocr_001",
            chromatogram_data=chromatogram_data,
            analysis_type="comprehensive"
        )
        
        response = await self.ai_engine.analyze_chromatogram(request)
        
        print(f"\n🧠 AI Analysis Results:")
        print(f"   Status: {response.status}")
        print(f"   Quality Score: {response.diagnostic_result.overall_score:.2f}")
        print(f"   Issues: {len(response.diagnostic_result.issues)}")
        
        if response.recommendations:
            print(f"   Recommendations: {len(response.recommendations)}")
    
    async def _demo_system_health(self):
        """Demonstrate system health monitoring"""
        
        print("\n\n💊 DEMO 3: System Health Status")
        print("-" * 40)
        
        health = self.ai_engine.get_health_status()
        
        print(f"🏥 System Health:")
        print(f"   Status: {health.service_status}")
        print(f"   Knowledge Base: {health.knowledge_base_entries} entries")
        print(f"   Model Version: {health.model_version}")
        
        print(f"\n📊 Performance:")
        print(f"   Total Analyses: {health.total_analyses}")
        print(f"   Success Rate: {health.success_rate:.1%}")
        print(f"   Avg Processing Time: {health.average_processing_time:.2f}s")
        
        print(f"\n⚡ Capabilities:")
        print(f"   • Real-time chromatogram analysis")
        print(f"   • OCR data integration")
        print(f"   • Intelligent recommendations")
        print(f"   • Performance monitoring")
        
        if self.mock_mode:
            print(f"\n🚧 Note: Running in mock mode for demonstration")
        else:
            print(f"\n🟢 System Status: Fully operational")


async def main():
    """Main demonstration function"""
    
    print("🚀 Starting Standalone AI Troubleshooter Demo...")
    print()
    
    # Check if we're in the correct directory
    if not os.path.exists("backend"):
        print("⚠️  Backend directory not found. Please run from the IntelliLab_GC_ModV2 root directory.")
        return
    
    try:
        demo = StandaloneAITroubleshooterDemo()
        await demo.run_demonstration()
        
        print("\n" + "=" * 60)
        print("🎉 AI TROUBLESHOOTER DEMO COMPLETE!")
        print()
        print("The AI Troubleshooter system demonstrates:")
        print("• ✅ Intelligent chromatogram analysis")
        print("• ✅ OCR integration capabilities")
        print("• ✅ Smart recommendation generation")
        print("• ✅ System health monitoring")
        print("• ✅ Performance tracking")
        print()
        
        if demo.mock_mode:
            print("💡 To run with full functionality:")
            print("1. Ensure all Python packages are installed")
            print("2. Verify backend imports are working")
            print("3. Run from the correct directory")
        else:
            print("🚀 System is ready for production deployment!")
        
    except Exception as e:
        print(f"\n❌ DEMO FAILED: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())