#!/usr/bin/env python3
"""
Sequences endpoints for managing sequence templates and running sequences
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
import logging

from app.models.schemas import (
    SequenceTemplate, SequenceRun, SequenceItem, SequenceRunRequest,
    SequenceTemplateListResponse, SequenceRunListResponse
)
from app.services.sequence_service import sequence_service
from app.services.audit_service import audit_service
from app.services.esign_service import esign_service
from app.services.auth_service import get_current_user
from app.models.schemas import User

logger = logging.getLogger(__name__)

router = APIRouter()


# Template endpoints
@router.post("/templates", response_model=SequenceTemplate)
async def create_template(template: SequenceTemplate, current_user: User = Depends(get_current_user)):
    """Create a new sequence template"""
    try:
        logger.info(f"Creating sequence template: {template.name}")
        
        esign_service.assert_not_signed("sequence", template.id or "")
        new_template = sequence_service.create_template(
            name=template.name,
            instrument_id=template.instrument_id,
            items=template.items,
            notes=template.notes
        )
        try:
            audit_service.log_action(
                user=current_user.email,
                action="sequence_template_created",
                entity_type="sequence",
                entity_id=new_template.id,
                details={"template": new_template.dict()}
            )
        except Exception:
            pass
        
        logger.info(f"Created sequence template: {new_template.id}")
        return new_template
        
    except Exception as e:
        logger.error(f"Failed to create sequence template: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/templates/{template_id}", response_model=SequenceTemplate)
async def get_template(template_id: str):
    """Get a sequence template by ID"""
    try:
        template = sequence_service.get_template(template_id)
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        return template
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get sequence template: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/templates", response_model=SequenceTemplateListResponse)
async def list_templates(
    instrument_id: Optional[int] = Query(None, description="Filter by instrument ID")
):
    """List sequence templates with optional filtering"""
    try:
        templates = sequence_service.list_templates(instrument_id)
        
        return SequenceTemplateListResponse(
            templates=templates,
            total=len(templates)
        )
        
    except Exception as e:
        logger.error(f"Failed to list sequence templates: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/templates/{template_id}", response_model=SequenceTemplate)
async def update_template(template_id: str, template: SequenceTemplate, current_user: User = Depends(get_current_user)):
    """Update a sequence template"""
    try:
        esign_service.assert_not_signed("sequence", template_id)
        updated_template = sequence_service.update_template(
            template_id=template_id,
            name=template.name,
            items=template.items,
            notes=template.notes
        )
        try:
            audit_service.log_action(
                user=current_user.email,
                action="sequence_template_updated",
                entity_type="sequence",
                entity_id=template_id,
                details={"template": updated_template.dict()}
            )
        except Exception:
            pass
        
        logger.info(f"Updated sequence template: {template_id}")
        return updated_template
        
    except Exception as e:
        logger.error(f"Failed to update sequence template: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/templates/{template_id}")
async def delete_template(template_id: str, current_user: User = Depends(get_current_user)):
    """Delete a sequence template"""
    try:
        esign_service.assert_not_signed("sequence", template_id)
        success = sequence_service.delete_template(template_id)
        try:
            audit_service.log_action(
                user=current_user.email,
                action="sequence_template_deleted",
                entity_type="sequence",
                entity_id=template_id,
                details={"ok": success}
            )
        except Exception:
            pass
        return {"ok": success}
        
    except Exception as e:
        logger.error(f"Failed to delete sequence template: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


# Sequence run endpoints
@router.post("/run", response_model=SequenceRun)
async def run_sequence(request: SequenceRunRequest, current_user: User = Depends(get_current_user)):
    """Run a sequence using a template"""
    try:
        logger.info(f"Starting sequence run with instrument {request.instrument_id}")
        
        # Get template
        template = None
        if request.template_id:
            template = sequence_service.get_template(request.template_id)
            if not template:
                raise HTTPException(status_code=404, detail="Template not found")
        elif request.template:
            template = request.template
        else:
            raise HTTPException(status_code=400, detail="Must provide template_id or template")
        
        # Run the sequence
        sequence_run = sequence_service.run_sequence(
            template=template,
            instrument_id=request.instrument_id,
            simulate=request.simulate
        )
        try:
            audit_service.log_action(
                user=current_user.email,
                action="sequence_run_completed",
                entity_type="sequence",
                entity_id=sequence_run.id,
                details={"instrument_id": request.instrument_id, "simulate": request.simulate}
            )
        except Exception:
            pass
        
        logger.info(f"Sequence run completed: {sequence_run.id}")
        return sequence_run
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Sequence run failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/run/{run_id}", response_model=SequenceRun)
async def get_sequence_run(run_id: str):
    """Get a sequence run by ID"""
    try:
        sequence_run = sequence_service.get_sequence_run(run_id)
        if not sequence_run:
            raise HTTPException(status_code=404, detail="Sequence run not found")
        
        return sequence_run
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get sequence run: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/runs", response_model=SequenceRunListResponse)
async def list_sequence_runs(
    limit: int = Query(50, ge=1, le=100, description="Maximum number of runs to return")
):
    """List sequence runs"""
    try:
        runs = sequence_service.list_sequence_runs(limit)
        
        return SequenceRunListResponse(
            runs=runs,
            total=len(runs)
        )
        
    except Exception as e:
        logger.error(f"Failed to list sequence runs: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

