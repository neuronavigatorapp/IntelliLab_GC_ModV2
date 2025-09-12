"""
Predictive Maintenance Service
Uses ML to predict instrument failures and maintenance needs with enhanced fleet monitoring
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import joblib
import os
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
import json
from loguru import logger
from ..core.config import settings

class PredictiveMaintenanceService:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.model_path = settings.MAINTENANCE_MODEL_PATH
        self.threshold = settings.MAINTENANCE_THRESHOLD
        self.fleet_data = {}  # Store fleet-wide instrument data
        self.alert_history = []  # Track maintenance alerts
        self.maintenance_schedule = {}  # Track scheduled maintenance
        self.load_or_create_model()
    
    def load_or_create_model(self):
        """Load existing model or create new one"""
        try:
            if os.path.exists(self.model_path):
                self.model = joblib.load(self.model_path)
                logger.info("Loaded existing maintenance prediction model")
            else:
                self._create_initial_model()
                logger.info("Created new maintenance prediction model")
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            self._create_initial_model()
    
    def _create_initial_model(self):
        """Create initial model with synthetic data"""
        # Generate synthetic training data based on GC instrument characteristics
        n_samples = 1000
        np.random.seed(42)
        
        # Feature engineering for GC instruments
        data = {
            'instrument_age_years': np.random.uniform(0, 15, n_samples),
            'total_runtime_hours': np.random.uniform(100, 10000, n_samples),
            'maintenance_frequency_days': np.random.uniform(30, 365, n_samples),
            'last_calibration_days': np.random.uniform(1, 180, n_samples),
            'detector_sensitivity_change': np.random.uniform(-0.3, 0.1, n_samples),
            'baseline_noise_level': np.random.uniform(0.01, 0.5, n_samples),
            'peak_resolution_degradation': np.random.uniform(0, 0.4, n_samples),
            'carrier_gas_pressure_variance': np.random.uniform(0.01, 0.2, n_samples),
            'inlet_temperature_stability': np.random.uniform(0.5, 1.0, n_samples),
            'column_bleed_level': np.random.uniform(0, 0.3, n_samples),
            'detector_response_time': np.random.uniform(0.5, 2.0, n_samples),
            'vacuum_integrity_percent': np.random.uniform(70, 100, n_samples),
            'septum_lifetime_remaining': np.random.uniform(0, 100, n_samples),
            'liner_contamination_level': np.random.uniform(0, 0.8, n_samples),
            'oven_temperature_accuracy': np.random.uniform(0.8, 1.0, n_samples)
        }
        
        df = pd.DataFrame(data)
        
        # Create target variable (maintenance needed)
        # Higher probability of maintenance needed for older, heavily used instruments
        maintenance_prob = (
            df['instrument_age_years'] * 0.1 +
            df['total_runtime_hours'] * 0.00001 +
            (1 - df['maintenance_frequency_days'] / 365) * 0.3 +
            df['last_calibration_days'] * 0.002 +
            (1 - df['detector_sensitivity_change']) * 0.2 +
            df['baseline_noise_level'] * 0.4 +
            df['peak_resolution_degradation'] * 0.3 +
            (1 - df['vacuum_integrity_percent'] / 100) * 0.3 +
            (1 - df['septum_lifetime_remaining'] / 100) * 0.2 +
            df['liner_contamination_level'] * 0.3 +
            (1 - df['oven_temperature_accuracy']) * 0.2
        )
        
        # Add some randomness
        maintenance_prob += np.random.normal(0, 0.1, n_samples)
        
        # Create binary target
        df['maintenance_needed'] = (maintenance_prob > 0.5).astype(int)
        
        # Train model
        X = df.drop('maintenance_needed', axis=1)
        y = df['maintenance_needed']
        
        self.scaler.fit(X)
        X_scaled = self.scaler.transform(X)
        
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        self.model.fit(X_scaled, y)
        
        # Save model
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        joblib.dump(self.model, self.model_path)
        logger.info("Trained and saved maintenance prediction model")

    def predict_maintenance(
        self,
        instrument_data: Dict,
        instrument_id: Optional[str] = None
    ) -> Dict:
        """
        Predict maintenance needs for a single instrument with enhanced analysis
        """
        try:
            # Extract features
            features = self._extract_features(instrument_data)
            
            if len(features) != 15:  # Expected number of features
                return {
                    "error": f"Invalid number of features: {len(features)}. Expected 15.",
                    "timestamp": datetime.now().isoformat()
                }
            
            # Scale features
            features_scaled = self.scaler.transform([features])
            
            # Get prediction probability
            maintenance_probability = self.model.predict_proba(features_scaled)[0][1]
            
            # Determine maintenance status
            if maintenance_probability >= self.threshold:
                status = 'CRITICAL' if maintenance_probability >= 0.9 else 'HIGH'
            elif maintenance_probability >= 0.6:
                status = 'MEDIUM'
            else:
                status = 'LOW'
            
            # Generate recommendations
            recommendations = self._generate_maintenance_recommendations(
                instrument_data, maintenance_probability
            )
            
            # Predict failure date
            failure_date = self._predict_failure_date(instrument_data, maintenance_probability)
            
            # Store in fleet data
            if instrument_id:
                self.fleet_data[instrument_id] = {
                    "data": instrument_data,
                    "prediction": {
                        "probability": maintenance_probability,
                        "status": status,
                        "timestamp": datetime.now().isoformat()
                    }
                }
                
                # Check for alerts
                alerts = self._check_for_alerts(instrument_id, maintenance_probability, status)
                if alerts:
                    self.alert_history.extend(alerts)
            
            return {
                "maintenance_probability": round(maintenance_probability, 4),
                "maintenance_status": status,
                "confidence_score": self._calculate_confidence_score(instrument_data),
                "recommendations": recommendations,
                "predicted_failure_date": failure_date,
                "features_used": list(instrument_data.keys()),
                "timestamp": datetime.now().isoformat(),
                "instrument_id": instrument_id,
                "alerts": alerts if instrument_id else []
            }
            
        except Exception as e:
            logger.error(f"Error in maintenance prediction: {str(e)}")
            return {
                "error": f"Maintenance prediction error: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }

    def predict_fleet_maintenance(self, fleet_data: List[Dict]) -> Dict:
        """
        Predict maintenance for entire fleet with fleet-wide analysis
        """
        try:
            fleet_predictions = {}
            fleet_summary = {
                "total_instruments": len(fleet_data),
                "critical_instruments": 0,
                "high_priority_instruments": 0,
                "medium_priority_instruments": 0,
                "low_priority_instruments": 0,
                "average_maintenance_probability": 0.0,
                "total_estimated_cost": 0.0,
                "recommended_schedule": []
            }
            
            total_probability = 0.0
            total_cost = 0.0
            
            for instrument in fleet_data:
                instrument_id = instrument.get("instrument_id", f"instrument_{len(fleet_predictions)}")
                prediction = self.predict_maintenance(instrument["data"], instrument_id)
                
                if "error" not in prediction:
                    fleet_predictions[instrument_id] = prediction
                    total_probability += prediction["maintenance_probability"]
                    
                    # Count by status
                    status = prediction["maintenance_status"]
                    if status == "CRITICAL":
                        fleet_summary["critical_instruments"] += 1
                    elif status == "HIGH":
                        fleet_summary["high_priority_instruments"] += 1
                    elif status == "MEDIUM":
                        fleet_summary["medium_priority_instruments"] += 1
                    else:
                        fleet_summary["low_priority_instruments"] += 1
                    
                    # Calculate estimated cost
                    cost_estimate = self._estimate_maintenance_cost(prediction)
                    total_cost += cost_estimate
            
            if fleet_predictions:
                fleet_summary["average_maintenance_probability"] = total_probability / len(fleet_predictions)
                fleet_summary["total_estimated_cost"] = total_cost
                fleet_summary["recommended_schedule"] = self._generate_fleet_schedule(fleet_predictions)
            
            return {
                "fleet_predictions": fleet_predictions,
                "fleet_summary": fleet_summary,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in fleet maintenance prediction: {str(e)}")
            return {
                "error": f"Fleet maintenance prediction error: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }

    def get_maintenance_alerts(self, days_back: int = 30) -> Dict:
        """
        Get recent maintenance alerts with filtering options
        """
        try:
            cutoff_date = datetime.now() - timedelta(days=days_back)
            recent_alerts = [
                alert for alert in self.alert_history
                if datetime.fromisoformat(alert["timestamp"]) >= cutoff_date
            ]
            
            # Group alerts by severity
            alert_summary = {
                "critical_alerts": len([a for a in recent_alerts if a["severity"] == "CRITICAL"]),
                "high_alerts": len([a for a in recent_alerts if a["severity"] == "HIGH"]),
                "medium_alerts": len([a for a in recent_alerts if a["severity"] == "MEDIUM"]),
                "total_alerts": len(recent_alerts)
            }
            
            return {
                "alerts": recent_alerts,
                "alert_summary": alert_summary,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting maintenance alerts: {str(e)}")
            return {
                "error": f"Error getting alerts: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }

    def schedule_maintenance(
        self,
        instrument_id: str,
        maintenance_type: str,
        scheduled_date: str,
        estimated_duration: str,
        technician_notes: Optional[str] = None
    ) -> Dict:
        """
        Schedule maintenance for an instrument
        """
        try:
            maintenance_entry = {
                "instrument_id": instrument_id,
                "maintenance_type": maintenance_type,
                "scheduled_date": scheduled_date,
                "estimated_duration": estimated_duration,
                "technician_notes": technician_notes,
                "status": "SCHEDULED",
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            
            if instrument_id not in self.maintenance_schedule:
                self.maintenance_schedule[instrument_id] = []
            
            self.maintenance_schedule[instrument_id].append(maintenance_entry)
            
            return {
                "success": True,
                "maintenance_entry": maintenance_entry,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error scheduling maintenance: {str(e)}")
            return {
                "error": f"Error scheduling maintenance: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }

    def get_maintenance_schedule(self, instrument_id: Optional[str] = None) -> Dict:
        """
        Get maintenance schedule for specific instrument or all instruments
        """
        try:
            if instrument_id:
                schedule = self.maintenance_schedule.get(instrument_id, [])
            else:
                schedule = self.maintenance_schedule
            
            return {
                "schedule": schedule,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting maintenance schedule: {str(e)}")
            return {
                "error": f"Error getting schedule: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }

    def _extract_features(self, instrument_data: Dict) -> List[float]:
        """Extract features from instrument data"""
        feature_mapping = {
            'instrument_age_years': 0.0,
            'total_runtime_hours': 0.0,
            'maintenance_frequency_days': 365.0,
            'last_calibration_days': 30.0,
            'detector_sensitivity_change': 0.0,
            'baseline_noise_level': 0.1,
            'peak_resolution_degradation': 0.0,
            'carrier_gas_pressure_variance': 0.05,
            'inlet_temperature_stability': 1.0,
            'column_bleed_level': 0.0,
            'detector_response_time': 1.0,
            'vacuum_integrity_percent': 95.0,
            'septum_lifetime_remaining': 80.0,
            'liner_contamination_level': 0.0,
            'oven_temperature_accuracy': 1.0
        }
        
        features = []
        for feature_name in feature_mapping.keys():
            value = instrument_data.get(feature_name, feature_mapping[feature_name])
            features.append(float(value))
        
        return features

    def _generate_maintenance_recommendations(
        self,
        instrument_data: Dict,
        maintenance_probability: float
    ) -> List[Dict]:
        """Generate maintenance recommendations based on instrument data"""
        recommendations = []
        
        # Check specific issues and provide targeted recommendations
        if instrument_data.get('vacuum_integrity_percent', 100) < 90:
            recommendations.append({
                "priority": "HIGH",
                "action": "Check and replace vacuum pump oil",
                "reason": f"Vacuum integrity is {instrument_data['vacuum_integrity_percent']}%",
                "estimated_cost": "$200-500"
            })
        
        if instrument_data.get('septum_lifetime_remaining', 100) < 20:
            recommendations.append({
                "priority": "MEDIUM",
                "action": "Replace inlet septum",
                "reason": f"Septum lifetime remaining: {instrument_data['septum_lifetime_remaining']}%",
                "estimated_cost": "$50-100"
            })
        
        if instrument_data.get('liner_contamination_level', 0) > 0.5:
            recommendations.append({
                "priority": "HIGH",
                "action": "Clean or replace inlet liner",
                "reason": f"Liner contamination level: {instrument_data['liner_contamination_level']:.2f}",
                "estimated_cost": "$100-300"
            })
        
        if instrument_data.get('detector_sensitivity_change', 0) < -0.1:
            recommendations.append({
                "priority": "HIGH",
                "action": "Calibrate detector and check detector gas flow",
                "reason": f"Detector sensitivity decreased by {abs(instrument_data['detector_sensitivity_change']):.2f}",
                "estimated_cost": "$300-800"
            })
        
        if instrument_data.get('baseline_noise_level', 0) > 0.3:
            recommendations.append({
                "priority": "MEDIUM",
                "action": "Clean detector and check for contamination",
                "reason": f"High baseline noise: {instrument_data['baseline_noise_level']:.2f}",
                "estimated_cost": "$200-600"
            })
        
        # Add general maintenance if probability is high
        if maintenance_probability > 0.7:
            recommendations.append({
                "priority": "HIGH",
                "action": "Schedule comprehensive instrument maintenance",
                "reason": f"High maintenance probability: {maintenance_probability:.2%}",
                "estimated_cost": "$1000-3000"
            })
        
        return recommendations

    def _predict_failure_date(
        self,
        instrument_data: Dict,
        maintenance_probability: float
    ) -> str:
        """Predict failure date based on instrument condition"""
        try:
            # Base failure prediction on multiple factors
            age_factor = instrument_data.get('instrument_age_years', 0) * 30  # days
            runtime_factor = instrument_data.get('total_runtime_hours', 0) * 0.01  # days
            maintenance_factor = (365 - instrument_data.get('maintenance_frequency_days', 365)) * 0.5
            
            # Calculate days until potential failure
            days_to_failure = max(1, int(
                age_factor + runtime_factor + maintenance_factor + 
                (1 - maintenance_probability) * 365
            ))
            
            failure_date = datetime.now() + timedelta(days=days_to_failure)
            return failure_date.strftime("%Y-%m-%d")
            
        except Exception as e:
            logger.error(f"Error predicting failure date: {str(e)}")
            return (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")

    def _calculate_confidence_score(self, instrument_data: Dict) -> float:
        """Calculate confidence score for prediction"""
        # Higher confidence for instruments with more complete data
        required_fields = [
            'instrument_age_years', 'total_runtime_hours', 'vacuum_integrity_percent',
            'detector_sensitivity_change', 'baseline_noise_level'
        ]
        
        available_fields = sum(1 for field in required_fields if field in instrument_data)
        base_confidence = available_fields / len(required_fields)
        
        # Adjust confidence based on data quality
        if 'vacuum_integrity_percent' in instrument_data and instrument_data['vacuum_integrity_percent'] < 80:
            base_confidence += 0.1  # Higher confidence for clear issues
        
        return min(0.95, base_confidence)

    def _check_for_alerts(
        self,
        instrument_id: str,
        maintenance_probability: float,
        status: str
    ) -> List[Dict]:
        """Check for maintenance alerts"""
        alerts = []
        
        if maintenance_probability >= 0.9:
            alerts.append({
                "instrument_id": instrument_id,
                "severity": "CRITICAL",
                "message": f"Critical maintenance required - {maintenance_probability:.1%} probability",
                "timestamp": datetime.now().isoformat(),
                "action_required": "Immediate maintenance scheduling"
            })
        elif maintenance_probability >= 0.7:
            alerts.append({
                "instrument_id": instrument_id,
                "severity": "HIGH",
                "message": f"High priority maintenance - {maintenance_probability:.1%} probability",
                "timestamp": datetime.now().isoformat(),
                "action_required": "Schedule maintenance within 1 week"
            })
        
        return alerts

    def _estimate_maintenance_cost(self, prediction: Dict) -> float:
        """Estimate maintenance cost based on prediction"""
        base_cost = 500.0  # Base maintenance cost
        
        # Add costs based on recommendations
        for rec in prediction.get("recommendations", []):
            cost_str = rec.get("estimated_cost", "$0")
            cost_value = float(cost_str.replace("$", "").replace(",", "").split("-")[0])
            base_cost += cost_value
        
        return base_cost

    def _generate_fleet_schedule(self, fleet_predictions: Dict) -> List[Dict]:
        """Generate optimal maintenance schedule for fleet"""
        schedule = []
        
        # Sort instruments by maintenance probability (highest first)
        sorted_instruments = sorted(
            fleet_predictions.items(),
            key=lambda x: x[1]["maintenance_probability"],
            reverse=True
        )
        
        current_date = datetime.now()
        
        for instrument_id, prediction in sorted_instruments:
            if prediction["maintenance_status"] in ["CRITICAL", "HIGH"]:
                # Schedule critical and high priority instruments first
                schedule.append({
                    "instrument_id": instrument_id,
                    "priority": prediction["maintenance_status"],
                    "recommended_date": (current_date + timedelta(days=len(schedule) * 2)).strftime("%Y-%m-%d"),
                    "estimated_cost": self._estimate_maintenance_cost(prediction),
                    "reason": f"Maintenance probability: {prediction['maintenance_probability']:.1%}"
                })
        
        return schedule

    def update_model_with_new_data(
        self,
        instrument_data: List[Dict],
        actual_outcomes: List[bool]
    ) -> Dict:
        """Update ML model with new training data"""
        try:
            if len(instrument_data) != len(actual_outcomes):
                return {
                    "error": "Instrument data and outcomes must have same length",
                    "timestamp": datetime.now().isoformat()
                }
            
            # Prepare new training data
            X_new = []
            y_new = []
            
            for data, outcome in zip(instrument_data, actual_outcomes):
                features = self._extract_features(data)
                if len(features) == 15:  # Valid feature set
                    X_new.append(features)
                    y_new.append(1 if outcome else 0)
            
            if not X_new:
                return {
                    "error": "No valid training data provided",
                    "timestamp": datetime.now().isoformat()
                }
            
            # Retrain model with new data
            X_new_scaled = self.scaler.transform(X_new)
            
            # Combine with existing model (if available)
            if self.model:
                # For simplicity, we'll retrain the entire model
                # In production, you might use incremental learning
                self.model.fit(X_new_scaled, y_new)
            else:
                self.model = RandomForestClassifier(
                    n_estimators=100,
                    max_depth=10,
                    random_state=42
                )
                self.model.fit(X_new_scaled, y_new)
            
            # Save updated model
            joblib.dump(self.model, self.model_path)
            
            return {
                "success": True,
                "samples_added": len(X_new),
                "model_updated": True,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error updating model: {str(e)}")
            return {
                "error": f"Model update error: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }

    def get_service_status(self) -> Dict:
        """Get service status and capabilities"""
        return {
            "status": "operational",
            "model_loaded": self.model is not None,
            "fleet_monitoring": True,
            "alert_system": True,
            "maintenance_scheduling": True,
            "capabilities": [
                "single_instrument_prediction",
                "fleet_wide_analysis",
                "maintenance_alerts",
                "maintenance_scheduling",
                "cost_estimation",
                "failure_prediction"
            ],
            "fleet_summary": {
                "instruments_monitored": len(self.fleet_data),
                "active_alerts": len([a for a in self.alert_history if a.get("severity") in ["CRITICAL", "HIGH"]]),
                "scheduled_maintenance": sum(len(schedule) for schedule in self.maintenance_schedule.values())
            },
            "timestamp": datetime.now().isoformat()
        }

# Global instance
predictive_maintenance_service = PredictiveMaintenanceService() 