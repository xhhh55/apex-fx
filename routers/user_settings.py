# routers/user_settings.py — User Profile & Settings
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from database import get_db_client
from auth_utils import get_current_user, hash_password, check_password

router = APIRouter()

VALID_THEMES = {"gold", "blue", "green", "purple", "red"}
VALID_LANGS  = {"ar", "en"}

# ── Schemas ───────────────────────────────────────────────────
class ProfileUpdate(BaseModel):
    name:       Optional[str] = None
    bio:        Optional[str] = None
    avatar_url: Optional[str] = None

class NotifUpdate(BaseModel):
    notif_email:     Optional[bool] = None
    notif_push:      Optional[bool] = None
    notif_price:     Optional[bool] = None
    notif_news:      Optional[bool] = None
    notif_leaderboard: Optional[bool] = None

class AppPrefs(BaseModel):
    theme: Optional[str] = None   # gold | blue | green | purple | red
    lang:  Optional[str] = None   # ar | en

class PasswordChange(BaseModel):
    current_password: str
    new_password:     str

class DeleteAccount(BaseModel):
    password: str
    confirm:  str   # must equal "DELETE"

# ── GET /api/settings ─────────────────────────────────────────
@router.get("")
async def get_settings(current_user: dict = Depends(get_current_user)):
    db  = get_db_client()
    uid = current_user["sub"]

    res = db.table("users").select(
        "id,name,email,plan,bio,avatar_url,"
        "notif_email,notif_push,notif_price,notif_news,notif_leaderboard,"
        "theme,lang,created_at"
    ).eq("id", uid).execute()

    if not res.data:
        raise HTTPException(404, "User not found")

    user = res.data[0]
    # Defaults for nullable columns
    user.setdefault("notif_email",       True)
    user.setdefault("notif_push",        True)
    user.setdefault("notif_price",       True)
    user.setdefault("notif_news",        True)
    user.setdefault("notif_leaderboard", False)
    user.setdefault("theme", "gold")
    user.setdefault("lang",  "ar")
    return user

# ── PUT /api/settings/profile ─────────────────────────────────
@router.put("/profile")
async def update_profile(body: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    db  = get_db_client()
    uid = current_user["sub"]

    patch = {"updated_at": datetime.utcnow().isoformat()}

    if body.name is not None:
        name = body.name.strip()
        if len(name) < 2:
            raise HTTPException(400, "Name must be at least 2 characters")
        if len(name) > 60:
            raise HTTPException(400, "Name must be 60 characters or less")
        patch["name"] = name

    if body.bio is not None:
        if len(body.bio) > 300:
            raise HTTPException(400, "Bio must be 300 characters or less")
        patch["bio"] = body.bio

    if body.avatar_url is not None:
        # Basic URL validation
        if body.avatar_url and not body.avatar_url.startswith(("https://", "http://")):
            raise HTTPException(400, "avatar_url must be a valid URL")
        patch["avatar_url"] = body.avatar_url

    if len(patch) == 1:   # only updated_at
        raise HTTPException(400, "No fields to update")

    db.table("users").update(patch).eq("id", uid).execute()

    res = db.table("users").select("id,name,email,bio,avatar_url,plan").eq("id", uid).execute()
    return res.data[0]

# ── PUT /api/settings/notifications ───────────────────────────
@router.put("/notifications")
async def update_notifications(body: NotifUpdate, current_user: dict = Depends(get_current_user)):
    db  = get_db_client()
    uid = current_user["sub"]

    patch = {"updated_at": datetime.utcnow().isoformat()}
    if body.notif_email       is not None: patch["notif_email"]       = body.notif_email
    if body.notif_push        is not None: patch["notif_push"]        = body.notif_push
    if body.notif_price       is not None: patch["notif_price"]       = body.notif_price
    if body.notif_news        is not None: patch["notif_news"]        = body.notif_news
    if body.notif_leaderboard is not None: patch["notif_leaderboard"] = body.notif_leaderboard

    db.table("users").update(patch).eq("id", uid).execute()
    return {"message": "Notification preferences updated"}

# ── PUT /api/settings/preferences ────────────────────────────
@router.put("/preferences")
async def update_preferences(body: AppPrefs, current_user: dict = Depends(get_current_user)):
    db  = get_db_client()
    uid = current_user["sub"]

    patch = {"updated_at": datetime.utcnow().isoformat()}

    if body.theme is not None:
        if body.theme not in VALID_THEMES:
            raise HTTPException(400, f"theme must be one of: {', '.join(VALID_THEMES)}")
        patch["theme"] = body.theme

    if body.lang is not None:
        if body.lang not in VALID_LANGS:
            raise HTTPException(400, "lang must be 'ar' or 'en'")
        patch["lang"] = body.lang

    db.table("users").update(patch).eq("id", uid).execute()
    return {"message": "Preferences updated", "theme": body.theme, "lang": body.lang}

# ── PUT /api/settings/password ────────────────────────────────
@router.put("/password")
async def change_password(body: PasswordChange, current_user: dict = Depends(get_current_user)):
    db  = get_db_client()
    uid = current_user["sub"]

    if len(body.new_password) < 6:
        raise HTTPException(400, "New password must be at least 6 characters")
    if body.new_password == body.current_password:
        raise HTTPException(400, "New password must differ from current password")

    res = db.table("users").select("password_hash").eq("id", uid).execute()
    if not res.data:
        raise HTTPException(404, "User not found")

    if not check_password(body.current_password, res.data[0]["password_hash"]):
        raise HTTPException(401, "Current password is incorrect")

    new_hash = hash_password(body.new_password)
    db.table("users").update({
        "password_hash": new_hash,
        "updated_at":    datetime.utcnow().isoformat(),
    }).eq("id", uid).execute()

    return {"message": "Password changed successfully"}

# ── DELETE /api/settings/account ─────────────────────────────
@router.delete("/account")
async def delete_account(body: DeleteAccount, current_user: dict = Depends(get_current_user)):
    """Permanently deletes account. Requires password + typing 'DELETE'."""
    db  = get_db_client()
    uid = current_user["sub"]

    if body.confirm != "DELETE":
        raise HTTPException(400, "confirm must be the string 'DELETE'")

    res = db.table("users").select("password_hash").eq("id", uid).execute()
    if not res.data:
        raise HTTPException(404, "User not found")

    if not check_password(body.password, res.data[0]["password_hash"]):
        raise HTTPException(401, "Incorrect password")

    # Cascade deletes handle trades, alerts, holdings, journal via FK
    db.table("users").delete().eq("id", uid).execute()

    return {"message": "Account permanently deleted"}
