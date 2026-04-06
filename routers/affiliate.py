# routers/affiliate.py — Referral & Affiliate System
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import uuid, secrets, string
from datetime import datetime
from database import get_db_client
from auth_utils import get_current_user

router = APIRouter()

COMMISSION_RATE = 0.20   # 20% of first month's subscription
PRO_PRICE       = 9.99
ELITE_PRICE     = 29.99

def _gen_code(length: int = 8) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))

# ── Schemas ───────────────────────────────────────────────────
class ApplyCodeBody(BaseModel):
    code: str   # referral code to apply (at registration)

class PayoutBody(BaseModel):
    amount: float

# ── GET /api/affiliate/code — get or auto-create referral code ─
@router.get("/code")
async def get_code(current_user: dict = Depends(get_current_user)):
    db  = get_db_client()
    uid = current_user["sub"]

    res = db.table("affiliates").select("*").eq("user_id", uid).execute()
    if res.data:
        return res.data[0]

    # Auto-create
    code = _gen_code()
    # Ensure unique
    while db.table("affiliates").select("code").eq("code", code).execute().data:
        code = _gen_code()

    result = db.table("affiliates").insert({
        "user_id":         uid,
        "code":            code,
        "total_referrals": 0,
        "total_earnings":  0,
        "created_at":      datetime.utcnow().isoformat(),
    }).execute()

    if not result.data:
        raise HTTPException(500, "Failed to create affiliate account")
    return result.data[0]

# ── GET /api/affiliate/stats ──────────────────────────────────
@router.get("/stats")
async def get_stats(current_user: dict = Depends(get_current_user)):
    db  = get_db_client()
    uid = current_user["sub"]

    aff_res = db.table("affiliates").select("*").eq("user_id", uid).execute()
    if not aff_res.data:
        return {
            "code":             None,
            "total_referrals":  0,
            "total_earnings":   0.0,
            "pending_payout":   0.0,
            "paid_out":         0.0,
        }

    aff = aff_res.data[0]

    # Referrals detail
    refs_res = db.table("referrals").select("*").eq("referrer_id", uid).order("created_at", desc=True).execute()
    referrals = refs_res.data or []

    paid_out = sum(float(r.get("commission", 0)) for r in referrals if r.get("paid"))
    pending  = sum(float(r.get("commission", 0)) for r in referrals if not r.get("paid"))

    return {
        "code":            aff["code"],
        "total_referrals": aff.get("total_referrals", 0),
        "total_earnings":  float(aff.get("total_earnings", 0)),
        "pending_payout":  round(pending, 2),
        "paid_out":        round(paid_out, 2),
        "referrals":       referrals[:10],  # last 10
    }

# ── GET /api/affiliate/referrals ──────────────────────────────
@router.get("/referrals")
async def list_referrals(current_user: dict = Depends(get_current_user)):
    db  = get_db_client()
    uid = current_user["sub"]

    res = db.table("referrals").select("*").eq("referrer_id", uid).order("created_at", desc=True).execute()
    return res.data or []

# ── POST /api/affiliate/apply — apply a referral code ─────────
@router.post("/apply")
async def apply_code(body: ApplyCodeBody, current_user: dict = Depends(get_current_user)):
    """Apply a referral code. Called once at registration or from settings."""
    db  = get_db_client()
    uid = current_user["sub"]

    # Check user hasn't already been referred
    already = db.table("referrals").select("id").eq("referred_id", uid).execute()
    if already.data:
        raise HTTPException(400, "Referral code already applied to your account")

    # Find affiliate by code
    code = body.code.strip().upper()
    aff_res = db.table("affiliates").select("*").eq("code", code).execute()
    if not aff_res.data:
        raise HTTPException(404, "Invalid referral code")

    referrer_id = aff_res.data[0]["user_id"]
    if referrer_id == uid:
        raise HTTPException(400, "Cannot use your own referral code")

    # Commission (awarded when referred user upgrades — tracked via plan change)
    ref_id = str(uuid.uuid4())
    db.table("referrals").insert({
        "id":          ref_id,
        "referrer_id": referrer_id,
        "referred_id": uid,
        "commission":  0,      # set when they upgrade
        "paid":        False,
        "created_at":  datetime.utcnow().isoformat(),
    }).execute()

    # Increment referrer count
    old_count = int(aff_res.data[0].get("total_referrals", 0))
    db.table("affiliates").update({"total_referrals": old_count + 1}).eq("user_id", referrer_id).execute()

    return {"message": "Referral code applied successfully", "referrer_id": referrer_id}

# ── POST /api/affiliate/commission — internal: called on upgrade ─
@router.post("/commission/{referred_user_id}")
async def record_commission(referred_user_id: str, current_user: dict = Depends(get_current_user)):
    """
    Called internally when a referred user upgrades their plan.
    Calculates commission and marks the referral as earned.
    """
    db  = get_db_client()

    # Get referred user's plan to compute commission
    user_res = db.table("users").select("plan").eq("id", referred_user_id).execute()
    if not user_res.data:
        raise HTTPException(404, "User not found")

    plan = user_res.data[0].get("plan", "free")
    price = PRO_PRICE if plan == "pro" else ELITE_PRICE if plan == "elite" else 0
    commission = round(price * COMMISSION_RATE, 2)

    if commission == 0:
        return {"message": "No commission for free plan"}

    # Find the referral record
    ref_res = db.table("referrals").select("*").eq("referred_id", referred_user_id).eq("paid", False).execute()
    if not ref_res.data:
        return {"message": "No pending referral found"}

    ref = ref_res.data[0]
    db.table("referrals").update({
        "commission":    commission,
        "paid":          True,
        "paid_at":       datetime.utcnow().isoformat(),
    }).eq("id", ref["id"]).execute()

    # Update affiliate total earnings
    aff_res = db.table("affiliates").select("total_earnings").eq("user_id", ref["referrer_id"]).execute()
    if aff_res.data:
        old_earnings = float(aff_res.data[0].get("total_earnings", 0))
        db.table("affiliates").update({
            "total_earnings": round(old_earnings + commission, 2)
        }).eq("user_id", ref["referrer_id"]).execute()

    return {"message": "Commission recorded", "commission": commission, "referrer_id": ref["referrer_id"]}
