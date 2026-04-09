import sys
import os

# Add the current directory (backend/) to sys.path so imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
# Load .env file from the SAME directory as main.py
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(env_path)

# --- Centralized Logging (must be first) ---
from core.logging_config import setup_logging
setup_logging()
import logging
logger = logging.getLogger("phishguard.main")

from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from slowapi import _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from core.rate_limit import limiter
from core.security import verify_token, create_access_token, verify_password, get_password_hash, ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import timedelta, datetime
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from pydantic import BaseModel
from services.read_email import parse_email_bytes
from services.imap_client import fetch_latest_email
from core.rules import rule_based_analysis
from services.url_analysis import analyze_urls
from ml.ml_predict import ml_score_with_explanation
from services.image_analysis import analyze_images
from services.attachment_analysis import analyze_attachments
from core.decision_engine import decide
from database.database import init_db, save_scan, get_db, get_db_conn
import json
import copy
import random
from collections import defaultdict

# Import rule-based chatbot
from api.chatbot import chatbot
CHATBOT_AVAILABLE = True


# Disable interactive docs in production
_ENV = os.getenv("ENVIRONMENT", "development")
_docs_url = "/docs" if _ENV != "production" else None
_redoc_url = "/redoc" if _ENV != "production" else None

app = FastAPI(title="PhishGuard API", version="2.0", docs_url=_docs_url, redoc_url=_redoc_url)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# JWT dependency - verifies the Bearer token on protected routes
def verify_soc_admin(username: str = Depends(verify_token)):
    return username

# --- CORS CONFIGURATION ---
# Allow requests from the frontend
cors_origins_str = os.getenv("CORS_ORIGINS", "")
origins = [origin.strip() for origin in cors_origins_str.split(",")] if cors_origins_str else [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5177",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Initialize DB on startup
init_db()

# Seed the default admin user securely
def seed_admin_user():
    try:
        from database.database import get_db_conn
        conn = get_db_conn()
        cur = conn.cursor()
        # Check if users table exists and admin exists
        try:
            cur.execute("SELECT username FROM users WHERE username = 'admin'")
            row = cur.fetchone()
            if not row:
                # Use environment variable or generate a random secure temporary password
                admin_pass = os.getenv("ADMIN_PASSWORD")
                if not admin_pass:
                    import secrets
                    admin_pass = secrets.token_urlsafe(12)
                    logger.warning(f"[STARTUP] No ADMIN_PASSWORD set in .env! Generated random admin password: {admin_pass}")
                
                hashed = get_password_hash(admin_pass)
                cur.execute("INSERT INTO users (username, hashed_password, role) VALUES (:p0, :p1, :p2)",
                            {"p0": "admin", "p1": hashed, "p2": "admin"})
                conn.commit()
                if os.getenv("ADMIN_PASSWORD"):
                    logger.info("[STARTUP] Admin user created using ADMIN_PASSWORD from environment.")
            else:
                logger.info("[STARTUP] Admin user already exists.")
        except Exception:
            pass
        conn.close()
    except Exception as e:
        logger.error(f"[STARTUP] Could not seed admin user: {e}")

seed_admin_user()

# --- HEALTH CHECK (required for cloud deployment / load balancers) ---
@app.get("/health", tags=["System"])
def health_check():
    """Returns API health status. Used by Docker, Kubernetes, and cloud load balancers."""
    from database.database import SessionLocal
    db_status = "ok"
    try:
        if SessionLocal:
            db = SessionLocal()
            db.execute(__import__('sqlalchemy').text("SELECT 1"))
            db.close()
    except Exception:
        db_status = "error"
    return {
        "status": "ok",
        "db": db_status,
        "timestamp": datetime.utcnow().isoformat()
    }

# --- ROUTERS ---
from routers import auth, soc, analysis, chat, websockets
app.include_router(auth.router, prefix="/api")
app.include_router(soc.router)
app.include_router(analysis.router)
app.include_router(chat.router)
app.include_router(websockets.router)
