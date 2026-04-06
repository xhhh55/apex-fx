# auth_utils.py — JWT helpers (access + refresh tokens)
import os, jwt, bcrypt
from datetime import datetime, timedelta
from fastapi import HTTPException, Header
from database import get_db_client

JWT_SECRET          = os.getenv("JWT_SECRET", "apex_super_secret_change_in_production")
ACCESS_EXPIRY_HOURS = int(os.getenv("ACCESS_EXPIRY_HOURS", "24"))     # 1 day
REFRESH_EXPIRY_DAYS = int(os.getenv("REFRESH_EXPIRY_DAYS", "30"))     # 30 days

# ── Token creation ────────────────────────────────────────────
def create_token(user_id: str, email: str) -> str:
    """Short-lived access token (24h)."""
    payload = {
        "sub":   user_id,
        "email": email,
        "type":  "access",
        "exp":   datetime.utcnow() + timedelta(hours=ACCESS_EXPIRY_HOURS),
        "iat":   datetime.utcnow(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def create_refresh_token(user_id: str, email: str) -> str:
    """Long-lived refresh token (30d)."""
    payload = {
        "sub":   user_id,
        "email": email,
        "type":  "refresh",
        "exp":   datetime.utcnow() + timedelta(days=REFRESH_EXPIRY_DAYS),
        "iat":   datetime.utcnow(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

# ── Token verification ────────────────────────────────────────
def verify_token(token: str, expected_type: str = "access") -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        if payload.get("type") != expected_type:
            raise HTTPException(status_code=401, detail="Invalid token type")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ── FastAPI dependency ────────────────────────────────────────
def get_current_user(authorization: str = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = authorization.split(" ", 1)[1]
    return verify_token(token, expected_type="access")

# ── Optional auth (returns None if no token) ─────────────────
def get_optional_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        token = authorization.split(" ", 1)[1]
        return verify_token(token, expected_type="access")
    except HTTPException:
        return None

# ── Password helpers ──────────────────────────────────────────
def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()

def check_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())
