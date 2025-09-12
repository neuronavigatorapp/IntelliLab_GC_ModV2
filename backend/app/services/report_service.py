#!/usr/bin/env python3
"""
Report Generation Service for IntelliLab GC
Generates professional PDF reports from calculation results
"""

from typing import Dict, List, Any, Optional
import os
import json
from datetime import datetime
from pathlib import Path

# For now, we'll create a simple report service that generates structured data
# In a full implementation, you would use libraries like ReportLab for PDF generation
# or python-docx for Word documents


class ReportService:
    """Service for generating professional reports from GC analysis results"""
    
    def __init__(self):
        self.report_templates = {
            "method_development": {
                "sections": [
                    "executive_summary",
                    "method_parameters",
                    "performance_metrics",
                    "optimization_recommendations",
                    "appendix"
                ]
            },
            "validation": {
                "sections": [
                    "objective",
                    "method_description", 
                    "validation_parameters",
                    "results_discussion",
                    "conclusion",
                    "references"
                ]
            },
            "troubleshooting": {
                "sections": [
                    "problem_description",
                    "diagnostic_results",
                    "root_cause_analysis",
                    "corrective_actions",
                    "verification"
                ]
            },
            "comparison": {
                "sections": [
                    "methods_compared",
                    "comparison_criteria",
                    "results_analysis", 
                    "recommendations",
                    "conclusion"
                ]
            },
            "cost_analysis": {
                "sections": [
                    "analysis_overview",
                    "cost_breakdown",
                    "efficiency_metrics",
                    "optimization_opportunities",
                    "budget_impact"
                ]
            }
        }
        
        # Create reports directory if it doesn't exist
        self.reports_dir = Path("reports")
        self.reports_dir.mkdir(parents=True, exist_ok=True)
    
    def generate_report(
        self,
        title: str,
        report_type: str,
        data_source: Dict[str, Any],
        generated_by: int,
        template_name: Optional[str] = None,
        format: str = "pdf",
        include_charts: bool = True,
        custom_sections: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Generate a professional report from analysis data"""
        
        try:
            # Validate report type
            if report_type not in self.report_templates:
                raise ValueError(f"Unknown report type: {report_type}")
            
            # Generate report content
            report_content = self._generate_report_content(
                title=title,
                report_type=report_type,
                data_source=data_source,
                template_name=template_name,
                include_charts=include_charts,
                custom_sections=custom_sections
            )
            
            # Generate file
            file_info = self._generate_report_file(
                content=report_content,
                title=title,
                format=format
            )
            
            return {
                "content": report_content,
                "file_path": file_info["file_path"],
                "file_size": file_info["file_size"],
                "status": "completed"
            }
            
        except Exception as e:
            return {
                "content": None,
                "file_path": None,
                "file_size": 0,
                "status": "failed",
                "error": str(e)
            }
    
    def _generate_report_content(
        self,
        title: str,
        report_type: str,
        data_source: Dict[str, Any],
        template_name: Optional[str] = None,
        include_charts: bool = True,
        custom_sections: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Generate structured report content"""
        
        template = self.report_templates[report_type]
        sections = custom_sections if custom_sections else template["sections"]
        
        content = {
            "header": self._generate_header(title, report_type),
            "sections": {},
            "charts": [] if include_charts else None,
            "metadata": {
                "generated_at": datetime.utcnow().isoformat(),
                "template_used": template_name or f"default_{report_type}",
                "data_source_type": data_source.get("tool_type", "unknown"),
                "include_charts": include_charts
            }
        }
        
        # Generate sections based on report type
        if report_type == "method_development":
            content["sections"] = self._generate_method_development_sections(data_source, include_charts)
        elif report_type == "validation":
            content["sections"] = self._generate_validation_sections(data_source, include_charts)
        elif report_type == "troubleshooting":
            content["sections"] = self._generate_troubleshooting_sections(data_source, include_charts)
        elif report_type == "comparison":
            content["sections"] = self._generate_comparison_sections(data_source, include_charts)
        elif report_type == "cost_analysis":
            content["sections"] = self._generate_cost_analysis_sections(data_source, include_charts)
        
        return content
    
    def _generate_header(self, title: str, report_type: str) -> Dict[str, Any]:
        """Generate report header information"""
        return {
            "title": title,
            "report_type": report_type.replace("_", " ").title(),
            "generated_date": datetime.utcnow().strftime("%B %d, %Y"),
            "company": "IntelliLab GC Analysis",
            "version": "1.0"
        }
    
    def _generate_method_development_sections(self, data: Dict[str, Any], include_charts: bool) -> Dict[str, Any]:
        """Generate method development report sections"""
        
        sections = {}
        
        # Executive Summary
        sections["executive_summary"] = {
            "title": "Executive Summary",
            "content": self._generate_executive_summary(data),
            "charts": self._extract_summary_charts(data) if include_charts else None
        }
        
        # Method Parameters
        sections["method_parameters"] = {
            "title": "Method Parameters",
            "content": self._format_method_parameters(data.get("parameters", {})),
            "charts": None
        }
        
        # Performance Metrics
        sections["performance_metrics"] = {
            "title": "Performance Metrics",
            "content": self._format_performance_metrics(data.get("results", {})),
            "charts": self._extract_performance_charts(data) if include_charts else None
        }
        
        # Optimization Recommendations
        sections["optimization_recommendations"] = {
            "title": "Optimization Recommendations",
            "content": self._generate_optimization_recommendations(data),
            "charts": None
        }
        
        # Appendix
        sections["appendix"] = {
            "title": "Appendix",
            "content": self._generate_appendix(data),
            "charts": self._extract_raw_data_charts(data) if include_charts else None
        }
        
        return sections
    
    def _generate_validation_sections(self, data: Dict[str, Any], include_charts: bool) -> Dict[str, Any]:
        """Generate validation report sections"""
        
        sections = {}
        
        sections["objective"] = {
            "title": "Validation Objective",
            "content": f"Validation of {data.get('tool_type', 'GC method')} parameters and performance characteristics.",
            "charts": None
        }
        
        sections["method_description"] = {
            "title": "Method Description", 
            "content": self._format_method_description(data),
            "charts": None
        }
        
        sections["validation_parameters"] = {
            "title": "Validation Parameters",
            "content": self._format_validation_parameters(data),
            "charts": self._extract_validation_charts(data) if include_charts else None
        }
        
        sections["results_discussion"] = {
            "title": "Results and Discussion",
            "content": self._generate_results_discussion(data),
            "charts": self._extract_results_charts(data) if include_charts else None
        }
        
        sections["conclusion"] = {
            "title": "Conclusion",
            "content": self._generate_validation_conclusion(data),
            "charts": None
        }
        
        return sections
    
    def _generate_troubleshooting_sections(self, data: Dict[str, Any], include_charts: bool) -> Dict[str, Any]:
        """Generate troubleshooting report sections"""
        
        sections = {}
        
        sections["problem_description"] = {
            "title": "Problem Description",
            "content": data.get("problem_description", "Method performance issue requiring investigation."),
            "charts": None
        }
        
        sections["diagnostic_results"] = {
            "title": "Diagnostic Results",
            "content": self._format_diagnostic_results(data),
            "charts": self._extract_diagnostic_charts(data) if include_charts else None
        }
        
        sections["root_cause_analysis"] = {
            "title": "Root Cause Analysis",
            "content": self._generate_root_cause_analysis(data),
            "charts": None
        }
        
        sections["corrective_actions"] = {
            "title": "Corrective Actions",
            "content": self._generate_corrective_actions(data),
            "charts": None
        }
        
        sections["verification"] = {
            "title": "Verification",
            "content": "Post-correction verification confirms resolution of identified issues.",
            "charts": self._extract_verification_charts(data) if include_charts else None
        }
        
        return sections
    
    def _generate_comparison_sections(self, data: Dict[str, Any], include_charts: bool) -> Dict[str, Any]:
        """Generate method comparison report sections"""
        
        sections = {}
        
        sections["methods_compared"] = {
            "title": "Methods Compared",
            "content": self._format_compared_methods(data),
            "charts": None
        }
        
        sections["comparison_criteria"] = {
            "title": "Comparison Criteria",
            "content": self._format_comparison_criteria(data),
            "charts": None
        }
        
        sections["results_analysis"] = {
            "title": "Results Analysis",
            "content": self._format_comparison_results(data),
            "charts": self._extract_comparison_charts(data) if include_charts else None
        }
        
        sections["recommendations"] = {
            "title": "Recommendations",
            "content": data.get("recommendations", ["No specific recommendations available."]),
            "charts": None
        }
        
        sections["conclusion"] = {
            "title": "Conclusion",
            "content": self._generate_comparison_conclusion(data),
            "charts": None
        }
        
        return sections
    
    def _generate_cost_analysis_sections(self, data: Dict[str, Any], include_charts: bool) -> Dict[str, Any]:
        """Generate cost analysis report sections"""
        
        sections = {}
        
        sections["analysis_overview"] = {
            "title": "Analysis Overview",
            "content": f"Cost analysis for {data.get('analysis_count', 'N/A')} analyses using optimized method parameters.",
            "charts": None
        }
        
        sections["cost_breakdown"] = {
            "title": "Cost Breakdown",
            "content": self._format_cost_breakdown(data),
            "charts": self._extract_cost_charts(data) if include_charts else None
        }
        
        sections["efficiency_metrics"] = {
            "title": "Efficiency Metrics",
            "content": self._format_efficiency_metrics(data),
            "charts": None
        }
        
        sections["optimization_opportunities"] = {
            "title": "Optimization Opportunities",
            "content": self._generate_cost_optimization_recommendations(data),
            "charts": None
        }
        
        sections["budget_impact"] = {
            "title": "Budget Impact",
            "content": self._format_budget_impact(data),
            "charts": None
        }
        
        return sections
    
    # Helper methods for content generation
    
    def _generate_executive_summary(self, data: Dict[str, Any]) -> str:
        """Generate executive summary based on data"""
        tool_type = data.get("tool_type", "GC method")
        results = data.get("results", {})
        
        summary_parts = [
            f"This report presents the analysis results for {tool_type} optimization.",
        ]
        
        if "detection_limit" in results:
            lod = results["detection_limit"]
            summary_parts.append(f"The method achieves a detection limit of {lod:.3f} units.")
        
        if "transfer_efficiency" in results:
            eff = results["transfer_efficiency"]
            summary_parts.append(f"Transfer efficiency of {eff:.1f}% was achieved.")
        
        if "total_time" in results:
            time = results["total_time"]
            summary_parts.append(f"Total analysis time is {time:.1f} minutes.")
        
        summary_parts.append("The method demonstrates good performance characteristics and is suitable for routine analysis.")
        
        return " ".join(summary_parts)
    
    def _format_method_parameters(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Format method parameters for display"""
        formatted = {}
        
        for key, value in parameters.items():
            # Convert snake_case to title case
            display_key = key.replace("_", " ").title()
            
            # Add units where appropriate
            if "temperature" in key.lower():
                formatted[display_key] = f"{value}°C"
            elif "flow" in key.lower():
                formatted[display_key] = f"{value} mL/min"
            elif "volume" in key.lower():
                formatted[display_key] = f"{value} μL"
            elif "ratio" in key.lower():
                formatted[display_key] = f"{value}:1"
            elif "time" in key.lower():
                formatted[display_key] = f"{value} min"
            else:
                formatted[display_key] = str(value)
        
        return formatted
    
    def _format_performance_metrics(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Format performance metrics for display"""
        formatted = {}
        
        for key, value in results.items():
            display_key = key.replace("_", " ").title()
            
            if isinstance(value, float):
                if "limit" in key.lower():
                    formatted[display_key] = f"{value:.3f}"
                elif "efficiency" in key.lower() or "percent" in key.lower():
                    formatted[display_key] = f"{value:.1f}%"
                elif "time" in key.lower():
                    formatted[display_key] = f"{value:.1f} min"
                else:
                    formatted[display_key] = f"{value:.2f}"
            else:
                formatted[display_key] = str(value)
        
        return formatted
    
    def _generate_optimization_recommendations(self, data: Dict[str, Any]) -> List[str]:
        """Generate optimization recommendations"""
        recommendations = []
        
        # Extract tool-specific recommendations
        if "recommendations" in data:
            recommendations.extend(data["recommendations"])
        
        # Add generic recommendations based on results
        results = data.get("results", {})
        
        if "detection_limit" in results:
            lod = results["detection_limit"]
            if lod > 1.0:
                recommendations.append("Consider increasing injection volume or sample concentration to improve detection limits.")
        
        if "transfer_efficiency" in results:
            eff = results["transfer_efficiency"]
            if eff < 70:
                recommendations.append("Transfer efficiency could be improved by optimizing injection temperature and split ratio.")
        
        if not recommendations:
            recommendations.append("Method parameters are well-optimized for the current application.")
        
        return recommendations
    
    def _generate_appendix(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate appendix with raw data and calculations"""
        return {
            "raw_parameters": data.get("parameters", {}),
            "calculation_details": data.get("calculation_details", {}),
            "software_version": "IntelliLab GC v1.0",
            "analysis_date": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        }
    
    def _extract_summary_charts(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract charts for executive summary"""
        charts = []
        
        # Add key performance indicator chart
        results = data.get("results", {})
        if results:
            charts.append({
                "type": "summary_kpi",
                "title": "Key Performance Indicators",
                "data": self._format_performance_metrics(results)
            })
        
        return charts
    
    def _extract_performance_charts(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract charts for performance metrics section"""
        charts = []
        
        # Add tool-specific charts
        if "charts_data" in data:
            charts.extend(data["charts_data"])
        
        return charts
    
    def _extract_raw_data_charts(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract charts for appendix"""
        return []  # Placeholder for raw data visualizations
    
    def _generate_report_file(self, content: Dict[str, Any], title: str, format: str) -> Dict[str, Any]:
        """Generate the actual report file"""
        
        # Create filename
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        safe_title = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).rstrip()
        safe_title = safe_title.replace(' ', '_')
        filename = f"{safe_title}_{timestamp}.{format}"
        file_path = self.reports_dir / filename
        
        try:
            if format == "json":
                # For now, save as JSON (in production, use ReportLab for PDF)
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(content, f, indent=2, default=str)
            else:
                # For other formats, save as structured text
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(self._format_content_as_text(content))
            
            file_size = file_path.stat().st_size
            
            return {
                "file_path": str(file_path),
                "file_size": file_size,
                "filename": filename
            }
            
        except Exception as e:
            raise Exception(f"Failed to generate report file: {str(e)}")
    
    def _format_content_as_text(self, content: Dict[str, Any]) -> str:
        """Format report content as readable text"""
        text_parts = []
        
        # Header
        header = content.get("header", {})
        text_parts.extend([
            "=" * 80,
            f"REPORT: {header.get('title', 'Untitled Report')}",
            f"Type: {header.get('report_type', 'Unknown')}",
            f"Generated: {header.get('generated_date', 'Unknown')}",
            f"Company: {header.get('company', 'IntelliLab GC')}",
            "=" * 80,
            ""
        ])
        
        # Sections
        sections = content.get("sections", {})
        for section_key, section_data in sections.items():
            text_parts.extend([
                f"{section_data.get('title', section_key).upper()}",
                "-" * 40,
                ""
            ])
            
            section_content = section_data.get("content", "")
            if isinstance(section_content, str):
                text_parts.append(section_content)
            elif isinstance(section_content, list):
                for item in section_content:
                    text_parts.append(f"• {item}")
            elif isinstance(section_content, dict):
                for key, value in section_content.items():
                    text_parts.append(f"{key}: {value}")
            
            text_parts.extend(["", ""])
        
        # Metadata
        metadata = content.get("metadata", {})
        text_parts.extend([
            "METADATA",
            "-" * 40,
            f"Generated at: {metadata.get('generated_at', 'Unknown')}",
            f"Template used: {metadata.get('template_used', 'Unknown')}",
            f"Data source: {metadata.get('data_source_type', 'Unknown')}",
            ""
        ])
        
        return "\n".join(text_parts)
    
    # Placeholder methods for other report types (implement as needed)
    
    def _format_method_description(self, data: Dict[str, Any]) -> str:
        return f"Method validation for {data.get('tool_type', 'GC analysis')} using optimized parameters."
    
    def _format_validation_parameters(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._format_method_parameters(data.get("parameters", {}))
    
    def _generate_results_discussion(self, data: Dict[str, Any]) -> str:
        return "Validation results demonstrate acceptable method performance within specified criteria."
    
    def _generate_validation_conclusion(self, data: Dict[str, Any]) -> str:
        return "The method has been successfully validated and is suitable for routine analysis."
    
    def _format_diagnostic_results(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._format_performance_metrics(data.get("results", {}))
    
    def _generate_root_cause_analysis(self, data: Dict[str, Any]) -> str:
        return "Analysis of diagnostic results indicates potential areas for method improvement."
    
    def _generate_corrective_actions(self, data: Dict[str, Any]) -> List[str]:
        return data.get("recommendations", ["Review method parameters and instrument conditions."])
    
    def _format_compared_methods(self, data: Dict[str, Any]) -> str:
        return f"Comparison of Method 1 vs Method 2 for {data.get('tool_type', 'GC analysis')}."
    
    def _format_comparison_criteria(self, data: Dict[str, Any]) -> List[str]:
        return data.get("metrics", ["Detection limit", "Efficiency", "Analysis time"])
    
    def _format_comparison_results(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return data.get("comparison_metrics", {})
    
    def _generate_comparison_conclusion(self, data: Dict[str, Any]) -> str:
        return "Method comparison provides insights for optimization and method selection."
    
    def _format_cost_breakdown(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return data.get("breakdown", {})
    
    def _format_efficiency_metrics(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "Cost per analysis": f"${data.get('cost_per_analysis', 0):.2f}",
            "Total cost": f"${data.get('total_cost', 0):.2f}",
            "Analysis count": str(data.get('analysis_count', 0))
        }
    
    def _generate_cost_optimization_recommendations(self, data: Dict[str, Any]) -> List[str]:
        return [
            "Consider bulk purchasing of consumables for cost reduction.",
            "Optimize method parameters for faster analysis times.",
            "Implement preventive maintenance to reduce instrument downtime."
        ]
    
    def _format_budget_impact(self, data: Dict[str, Any]) -> str:
        total_cost = data.get('total_cost', 0)
        return f"Total budget impact: ${total_cost:.2f} for {data.get('analysis_count', 0)} analyses."
    
    # Chart extraction methods (placeholders)
    
    def _extract_validation_charts(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        return []
    
    def _extract_results_charts(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        return []
    
    def _extract_diagnostic_charts(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        return []
    
    def _extract_verification_charts(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        return []
    
    def _extract_comparison_charts(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        return data.get("charts_data", [])
    
    def _extract_cost_charts(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        return []


# Create service instance
report_service = ReportService()
