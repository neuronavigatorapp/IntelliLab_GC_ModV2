"""
AI Recommendation System
Intelligent solution prioritization and recommendation engine for GC-MS troubleshooting
"""

import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
import uuid
from dataclasses import dataclass
import heapq

from app.models.schemas import (
    DiagnosticIssue, TroubleshootingSolution, DiagnosticResult,
    TroubleshooterRequest, ChromatogramData
)


@dataclass
class SolutionScore:
    """Solution scoring for prioritization"""
    solution: TroubleshootingSolution
    relevance_score: float
    urgency_score: float
    feasibility_score: float
    impact_score: float
    overall_score: float


class AIRecommendationEngine:
    """
    Intelligent recommendation engine for GC-MS troubleshooting
    
    Features:
    - Priority-based solution ranking
    - Context-aware recommendations
    - Step-by-step guidance generation
    - Resource requirement analysis
    - Success probability estimation
    """

    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # Scoring weights for recommendation prioritization
        self.scoring_weights = {
            "relevance": 0.35,      # How well solution matches the issue
            "urgency": 0.25,        # How urgent the issue is
            "feasibility": 0.25,    # How easy/practical to implement
            "impact": 0.15          # Expected improvement impact
        }
        
        # Issue severity to urgency mapping
        self.severity_urgency_map = {
            "critical": 1.0,
            "major": 0.8,
            "minor": 0.4,
            "warning": 0.2,
            "info": 0.1
        }
        
        # Difficulty to feasibility mapping
        self.difficulty_feasibility_map = {
            "beginner": 1.0,
            "intermediate": 0.7,
            "advanced": 0.4,
            "expert": 0.2
        }

    async def generate_recommendations(
        self,
        diagnostic_result: DiagnosticResult,
        request: TroubleshooterRequest,
        available_solutions: List[TroubleshootingSolution]
    ) -> Tuple[List[TroubleshootingSolution], List[str], List[str]]:
        """
        Generate prioritized recommendations based on diagnostic results
        
        Returns:
            Tuple of (prioritized_solutions, immediate_actions, preventive_measures)
        """
        
        self.logger.info(f"Generating recommendations for {len(diagnostic_result.issues)} issues")
        
        # Score and rank solutions
        scored_solutions = await self._score_solutions(
            diagnostic_result.issues, 
            available_solutions, 
            request
        )
        
        # Filter and prioritize solutions
        prioritized_solutions = self._prioritize_solutions(scored_solutions, max_solutions=10)
        
        # Generate immediate actions
        immediate_actions = self._generate_immediate_actions(diagnostic_result.issues)
        
        # Generate preventive measures
        preventive_measures = self._generate_preventive_measures(
            diagnostic_result.issues, 
            request.chromatogram_data
        )
        
        self.logger.info(f"Generated {len(prioritized_solutions)} prioritized solutions")
        
        return prioritized_solutions, immediate_actions, preventive_measures

    async def _score_solutions(
        self,
        issues: List[DiagnosticIssue],
        solutions: List[TroubleshootingSolution],
        request: TroubleshooterRequest
    ) -> List[SolutionScore]:
        """Score solutions for prioritization"""
        
        scored_solutions = []
        
        for solution in solutions:
            # Calculate component scores
            relevance_score = self._calculate_relevance_score(solution, issues)
            urgency_score = self._calculate_urgency_score(solution, issues)
            feasibility_score = self._calculate_feasibility_score(solution, request)
            impact_score = self._calculate_impact_score(solution, issues)
            
            # Calculate weighted overall score
            overall_score = (
                relevance_score * self.scoring_weights["relevance"] +
                urgency_score * self.scoring_weights["urgency"] +
                feasibility_score * self.scoring_weights["feasibility"] +
                impact_score * self.scoring_weights["impact"]
            )
            
            scored_solution = SolutionScore(
                solution=solution,
                relevance_score=relevance_score,
                urgency_score=urgency_score,
                feasibility_score=feasibility_score,
                impact_score=impact_score,
                overall_score=overall_score
            )
            
            scored_solutions.append(scored_solution)
        
        return scored_solutions

    def _calculate_relevance_score(
        self, 
        solution: TroubleshootingSolution, 
        issues: List[DiagnosticIssue]
    ) -> float:
        """Calculate how relevant a solution is to the detected issues"""
        
        if not issues:
            return 0.0
        
        relevance_scores = []
        
        for issue in issues:
            score = 0.0
            
            # Category match
            if solution.category.replace("_", " ") in issue.category.replace("_", " "):
                score += 0.6
            
            # Title/description keyword matching
            solution_text = f"{solution.title} {solution.description}".lower()
            issue_text = f"{issue.title} {issue.description}".lower()
            
            # Simple keyword matching
            common_keywords = self._find_common_keywords(solution_text, issue_text)
            if common_keywords:
                score += min(0.4, len(common_keywords) * 0.1)
            
            # Adjust by issue confidence
            score *= issue.confidence
            
            relevance_scores.append(score)
        
        return min(1.0, max(relevance_scores)) if relevance_scores else 0.0

    def _calculate_urgency_score(
        self,
        solution: TroubleshootingSolution,
        issues: List[DiagnosticIssue]
    ) -> float:
        """Calculate urgency based on issue severity and solution priority"""
        
        if not issues:
            return 0.0
        
        # Find highest severity issue this solution could address
        max_urgency = 0.0
        
        for issue in issues:
            issue_urgency = self.severity_urgency_map.get(issue.severity, 0.1)
            
            # Check if solution is relevant to this issue
            if self._is_solution_relevant_to_issue(solution, issue):
                max_urgency = max(max_urgency, issue_urgency)
        
        # Adjust by solution priority
        priority_multiplier = {
            "immediate": 1.0,
            "high": 0.8,
            "medium": 0.6,
            "low": 0.3
        }.get(solution.priority, 0.5)
        
        return max_urgency * priority_multiplier

    def _calculate_feasibility_score(
        self,
        solution: TroubleshootingSolution,
        request: TroubleshooterRequest
    ) -> float:
        """Calculate how feasible a solution is to implement"""
        
        base_feasibility = self.difficulty_feasibility_map.get(solution.difficulty, 0.5)
        
        # Adjust based on available context/data
        if request.chromatogram_data:
            # More data available makes solutions more feasible
            base_feasibility *= 1.1
        
        if request.user_context.get("experience_level") == "beginner" and solution.difficulty in ["advanced", "expert"]:
            base_feasibility *= 0.5
        
        # Consider estimated time (shorter = more feasible)
        time_str = solution.estimated_time.lower()
        if "minute" in time_str:
            time_factor = 1.0  # Quick solutions are very feasible
        elif "hour" in time_str and "1-2" in time_str:
            time_factor = 0.8  # Short solutions are feasible
        elif "hour" in time_str:
            time_factor = 0.6  # Longer solutions less feasible
        else:
            time_factor = 0.5  # Unknown time
        
        return min(1.0, base_feasibility * time_factor)

    def _calculate_impact_score(
        self,
        solution: TroubleshootingSolution,
        issues: List[DiagnosticIssue]
    ) -> float:
        """Calculate expected impact/improvement from solution"""
        
        # Base impact by solution category
        category_impact = {
            "method_adjustment": 0.8,      # High impact on method performance
            "instrument_maintenance": 0.9,  # High impact on overall performance
            "sample_preparation": 0.7,     # Moderate impact
            "data_processing": 0.5,        # Lower direct impact
            "preventive": 0.6             # Moderate long-term impact
        }.get(solution.category, 0.5)
        
        # Adjust by number/severity of issues it addresses
        addressable_issues = [
            issue for issue in issues 
            if self._is_solution_relevant_to_issue(solution, issue)
        ]
        
        if addressable_issues:
            severity_bonus = sum(
                self.severity_urgency_map.get(issue.severity, 0.1)
                for issue in addressable_issues
            ) / len(addressable_issues)
            category_impact *= (1 + severity_bonus * 0.5)
        
        return min(1.0, category_impact)

    def _is_solution_relevant_to_issue(
        self,
        solution: TroubleshootingSolution,
        issue: DiagnosticIssue
    ) -> bool:
        """Check if a solution is relevant to a specific issue"""
        
        # Category match
        if solution.category.replace("_", " ") in issue.category.replace("_", " "):
            return True
        
        # Keyword match
        solution_text = f"{solution.title} {solution.description}".lower()
        issue_text = f"{issue.title} {issue.description}".lower()
        
        return len(self._find_common_keywords(solution_text, issue_text)) > 0

    def _find_common_keywords(self, text1: str, text2: str) -> List[str]:
        """Find common keywords between two texts"""
        
        # Simple keyword extraction (in practice, this would be more sophisticated)
        keywords1 = set(text1.split())
        keywords2 = set(text2.split())
        
        # Filter out common words
        stop_words = {"the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by"}
        keywords1 -= stop_words
        keywords2 -= stop_words
        
        # Find meaningful overlaps (3+ characters)
        common = [kw for kw in keywords1 & keywords2 if len(kw) >= 3]
        
        return common

    def _prioritize_solutions(
        self,
        scored_solutions: List[SolutionScore],
        max_solutions: int = 10
    ) -> List[TroubleshootingSolution]:
        """Prioritize and filter solutions"""
        
        # Sort by overall score (descending)
        scored_solutions.sort(key=lambda x: x.overall_score, reverse=True)
        
        # Take top solutions
        top_solutions = scored_solutions[:max_solutions]
        
        # Extract just the solutions
        return [scored.solution for scored in top_solutions]

    def _generate_immediate_actions(self, issues: List[DiagnosticIssue]) -> List[str]:
        """Generate immediate actions based on detected issues"""
        
        actions = []
        
        # Handle critical issues first
        critical_issues = [issue for issue in issues if issue.severity == "critical"]
        
        for issue in critical_issues:
            if issue.category == "peak_quality":
                if "tailing" in issue.title.lower():
                    actions.append("CRITICAL: Check injection technique and reduce injection volume immediately")
                elif "resolution" in issue.title.lower():
                    actions.append("CRITICAL: Verify column condition and consider emergency column replacement")
                elif "noise" in issue.title.lower():
                    actions.append("CRITICAL: Check detector cleanliness and gas supply quality")
            
            elif issue.category == "instrument_performance":
                actions.append(f"CRITICAL: Stop analysis and investigate instrument issue: {issue.title}")
            
            elif issue.category == "data_quality":
                actions.append("CRITICAL: Verify data integrity before proceeding with analysis")
        
        # Handle major issues
        major_issues = [issue for issue in issues if issue.severity == "major"]
        
        for issue in major_issues[:3]:  # Limit to top 3 major issues
            if issue.category == "peak_quality":
                actions.append(f"Investigate and address: {issue.title}")
            elif issue.category == "method_parameters":
                actions.append(f"Review method settings: {issue.title}")
        
        # Add general recommendations if no specific actions
        if not actions and issues:
            actions.append("Review system performance and consider optimization")
        
        return actions

    def _generate_preventive_measures(
        self,
        issues: List[DiagnosticIssue],
        chromatogram_data: Optional[ChromatogramData]
    ) -> List[str]:
        """Generate preventive measures to avoid future issues"""
        
        measures = []
        
        # General preventive measures based on detected patterns
        issue_categories = set(issue.category for issue in issues)
        
        if "peak_quality" in issue_categories:
            measures.extend([
                "Implement regular column performance monitoring",
                "Establish injection technique training program",
                "Schedule preventive column maintenance",
                "Monitor peak shape trends over time"
            ])
        
        if "instrument_performance" in issue_categories:
            measures.extend([
                "Implement proactive maintenance schedule",
                "Monitor detector performance metrics",
                "Establish gas quality monitoring program",
                "Create system performance baselines"
            ])
        
        if "method_parameters" in issue_categories:
            measures.extend([
                "Review and optimize method parameters quarterly",
                "Implement method validation checks",
                "Document method performance trends",
                "Consider automated method optimization tools"
            ])
        
        if "data_quality" in issue_categories:
            measures.extend([
                "Implement data quality checks in acquisition",
                "Establish backup and data integrity procedures",
                "Train personnel on data validation techniques",
                "Consider automated data quality monitoring"
            ])
        
        # Limit to most relevant measures
        return measures[:6]

    def create_step_by_step_guide(
        self,
        solution: TroubleshootingSolution,
        context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Create detailed step-by-step implementation guide"""
        
        guide = {
            "solution_title": solution.title,
            "overview": solution.description,
            "difficulty": solution.difficulty,
            "estimated_time": solution.estimated_time,
            "prerequisites_check": self._create_prerequisites_checklist(solution),
            "detailed_steps": self._enhance_solution_steps(solution, context),
            "verification_steps": self._create_verification_steps(solution),
            "troubleshooting_tips": self._create_troubleshooting_tips(solution),
            "safety_reminders": solution.safety_notes,
            "success_indicators": self._create_success_indicators(solution)
        }
        
        return guide

    def _create_prerequisites_checklist(self, solution: TroubleshootingSolution) -> List[Dict[str, Any]]:
        """Create checklist for prerequisites"""
        
        checklist = []
        
        for prereq in solution.prerequisites:
            checklist.append({
                "item": prereq,
                "status": "unchecked",
                "importance": "required",
                "notes": ""
            })
        
        return checklist

    def _enhance_solution_steps(
        self,
        solution: TroubleshootingSolution,
        context: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """Enhance solution steps with additional context and guidance"""
        
        enhanced_steps = []
        
        for i, step in enumerate(solution.steps):
            enhanced_step = {
                "step_number": i + 1,
                "instruction": step,
                "estimated_time": self._estimate_step_time(step, solution.estimated_time),
                "difficulty": self._estimate_step_difficulty(step),
                "tools_needed": self._identify_step_tools(step, solution.tools_required),
                "safety_notes": self._identify_step_safety(step, solution.safety_notes),
                "verification": self._create_step_verification(step),
                "common_issues": self._identify_step_issues(step)
            }
            
            enhanced_steps.append(enhanced_step)
        
        return enhanced_steps

    def _estimate_step_time(self, step: str, total_time: str) -> str:
        """Estimate time for individual step"""
        
        # Simple heuristic based on step content
        if any(word in step.lower() for word in ["check", "verify", "inspect"]):
            return "5-10 minutes"
        elif any(word in step.lower() for word in ["clean", "replace", "adjust"]):
            return "15-30 minutes"
        elif any(word in step.lower() for word in ["calibrate", "optimize", "validate"]):
            return "30-60 minutes"
        else:
            return "10-20 minutes"

    def _estimate_step_difficulty(self, step: str) -> str:
        """Estimate difficulty for individual step"""
        
        if any(word in step.lower() for word in ["check", "verify", "document"]):
            return "Easy"
        elif any(word in step.lower() for word in ["adjust", "clean", "replace"]):
            return "Moderate"
        elif any(word in step.lower() for word in ["calibrate", "optimize", "troubleshoot"]):
            return "Advanced"
        else:
            return "Moderate"

    def _identify_step_tools(self, step: str, all_tools: List[str]) -> List[str]:
        """Identify tools needed for specific step"""
        
        # Simple keyword matching
        step_lower = step.lower()
        relevant_tools = []
        
        for tool in all_tools:
            if any(word in step_lower for word in tool.lower().split()):
                relevant_tools.append(tool)
        
        return relevant_tools

    def _identify_step_safety(self, step: str, all_safety_notes: List[str]) -> List[str]:
        """Identify safety considerations for specific step"""
        
        # Simple keyword matching
        step_lower = step.lower()
        relevant_safety = []
        
        for note in all_safety_notes:
            if any(word in step_lower for word in ["clean", "chemical", "solvent", "temperature"]):
                relevant_safety.append(note)
        
        return relevant_safety

    def _create_step_verification(self, step: str) -> str:
        """Create verification method for step"""
        
        if "check" in step.lower():
            return "Verify that the check passes expected criteria"
        elif "clean" in step.lower():
            return "Confirm surface is clean and free of contamination"
        elif "replace" in step.lower():
            return "Verify new component is properly installed and functioning"
        elif "adjust" in step.lower():
            return "Confirm parameter is within specified range"
        else:
            return "Verify step completion and document results"

    def _identify_step_issues(self, step: str) -> List[str]:
        """Identify common issues for step"""
        
        # Basic common issues based on step type
        if "injection" in step.lower():
            return ["Inconsistent injection volume", "Syringe blockage", "Temperature effects"]
        elif "column" in step.lower():
            return ["Pressure issues", "Temperature instability", "Contamination"]
        elif "detector" in step.lower():
            return ["Baseline drift", "Noise increase", "Sensitivity loss"]
        else:
            return ["Unexpected results", "Equipment malfunction"]

    def _create_verification_steps(self, solution: TroubleshootingSolution) -> List[str]:
        """Create verification steps for solution implementation"""
        
        return [
            "Run blank injection to verify baseline stability",
            "Inject standard to confirm peak shape improvement",
            "Document performance metrics before/after changes",
            "Verify system meets acceptance criteria",
            "Update method documentation if needed"
        ]

    def _create_troubleshooting_tips(self, solution: TroubleshootingSolution) -> List[str]:
        """Create troubleshooting tips for solution implementation"""
        
        return [
            "If no improvement seen, recheck all steps carefully",
            "Consider multiple root causes if issue persists",
            "Document all changes made for future reference",
            "Consult instrument manual for specific procedures",
            "Contact technical support if problems continue"
        ]

    def _create_success_indicators(self, solution: TroubleshootingSolution) -> List[str]:
        """Create success indicators for solution"""
        
        indicators = [solution.expected_outcome]
        
        # Add category-specific indicators
        if solution.category == "method_adjustment":
            indicators.extend([
                "Improved peak shape and symmetry",
                "Better resolution between peaks",
                "More consistent retention times",
                "Reduced analysis variability"
            ])
        elif solution.category == "instrument_maintenance":
            indicators.extend([
                "Stable baseline performance", 
                "Improved signal-to-noise ratio",
                "Consistent system performance",
                "Reduced maintenance alerts"
            ])
        
        return indicators