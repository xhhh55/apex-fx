# routers/portfolio.py — Virtual Portfolio & Trades
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime
from database import get_db_client
from auth_utils import get_current_user

router = APIRouter()

STARTING_BALANCE = 10000.0
MAX_LOTS         = 100.0     # sanity cap


def get_lot_multiplier(pair: str) -> float:
    """USD P&L per 1 lot per 1 price-unit move — must stay in sync with frontend getLotMultiplier."""
    p = pair.upper()
    if any(x in p for x in ["BTC","ETH","BNB","SOL","XRP","ADA","DOGE","DOT","AVAX","LINK","MATIC","UNI","ATOM","LTC","SHIB","ICP"]):
        return 1.0        # crypto: 1 lot = 1 coin
    if "XAU" in p:        return 100.0   # gold: 1 lot = 100 oz
    if "XAG" in p:        return 50.0    # silver: 1 lot = 50 oz
    if "XPT" in p or "XPD" in p: return 50.0
    if "JPY" in p or "KRW" in p: return 1000.0   # yen/won pairs
    if any(x in p for x in ["US30","SPX","NAS","GER","UK1","JPN","DAX","FTSE","CAC"]):
        return 1.0        # stock indices
    if any(x in p for x in ["WTI","BRENT","OIL","NATGAS","XNG","XTI","XBR"]):
        return 10.0       # energy
    return 100000.0       # standard forex (EUR/USD, GBP/USD, etc.)


# ── Schemas ───────────────────────────────────────────────────
class TradeBody(BaseModel):
    pair:        str
    action:      str          # BUY | SELL
    lots:        float
    entry_price: float
    sl:          Optional[float] = None
    tp:          Optional[float] = None

class CloseBody(BaseModel):
    exit_price: float

# ── GET /api/portfolio ────────────────────────────────────────
@router.get("")
async def get_portfolio(current_user: dict = Depends(get_current_user)):
    db  = get_db_client()
    uid = current_user["sub"]

    # User balance
    user_res = db.table("users").select("balance,plan").eq("id", uid).execute()
    if not user_res.data:
        raise HTTPException(404, "User not found")
    user = user_res.data[0]

    # Open trades
    open_res = db.table("trades").select("*").eq("user_id", uid).eq("status", "open").execute()

    # History (last 50)
    hist_res = db.table("trades").select("*").eq("user_id", uid).eq("status", "closed") \
               .order("closed_at", desc=True).limit(50).execute()

    # Stats
    history  = hist_res.data or []
    wins     = [t for t in history if (t.get("pl") or 0) > 0]
    win_rate = round(len(wins) / len(history) * 100) if history else 0
    total_pl = round(sum(t.get("pl", 0) for t in history), 2)

    return {
        "balance":   round(user["balance"], 2),
        "plan":      user.get("plan", "free"),
        "open":      open_res.data or [],
        "history":   history,
        "stats": {
            "total_trades": len(history),
            "wins":         len(wins),
            "losses":       len(history) - len(wins),
            "win_rate":     win_rate,
            "total_pl":     total_pl,
        }
    }

# ── POST /api/portfolio/trade ─────────────────────────────────
@router.post("/trade")
async def open_trade(body: TradeBody, current_user: dict = Depends(get_current_user)):
    db  = get_db_client()
    uid = current_user["sub"]

    if body.action not in ("BUY", "SELL"):
        raise HTTPException(400, "action must be BUY or SELL")
    if body.lots <= 0:
        raise HTTPException(400, "lots must be > 0")
    if body.lots > MAX_LOTS:
        raise HTTPException(400, f"lots cannot exceed {MAX_LOTS}")
    if body.entry_price <= 0:
        raise HTTPException(400, "entry_price must be positive")

    trade_id = str(uuid.uuid4())
    result = db.table("trades").insert({
        "id":           trade_id,
        "user_id":      uid,
        "pair":         body.pair,
        "action":       body.action,
        "lots":         body.lots,
        "entry_price":  body.entry_price,
        "sl":           body.sl,
        "tp":           body.tp,
        "status":       "open",
        "opened_at":    datetime.utcnow().isoformat(),
    }).execute()

    if not result.data:
        raise HTTPException(500, "Failed to open trade")

    return result.data[0]

# ── POST /api/portfolio/trade/{id}/close ──────────────────────
@router.post("/trade/{trade_id}/close")
async def close_trade(trade_id: str, body: CloseBody, current_user: dict = Depends(get_current_user)):
    db  = get_db_client()
    uid = current_user["sub"]

    # Get trade
    trade_res = db.table("trades").select("*").eq("id", trade_id).eq("user_id", uid).execute()
    if not trade_res.data:
        raise HTTPException(404, "Trade not found")

    trade = trade_res.data[0]
    if trade["status"] != "open":
        raise HTTPException(400, "Trade already closed")
    if body.exit_price <= 0:
        raise HTTPException(400, "exit_price must be positive")

    # Calculate P&L using instrument-aware multiplier
    diff = body.exit_price - trade["entry_price"]
    if trade["action"] == "SELL":
        diff = -diff
    pl = round(diff * trade["lots"] * get_lot_multiplier(trade["pair"]), 2)

    # Update trade
    db.table("trades").update({
        "status":      "closed",
        "exit_price":  body.exit_price,
        "pl":          pl,
        "closed_at":   datetime.utcnow().isoformat(),
    }).eq("id", trade_id).execute()

    # Update user balance
    user_res = db.table("users").select("balance").eq("id", uid).execute()
    old_balance = user_res.data[0]["balance"]
    db.table("users").update({"balance": round(old_balance + pl, 2)}).eq("id", uid).execute()

    return {"trade_id": trade_id, "pl": pl, "exit_price": body.exit_price}

# ── POST /api/portfolio/reset ─────────────────────────────────
@router.post("/reset")
async def reset_portfolio(current_user: dict = Depends(get_current_user)):
    db  = get_db_client()
    uid = current_user["sub"]

    # Close all open trades with 0 P&L
    db.table("trades").update({"status": "closed", "pl": 0, "closed_at": datetime.utcnow().isoformat()}) \
      .eq("user_id", uid).eq("status", "open").execute()

    # Reset balance
    db.table("users").update({"balance": STARTING_BALANCE}).eq("id", uid).execute()

    return {"message": "Portfolio reset", "balance": STARTING_BALANCE}

# ── GET /api/portfolio/stats ──────────────────────────────────
@router.get("/stats")
async def get_stats(current_user: dict = Depends(get_current_user)):
    db  = get_db_client()
    uid = current_user["sub"]

    hist_res = db.table("trades").select("pl,opened_at,pair,action").eq("user_id", uid).eq("status", "closed").execute()
    history  = hist_res.data or []

    wins       = [t for t in history if (t.get("pl") or 0) > 0]
    total_pl   = round(sum(t.get("pl", 0) for t in history), 2)
    best_trade = max(history, key=lambda t: t.get("pl", 0), default=None)
    worst      = min(history, key=lambda t: t.get("pl", 0), default=None)

    return {
        "total_trades": len(history),
        "wins":         len(wins),
        "losses":       len(history) - len(wins),
        "win_rate":     round(len(wins) / len(history) * 100) if history else 0,
        "total_pl":     total_pl,
        "best_trade":   best_trade,
        "worst_trade":  worst,
    }
