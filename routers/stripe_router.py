# routers/stripe_router.py — Stripe Subscriptions
import os, stripe
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from database import get_db_client
from auth_utils import get_current_user

router = APIRouter()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")
WEBHOOK_SECRET  = os.getenv("STRIPE_WEBHOOK_SECRET", "")

# ── Plan → Stripe Price ID mapping ────────────────────────────
PLAN_PRICE_IDS = {
    "pro":      os.getenv("STRIPE_PRICE_PRO",      "price_pro_placeholder"),
    "elite":    os.getenv("STRIPE_PRICE_ELITE",    "price_elite_placeholder"),
}

PLAN_NAMES = {
    "pro":   "Pro",
    "elite": "Elite",
}

class CheckoutBody(BaseModel):
    plan:         str   # pro | elite
    success_url:  str
    cancel_url:   str

# ── POST /api/stripe/checkout ─────────────────────────────────
@router.post("/checkout")
async def create_checkout(body: CheckoutBody, current_user: dict = Depends(get_current_user)):
    if body.plan not in PLAN_PRICE_IDS:
        raise HTTPException(400, f"Unknown plan: {body.plan}")
    if not stripe.api_key:
        raise HTTPException(500, "Stripe not configured")

    db  = get_db_client()
    uid = current_user["sub"]

    # Get user email
    user_res = db.table("users").select("email,name").eq("id", uid).execute()
    if not user_res.data:
        raise HTTPException(404, "User not found")
    user = user_res.data[0]

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="subscription",
            line_items=[{"price": PLAN_PRICE_IDS[body.plan], "quantity": 1}],
            customer_email=user["email"],
            success_url=body.success_url + "?session_id={CHECKOUT_SESSION_ID}",
            cancel_url=body.cancel_url,
            metadata={"user_id": uid, "plan": body.plan},
        )
    except stripe.error.StripeError as e:
        raise HTTPException(400, str(e))

    return {"checkout_url": session.url, "session_id": session.id}

# ── POST /api/stripe/portal ───────────────────────────────────
@router.post("/portal")
async def customer_portal(current_user: dict = Depends(get_current_user)):
    db  = get_db_client()
    uid = current_user["sub"]

    user_res = db.table("users").select("stripe_customer_id").eq("id", uid).execute()
    if not user_res.data or not user_res.data[0].get("stripe_customer_id"):
        raise HTTPException(400, "No Stripe customer found")

    customer_id = user_res.data[0]["stripe_customer_id"]
    session = stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=os.getenv("FRONTEND_URL", "https://apex-invest.vercel.app"),
    )
    return {"portal_url": session.url}

# ── POST /api/stripe/webhook ──────────────────────────────────
@router.post("/webhook")
async def stripe_webhook(request: Request):
    payload    = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, WEBHOOK_SECRET)
    except (ValueError, stripe.error.SignatureVerificationError) as e:
        raise HTTPException(400, f"Webhook error: {str(e)}")

    db = get_db_client()

    # ── Handle events ──────────────────────────────────────────
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        uid     = session["metadata"].get("user_id")
        plan    = session["metadata"].get("plan", "pro")
        cus_id  = session.get("customer")

        if uid:
            db.table("users").update({
                "plan":               plan,
                "stripe_customer_id": cus_id,
                "subscription_id":    session.get("subscription"),
            }).eq("id", uid).execute()

    elif event["type"] == "customer.subscription.deleted":
        sub    = event["data"]["object"]
        cus_id = sub.get("customer")
        if cus_id:
            db.table("users").update({"plan": "free", "subscription_id": None}) \
              .eq("stripe_customer_id", cus_id).execute()

    elif event["type"] == "invoice.payment_failed":
        sub    = event["data"]["object"]
        cus_id = sub.get("customer")
        if cus_id:
            # Keep plan active — Stripe will retry
            pass

    return {"received": True}

# ── GET /api/stripe/status ────────────────────────────────────
@router.get("/status")
async def subscription_status(current_user: dict = Depends(get_current_user)):
    db  = get_db_client()
    uid = current_user["sub"]
    res = db.table("users").select("plan,subscription_id,stripe_customer_id").eq("id", uid).execute()
    if not res.data:
        raise HTTPException(404, "User not found")
    return res.data[0]
