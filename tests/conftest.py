# tests/conftest.py — Shared fixtures for all backend tests
import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from main import app
from auth_utils import create_token, hash_password

# ── Test constants ─────────────────────────────────────────────
USER_ID    = "00000000-0000-0000-0000-000000000001"
USER_EMAIL = "test@apex.com"
USER_NAME  = "Test User"
USER_PW    = "password123"

# ── Fixtures ───────────────────────────────────────────────────
@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

@pytest.fixture
def token():
    return create_token(USER_ID, USER_EMAIL)

@pytest.fixture
def auth(token):
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def user_row():
    """Simulates a users table row."""
    return {
        "id":            USER_ID,
        "name":          USER_NAME,
        "email":         USER_EMAIL,
        "password_hash": hash_password(USER_PW),
        "plan":          "free",
        "balance":       10000.0,
        "bio":           None,
        "avatar_url":    None,
        "notif_email":   True,
        "notif_push":    True,
        "notif_price":   True,
        "notif_news":    True,
        "notif_leaderboard": False,
        "theme":         "gold",
        "lang":          "ar",
        "created_at":    "2025-01-01T00:00:00Z",
    }


def make_db(*results):
    """
    Returns a mock Supabase client where each successive call to
    .execute() returns the next result in `results`.

    Each result can be:
      - list  → wrapped as data=[...]
      - dict  → wrapped as data=[{...}]
      - None  → data=[], count=0
      - a MagicMock response (used as-is)
    """
    call_idx = [0]

    def _response(r):
        if isinstance(r, MagicMock):
            return r
        resp = MagicMock()
        resp.count = 0
        if r is None:
            resp.data = []
        elif isinstance(r, dict):
            resp.data = [r]
        elif isinstance(r, list):
            resp.data = r
            resp.count = len(r)
        else:
            resp.data = []
        return resp

    def _execute():
        idx = call_idx[0]
        call_idx[0] += 1
        if idx < len(results):
            return _response(results[idx])
        return _response(None)

    # Build a fluent chain mock
    chain = MagicMock()
    for method in ("select", "insert", "update", "delete",
                   "eq", "neq", "order", "limit", "range",
                   "filter", "ilike"):
        getattr(chain, method).return_value = chain
    chain.execute = _execute

    db = MagicMock()
    db.table.return_value = chain
    return db
