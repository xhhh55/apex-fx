# routers/broker_accounts.py
# ══════════════════════════════════════════════════════════════
#  Broker Account Management
#  Supported brokers: OANDA | Alpaca | Binance | MetaApi | Demo
#
#  Credentials are AES-256 encrypted before storage in Supabase.
#  The ENCRYPT_KEY env var must be 32 bytes (base64-encoded).
# ══════════════════════════════════════════════════════════════
import os, json, base64, httpx
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from database import get_db_client
from auth_utils import get_current_user
from cryptography.fernet import Fernet

router = APIRouter()

# ── Encryption helpers ────────────────────────────────────────
def _get_fernet() -> Fernet:
    raw = os.getenv("ENCRYPT_KEY", "")
    if not raw:
        # Dev fallback — generate deterministic key from JWT_SECRET (NOT for production)
        import hashlib
        secret = os.getenv("JWT_SECRET", "apex_dev_secret_32bytes_padding!!")
        key = base64.urlsafe_b64encode(hashlib.sha256(secret.encode()).digest())
        return Fernet(key)
    return Fernet(raw.encode() if isinstance(raw, str) else raw)

def _encrypt(value: str) -> str:
    if not value:
        return ""
    return _get_fernet().encrypt(value.encode()).decode()

def _decrypt(token: str) -> str:
    if not token:
        return ""
    try:
        return _get_fernet().decrypt(token.encode()).decode()
    except Exception:
        return ""

# ── Schemas ───────────────────────────────────────────────────
class AddBrokerBody(BaseModel):
    broker:       str           # oanda | alpaca | binance | metaapi | demo
    label:        str           # friendly name
    account_type: str = "live"  # live | practice | paper | demo
    api_key:      Optional[str] = None
    api_secret:   Optional[str] = None
    # Extra fields per broker:
    # OANDA:   account_id (the numeric account ID)
    # MetaApi: server name + login + password (in extra JSON)
    # Binance: passphrase (optional)
    extra:        Optional[dict] = None

class UpdateBrokerBody(BaseModel):
    label:        Optional[str] = None
    is_active:    Optional[bool] = None
    api_key:      Optional[str] = None
    api_secret:   Optional[str] = None
    extra:        Optional[dict] = None

# ── Helper: safe broker info (no keys) ───────────────────────
def _safe(acc: dict) -> dict:
    return {
        "id":               acc["id"],
        "broker":           acc["broker"],
        "label":            acc["label"],
        "account_type":     acc.get("account_type","live"),
        "broker_balance":   acc.get("broker_balance"),
        "broker_currency":  acc.get("broker_currency","USD"),
        "broker_account_id":acc.get("broker_account_id",""),
        "is_active":        acc.get("is_active", True),
        "last_synced_at":   acc.get("last_synced_at"),
        "created_at":       acc.get("created_at"),
        "has_key":          bool(acc.get("api_key_enc")),
        "has_secret":       bool(acc.get("api_secret_enc")),
    }

# ── GET /api/brokers  ─────────────────────────────────────────
@router.get("")
async def list_broker_accounts(current_user: dict = Depends(get_current_user)):
    db  = get_db_client()
    uid = current_user["sub"]
    res = db.table("broker_accounts").select("*").eq("user_id", uid).order("created_at").execute()
    return [_safe(a) for a in (res.data or [])]

# ── POST /api/brokers  ────────────────────────────────────────
@router.post("")
async def add_broker_account(body: AddBrokerBody, current_user: dict = Depends(get_current_user)):
    db  = get_db_client()
    uid = current_user["sub"]

    SUPPORTED = {"oanda","alpaca","binance","metaapi","demo"}
    if body.broker not in SUPPORTED:
        raise HTTPException(400, f"Unsupported broker. Choose from: {', '.join(SUPPORTED)}")

    # Validate required fields per broker
    if body.broker == "oanda" and not body.api_key:
        raise HTTPException(400, "OANDA requires api_key (your API token)")
    if body.broker == "alpaca" and (not body.api_key or not body.api_secret):
        raise HTTPException(400, "Alpaca requires api_key and api_secret")
    if body.broker == "binance" and (not body.api_key or not body.api_secret):
        raise HTTPException(400, "Binance requires api_key and api_secret")
    if body.broker == "metaapi" and not body.api_key:
        raise HTTPException(400, "MetaApi requires api_key (MetaApi token)")

    extra_json = json.dumps(body.extra or {})
    extra_enc  = _encrypt(extra_json)

    # Extract broker_account_id from extra if provided (OANDA account_id)
    broker_account_id = (body.extra or {}).get("account_id", "")

    res = db.table("broker_accounts").insert({
        "user_id":          uid,
        "broker":           body.broker,
        "label":            body.label.strip(),
        "account_type":     body.account_type,
        "api_key_enc":      _encrypt(body.api_key or ""),
        "api_secret_enc":   _encrypt(body.api_secret or ""),
        "extra_enc":        extra_enc,
        "broker_account_id": broker_account_id,
        "is_active":        True,
        "created_at":       datetime.utcnow().isoformat(),
    }).execute()

    if not res.data:
        raise HTTPException(500, "Failed to save broker account")

    return _safe(res.data[0])

# ── POST /api/brokers/{id}/test  ──────────────────────────────
@router.post("/{account_id}/test")
async def test_broker_connection(account_id: str, current_user: dict = Depends(get_current_user)):
    """
    Test the connection to the broker and fetch live balance.
    Updates broker_balance and last_synced_at in DB.
    """
    db  = get_db_client()
    uid = current_user["sub"]

    res = db.table("broker_accounts").select("*").eq("id", account_id).eq("user_id", uid).execute()
    if not res.data:
        raise HTTPException(404, "Broker account not found")

    acc    = res.data[0]
    broker = acc["broker"]
    key    = _decrypt(acc.get("api_key_enc",""))
    secret = _decrypt(acc.get("api_secret_enc",""))
    extra  = json.loads(_decrypt(acc.get("extra_enc","")) or "{}")
    atype  = acc.get("account_type","live")

    result = {"broker": broker, "status": "error", "balance": None, "currency": "USD", "message": ""}

    # ── Demo ──────────────────────────────────────────────────
    if broker == "demo":
        result.update({"status":"ok","balance":10000.0,"currency":"USD","message":"Demo account active"})

    # ── OANDA ─────────────────────────────────────────────────
    elif broker == "oanda":
        base = "https://api-fxpractice.oanda.com" if atype == "practice" else "https://api-fxtrade.oanda.com"
        account_id_oanda = extra.get("account_id") or acc.get("broker_account_id","")
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                r = await client.get(
                    f"{base}/v3/accounts/{account_id_oanda}/summary",
                    headers={"Authorization": f"Bearer {key}"},
                )
            if r.status_code == 200:
                data = r.json().get("account", {})
                bal  = float(data.get("balance", 0))
                cur  = data.get("currency","USD")
                result.update({"status":"ok","balance":bal,"currency":cur,"message":f"OANDA {atype} — connected"})
                # Save actual OANDA account ID
                db.table("broker_accounts").update({"broker_account_id": data.get("id","")}).eq("id",account_id).execute()
            else:
                result["message"] = f"OANDA error {r.status_code}: {r.text[:200]}"
        except Exception as e:
            result["message"] = str(e)

    # ── Alpaca ────────────────────────────────────────────────
    elif broker == "alpaca":
        base = "https://paper-api.alpaca.markets" if atype == "paper" else "https://api.alpaca.markets"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                r = await client.get(
                    f"{base}/v2/account",
                    headers={"APCA-API-KEY-ID": key, "APCA-API-SECRET-KEY": secret},
                )
            if r.status_code == 200:
                data = r.json()
                bal  = float(data.get("cash", 0))
                result.update({"status":"ok","balance":bal,"currency":"USD","message":f"Alpaca {atype} — connected"})
                db.table("broker_accounts").update({"broker_account_id": data.get("account_number","")}).eq("id",account_id).execute()
            else:
                result["message"] = f"Alpaca error {r.status_code}: {r.text[:200]}"
        except Exception as e:
            result["message"] = str(e)

    # ── Binance ───────────────────────────────────────────────
    elif broker == "binance":
        import hmac, hashlib, time
        ts        = int(time.time() * 1000)
        query     = f"timestamp={ts}"
        signature = hmac.new(secret.encode(), query.encode(), hashlib.sha256).hexdigest()
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                r = await client.get(
                    "https://api.binance.com/api/v3/account",
                    params={"timestamp": ts, "signature": signature},
                    headers={"X-MBX-APIKEY": key},
                )
            if r.status_code == 200:
                data   = r.json()
                balances = {b["asset"]: float(b["free"]) for b in data.get("balances",[]) if float(b["free"])>0}
                usdt_bal = balances.get("USDT", 0)
                result.update({"status":"ok","balance":usdt_bal,"currency":"USDT","message":"Binance — connected","balances":balances})
            else:
                result["message"] = f"Binance error {r.status_code}: {r.text[:200]}"
        except Exception as e:
            result["message"] = str(e)

    # ── MetaApi (MetaTrader 4/5) ──────────────────────────────
    elif broker == "metaapi":
        ma_account_id = extra.get("metaapi_account_id","")
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                r = await client.get(
                    f"https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts/{ma_account_id}/account-information",
                    headers={"auth-token": key},
                )
            if r.status_code == 200:
                data = r.json()
                bal  = float(data.get("balance",0))
                cur  = data.get("currency","USD")
                result.update({"status":"ok","balance":bal,"currency":cur,"message":f"MT4/MT5 — {data.get('name','')} connected"})
            else:
                result["message"] = f"MetaApi error {r.status_code}: {r.text[:200]}"
        except Exception as e:
            result["message"] = str(e)

    # ── Update DB with synced balance ─────────────────────────
    if result["status"] == "ok":
        db.table("broker_accounts").update({
            "broker_balance":  result["balance"],
            "broker_currency": result["currency"],
            "last_synced_at":  datetime.utcnow().isoformat(),
        }).eq("id", account_id).execute()

    return result

# ── PUT /api/brokers/{id}  ────────────────────────────────────
@router.put("/{account_id}")
async def update_broker_account(account_id: str, body: UpdateBrokerBody, current_user: dict = Depends(get_current_user)):
    db  = get_db_client()
    uid = current_user["sub"]

    res = db.table("broker_accounts").select("id").eq("id", account_id).eq("user_id", uid).execute()
    if not res.data:
        raise HTTPException(404, "Broker account not found")

    patch = {}
    if body.label is not None:         patch["label"]          = body.label.strip()
    if body.is_active is not None:     patch["is_active"]      = body.is_active
    if body.api_key is not None:       patch["api_key_enc"]    = _encrypt(body.api_key)
    if body.api_secret is not None:    patch["api_secret_enc"] = _encrypt(body.api_secret)
    if body.extra is not None:         patch["extra_enc"]      = _encrypt(json.dumps(body.extra))

    if not patch:
        raise HTTPException(400, "Nothing to update")

    updated = db.table("broker_accounts").update(patch).eq("id", account_id).execute()
    return _safe(updated.data[0])

# ── DELETE /api/brokers/{id}  ─────────────────────────────────
@router.delete("/{account_id}")
async def delete_broker_account(account_id: str, current_user: dict = Depends(get_current_user)):
    db  = get_db_client()
    uid = current_user["sub"]

    res = db.table("broker_accounts").select("id").eq("id", account_id).eq("user_id", uid).execute()
    if not res.data:
        raise HTTPException(404, "Broker account not found")

    db.table("broker_accounts").delete().eq("id", account_id).execute()
    return {"message": "Broker account removed"}

# ── GET /api/brokers/{id}/positions  ─────────────────────────
@router.get("/{account_id}/positions")
async def get_broker_positions(account_id: str, current_user: dict = Depends(get_current_user)):
    """Fetch live open positions directly from broker."""
    db  = get_db_client()
    uid = current_user["sub"]

    res = db.table("broker_accounts").select("*").eq("id", account_id).eq("user_id", uid).execute()
    if not res.data:
        raise HTTPException(404, "Broker account not found")

    acc    = res.data[0]
    broker = acc["broker"]
    key    = _decrypt(acc.get("api_key_enc",""))
    secret = _decrypt(acc.get("api_secret_enc",""))
    extra  = json.loads(_decrypt(acc.get("extra_enc","")) or "{}")
    atype  = acc.get("account_type","live")

    positions = []

    if broker == "demo":
        # Return internal DB trades as positions
        t_res = db.table("trades").select("*").eq("user_id",uid).eq("broker_account_id",account_id).eq("status","open").execute()
        positions = t_res.data or []

    elif broker == "oanda":
        base     = "https://api-fxpractice.oanda.com" if atype=="practice" else "https://api-fxtrade.oanda.com"
        oanda_id = extra.get("account_id") or acc.get("broker_account_id","")
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                r = await client.get(
                    f"{base}/v3/accounts/{oanda_id}/openTrades",
                    headers={"Authorization": f"Bearer {key}"},
                )
            if r.status_code == 200:
                for t in r.json().get("trades",[]):
                    positions.append({
                        "broker_trade_id": t.get("id"),
                        "pair":            t.get("instrument","").replace("_","/"),
                        "action":          "BUY" if float(t.get("currentUnits",0))>0 else "SELL",
                        "lots":            abs(float(t.get("currentUnits",0)))/100000,
                        "entry_price":     float(t.get("price",0)),
                        "unrealized_pl":   float(t.get("unrealizedPL",0)),
                        "opened_at":       t.get("openTime"),
                    })
        except Exception:
            pass

    elif broker == "alpaca":
        base = "https://paper-api.alpaca.markets" if atype=="paper" else "https://api.alpaca.markets"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                r = await client.get(
                    f"{base}/v2/positions",
                    headers={"APCA-API-KEY-ID": key, "APCA-API-SECRET-KEY": secret},
                )
            if r.status_code == 200:
                for p in r.json():
                    positions.append({
                        "broker_trade_id": p.get("asset_id"),
                        "pair":            p.get("symbol"),
                        "action":          "BUY" if float(p.get("qty",0))>0 else "SELL",
                        "lots":            abs(float(p.get("qty",0))),
                        "entry_price":     float(p.get("avg_entry_price",0)),
                        "unrealized_pl":   float(p.get("unrealized_pl",0)),
                    })
        except Exception:
            pass

    return {"positions": positions, "count": len(positions)}
