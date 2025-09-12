#!/usr/bin/env python3
"""
Sequence service for managing sequence templates and running sequences
"""

import uuid
import time
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

from app.models.schemas import (
    SequenceTemplate, SequenceRun, SequenceItem, RunRecord, QuantResult
)
from app.services.chromatography_service import chromatography_service
from app.services.quant_service import quant_service
from app.services.qc_service import qc_service

logger = logging.getLogger(__name__)


class SequenceService:
    """Service for sequence template management and sequence execution"""
    
    def __init__(self):
        # In-memory storage for demo purposes
        # In production, this would be a database
        self.templates = {}
        self.runs = {}
    
    def create_template(self, name: str, instrument_id: Optional[int], 
                       items: List[SequenceItem], notes: Optional[str] = None) -> SequenceTemplate:
        """Create a new sequence template"""
        try:
            # Validate items
            if not items:
                raise ValueError("Sequence must have at least one item")
            
            # Ensure items have proper order
            for i, item in enumerate(items):
                item.order = i + 1
                item.id = str(uuid.uuid4())
            
            template = SequenceTemplate(
                id=str(uuid.uuid4()),
                name=name,
                instrument_id=instrument_id,
                items=items,
                notes=notes
            )
            
            self.templates[template.id] = template
            
            logger.info(f"Created sequence template {template.id}: {name}")
            return template
            
        except Exception as e:
            logger.error(f"Failed to create sequence template: {str(e)}")
            raise
    
    def get_template(self, template_id: str) -> Optional[SequenceTemplate]:
        """Get a sequence template by ID"""
        return self.templates.get(template_id)
    
    def list_templates(self, instrument_id: Optional[int] = None) -> List[SequenceTemplate]:
        """List sequence templates with optional filtering"""
        templates = list(self.templates.values())
        
        if instrument_id is not None:
            templates = [t for t in templates if t.instrument_id == instrument_id]
        
        return templates
    
    def update_template(self, template_id: str, name: Optional[str] = None,
                       items: Optional[List[SequenceItem]] = None,
                       notes: Optional[str] = None) -> SequenceTemplate:
        """Update a sequence template"""
        if template_id not in self.templates:
            raise ValueError("Template not found")
        
        template = self.templates[template_id]
        
        if name is not None:
            template.name = name
        
        if items is not None:
            # Ensure items have proper order
            for i, item in enumerate(items):
                item.order = i + 1
                if not item.id:
                    item.id = str(uuid.uuid4())
            template.items = items
        
        if notes is not None:
            template.notes = notes
        
        logger.info(f"Updated sequence template {template_id}")
        return template
    
    def delete_template(self, template_id: str) -> bool:
        """Delete a sequence template"""
        if template_id not in self.templates:
            raise ValueError("Template not found")
        
        del self.templates[template_id]
        
        logger.info(f"Deleted sequence template {template_id}")
        return True
    
    def run_sequence(self, template: SequenceTemplate, instrument_id: int, 
                    simulate: bool = True) -> SequenceRun:
        """
        Run a sequence using a template
        
        Args:
            template: Sequence template to use
            instrument_id: Instrument ID for the run
            simulate: Whether to simulate runs or import them
            
        Returns:
            Sequence run with results
        """
        try:
            # Create sequence run
            sequence_run = SequenceRun(
                id=str(uuid.uuid4()),
                instrument_id=instrument_id,
                template_id=template.id,
                items=template.items,
                status="running"
            )
            
            self.runs[sequence_run.id] = sequence_run
            
            logger.info(f"Started sequence run {sequence_run.id}")
            
            # Process each item in the sequence
            for item in template.items:
                try:
                    logger.info(f"Processing sequence item {item.order}: {item.type} - {item.sample_name}")
                    
                    # Generate run record based on item type
                    run_record = self._process_sequence_item(item, instrument_id, simulate)
                    
                    if run_record:
                        sequence_run.runs.append(run_record)
                        
                        # Perform quantitation if this is a sample or QC
                        if item.type in ["Sample", "QC"]:
                            quant_result = self._quantitate_run(run_record, item)
                            if quant_result:
                                sequence_run.quant.append(quant_result)
                                
                                # Perform QC evaluation if this is a QC item
                                if item.type == "QC":
                                    qc_result = self._evaluate_qc(run_record, quant_result, item, instrument_id)
                                    if qc_result and qc_result.overallStatus == "FAIL":
                                        # Check QC policy
                                        policy = qc_service.get_qc_policy()
                                        if policy.stopOnFail:
                                            sequence_run.status = "error"
                                            sequence_run.notes = f"QC failure at item {item.order}: {qc_result.overallStatus}. Sequence stopped per policy."
                                            logger.warning(f"Sequence {sequence_run.id} stopped due to QC failure")
                                            return sequence_run
                    
                    # Small delay to simulate processing time
                    time.sleep(0.1)
                    
                except Exception as e:
                    logger.error(f"Failed to process sequence item {item.order}: {str(e)}")
                    sequence_run.status = "error"
                    sequence_run.notes = f"Error at item {item.order}: {str(e)}"
                    return sequence_run
            
            # Mark as completed
            sequence_run.status = "completed"
            
            logger.info(f"Completed sequence run {sequence_run.id}")
            return sequence_run
            
        except Exception as e:
            logger.error(f"Sequence run failed: {str(e)}")
            if sequence_run:
                sequence_run.status = "error"
                sequence_run.notes = str(e)
            raise
    
    def _process_sequence_item(self, item: SequenceItem, instrument_id: int, 
                              simulate: bool) -> Optional[RunRecord]:
        """Process a single sequence item"""
        try:
            if item.type == "Blank":
                # Generate blank run
                return self._generate_blank_run(item, instrument_id, simulate)
            
            elif item.type == "Std":
                # Generate standard run
                return self._generate_standard_run(item, instrument_id, simulate)
            
            elif item.type in ["Sample", "QC"]:
                # Generate sample/QC run
                return self._generate_sample_run(item, instrument_id, simulate)
            
            else:
                logger.warning(f"Unknown sequence item type: {item.type}")
                return None
                
        except Exception as e:
            logger.error(f"Failed to process sequence item: {str(e)}")
            return None
    
    def _generate_blank_run(self, item: SequenceItem, instrument_id: int, 
                           simulate: bool) -> RunRecord:
        """Generate a blank run"""
        if simulate:
            # Simulate blank chromatogram
            from app.models.schemas import ChromatogramSimulationRequest
            
            request = ChromatogramSimulationRequest(
                method_id=item.method_id,
                instrument_id=instrument_id,
                sample_name=item.sample_name,
                include_noise=True,
                include_drift=False
            )
            
            response = chromatography_service.simulate_chromatogram(request)
            return response.run_record
        else:
            # For real runs, this would import from instrument
            # For now, return a simple blank
            return RunRecord(
                id=len(self.runs) + 1,
                instrument_id=instrument_id,
                method_id=item.method_id,
                sample_name=item.sample_name,
                time=[i * 0.1 for i in range(100)],
                signal=[0.1 + 0.05 * (i % 10) for i in range(100)],  # Low noise
                peaks=[],
                baseline=[0.1] * 100
            )
    
    def _generate_standard_run(self, item: SequenceItem, instrument_id: int, 
                              simulate: bool) -> RunRecord:
        """Generate a standard run"""
        if simulate:
            # Simulate standard chromatogram with expected level
            from app.models.schemas import ChromatogramSimulationRequest
            
            # Add compound based on expected level
            compounds = []
            if item.expected_level:
                # Add a peak with intensity proportional to level
                intensity = item.expected_level * 100  # Scale factor
                compounds.append({
                    "name": "Standard_Compound",
                    "rt": 5.0,
                    "intensity": intensity,
                    "width": 0.2
                })
            
            request = ChromatogramSimulationRequest(
                method_id=item.method_id,
                instrument_id=instrument_id,
                sample_name=item.sample_name,
                compounds=compounds,
                include_noise=True,
                include_drift=False
            )
            
            response = chromatography_service.simulate_chromatogram(request)
            return response.run_record
        else:
            # For real runs, this would import from instrument
            return RunRecord(
                id=len(self.runs) + 1,
                instrument_id=instrument_id,
                method_id=item.method_id,
                sample_name=item.sample_name,
                time=[i * 0.1 for i in range(100)],
                signal=[0.1 + 0.5 * (i % 20) for i in range(100)],  # Standard signal
                peaks=[{
                    "id": str(uuid.uuid4()),
                    "rt": 5.0,
                    "area": item.expected_level * 100 if item.expected_level else 100,
                    "height": item.expected_level * 50 if item.expected_level else 50,
                    "width": 0.2,
                    "name": "Standard_Compound"
                }],
                baseline=[0.1] * 100
            )
    
    def _generate_sample_run(self, item: SequenceItem, instrument_id: int, 
                            simulate: bool) -> RunRecord:
        """Generate a sample run"""
        if simulate:
            # Simulate sample chromatogram
            from app.models.schemas import ChromatogramSimulationRequest
            
            # Add random compounds for sample
            compounds = [
                {
                    "name": "Sample_Compound_1",
                    "rt": 3.5,
                    "intensity": 150,
                    "width": 0.15
                },
                {
                    "name": "Sample_Compound_2", 
                    "rt": 7.2,
                    "intensity": 200,
                    "width": 0.18
                }
            ]
            
            request = ChromatogramSimulationRequest(
                method_id=item.method_id,
                instrument_id=instrument_id,
                sample_name=item.sample_name,
                compounds=compounds,
                include_noise=True,
                include_drift=False
            )
            
            response = chromatography_service.simulate_chromatogram(request)
            return response.run_record
        else:
            # For real runs, this would import from instrument
            return RunRecord(
                id=len(self.runs) + 1,
                instrument_id=instrument_id,
                method_id=item.method_id,
                sample_name=item.sample_name,
                time=[i * 0.1 for i in range(100)],
                signal=[0.1 + 0.8 * (i % 15) for i in range(100)],  # Sample signal
                peaks=[
                    {
                        "id": str(uuid.uuid4()),
                        "rt": 3.5,
                        "area": 150,
                        "height": 75,
                        "width": 0.15,
                        "name": "Sample_Compound_1"
                    },
                    {
                        "id": str(uuid.uuid4()),
                        "rt": 7.2,
                        "area": 200,
                        "height": 100,
                        "width": 0.18,
                        "name": "Sample_Compound_2"
                    }
                ],
                baseline=[0.1] * 100
            )
    
    def _quantitate_run(self, run_record: RunRecord, item: SequenceItem) -> Optional[QuantResult]:
        """Quantitate a run using active calibration"""
        try:
            # Get active calibration for this method
            calibration = quant_service.get_active_calibration(item.method_id)
            
            if not calibration:
                logger.warning(f"No active calibration found for method {item.method_id}")
                return None
            
            # Perform quantitation
            quant_result = quant_service.quantitate(run_record, calibration)
            
            logger.info(f"Quantitated run {run_record.id} for {item.sample_name}")
            return quant_result
            
        except Exception as e:
            logger.error(f"Quantitation failed for run {run_record.id}: {str(e)}")
            return None
    
    def _evaluate_qc(self, run_record: RunRecord, quant_result: QuantResult, 
                     item: SequenceItem, instrument_id: int):
        """Evaluate QC rules for a QC run"""
        try:
            # Get QC targets for this method
            targets = qc_service.get_qc_targets(str(item.method_id), str(instrument_id))
            
            if not targets:
                logger.warning(f"No QC targets found for method {item.method_id}")
                return None
            
            # Perform QC evaluation
            qc_record = qc_service.append_qc_result(run_record, quant_result, targets)
            
            logger.info(f"QC evaluation completed for {item.sample_name}: {qc_record.overallStatus}")
            return qc_record
            
        except Exception as e:
            logger.error(f"QC evaluation failed for run {run_record.id}: {str(e)}")
            return None
    
    def get_sequence_run(self, run_id: str) -> Optional[SequenceRun]:
        """Get a sequence run by ID"""
        return self.runs.get(run_id)
    
    def list_sequence_runs(self, limit: int = 50) -> List[SequenceRun]:
        """List sequence runs"""
        runs = list(self.runs.values())
        runs.sort(key=lambda x: x.created_at, reverse=True)
        return runs[:limit]


# Global service instance
sequence_service = SequenceService()

