#!/usr/bin/env python3
"""
Summary endpoints for IntelliLab GC API
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.schemas import KPIs, Recents, RecentRun, RecentMethod, Alert
from app.services.instrument_service import InstrumentService
from app.services.consumable_inventory_service import ConsumableInventoryService
from app.services.method_template_service import MethodTemplateService

router = APIRouter()

@router.get("/kpis", response_model=KPIs)
async def get_kpis(db: Session = Depends(get_db)):
    """
    Get system KPIs
    """
    try:
        # Get instrument count
        instrument_service = InstrumentService(db)
        instruments = instrument_service.get_all_instruments()
        instruments_count = len(instruments)
        
        # Get open alerts (maintenance alerts)
        open_alerts = 0
        for instrument in instruments:
            if instrument.maintenance_level in ['Fair', 'Neglected']:
                open_alerts += 1
        
        # Get low stock count
        inventory_service = ConsumableInventoryService(db)
        inventory_items = inventory_service.get_all_consumables()
        low_stock_count = sum(1 for item in inventory_items if item.status in ['low_stock', 'critical_stock'])
        
        # Get recent runs count (last 7 days)
        recent_runs_count = 5  # Placeholder - would come from run tracking
        
        # Get recent methods count (last 7 days)
        method_service = MethodTemplateService(db)
        recent_methods = method_service.get_recent_methods(days=7)
        recent_methods_count = len(recent_methods)
        
        return KPIs(
            instrumentsCount=instruments_count,
            openAlerts=open_alerts,
            lowStockCount=low_stock_count,
            recentRunsCount=recent_runs_count,
            recentMethodsCount=recent_methods_count
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get KPIs: {str(e)}")

@router.get("/recents", response_model=Recents)
async def get_recents(db: Session = Depends(get_db)):
    """
    Get recent activity
    """
    try:
        # Placeholder recent runs
        recent_runs = [
            RecentRun(
                id=1,
                method_name="BTEX-2024-01",
                timestamp=(datetime.now() - timedelta(hours=2)).isoformat(),
                status="completed"
            ),
            RecentRun(
                id=2,
                method_name="VOC-Analysis",
                timestamp=(datetime.now() - timedelta(hours=4)).isoformat(),
                status="running"
            ),
            RecentRun(
                id=3,
                method_name="Environmental-Screen",
                timestamp=(datetime.now() - timedelta(hours=6)).isoformat(),
                status="completed"
            )
        ]
        
        # Get recent methods
        method_service = MethodTemplateService(db)
        recent_methods = method_service.get_recent_methods(days=7)
        
        recent_methods_list = [
            RecentMethod(
                id=method.id,
                name=method.name,
                type=method.tool_type,
                created_date=method.created_date.isoformat()
            )
            for method in recent_methods[:5]  # Limit to 5 most recent
        ]
        
        # Placeholder alerts
        recent_alerts = [
            Alert(
                id=1,
                severity="warning",
                message="GC-2030 calibration due in 2 days",
                timestamp=(datetime.now() - timedelta(hours=2)).isoformat()
            ),
            Alert(
                id=2,
                severity="info",
                message="New method template available",
                timestamp=(datetime.now() - timedelta(hours=4)).isoformat()
            ),
            Alert(
                id=3,
                severity="warning",
                message="Low stock alert: GC columns",
                timestamp=(datetime.now() - timedelta(hours=6)).isoformat()
            )
        ]
        
        return Recents(
            runs=recent_runs,
            methods=recent_methods_list,
            alerts=recent_alerts
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get recents: {str(e)}")
