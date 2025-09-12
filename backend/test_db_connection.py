#!/usr/bin/env python3
"""
Test database connection script for IntelliLab GC
"""

import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import engine, init_db, check_database_health
import asyncio

def test_connection():
    """Test database connection and table creation"""
    print("Testing database connection...")
    
    # Test basic connection
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ Database connection successful!")
            print(f"Database URL: {engine.url}")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print("Note: If using PostgreSQL, ensure the database exists and is running")
        return False
    
    # Test table creation
    try:
        init_db()
        print("✅ Database tables created successfully!")
    except Exception as e:
        print(f"❌ Failed to create database tables: {e}")
        return False
    
    # Test health check
    try:
        is_healthy = asyncio.run(check_database_health())
        if is_healthy:
            print("✅ Database health check passed!")
        else:
            print("❌ Database health check failed!")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False
    
    print("\n🎉 All database tests passed!")
    return True

if __name__ == "__main__":
    success = test_connection()
    sys.exit(0 if success else 1)
