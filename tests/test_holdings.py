# tests/test_holdings.py — Holdings router tests
from unittest.mock import patch
from tests.conftest import make_db, USER_ID

HOLDINGS_URL = "/api/holdings"

HOLDING_BODY = {
    "asset":      "BTC",
    "asset_type": "crypto",
    "quantity":   0.5,
    "avg_price":  45000.0,
    "notes":      "DCA buy",
}

HOLDING_ROW = {
    "id":         "hold-uuid-001",
    "user_id":    USER_ID,
    "asset":      "BTC",
    "asset_type": "crypto",
    "quantity":   0.5,
    "avg_price":  45000.0,
    "notes":      "DCA buy",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z",
}


# ── GET /holdings ──────────────────────────────────────────────

def test_get_holdings_empty(client, auth):
    db = make_db([])
    with patch("routers.holdings.get_db_client", return_value=db):
        r = client.get(HOLDINGS_URL, headers=auth)

    assert r.status_code == 200
    assert r.json() == []


def test_get_holdings_returns_list(client, auth):
    db = make_db([HOLDING_ROW])
    with patch("routers.holdings.get_db_client", return_value=db):
        r = client.get(HOLDINGS_URL, headers=auth)

    assert r.status_code == 200
    assert r.json()[0]["asset"] == "BTC"


# ── POST /holdings ─────────────────────────────────────────────

def test_add_holding_new(client, auth):
    db = make_db(
        [],           # existing holding check → not found
        HOLDING_ROW,  # insert → new holding
    )
    with patch("routers.holdings.get_db_client", return_value=db):
        r = client.post(HOLDINGS_URL, json=HOLDING_BODY, headers=auth)

    assert r.status_code == 200
    assert r.json()["asset"] == "BTC"


def test_add_holding_merges_existing(client, auth):
    """Adding same asset twice should DCA-merge, not duplicate."""
    existing = {**HOLDING_ROW, "quantity": 0.5, "avg_price": 40000.0}
    merged   = {**HOLDING_ROW, "quantity": 1.0, "avg_price": 42500.0}

    db = make_db(
        existing,   # existing check → found
        None,       # update
        merged,     # re-fetch updated row
    )
    with patch("routers.holdings.get_db_client", return_value=db):
        r = client.post(HOLDINGS_URL, json=HOLDING_BODY, headers=auth)

    assert r.status_code == 200


def test_add_holding_invalid_type(client, auth):
    db = make_db()
    with patch("routers.holdings.get_db_client", return_value=db):
        r = client.post(HOLDINGS_URL, json={**HOLDING_BODY, "asset_type": "nft"}, headers=auth)

    assert r.status_code == 400


def test_add_holding_zero_quantity(client, auth):
    db = make_db()
    with patch("routers.holdings.get_db_client", return_value=db):
        r = client.post(HOLDINGS_URL, json={**HOLDING_BODY, "quantity": 0}, headers=auth)

    assert r.status_code == 400


# ── PUT /holdings/{id} ────────────────────────────────────────

def test_update_holding(client, auth):
    updated = {**HOLDING_ROW, "quantity": 1.0}
    db = make_db(
        HOLDING_ROW,  # ownership check
        None,         # update
        updated,      # re-fetch
    )
    with patch("routers.holdings.get_db_client", return_value=db):
        r = client.put(
            f"{HOLDINGS_URL}/hold-uuid-001",
            json={"quantity": 1.0},
            headers=auth,
        )

    assert r.status_code == 200


# ── DELETE /holdings/{id} ─────────────────────────────────────

def test_delete_holding_success(client, auth):
    db = make_db(
        HOLDING_ROW,  # ownership check
        None,         # delete
    )
    with patch("routers.holdings.get_db_client", return_value=db):
        r = client.delete(f"{HOLDINGS_URL}/hold-uuid-001", headers=auth)

    assert r.status_code == 200
    assert r.json()["id"] == "hold-uuid-001"


def test_delete_holding_not_found(client, auth):
    db = make_db([])
    with patch("routers.holdings.get_db_client", return_value=db):
        r = client.delete(f"{HOLDINGS_URL}/nonexistent", headers=auth)

    assert r.status_code == 404


# ── GET /holdings/summary ─────────────────────────────────────

def test_holdings_summary(client, auth):
    rows = [
        {"asset_type": "crypto", "quantity": 0.5, "avg_price": 45000.0},
        {"asset_type": "stock",  "quantity": 10,  "avg_price": 150.0},
    ]
    db = make_db(rows)
    with patch("routers.holdings.get_db_client", return_value=db):
        r = client.get(f"{HOLDINGS_URL}/summary", headers=auth)

    assert r.status_code == 200
    body = r.json()
    assert "by_type" in body
    assert body["by_type"]["crypto"] == 22500.0
    assert body["by_type"]["stock"]  == 1500.0
    assert body["total_cost"] == 24000.0
