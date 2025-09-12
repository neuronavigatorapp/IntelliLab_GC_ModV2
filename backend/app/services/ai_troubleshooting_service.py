"""
AI Troubleshooting Assistant Service
Provides intelligent assistance for GC instrumentation problems
"""

import openai
from typing import Dict, List, Optional, Any
from datetime import datetime
import json
import re
from loguru import logger
from ..core.config import settings

class AITroubleshootingService:
    def __init__(self):
        self.client = None
        if settings.OPENAI_API_KEY:
            openai.api_key = settings.OPENAI_API_KEY
            self.client = openai.OpenAI()
        
        # Enhanced GC-specific system prompt with more detailed knowledge
        self.system_prompt = """You are an expert GC (Gas Chromatography) instrumentation specialist with 25+ years of experience in analytical chemistry and instrument troubleshooting. 

You have deep expertise in:
- **Instrument Brands**: Agilent (7890B, 8890, 8860), Shimadzu (GC-2010, GC-2030), Thermo Fisher (TRACE 1300, 1310), PerkinElmer (Clarus 680, 690), and others
- **Detectors**: FID, TCD, ECD, NPD, FPD, MS (single quad, triple quad, TOF), SCD, NCD
- **Inlet Systems**: Split/splitless, PTV, on-column, cool-on-column, programmed temperature vaporization
- **Columns**: Capillary columns (DB-5, DB-1, DB-1701, DB-WAX, etc.), packed columns, PLOT columns
- **Carrier Gases**: Helium, hydrogen, nitrogen, argon/methane
- **Applications**: Environmental analysis, pharmaceutical QC, food safety, petrochemical analysis, forensic analysis
- **Method Development**: Method optimization, validation, transfer, and troubleshooting
- **Maintenance**: Preventive maintenance, calibration, qualification, performance verification
- **Data Analysis**: Peak integration, quantification, method validation, quality control

**Response Guidelines:**
1. **Safety First**: Always mention safety considerations, especially for toxic compounds or high temperatures
2. **Step-by-Step**: Provide clear, numbered troubleshooting steps
3. **Root Cause Analysis**: Explain the underlying causes, not just symptoms
4. **Preventive Measures**: Suggest how to prevent similar issues
5. **When to Call Support**: Clearly indicate when professional help is needed
6. **Technical Details**: Include relevant specifications, temperatures, pressures, flow rates
7. **Alternative Solutions**: Provide multiple approaches when possible
8. **Confidence Level**: Indicate your confidence in the diagnosis

**Common GC Problems You Can Diagnose:**
- Peak shape issues (tailing, fronting, splitting)
- Baseline problems (noise, drift, ghost peaks)
- Retention time shifts
- Sensitivity problems
- Column bleeding
- Inlet contamination
- Detector issues
- Carrier gas problems
- Temperature control issues
- Data system problems

Always be thorough but concise. Use technical terminology appropriately and explain complex concepts clearly."""
    
    async def get_troubleshooting_advice(
        self, 
        problem_description: str,
        instrument_type: Optional[str] = None,
        detector_type: Optional[str] = None,
        symptoms: Optional[List[str]] = None,
        recent_changes: Optional[str] = None,
        method_parameters: Optional[Dict[str, Any]] = None,
        chromatogram_data: Optional[Dict[str, Any]] = None
    ) -> Dict:
        """
        Get AI-powered troubleshooting advice for GC problems with enhanced context awareness
        """
        try:
            if not self.client:
                return {
                    "error": "OpenAI API not configured",
                    "suggestion": "Please set OPENAI_API_KEY in environment variables"
                }
            
            # Build enhanced context-aware prompt
            context = self._build_enhanced_context(
                problem_description, instrument_type, detector_type, 
                symptoms, recent_changes, method_parameters, chromatogram_data
            )
            
            # Create enhanced user prompt
            user_prompt = f"""
{context}

Please provide comprehensive troubleshooting advice for this GC problem. Your response should include:

1. **Immediate Diagnostic Steps** (numbered list)
2. **Root Cause Analysis** (explain why this is happening)
3. **Step-by-Step Solutions** (specific actions to take)
4. **Safety Considerations** (if any)
5. **Preventive Measures** (how to avoid this in the future)
6. **When to Seek Professional Help** (clear criteria)
7. **Expected Outcomes** (what should happen after fixes)
8. **Alternative Approaches** (if applicable)

Format your response with clear sections and use technical terminology appropriately.
"""
            
            # Get AI response with enhanced parameters
            response = await self._get_enhanced_ai_response(user_prompt)
            
            # Extract structured information
            structured_response = self._parse_ai_response(response)
            
            return {
                "advice": response,
                "timestamp": datetime.now().isoformat(),
                "problem_context": {
                    "description": problem_description,
                    "instrument_type": instrument_type,
                    "detector_type": detector_type,
                    "symptoms": symptoms,
                    "method_parameters": method_parameters
                },
                "confidence_score": structured_response.get("confidence", 0.85),
                "suggested_actions": structured_response.get("actions", []),
                "severity_level": structured_response.get("severity", "MEDIUM"),
                "estimated_resolution_time": structured_response.get("resolution_time", "1-2 hours"),
                "required_tools": structured_response.get("tools", []),
                "safety_warnings": structured_response.get("safety", []),
                "professional_help_needed": structured_response.get("professional_help", False)
            }
            
        except Exception as e:
            logger.error(f"Error in troubleshooting service: {str(e)}")
            return {
                "error": f"Troubleshooting service error: {str(e)}",
                "advice": "Please try again or contact technical support.",
                "timestamp": datetime.now().isoformat()
            }

    def _build_enhanced_context(
        self,
        problem_description: str,
        instrument_type: Optional[str] = None,
        detector_type: Optional[str] = None,
        symptoms: Optional[List[str]] = None,
        recent_changes: Optional[str] = None,
        method_parameters: Optional[Dict[str, Any]] = None,
        chromatogram_data: Optional[Dict[str, Any]] = None
    ) -> str:
        """Build enhanced context for AI prompt"""
        context_parts = [f"**Problem Description**: {problem_description}"]
        
        if instrument_type:
            context_parts.append(f"**Instrument**: {instrument_type}")
        if detector_type:
            context_parts.append(f"**Detector**: {detector_type}")
        if symptoms:
            context_parts.append(f"**Symptoms**: {', '.join(symptoms)}")
        if recent_changes:
            context_parts.append(f"**Recent Changes**: {recent_changes}")
        
        # Add method parameters if available
        if method_parameters:
            method_info = []
            if method_parameters.get("column"):
                method_info.append(f"Column: {method_parameters['column']}")
            if method_parameters.get("carrier_gas"):
                method_info.append(f"Carrier Gas: {method_parameters['carrier_gas']}")
            if method_parameters.get("flow_rate"):
                method_info.append(f"Flow Rate: {method_parameters['flow_rate']} mL/min")
            if method_parameters.get("oven_program"):
                method_info.append(f"Oven Program: {method_parameters['oven_program']}")
            if method_info:
                context_parts.append(f"**Method Parameters**: {', '.join(method_info)}")
        
        # Add chromatogram data if available
        if chromatogram_data:
            chrom_info = []
            if chromatogram_data.get("peaks_detected"):
                chrom_info.append(f"Peaks Detected: {chromatogram_data['peaks_detected']}")
            if chromatogram_data.get("signal_to_noise"):
                chrom_info.append(f"S/N Ratio: {chromatogram_data['signal_to_noise']}")
            if chrom_info:
                context_parts.append(f"**Chromatogram Data**: {', '.join(chrom_info)}")
        
        return "\n".join(context_parts)

    async def _get_enhanced_ai_response(self, user_prompt: str) -> str:
        """Get enhanced AI response with better parameters"""
        try:
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL or "gpt-4",
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,  # Lower temperature for more consistent technical responses
                max_tokens=2500,  # Increased for more detailed responses
                top_p=0.9,
                frequency_penalty=0.1,
                presence_penalty=0.1
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"OpenAI API error: {str(e)}")
            return f"Error getting AI response: {str(e)}"

    def _parse_ai_response(self, response: str) -> Dict[str, Any]:
        """Parse AI response to extract structured information"""
        parsed = {
            "confidence": 0.85,
            "actions": [],
            "severity": "MEDIUM",
            "resolution_time": "1-2 hours",
            "tools": [],
            "safety": [],
            "professional_help": False
        }
        
        # Extract suggested actions
        action_pattern = r'(?:^|\n)(\d+\.\s*[^.\n]+)'
        actions = re.findall(action_pattern, response)
        parsed["actions"] = [action.strip() for action in actions[:5]]  # Top 5 actions
        
        # Detect severity level
        severity_indicators = {
            "CRITICAL": ["critical", "emergency", "immediate", "danger", "safety"],
            "HIGH": ["high", "urgent", "serious", "important"],
            "MEDIUM": ["medium", "moderate", "normal"],
            "LOW": ["low", "minor", "simple", "easy"]
        }
        
        response_lower = response.lower()
        for severity, indicators in severity_indicators.items():
            if any(indicator in response_lower for indicator in indicators):
                parsed["severity"] = severity
                break
        
        # Detect if professional help is needed
        professional_indicators = [
            "contact support", "call technician", "professional help", 
            "service engineer", "qualified technician", "manufacturer support"
        ]
        parsed["professional_help"] = any(
            indicator in response_lower for indicator in professional_indicators
        )
        
        # Extract safety warnings
        safety_pattern = r'(?:safety|warning|caution|danger)[^.]*\.'
        safety_warnings = re.findall(safety_pattern, response, re.IGNORECASE)
        parsed["safety"] = safety_warnings[:3]  # Top 3 safety warnings
        
        # Estimate resolution time
        time_patterns = {
            r'(\d+)\s*(?:hour|hr)': "hours",
            r'(\d+)\s*(?:day|days)': "days",
            r'(\d+)\s*(?:minute|min)': "minutes"
        }
        
        for pattern, unit in time_patterns.items():
            match = re.search(pattern, response, re.IGNORECASE)
            if match:
                time_value = int(match.group(1))
                if unit == "hours":
                    parsed["resolution_time"] = f"{time_value} hours"
                elif unit == "days":
                    parsed["resolution_time"] = f"{time_value} days"
                elif unit == "minutes":
                    parsed["resolution_time"] = f"{time_value} minutes"
                break
        
        return parsed

    def _extract_suggested_actions(self, response: str) -> List[str]:
        """Extract suggested actions from AI response"""
        # Enhanced action extraction
        action_pattern = r'(?:^|\n)(\d+\.\s*[^.\n]+)'
        actions = re.findall(action_pattern, response)
        return [action.strip() for action in actions[:5]]

    async def get_method_optimization_suggestions(
        self,
        current_method: Dict,
        target_compounds: List[str],
        performance_issues: Optional[List[str]] = None,
        chromatogram_data: Optional[Dict[str, Any]] = None
    ) -> Dict:
        """
        Get AI-powered method optimization suggestions with enhanced analysis
        """
        try:
            if not self.client:
                return {
                    "error": "OpenAI API not configured",
                    "suggestion": "Please set OPENAI_API_KEY in environment variables"
                }
            
            # Build method optimization context
            context = self._build_method_optimization_context(
                current_method, target_compounds, performance_issues, chromatogram_data
            )
            
            user_prompt = f"""
{context}

Please provide comprehensive method optimization suggestions for this GC method. Include:

1. **Parameter Optimization** (specific changes to make)
2. **Column Selection** (if applicable)
3. **Temperature Program** (optimized ramp rates)
4. **Flow Rate Adjustments** (carrier gas optimization)
5. **Detector Settings** (if applicable)
6. **Expected Improvements** (quantified benefits)
7. **Validation Steps** (how to verify improvements)
8. **Alternative Approaches** (different strategies)

Provide specific, actionable recommendations with expected outcomes.
"""
            
            response = await self._get_enhanced_ai_response(user_prompt)
            
            return {
                "suggestions": response,
                "timestamp": datetime.now().isoformat(),
                "method_context": current_method,
                "target_compounds": target_compounds,
                "performance_issues": performance_issues,
                "confidence_score": 0.90
            }
            
        except Exception as e:
            logger.error(f"Error in method optimization: {str(e)}")
            return {
                "error": f"Method optimization error: {str(e)}",
                "suggestions": "Please try again or contact technical support.",
                "timestamp": datetime.now().isoformat()
            }

    def _build_method_optimization_context(
        self,
        current_method: Dict,
        target_compounds: List[str],
        performance_issues: Optional[List[str]] = None,
        chromatogram_data: Optional[Dict[str, Any]] = None
    ) -> str:
        """Build context for method optimization"""
        context_parts = [
            f"**Target Compounds**: {', '.join(target_compounds)}",
            f"**Current Method**: {json.dumps(current_method, indent=2)}"
        ]
        
        if performance_issues:
            context_parts.append(f"**Performance Issues**: {', '.join(performance_issues)}")
        
        if chromatogram_data:
            context_parts.append(f"**Chromatogram Data**: {json.dumps(chromatogram_data, indent=2)}")
        
        return "\n".join(context_parts)

    async def get_ai_status(self) -> Dict:
        """Get AI service status and capabilities"""
        return {
            "status": "operational" if self.client else "unavailable",
            "model": settings.OPENAI_MODEL or "gpt-4",
            "capabilities": [
                "troubleshooting_assistance",
                "method_optimization",
                "context_aware_responses",
                "safety_guidance",
                "preventive_maintenance_advice"
            ],
            "enhanced_features": [
                "multi-instrument_support",
                "detector_specific_advice",
                "method_parameter_analysis",
                "chromatogram_data_integration",
                "structured_response_parsing"
            ],
            "timestamp": datetime.now().isoformat()
        }

# Global instance
ai_troubleshooting_service = AITroubleshootingService() 