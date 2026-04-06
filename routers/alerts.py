# routers/alerts.py — Price Alerts CRUD
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime
from database import get_db_client
from auth_utils import get_current_user

router = APIRouter()

class AlertBody(BaseModel):
    pair:      str
    price:     float
    direction: str   # above | below

class TriggerBody(BaseModel):
    fired_price: float

# ── GET /api/alerts ───────────────────────────────────────────
@router.get("")
async def get_alerts(current_user: dict = Depends(get_current_user)):
    db  = get_db_client()
    uid = current_user["sub"]
    res = db.table("alerts").select("*").eq("user_id", uid).order("created_at", desc=True).execute()
    return res.data or []

# ── POST /api/alerts ──────────────────────────────────────────
@router.post("")
async def create_alert(body: AlertBody, current_user: dict = Depends(get_current_user)):
    db  = get_db_client()
    uid = current_user["sub"]

    if body.direction not in ("above", "below"):
        raise HTTPException(400, "direction must be 'above' or 'below'")

    # Max 20 alerts per user
    count_res = db.table("alerts").select("id", count="exact").eq("user_id", uid).eq("triggered", False).execute()
    if (count_res.count or 0) >= 20:
        raise HTTPException(400, "Maximum 20 active alerts allowed")

    alert_id = str(uuid.uuid4())
    result = db.table("alerts").insert({
        "id":         alert_id,
        "user_id":    uid,
        "pair":       body.pair,
        "price":      body.price,
        "direction":  body.direction,
        "triggered":  False,
        "created_at": datetime.utcnow().isoformat(),
    }).execute()

    if not result.data:
        raise HTTPException(500, "Failed to create alert")
    return result.data[0]

# ── DELETE /api/alerts/{id} ───────────────────────────────────
@router.delete("/{alert_id}")
async def delete_alert(alert_id: str, current_user: dict = Depends(get_current_user)):
    db  = get_db_client()
    uid = current_user["sub"]

    res = db.table("alerts").select("id").eq("id", alert_id).eq("user_id", uid).execute()
    if not res.data:
        raise HTTPException(404, "Alert not found")

    db.table("alerts").delete().eq("id", alert_id).execute()
    return {"message": "Alert deleted"}

# ── PATCH /api/alerts/{id}/trigger ───────────────────────────
@router.patch("/{alert_id}/trigger")
async def trigger_alert(alert_id: str, body: TriggerBody, current_user: dict = Depends(get_current_user)):
    db  = get_db_client()
    uid = current_user["sub"]

    res = db.table("alerts").select("*").eq("id", alert_id).eq("user_id", uid).execute()
    if not res.data:
        raise HTTPException(404, "Alert not found")

    db.table("alerts").update({
        "triggered":    True,
        "fired_price":  body.fired_price,
        "triggered_at": datetime.utcnow().isoformat(),
    }).eq("id", alert_id).execute()

    return {"message": "Alert triggered", "fired_price": body.fired_price}
