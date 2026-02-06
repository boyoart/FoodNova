import requests
import sys
import json
from datetime import datetime

class FoodNovaAPITester:
    def __init__(self, base_url="https://foodapp-deploy-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.customer_token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_order_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, auth_type=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
            
        if auth_type == 'customer' and self.customer_token:
            test_headers['Authorization'] = f'Bearer {self.customer_token}'
        elif auth_type == 'admin' and self.admin_token:
            test_headers['Authorization'] = f'Bearer {self.admin_token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health endpoint"""
        return self.run_test("Health Check", "GET", "health", 200)

    def test_api_root(self):
        """Test API root endpoint"""
        return self.run_test("API Root", "GET", "api", 200)

    def test_get_categories(self):
        """Test get categories"""
        return self.run_test("Get Categories", "GET", "api/categories", 200)

    def test_get_products(self):
        """Test get products"""
        return self.run_test("Get Products", "GET", "api/products", 200)

    def test_get_packs(self):
        """Test get packs"""
        return self.run_test("Get Packs", "GET", "api/packs", 200)

    def test_customer_register(self):
        """Test customer registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_data = {
            "email": f"testcustomer{timestamp}@test.com",
            "password": "TestPass123!",
            "full_name": "Test Customer"
        }
        return self.run_test("Customer Registration", "POST", "api/auth/register", 200, test_data)

    def test_customer_login(self):
        """Test customer login"""
        # First register a customer with microseconds for uniqueness
        timestamp = datetime.now().strftime('%H%M%S%f')
        register_data = {
            "email": f"testcustomer{timestamp}@test.com",
            "password": "TestPass123!",
            "full_name": "Test Customer"
        }
        
        success, _ = self.run_test("Customer Registration for Login", "POST", "api/auth/register", 200, register_data)
        if not success:
            # If registration fails, try to login with existing credentials
            print("   Registration failed, trying to login with test credentials...")
        
        # Now login
        login_data = {
            "email": register_data["email"],
            "password": register_data["password"]
        }
        success, response = self.run_test("Customer Login", "POST", "api/auth/login", 200, login_data)
        if success and 'access_token' in response:
            self.customer_token = response['access_token']
            print(f"   Customer token obtained")
            return True
        return False

    def test_admin_login(self):
        """Test admin login"""
        login_data = {
            "email": "admin@foodnova.com",
            "password": "Admin123!"
        }
        success, response = self.run_test("Admin Login", "POST", "api/auth/login", 200, login_data)
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            print(f"   Admin token obtained")
            return True
        return False

    def test_customer_me(self):
        """Test get current customer info"""
        if not self.customer_token:
            print("❌ No customer token available")
            return False
        return self.run_test("Get Customer Info", "GET", "api/auth/me", 200, auth_type='customer')[0]

    def test_create_order(self):
        """Test order creation"""
        if not self.customer_token:
            print("❌ No customer token available")
            return False
        
        # Get products first to create a valid order
        success, products = self.run_test("Get Products for Order", "GET", "api/products", 200)
        if not success or not products:
            print("❌ No products available for order")
            return False
        
        # Create order with first available product
        order_data = {
            "items": [
                {
                    "product_id": products[0]["id"],
                    "pack_variant_id": None,
                    "qty": 1
                }
            ],
            "delivery_address": "123 Test Street, Lagos, Nigeria",
            "phone": "+2348012345678",
            "payment_method": "etransfer"
        }
        
        success, response = self.run_test("Create Order", "POST", "api/orders", 200, order_data, auth_type='customer')
        if success and 'id' in response:
            self.created_order_id = response['id']
            print(f"   Order created with ID: {self.created_order_id}")
            return True
        return False

    def test_get_my_orders(self):
        """Test get customer orders"""
        if not self.customer_token:
            print("❌ No customer token available")
            return False
        return self.run_test("Get My Orders", "GET", "api/orders/my", 200, auth_type='customer')[0]

    def test_get_order_detail(self):
        """Test get order detail"""
        if not self.customer_token or not self.created_order_id:
            print("❌ No customer token or order ID available")
            return False
        return self.run_test("Get Order Detail", "GET", f"api/orders/{self.created_order_id}", 200, auth_type='customer')[0]

    def test_admin_get_orders(self):
        """Test admin get all orders"""
        if not self.admin_token:
            print("❌ No admin token available")
            return False
        return self.run_test("Admin Get Orders", "GET", "api/admin/orders", 200, auth_type='admin')[0]

    def test_admin_get_products(self):
        """Test admin get products"""
        if not self.admin_token:
            print("❌ No admin token available")
            return False
        return self.run_test("Admin Get Products", "GET", "api/admin/products", 200, auth_type='admin')[0]

    def test_admin_order_detail(self):
        """Test admin get order detail"""
        if not self.admin_token or not self.created_order_id:
            print("❌ No admin token or order ID available")
            return False
        return self.run_test("Admin Get Order Detail", "GET", f"api/admin/orders/{self.created_order_id}", 200, auth_type='admin')[0]

def main():
    print("🚀 Starting FoodNova API Tests...")
    tester = FoodNovaAPITester()
    
    # Basic API tests
    print("\n" + "="*50)
    print("BASIC API TESTS")
    print("="*50)
    tester.test_health_check()
    tester.test_api_root()
    tester.test_get_categories()
    tester.test_get_products()
    tester.test_get_packs()
    
    # Authentication tests
    print("\n" + "="*50)
    print("AUTHENTICATION TESTS")
    print("="*50)
    tester.test_customer_register()
    tester.test_customer_login()
    tester.test_admin_login()
    
    # Customer protected routes
    print("\n" + "="*50)
    print("CUSTOMER PROTECTED ROUTES")
    print("="*50)
    tester.test_customer_me()
    tester.test_create_order()
    tester.test_get_my_orders()
    tester.test_get_order_detail()
    
    # Admin protected routes
    print("\n" + "="*50)
    print("ADMIN PROTECTED ROUTES")
    print("="*50)
    tester.test_admin_get_orders()
    tester.test_admin_get_products()
    tester.test_admin_order_detail()
    
    # Print results
    print("\n" + "="*50)
    print("TEST RESULTS")
    print("="*50)
    print(f"📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"📈 Success rate: {success_rate:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())