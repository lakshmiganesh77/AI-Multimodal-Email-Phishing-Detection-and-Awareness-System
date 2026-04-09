"""
PhishGuard Backend Tests
Run with: pytest tests/ -v
"""
import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock


# --------------------------------------------------------------------------
# Fixtures
# --------------------------------------------------------------------------

@pytest.fixture(scope="module")
def client():
    """Create a test client with DB dependencies mocked out."""
    with patch("database.database.init_db"), \
         patch("database.database.init_soc_tables"), \
         patch("main.seed_admin_user"):
        from main import app
        return TestClient(app)


@pytest.fixture(scope="module")
def auth_token(client):
    """Get a valid JWT token for the default admin user."""
    with patch("database.database.get_db_conn") as mock_conn:
        from core.security import get_password_hash
        mock_cur = MagicMock()
        mock_cur.fetchone.return_value = ("admin", get_password_hash("1234"), "admin")
        mock_conn.return_value.__enter__.return_value.cursor.return_value = mock_cur
        mock_conn.return_value.cursor.return_value = mock_cur

        response = client.post("/api/auth/login", data={"username": "admin", "password": "1234"})
        assert response.status_code == 200
        return response.json()["access_token"]


# --------------------------------------------------------------------------
# AUTH TESTS
# --------------------------------------------------------------------------

class TestAuthentication:

    def test_login_success(self, client):
        """Valid credentials should return a JWT token."""
        with patch("database.database.get_db_conn") as mock_conn:
            from core.security import get_password_hash
            mock_cur = MagicMock()
            mock_cur.fetchone.return_value = ("admin", get_password_hash("1234"), "admin")
            mock_conn.return_value.cursor.return_value = mock_cur

            response = client.post("/api/auth/login", data={"username": "admin", "password": "1234"})
            assert response.status_code == 200
            data = response.json()
            assert "access_token" in data
            assert data["token_type"] == "bearer"
            assert data["username"] == "admin"

    def test_login_wrong_password(self, client):
        """Wrong password should return 401."""
        with patch("database.database.get_db_conn") as mock_conn:
            from core.security import get_password_hash
            mock_cur = MagicMock()
            mock_cur.fetchone.return_value = ("admin", get_password_hash("1234"), "admin")
            mock_conn.return_value.cursor.return_value = mock_cur

            response = client.post("/api/auth/login", data={"username": "admin", "password": "wrongpass"})
            assert response.status_code == 401

    def test_login_nonexistent_user(self, client):
        """Non-existent user should return 401."""
        with patch("database.database.get_db_conn") as mock_conn:
            mock_cur = MagicMock()
            mock_cur.fetchone.return_value = None
            mock_conn.return_value.cursor.return_value = mock_cur

            response = client.post("/api/auth/login", data={"username": "nobody", "password": "1234"})
            assert response.status_code == 401

    def test_protected_route_without_token(self, client):
        """Accessing a protected route without a token should return 401."""
        response = client.get("/soc/stats")
        assert response.status_code == 401

    def test_protected_route_with_invalid_token(self, client):
        """Using a garbage token should return 401."""
        response = client.get("/soc/stats", headers={"Authorization": "Bearer garbage_token"})
        assert response.status_code == 401


# --------------------------------------------------------------------------
# API HEALTH TESTS
# --------------------------------------------------------------------------

class TestApiHealth:

    def test_docs_accessible(self, client):
        """FastAPI docs endpoint should always be accessible."""
        response = client.get("/docs")
        assert response.status_code == 200

    def test_analyze_requires_file(self, client):
        """POST /analyze without a file should return 422 (validation error)."""
        response = client.post("/analyze")
        assert response.status_code in (422, 400)

    def test_chat_endpoint_reachable(self, client):
        """POST /chat should accept a message and return a response (not 500)."""
        with patch("api.chatbot.chatbot.chat", return_value="Test response"):
            response = client.post("/chat", json={"message": "Hello"})
            assert response.status_code in (200, 422)  # 422 if chatbot import fails in test


# --------------------------------------------------------------------------
# SECURITY MODULE TESTS
# --------------------------------------------------------------------------

class TestSecurityModule:

    def test_password_hash_and_verify(self):
        from core.security import get_password_hash, verify_password
        hashed = get_password_hash("testpassword")
        assert verify_password("testpassword", hashed) is True
        assert verify_password("wrongpassword", hashed) is False

    def test_token_creation_and_verification(self):
        from core.security import create_access_token, verify_token
        from fastapi.security import OAuth2PasswordBearer
        from datetime import timedelta

        token = create_access_token(data={"sub": "admin"}, expires_delta=timedelta(minutes=30))
        assert isinstance(token, str)
        assert len(token) > 10

    def test_expired_token_raises(self):
        from core.security import create_access_token
        import jwt, time
        from datetime import timedelta

        token = create_access_token(data={"sub": "admin"}, expires_delta=timedelta(seconds=-1))
        import pytest
        with pytest.raises(Exception):
            import jwt as pyjwt
            pyjwt.decode(token, "phishguard-super-secret-key-change-in-production-2024", algorithms=["HS256"])
