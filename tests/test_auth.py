# tests/test_auth.py — Auth router tests
from unittest.mock import patch
from tests.conftest import make_db, USER_ID, USER_EMAIL, USER_NAME, USER_PW
from auth_utils import hash_password

REGISTER_URL = "/api/auth/register"
LOGIN_URL    = "/api/auth/login"
ME_URL       = "/api/auth/me"
LOGOUT_URL   = "/api/auth/logout"

NEW_USER = {"name": USER_NAME, "email": USER_EMAIL, "password": USER_PW}


# ── Register ───────────────────────────────────────────────────

def test_register_success(client):
    inserted = {
        "id": USER_ID, "name": USER_NAME,
        "email": USER_EMAIL, "plan": "free",
    }
    db = make_db(
        [],          # email unique check → not found
        inserted,    # insert → new user
    )
    with patch("routers.auth.get_db_client", return_value=db):
        r = client.post(REGISTER_URL, json=NEW_USER)

    assert r.status_code == 200
    body = r.json()
    assert "token" in body
    assert body["user"]["email"] == USER_EMAIL


def test_register_duplicate_email(client):
    db = make_db(
        [{"id": USER_ID}],   # email unique check → found → conflict
    )
    with patch("routers.auth.get_db_client", return_value=db):
        r = client.post(REGISTER_URL, json=NEW_USER)

    assert r.status_code == 400
    assert "already registered" in r.json()["detail"].lower()


def test_register_short_password(client):
    db = make_db()
    with patch("routers.auth.get_db_client", return_value=db):
        r = client.post(REGISTER_URL, json={**NEW_USER, "password": "123"})

    assert r.status_code == 400


# ── Login ──────────────────────────────────────────────────────

def test_login_success(client, user_row):
    db = make_db(user_row)   # select user by email
    with patch("routers.auth.get_db_client", return_value=db):
        r = client.post(LOGIN_URL, json={"email": USER_EMAIL, "password": USER_PW})

    assert r.status_code == 200
    body = r.json()
    assert "token" in body
    assert body["user"]["id"] == USER_ID


def test_login_wrong_password(client, user_row):
    db = make_db(user_row)
    with patch("routers.auth.get_db_client", return_value=db):
        r = client.post(LOGIN_URL, json={"email": USER_EMAIL, "password": "wrongpass"})

    assert r.status_code == 401


def test_login_unknown_email(client):
    db = make_db([])   # no user found
    with patch("routers.auth.get_db_client", return_value=db):
        r = client.post(LOGIN_URL, json={"email": "nobody@example.com", "password": USER_PW})

    assert r.status_code == 401


# ── Me ─────────────────────────────────────────────────────────

def test_me_returns_user(client, auth, user_row):
    db = make_db(user_row)
    with patch("routers.auth.get_db_client", return_value=db):
        r = client.get(ME_URL, headers=auth)

    assert r.status_code == 200
    assert r.json()["email"] == USER_EMAIL


def test_me_requires_auth(client):
    r = client.get(ME_URL)
    assert r.status_code == 401


# ── Logout ─────────────────────────────────────────────────────

def test_logout(client, auth):
    r = client.post(LOGOUT_URL, headers=auth)
    assert r.status_code == 200
    assert "message" in r.json()
