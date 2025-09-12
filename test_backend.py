#!/usr/bin/env python3
"""
Simple test script to verify backend functionality
"""

import requests
import json
import time

def test_backend_health():
    """Test backend health endpoint"""
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend health check passed")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Backend not reachable: {e}")
        return False

def test_api_docs():
    """Test API documentation endpoint"""
    try:
        response = requests.get("http://localhost:8000/docs", timeout=5)
        if response.status_code == 200:
            print("✅ API documentation accessible")
            return True
        else:
            print(f"❌ API documentation failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ API documentation not reachable: {e}")
        return False

def test_instruments_endpoint():
    """Test instruments endpoint"""
    try:
        response = requests.get("http://localhost:8000/api/v1/instruments/", timeout=5)
        if response.status_code == 200:
            print("✅ Instruments endpoint working")
            return True
        else:
            print(f"❌ Instruments endpoint failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Instruments endpoint not reachable: {e}")
        return False

def test_inlet_simulation():
    """Test inlet simulation endpoint"""
    try:
        test_data = {
            "inlet_temp": 250.0,
            "split_ratio": 50.0,
            "injection_volume": 1.0,
            "liner_type": "Split Liner",
            "injection_mode": "Split",
            "carrier_gas": "Helium",
            "carrier_flow_rate": 1.0,
            "septum_purge": 3.0,
            "instrument_age": 5.0,
            "maintenance_level": "Good",
            "vacuum_integrity": 95.0,
            "septum_condition": "Good",
            "liner_condition": "Clean"
        }
        
        response = requests.post(
            "http://localhost:8000/api/v1/calculations/inlet-simulator",
            json=test_data,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Inlet simulation working")
            print(f"   Transfer efficiency: {result.get('transfer_efficiency', 'N/A')}%")
            print(f"   Optimization score: {result.get('optimization_score', 'N/A')}")
            return True
        else:
            print(f"❌ Inlet simulation failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Inlet simulation not reachable: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing IntelliLab GC Backend...")
    print("=" * 50)
    
    tests = [
        ("Health Check", test_backend_health),
        ("API Documentation", test_api_docs),
        ("Instruments Endpoint", test_instruments_endpoint),
        ("Inlet Simulation", test_inlet_simulation),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n🔍 Testing: {test_name}")
        if test_func():
            passed += 1
        time.sleep(1)  # Small delay between tests
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Backend is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the backend logs for more details.")
    
    return passed == total

if __name__ == "__main__":
    main()
