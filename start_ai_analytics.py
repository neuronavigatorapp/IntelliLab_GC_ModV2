#!/usr/bin/env python3
"""
IntelliLab GC AI Analytics - Startup Script
===========================================

Phase 4A startup script to initialize and launch the AI analytics backend
with proper environment setup and dependency checking.

Author: IntelliLab Development Team
Date: September 13, 2025
"""

import sys
import subprocess
import os
from pathlib import Path
import time

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ Error: Python 3.8 or higher is required")
        print(f"Current version: {sys.version}")
        return False
    print(f"✅ Python version: {sys.version}")
    return True

def install_dependencies():
    """Install required dependencies"""
    print("📦 Installing AI Analytics dependencies...")
    
    requirements_file = Path("backend/requirements_ai.txt")
    if not requirements_file.exists():
        print("❌ Error: requirements_ai.txt not found")
        return False
    
    try:
        # Install dependencies
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-r", str(requirements_file)
        ])
        print("✅ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing dependencies: {e}")
        return False

def setup_database():
    """Initialize AI analytics database"""
    print("🗄️ Setting up AI Analytics database...")
    
    try:
        # Import and run database initialization
        sys.path.append(str(Path("backend")))
        from ai_analytics_api import init_ai_database
        
        init_ai_database()
        print("✅ AI Analytics database initialized")
        return True
    except Exception as e:
        print(f"❌ Error setting up database: {e}")
        return False

def start_ai_server():
    """Start the AI Analytics API server"""
    print("🚀 Starting IntelliLab GC AI Analytics API...")
    print("Server will run on: http://localhost:8001")
    print("API Documentation: http://localhost:8001/docs")
    print("\nPress Ctrl+C to stop the server\n")
    
    try:
        api_file = Path("backend/ai_analytics_api.py")
        if not api_file.exists():
            print("❌ Error: ai_analytics_api.py not found")
            return False
        
        # Change to backend directory
        os.chdir("backend")
        
        # Start the server
        subprocess.run([
            sys.executable, "ai_analytics_api.py"
        ])
        
    except KeyboardInterrupt:
        print("\n🛑 AI Analytics API server stopped")
        return True
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        return False

def main():
    """Main startup sequence"""
    print("🧪 IntelliLab GC AI Analytics - Phase 4A Startup")
    print("=" * 60)
    
    # Check prerequisites
    if not check_python_version():
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        print("❌ Failed to install dependencies. Please install manually:")
        print("   pip install -r backend/requirements_ai.txt")
        sys.exit(1)
    
    # Setup database
    if not setup_database():
        print("❌ Failed to setup database")
        sys.exit(1)
    
    print("\n✅ Phase 4A Foundation Setup Complete!")
    print("🤖 AI Engines Available:")
    print("   • Method Optimization AI")
    print("   • Predictive Maintenance AI") 
    print("   • Cost Optimization AI")
    print("\n" + "=" * 60)
    
    # Start server
    if not start_ai_server():
        sys.exit(1)

if __name__ == "__main__":
    main()