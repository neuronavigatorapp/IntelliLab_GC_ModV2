#!/usr/bin/env python3
"""
EPA/USP Method Templates
Addresses Dr. Williams' critique on missing reporting templates
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum
from datetime import datetime
import json
from loguru import logger


class MethodStandard(str, Enum):
    """Regulatory method standards"""
    EPA_8260 = "EPA_8260"
    EPA_8270 = "EPA_8270"
    EPA_TO15 = "EPA_TO15"
    EPA_625 = "EPA_625"
    USP_467 = "USP_467"
    USP_1467 = "USP_1467"
    ASTM_D3328 = "ASTM_D3328"
    ASTM_D5580 = "ASTM_D5580"
    ISO_11423 = "ISO_11423"


class ValidationParameter(str, Enum):
    """Method validation parameters"""
    ACCURACY = "accuracy"
    PRECISION = "precision"
    SPECIFICITY = "specificity"
    DETECTION_LIMIT = "detection_limit"
    QUANTITATION_LIMIT = "quantitation_limit"
    LINEARITY = "linearity"
    RANGE = "range"
    ROBUSTNESS = "robustness"
    RUGGEDNESS = "ruggedness"


@dataclass
class SystemSuitabilityTest:
    """System suitability test criteria"""
    parameter: str
    requirement: str
    acceptance_criteria: str
    test_frequency: str


@dataclass
class QCRequirement:
    """Quality control requirement"""
    qc_type: str
    frequency: str
    acceptance_criteria: str
    corrective_action: str


@dataclass
class MethodTemplate:
    """Regulatory method template"""
    method_id: str
    title: str
    standard: MethodStandard
    scope: str
    principle: str
    instrument_requirements: Dict[str, Any]
    column_specifications: Dict[str, Any]
    operating_conditions: Dict[str, Any]
    calibration_requirements: Dict[str, Any]
    qc_requirements: List[QCRequirement]
    system_suitability: List[SystemSuitabilityTest]
    validation_parameters: List[ValidationParameter]
    interferences: List[str]
    safety_considerations: List[str]
    references: List[str]


class MethodTemplateService:
    """Service for regulatory method templates"""
    
    def __init__(self):
        self.templates = self._load_method_templates()
        
    def _load_method_templates(self) -> Dict[str, MethodTemplate]:
        """Load regulatory method templates"""
        
        templates = {}
        
        # EPA Method 8260D - Volatile Organic Compounds by GC/MS
        templates["EPA_8260"] = MethodTemplate(
            method_id="EPA_8260D",
            title="Volatile Organic Compounds by Gas Chromatography/Mass Spectrometry (GC/MS)",
            standard=MethodStandard.EPA_8260,
            scope="This method covers the determination of volatile organic compounds in various sample matrices using purge and trap concentration and gas chromatography/mass spectrometry.",
            principle="Volatile organic compounds are extracted from the sample matrix by purging with an inert gas, trapped on a sorbent material, thermally desorbed, and analyzed by GC/MS using electron impact ionization.",
            instrument_requirements={
                "gc_system": "Gas chromatograph with split/splitless injection capability",
                "detector": "Mass spectrometer with electron impact ionization",
                "purge_trap": "Purge and trap concentrator",
                "column": "Capillary column, fused silica",
                "data_system": "Computer controlled data acquisition system"
            },
            column_specifications={
                "stationary_phase": "DB-624 or equivalent",
                "dimensions": "30 m x 0.25 mm ID x 1.4 μm film thickness",
                "alternative": "75 m x 0.45 mm ID x 2.55 μm film thickness"
            },
            operating_conditions={
                "carrier_gas": "Helium, ultra-high purity",
                "carrier_flow": "1.0 mL/min (constant flow)",
                "injection_port_temp": "200°C",
                "initial_column_temp": "10°C",
                "initial_hold": "5 min",
                "temperature_program": [
                    {"ramp": "6°C/min", "final_temp": "70°C", "hold": "2 min"},
                    {"ramp": "15°C/min", "final_temp": "150°C", "hold": "4 min"},
                    {"ramp": "30°C/min", "final_temp": "200°C", "hold": "0 min"}
                ],
                "transfer_line_temp": "200°C",
                "ion_source_temp": "200°C",
                "quadrupole_temp": "100°C"
            },
            calibration_requirements={
                "calibration_type": "Internal standard",
                "calibration_levels": 5,
                "calibration_range": "1-200 μg/L",
                "internal_standards": ["1,4-Difluorobenzene", "Chlorobenzene-d5", "1,4-Dichlorobenzene-d4"],
                "surrogate_standards": ["4-Bromofluorobenzene", "1,2-Dichloroethane-d4", "Toluene-d8"],
                "linearity_requirement": "r² ≥ 0.995",
                "rsd_requirement": "≤ 15%"
            },
            qc_requirements=[
                QCRequirement("Method Blank", "1 per batch", "No target compounds > MDL", "Identify source of contamination"),
                QCRequirement("Laboratory Control Sample", "1 per batch", "Recovery 80-120%", "Re-analyze or document"),
                QCRequirement("Matrix Spike", "1 per 20 samples", "Recovery 70-130%", "Flag affected samples"),
                QCRequirement("Matrix Spike Duplicate", "1 per 20 samples", "RPD ≤ 20%", "Evaluate precision"),
                QCRequirement("Surrogate Recovery", "All samples", "Recovery 70-130%", "Re-analyze if outside limits")
            ],
            system_suitability=[
                SystemSuitabilityTest("Resolution", "Adjacent peaks", "R ≥ 1.0", "Daily"),
                SystemSuitabilityTest("Peak Tailing", "Benzene peak", "T ≤ 2.0", "Daily"),
                SystemSuitabilityTest("Sensitivity", "Benzene", "S/N ≥ 3:1 at 1 μg/L", "Daily")
            ],
            validation_parameters=[
                ValidationParameter.ACCURACY, ValidationParameter.PRECISION,
                ValidationParameter.DETECTION_LIMIT, ValidationParameter.QUANTITATION_LIMIT,
                ValidationParameter.LINEARITY, ValidationParameter.RANGE
            ],
            interferences=[
                "Methylene chloride and acetone commonly found in reagent water",
                "Phthalate esters from sample containers",
                "Hydrocarbons from contaminated glassware"
            ],
            safety_considerations=[
                "Many target compounds are carcinogenic - handle with extreme care",
                "Use fume hood for all sample preparation",
                "Wear appropriate PPE including nitrile gloves",
                "Follow institutional chemical hygiene plan"
            ],
            references=[
                "EPA Method 8260D, Rev. 4, February 2017",
                "40 CFR Part 136, Appendix A",
                "EPA-600/R-93-116, Methods for the Determination of Organic Compounds in Drinking Water"
            ]
        )
        
        # USP <467> Residual Solvents
        templates["USP_467"] = MethodTemplate(
            method_id="USP_467",
            title="Residual Solvents",
            standard=MethodStandard.USP_467,
            scope="This general method describes procedures for the determination of residual solvents in pharmaceutical substances and products.",
            principle="Residual solvents are determined by gas chromatography using either headspace sampling or direct injection techniques.",
            instrument_requirements={
                "gc_system": "Gas chromatograph with split/splitless injection",
                "detector": "Flame ionization detector (FID) or mass spectrometer",
                "headspace_sampler": "Automated headspace sampler (if using headspace method)",
                "column": "Capillary column suitable for volatile compounds",
                "data_system": "Integrator or computer data system"
            },
            column_specifications={
                "stationary_phase": "DB-624 or equivalent wide-bore column",
                "dimensions": "30 m x 0.53 mm ID x 3.0 μm film thickness",
                "alternative": "DB-1 or equivalent for specific applications"
            },
            operating_conditions={
                "carrier_gas": "Helium or nitrogen",
                "carrier_flow": "3.0 mL/min",
                "injection_port_temp": "140°C",
                "injection_mode": "Split (5:1)",
                "initial_column_temp": "40°C",
                "initial_hold": "20 min",
                "temperature_program": [
                    {"ramp": "10°C/min", "final_temp": "240°C", "hold": "20 min"}
                ],
                "detector_temp": "250°C (FID)"
            },
            calibration_requirements={
                "calibration_type": "External standard",
                "calibration_levels": "Minimum 3 levels",
                "linearity_requirement": "r² ≥ 0.99",
                "accuracy_requirement": "98-102% of theoretical",
                "precision_requirement": "RSD ≤ 2.0%"
            },
            qc_requirements=[
                QCRequirement("System Suitability", "Before each sequence", "Meet all SST criteria", "Adjust system parameters"),
                QCRequirement("Standard Solution", "Daily", "Response within ±15%", "Prepare fresh standard"),
                QCRequirement("Blank Injection", "Start of sequence", "No interfering peaks", "Clean system if needed")
            ],
            system_suitability=[
                SystemSuitabilityTest("Resolution", "Critical pairs", "Rs ≥ 1.5", "Each sequence"),
                SystemSuitabilityTest("Tailing Factor", "Worst peak", "T ≤ 2.0", "Each sequence"),
                SystemSuitabilityTest("Theoretical Plates", "Suitable peak", "N ≥ 2000", "Each sequence"),
                SystemSuitabilityTest("Repeatability", "Standard injections", "RSD ≤ 15%", "Each sequence")
            ],
            validation_parameters=[
                ValidationParameter.ACCURACY, ValidationParameter.PRECISION,
                ValidationParameter.SPECIFICITY, ValidationParameter.DETECTION_LIMIT,
                ValidationParameter.QUANTITATION_LIMIT, ValidationParameter.LINEARITY,
                ValidationParameter.RANGE, ValidationParameter.ROBUSTNESS
            ],
            interferences=[
                "Water vapor can interfere with early-eluting solvents",
                "Residual solvents in sample preparation reagents",
                "Cross-contamination from previous injections"
            ],
            safety_considerations=[
                "Many residual solvents are toxic - use appropriate ventilation",
                "Handle standards in fume hood",
                "Store standards in appropriate conditions",
                "Follow safety data sheets for all chemicals"
            ],
            references=[
                "USP General Chapter <467> Residual Solvents",
                "ICH Q3C(R6) Impurities: Guideline for Residual Solvents",
                "21 CFR 184 - Direct Food Substances Affirmed as Generally Recognized as Safe"
            ]
        )
        
        # EPA Method 8270E - Semivolatile Organic Compounds by GC/MS
        templates["EPA_8270"] = MethodTemplate(
            method_id="EPA_8270E",
            title="Semivolatile Organic Compounds by Gas Chromatography/Mass Spectrometry (GC/MS)",
            standard=MethodStandard.EPA_8270,
            scope="This method covers the determination of semivolatile organic compounds in extracts prepared from various sample matrices.",
            principle="Semivolatile organic compounds are extracted from samples, concentrated, and analyzed by gas chromatography/mass spectrometry using electron impact ionization.",
            instrument_requirements={
                "gc_system": "Gas chromatograph with split/splitless injection",
                "detector": "Mass spectrometer with electron impact ionization",
                "column": "Fused silica capillary column",
                "data_system": "Computer controlled data acquisition and library search"
            },
            column_specifications={
                "stationary_phase": "DB-5ms or equivalent",
                "dimensions": "30 m x 0.25 mm ID x 0.25 μm film thickness",
                "alternative": "DB-XLB or other low-bleed column"
            },
            operating_conditions={
                "carrier_gas": "Helium, ultra-high purity",
                "carrier_flow": "1.0 mL/min (constant flow)",
                "injection_port_temp": "280°C",
                "injection_mode": "Splitless",
                "splitless_time": "1.0 min",
                "initial_column_temp": "35°C",
                "initial_hold": "2 min",
                "temperature_program": [
                    {"ramp": "25°C/min", "final_temp": "130°C", "hold": "1 min"},
                    {"ramp": "8°C/min", "final_temp": "200°C", "hold": "1 min"},
                    {"ramp": "5°C/min", "final_temp": "300°C", "hold": "8 min"}
                ],
                "transfer_line_temp": "280°C",
                "ion_source_temp": "230°C",
                "quadrupole_temp": "150°C"
            },
            calibration_requirements={
                "calibration_type": "Internal standard",
                "calibration_levels": 5,
                "calibration_range": "10-400 μg/L",
                "internal_standards": ["1,4-Dichlorobenzene-d4", "Naphthalene-d8", "Acenaphthene-d10", "Phenanthrene-d10", "Chrysene-d12", "Perylene-d12"],
                "linearity_requirement": "r² ≥ 0.995",
                "rsd_requirement": "≤ 15%"
            },
            qc_requirements=[
                QCRequirement("Method Blank", "1 per batch", "No target compounds > MDL", "Identify contamination source"),
                QCRequirement("Laboratory Control Sample", "1 per batch", "Recovery 50-150%", "Document or re-analyze"),
                QCRequirement("Matrix Spike", "1 per 20 samples", "Recovery 30-170%", "Flag affected samples"),
                QCRequirement("Internal Standard Recovery", "All samples", "Recovery 50-150%", "Re-analyze if outside limits")
            ],
            system_suitability=[
                SystemSuitabilityTest("DFTPP Tune", "Mass calibration", "Meet all ion ratios", "Every 12 hours"),
                SystemSuitabilityTest("Sensitivity", "Benzidine", "S/N ≥ 3:1 at 10 μg/L", "Daily"),
                SystemSuitabilityTest("Peak Shape", "Pentachlorophenol", "Tailing ≤ 2.0", "Daily")
            ],
            validation_parameters=[
                ValidationParameter.ACCURACY, ValidationParameter.PRECISION,
                ValidationParameter.DETECTION_LIMIT, ValidationParameter.QUANTITATION_LIMIT,
                ValidationParameter.LINEARITY, ValidationParameter.RANGE,
                ValidationParameter.SPECIFICITY
            ],
            interferences=[
                "Phthalate esters from plasticware and reagents",
                "Bis(2-ethylhexyl)adipate from sample bottle caps",
                "Laboratory contamination from solvents and glassware"
            ],
            safety_considerations=[
                "Many target compounds are carcinogenic - handle with extreme care",
                "Use fume hood for all operations",
                "Wear nitrile gloves and safety glasses",
                "Properly dispose of all waste according to regulations"
            ],
            references=[
                "EPA Method 8270E, Rev. 6, June 2018",
                "40 CFR Part 136, Appendix A",
                "EPA SW-846 Test Methods for Evaluating Solid Waste"
            ]
        )
        
        return templates
    
    def get_method_template(self, method_standard: MethodStandard) -> Optional[MethodTemplate]:
        """Get method template by standard"""
        return self.templates.get(method_standard.value)
    
    def get_available_methods(self) -> List[Dict[str, Any]]:
        """Get list of available method templates"""
        methods = []
        for template in self.templates.values():
            methods.append({
                "method_id": template.method_id,
                "title": template.title,
                "standard": template.standard.value,
                "scope": template.scope[:200] + "..." if len(template.scope) > 200 else template.scope
            })
        return methods
    
    def validate_method_compliance(self, method_data: Dict[str, Any], 
                                 method_standard: MethodStandard) -> Dict[str, Any]:
        """Validate method against regulatory template"""
        
        template = self.get_method_template(method_standard)
        if not template:
            return {"error": f"Template not found for {method_standard.value}"}
        
        compliance_issues = []
        compliance_score = 0
        total_checks = 0
        
        # Check instrument requirements
        for requirement, spec in template.instrument_requirements.items():
            total_checks += 1
            if requirement in method_data.get("instrument_requirements", {}):
                compliance_score += 1
            else:
                compliance_issues.append(f"Missing instrument requirement: {requirement}")
        
        # Check operating conditions
        critical_conditions = ["carrier_gas", "injection_port_temp", "detector_temp"]
        for condition in critical_conditions:
            total_checks += 1
            if condition in method_data.get("operating_conditions", {}):
                compliance_score += 1
            else:
                compliance_issues.append(f"Missing operating condition: {condition}")
        
        # Check calibration requirements
        calibration_checks = ["calibration_type", "calibration_levels", "linearity_requirement"]
        for check in calibration_checks:
            total_checks += 1
            if check in method_data.get("calibration_requirements", {}):
                compliance_score += 1
            else:
                compliance_issues.append(f"Missing calibration requirement: {check}")
        
        # Check QC requirements
        template_qc_types = [qc.qc_type for qc in template.qc_requirements]
        method_qc_types = [qc.get("qc_type") for qc in method_data.get("qc_requirements", [])]
        
        for qc_type in template_qc_types:
            total_checks += 1
            if qc_type in method_qc_types:
                compliance_score += 1
            else:
                compliance_issues.append(f"Missing QC requirement: {qc_type}")
        
        # Check system suitability tests
        template_sst = [sst.parameter for sst in template.system_suitability]
        method_sst = [sst.get("parameter") for sst in method_data.get("system_suitability", [])]
        
        for sst in template_sst:
            total_checks += 1
            if sst in method_sst:
                compliance_score += 1
            else:
                compliance_issues.append(f"Missing system suitability test: {sst}")
        
        compliance_percentage = (compliance_score / total_checks * 100) if total_checks > 0 else 0
        
        return {
            "method_standard": method_standard.value,
            "compliance_score": round(compliance_percentage, 1),
            "total_checks": total_checks,
            "passed_checks": compliance_score,
            "compliance_issues": compliance_issues,
            "status": "COMPLIANT" if compliance_percentage >= 90 else "NON_COMPLIANT",
            "recommendations": self._generate_compliance_recommendations(compliance_issues, template)
        }
    
    def _generate_compliance_recommendations(self, issues: List[str], 
                                           template: MethodTemplate) -> List[str]:
        """Generate recommendations for compliance"""
        recommendations = []
        
        if not issues:
            recommendations.append("Method meets regulatory template requirements")
            return recommendations
        
        # Group issues by category
        instrument_issues = [i for i in issues if "instrument" in i.lower()]
        condition_issues = [i for i in issues if "operating condition" in i.lower()]
        calibration_issues = [i for i in issues if "calibration" in i.lower()]
        qc_issues = [i for i in issues if "QC requirement" in i]
        sst_issues = [i for i in issues if "system suitability" in i.lower()]
        
        if instrument_issues:
            recommendations.append("Review instrument requirements and ensure all specified equipment is available")
        
        if condition_issues:
            recommendations.append("Define all critical operating conditions with appropriate tolerances")
        
        if calibration_issues:
            recommendations.append("Establish comprehensive calibration procedures meeting regulatory requirements")
        
        if qc_issues:
            recommendations.append("Implement all required quality control procedures with acceptance criteria")
        
        if sst_issues:
            recommendations.append("Define system suitability tests to ensure method performance")
        
        return recommendations
    
    def generate_method_from_template(self, method_standard: MethodStandard,
                                    customizations: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate method from regulatory template with customizations"""
        
        template = self.get_method_template(method_standard)
        if not template:
            return {"error": f"Template not found for {method_standard.value}"}
        
        # Convert template to dictionary
        method_dict = {
            "method_id": template.method_id,
            "title": template.title,
            "standard": template.standard.value,
            "scope": template.scope,
            "principle": template.principle,
            "instrument_requirements": template.instrument_requirements,
            "column_specifications": template.column_specifications,
            "operating_conditions": template.operating_conditions,
            "calibration_requirements": template.calibration_requirements,
            "qc_requirements": [
                {
                    "qc_type": qc.qc_type,
                    "frequency": qc.frequency,
                    "acceptance_criteria": qc.acceptance_criteria,
                    "corrective_action": qc.corrective_action
                } for qc in template.qc_requirements
            ],
            "system_suitability": [
                {
                    "parameter": sst.parameter,
                    "requirement": sst.requirement,
                    "acceptance_criteria": sst.acceptance_criteria,
                    "test_frequency": sst.test_frequency
                } for sst in template.system_suitability
            ],
            "validation_parameters": [param.value for param in template.validation_parameters],
            "interferences": template.interferences,
            "safety_considerations": template.safety_considerations,
            "references": template.references,
            "created_date": datetime.now().isoformat(),
            "template_version": "1.0"
        }
        
        # Apply customizations
        if customizations:
            for key, value in customizations.items():
                if key in method_dict:
                    if isinstance(method_dict[key], dict) and isinstance(value, dict):
                        method_dict[key].update(value)
                    else:
                        method_dict[key] = value
        
        return method_dict


# Global instance
method_template_service = MethodTemplateService()
