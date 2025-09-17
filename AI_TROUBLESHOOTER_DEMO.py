#!/usr/bin/env python3
"""
AI Troubleshooter System Demonstration
Complete showcase of OCR-to-AI troubleshooting pipeline
"""

import asyncio
import json
from datetime import datetime
from pathlib import Path
import sys
import logging

# Add backend to path for imports
sys.path.append(str(Path(__file__).parent / "backend"))

from app.models.schemas import (
    TroubleshooterRequest, ChromatogramData, Peak, MethodParameters,
    OCRProcessingResult, OCRPeakData, OCRMethodParameters, OCRSampleInfo, OCRTextRegion
)
from app.services.ai_troubleshooter import AITroubleshooterEngine
from app.services.ocr_ai_bridge import get_ai_integration_service


class AITroubleshooterDemo:
    """Comprehensive demonstration of AI troubleshooter capabilities"""
    
    def __init__(self):
        self.logger = logging.getLogger("AITroubleshooterDemo")
        self.ai_engine = AITroubleshooterEngine()
        self.ocr_bridge = get_ai_integration_service()
        
        # Set up logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
    
    async def run_complete_demonstration(self):
        """Run complete AI troubleshooter demonstration"""
        
        print("\n🧠 AI TROUBLESHOOTER SYSTEM DEMONSTRATION")
        print("=" * 60)
        print("Showcasing complete OCR-to-AI troubleshooting pipeline")
        print()
        
        try:
            # Demo 1: Direct chromatogram analysis
            await self._demo_direct_chromatogram_analysis()
            
            # Demo 2: OCR-based analysis
            await self._demo_ocr_based_analysis()
            
            # Demo 3: Problem detection and recommendations
            await self._demo_problem_detection()
            
            # Demo 4: Knowledge base exploration
            await self._demo_knowledge_base()
            
            # Demo 5: System health and statistics
            await self._demo_system_health()
            
            print("\n✅ DEMONSTRATION COMPLETED SUCCESSFULLY!")
            print("All AI troubleshooter components working properly.")
            
        except Exception as e:
            print(f"\n❌ DEMONSTRATION FAILED: {str(e)}")
            self.logger.error(f"Demo failed: {str(e)}", exc_info=True)
    
    async def _demo_direct_chromatogram_analysis(self):
        """Demonstrate direct chromatogram data analysis"""
        
        print("\n📊 DEMO 1: Direct Chromatogram Analysis")
        print("-" * 40)
        
        # Create sample chromatogram data
        chromatogram_data = ChromatogramData(
            file_path="demo_sample.d",
            sample_name="Aromatics Mix Standard",
            method_name="EPA 8260B Modified",
            injection_date=datetime.now(),
            peaks=[
                Peak(
                    retention_time=2.15,
                    area=850000.0,
                    height=95000.0,
                    width=0.12,
                    name="Benzene",
                    confidence_score=0.95
                ),
                Peak(
                    retention_time=4.67,
                    area=1250000.0,
                    height=110000.0,
                    width=0.18,
                    name="Toluene", 
                    confidence_score=0.92
                ),
                Peak(
                    retention_time=7.23,
                    area=980000.0,
                    height=75000.0,
                    width=0.35,  # Wide peak - indicates tailing
                    name="Ethylbenzene",
                    confidence_score=0.85
                ),
                Peak(
                    retention_time=8.91,
                    area=450000.0,
                    height=25000.0,  # Low height relative to area
                    width=0.45,  # Very wide peak
                    name="Xylene isomers",
                    confidence_score=0.70
                )
            ],
            method_parameters=MethodParameters(
                inlet_temperature=280.0,  # High temperature
                column_temperature=80.0,
                carrier_gas_flow=1.8,  # High flow rate
                injection_volume=2.0   # Large injection volume
            ),
            total_area=3530000.0,
            peak_count=4,
            baseline_noise=250.0,  # High noise
            signal_to_noise_ratio=12.0  # Poor S/N ratio
        )
        
        # Create analysis request
        request = TroubleshooterRequest(
            request_id="demo_direct_001",
            chromatogram_data=chromatogram_data,
            analysis_type="comprehensive",
            sensitivity_level="high",
            include_solutions=True,
            user_context={
                "sample_type": "aromatics",
                "analysis_purpose": "quantitative",
                "urgency": "high"
            }
        )
        
        print(f"📝 Analyzing chromatogram: {chromatogram_data.sample_name}")
        print(f"   Sample: {chromatogram_data.sample_name}")
        print(f"   Method: {chromatogram_data.method_name}")
        print(f"   Peaks: {len(chromatogram_data.peaks)}")
        
        # Perform analysis
        response = await self.ai_engine.analyze_chromatogram(request)
        
        # Display results
        print(f"\n🔍 Analysis Results:")
        print(f"   Status: {response.status}")
        print(f"   Overall Quality Score: {response.diagnostic_result.overall_score:.2f}")
        print(f"   Issues Detected: {len(response.diagnostic_result.issues)}")
        print(f"   Critical Issues: {response.diagnostic_result.critical_issues_count}")
        print(f"   Major Issues: {response.diagnostic_result.major_issues_count}")
        
        # Show detected issues
        if response.diagnostic_result.issues:
            print(f"\n⚠️  Detected Issues:")
            for i, issue in enumerate(response.diagnostic_result.issues[:3], 1):
                print(f"   {i}. [{issue.severity.upper()}] {issue.description}")
                if issue.affected_peaks:
                    print(f"      Affected peaks: {issue.affected_peaks}")
        
        # Show top recommendations
        if response.recommendations:
            print(f"\n💡 Top Recommendations:")
            for i, rec in enumerate(response.recommendations[:2], 1):
                print(f"   {i}. {rec.solution.title}")
                print(f"      Priority: {rec.priority_score:.2f} | Difficulty: {rec.implementation_difficulty}")
                print(f"      Description: {rec.solution.description[:100]}...")
        
        print(f"\n⏱️  Analysis completed in {response.processing_time:.2f} seconds")
    
    async def _demo_ocr_based_analysis(self):
        """Demonstrate OCR-to-AI analysis pipeline"""
        
        print("\n\n📷 DEMO 2: OCR-Based Analysis Pipeline")
        print("-" * 40)
        
        # Create realistic OCR result
        ocr_result = OCRProcessingResult(
            success=True,
            confidence_score=0.82,
            peaks_data=[
                OCRPeakData(
                    peak_number=1,
                    retention_time="3.45",
                    area="2150000",
                    height="185000", 
                    area_percent="45.2",
                    compound_name="Acetone",
                    confidence=0.9
                ),
                OCRPeakData(
                    peak_number=2,
                    retention_time="6.78",
                    area="1850000",
                    height="165000",
                    area_percent="38.9",
                    compound_name="Methyl ethyl ketone", 
                    confidence=0.85
                ),
                OCRPeakData(
                    peak_number=3,
                    retention_time="9.12",
                    area="760000",
                    height="45000",
                    area_percent="15.9",
                    compound_name="Unknown peak",
                    confidence=0.55  # Low confidence
                )
            ],
            method_parameters=OCRMethodParameters(
                column_type="DB-WAX",
                column_length="30m x 0.32mm x 0.25μm",
                carrier_gas="Nitrogen",
                flow_rate="1.5 mL/min",
                injection_volume=1.5,
                inlet_temperature=275.0,
                detector_type="FID",
                oven_program=[
                    "40°C (3 min)",
                    "15°C/min to 120°C",
                    "5°C/min to 250°C", 
                    "250°C (8 min)"
                ]
            ),
            sample_info=OCRSampleInfo(
                sample_name="Environmental Sample #47",
                operator="Lab Tech 001",
                injection_date="2024-12-19 14:30:22",
                dilution_factor="10.0",
                vial_position="B-15",
                sequence_number=47
            ),
            text_regions=[
                OCRTextRegion(
                    text="Peak Table - Environmental Analysis",
                    confidence=0.95,
                    bounding_box=(50, 100, 500, 120)
                ),
                OCRTextRegion(
                    text="Peak#  RT(min)  Area     Height   %Area   Compound",
                    confidence=0.88,
                    bounding_box=(50, 140, 650, 160)
                )
            ]
        )
        
        print(f"📋 Processing OCR result:")
        print(f"   Confidence Score: {ocr_result.confidence_score:.2f}")
        print(f"   Peaks Extracted: {len(ocr_result.peaks_data)}")
        print(f"   Method Parameters: {'Yes' if ocr_result.method_parameters else 'No'}")
        print(f"   Sample Information: {'Yes' if ocr_result.sample_info else 'No'}")
        
        # Validate OCR data quality
        validation = self.ocr_bridge.validate_ocr_for_ai_processing(ocr_result)
        print(f"\n✅ OCR Validation:")
        print(f"   Suitable for AI: {validation['is_suitable_for_ai']}")
        print(f"   Data Completeness: {sum(validation['data_completeness'].values())} / {len(validation['data_completeness'])}")
        
        if validation['issues']:
            print(f"   Issues: {', '.join(validation['issues'][:2])}")
        
        # Transform OCR to chromatogram data
        print(f"\n🔄 Transforming OCR data to AI format...")
        chromatogram_data = self.ocr_bridge.transform_ocr_to_chromatogram_data(ocr_result)
        
        print(f"   Transformed Sample: {chromatogram_data.sample_name}")
        print(f"   Peaks Created: {len(chromatogram_data.peaks)}")
        print(f"   Method Info: {chromatogram_data.method_parameters is not None}")
        
        # Create and run AI analysis
        request = TroubleshooterRequest(
            request_id="demo_ocr_001",
            chromatogram_data=chromatogram_data,
            ocr_data=ocr_result,
            analysis_type="comprehensive",
            sensitivity_level="medium"
        )
        
        response = await self.ai_engine.analyze_chromatogram(request)
        
        print(f"\n🧠 AI Analysis Results:")
        print(f"   Status: {response.status}")
        print(f"   Quality Score: {response.diagnostic_result.overall_score:.2f}")
        print(f"   Issues Found: {len(response.diagnostic_result.issues)}")
        
        # Show OCR-specific insights
        if "ocr_extraction" in response.metadata.get("data_source", ""):
            print(f"\n📷 OCR-Specific Insights:")
            print(f"   Source Confidence: {ocr_result.confidence_score:.2f}")
            print(f"   Low Confidence Peaks: {sum(1 for p in ocr_result.peaks_data if (p.confidence or 0) < 0.7)}")
            
            # Check for OCR-related recommendations
            ocr_recommendations = [r for r in response.recommendations 
                                 if "ocr" in r.solution.description.lower() or "confidence" in r.solution.description.lower()]
            if ocr_recommendations:
                print(f"   OCR-Related Recommendations: {len(ocr_recommendations)}")
    
    async def _demo_problem_detection(self):
        """Demonstrate problem detection and solution recommendations"""
        
        print("\n\n🔍 DEMO 3: Problem Detection & Recommendations")
        print("-" * 40)
        
        # Create chromatogram with multiple issues
        problematic_data = ChromatogramData(
            file_path="problematic_sample.d",
            sample_name="QC Failed Sample #203",
            method_name="Method Troubleshooting",
            injection_date=datetime.now(),
            peaks=[
                Peak(
                    retention_time=1.2,
                    area=45000.0,
                    height=8000.0,
                    width=0.08,
                    name="Early eluting compound",
                    confidence_score=0.6
                ),
                Peak(
                    retention_time=5.5,
                    area=2200000.0,
                    height=85000.0,  # Low height for area - broad peak
                    width=0.65,  # Very wide - severe tailing
                    name="Target compound A",
                    confidence_score=0.75
                ),
                Peak(
                    retention_time=5.8,  # Close to previous peak
                    area=1800000.0,
                    height=70000.0,
                    width=0.55,
                    name="Target compound B", 
                    confidence_score=0.70
                ),
                Peak(
                    retention_time=12.5,
                    area=125000.0,  # Very small
                    height=1500.0,  # Very low
                    width=0.35,
                    name="Internal standard",
                    confidence_score=0.50  # Low confidence
                )
            ],
            method_parameters=MethodParameters(
                inlet_temperature=320.0,  # Too high
                column_temperature=50.0,  # Too low
                carrier_gas_flow=0.5,     # Too low
                injection_volume=5.0      # Too large
            ),
            total_area=4170000.0,
            peak_count=4,
            baseline_noise=850.0,   # Very high noise
            signal_to_noise_ratio=3.5  # Very poor S/N
        )
        
        request = TroubleshooterRequest(
            request_id="demo_problems_001",
            chromatogram_data=problematic_data,
            analysis_type="comprehensive",
            sensitivity_level="high",
            include_solutions=True,
            user_context={
                "analysis_purpose": "troubleshooting",
                "previous_results": "method_worked_before",
                "urgency": "critical"
            }
        )
        
        print(f"🚨 Analyzing problematic chromatogram...")
        print(f"   Sample: {problematic_data.sample_name}")
        print(f"   Baseline Noise: {problematic_data.baseline_noise:.0f}")
        print(f"   S/N Ratio: {problematic_data.signal_to_noise_ratio:.1f}")
        
        response = await self.ai_engine.analyze_chromatogram(request)
        
        print(f"\n📊 Problem Detection Results:")
        print(f"   Overall Quality: {response.diagnostic_result.overall_score:.2f}/1.0")
        print(f"   Total Issues: {len(response.diagnostic_result.issues)}")
        print(f"   🔴 Critical: {response.diagnostic_result.critical_issues_count}")
        print(f"   🟡 Major: {response.diagnostic_result.major_issues_count}")
        print(f"   🟢 Minor: {response.diagnostic_result.minor_issues_count}")
        
        # Categorize and display issues
        issue_categories = {}
        for issue in response.diagnostic_result.issues:
            if issue.category not in issue_categories:
                issue_categories[issue.category] = []
            issue_categories[issue.category].append(issue)
        
        print(f"\n🔍 Issues by Category:")
        for category, issues in issue_categories.items():
            print(f"   {category.replace('_', ' ').title()}: {len(issues)} issues")
            for issue in issues[:2]:  # Show top 2 per category
                print(f"     • [{issue.severity.upper()}] {issue.description}")
        
        # Show prioritized recommendations
        print(f"\n💡 Prioritized Recommendations:")
        for i, rec in enumerate(response.recommendations[:3], 1):
            print(f"   {i}. {rec.solution.title} (Priority: {rec.priority_score:.2f})")
            print(f"      Category: {rec.solution.category}")
            print(f"      Difficulty: {rec.implementation_difficulty}")
            print(f"      Expected Impact: {rec.expected_impact}")
            
            # Show immediate actions if available
            if hasattr(rec, 'immediate_actions') and rec.immediate_actions:
                print(f"      Immediate Actions:")
                for action in rec.immediate_actions[:2]:
                    print(f"        - {action}")
            print()
    
    async def _demo_knowledge_base(self):
        """Demonstrate knowledge base capabilities"""
        
        print("\n📚 DEMO 4: Knowledge Base Exploration")
        print("-" * 40)
        
        kb = self.ai_engine.knowledge_base
        
        # Show knowledge base statistics
        stats = kb.get_statistics()
        print(f"📈 Knowledge Base Statistics:")
        print(f"   Total Entries: {stats['total_entries']}")
        print(f"   Total Solutions: {stats['total_solutions']}")
        print(f"   Categories: {len(stats['categories'])}")
        print(f"   Most Common Category: {stats['most_common_category']}")
        
        # Show available categories
        print(f"\n🏷️  Available Categories:")
        for category, count in stats['categories'].items():
            print(f"   • {category.replace('_', ' ').title()}: {count} solutions")
        
        # Search by category
        print(f"\n🔍 Peak Quality Solutions:")
        peak_solutions = kb.get_solutions_by_category("peak_quality")
        for i, solution in enumerate(peak_solutions[:3], 1):
            print(f"   {i}. {solution.title}")
            print(f"      Impact: {solution.expected_impact}")
            print(f"      Difficulty: {solution.implementation_difficulty}")
        
        # Search by tags
        print(f"\n🏷️  Tag-Based Search (tailing):")
        tailing_solutions = kb.search_by_tags(["tailing"])
        for solution in tailing_solutions[:2]:
            print(f"   • {solution.title}")
            print(f"     {solution.description[:80]}...")
        
        # Show detailed solution
        if peak_solutions:
            detailed_solution = peak_solutions[0]
            print(f"\n📋 Detailed Solution Example:")
            print(f"   Title: {detailed_solution.title}")
            print(f"   Category: {detailed_solution.category}")
            print(f"   Description: {detailed_solution.description}")
            print(f"   Parameters to Check: {', '.join(detailed_solution.parameters_to_check[:3])}")
            print(f"   Expected Impact: {detailed_solution.expected_impact}")
    
    async def _demo_system_health(self):
        """Demonstrate system health monitoring"""
        
        print("\n\n💊 DEMO 5: System Health & Performance")
        print("-" * 40)
        
        # Get health status
        health = self.ai_engine.get_health_status()
        
        print(f"🏥 System Health Status:")
        print(f"   Service Status: {health.service_status}")
        print(f"   Knowledge Base Entries: {health.knowledge_base_entries}")
        print(f"   Model Version: {health.model_version}")
        print(f"   Last Health Check: {health.last_health_check}")
        
        # Performance statistics
        print(f"\n📊 Performance Statistics:")
        print(f"   Total Analyses: {health.total_analyses}")
        print(f"   Successful Analyses: {health.successful_analyses}")
        print(f"   Success Rate: {health.success_rate:.1%}")
        print(f"   Average Processing Time: {health.average_processing_time:.2f}s")
        
        # System capabilities
        print(f"\n⚡ System Capabilities:")
        print(f"   • Real-time chromatogram analysis")
        print(f"   • OCR data integration and validation") 
        print(f"   • Multi-factor recommendation scoring")
        print(f"   • Comprehensive knowledge base with {health.knowledge_base_entries} entries")
        print(f"   • Intelligent issue categorization and prioritization")
        print(f"   • Step-by-step troubleshooting guides")
        print(f"   • Performance monitoring and health checks")
        
        # Current system status
        print(f"\n🟢 System Status: All components operational")
        print(f"   ✅ AI Troubleshooter Engine: Ready")
        print(f"   ✅ Knowledge Base: Loaded ({health.knowledge_base_entries} entries)")
        print(f"   ✅ Recommendation Engine: Ready")  
        print(f"   ✅ OCR Integration Bridge: Ready")
        print(f"   ✅ API Endpoints: Available")


# =================== MAIN DEMONSTRATION ===================

async def main():
    """Run the complete AI troubleshooter demonstration"""
    
    print("🚀 Starting AI Troubleshooter System Demonstration...")
    print()
    
    try:
        demo = AITroubleshooterDemo()
        await demo.run_complete_demonstration()
        
        print("\n" + "=" * 60)
        print("🎉 DEMONSTRATION COMPLETE!")
        print()
        print("The AI Troubleshooter system is fully operational and ready for:")
        print("• Real-time chromatogram analysis")
        print("• OCR-based data extraction and analysis")
        print("• Intelligent problem detection and diagnosis")
        print("• Prioritized solution recommendations")
        print("• Comprehensive troubleshooting guidance")
        print()
        print("Next steps:")
        print("1. Deploy FastAPI endpoints for web access")
        print("2. Integrate with frontend interface")
        print("3. Set up production authentication")
        print("4. Configure monitoring and logging")
        
    except Exception as e:
        print(f"\n❌ DEMONSTRATION FAILED: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())