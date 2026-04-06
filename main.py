# ============================================================
#  APEX INVEST — FastAPI Backend
#  Stack: Python + FastAPI + Supabase (PostgreSQL) + Stripe
#  Deploy: Railway
# ============================================================

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os

from routers import (
    auth, portfolio, alerts, stripe_router, ai_proxy,
    leaderboard, holdings, journal, affiliate, user_settings,
    broker_accounts, broker_trade, real_estate_listings, investment_products,
)
from routers import prices_proxy
from database import get_db_client

# ── App ──────────────────────────────────────────────────────
app = FastAPI(
    title="APEX INVEST API",
    description="Backend for APEX INVEST trading platform",
    version="2.0.0",
)

# ── CORS ─────────────────────────────────────────────────────
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global 429 handler (rate limit) ──────────────────────────
@app.exception_handler(429)
async def rate_limit_handler(request: Request, exc):
    return JSONResponse(
        status_code=429,
        content={"detail": str(exc.detail)},
        headers={"Retry-After": "60"},
    )

# ── Routers ───────────────────────────────────────────────────
app.include_router(auth.router,              prefix="/api/auth",        tags=["Auth"])
app.include_router(portfolio.router,         prefix="/api/portfolio",   tags=["Portfolio"])
app.include_router(alerts.router,            prefix="/api/alerts",      tags=["Alerts"])
app.include_router(stripe_router.router,     prefix="/api/stripe",      tags=["Stripe"])
app.include_router(ai_proxy.router,          prefix="/api/ai",          tags=["AI"])
app.include_router(leaderboard.router,       prefix="/api/leaderboard", tags=["Leaderboard"])
app.include_router(holdings.router,          prefix="/api/holdings",    tags=["Holdings"])
app.include_router(journal.router,           prefix="/api/journal",     tags=["Journal"])
app.include_router(affiliate.router,         prefix="/api/affiliate",   tags=["Affiliate"])
app.include_router(user_settings.router,     prefix="/api/settings",    tags=["Settings"])
app.include_router(prices_proxy.router,          prefix="/api/prices",          tags=["Prices"])
app.include_router(broker_accounts.router,       prefix="/api/brokers",         tags=["Brokers"])
app.include_router(broker_trade.router,          prefix="/api/broker-trade",    tags=["Broker Trade"])
app.include_router(real_estate_listings.router,  prefix="/api/real-estate",     tags=["Real Estate"])
app.include_router(investment_products.router,   prefix="/api/investments",     tags=["Investments"])

# ── Health check ──────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "service": "APEX INVEST API", "version": "2.0.0"}

@app.get("/")
async def root():
    return {"message": "APEX INVEST API v2.0 is running"}
