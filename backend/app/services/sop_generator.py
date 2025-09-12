#!/usr/bin/env python3
"""
Standard Operating Procedure Generator
Addresses Dr. Williams' critique on missing SOP generator
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from datetime import datetime
import json
import os
from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum
from loguru import logger


class SOPType(str, Enum):
    """Types of SOPs that can be generated"""
    GC_METHOD = "gc_method"
    CALIBRATION = "calibration"
    MAINTENANCE = "maintenance"
    SAFETY = "safety"
    QUALITY_CONTROL = "quality_control"


class RegulatoryStandard(str, Enum):
    """Regulatory standards for SOP formatting"""
    FDA_21CFR11 = "FDA 21 CFR Part 11"
    EPA = "EPA"
    USP = "USP"
    ASTM = "ASTM"
    ISO_17025 = "ISO/IEC 17025"
    GLP = "GLP"
    GMP = "GMP"


@dataclass
class SOPMetadata:
    """SOP document metadata"""
    sop_number: str
    title: str
    version: str
    effective_date: str
    author: str
    reviewer: str
    approver: str
    department: str
    regulatory_standard: RegulatoryStandard
    next_review_date: str
    supersedes: Optional[str] = None


class SOPGenerator:
    """Generate compliant Standard Operating Procedures"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
        
    def _setup_custom_styles(self):
        """Setup custom paragraph styles for SOPs"""
        
        # Title style
        self.styles.add(ParagraphStyle(
            name='SOPTitle',
            parent=self.styles['Title'],
            fontSize=16,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=colors.black,
            fontName='Helvetica-Bold'
        ))
        
        # Header style
        self.styles.add(ParagraphStyle(
            name='SOPHeader',
            parent=self.styles['Heading1'],
            fontSize=14,
            spaceAfter=12,
            spaceBefore=12,
            textColor=colors.black,
            fontName='Helvetica-Bold'
        ))
        
        # Subheader style
        self.styles.add(ParagraphStyle(
            name='SOPSubHeader',
            parent=self.styles['Heading2'],
            fontSize=12,
            spaceAfter=6,
            spaceBefore=6,
            textColor=colors.black,
            fontName='Helvetica-Bold'
        ))
        
        # Body text with justification
        self.styles.add(ParagraphStyle(
            name='SOPBody',
            parent=self.styles['BodyText'],
            fontSize=10,
            spaceAfter=6,
            alignment=TA_JUSTIFY,
            fontName='Helvetica'
        ))
        
        # Warning text
        self.styles.add(ParagraphStyle(
            name='SOPWarning',
            parent=self.styles['BodyText'],
            fontSize=10,
            spaceAfter=6,
            textColor=colors.red,
            fontName='Helvetica-Bold'
        ))
    
    def generate_method_sop(self, 
                           method_data: Dict, 
                           metadata: SOPMetadata,
                           filename: str) -> str:
        """Create FDA/EPA compliant method SOP document"""
        
        doc = SimpleDocTemplate(filename, pagesize=letter, 
                               rightMargin=72, leftMargin=72,
                               topMargin=72, bottomMargin=18)
        story = []
        
        # Document header
        story.append(Paragraph(f"STANDARD OPERATING PROCEDURE", self.styles['SOPTitle']))
        story.append(Paragraph(f"{metadata.title}", self.styles['SOPHeader']))
        story.append(Spacer(1, 12))
        
        # Document control table
        control_data = [
            ['SOP Number:', metadata.sop_number, 'Effective Date:', metadata.effective_date],
            ['Version:', metadata.version, 'Next Review:', metadata.next_review_date],
            ['Author:', metadata.author, 'Department:', metadata.department],
            ['Reviewer:', metadata.reviewer, 'Standard:', metadata.regulatory_standard.value],
            ['Approver:', metadata.approver, 'Supersedes:', metadata.supersedes or 'N/A']
        ]
        
        control_table = Table(control_data, colWidths=[1*inch, 2*inch, 1*inch, 2*inch])
        control_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('BACKGROUND', (2, 0), (2, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP')
        ]))
        
        story.append(control_table)
        story.append(Spacer(1, 20))
        
        # Table of contents
        story.append(Paragraph("TABLE OF CONTENTS", self.styles['SOPHeader']))
        toc_data = [
            ['Section', 'Title', 'Page'],
            ['1', 'Purpose and Scope', '2'],
            ['2', 'Safety Considerations', '2'],
            ['3', 'Equipment and Materials', '3'],
            ['4', 'Method Parameters', '3'],
            ['5', 'Procedure', '4'],
            ['6', 'Quality Control', '5'],
            ['7', 'Calculations', '6'],
            ['8', 'Reporting', '6'],
            ['9', 'References', '7'],
            ['10', 'Revision History', '7']
        ]
        
        toc_table = Table(toc_data, colWidths=[0.5*inch, 4*inch, 0.5*inch])
        toc_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(toc_table)
        story.append(PageBreak())
        
        # 1. Purpose and Scope
        story.append(Paragraph("1. PURPOSE AND SCOPE", self.styles['SOPHeader']))
        purpose_text = method_data.get('purpose', 
            f"This SOP describes the procedure for {method_data.get('analysis_type', 'GC analysis')} "
            f"using {method_data.get('instrument', 'gas chromatograph')} with "
            f"{method_data.get('detector', 'flame ionization detector')}.")
        story.append(Paragraph(purpose_text, self.styles['SOPBody']))
        
        scope_text = method_data.get('scope', 
            f"This method is applicable to the determination of "
            f"{method_data.get('target_compounds', 'target analytes')} in "
            f"{method_data.get('sample_matrix', 'various matrices')}.")
        story.append(Paragraph(f"<b>Scope:</b> {scope_text}", self.styles['SOPBody']))
        story.append(Spacer(1, 12))
        
        # 2. Safety Considerations
        story.append(Paragraph("2. SAFETY CONSIDERATIONS", self.styles['SOPHeader']))
        story.append(Paragraph("<b>WARNING:</b> This procedure involves the use of hazardous chemicals and high-temperature equipment.", 
                              self.styles['SOPWarning']))
        
        safety_items = method_data.get('safety', [
            "Wear appropriate personal protective equipment (PPE) including safety glasses and lab coat",
            "Handle all solvents in a fume hood",
            "Follow institutional chemical hygiene plan",
            "Be aware of high-temperature surfaces on GC instrument",
            "Ensure proper ventilation when using carrier gases"
        ])
        
        for item in safety_items:
            story.append(Paragraph(f"• {item}", self.styles['SOPBody']))
        story.append(Spacer(1, 12))
        
        # 3. Equipment and Materials
        story.append(Paragraph("3. EQUIPMENT AND MATERIALS", self.styles['SOPHeader']))
        story.append(Paragraph("3.1 Equipment", self.styles['SOPSubHeader']))
        
        equipment_data = [
            ['Equipment', 'Model/Specification', 'Settings'],
            ['GC System', method_data.get('gc_model', 'Agilent 7890B GC'), ''],
            ['Column', method_data.get('column', 'DB-5ms'), 
             f"{method_data.get('column_dims', '30m x 0.25mm x 0.25μm')}"],
            ['Detector', method_data.get('detector', 'FID'), 
             f"Temperature: {method_data.get('detector_temp', 300)}°C"],
            ['Autosampler', method_data.get('autosampler', 'G4513A ALS'), 'If available'],
            ['Data System', method_data.get('data_system', 'ChemStation'), 'Latest version']
        ]
        
        equipment_table = Table(equipment_data, colWidths=[2*inch, 2*inch, 2*inch])
        equipment_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP')
        ]))
        
        story.append(equipment_table)
        story.append(Spacer(1, 12))
        
        # Materials
        story.append(Paragraph("3.2 Reagents and Materials", self.styles['SOPSubHeader']))
        materials = method_data.get('materials', [
            "Carrier gas: Helium, ultra-high purity (99.999%)",
            "Detector gases: Hydrogen and air (if using FID)",
            "Standards: Certified reference materials",
            "Solvents: HPLC grade or equivalent",
            "Sample vials: 2 mL amber glass with PTFE/silicone septa"
        ])
        
        for material in materials:
            story.append(Paragraph(f"• {material}", self.styles['SOPBody']))
        story.append(Spacer(1, 12))
        
        # 4. Method Parameters
        story.append(Paragraph("4. METHOD PARAMETERS", self.styles['SOPHeader']))
        
        params_data = [
            ['Parameter', 'Value', 'Tolerance', 'Notes'],
            ['Inlet Temperature', f"{method_data.get('inlet_temp', 250)}°C", "±5°C", 
             "Optimize for sample volatility"],
            ['Injection Mode', method_data.get('injection_mode', 'Split'), 'N/A', 
             f"Split ratio: 1:{method_data.get('split_ratio', 50)}"],
            ['Column Flow', f"{method_data.get('flow_rate', 1.2)} mL/min", "±0.1 mL/min", 
             "Constant flow mode"],
            ['Initial Oven Temp', f"{method_data.get('oven_initial', 40)}°C", "±2°C", 
             f"Hold {method_data.get('initial_hold', 2)} min"],
            ['Ramp Rate', f"{method_data.get('ramp_rate', 10)}°C/min", "±0.5°C/min", 
             "Linear ramp"],
            ['Final Oven Temp', f"{method_data.get('oven_final', 300)}°C", "±2°C", 
             f"Hold {method_data.get('final_hold', 5)} min"],
            ['Detector Temp', f"{method_data.get('detector_temp', 300)}°C", "±5°C", 
             "Maintain above column max"]
        ]
        
        params_table = Table(params_data, colWidths=[1.5*inch, 1*inch, 1*inch, 2.5*inch])
        params_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP')
        ]))
        
        story.append(params_table)
        story.append(Spacer(1, 12))
        
        # 5. Procedure
        story.append(Paragraph("5. PROCEDURE", self.styles['SOPHeader']))
        
        procedure_steps = method_data.get('procedure', [
            "5.1 Instrument Preparation",
            "• Turn on GC system and allow to equilibrate for 30 minutes",
            "• Verify carrier gas pressures and flows",
            "• Check detector gases (if applicable)",
            "• Load method parameters into data system",
            "",
            "5.2 Sample Preparation", 
            "• Prepare samples according to sample prep SOP",
            "• Filter samples if necessary (0.45 μm PTFE filter)",
            "• Transfer to appropriate autosampler vials",
            "",
            "5.3 Calibration",
            "• Prepare calibration standards at minimum 5 concentration levels",
            "• Inject standards in duplicate",
            "• Verify linearity (r² > 0.995)",
            "",
            "5.4 Sample Analysis",
            "• Inject samples in sequence",
            "• Include QC samples every 10 samples",
            "• Monitor system performance throughout run"
        ])
        
        for step in procedure_steps:
            if step.startswith("5."):
                story.append(Paragraph(step, self.styles['SOPSubHeader']))
            elif step == "":
                story.append(Spacer(1, 6))
            else:
                story.append(Paragraph(step, self.styles['SOPBody']))
        
        story.append(Spacer(1, 12))
        
        # 6. Quality Control
        story.append(Paragraph("6. QUALITY CONTROL", self.styles['SOPHeader']))
        
        qc_requirements = method_data.get('qc_requirements', {
            'blanks': '1 per 20 samples',
            'duplicates': '1 per 20 samples', 
            'spikes': '1 per 20 samples',
            'check_standards': '1 per sequence'
        })
        
        qc_data = [['QC Type', 'Frequency', 'Acceptance Criteria']]
        qc_criteria = {
            'blanks': 'No target compounds detected',
            'duplicates': 'RPD < 20%',
            'spikes': 'Recovery 80-120%',
            'check_standards': 'Within ±15% of true value'
        }
        
        for qc_type, frequency in qc_requirements.items():
            criteria = qc_criteria.get(qc_type, 'See method')
            qc_data.append([qc_type.replace('_', ' ').title(), frequency, criteria])
        
        qc_table = Table(qc_data, colWidths=[2*inch, 2*inch, 2*inch])
        qc_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(qc_table)
        story.append(Spacer(1, 12))
        
        # 7. Calculations
        story.append(Paragraph("7. CALCULATIONS", self.styles['SOPHeader']))
        calc_text = method_data.get('calculations', 
            "Quantitation is performed using external standard calibration. "
            "Peak areas are compared to calibration curve to determine concentrations.")
        story.append(Paragraph(calc_text, self.styles['SOPBody']))
        story.append(Spacer(1, 12))
        
        # 8. Reporting
        story.append(Paragraph("8. REPORTING", self.styles['SOPHeader']))
        reporting_text = method_data.get('reporting',
            "Results shall be reported with appropriate significant figures and uncertainty estimates. "
            "Include QC results and any deviations from this procedure.")
        story.append(Paragraph(reporting_text, self.styles['SOPBody']))
        story.append(Spacer(1, 12))
        
        # 9. References
        story.append(Paragraph("9. REFERENCES", self.styles['SOPHeader']))
        references = method_data.get('references', [
            "EPA Method 8270D: Semivolatile Organic Compounds by GC/MS",
            "ASTM D3328: Standard Test Methods for Comparison of Waterborne Petroleum Oils",
            "USP <467>: Residual Solvents"
        ])
        
        for ref in references:
            story.append(Paragraph(f"• {ref}", self.styles['SOPBody']))
        story.append(Spacer(1, 12))
        
        # 10. Revision History
        story.append(Paragraph("10. REVISION HISTORY", self.styles['SOPHeader']))
        
        revision_data = [
            ['Version', 'Date', 'Author', 'Description of Changes'],
            [metadata.version, metadata.effective_date, metadata.author, 'Initial version']
        ]
        
        revision_table = Table(revision_data, colWidths=[1*inch, 1.5*inch, 1.5*inch, 2*inch])
        revision_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(revision_table)
        
        # Build PDF
        try:
            doc.build(story)
            logger.info(f"SOP generated successfully: {filename}")
            return filename
        except Exception as e:
            logger.error(f"Error generating SOP: {e}")
            raise
    
    def generate_regulatory_template(self, 
                                   standard: RegulatoryStandard,
                                   method_type: str = "GC-FID") -> Dict:
        """Generate regulatory-specific method template"""
        
        templates = {
            RegulatoryStandard.EPA: {
                "required_sections": [
                    "Scope and Application",
                    "Summary of Method", 
                    "Definitions",
                    "Interferences",
                    "Safety",
                    "Equipment and Supplies",
                    "Reagents and Standards",
                    "Sample Collection and Preservation",
                    "Quality Control",
                    "Calibration and Standardization",
                    "Procedure",
                    "Data Analysis and Calculations",
                    "Method Performance",
                    "Pollution Prevention",
                    "Waste Management",
                    "References"
                ],
                "qc_requirements": {
                    "method_blank": "1 per batch",
                    "duplicate": "1 per 20 samples",
                    "matrix_spike": "1 per 20 samples",
                    "surrogate": "All samples",
                    "check_standard": "Every 12 hours"
                },
                "documentation": "21 CFR Part 11 compliant"
            },
            
            RegulatoryStandard.USP: {
                "required_sections": [
                    "Definition",
                    "Identification",
                    "Assay",
                    "Impurities", 
                    "System Suitability",
                    "Reference Standards",
                    "Test Solutions",
                    "Procedure",
                    "Calculations",
                    "Acceptance Criteria"
                ],
                "system_suitability": {
                    "resolution": "> 1.5",
                    "tailing_factor": "< 2.0",
                    "theoretical_plates": "> 2000",
                    "rsd": "< 2.0%"
                },
                "validation_parameters": [
                    "Accuracy", "Precision", "Specificity",
                    "Detection Limit", "Quantitation Limit",
                    "Linearity", "Range", "Robustness"
                ]
            },
            
            RegulatoryStandard.ASTM: {
                "required_sections": [
                    "Scope",
                    "Referenced Documents", 
                    "Terminology",
                    "Summary of Test Method",
                    "Significance and Use",
                    "Interferences",
                    "Apparatus",
                    "Reagents and Materials",
                    "Sampling",
                    "Calibration and Standardization",
                    "Procedure",
                    "Calculation",
                    "Report",
                    "Precision and Bias",
                    "Keywords"
                ],
                "precision_requirements": {
                    "repeatability": "Same operator, same day",
                    "reproducibility": "Different operators, different days",
                    "statistical_analysis": "ASTM E178 compliant"
                }
            }
        }
        
        return templates.get(standard, {})
    
    def validate_sop_completeness(self, method_data: Dict, 
                                standard: RegulatoryStandard) -> Dict:
        """Validate SOP completeness against regulatory requirements"""
        
        template = self.generate_regulatory_template(standard)
        required_sections = template.get("required_sections", [])
        
        missing_sections = []
        present_sections = []
        
        # Check for required sections in method data
        for section in required_sections:
            section_key = section.lower().replace(" ", "_").replace("and", "").strip("_")
            if section_key in method_data or any(key.startswith(section_key[:5]) for key in method_data.keys()):
                present_sections.append(section)
            else:
                missing_sections.append(section)
        
        completeness_score = (len(present_sections) / len(required_sections)) * 100 if required_sections else 100
        
        return {
            "regulatory_standard": standard.value,
            "completeness_score": round(completeness_score, 1),
            "required_sections": len(required_sections),
            "present_sections": len(present_sections),
            "missing_sections": missing_sections,
            "compliance_status": "COMPLIANT" if completeness_score >= 90 else "NON_COMPLIANT",
            "recommendations": self._generate_compliance_recommendations(missing_sections, standard)
        }
    
    def _generate_compliance_recommendations(self, 
                                           missing_sections: List[str],
                                           standard: RegulatoryStandard) -> List[str]:
        """Generate recommendations for regulatory compliance"""
        
        recommendations = []
        
        if not missing_sections:
            recommendations.append("SOP meets regulatory requirements")
            return recommendations
        
        for section in missing_sections:
            if "safety" in section.lower():
                recommendations.append("Add comprehensive safety section with hazard identification and PPE requirements")
            elif "quality" in section.lower():
                recommendations.append("Include QC procedures with acceptance criteria and corrective actions")
            elif "calibration" in section.lower():
                recommendations.append("Define calibration procedures with frequency and acceptance criteria")
            elif "validation" in section.lower():
                recommendations.append("Include method validation data and performance characteristics")
            else:
                recommendations.append(f"Add {section} section as required by {standard.value}")
        
        return recommendations


# Global instance
sop_generator = SOPGenerator()
