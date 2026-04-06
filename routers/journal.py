# routers/journal.py — Trading Journal (entries with mood, tags, trade link)
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional, List
import uuid
from datetime import datetime
from database import get_db_client
from auth_utils import get_current_user

router = APIRouter()

VALID_MOODS = {"confident", "neutral", "anxious", "greedy", "fearful"}

# ── Schemas ───────────────────────────────────────────────────
class JournalBody(BaseModel):
    title:    str
    body:     Optional[str]  = None
    mood:     Optional[str]  = None   # confident | neutral | anxious | greedy | fearful
    tags:     Optional[List[str]] = None
    trade_id: Optional[str]  = None   # link to a specific trade

class JournalUpdate(BaseModel):
    title:    Optional[str]       = None
    body:     Optional[str]       = None
    mood:     Optional[str]       = None
    tags:     Optional[List[str]] = None

# ── GET /api/journal ──────────────────────────────────────────
@router.get("")
async def list_entries(
    current_user: dict = Depends(get_current_user),
    limit:  int = Query(20, ge=1, le=100),
    offset: int = Query(0,  ge=0),
    mood:   Optional[str] = Query(None),
):
    db  = get_db_client()
    uid = current_user["sub"]

    q = db.table("journal").select("*").eq("user_id", uid)
    if mood and mood in VALID_MOODS:
        q = q.eq("mood", mood)

    res = q.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    return res.data or []

# ── GET /api/journal/{id} ─────────────────────────────────────
@router.get("/{entry_id}")
async def get_entry(entry_id: str, current_user: dict = Depends(get_current_user)):
    db  = get_db_client()
    uid = current_user["sub"]
    res = db.table("journal").select("*").eq("id", entry_id).eq("user_id", uid).execute()
    if not res.data:
        raise HTTPException(404, "Journal entry not found")
    return res.data[0]

# ── POST /api/journal ─────────────────────────────────────────
@router.post("")
async def create_entry(body: JournalBody, current_user: dict = Depends(get_current_user)):
    db  = get_db_client()
    uid = current_user["sub"]

    if not body.title.strip():
        raise HTTPException(400, "title is required")
    if body.mood and body.mood not in VALID_MOODS:
        raise HTTPException(400, f"mood must be one of: {', '.join(VALID_MOODS)}")

    # Verify trade belongs to user if provided
    if body.trade_id:
        trade_res = db.table("trades").select("id").eq("id", body.trade_id).eq("user_id", uid).execute()
        if not trade_res.data:
            raise HTTPException(404, "Trade not found")

    entry_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    result = db.table("journal").insert({
        "id":         entry_id,
        "user_id":    uid,
        "title":      body.title.strip(),
        "body":       body.body,
        "mood":       body.mood,
        "tags":       body.tags or [],
        "trade_id":   body.trade_id,
        "created_at": now,
        "updated_at": now,
    }).execute()

    if not result.data:
        raise HTTPException(500, "Failed to create journal entry")
    return result.data[0]

# ── PUT /api/journal/{id} ─────────────────────────────────────
@router.put("/{entry_id}")
async def update_entry(entry_id: str, body: JournalUpdate, current_user: dict = Depends(get_current_user)):
    db  = get_db_client()
    uid = current_user["sub"]

    res = db.table("journal").select("id").eq("id", entry_id).eq("user_id", uid).execute()
    if not res.data:
        raise HTTPException(404, "Journal entry not found")

    if body.mood and body.mood not in VALID_MOODS:
        raise HTTPException(400, f"mood must be one of: {', '.join(VALID_MOODS)}")

    patch = {"updated_at": datetime.utcnow().isoformat()}
    if body.title is not None:
        if not body.title.strip():
            raise HTTPException(400, "title cannot be empty")
        patch["title"] = body.title.strip()
    if body.body  is not None: patch["body"] = body.body
    if body.mood  is not None: patch["mood"] = body.mood
    if body.tags  is not None: patch["tags"] = body.tags

    db.table("journal").update(patch).eq("id", entry_id).execute()
    updated = db.table("journal").select("*").eq("id", entry_id).execute()
    return updated.data[0]

# ── DELETE /api/journal/{id} ──────────────────────────────────
@router.delete("/{entry_id}")
async def delete_entry(entry_id: str, current_user: dict = Depends(get_current_user)):
    db  = get_db_client()
    uid = current_user["sub"]

    res = db.table("journal").select("id").eq("id", entry_id).eq("user_id", uid).execute()
    if not res.data:
        raise HTTPException(404, "Journal entry not found")

    db.table("journal").delete().eq("id", entry_id).execute()
    return {"message": "Journal entry deleted", "id": entry_id}

# ── GET /api/journal/stats/mood ───────────────────────────────
@router.get("/stats/mood")
async def mood_stats(current_user: dict = Depends(get_current_user)):
    """Returns count breakdown by mood — useful for psychology analysis."""
    db  = get_db_client()
    uid = current_user["sub"]
    res = db.table("journal").select("mood").eq("user_id", uid).execute()
    entries = res.data or []

    counts: dict = {m: 0 for m in VALID_MOODS}
    counts["none"] = 0
    for e in entries:
        m = e.get("mood") or "none"
        counts[m] = counts.get(m, 0) + 1

    return {"total": len(entries), "by_mood": counts}
