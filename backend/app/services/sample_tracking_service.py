"""
Sample Tracking Service
Handles sample lifecycle management and chain of custody
"""
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from datetime import datetime
import uuid

class SampleTrackingService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_sample(self, sample_data: Dict) -> Dict:
        """Create new sample with chain of custody"""
        
        sample_id = f"GC-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8]}"
        
        sample = {
            "sample_id": sample_id,
            "name": sample_data.get("name"),
            "matrix": sample_data.get("matrix", "Unknown"),
            "status": "received",
            "priority": sample_data.get("priority", "normal"),
            "analyst_id": sample_data.get("analyst_id", 1),
            "notes": sample_data.get("notes", ""),
            "created_date": datetime.now().isoformat(),
            "chain_of_custody": [
                {
                    "date": datetime.now().isoformat(),
                    "action": "sample_received",
                    "technician": "Lab Technician",
                    "location": "Receiving Lab",
                    "notes": "Sample logged into system"
                }
            ]
        }
        
        return sample
    
    def update_sample_status(self, sample_id: str, new_status: str, notes: str = "") -> Dict:
        """Update sample status and chain of custody"""
        
        status_transitions = {
            "received": "prep",
            "prep": "analysis", 
            "analysis": "complete",
            "complete": "archived"
        }
        
        chain_entry = {
            "date": datetime.now().isoformat(),
            "action": f"status_changed_to_{new_status}",
            "technician": "Lab Technician",
            "location": "GC Lab",
            "notes": notes or f"Status updated to {new_status}"
        }
        
        return {
            "sample_id": sample_id,
            "new_status": new_status,
            "chain_of_custody_entry": chain_entry,
            "updated_date": datetime.now().isoformat()
        }
    
    def get_samples_by_status(self, status: str) -> List[Dict]:
        """Get samples by workflow status"""
        
        # Mock data for demonstration
        samples = [
            {
                "sample_id": "GC-20240806-001",
                "name": "Environmental Water Sample",
                "matrix": "Water",
                "status": status,
                "priority": "high",
                "analyst_id": 1,
                "created_date": datetime.now().isoformat()
            }
        ]
        
        return samples
    
    def get_analyst_workload(self, analyst_id: int) -> Dict:
        """Get analyst's current workload"""
        
        return {
            "analyst_id": analyst_id,
            "total_samples": 12,
            "by_status": {
                "received": 3,
                "prep": 4,
                "analysis": 4,
                "complete": 1
            },
            "by_priority": {
                "urgent": 2,
                "high": 4,
                "normal": 5,
                "low": 1
            }
        }