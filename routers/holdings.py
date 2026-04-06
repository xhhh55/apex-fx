# routers/holdings.py — Long-term Asset Holdings (Crypto / Stocks / Real Estate)
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime
from database import get_db_client
from auth_utils import get_current_user

router = APIRouter()

VALID_TYPES = {"crypto", "stock", "realestate", "forex", "commodity"}

# ── Schemas ───────────────────────────────────────────────────
class HoldingBody(BaseModel):
    asset:      str          # BTC, AAPL, EURL, etc.
    asset_type: str          # crypto | stock | realestate | forex | commodity
    quantity:   float
    avg_price:  float
    notes:      Optional[str] = None

class HoldingUpdate(BaseModel):
    quantity:  Optional[float] = None
    avg_price: Optional[float] = None
    notes:     Optional[str]  = None

# ── GET /api/holdings ─────────────────────────────────────────
@router.get("")
async def get_holdings(current_user: dict = Depends(get_current_user)):
    db  = get_db_client()
    uid = current_user["sub"]
    res = db.table("holdings").select("*").eq("user_id", uid).order("created_at", desc=True).execute()
    return res.data or []

# ── POST /api/holdings ────────────────────────────────────────
@router.post("")
async def add_holding(body: HoldingBody, current_user: dict = Depends(get_current_user)):
    db  = get_db_client()
    uid = current_user["sub"]

    if body.asset_type not in VALID_TYPES:
        raise HTTPException(400, f"asset_type must be one of: {', '.join(VALID_TYPES)}")
    if body.quantity <= 0:
        raise HTTPException(400, "quantity must be > 0")
    if body.avg_price <= 0:
        raise HTTPException(400, "avg_price must be > 0")

    # If holding for same asset already exists → merge (dollar-cost average)
    existing = db.table("holdings").select("*") \
        .eq("user_id", uid).eq("asset", body.asset.upper()).execute()

    if existing.data:
        old = existing.data[0]
        old_qty   = float(old["quantity"])
        old_price = float(old["avg_price"])
        new_qty   = old_qty + body.quantity
        new_avg   = round((old_qty * old_price + body.quantity * body.avg_price) / new_qty, 6)
        db.table("holdings").update({
            "quantity":   new_qty,
            "avg_price":  new_avg,
            "notes":      body.notes or old.get("notes"),
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("id", old["id"]).execute()
        updated = db.table("holdings").select("*").eq("id", old["id"]).execute()
        return updated.data[0]

    holding_id = str(uuid.uuid4())
    result = db.table("holdings").insert({
        "id":         holding_id,
        "user_id":    uid,
        "asset":      body.asset.upper(),
        "asset_type": body.asset_type,
        "quantity":   body.quantity,
        "avg_price":  body.avg_price,
        "notes":      body.notes,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }).execute()

    if not result.data:
        raise HTTPException(500, "Failed to add holding")
    return result.data[0]

# ── PUT /api/holdings/{id} ────────────────────────────────────
@router.put("/{holding_id}")
async def update_holding(holding_id: str, body: HoldingUpdate, current_user: dict = Depends(get_current_user)):
    db  = get_db_client()
    uid = current_user["sub"]

    res = db.table("holdings").select("id").eq("id", holding_id).eq("user_id", uid).execute()
    if not res.data:
        raise HTTPException(404, "Holding not found")

    patch = {"updated_at": datetime.utcnow().isoformat()}
    if body.quantity  is not None:
        if body.quantity <= 0:
            raise HTTPException(400, "quantity must be > 0")
        patch["quantity"] = body.quantity
    if body.avg_price is not None:
        if body.avg_price <= 0:
            raise HTTPException(400, "avg_price must be > 0")
        patch["avg_price"] = body.avg_price
    if body.notes is not None:
        patch["notes"] = body.notes

    db.table("holdings").update(patch).eq("id", holding_id).execute()
    updated = db.table("holdings").select("*").eq("id", holding_id).execute()
    return updated.data[0]

# ── DELETE /api/holdings/{id} ─────────────────────────────────
@router.delete("/{holding_id}")
async def delete_holding(holding_id: str, current_user: dict = Depends(get_current_user)):
    db  = get_db_client()
    uid = current_user["sub"]

    res = db.table("holdings").select("id").eq("id", holding_id).eq("user_id", uid).execute()
    if not res.data:
        raise HTTPException(404, "Holding not found")

    db.table("holdings").delete().eq("id", holding_id).execute()
    return {"message": "Holding deleted", "id": holding_id}

# ── GET /api/holdings/summary ─────────────────────────────────
@router.get("/summary")
async def holdings_summary(current_user: dict = Depends(get_current_user)):
    """Returns total value by asset type (needs current prices from client)."""
    db  = get_db_client()
    uid = current_user["sub"]
    res = db.table("holdings").select("asset_type,quantity,avg_price").eq("user_id", uid).execute()
    holdings = res.data or []

    by_type: dict = {}
    for h in holdings:
        t = h["asset_type"]
        cost = float(h["quantity"]) * float(h["avg_price"])
        by_type[t] = round(by_type.get(t, 0) + cost, 2)

    total_cost = round(sum(by_type.values()), 2)
    return {"by_type": by_type, "total_cost": total_cost, "count": len(holdings)}
