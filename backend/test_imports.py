#!/usr/bin/env python3
"""
Test script to check if all imports work correctly
"""

import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """Test all critical imports"""
    print("Testing imports...")
    
    try:
        from app.core.config import settings
        print("✅ Config imported successfully")
    except Exception as e:
        print(f"❌ Config import failed: {e}")
        return False
    
    try:
        from app.core.database import engine, Base
        print("✅ Database imported successfully")
    except Exception as e:
        print(f"❌ Database import failed: {e}")
        return False
    
    try:
        from app.services.ai_troubleshooting_service import ai_troubleshooting_service
        print("✅ AI Troubleshooting Service imported successfully")
    except Exception as e:
        print(f"❌ AI Troubleshooting Service import failed: {e}")
        return False
    
    try:
        from app.services.predictive_maintenance_service import predictive_maintenance_service
        print("✅ Predictive Maintenance Service imported successfully")
    except Exception as e:
        print(f"❌ Predictive Maintenance Service import failed: {e}")
        return False
    
    try:
        from app.services.chromatogram_analysis_service import chromatogram_analysis_service
        print("✅ Chromatogram Analysis Service imported successfully")
    except Exception as e:
        print(f"❌ Chromatogram Analysis Service import failed: {e}")
        return False
    
    try:
        from app.api.v1.api import api_router
        print("✅ API Router imported successfully")
    except Exception as e:
        print(f"❌ API Router import failed: {e}")
        return False
    
    print("✅ All imports successful!")
    return True

if __name__ == "__main__":
    test_imports() 