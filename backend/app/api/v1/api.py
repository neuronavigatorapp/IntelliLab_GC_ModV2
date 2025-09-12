#!/usr/bin/env python3
"""
Main API router for IntelliLab GC API
"""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    instruments, calculations, files, ai_features, auth,
    templates, comparison, reports, samples, costs, inventory,
    summary, licensing, preferences, analytics, qc, audit, lims,
    sync, attachments, training, instructor, branding, backup, health,
    chromatography, runs, calibration, quant, sequences, esign, sandbox, methods, compounds, method_presets, system
)

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(instruments.router, prefix="/instruments", tags=["instruments"])
api_router.include_router(methods.router, prefix="/methods", tags=["methods"])
api_router.include_router(compounds.router, prefix="/compounds", tags=["compounds"])
api_router.include_router(method_presets.router, prefix="/method-presets", tags=["method-presets"])
api_router.include_router(calculations.router, prefix="/calculations", tags=["calculations"])
api_router.include_router(files.router, prefix="/files", tags=["files"])
api_router.include_router(ai_features.router, prefix="/ai", tags=["ai-features"])

# Phase 6 endpoints
api_router.include_router(templates.router, prefix="/templates", tags=["method-templates"])
api_router.include_router(comparison.router, prefix="/comparison", tags=["method-comparison"])
api_router.include_router(samples.router, prefix="/samples", tags=["sample-tracking"])
api_router.include_router(costs.router, prefix="/costs", tags=["cost-calculation"])

# Phase 2 - Consumable Inventory endpoints
api_router.include_router(inventory.router, prefix="/inventory", tags=["consumable-inventory"])

# Phase 3 - Summary and Reports endpoints
api_router.include_router(summary.router, prefix="/summary", tags=["summary"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(licensing.router, prefix="/license", tags=["licensing"])
api_router.include_router(preferences.router, prefix="/user", tags=["user-preferences"])

# Phase 4 - Analytics endpoints
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])

# Phase 5 - QC, Compliance & LIMS endpoints  
api_router.include_router(qc.router, prefix="/qc", tags=["qc-auto-flagging"])
api_router.include_router(audit.router, prefix="/audit", tags=["audit"])
api_router.include_router(lims.router, prefix="/lims", tags=["lims"])

# Phase 6 - Sync & Attachments endpoints
api_router.include_router(sync.router, prefix="/sync", tags=["sync"])
api_router.include_router(attachments.router, prefix="/attachments", tags=["attachments"])

# Phase 7 - Training & Education Mode endpoints
api_router.include_router(training.router, prefix="/training", tags=["training"])
api_router.include_router(instructor.router, prefix="/instructor", tags=["instructor"])
api_router.include_router(branding.router, prefix="/branding", tags=["branding"])
api_router.include_router(backup.router, prefix="/backup", tags=["backup"])
api_router.include_router(health.router, prefix="/health", tags=["health"])

# System endpoints for database management
api_router.include_router(system.router, prefix="/system", tags=["system"])

# Chromatography & Run Records endpoints
api_router.include_router(chromatography.router, prefix="/chromatography", tags=["chromatography"])
api_router.include_router(runs.router, prefix="/runs", tags=["runs"])

# Calibration, Quantitation & Sequence endpoints
api_router.include_router(calibration.router, prefix="/calibration", tags=["calibration"])
api_router.include_router(quant.router, prefix="/quant", tags=["quantitation"])
api_router.include_router(sequences.router, prefix="/sequences", tags=["sequences"]) 
api_router.include_router(esign.router, prefix="/esign", tags=["esign"])

# Sandbox endpoints
api_router.include_router(sandbox.router, prefix="/sandbox", tags=["sandbox"])

# Pass 2 - AI Diagnostics
try:
    from app.api.v1.endpoints import ai_diagnostics
    api_router.include_router(ai_diagnostics.router, prefix="/ai-diagnostics", tags=["ai-diagnostics"])
except ImportError:
    pass  # AI diagnostics not available

# Pass 2 - Run History & Reporting
try:
    from app.api.v1.endpoints import run_history
    api_router.include_router(run_history.router, prefix="/run-history", tags=["run-history"])
except ImportError:
    pass  # Run history not available

# Pass 2 - Work Mode
try:
    from app.api.v1.endpoints import work_mode
    api_router.include_router(work_mode.router, prefix="/work-mode", tags=["work-mode"])
except ImportError:
    pass  # Work mode not available