# tests/test_settings.py — User Settings router tests
from unittest.mock import patch
from tests.conftest import make_db, USER_ID, USER_PW
from auth_utils import hash_password

SETTINGS_URL = "/api/settings"


# ── GET /settings ─────────────────────────────────────────────

def test_get_settings(client, auth, user_row):
    db = make_db(user_row)
    with patch("routers.user_settings.get_db_client", return_value=db):
        r = client.get(SETTINGS_URL, headers=auth)

    assert r.status_code == 200
    body = r.json()
    assert body["email"] == user_row["email"]
    assert body["theme"] == "gold"
    assert body["lang"]  == "ar"


def test_get_settings_requires_auth(client):
    r = client.get(SETTINGS_URL)
    assert r.status_code == 401


# ── PUT /settings/profile ─────────────────────────────────────

def test_update_profile_success(client, auth, user_row):
    updated = {**user_row, "name": "New Name", "bio": "Trader"}
    db = make_db(
        None,    # update
        updated, # re-fetch
    )
    with patch("routers.user_settings.get_db_client", return_value=db):
        r = client.put(
            f"{SETTINGS_URL}/profile",
            json={"name": "New Name", "bio": "Trader"},
            headers=auth,
        )

    assert r.status_code == 200


def test_update_profile_short_name(client, auth):
    db = make_db()
    with patch("routers.user_settings.get_db_client", return_value=db):
        r = client.put(
            f"{SETTINGS_URL}/profile",
            json={"name": "A"},
            headers=auth,
        )

    assert r.status_code == 400


def test_update_profile_no_fields(client, auth):
    db = make_db()
    with patch("routers.user_settings.get_db_client", return_value=db):
        r = client.put(f"{SETTINGS_URL}/profile", json={}, headers=auth)

    assert r.status_code == 400


# ── PUT /settings/preferences ─────────────────────────────────

def test_update_preferences_valid(client, auth):
    db = make_db(None)
    with patch("routers.user_settings.get_db_client", return_value=db):
        r = client.put(
            f"{SETTINGS_URL}/preferences",
            json={"theme": "blue", "lang": "en"},
            headers=auth,
        )

    assert r.status_code == 200


def test_update_preferences_invalid_theme(client, auth):
    db = make_db()
    with patch("routers.user_settings.get_db_client", return_value=db):
        r = client.put(
            f"{SETTINGS_URL}/preferences",
            json={"theme": "rainbow"},
            headers=auth,
        )

    assert r.status_code == 400


# ── PUT /settings/notifications ───────────────────────────────

def test_update_notifications(client, auth):
    db = make_db(None)
    with patch("routers.user_settings.get_db_client", return_value=db):
        r = client.put(
            f"{SETTINGS_URL}/notifications",
            json={"notif_email": False, "notif_push": True},
            headers=auth,
        )

    assert r.status_code == 200


# ── PUT /settings/password ────────────────────────────────────

def test_change_password_success(client, auth, user_row):
    db = make_db(
        user_row,  # fetch password_hash
        None,      # update
    )
    with patch("routers.user_settings.get_db_client", return_value=db):
        r = client.put(
            f"{SETTINGS_URL}/password",
            json={"current_password": USER_PW, "new_password": "newpass123"},
            headers=auth,
        )

    assert r.status_code == 200


def test_change_password_wrong_current(client, auth, user_row):
    db = make_db(user_row)
    with patch("routers.user_settings.get_db_client", return_value=db):
        r = client.put(
            f"{SETTINGS_URL}/password",
            json={"current_password": "wrongpass", "new_password": "newpass123"},
            headers=auth,
        )

    assert r.status_code == 401


def test_change_password_too_short(client, auth):
    db = make_db()
    with patch("routers.user_settings.get_db_client", return_value=db):
        r = client.put(
            f"{SETTINGS_URL}/password",
            json={"current_password": USER_PW, "new_password": "abc"},
            headers=auth,
        )

    assert r.status_code == 400


def test_change_password_same_as_current(client, auth):
    db = make_db()
    with patch("routers.user_settings.get_db_client", return_value=db):
        r = client.put(
            f"{SETTINGS_URL}/password",
            json={"current_password": USER_PW, "new_password": USER_PW},
            headers=auth,
        )

    assert r.status_code == 400
