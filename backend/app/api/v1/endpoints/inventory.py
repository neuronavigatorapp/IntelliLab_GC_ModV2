"""
Consumable Inventory API endpoints
Handles inventory management, reorder thresholds, predictive usage, and alerting
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Dict, List, Optional, Any
from datetime import datetime
from loguru import logger

from ....core.database import get_db
from ....services.consumable_inventory_service import ConsumableInventoryService
from ....models.schemas import (
    ConsumableInventory, 
    ConsumableUsage, 
    InventoryAlert,
    ThresholdUpdate,
    UsageRecord
)

router = APIRouter()
inventory_service = ConsumableInventoryService()


@router.get("/inventory/status", response_model=Dict[str, Any])
async def get_inventory_status(
    instrument_id: Optional[int] = Query(None, description="Filter by instrument ID"),
    db: Session = Depends(get_db)
):
    """Get comprehensive inventory status with predictions and alerts"""
    try:
        result = inventory_service.get_inventory_status(db, instrument_id)
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return result
        
    except Exception as e:
        logger.error(f"Error getting inventory status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Inventory status error: {str(e)}")


@router.post("/inventory/thresholds/{consumable_id}", response_model=Dict[str, Any])
async def set_reorder_thresholds(
    consumable_id: int,
    thresholds: ThresholdUpdate,
    db: Session = Depends(get_db)
):
    """Set reorder thresholds for a consumable item"""
    try:
        result = inventory_service.set_reorder_thresholds(db, consumable_id, thresholds.model_dump())
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return result
        
    except Exception as e:
        logger.error(f"Error setting reorder thresholds: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Threshold update error: {str(e)}")


@router.post("/inventory/usage/{consumable_id}", response_model=Dict[str, Any])
async def record_consumable_usage(
    consumable_id: int,
    usage_data: UsageRecord,
    db: Session = Depends(get_db)
):
    """Record consumable usage for predictive modeling"""
    try:
        result = inventory_service.record_usage(db, consumable_id, usage_data.model_dump())
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return result
        
    except Exception as e:
        logger.error(f"Error recording usage: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Usage recording error: {str(e)}")


@router.get("/inventory/predictions/{consumable_id}", response_model=Dict[str, Any])
async def get_usage_predictions(
    consumable_id: int,
    db: Session = Depends(get_db)
):
    """Get predictive usage analysis for a consumable"""
    try:
        result = inventory_service.get_usage_predictions(db, consumable_id)
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return result
        
    except Exception as e:
        logger.error(f"Error getting usage predictions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@router.get("/inventory/alerts", response_model=List[Dict[str, Any]])
async def get_inventory_alerts(
    severity: Optional[str] = Query(None, description="Filter by alert severity"),
    db: Session = Depends(get_db)
):
    """Get current inventory alerts"""
    try:
        # Get inventory status to extract alerts
        inventory_status = inventory_service.get_inventory_status(db)
        
        if "error" in inventory_status:
            raise HTTPException(status_code=400, detail=inventory_status["error"])
        
        alerts = inventory_status.get("alerts", [])
        
        # Filter by severity if specified
        if severity:
            alerts = [alert for alert in alerts if alert.get("severity") == severity.upper()]
        
        return alerts
        
    except Exception as e:
        logger.error(f"Error getting inventory alerts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Alert retrieval error: {str(e)}")


@router.post("/inventory/restock/{consumable_id}", response_model=Dict[str, Any])
async def restock_consumable(
    consumable_id: int,
    restock_data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Record restock of consumable inventory"""
    try:
        from ....core.database import CostItem
        
        consumable = db.query(CostItem).filter(CostItem.id == consumable_id).first()
        if not consumable:
            raise HTTPException(status_code=404, detail="Consumable not found")
        
        # Update current stock
        current_stock = consumable.parameters.get("current_stock", 0) if consumable.parameters else 0
        restock_quantity = restock_data.get("quantity", 0)
        new_stock = current_stock + restock_quantity
        
        if not consumable.parameters:
            consumable.parameters = {}
        
        consumable.parameters["current_stock"] = new_stock
        consumable.parameters["last_restock"] = datetime.now().isoformat()
        
        # Add restock record
        if "restock_history" not in consumable.parameters:
            consumable.parameters["restock_history"] = []
        
        restock_record = {
            "quantity": restock_quantity,
            "supplier": restock_data.get("supplier", ""),
            "cost": restock_data.get("cost", 0.0),
            "restock_date": datetime.now().isoformat(),
            "notes": restock_data.get("notes", "")
        }
        
        consumable.parameters["restock_history"].append(restock_record)
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Restocked {consumable.name} with {restock_quantity} units",
            "new_stock": new_stock,
            "restock_record": restock_record,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error restocking consumable: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Restock error: {str(e)}")


@router.get("/inventory/summary", response_model=Dict[str, Any])
async def get_inventory_summary(db: Session = Depends(get_db)):
    """Get inventory summary statistics"""
    try:
        from ....core.database import CostItem
        
        # Get all consumables
        consumables = db.query(CostItem).filter(CostItem.category == "consumables").all()
        
        summary = {
            "total_items": len(consumables),
            "total_value": 0.0,
            "low_stock_count": 0,
            "out_of_stock_count": 0,
            "categories": {},
            "value_by_category": {}
        }
        
        for consumable in consumables:
            current_stock = consumable.parameters.get("current_stock", 0) if consumable.parameters else 0
            item_value = current_stock * consumable.unit_cost
            summary["total_value"] += item_value
            
            # Count by category
            category = consumable.subcategory or "Other"
            if category not in summary["categories"]:
                summary["categories"][category] = 0
                summary["value_by_category"][category] = 0.0
            
            summary["categories"][category] += 1
            summary["value_by_category"][category] += item_value
            
            # Count stock levels
            reorder_threshold = consumable.parameters.get("reorder_threshold", 10) if consumable.parameters else 10
            if current_stock <= 0:
                summary["out_of_stock_count"] += 1
            elif current_stock <= reorder_threshold:
                summary["low_stock_count"] += 1
        
        return summary
        
    except Exception as e:
        logger.error(f"Error getting inventory summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Summary error: {str(e)}")


@router.get("/inventory/trends", response_model=Dict[str, Any])
async def get_inventory_trends(
    days: int = Query(30, description="Number of days to analyze"),
    db: Session = Depends(get_db)
):
    """Get inventory usage trends and patterns"""
    try:
        from ....core.database import CostItem
        
        consumables = db.query(CostItem).filter(CostItem.category == "consumables").all()
        
        trends = {
            "analysis_period_days": days,
            "total_consumables": len(consumables),
            "usage_patterns": {},
            "cost_trends": {},
            "recommendations": []
        }
        
        total_weekly_cost = 0.0
        high_usage_items = []
        
        for consumable in consumables:
            if not consumable.parameters:
                continue
            
            usage_data = consumable.parameters.get("usage_history", [])
            if len(usage_data) < 3:
                continue
            
            # Calculate usage trends
            prediction = inventory_service._calculate_usage_prediction(consumable, usage_data)
            weekly_cost = prediction.get("weekly_usage_rate", 0) * consumable.unit_cost
            total_weekly_cost += weekly_cost
            
            if weekly_cost > 50:  # High cost items
                high_usage_items.append({
                    "name": consumable.name,
                    "weekly_cost": weekly_cost,
                    "daily_usage": prediction.get("daily_usage_rate", 0)
                })
            
            trends["usage_patterns"][consumable.name] = {
                "daily_usage_rate": prediction.get("daily_usage_rate", 0),
                "weekly_usage_rate": prediction.get("weekly_usage_rate", 0),
                "days_to_empty": prediction.get("days_to_empty", float('inf')),
                "confidence_score": prediction.get("confidence_score", 0)
            }
        
        trends["total_weekly_cost"] = total_weekly_cost
        trends["high_usage_items"] = sorted(high_usage_items, key=lambda x: x["weekly_cost"], reverse=True)
        
        # Generate recommendations
        if total_weekly_cost > 1000:
            trends["recommendations"].append("💰 High weekly consumables cost - Consider bulk purchasing")
        
        if len(high_usage_items) > 5:
            trends["recommendations"].append("📊 Multiple high-usage items - Review usage patterns")
        
        return trends
        
    except Exception as e:
        logger.error(f"Error getting inventory trends: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Trends error: {str(e)}")
