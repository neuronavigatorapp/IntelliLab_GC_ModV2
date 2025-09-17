"""
Quick AI Engine Test - Windows Compatible
========================================
"""

import json
import urllib.request
import urllib.parse

def test_ai_engines():
    base_url = "http://localhost:8001"
    
    print("🧪 Quick AI Engine Test")
    print("=" * 30)
    
    # Test 1: Health Check
    try:
        with urllib.request.urlopen(f"{base_url}/health") as response:
            data = json.loads(response.read().decode())
            print(f"✅ Health Check: {data['status']}")
    except Exception as e:
        print(f"❌ Health Check Failed: {e}")
        return
    
    # Test 2: Method Optimization
    try:
        request_data = {
            "compound_name": "Caffeine",
            "method_type": "GC-MS"
        }
        
        data = json.dumps(request_data).encode('utf-8')
        req = urllib.request.Request(f"{base_url}/ai/method-optimization", 
                                   data=data, 
                                   headers={'Content-Type': 'application/json'})
        
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            print(f"✅ Method Optimization: {result['performance_improvement']}% improvement")
    except Exception as e:
        print(f"❌ Method Optimization Failed: {e}")
    
    # Test 3: Predictive Maintenance
    try:
        request_data = {"instruments": [1, 2]}
        
        data = json.dumps(request_data).encode('utf-8')
        req = urllib.request.Request(f"{base_url}/ai/maintenance-predictions", 
                                   data=data, 
                                   headers={'Content-Type': 'application/json'})
        
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            print(f"✅ Predictive Maintenance: {len(result)} predictions generated")
    except Exception as e:
        print(f"❌ Predictive Maintenance Failed: {e}")
    
    # Test 4: Cost Optimization
    try:
        request_data = {"analysis_period": "monthly"}
        
        data = json.dumps(request_data).encode('utf-8')
        req = urllib.request.Request(f"{base_url}/ai/cost-optimization", 
                                   data=data, 
                                   headers={'Content-Type': 'application/json'})
        
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            print(f"✅ Cost Optimization: ${result['potential_savings']:,} savings identified")
    except Exception as e:
        print(f"❌ Cost Optimization Failed: {e}")

if __name__ == "__main__":
    test_ai_engines()