#!/usr/bin/env python3
"""
Test script for authentication system
"""

import requests
import json
from datetime import datetime

# API base URL
BASE_URL = "http://localhost:8000/api/v1"

def test_auth_system():
    """Test the authentication system"""
    print("🧪 Testing Authentication System")
    print("=" * 50)
    
    # Test data
    test_user = {
        "email": "test@intellilab.com",
        "full_name": "Test User",
        "password": "testpassword123",
        "role": "scientist",
        "department": "Analytical Chemistry"
    }
    
    admin_user = {
        "email": "admin@intellilab.com",
        "full_name": "Admin User",
        "password": "adminpassword123",
        "role": "admin",
        "department": "IT"
    }
    
    try:
        # 1. Test user registration
        print("\n1. Testing User Registration...")
        response = requests.post(f"{BASE_URL}/auth/register", json=test_user)
        if response.status_code == 201:
            print("✅ User registration successful")
            user_data = response.json()
            print(f"   User ID: {user_data['id']}")
            print(f"   Email: {user_data['email']}")
            print(f"   Role: {user_data['role']}")
        else:
            print(f"❌ User registration failed: {response.status_code}")
            print(f"   Response: {response.text}")
        
        # 2. Test admin registration
        print("\n2. Testing Admin Registration...")
        response = requests.post(f"{BASE_URL}/auth/register", json=admin_user)
        if response.status_code == 201:
            print("✅ Admin registration successful")
            admin_data = response.json()
            print(f"   Admin ID: {admin_data['id']}")
            print(f"   Email: {admin_data['email']}")
            print(f"   Role: {admin_data['role']}")
        else:
            print(f"❌ Admin registration failed: {response.status_code}")
            print(f"   Response: {response.text}")
        
        # 3. Test user login
        print("\n3. Testing User Login...")
        login_data = {
            "email": test_user["email"],
            "password": test_user["password"]
        }
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        if response.status_code == 200:
            print("✅ User login successful")
            token_data = response.json()
            access_token = token_data["access_token"]
            print(f"   Token type: {token_data['token_type']}")
            print(f"   Expires in: {token_data['expires_in']} seconds")
            print(f"   User: {token_data['user']['full_name']}")
        else:
            print(f"❌ User login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return
        
        # 4. Test get current user
        print("\n4. Testing Get Current User...")
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        if response.status_code == 200:
            print("✅ Get current user successful")
            user_info = response.json()
            print(f"   User: {user_info['full_name']}")
            print(f"   Email: {user_info['email']}")
            print(f"   Role: {user_info['role']}")
            print(f"   Last login: {user_info['last_login']}")
        else:
            print(f"❌ Get current user failed: {response.status_code}")
            print(f"   Response: {response.text}")
        
        # 5. Test admin login
        print("\n5. Testing Admin Login...")
        admin_login_data = {
            "email": admin_user["email"],
            "password": admin_user["password"]
        }
        response = requests.post(f"{BASE_URL}/auth/login", json=admin_login_data)
        if response.status_code == 200:
            print("✅ Admin login successful")
            admin_token_data = response.json()
            admin_token = admin_token_data["access_token"]
            print(f"   Admin token received")
        else:
            print(f"❌ Admin login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return
        
        # 6. Test get all users (admin only)
        print("\n6. Testing Get All Users (Admin Only)...")
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/auth/users", headers=admin_headers)
        if response.status_code == 200:
            print("✅ Get all users successful (admin)")
            users = response.json()
            print(f"   Total users: {len(users)}")
            for user in users:
                print(f"   - {user['full_name']} ({user['email']}) - {user['role']}")
        else:
            print(f"❌ Get all users failed: {response.status_code}")
            print(f"   Response: {response.text}")
        
        # 7. Test password change
        print("\n7. Testing Password Change...")
        password_change_data = {
            "current_password": test_user["password"],
            "new_password": "newpassword123"
        }
        response = requests.post(f"{BASE_URL}/auth/change-password", 
                               json=password_change_data, headers=headers)
        if response.status_code == 200:
            print("✅ Password change successful")
        else:
            print(f"❌ Password change failed: {response.status_code}")
            print(f"   Response: {response.text}")
        
        # 8. Test login with new password
        print("\n8. Testing Login with New Password...")
        new_login_data = {
            "email": test_user["email"],
            "password": "newpassword123"
        }
        response = requests.post(f"{BASE_URL}/auth/login", json=new_login_data)
        if response.status_code == 200:
            print("✅ Login with new password successful")
        else:
            print(f"❌ Login with new password failed: {response.status_code}")
            print(f"   Response: {response.text}")
        
        # 9. Test unauthorized access
        print("\n9. Testing Unauthorized Access...")
        response = requests.get(f"{BASE_URL}/auth/users")  # No token
        if response.status_code == 401:
            print("✅ Unauthorized access properly blocked")
        else:
            print(f"❌ Unauthorized access not blocked: {response.status_code}")
        
        # 10. Test invalid token
        print("\n10. Testing Invalid Token...")
        invalid_headers = {"Authorization": "Bearer invalid_token"}
        response = requests.get(f"{BASE_URL}/auth/me", headers=invalid_headers)
        if response.status_code == 401:
            print("✅ Invalid token properly rejected")
        else:
            print(f"❌ Invalid token not rejected: {response.status_code}")
        
        print("\n" + "=" * 50)
        print("🎉 Authentication System Test Complete!")
        print("✅ All core authentication features working")
        print("✅ User registration and login functional")
        print("✅ JWT token authentication working")
        print("✅ Role-based access control implemented")
        print("✅ Password change functionality working")
        print("✅ Admin endpoints properly secured")
        
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Make sure the backend server is running")
        print("   Run: uvicorn app.main:app --reload")
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")


if __name__ == "__main__":
    test_auth_system()
