# tests/test_portfolio.py — Portfolio & Trades router tests
from unittest.mock import patch
from tests.conftest import make_db, USER_ID

PORTFOLIO_URL = "/api/portfolio"
TRADE_URL     = "/api/portfolio/trade"
RESET_URL     = "/api/portfolio/reset"
STATS_URL     = "/api/portfolio/stats"

OPEN_TRADE = {
    "pair":        "EUR/USD",
    "action":      "BUY",
    "lots":        0.1,
    "entry_price": 1.09500,
    "sl":          1.09000,
    "tp":          1.10000,
}


# ── GET /portfolio ─────────────────────────────────────────────

def test_get_portfolio(client, auth):
    user_row  = {"balance": 10000.0, "plan": "free"}
    open_rows = []
    hist_rows = []

    db = make_db(user_row, open_rows, hist_rows)
    with patch("routers.portfolio.get_db_client", return_value=db):
        r = client.get(PORTFOLIO_URL, headers=auth)

    assert r.status_code == 200
    body = r.json()
    assert body["balance"] == 10000.0
    assert body["open"] == []
    assert "stats" in body


def test_get_portfolio_requires_auth(client):
    r = client.get(PORTFOLIO_URL)
    assert r.status_code == 401


# ── POST /portfolio/trade ──────────────────────────────────────

def test_open_trade_success(client, auth):
    inserted = {
        "id": "trade-uuid-001", "user_id": USER_ID,
        "pair": "EUR/USD", "action": "BUY",
        "lots": 0.1, "entry_price": 1.09500,
        "status": "open",
    }
    db = make_db(inserted)
    with patch("routers.portfolio.get_db_client", return_value=db):
        r = client.post(TRADE_URL, json=OPEN_TRADE, headers=auth)

    assert r.status_code == 200
    assert r.json()["pair"] == "EUR/USD"


def test_open_trade_invalid_action(client, auth):
    db = make_db()
    with patch("routers.portfolio.get_db_client", return_value=db):
        r = client.post(TRADE_URL, json={**OPEN_TRADE, "action": "HOLD"}, headers=auth)

    assert r.status_code == 400


def test_open_trade_zero_lots(client, auth):
    db = make_db()
    with patch("routers.portfolio.get_db_client", return_value=db):
        r = client.post(TRADE_URL, json={**OPEN_TRADE, "lots": 0}, headers=auth)

    assert r.status_code == 400


# ── POST /portfolio/trade/{id}/close ──────────────────────────

def test_close_trade_success(client, auth):
    trade_row = {
        "id": "trade-001", "user_id": USER_ID,
        "pair": "EUR/USD", "action": "BUY",
        "lots": 0.1, "entry_price": 1.09500,
        "status": "open", "sl": None, "tp": None,
    }
    user_balance = {"balance": 10000.0}

    db = make_db(
        trade_row,      # fetch trade
        None,           # update trade
        user_balance,   # fetch balance
        None,           # update balance
    )
    with patch("routers.portfolio.get_db_client", return_value=db):
        r = client.post(
            f"/api/portfolio/trade/trade-001/close",
            json={"exit_price": 1.09700},
            headers=auth,
        )

    assert r.status_code == 200
    body = r.json()
    assert "pl" in body
    assert body["exit_price"] == 1.097


def test_close_trade_not_found(client, auth):
    db = make_db([])   # no trade found
    with patch("routers.portfolio.get_db_client", return_value=db):
        r = client.post(
            "/api/portfolio/trade/nonexistent/close",
            json={"exit_price": 1.10},
            headers=auth,
        )
    assert r.status_code == 404


# ── POST /portfolio/reset ──────────────────────────────────────

def test_reset_portfolio(client, auth):
    db = make_db(None, None)   # update trades + update balance
    with patch("routers.portfolio.get_db_client", return_value=db):
        r = client.post(RESET_URL, headers=auth)

    assert r.status_code == 200
    assert r.json()["balance"] == 10000.0


# ── GET /portfolio/stats ───────────────────────────────────────

def test_get_stats_empty(client, auth):
    db = make_db([])   # no history
    with patch("routers.portfolio.get_db_client", return_value=db):
        r = client.get(STATS_URL, headers=auth)

    assert r.status_code == 200
    body = r.json()
    assert body["total_trades"] == 0
    assert body["win_rate"] == 0
