# tests/test_alerts.py — Price Alerts router tests
from unittest.mock import patch
from tests.conftest import make_db, USER_ID

ALERTS_URL = "/api/alerts"

ALERT_BODY = {"pair": "EUR/USD", "price": 1.09500, "direction": "above"}

ALERT_ROW = {
    "id":         "alert-uuid-001",
    "user_id":    USER_ID,
    "pair":       "EUR/USD",
    "price":      1.09500,
    "direction":  "above",
    "triggered":  False,
    "created_at": "2025-01-01T00:00:00Z",
}


# ── GET /alerts ────────────────────────────────────────────────

def test_get_alerts_empty(client, auth):
    db = make_db([])
    with patch("routers.alerts.get_db_client", return_value=db):
        r = client.get(ALERTS_URL, headers=auth)

    assert r.status_code == 200
    assert r.json() == []


def test_get_alerts_returns_list(client, auth):
    db = make_db([ALERT_ROW])
    with patch("routers.alerts.get_db_client", return_value=db):
        r = client.get(ALERTS_URL, headers=auth)

    assert r.status_code == 200
    assert len(r.json()) == 1
    assert r.json()[0]["pair"] == "EUR/USD"


# ── POST /alerts ───────────────────────────────────────────────

def test_create_alert_success(client, auth):
    db = make_db(
        None,        # count check → count=0 (under limit)
        ALERT_ROW,   # insert → new alert
    )
    with patch("routers.alerts.get_db_client", return_value=db):
        r = client.post(ALERTS_URL, json=ALERT_BODY, headers=auth)

    assert r.status_code == 200
    assert r.json()["pair"] == "EUR/USD"


def test_create_alert_invalid_direction(client, auth):
    db = make_db()
    with patch("routers.alerts.get_db_client", return_value=db):
        r = client.post(ALERTS_URL, json={**ALERT_BODY, "direction": "sideways"}, headers=auth)

    assert r.status_code == 400


def test_create_alert_requires_auth(client):
    r = client.post(ALERTS_URL, json=ALERT_BODY)
    assert r.status_code == 401


# ── DELETE /alerts/{id} ────────────────────────────────────────

def test_delete_alert_success(client, auth):
    db = make_db(
        ALERT_ROW,  # ownership check → found
        None,       # delete
    )
    with patch("routers.alerts.get_db_client", return_value=db):
        r = client.delete(f"{ALERTS_URL}/alert-uuid-001", headers=auth)

    assert r.status_code == 200
    assert "deleted" in r.json()["message"].lower()


def test_delete_alert_not_found(client, auth):
    db = make_db([])   # ownership check → not found
    with patch("routers.alerts.get_db_client", return_value=db):
        r = client.delete(f"{ALERTS_URL}/nonexistent", headers=auth)

    assert r.status_code == 404


# ── PATCH /alerts/{id}/trigger ────────────────────────────────

def test_trigger_alert(client, auth):
    db = make_db(
        ALERT_ROW,  # ownership check
        None,       # update
    )
    with patch("routers.alerts.get_db_client", return_value=db):
        r = client.patch(
            f"{ALERTS_URL}/alert-uuid-001/trigger",
            json={"fired_price": 1.09510},
            headers=auth,
        )

    assert r.status_code == 200
    assert r.json()["fired_price"] == 1.09510
