# routers/ai_proxy.py — Claude API Proxy with per-user rate limiting
import os, time, httpx
from collections import defaultdict
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional, List
from auth_utils import get_current_user, get_optional_user

router = APIRouter()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
ANTHROPIC_URL     = "https://api.anthropic.com/v1/messages"
AI_MODEL          = os.getenv("AI_MODEL", "claude-haiku-4-5-20251001")

# ── In-memory rate limiter ────────────────────────────────────
# Limit: 20 requests/hour per user_id (or IP for unauthenticated)
_rate_store: dict[str, list[float]] = defaultdict(list)
AI_RATE_LIMIT   = int(os.getenv("AI_RATE_LIMIT", "20"))     # max calls
AI_RATE_WINDOW  = int(os.getenv("AI_RATE_WINDOW", "3600"))  # window in seconds

def _check_rate(key: str):
    now = time.time()
    window_start = now - AI_RATE_WINDOW
    calls = _rate_store[key]
    # Evict old timestamps
    calls[:] = [t for t in calls if t > window_start]
    if len(calls) >= AI_RATE_LIMIT:
        wait = int(calls[0] - window_start)
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Try again in {wait}s. ({AI_RATE_LIMIT} req/hour)"
        )
    calls.append(now)

def _rate_key(request: Request, user=None) -> str:
    if user and user.get("sub"):
        return f"user:{user['sub']}"
    # Fallback: IP address
    forwarded = request.headers.get("X-Forwarded-For")
    ip = forwarded.split(",")[0].strip() if forwarded else request.client.host
    return f"ip:{ip}"

# ── Schemas ───────────────────────────────────────────────────
class Message(BaseModel):
    role:    str
    content: str

class AIBody(BaseModel):
    messages:   List[Message]
    system:     Optional[str] = None
    max_tokens: Optional[int] = 1000

class AnalyzeBody(BaseModel):
    prompt:     str
    max_tokens: Optional[int] = 600
    system:     Optional[str] = None

# ── Shared Anthropic caller ───────────────────────────────────
async def _call_anthropic(messages: list, system: str | None, max_tokens: int) -> str:
    if not ANTHROPIC_API_KEY:
        raise HTTPException(500, "AI service not configured")

    payload = {
        "model":      AI_MODEL,
        "max_tokens": min(max_tokens, 4000),
        "messages":   messages,
    }
    if system:
        payload["system"] = system

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            ANTHROPIC_URL,
            headers={
                "x-api-key":         ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type":      "application/json",
            },
            json=payload,
        )

    if resp.status_code != 200:
        raise HTTPException(resp.status_code, f"AI error: {resp.text[:200]}")

    data = resp.json()
    return data.get("content", [{}])[0].get("text", "")

# ── POST /api/ai/analyze ─────────────────────────────────────
# Optional auth — open to unauthenticated users but rate-limited by IP
@router.post("/analyze")
async def ai_analyze(body: AnalyzeBody, request: Request, user=Depends(get_optional_user)):
    key = _rate_key(request, user)
    _check_rate(key)

    system = body.system or (
        "You are APEX INVEST's expert AI analyst. "
        "Be concise, direct, and actionable. "
        "Never use asterisks or markdown formatting."
    )
    text = await _call_anthropic(
        messages=[{"role": "user", "content": body.prompt}],
        system=system,
        max_tokens=min(body.max_tokens or 600, 2000),
    )
    return {"text": text}

# ── POST /api/ai/chat ─────────────────────────────────────────
@router.post("/chat")
async def ai_chat(body: AIBody, request: Request, current_user: dict = Depends(get_current_user)):
    key = _rate_key(request, current_user)
    _check_rate(key)

    text = await _call_anthropic(
        messages=[{"role": m.role, "content": m.content} for m in body.messages],
        system=body.system,
        max_tokens=min(body.max_tokens or 1000, 4000),
    )
    return {"text": text}

# ── POST /api/ai/portfolio ────────────────────────────────────
@router.post("/portfolio")
async def ai_portfolio_analysis(body: dict, request: Request, current_user: dict = Depends(get_current_user)):
    key = _rate_key(request, current_user)
    _check_rate(key)

    portfolio_data = body.get("portfolio_data", {})
    lang  = body.get("lang", "en")
    is_ar = lang == "ar"

    prompt = (
        f"أنت مستشار مالي خبير. حلّل هذه المحفظة:\n{portfolio_data}\n\n"
        "قدّم:\n1. تقييم الأداء\n2. نقاط القوة والضعف\n3. توصيات التحسين\nكن مختصراً."
    ) if is_ar else (
        f"You are an expert financial advisor. Analyze this portfolio:\n{portfolio_data}\n\n"
        "Provide:\n1. Performance evaluation\n2. Strengths & weaknesses\n3. Improvement recommendations\nBe concise."
    )

    text = await _call_anthropic(
        messages=[{"role": "user", "content": prompt}],
        system=None,
        max_tokens=700,
    )
    return {"text": text}

# ── GET /api/ai/rate-status ───────────────────────────────────
@router.get("/rate-status")
async def rate_status(request: Request, user=Depends(get_optional_user)):
    key = _rate_key(request, user)
    now = time.time()
    calls = [t for t in _rate_store.get(key, []) if t > now - AI_RATE_WINDOW]
    return {
        "used": len(calls),
        "limit": AI_RATE_LIMIT,
        "remaining": max(0, AI_RATE_LIMIT - len(calls)),
        "window_seconds": AI_RATE_WINDOW,
    }
