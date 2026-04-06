# routers/auth.py — Register / Login / Refresh / Me / Logout
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
import uuid
from database import get_db_client
from auth_utils import (
    hash_password, check_password,
    create_token, create_refresh_token,
    verify_token, get_current_user,
)

router = APIRouter()

# ── Schemas ───────────────────────────────────────────────────
class RegisterBody(BaseModel):
    name:     str
    email:    EmailStr
    password: str

class LoginBody(BaseModel):
    email:    EmailStr
    password: str

class RefreshBody(BaseModel):
    refresh_token: str

# ── POST /api/auth/register ───────────────────────────────────
@router.post("/register")
async def register(body: RegisterBody):
    if len(body.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")

    db = get_db_client()

    existing = db.table("users").select("id").eq("email", body.email.lower()).execute()
    if existing.data:
        raise HTTPException(400, "Email already registered")

    user_id = str(uuid.uuid4())
    hashed  = hash_password(body.password)

    result = db.table("users").insert({
        "id":            user_id,
        "name":          body.name.strip(),
        "email":         body.email.lower(),
        "password_hash": hashed,
        "plan":          "free",
        "balance":       10000.0,
    }).execute()

    if not result.data:
        raise HTTPException(500, "Registration failed")

    user = result.data[0]
    return {
        "token":         create_token(user["id"], user["email"]),
        "refresh_token": create_refresh_token(user["id"], user["email"]),
        "user": {
            "id":    user["id"],
            "name":  user["name"],
            "email": user["email"],
            "plan":  user["plan"],
        }
    }

# ── POST /api/auth/login ──────────────────────────────────────
@router.post("/login")
async def login(body: LoginBody):
    db = get_db_client()
    result = db.table("users").select("*").eq("email", body.email.lower()).execute()

    if not result.data:
        raise HTTPException(401, "Invalid email or password")

    user = result.data[0]

    if not check_password(body.password, user["password_hash"]):
        raise HTTPException(401, "Invalid email or password")

    return {
        "token":         create_token(user["id"], user["email"]),
        "refresh_token": create_refresh_token(user["id"], user["email"]),
        "user": {
            "id":    user["id"],
            "name":  user["name"],
            "email": user["email"],
            "plan":  user.get("plan", "free"),
        }
    }

# ── POST /api/auth/refresh ────────────────────────────────────
@router.post("/refresh")
async def refresh(body: RefreshBody):
    """Exchange a valid refresh token for a new access token."""
    payload = verify_token(body.refresh_token, expected_type="refresh")

    db = get_db_client()
    result = db.table("users").select("id,email,plan").eq("id", payload["sub"]).execute()
    if not result.data:
        raise HTTPException(401, "User not found")

    user = result.data[0]
    return {
        "token": create_token(user["id"], user["email"]),
        # Issue new refresh token as well (sliding window)
        "refresh_token": create_refresh_token(user["id"], user["email"]),
    }

# ── GET /api/auth/me ──────────────────────────────────────────
@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    db = get_db_client()
    result = db.table("users").select("id,name,email,plan,created_at").eq("id", current_user["sub"]).execute()

    if not result.data:
        raise HTTPException(404, "User not found")

    return result.data[0]

# ── POST /api/auth/logout ─────────────────────────────────────
@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    # JWT is stateless — client deletes both tokens
    return {"message": "Logged out successfully"}
