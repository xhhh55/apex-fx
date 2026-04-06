# routers/investment_products.py
# ══════════════════════════════════════════════════════════════
#  Investment Products & User Positions
#  Products are seeded in schema.sql (Lido, Binance Earn, etc.)
#  No hardcoded data — everything read/written from Supabase.
# ══════════════════════════════════════════════════════════════
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from database import get_db_client
from auth_utils import get_current_user

router = APIRouter()

# ── Schemas ───────────────────────────────────────────────────
class InvestBody(BaseModel):
    product_id:    str
    amount:        float
    auto_compound: bool = False

class WithdrawBody(BaseModel):
    position_id: str

# ── GET /api/investments/products  ───────────────────────────
@router.get("/products")
async def list_products(
    category:   Optional[str]  = Query(None),  # staking | savings | fixed | fund | lending
    token:      Optional[str]  = Query(None),
    risk_level: Optional[str]  = Query(None),
    min_apy:    Optional[float]= Query(None),
):
    db    = get_db_client()
    query = db.table("investment_products").select("*").eq("is_active", True)

    if category:   query = query.eq("category", category)
    if token:      query = query.eq("token", token.upper())
    if risk_level: query = query.eq("risk_level", risk_level)
    if min_apy:    query = query.gte("apy_min", min_apy)

    res = query.order("tvl", desc=True).execute()
    return {"products": res.data or [], "count": len(res.data or [])}

# ── GET /api/investments/products/{id}  ──────────────────────
@router.get("/products/{product_id}")
async def get_product(product_id: str):
    db  = get_db_client()
    res = db.table("investment_products").select("*").eq("id", product_id).execute()
    if not res.data:
        raise HTTPException(404, "Product not found")
    return res.data[0]

# ── POST /api/investments/invest  ────────────────────────────
@router.post("/invest")
async def invest(body: InvestBody, current_user: dict = Depends(get_current_user)):
    db  = get_db_client()
    uid = current_user["sub"]

    # Fetch product
    prod_res = db.table("investment_products").select("*").eq("id", body.product_id).eq("is_active", True).execute()
    if not prod_res.data:
        raise HTTPException(404, "Investment product not found or inactive")
    product = prod_res.data[0]

    if body.amount < float(product["min_amount"]):
        raise HTTPException(400, f"Minimum investment is {product['min_amount']} {product['currency']}")
    if product.get("max_amount") and body.amount > float(product["max_amount"]):
        raise HTTPException(400, f"Maximum investment is {product['max_amount']} {product['currency']}")

    # Check user balance
    user_res = db.table("users").select("balance").eq("id", uid).execute()
    if not user_res.data:
        raise HTTPException(404, "User not found")
    balance = float(user_res.data[0]["balance"])
    if balance < body.amount:
        raise HTTPException(400, f"Insufficient balance. Need {body.amount:.2f}, have {balance:.2f}")

    # Deduct balance
    db.table("users").update({"balance": balance - body.amount}).eq("id", uid).execute()

    # Calculate end_date for fixed-lock products
    lock_days = product.get("lock_days", 0) or 0
    start     = datetime.utcnow()
    end_date  = (start + timedelta(days=lock_days)).isoformat() if lock_days > 0 else None

    # Use apy_max if available, else apy_min (user gets best available rate)
    apy_locked = float(product.get("apy_max") or product["apy_min"])

    pos_res = db.table("investment_positions").insert({
        "user_id":       uid,
        "product_id":    body.product_id,
        "amount":        body.amount,
        "apy_locked":    apy_locked,
        "start_date":    start.isoformat(),
        "end_date":      end_date,
        "earned":        0,
        "status":        "active",
        "auto_compound": body.auto_compound,
        "created_at":    start.isoformat(),
    }).execute()

    if not pos_res.data:
        # Rollback balance deduction on failure
        db.table("users").update({"balance": balance}).eq("id", uid).execute()
        raise HTTPException(500, "Failed to create position")

    return {
        "message":    "Investment created",
        "position":   pos_res.data[0],
        "apy_locked": apy_locked,
        "end_date":   end_date,
    }

# ── GET /api/investments/positions  ──────────────────────────
@router.get("/positions")
async def my_positions(current_user: dict = Depends(get_current_user)):
    db  = get_db_client()
    uid = current_user["sub"]

    res = db.table("investment_positions").select(
        "*, investment_products(name,name_ar,category,token,apy_min,apy_max,lock_days,currency,provider)"
    ).eq("user_id", uid).neq("status","withdrawn").order("created_at", desc=True).execute()

    positions = res.data or []

    # Calculate current earned for each position (compound-interest style)
    now = datetime.utcnow()
    for p in positions:
        if p["status"] != "active":
            continue
        start_dt  = datetime.fromisoformat(p["start_date"].replace("Z",""))
        days_held = max(0, (now - start_dt).total_seconds() / 86400)
        apy       = float(p["apy_locked"]) / 100
        if p.get("auto_compound"):
            earned = float(p["amount"]) * ((1 + apy/365) ** days_held - 1)
        else:
            earned = float(p["amount"]) * apy * (days_held / 365)
        p["current_earned"] = round(earned, 4)
        p["days_held"]      = round(days_held, 1)

    return {"positions": positions, "count": len(positions)}

# ── POST /api/investments/withdraw  ──────────────────────────
@router.post("/withdraw")
async def withdraw(body: WithdrawBody, current_user: dict = Depends(get_current_user)):
    db  = get_db_client()
    uid = current_user["sub"]

    pos_res = db.table("investment_positions").select(
        "*, investment_products(lock_days)"
    ).eq("id", body.position_id).eq("user_id", uid).execute()

    if not pos_res.data:
        raise HTTPException(404, "Position not found")
    pos = pos_res.data[0]

    if pos["status"] != "active":
        raise HTTPException(400, "Position is not active")

    # Check lock period
    lock_days = (pos.get("investment_products") or {}).get("lock_days", 0) or 0
    if lock_days > 0 and pos.get("end_date"):
        end_dt = datetime.fromisoformat(pos["end_date"].replace("Z",""))
        if datetime.utcnow() < end_dt:
            remaining = (end_dt - datetime.utcnow()).days
            raise HTTPException(400, f"Still locked for {remaining} more day(s)")

    # Calculate final earnings
    start_dt  = datetime.fromisoformat(pos["start_date"].replace("Z",""))
    days_held = max(0, (datetime.utcnow() - start_dt).total_seconds() / 86400)
    apy       = float(pos["apy_locked"]) / 100
    if pos.get("auto_compound"):
        earned = float(pos["amount"]) * ((1 + apy/365) ** days_held - 1)
    else:
        earned = float(pos["amount"]) * apy * (days_held / 365)
    earned = round(earned, 4)

    total_return = float(pos["amount"]) + earned

    # Credit user
    user_res = db.table("users").select("balance").eq("id", uid).execute()
    current_balance = float(user_res.data[0]["balance"])
    db.table("users").update({"balance": current_balance + total_return}).eq("id", uid).execute()

    # Mark position withdrawn
    db.table("investment_positions").update({
        "status": "withdrawn",
        "earned": earned,
    }).eq("id", body.position_id).execute()

    return {
        "message":      "Withdrawal successful",
        "principal":    float(pos["amount"]),
        "earned":       earned,
        "total_return": total_return,
    }

# ── GET /api/investments/summary  ────────────────────────────
@router.get("/summary")
async def investment_summary(current_user: dict = Depends(get_current_user)):
    """Total invested, total earned, active positions count."""
    db  = get_db_client()
    uid = current_user["sub"]

    res = db.table("investment_positions").select("*").eq("user_id", uid).execute()
    positions = res.data or []

    total_invested = sum(float(p["amount"]) for p in positions if p["status"] == "active")
    total_earned   = sum(float(p.get("earned") or 0) for p in positions)
    active_count   = sum(1 for p in positions if p["status"] == "active")
    withdrawn      = sum(float(p["amount"]) + float(p.get("earned") or 0) for p in positions if p["status"] == "withdrawn")

    return {
        "total_invested": round(total_invested, 2),
        "total_earned":   round(total_earned, 4),
        "active_count":   active_count,
        "total_withdrawn":round(withdrawn, 2),
    }
