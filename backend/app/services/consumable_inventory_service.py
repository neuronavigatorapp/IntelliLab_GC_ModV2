"""
Consumable Inventory Service
Manages consumable inventory with reorder thresholds, predictive usage modeling, and alerting
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
import json
from loguru import logger
from ..core.config import settings
from ..core.database import CostItem, Instrument
from ..models.schemas import ConsumableInventory, ConsumableUsage, InventoryAlert

class ConsumableInventoryService:
    def __init__(self):
        self.alert_history = []
        self.usage_predictions = {}
        self.reorder_thresholds = {}
        
    def get_inventory_status(self, db: Session, instrument_id: Optional[int] = None) -> Dict[str, Any]:
        """Get comprehensive inventory status with predictions and alerts"""
        try:
            # Get all consumables
            query = db.query(CostItem).filter(CostItem.category == "consumables")
            if instrument_id:
                # Filter by instrument-specific consumables
                instrument = db.query(Instrument).filter(Instrument.id == instrument_id).first()
                if instrument:
                    # Add instrument-specific filtering logic here
                    pass
            
            consumables = query.all()
            
            inventory_status = {
                "total_items": len(consumables),
                "low_stock_items": 0,
                "out_of_stock_items": 0,
                "items_needing_reorder": 0,
                "total_inventory_value": 0.0,
                "alerts": [],
                "predictions": {},
                "inventory_items": []
            }
            
            for consumable in consumables:
                # Get usage history and calculate predictions
                usage_data = self._get_usage_history(db, consumable.id)
                prediction = self._calculate_usage_prediction(consumable, usage_data)
                
                # Check reorder thresholds
                threshold_status = self._check_reorder_thresholds(consumable, prediction)
                
                # Calculate inventory value
                current_stock = consumable.parameters.get("current_stock", 0) if consumable.parameters else 0
                inventory_value = current_stock * consumable.unit_cost
                inventory_status["total_inventory_value"] += inventory_value
                
                # Count status categories
                if threshold_status["status"] == "low_stock":
                    inventory_status["low_stock_items"] += 1
                elif threshold_status["status"] == "out_of_stock":
                    inventory_status["out_of_stock_items"] += 1
                
                if threshold_status["needs_reorder"]:
                    inventory_status["items_needing_reorder"] += 1
                    inventory_status["alerts"].append(threshold_status["alert"])
                
                # Add item details
                item_status = {
                    "id": consumable.id,
                    "name": consumable.name,
                    "category": consumable.category,
                    "subcategory": consumable.subcategory,
                    "current_stock": current_stock,
                    "unit_cost": consumable.unit_cost,
                    "unit": consumable.unit,
                    "supplier": consumable.supplier,
                    "part_number": consumable.part_number,
                    "threshold_status": threshold_status,
                    "usage_prediction": prediction,
                    "inventory_value": inventory_value
                }
                
                inventory_status["inventory_items"].append(item_status)
                inventory_status["predictions"][consumable.name] = prediction
            
            return inventory_status
            
        except Exception as e:
            logger.error(f"Error getting inventory status: {str(e)}")
            return {
                "error": f"Inventory status error: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
    
    def set_reorder_thresholds(
        self, 
        db: Session, 
        consumable_id: int, 
        thresholds: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Set reorder thresholds for a consumable item"""
        try:
            consumable = db.query(CostItem).filter(CostItem.id == consumable_id).first()
            if not consumable:
                return {"error": "Consumable not found"}
            
            # Update consumable parameters with thresholds
            if not consumable.parameters:
                consumable.parameters = {}
            
            consumable.parameters.update({
                "reorder_threshold": thresholds.get("reorder_threshold", 10),
                "critical_threshold": thresholds.get("critical_threshold", 5),
                "reorder_quantity": thresholds.get("reorder_quantity", 50),
                "supplier_lead_time_days": thresholds.get("supplier_lead_time_days", 7),
                "auto_reorder_enabled": thresholds.get("auto_reorder_enabled", False),
                "alert_email": thresholds.get("alert_email", ""),
                "last_threshold_update": datetime.now().isoformat()
            })
            
            db.commit()
            
            # Store in memory for quick access
            self.reorder_thresholds[consumable_id] = consumable.parameters
            
            return {
                "success": True,
                "message": f"Reorder thresholds updated for {consumable.name}",
                "thresholds": consumable.parameters,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error setting reorder thresholds: {str(e)}")
            return {
                "error": f"Threshold update error: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
    
    def record_usage(
        self, 
        db: Session, 
        consumable_id: int, 
        usage_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Record consumable usage for predictive modeling"""
        try:
            consumable = db.query(CostItem).filter(CostItem.id == consumable_id).first()
            if not consumable:
                return {"error": "Consumable not found"}
            
            # Create usage record
            usage_record = {
                "consumable_id": consumable_id,
                "quantity_used": usage_data.get("quantity_used", 0),
                "analysis_count": usage_data.get("analysis_count", 1),
                "instrument_id": usage_data.get("instrument_id"),
                "method_type": usage_data.get("method_type", ""),
                "usage_date": datetime.now().isoformat(),
                "notes": usage_data.get("notes", "")
            }
            
            # Update current stock
            current_stock = consumable.parameters.get("current_stock", 0) if consumable.parameters else 0
            new_stock = max(0, current_stock - usage_record["quantity_used"])
            
            if not consumable.parameters:
                consumable.parameters = {}
            
            consumable.parameters["current_stock"] = new_stock
            consumable.parameters["last_usage"] = usage_record["usage_date"]
            
            # Store usage history
            if "usage_history" not in consumable.parameters:
                consumable.parameters["usage_history"] = []
            
            consumable.parameters["usage_history"].append(usage_record)
            
            # Keep only last 100 usage records
            if len(consumable.parameters["usage_history"]) > 100:
                consumable.parameters["usage_history"] = consumable.parameters["usage_history"][-100:]
            
            db.commit()
            
            # Check for alerts after usage
            alerts = self._check_usage_alerts(consumable, usage_record)
            
            return {
                "success": True,
                "message": f"Usage recorded for {consumable.name}",
                "new_stock": new_stock,
                "alerts": alerts,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error recording usage: {str(e)}")
            return {
                "error": f"Usage recording error: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
    
    def get_usage_predictions(self, db: Session, consumable_id: int) -> Dict[str, Any]:
        """Get predictive usage analysis for a consumable"""
        try:
            consumable = db.query(CostItem).filter(CostItem.id == consumable_id).first()
            if not consumable:
                return {"error": "Consumable not found"}
            
            usage_data = self._get_usage_history(db, consumable_id)
            prediction = self._calculate_usage_prediction(consumable, usage_data)
            
            return {
                "consumable_name": consumable.name,
                "current_stock": consumable.parameters.get("current_stock", 0) if consumable.parameters else 0,
                "prediction": prediction,
                "usage_trend": self._calculate_usage_trend(usage_data),
                "recommendations": self._generate_usage_recommendations(consumable, prediction),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting usage predictions: {str(e)}")
            return {
                "error": f"Prediction error: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
    
    def _get_usage_history(self, db: Session, consumable_id: int) -> List[Dict]:
        """Get usage history for predictive modeling"""
        consumable = db.query(CostItem).filter(CostItem.id == consumable_id).first()
        if not consumable or not consumable.parameters:
            return []
        
        return consumable.parameters.get("usage_history", [])
    
    def _calculate_usage_prediction(self, consumable: CostItem, usage_data: List[Dict]) -> Dict[str, Any]:
        """Calculate predictive usage using EWMA and rolling averages"""
        if not usage_data or len(usage_data) < 3:
            return {
                "daily_usage_rate": 0.0,
                "weekly_usage_rate": 0.0,
                "days_to_empty": float('inf'),
                "confidence_score": 0.0,
                "prediction_method": "insufficient_data"
            }
        
        # Convert usage data to time series
        df = pd.DataFrame(usage_data)
        df['usage_date'] = pd.to_datetime(df['usage_date'])
        df = df.sort_values('usage_date')
        
        # Calculate daily usage rates
        daily_usage = df.groupby(df['usage_date'].dt.date)['quantity_used'].sum()
        
        if len(daily_usage) < 3:
            return {
                "daily_usage_rate": daily_usage.mean() if len(daily_usage) > 0 else 0.0,
                "weekly_usage_rate": daily_usage.mean() * 7 if len(daily_usage) > 0 else 0.0,
                "days_to_empty": float('inf'),
                "confidence_score": 0.0,
                "prediction_method": "insufficient_data"
            }
        
        # Calculate EWMA (Exponentially Weighted Moving Average)
        alpha = 0.3  # Smoothing factor
        ewma_usage = daily_usage.ewm(alpha=alpha).mean()
        current_ewma = ewma_usage.iloc[-1]
        
        # Calculate rolling average (last 7 days)
        rolling_avg = daily_usage.tail(7).mean() if len(daily_usage) >= 7 else daily_usage.mean()
        
        # Use weighted average of EWMA and rolling average
        daily_usage_rate = (current_ewma * 0.7) + (rolling_avg * 0.3)
        weekly_usage_rate = daily_usage_rate * 7
        
        # Calculate days to empty
        current_stock = consumable.parameters.get("current_stock", 0) if consumable.parameters else 0
        days_to_empty = current_stock / daily_usage_rate if daily_usage_rate > 0 else float('inf')
        
        # Calculate confidence score based on data consistency
        usage_std = daily_usage.std()
        usage_mean = daily_usage.mean()
        cv = usage_std / usage_mean if usage_mean > 0 else 1.0  # Coefficient of variation
        confidence_score = max(0.1, min(0.95, 1.0 - cv))  # Higher consistency = higher confidence
        
        return {
            "daily_usage_rate": round(daily_usage_rate, 3),
            "weekly_usage_rate": round(weekly_usage_rate, 3),
            "days_to_empty": round(days_to_empty, 1),
            "confidence_score": round(confidence_score, 3),
            "prediction_method": "ewma_rolling_avg",
            "data_points": len(daily_usage),
            "last_usage_date": daily_usage.index[-1].isoformat() if len(daily_usage) > 0 else None
        }
    
    def _check_reorder_thresholds(self, consumable: CostItem, prediction: Dict[str, Any]) -> Dict[str, Any]:
        """Check if consumable needs reordering based on thresholds and predictions"""
        if not consumable.parameters:
            return {
                "status": "unknown",
                "needs_reorder": False,
                "alert": None
            }
        
        current_stock = consumable.parameters.get("current_stock", 0)
        reorder_threshold = consumable.parameters.get("reorder_threshold", 10)
        critical_threshold = consumable.parameters.get("critical_threshold", 5)
        days_to_empty = prediction.get("days_to_empty", float('inf'))
        
        # Determine status
        if current_stock <= 0:
            status = "out_of_stock"
            needs_reorder = True
            alert_severity = "CRITICAL"
        elif current_stock <= critical_threshold:
            status = "critical_stock"
            needs_reorder = True
            alert_severity = "HIGH"
        elif current_stock <= reorder_threshold:
            status = "low_stock"
            needs_reorder = True
            alert_severity = "MEDIUM"
        elif days_to_empty <= 7:  # Will run out within a week
            status = "approaching_empty"
            needs_reorder = True
            alert_severity = "MEDIUM"
        else:
            status = "adequate_stock"
            needs_reorder = False
            alert_severity = None
        
        # Generate alert if needed
        alert = None
        if needs_reorder:
            alert = {
                "severity": alert_severity,
                "message": f"{consumable.name} needs reordering - Current stock: {current_stock}",
                "current_stock": current_stock,
                "days_to_empty": days_to_empty,
                "recommended_order_quantity": consumable.parameters.get("reorder_quantity", 50),
                "timestamp": datetime.now().isoformat()
            }
        
        return {
            "status": status,
            "needs_reorder": needs_reorder,
            "alert": alert,
            "current_stock": current_stock,
            "reorder_threshold": reorder_threshold,
            "critical_threshold": critical_threshold,
            "days_to_empty": days_to_empty
        }
    
    def _check_usage_alerts(self, consumable: CostItem, usage_record: Dict[str, Any]) -> List[Dict]:
        """Check for alerts after usage recording"""
        alerts = []
        
        # Get updated prediction
        usage_data = self._get_usage_history(None, consumable.id)  # We'll get from consumable.parameters
        prediction = self._calculate_usage_prediction(consumable, usage_data)
        threshold_status = self._check_reorder_thresholds(consumable, prediction)
        
        if threshold_status["needs_reorder"]:
            alerts.append(threshold_status["alert"])
        
        # Check for unusual usage patterns
        if len(usage_data) >= 5:
            recent_usage = usage_data[-5:]
            avg_usage = sum(r["quantity_used"] for r in recent_usage) / len(recent_usage)
            current_usage = usage_record["quantity_used"]
            
            if current_usage > avg_usage * 2:  # Usage spike
                alerts.append({
                    "severity": "MEDIUM",
                    "message": f"Unusual high usage detected for {consumable.name}",
                    "current_usage": current_usage,
                    "average_usage": round(avg_usage, 2),
                    "timestamp": datetime.now().isoformat()
                })
        
        return alerts
    
    def _calculate_usage_trend(self, usage_data: List[Dict]) -> Dict[str, Any]:
        """Calculate usage trend analysis"""
        if len(usage_data) < 7:
            return {
                "trend": "insufficient_data",
                "trend_direction": "unknown",
                "trend_strength": 0.0
            }
        
        # Group by week and calculate weekly totals
        df = pd.DataFrame(usage_data)
        df['usage_date'] = pd.to_datetime(df['usage_date'])
        df['week'] = df['usage_date'].dt.isocalendar().week
        df['year'] = df['usage_date'].dt.year
        
        weekly_usage = df.groupby(['year', 'week'])['quantity_used'].sum()
        
        if len(weekly_usage) < 2:
            return {
                "trend": "insufficient_data",
                "trend_direction": "unknown",
                "trend_strength": 0.0
            }
        
        # Calculate trend
        x = np.arange(len(weekly_usage))
        y = weekly_usage.values
        
        if len(x) > 1:
            slope, intercept = np.polyfit(x, y, 1)
            trend_strength = abs(slope) / np.mean(y) if np.mean(y) > 0 else 0
            
            if slope > 0.1:
                trend_direction = "increasing"
            elif slope < -0.1:
                trend_direction = "decreasing"
            else:
                trend_direction = "stable"
        else:
            trend_direction = "stable"
            trend_strength = 0.0
        
        return {
            "trend": "calculated",
            "trend_direction": trend_direction,
            "trend_strength": round(trend_strength, 3),
            "weeks_of_data": len(weekly_usage)
        }
    
    def _generate_usage_recommendations(self, consumable: CostItem, prediction: Dict[str, Any]) -> List[str]:
        """Generate usage recommendations based on predictions"""
        recommendations = []
        
        days_to_empty = prediction.get("days_to_empty", float('inf'))
        confidence_score = prediction.get("confidence_score", 0.0)
        
        if days_to_empty <= 7:
            recommendations.append("⚠️ Critical: Stock will run out within a week - Order immediately")
        elif days_to_empty <= 14:
            recommendations.append("⚠️ Low stock: Consider reordering soon")
        
        if confidence_score < 0.5:
            recommendations.append("📊 Low prediction confidence - More usage data needed")
        
        if prediction.get("daily_usage_rate", 0) > 0:
            weekly_cost = prediction["weekly_usage_rate"] * consumable.unit_cost
            if weekly_cost > 100:
                recommendations.append(f"💰 High weekly cost: ${weekly_cost:.2f} - Consider bulk purchasing")
        
        return recommendations
