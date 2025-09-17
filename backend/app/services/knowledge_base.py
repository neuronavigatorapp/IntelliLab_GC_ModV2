"""
GC-MS Knowledge Base System
Comprehensive database of troubleshooting patterns, diagnostic rules, and solutions
"""

import json
import logging
from typing import Dict, List, Optional, Any, Set
from datetime import datetime
from dataclasses import dataclass, asdict
import uuid

from app.models.schemas import (
    KnowledgeBaseEntry, TroubleshootingSolution, DiagnosticIssue
)


@dataclass
class DiagnosticPattern:
    """Diagnostic pattern for automated issue detection"""
    pattern_id: str
    name: str
    category: str
    symptoms: List[str]
    conditions: Dict[str, Any]  # Threshold conditions
    confidence_base: float
    solution_ids: List[str]


class GCMSKnowledgeBase:
    """
    Comprehensive GC-MS troubleshooting knowledge base
    
    Contains:
    - Diagnostic patterns for automated issue detection
    - Solution database with step-by-step guidance
    - Historical issue correlation data
    - Best practices and preventive measures
    """

    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # Core data structures
        self.entries: Dict[str, KnowledgeBaseEntry] = {}
        self.solutions: Dict[str, TroubleshootingSolution] = {}
        self.patterns: Dict[str, DiagnosticPattern] = {}
        self.tags_index: Dict[str, Set[str]] = {}
        
        # Initialize knowledge base content
        self._initialize_peak_quality_knowledge()
        self._initialize_method_optimization_knowledge()
        self._initialize_instrument_maintenance_knowledge()
        self._initialize_sample_preparation_knowledge()
        self._initialize_data_quality_knowledge()
        
        self.logger.info(f"Knowledge base initialized with {len(self.entries)} entries and {len(self.solutions)} solutions")

    def find_applicable_patterns(self, metrics: Dict[str, Any], threshold: float = 0.7) -> List[DiagnosticPattern]:
        """Find diagnostic patterns applicable to given metrics"""
        
        applicable_patterns = []
        
        for pattern in self.patterns.values():
            confidence = self._evaluate_pattern_match(pattern, metrics)
            if confidence >= threshold:
                applicable_patterns.append(pattern)
        
        return sorted(applicable_patterns, key=lambda p: self._evaluate_pattern_match(p, metrics), reverse=True)

    def get_solutions_for_issue(self, issue_category: str, issue_keywords: List[str] = None) -> List[TroubleshootingSolution]:
        """Retrieve solutions for specific issue category and keywords"""
        
        matching_solutions = []
        
        for solution in self.solutions.values():
            # Match by category
            if solution.category.replace("_", " ") in issue_category.replace("_", " "):
                matching_solutions.append(solution)
                continue
            
            # Match by keywords
            if issue_keywords:
                solution_text = f"{solution.title} {solution.description}".lower()
                if any(keyword.lower() in solution_text for keyword in issue_keywords):
                    matching_solutions.append(solution)
        
        return matching_solutions

    def _evaluate_pattern_match(self, pattern: DiagnosticPattern, metrics: Dict[str, Any]) -> float:
        """Evaluate how well a pattern matches given metrics"""
        
        base_confidence = pattern.confidence_base
        condition_matches = 0
        total_conditions = len(pattern.conditions)
        
        if total_conditions == 0:
            return base_confidence
        
        for condition_key, condition_value in pattern.conditions.items():
            metric_value = metrics.get(condition_key)
            if metric_value is None:
                continue
                
            if self._evaluate_condition(metric_value, condition_value):
                condition_matches += 1
        
        # Calculate confidence based on condition match ratio
        match_ratio = condition_matches / total_conditions
        return base_confidence * match_ratio

    def _evaluate_condition(self, metric_value: Any, condition: Any) -> bool:
        """Evaluate if a metric value meets a condition"""
        
        if isinstance(condition, dict):
            # Handle range conditions
            if "min" in condition and metric_value < condition["min"]:
                return False
            if "max" in condition and metric_value > condition["max"]:
                return False
            if "equals" in condition and metric_value != condition["equals"]:
                return False
            return True
        else:
            # Direct comparison
            return metric_value == condition

    def _initialize_peak_quality_knowledge(self):
        """Initialize peak quality troubleshooting knowledge"""
        
        # Peak Tailing Solutions
        tailing_solution = TroubleshootingSolution(
            solution_id="peak_tailing_comprehensive",
            title="Comprehensive Peak Tailing Resolution",
            category="method_adjustment",
            priority="high",
            difficulty="intermediate",
            estimated_time="1-2 hours",
            description="Systematic approach to eliminate peak tailing and improve peak symmetry",
            steps=[
                "Verify injection technique - use fast, reproducible injection speed",
                "Check sample preparation - ensure complete dissolution and filtration",
                "Reduce injection volume to prevent column overload (try 50% reduction)",
                "Increase column temperature by 10-20°C to improve mass transfer",
                "Check mobile phase pH - adjust to optimize analyte ionization",
                "Verify column integrity - look for void formation at inlet",
                "Consider column regeneration or replacement if severely degraded",
                "Optimize gradient slope for better peak elution",
                "Check for active sites - consider column deactivation procedure"
            ],
            expected_outcome="Tailing factor reduced to <1.5 for most peaks, improved peak symmetry and reproducibility",
            prerequisites=["Column performance history", "Mobile phase composition", "Sample preparation protocol"],
            tools_required=["Syringes", "Column regeneration kit", "pH meter", "Standards"],
            safety_notes=[
                "Handle solvents in fume hood",
                "Wear appropriate PPE",
                "Follow column temperature limits",
                "Dispose of waste solvents properly"
            ],
            references=[
                "USP <621> Chromatography",
                "Column manufacturer troubleshooting guide",
                "Method development best practices"
            ]
        )
        self.solutions[tailing_solution.solution_id] = tailing_solution
        
        # Resolution Issues
        resolution_solution = TroubleshootingSolution(
            solution_id="resolution_optimization",
            title="Peak Resolution Enhancement Strategy",
            category="method_adjustment", 
            priority="high",
            difficulty="advanced",
            estimated_time="2-4 hours",
            description="Multi-faceted approach to improve chromatographic resolution between critical peak pairs",
            steps=[
                "Map critical peak pairs requiring baseline resolution (Rs > 1.5)",
                "Calculate theoretical plates and efficiency metrics",
                "Evaluate column length vs. analysis time trade-offs",
                "Optimize mobile phase composition for selectivity",
                "Adjust gradient slope - slower gradients improve resolution",
                "Consider temperature programming for better separation",
                "Evaluate alternative stationary phases for orthogonal selectivity",
                "Optimize flow rate using Van Deemter curve principles",
                "Consider two-dimensional chromatography for complex samples",
                "Validate resolution improvements with mixed standards"
            ],
            expected_outcome="Baseline resolution (Rs ≥ 1.5) achieved between critical peaks with acceptable analysis time",
            prerequisites=["Peak identification", "Column specifications", "Method development capability"],
            tools_required=["Alternative columns", "Mixed standards", "Method development software"],
            safety_notes=["Follow instrument operating limits", "Handle columns with care"],
            references=["Chromatography theory textbooks", "Method development guidelines"]
        )
        self.solutions[resolution_solution.solution_id] = resolution_solution
        
        # Peak tailing pattern
        tailing_pattern = DiagnosticPattern(
            pattern_id="peak_tailing_detection",
            name="Peak Tailing Detection",
            category="peak_quality",
            symptoms=["Asymmetric peaks", "Extended peak tails", "Poor peak shape"],
            conditions={
                "peak_symmetry_avg": {"min": 1.8},  # Tailing factor > 1.8
                "peak_count": {"min": 1}
            },
            confidence_base=0.90,
            solution_ids=[tailing_solution.solution_id]
        )
        self.patterns[tailing_pattern.pattern_id] = tailing_pattern
        
        # Resolution pattern
        resolution_pattern = DiagnosticPattern(
            pattern_id="poor_resolution_detection",
            name="Poor Resolution Detection",
            category="peak_quality",
            symptoms=["Overlapping peaks", "Shoulder peaks", "Poor separation"],
            conditions={
                "resolution_avg": {"max": 1.5},  # Resolution < 1.5
                "peak_count": {"min": 2}
            },
            confidence_base=0.85,
            solution_ids=[resolution_solution.solution_id]
        )
        self.patterns[resolution_pattern.pattern_id] = resolution_pattern

    def _initialize_method_optimization_knowledge(self):
        """Initialize method optimization knowledge"""
        
        # Runtime optimization
        runtime_solution = TroubleshootingSolution(
            solution_id="runtime_optimization",
            title="Analysis Runtime Optimization",
            category="method_adjustment",
            priority="medium",
            difficulty="intermediate",
            estimated_time="3-6 hours",
            description="Systematic approach to reduce analysis time while maintaining separation quality",
            steps=[
                "Document current method performance benchmarks",
                "Identify last eluting peak and adjust run time accordingly",
                "Increase column temperature to reduce retention times",
                "Optimize gradient slope - steeper gradients reduce runtime",
                "Consider shorter column with smaller particles for faster analysis",
                "Increase flow rate within column pressure limits",
                "Evaluate fast gradient techniques",
                "Consider ballistic gradient methods for very fast analysis",
                "Validate shortened method maintains resolution and reproducibility",
                "Update method documentation and transfer protocols"
            ],
            expected_outcome="Reduced analysis time by 30-50% while maintaining critical resolution and precision",
            prerequisites=["Current method validation data", "Column pressure limits", "Resolution requirements"],
            tools_required=["Method development software", "Validation standards", "Different columns"],
            safety_notes=["Respect column pressure limits", "Validate system compatibility"],
            references=["Fast chromatography guidelines", "Method transfer protocols"]
        )
        self.solutions[runtime_solution.solution_id] = runtime_solution
        
        # Long runtime pattern
        runtime_pattern = DiagnosticPattern(
            pattern_id="long_runtime_detection", 
            name="Extended Runtime Detection",
            category="method_parameters",
            symptoms=["Long analysis time", "Extended gradients", "Late eluting peaks"],
            conditions={
                "total_runtime": {"min": 45.0}  # Runtime > 45 minutes
            },
            confidence_base=0.70,
            solution_ids=[runtime_solution.solution_id]
        )
        self.patterns[runtime_pattern.pattern_id] = runtime_pattern

    def _initialize_instrument_maintenance_knowledge(self):
        """Initialize instrument maintenance knowledge"""
        
        # System noise solution
        noise_solution = TroubleshootingSolution(
            solution_id="noise_reduction_comprehensive",
            title="Comprehensive Noise Reduction Protocol",
            category="instrument_maintenance",
            priority="high",
            difficulty="intermediate",
            estimated_time="2-4 hours",
            description="Systematic approach to identify and eliminate noise sources in GC-MS systems",
            steps=[
                "Perform baseline noise assessment with blank injections",
                "Check detector cleanliness - clean ion source and analyzer",
                "Verify gas purity - replace gas purification filters",
                "Inspect all gas line connections for leaks using leak detector",
                "Check column conditioning - recondition if baseline is unstable",
                "Verify detector temperature stability and calibration",
                "Check electronic noise - inspect cable connections and grounding",
                "Evaluate pump performance and replace if necessary",
                "Clean injection port and replace consumables",
                "Perform system qualification with noise standards",
                "Document improvements and establish new baseline"
            ],
            expected_outcome="Signal-to-noise ratio improved to >10:1 for quantitative analysis, stable baseline achieved",
            prerequisites=["System access", "Maintenance tools", "Cleaning protocols"],
            tools_required=["Detector cleaning kit", "Leak detector", "Gas purification filters", "Electronic multimeter"],
            safety_notes=[
                "Follow lockout/tagout procedures",
                "Use appropriate cleaning solvents",
                "Ensure proper ventilation",
                "Handle detector components carefully"
            ],
            references=["Instrument maintenance manual", "Detector optimization guide"]
        )
        self.solutions[noise_solution.solution_id] = noise_solution
        
        # High noise pattern
        noise_pattern = DiagnosticPattern(
            pattern_id="high_noise_detection",
            name="High Noise Level Detection", 
            category="instrument_performance",
            symptoms=["Poor signal-to-noise", "Baseline instability", "Erratic signals"],
            conditions={
                "signal_to_noise_avg": {"max": 10.0},  # S/N < 10
                "noise_level": {"min": 0.5}
            },
            confidence_base=0.80,
            solution_ids=[noise_solution.solution_id]
        )
        self.patterns[noise_pattern.pattern_id] = noise_pattern

    def _initialize_sample_preparation_knowledge(self):
        """Initialize sample preparation troubleshooting knowledge"""
        
        # Matrix effects solution
        matrix_solution = TroubleshootingSolution(
            solution_id="matrix_effects_mitigation",
            title="Matrix Effects Mitigation Strategy",
            category="sample_preparation",
            priority="medium", 
            difficulty="advanced",
            estimated_time="4-8 hours",
            description="Comprehensive approach to identify and minimize matrix effects in sample analysis",
            steps=[
                "Perform matrix effect assessment using standard addition",
                "Evaluate sample cleanup procedures - SPE, LLE, or dilution",
                "Optimize extraction efficiency for target analytes",
                "Consider internal standard selection for matrix compensation",
                "Evaluate ionization enhancement or suppression patterns",
                "Implement sample dilution strategies if applicable",
                "Consider alternative sample preparation techniques",
                "Validate cleanup procedure recovery and precision",
                "Establish quality control protocols for matrix monitoring",
                "Document procedure and train personnel"
            ],
            expected_outcome="Reduced matrix effects with recovery 80-120% and CV <15% for QC samples",
            prerequisites=["Sample matrix characterization", "Standard addition capability", "Extraction protocols"],
            tools_required=["Extraction cartridges", "Internal standards", "Matrix-matched calibrators"],
            safety_notes=["Handle organic solvents safely", "Use appropriate extraction techniques"],
            references=["Sample preparation guidelines", "Matrix effect evaluation protocols"]
        )
        self.solutions[matrix_solution.solution_id] = matrix_solution

    def _initialize_data_quality_knowledge(self):
        """Initialize data quality troubleshooting knowledge"""
        
        # OCR quality solution
        ocr_solution = TroubleshootingSolution(
            solution_id="ocr_quality_improvement",
            title="OCR Data Quality Enhancement",
            category="data_processing",
            priority="medium",
            difficulty="beginner",
            estimated_time="30-60 minutes", 
            description="Improve optical character recognition accuracy for chromatogram data extraction",
            steps=[
                "Verify image quality - ensure sufficient resolution and contrast",
                "Check image orientation - correct any skew or rotation",
                "Clean image artifacts - remove noise, shadows, or distortions",
                "Optimize OCR preprocessing settings for document type",
                "Manually verify extracted peak data against original chromatogram",
                "Flag low-confidence extractions for manual review",
                "Consider rescanning or re-exporting original data files",
                "Update OCR training data if patterns are consistently missed",
                "Implement quality control checks for automated extractions"
            ],
            expected_outcome="OCR confidence >80% with <5% data extraction errors",
            prerequisites=["Access to original data files", "Image processing software"],
            tools_required=["Image editing software", "OCR validation tools"],
            safety_notes=["Backup original data files before processing"],
            references=["OCR best practices", "Data integrity guidelines"]
        )
        self.solutions[ocr_solution.solution_id] = ocr_solution
        
        # Low OCR confidence pattern
        ocr_pattern = DiagnosticPattern(
            pattern_id="low_ocr_confidence",
            name="Low OCR Confidence Detection",
            category="data_quality",
            symptoms=["Poor text recognition", "Missing peak data", "Extraction errors"],
            conditions={
                "ocr_confidence": {"max": 0.7}  # OCR confidence < 70%
            },
            confidence_base=0.95,
            solution_ids=[ocr_solution.solution_id]
        )
        self.patterns[ocr_pattern.pattern_id] = ocr_pattern

        # Knowledge base entries
        peak_quality_entry = KnowledgeBaseEntry(
            entry_id="peak_quality_fundamentals",
            category="peak_quality",
            title="Peak Quality Fundamentals",
            description="Comprehensive guide to peak quality assessment and optimization",
            symptoms=["Peak tailing", "Poor resolution", "Peak splitting", "Baseline issues"],
            causes=["Column degradation", "Injection issues", "Mobile phase problems", "Temperature effects"],
            diagnostic_criteria={
                "tailing_factor": {"acceptable": "<1.5", "poor": ">2.0"},
                "resolution": {"acceptable": ">1.5", "poor": "<1.0"},
                "theoretical_plates": {"good": ">5000", "poor": "<2000"}
            },
            solutions=[self.solutions["peak_tailing_comprehensive"], self.solutions["resolution_optimization"]],
            applicable_instruments=["GC-MS", "GC-FID", "HPLC"],
            tags=["peaks", "chromatography", "separation", "quality"]
        )
        self.entries[peak_quality_entry.entry_id] = peak_quality_entry
        
        # Update tags index
        for tag in peak_quality_entry.tags:
            if tag not in self.tags_index:
                self.tags_index[tag] = set()
            self.tags_index[tag].add(peak_quality_entry.entry_id)

    def search_by_tags(self, tags: List[str]) -> List[KnowledgeBaseEntry]:
        """Search knowledge base entries by tags"""
        
        if not tags:
            return list(self.entries.values())
        
        matching_entries = set()
        for tag in tags:
            if tag in self.tags_index:
                matching_entries.update(self.tags_index[tag])
        
        return [self.entries[entry_id] for entry_id in matching_entries if entry_id in self.entries]

    def get_entry_by_category(self, category: str) -> List[KnowledgeBaseEntry]:
        """Get all entries for a specific category"""
        
        return [entry for entry in self.entries.values() if entry.category == category]

    def add_custom_solution(self, solution: TroubleshootingSolution) -> bool:
        """Add custom troubleshooting solution to knowledge base"""
        
        try:
            self.solutions[solution.solution_id] = solution
            self.logger.info(f"Added custom solution: {solution.title}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to add custom solution: {e}")
            return False

    def get_statistics(self) -> Dict[str, Any]:
        """Get knowledge base statistics"""
        
        categories = {}
        for entry in self.entries.values():
            categories[entry.category] = categories.get(entry.category, 0) + 1
        
        solution_categories = {}
        for solution in self.solutions.values():
            solution_categories[solution.category] = solution_categories.get(solution.category, 0) + 1
        
        return {
            "total_entries": len(self.entries),
            "total_solutions": len(self.solutions),
            "total_patterns": len(self.patterns),
            "categories": categories,
            "solution_categories": solution_categories,
            "total_tags": len(self.tags_index)
        }