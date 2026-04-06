# routers/leaderboard.py — Global Leaderboard
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from database import get_db_client
from auth_utils import get_current_user

router = APIRouter()

class LeaderboardEntry(BaseModel):
    balance:   float
    trades:    int
    win_rate:  float

# ── GET /api/leaderboard ──────────────────────────────────────
@router.get("")
async def get_leaderboard():
    db = get_db_client()

    # Join users with their trade stats
    res = db.table("leaderboard_view").select("*").order("balance", desc=True).limit(50).execute()

    if not res.data:
        # Fallback: get from users table directly
        users_res = db.table("users").select("id,name,balance,plan").order("balance", desc=True).limit(50).execute()
        leaderboard = []
        for i, u in enumerate(users_res.data or []):
            # Get trade count per user
            trades_res = db.table("trades").select("pl", count="exact").eq("user_id", u["id"]).eq("status", "closed").execute()
            trades     = trades_res.count or 0
            wins       = len([t for t in (trades_res.data or []) if (t.get("pl") or 0) > 0])
            win_rate   = round(wins / trades * 100) if trades else 0

            leaderboard.append({
                "rank":      i + 1,
                "name":      u["name"],
                "balance":   round(u["balance"], 2),
                "plan":      u.get("plan", "free"),
                "trades":    trades,
                "win_rate":  win_rate,
                "profit":    round(u["balance"] - 10000, 2),
            })
        return leaderboard

    return [
        {**entry, "rank": i + 1}
        for i, entry in enumerate(res.data)
    ]

# ── POST /api/leaderboard/update ─────────────────────────────
@router.post("/update")
async def update_leaderboard(body: LeaderboardEntry, current_user: dict = Depends(get_current_user)):
    """Called from frontend after trade close to update leaderboard entry"""
    db  = get_db_client()
    uid = current_user["sub"]

    # Upsert leaderboard entry
    db.table("leaderboard").upsert({
        "user_id":  uid,
        "balance":  body.balance,
        "trades":   body.trades,
        "win_rate": body.win_rate,
    }).execute()

    return {"message": "Leaderboard updated"}

# ── GET /api/leaderboard/me ───────────────────────────────────
@router.get("/me")
async def my_rank(current_user: dict = Depends(get_current_user)):
    db  = get_db_client()
    uid = current_user["sub"]

    # Get my balance
    user_res = db.table("users").select("balance").eq("id", uid).execute()
    if not user_res.data:
        raise HTTPException(404, "User not found")

    my_balance = user_res.data[0]["balance"]

    # Count users with higher balance
    higher_res = db.table("users").select("id", count="exact").gt("balance", my_balance).execute()
    rank = (higher_res.count or 0) + 1

    return {"rank": rank, "balance": round(my_balance, 2), "profit": round(my_balance - 10000, 2)}
