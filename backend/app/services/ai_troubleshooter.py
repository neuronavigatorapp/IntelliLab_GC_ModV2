"""
AI Troubleshooter Service
Advanced AI-powered GC-MS troubleshooting and diagnostic system
"""

import logging
import asyncio
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
import uuid
import numpy as np
import json
from dataclasses import dataclass, asdict

from app.models.schemas import (
    TroubleshooterRequest, TroubleshooterResponse, DiagnosticResult,
    DiagnosticIssue, TroubleshootingSolution, ChromatogramData,
    OCRProcessingResult, KnowledgeBaseEntry, AITroubleshooterHealth,
    PeakData
)
from app.services.knowledge_base import GCMSKnowledgeBase
from app.services.recommendation_engine import AIRecommendationEngine


@dataclass
class AnalysisMetrics:
    """Internal analysis metrics"""
    peak_count: int
    baseline_quality: float
    noise_level: float
    retention_time_precision: float
    peak_symmetry_avg: float
    resolution_avg: float
    signal_to_noise_avg: float


class AITroubleshooterEngine:
    """
    Advanced AI-powered troubleshooting engine for GC-MS systems
    
    Provides intelligent analysis of chromatographic data with:
    - Peak quality assessment
    - Method parameter validation  
    - Instrument performance evaluation
    - Automated solution recommendations
    """

    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.knowledge_base = GCMSKnowledgeBase()
        self.recommendation_engine = AIRecommendationEngine()
        self.analysis_history: List[DiagnosticResult] = []
        self.model_version = "v1.0"
        
        # Performance metrics
        self.total_analyses = 0
        self.successful_analyses = 0
        self.processing_times: List[float] = []
        
        self.logger.info("AI Troubleshooter Engine initialized successfully")

    async def analyze_chromatogram(self, request: TroubleshooterRequest) -> TroubleshooterResponse:
        """
        Perform comprehensive AI analysis of chromatogram data
        
        Args:
            request: Analysis request with chromatogram data and parameters
            
        Returns:
            Complete troubleshooting analysis response
        """
        start_time = datetime.utcnow()
        self.total_analyses += 1
        
        try:
            self.logger.info(f"Starting AI analysis for request {request.request_id}")
            
            # Validate and prepare data
            data_quality_score = await self._assess_data_quality(request)
            if data_quality_score < 0.3:
                return self._create_error_response(request.request_id, "Insufficient data quality for analysis")
            
            # Extract analysis metrics
            metrics = await self._extract_analysis_metrics(request)
            
            # Perform diagnostic analysis
            diagnostic_result = await self._perform_diagnostic_analysis(request, metrics)
            
            # Generate recommendations using recommendation engine
            if request.include_solutions:
                available_solutions = self._get_all_available_solutions()
                prioritized_solutions, immediate_actions, preventive_measures = await self.recommendation_engine.generate_recommendations(
                    diagnostic_result, request, available_solutions
                )
                diagnostic_result.solutions = prioritized_solutions
                diagnostic_result.immediate_actions = immediate_actions
                diagnostic_result.preventive_measures = preventive_measures
            
            # Create executive summary
            executive_summary = self._create_executive_summary(diagnostic_result)
            key_findings = self._extract_key_findings(diagnostic_result)
            critical_alerts = self._identify_critical_alerts(diagnostic_result)
            
            # Calculate processing time
            processing_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            self.processing_times.append(processing_time)
            
            # Create response
            response = TroubleshooterResponse(
                request_id=request.request_id,
                status="completed",
                diagnostic_result=diagnostic_result,
                executive_summary=executive_summary,
                key_findings=key_findings,
                critical_alerts=critical_alerts,
                processing_time_ms=processing_time,
                data_quality_score=data_quality_score,
                analysis_completeness=1.0,
                ai_version=self.model_version
            )
            
            # Store analysis history
            self.analysis_history.append(diagnostic_result)
            if len(self.analysis_history) > 1000:  # Keep last 1000 analyses
                self.analysis_history.pop(0)
            
            self.successful_analyses += 1
            self.logger.info(f"Analysis completed successfully for {request.request_id}")
            
            return response
            
        except Exception as e:
            self.logger.error(f"Analysis failed for {request.request_id}: {str(e)}")
            return self._create_error_response(request.request_id, str(e))

    async def _assess_data_quality(self, request: TroubleshooterRequest) -> float:
        """Assess the quality of input data for analysis"""
        
        quality_factors = []
        
        # Check chromatogram data quality
        if request.chromatogram_data:
            chrom_data = request.chromatogram_data
            
            # Peak data quality (0-1)
            if chrom_data.peaks:
                peak_quality = min(1.0, len(chrom_data.peaks) / 10.0)  # Up to 10 peaks = full quality
                quality_factors.append(peak_quality * 0.4)
            else:
                quality_factors.append(0.0)
            
            # Method parameters completeness
            method_completeness = len(chrom_data.method_parameters or {}) / 10.0  # Assume 10 key parameters
            quality_factors.append(min(1.0, method_completeness) * 0.3)
            
            # Sample info completeness (check for basic required fields)
            sample_completeness = 0.0
            if chrom_data.sample_name:
                sample_completeness += 0.4
            if chrom_data.method_name:
                sample_completeness += 0.4
            if chrom_data.injection_date:
                sample_completeness += 0.2
            quality_factors.append(sample_completeness * 0.2)
            
            # Basic data validity (replace runtime check with area check)
            total_area = getattr(chrom_data, 'total_area', None)
            data_validity = 1.0 if (total_area and total_area > 0) else 0.5
            quality_factors.append(data_validity * 0.1)
        
        # Check OCR data quality
        if request.ocr_data:
            ocr_quality = request.ocr_data.confidence_score
            quality_factors.append(ocr_quality * 0.3)
        
        # Default quality if no data
        if not quality_factors:
            return 0.0
        
        return sum(quality_factors)

    async def _extract_analysis_metrics(self, request: TroubleshooterRequest) -> AnalysisMetrics:
        """Extract key metrics from chromatogram data"""
        
        if not request.chromatogram_data or not request.chromatogram_data.peaks:
            return AnalysisMetrics(
                peak_count=0,
                baseline_quality=0.0,
                noise_level=1.0,
                retention_time_precision=0.0,
                peak_symmetry_avg=0.0,
                resolution_avg=0.0,
                signal_to_noise_avg=0.0
            )
        
        peaks = request.chromatogram_data.peaks
        
        # Basic metrics
        peak_count = len(peaks)
        
        # Peak quality metrics
        tailing_factors = [p.tailing_factor for p in peaks if p.tailing_factor > 0]
        resolution_values = [p.resolution for p in peaks if p.resolution > 0]
        
        # Calculate averages
        peak_symmetry_avg = np.mean(tailing_factors) if tailing_factors else 1.0
        resolution_avg = np.mean(resolution_values) if resolution_values else 0.0
        
        # Estimate baseline quality from peak characteristics
        baseline_quality = self._estimate_baseline_quality(peaks)
        
        # Estimate noise level (inverse of S/N ratios)
        sn_ratios = [getattr(p, 'signal_to_noise_ratio', 10.0) for p in peaks]
        signal_to_noise_avg = np.mean(sn_ratios) if sn_ratios else 10.0
        noise_level = max(0.1, 1.0 / (signal_to_noise_avg / 10.0))
        
        # Retention time precision (coefficient of variation)
        rt_values = [p.retention_time for p in peaks]
        retention_time_precision = 1.0 - (np.std(rt_values) / np.mean(rt_values)) if len(rt_values) > 1 else 1.0
        
        return AnalysisMetrics(
            peak_count=peak_count,
            baseline_quality=baseline_quality,
            noise_level=noise_level,
            retention_time_precision=max(0.0, retention_time_precision),
            peak_symmetry_avg=peak_symmetry_avg,
            resolution_avg=resolution_avg,
            signal_to_noise_avg=signal_to_noise_avg
        )

    def _estimate_baseline_quality(self, peaks: List[PeakData]) -> float:
        """Estimate baseline quality from peak characteristics"""
        
        if not peaks:
            return 0.0
        
        # Use peak width and tailing as indicators
        quality_indicators = []
        
        for peak in peaks:
            # Good baseline = narrow peaks with low tailing
            width_quality = max(0.0, 1.0 - (peak.width_at_half_height / 0.2))  # Assume 0.2 min is poor
            tailing_quality = max(0.0, 2.0 - peak.tailing_factor) / 2.0  # Tailing factor 1.0 = perfect
            
            quality_indicators.extend([width_quality, tailing_quality])
        
        return np.mean(quality_indicators) if quality_indicators else 0.0

    async def _perform_diagnostic_analysis(self, request: TroubleshooterRequest, metrics: AnalysisMetrics) -> DiagnosticResult:
        """Perform comprehensive diagnostic analysis"""
        
        analysis_id = f"analysis_{uuid.uuid4().hex[:8]}"
        start_time = datetime.utcnow()
        
        # Initialize diagnostic result
        diagnostic_result = DiagnosticResult(
            analysis_id=analysis_id,
            overall_score=0.0,
            overall_status="poor",
            processing_time_ms=0,
            ai_model_version=self.model_version
        )
        
        # Analyze different aspects
        issues = []
        
        # 1. Pattern-based Analysis (Primary method using knowledge base)
        pattern_issues = await self.analyze_with_patterns(request, metrics)
        issues.extend(pattern_issues)
        
        # 2. Peak Quality Analysis (Fallback/Additional analysis)
        peak_issues = await self._analyze_peak_quality(request, metrics)
        issues.extend(peak_issues)
        
        # 3. Method Parameter Analysis
        method_issues = await self._analyze_method_parameters(request, metrics)
        issues.extend(method_issues)
        
        # 4. Instrument Performance Analysis
        instrument_issues = await self._analyze_instrument_performance(request, metrics)
        issues.extend(instrument_issues)
        
        # 5. Data Quality Analysis
        data_issues = await self._analyze_data_quality(request, metrics)
        issues.extend(data_issues)
        
        # Remove duplicate issues (same category and similar title)
        issues = self._deduplicate_issues(issues)
        
        # Categorize issues by severity
        critical_count = len([i for i in issues if i.severity == "critical"])
        major_count = len([i for i in issues if i.severity == "major"])
        
        # Calculate overall score (0-100)
        overall_score = self._calculate_overall_score(metrics, issues)
        
        # Determine overall status
        overall_status = self._determine_overall_status(overall_score, critical_count, major_count)
        
        # Update diagnostic result
        diagnostic_result.issues = issues
        diagnostic_result.critical_issues_count = critical_count
        diagnostic_result.major_issues_count = major_count
        diagnostic_result.overall_score = overall_score
        diagnostic_result.overall_status = overall_status
        diagnostic_result.processing_time_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        
        # Store detailed analysis
        diagnostic_result.peak_analysis = self._create_peak_analysis(request, metrics)
        diagnostic_result.method_analysis = self._create_method_analysis(request, metrics)
        diagnostic_result.instrument_analysis = self._create_instrument_analysis(request, metrics)
        
        return diagnostic_result

    async def _analyze_peak_quality(self, request: TroubleshooterRequest, metrics: AnalysisMetrics) -> List[DiagnosticIssue]:
        """Analyze peak quality and identify issues"""
        
        issues = []
        
        if not request.chromatogram_data or not request.chromatogram_data.peaks:
            issues.append(DiagnosticIssue(
                issue_id=f"peak_nodata_{uuid.uuid4().hex[:8]}",
                category="peak_quality",
                severity="critical",
                title="No Peak Data Available",
                description="No peak data was detected or provided for analysis. This prevents comprehensive troubleshooting.",
                confidence=0.95,
                evidence={"peak_count": metrics.peak_count}
            ))
            return issues
        
        # Poor peak symmetry (tailing)
        if metrics.peak_symmetry_avg > 2.0:
            severity = "critical" if metrics.peak_symmetry_avg > 3.0 else "major"
            issues.append(DiagnosticIssue(
                issue_id=f"peak_tailing_{uuid.uuid4().hex[:8]}",
                category="peak_quality",
                severity=severity,
                title="Excessive Peak Tailing",
                description=f"Average tailing factor of {metrics.peak_symmetry_avg:.2f} indicates poor peak shape. Good peaks should have tailing factors between 0.8-1.5.",
                confidence=0.90,
                evidence={"tailing_factor": metrics.peak_symmetry_avg}
            ))
        
        # Poor resolution
        if metrics.resolution_avg < 1.5:
            severity = "major" if metrics.resolution_avg < 1.0 else "minor"
            issues.append(DiagnosticIssue(
                issue_id=f"peak_resolution_{uuid.uuid4().hex[:8]}",
                category="peak_quality",
                severity=severity,
                title="Poor Peak Resolution",
                description=f"Average resolution of {metrics.resolution_avg:.2f} indicates overlapping peaks. Resolution >1.5 is recommended for baseline separation.",
                confidence=0.85,
                evidence={"resolution": metrics.resolution_avg}
            ))
        
        # High noise level
        if metrics.signal_to_noise_avg < 10.0:
            severity = "major" if metrics.signal_to_noise_avg < 5.0 else "minor"
            issues.append(DiagnosticIssue(
                issue_id=f"peak_noise_{uuid.uuid4().hex[:8]}",
                category="peak_quality",
                severity=severity,
                title="Low Signal-to-Noise Ratio",
                description=f"Average S/N ratio of {metrics.signal_to_noise_avg:.1f} indicates high noise levels. S/N >10 is recommended for reliable quantification.",
                confidence=0.80,
                evidence={"signal_to_noise": metrics.signal_to_noise_avg}
            ))
        
        # Poor baseline quality
        if metrics.baseline_quality < 0.6:
            severity = "major" if metrics.baseline_quality < 0.3 else "minor"
            issues.append(DiagnosticIssue(
                issue_id=f"baseline_quality_{uuid.uuid4().hex[:8]}",
                category="peak_quality",
                severity=severity,
                title="Poor Baseline Quality",
                description=f"Baseline quality score of {metrics.baseline_quality:.2f} indicates baseline drift or contamination issues.",
                confidence=0.75,
                evidence={"baseline_quality": metrics.baseline_quality}
            ))
        
        return issues

    async def _analyze_method_parameters(self, request: TroubleshooterRequest, metrics: AnalysisMetrics) -> List[DiagnosticIssue]:
        """Analyze method parameters for optimization opportunities"""
        
        issues = []
        
        if not request.chromatogram_data:
            return issues
        
        method_params = request.chromatogram_data.method_parameters
        
        # Check for critical method parameters
        required_params = ["column_info", "carrier_gas", "injection_volume", "detector_type"]
        missing_params = [param for param in required_params if not method_params.get(param)]
        
        if missing_params:
            issues.append(DiagnosticIssue(
                issue_id=f"method_missing_{uuid.uuid4().hex[:8]}",
                category="method_parameters",
                severity="minor",
                title="Missing Method Parameters",
                description=f"The following method parameters are missing: {', '.join(missing_params)}. This limits analysis accuracy.",
                confidence=0.95,
                evidence={"missing_parameters": missing_params}
            ))
        
        # Analyze runtime efficiency
        total_runtime = request.chromatogram_data.total_runtime
        if total_runtime > 60.0:  # More than 60 minutes
            issues.append(DiagnosticIssue(
                issue_id=f"method_runtime_{uuid.uuid4().hex[:8]}",
                category="method_parameters",
                severity="minor",
                title="Extended Analysis Runtime",
                description=f"Runtime of {total_runtime:.1f} minutes is quite long. Consider method optimization to reduce analysis time.",
                confidence=0.70,
                evidence={"runtime_minutes": total_runtime}
            ))
        
        return issues

    async def _analyze_instrument_performance(self, request: TroubleshooterRequest, metrics: AnalysisMetrics) -> List[DiagnosticIssue]:
        """Analyze instrument performance indicators"""
        
        issues = []
        
        # Check for signs of instrument issues based on peak characteristics
        if metrics.peak_count > 0:
            # Retention time precision indicates column or temperature stability
            if metrics.retention_time_precision < 0.95:
                issues.append(DiagnosticIssue(
                    issue_id=f"instrument_stability_{uuid.uuid4().hex[:8]}",
                    category="instrument_performance",
                    severity="major",
                    title="Poor Retention Time Precision",
                    description=f"Retention time precision of {metrics.retention_time_precision:.3f} suggests instrument instability. Check column temperature control and flow stability.",
                    confidence=0.80,
                    evidence={"rt_precision": metrics.retention_time_precision}
                ))
        
        return issues

    async def _analyze_data_quality(self, request: TroubleshooterRequest, metrics: AnalysisMetrics) -> List[DiagnosticIssue]:
        """Analyze data quality and completeness"""
        
        issues = []
        
        # Check OCR data quality if available
        if request.ocr_data and request.ocr_data.confidence_score < 0.7:
            issues.append(DiagnosticIssue(
                issue_id=f"data_ocr_{uuid.uuid4().hex[:8]}",
                category="data_quality",
                severity="warning",
                title="Low OCR Confidence",
                description=f"OCR confidence of {request.ocr_data.confidence_score:.2f} indicates potential data extraction issues. Verify extracted values manually.",
                confidence=0.90,
                evidence={"ocr_confidence": request.ocr_data.confidence_score}
            ))
        
        return issues

    def _calculate_overall_score(self, metrics: AnalysisMetrics, issues: List[DiagnosticIssue]) -> float:
        """Calculate overall quality score (0-100)"""
        
        base_score = 100.0
        
        # Deduct points for issues
        for issue in issues:
            if issue.severity == "critical":
                base_score -= 25.0
            elif issue.severity == "major":
                base_score -= 15.0
            elif issue.severity == "minor":
                base_score -= 5.0
            elif issue.severity == "warning":
                base_score -= 2.0
        
        # Boost score for good metrics
        if metrics.peak_count > 0:
            if metrics.signal_to_noise_avg > 20.0:
                base_score += 5.0
            if metrics.resolution_avg > 2.0:
                base_score += 5.0
            if metrics.peak_symmetry_avg < 1.2:
                base_score += 5.0
        
        return max(0.0, min(100.0, base_score))

    def _determine_overall_status(self, score: float, critical_count: int, major_count: int) -> str:
        """Determine overall status based on score and issue counts"""
        
        if critical_count > 0:
            return "critical"
        elif score >= 90 and major_count == 0:
            return "excellent"
        elif score >= 75:
            return "good"
        elif score >= 60:
            return "acceptable"
        else:
            return "poor"

    def _create_peak_analysis(self, request: TroubleshooterRequest, metrics: AnalysisMetrics) -> Dict[str, Any]:
        """Create detailed peak analysis summary"""
        
        return {
            "peak_count": metrics.peak_count,
            "average_tailing_factor": metrics.peak_symmetry_avg,
            "average_resolution": metrics.resolution_avg,
            "average_signal_to_noise": metrics.signal_to_noise_avg,
            "baseline_quality": metrics.baseline_quality,
            "retention_time_precision": metrics.retention_time_precision
        }

    def _create_method_analysis(self, request: TroubleshooterRequest, metrics: AnalysisMetrics) -> Dict[str, Any]:
        """Create method analysis summary"""
        
        if not request.chromatogram_data:
            return {}
        
        return {
            "total_runtime": request.chromatogram_data.total_runtime,
            "method_parameters_count": len(request.chromatogram_data.method_parameters),
            "detector_type": request.chromatogram_data.detector_type,
            "instrument_type": request.chromatogram_data.instrument_type
        }

    def _create_instrument_analysis(self, request: TroubleshooterRequest, metrics: AnalysisMetrics) -> Dict[str, Any]:
        """Create instrument analysis summary"""
        
        return {
            "stability_score": metrics.retention_time_precision,
            "noise_level": metrics.noise_level,
            "estimated_column_performance": min(1.0, metrics.resolution_avg / 2.0)
        }

    def _find_solutions_for_issue(self, issue: DiagnosticIssue) -> List[TroubleshootingSolution]:
        """Find applicable solutions for a specific issue using knowledge base"""
        
        # Use knowledge base to find solutions
        issue_keywords = issue.title.split() + issue.description.split()[:5]  # Extract keywords
        solutions = self.knowledge_base.get_solutions_for_issue(issue.category, issue_keywords)
        
        # If no specific solutions found, fall back to basic solutions
        if not solutions:
            if issue.category == "peak_quality":
                if "tailing" in issue.title.lower():
                    solutions.append(self._create_tailing_solution())
                if "resolution" in issue.title.lower():
                    solutions.append(self._create_resolution_solution())
                if "noise" in issue.title.lower():
                    solutions.append(self._create_noise_solution())
            
            elif issue.category == "method_parameters":
                solutions.append(self._create_method_optimization_solution())
            
            elif issue.category == "instrument_performance":
                solutions.append(self._create_maintenance_solution())
        
        return solutions

    def _create_tailing_solution(self) -> TroubleshootingSolution:
        """Create solution for peak tailing issues"""
        
        return TroubleshootingSolution(
            solution_id=f"tailing_fix_{uuid.uuid4().hex[:8]}",
            title="Reduce Peak Tailing",
            category="method_adjustment",
            priority="high",
            difficulty="intermediate",
            estimated_time="30-60 minutes",
            description="Address peak tailing through injection and column optimization",
            steps=[
                "Check injection technique - use fast, smooth injection",
                "Verify sample solvent compatibility with mobile phase",
                "Reduce injection volume if overloading suspected",
                "Check column temperature - increase if necessary",
                "Verify column integrity and consider replacement if severely degraded",
                "Optimize gradient program for better peak shape"
            ],
            expected_outcome="Improved peak symmetry with tailing factors <1.5",
            prerequisites=["Access to method parameters", "Column performance data"],
            tools_required=["GC system", "Standard samples"],
            safety_notes=["Follow instrument safety procedures", "Use appropriate PPE"]
        )

    def _create_resolution_solution(self) -> TroubleshootingSolution:
        """Create solution for resolution issues"""
        
        return TroubleshootingSolution(
            solution_id=f"resolution_fix_{uuid.uuid4().hex[:8]}",
            title="Improve Peak Resolution",
            category="method_adjustment",
            priority="high",
            difficulty="intermediate",
            estimated_time="45-90 minutes",
            description="Optimize chromatographic conditions for better peak separation",
            steps=[
                "Increase column length or use higher efficiency column",
                "Reduce flow rate to increase retention time",
                "Optimize temperature program - slower gradients may help",
                "Consider different stationary phase selectivity",
                "Reduce sample concentration to minimize overloading",
                "Check for column degradation and replace if necessary"
            ],
            expected_outcome="Baseline resolution (Rs > 1.5) between critical peak pairs",
            prerequisites=["Column specifications", "Method development capability"],
            tools_required=["Alternative columns", "Standard mixtures"],
            safety_notes=["Handle columns carefully", "Follow temperature limits"]
        )

    def _create_noise_solution(self) -> TroubleshootingSolution:
        """Create solution for noise issues"""
        
        return TroubleshootingSolution(
            solution_id=f"noise_fix_{uuid.uuid4().hex[:8]}",
            title="Reduce System Noise",
            category="instrument_maintenance",
            priority="medium",
            difficulty="intermediate",
            estimated_time="60-120 minutes",
            description="Address noise sources to improve signal quality",
            steps=[
                "Check detector cleanliness and clean if necessary",
                "Verify carrier gas purity and replace filters",
                "Check for air leaks in the system",
                "Ensure proper detector temperature stability",
                "Verify electrical connections and grounding",
                "Consider detector optimization parameters"
            ],
            expected_outcome="Improved signal-to-noise ratio (>10:1 for quantitative work)",
            prerequisites=["System maintenance knowledge", "Detector access"],
            tools_required=["Cleaning supplies", "Leak detector", "Replacement parts"],
            safety_notes=["Follow detector safety procedures", "Ensure proper ventilation"]
        )

    def _create_method_optimization_solution(self) -> TroubleshootingSolution:
        """Create general method optimization solution"""
        
        return TroubleshootingSolution(
            solution_id=f"method_opt_{uuid.uuid4().hex[:8]}",
            title="Optimize Method Parameters",
            category="method_adjustment",
            priority="medium",
            difficulty="advanced",
            estimated_time="2-4 hours",
            description="Comprehensive method optimization for improved performance",
            steps=[
                "Review and document current method parameters",
                "Evaluate column selection and condition",
                "Optimize temperature program for separation and speed",
                "Adjust flow rate for optimal efficiency",
                "Optimize injection parameters (volume, temperature)",
                "Validate optimized method with standards"
            ],
            expected_outcome="Improved overall method performance and reliability",
            prerequisites=["Method development expertise", "Reference standards"],
            tools_required=["Optimization software", "Standard compounds", "Documentation"],
            safety_notes=["Follow all instrument safety protocols"]
        )

    def _create_maintenance_solution(self) -> TroubleshootingSolution:
        """Create instrument maintenance solution"""
        
        return TroubleshootingSolution(
            solution_id=f"maintenance_{uuid.uuid4().hex[:8]}",
            title="Perform Instrument Maintenance",
            category="instrument_maintenance",
            priority="high",
            difficulty="intermediate",
            estimated_time="2-6 hours",
            description="Systematic instrument maintenance to restore performance",
            steps=[
                "Perform leak check on all gas connections",
                "Clean injection port and replace septa/liner",
                "Check and clean detector components",
                "Verify temperature calibration accuracy",
                "Check flow rate calibration",
                "Replace worn consumables",
                "Perform system qualification check"
            ],
            expected_outcome="Restored instrument performance and reliability",
            prerequisites=["Maintenance training", "Service manual access"],
            tools_required=["Maintenance kit", "Calibration standards", "Cleaning supplies"],
            safety_notes=["Follow lockout/tagout procedures", "Use appropriate PPE"]
        )

    def _create_executive_summary(self, diagnostic_result: DiagnosticResult) -> str:
        """Create executive summary of analysis results"""
        
        if diagnostic_result.critical_issues_count > 0:
            return f"CRITICAL ISSUES DETECTED: {diagnostic_result.critical_issues_count} critical and {diagnostic_result.major_issues_count} major issues require immediate attention. Overall system score: {diagnostic_result.overall_score:.1f}/100."
        elif diagnostic_result.major_issues_count > 0:
            return f"ATTENTION REQUIRED: {diagnostic_result.major_issues_count} major issues identified that may impact data quality. Overall system score: {diagnostic_result.overall_score:.1f}/100. Recommend addressing issues before critical analysis."
        elif diagnostic_result.overall_score >= 80:
            return f"SYSTEM PERFORMING WELL: Overall score of {diagnostic_result.overall_score:.1f}/100 with {len(diagnostic_result.issues)} minor issues. System is operating within acceptable parameters."
        else:
            return f"MODERATE CONCERNS: Overall score of {diagnostic_result.overall_score:.1f}/100 indicates room for improvement. {len(diagnostic_result.issues)} issues identified for optimization."

    def _extract_key_findings(self, diagnostic_result: DiagnosticResult) -> List[str]:
        """Extract key findings from analysis"""
        
        findings = []
        
        # Summarize by category
        categories = {}
        for issue in diagnostic_result.issues:
            if issue.category not in categories:
                categories[issue.category] = []
            categories[issue.category].append(issue)
        
        for category, issues in categories.items():
            severe_issues = [i for i in issues if i.severity in ["critical", "major"]]
            if severe_issues:
                findings.append(f"{category.replace('_', ' ').title()}: {len(severe_issues)} significant issue(s) detected")
        
        # Add performance highlights
        if diagnostic_result.overall_score >= 85:
            findings.append(f"Excellent overall performance (Score: {diagnostic_result.overall_score:.1f}/100)")
        
        return findings

    def _identify_critical_alerts(self, diagnostic_result: DiagnosticResult) -> List[str]:
        """Identify critical alerts requiring immediate attention"""
        
        alerts = []
        
        for issue in diagnostic_result.issues:
            if issue.severity == "critical":
                alerts.append(f"CRITICAL: {issue.title} - {issue.description}")
        
        return alerts

    def _create_error_response(self, request_id: str, error_message: str) -> TroubleshooterResponse:
        """Create error response for failed analysis"""
        
        return TroubleshooterResponse(
            request_id=request_id,
            status="failed",
            executive_summary=f"Analysis failed: {error_message}",
            processing_time_ms=0,
            data_quality_score=0.0,
            analysis_completeness=0.0,
            errors=[error_message],
            ai_version=self.model_version
        )

    async def analyze_with_patterns(self, request: TroubleshooterRequest, metrics: AnalysisMetrics) -> List[DiagnosticIssue]:
        """Use knowledge base patterns for intelligent issue detection"""
        
        issues = []
        
        # Convert metrics to dict for pattern matching
        metrics_dict = asdict(metrics)
        
        # Find applicable diagnostic patterns
        applicable_patterns = self.knowledge_base.find_applicable_patterns(metrics_dict)
        
        for pattern in applicable_patterns:
            # Create diagnostic issue from pattern
            issue = DiagnosticIssue(
                issue_id=f"pattern_{pattern.pattern_id}_{uuid.uuid4().hex[:8]}",
                category=pattern.category,
                severity=self._determine_pattern_severity(pattern, metrics_dict),
                title=pattern.name,
                description=f"Pattern-based detection: {', '.join(pattern.symptoms)}",
                confidence=self.knowledge_base._evaluate_pattern_match(pattern, metrics_dict),
                evidence={"pattern_conditions": pattern.conditions, "detected_metrics": metrics_dict}
            )
            issues.append(issue)
        
        return issues

    def _determine_pattern_severity(self, pattern, metrics: Dict[str, Any]) -> str:
        """Determine severity based on pattern conditions and metrics"""
        
        # This is a simplified severity determination
        # In practice, this would be more sophisticated
        
        if pattern.category == "peak_quality":
            if "tailing" in pattern.name.lower():
                tailing_value = metrics.get("peak_symmetry_avg", 1.0)
                if tailing_value > 3.0:
                    return "critical"
                elif tailing_value > 2.0:
                    return "major"
                else:
                    return "minor"
            
            if "resolution" in pattern.name.lower():
                resolution_value = metrics.get("resolution_avg", 2.0)
                if resolution_value < 1.0:
                    return "major"
                else:
                    return "minor"
        
        elif pattern.category == "instrument_performance":
            if "noise" in pattern.name.lower():
                sn_value = metrics.get("signal_to_noise_avg", 20.0)
                if sn_value < 5.0:
                    return "major"
                else:
                    return "minor"
        
        return "warning"

    def _deduplicate_issues(self, issues: List[DiagnosticIssue]) -> List[DiagnosticIssue]:
        """Remove duplicate or overlapping issues"""
        
        if not issues:
            return issues
        
        # Group issues by category and similar titles
        unique_issues = {}
        
        for issue in issues:
            # Create a key based on category and normalized title
            key = f"{issue.category}_{issue.title.lower().replace(' ', '_')}"
            
            # Keep the issue with highest confidence
            if key not in unique_issues or issue.confidence > unique_issues[key].confidence:
                unique_issues[key] = issue
        
        return list(unique_issues.values())

    def _get_all_available_solutions(self) -> List[TroubleshootingSolution]:
        """Get all available solutions from knowledge base and built-in solutions"""
        
        # Get solutions from knowledge base
        kb_solutions = list(self.knowledge_base.solutions.values())
        
        # Add any additional built-in solutions if needed
        additional_solutions = []
        
        return kb_solutions + additional_solutions

    def get_health_status(self) -> AITroubleshooterHealth:
        """Get current service health status"""
        
        success_rate = self.successful_analyses / max(1, self.total_analyses)
        avg_processing_time = np.mean(self.processing_times) if self.processing_times else 0.0
        kb_stats = self.knowledge_base.get_statistics()
        
        return AITroubleshooterHealth(
            service_status="operational" if success_rate > 0.8 else "degraded",
            knowledge_base_entries=kb_stats["total_entries"],
            total_analyses=self.total_analyses,
            success_rate=success_rate,
            average_processing_time_ms=avg_processing_time,
            last_analysis=self.analysis_history[-1].timestamp if self.analysis_history else None,
            active_models=[self.model_version]
        )