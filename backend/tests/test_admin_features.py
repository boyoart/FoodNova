"""
Backend tests for FoodNova Admin Features
Tests: Categories, Packs, Order Status (including Delivered)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestAdminAuth:
    """Admin authentication tests"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@foodnova.com",
            "password": "Admin123!"
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        return data["access_token"]
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@foodnova.com",
            "password": "Admin123!"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data.get("token_type") == "bearer"


class TestAdminCategories:
    """Admin category management tests"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@foodnova.com",
            "password": "Admin123!"
        })
        return response.json()["access_token"]
    
    def test_get_categories(self, admin_token):
        """Test getting all categories"""
        response = requests.get(
            f"{BASE_URL}/api/admin/categories",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 3  # At least Rice, Oil, Pasta & Noodles
    
    def test_create_category_and_verify(self, admin_token):
        """Test creating a new category and verifying persistence"""
        # Create
        create_response = requests.post(
            f"{BASE_URL}/api/admin/categories",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"name": "TEST_Snacks"}
        )
        assert create_response.status_code == 200
        created_cat = create_response.json()
        assert created_cat["name"] == "TEST_Snacks"
        assert "id" in created_cat
        
        # Verify via GET
        get_response = requests.get(f"{BASE_URL}/api/categories")
        assert get_response.status_code == 200
        categories = get_response.json()
        category_names = [c["name"] for c in categories]
        assert "TEST_Snacks" in category_names
    
    def test_create_duplicate_category_fails(self, admin_token):
        """Test that creating duplicate category fails"""
        response = requests.post(
            f"{BASE_URL}/api/admin/categories",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"name": "Rice"}  # Already exists
        )
        assert response.status_code == 400
        assert "already exists" in response.json().get("detail", "").lower()


class TestAdminPacks:
    """Admin pack management tests"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@foodnova.com",
            "password": "Admin123!"
        })
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def created_pack_id(self, admin_token):
        """Create a pack for testing"""
        response = requests.post(
            f"{BASE_URL}/api/admin/packs",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "name": "TEST_Office Pack",
                "description": "For office pantry",
                "is_active": True
            }
        )
        return response.json()["id"]
    
    def test_get_packs(self, admin_token):
        """Test getting all packs"""
        response = requests.get(
            f"{BASE_URL}/api/admin/packs",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 3  # At least Starter, Family, Premium packs
    
    def test_create_pack(self, admin_token):
        """Test creating a new pack"""
        response = requests.post(
            f"{BASE_URL}/api/admin/packs",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "name": "TEST_Budget Pack",
                "description": "Affordable combo",
                "is_active": True
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["message"] == "Pack created"
    
    def test_add_variant_to_pack(self, admin_token, created_pack_id):
        """Test adding a variant to a pack"""
        response = requests.post(
            f"{BASE_URL}/api/admin/packs/{created_pack_id}/variants",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "name": "Mini",
                "price": 8000,
                "items": [{"product_id": 1, "qty": 1}, {"product_id": 3, "qty": 2}]
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        
        # Verify the variant was added
        get_response = requests.get(
            f"{BASE_URL}/api/admin/packs",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        packs = get_response.json()
        pack = next((p for p in packs if p["id"] == created_pack_id), None)
        assert pack is not None
        assert len(pack["variants"]) >= 1
        variant = pack["variants"][0]
        assert variant["name"] == "Mini"
        assert variant["price"] == 8000
        assert len(variant["items"]) == 2
    
    def test_update_pack(self, admin_token, created_pack_id):
        """Test updating a pack"""
        response = requests.patch(
            f"{BASE_URL}/api/admin/packs/{created_pack_id}",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"description": "Updated description"}
        )
        assert response.status_code == 200
        
        # Verify update
        get_response = requests.get(
            f"{BASE_URL}/api/admin/packs",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        packs = get_response.json()
        pack = next((p for p in packs if p["id"] == created_pack_id), None)
        assert pack["description"] == "Updated description"


class TestAdminOrders:
    """Admin order management tests - especially status updates"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@foodnova.com",
            "password": "Admin123!"
        })
        return response.json()["access_token"]
    
    def test_get_orders(self, admin_token):
        """Test getting all orders"""
        response = requests.get(
            f"{BASE_URL}/api/admin/orders",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_order_detail(self, admin_token):
        """Test getting order details"""
        # First get orders list
        orders_response = requests.get(
            f"{BASE_URL}/api/admin/orders",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        orders = orders_response.json()
        if len(orders) > 0:
            order_id = orders[0]["id"]
            response = requests.get(
                f"{BASE_URL}/api/admin/orders/{order_id}",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            assert response.status_code == 200
            data = response.json()
            assert "id" in data
            assert "status" in data
            assert "items" in data
    
    def test_update_order_status_to_confirmed(self, admin_token):
        """Test updating order status to confirmed"""
        orders_response = requests.get(
            f"{BASE_URL}/api/admin/orders",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        orders = orders_response.json()
        if len(orders) > 0:
            order_id = orders[-1]["id"]  # Use last order to avoid conflicts
            response = requests.patch(
                f"{BASE_URL}/api/admin/orders/{order_id}",
                headers={"Authorization": f"Bearer {admin_token}"},
                json={"status": "confirmed"}
            )
            assert response.status_code == 200
            
            # Verify status change
            get_response = requests.get(
                f"{BASE_URL}/api/admin/orders/{order_id}",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            assert get_response.json()["status"] == "confirmed"
    
    def test_update_order_status_to_delivered(self, admin_token):
        """Test updating order status to DELIVERED - key feature"""
        orders_response = requests.get(
            f"{BASE_URL}/api/admin/orders",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        orders = orders_response.json()
        if len(orders) > 0:
            order_id = orders[-1]["id"]
            response = requests.patch(
                f"{BASE_URL}/api/admin/orders/{order_id}",
                headers={"Authorization": f"Bearer {admin_token}"},
                json={"status": "delivered"}
            )
            assert response.status_code == 200
            assert response.json()["status"] == "delivered"
            
            # Verify status persisted
            get_response = requests.get(
                f"{BASE_URL}/api/admin/orders/{order_id}",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            assert get_response.json()["status"] == "delivered"


class TestPublicEndpoints:
    """Test public endpoints work correctly"""
    
    def test_get_categories(self):
        """Test public categories endpoint"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_products(self):
        """Test public products endpoint"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            product = data[0]
            assert "id" in product
            assert "name" in product
            assert "price" in product
    
    def test_get_packs(self):
        """Test public packs endpoint"""
        response = requests.get(f"{BASE_URL}/api/packs")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


# Cleanup test data
@pytest.fixture(scope="session", autouse=True)
def cleanup_test_data():
    """Cleanup test-created data after all tests"""
    yield
    # Cleanup: Delete TEST_ prefixed categories and packs
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@foodnova.com",
            "password": "Admin123!"
        })
        if response.status_code == 200:
            token = response.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            
            # Delete test categories
            cats = requests.get(f"{BASE_URL}/api/admin/categories", headers=headers).json()
            for cat in cats:
                if cat["name"].startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/admin/categories/{cat['id']}", headers=headers)
            
            # Delete test packs
            packs = requests.get(f"{BASE_URL}/api/admin/packs", headers=headers).json()
            for pack in packs:
                if pack["name"].startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/admin/packs/{pack['id']}", headers=headers)
    except Exception as e:
        print(f"Cleanup failed: {e}")
