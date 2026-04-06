# routers/broker_trade.py
# ══════════════════════════════════════════════════════════════
#  Real Broker Trade Execution
#  Routes orders to OANDA / Alpaca / Binance / MetaApi / Demo
# ══════════════════════════════════════════════════════════════
import os, json, hmac, hashlib, time, httpx
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from database import get_db_client
from auth_utils import get_current_user
from routers.broker_accounts import _decrypt

router = APIRouter()

# ── Schemas ───────────────────────────────────────────────────
class BrokerTradeBody(BaseModel):
    broker_account_id: str
    pair:              str
    action:            str            # BUY | SELL
    lots:              float
    order_type:        str = "market" # market | limit | stop
    entry_price:       Optional[float] = None
    sl:                Optional[float] = None
    tp:                Optional[float] = None

class BrokerCloseBody(BaseModel):
    broker_account_id: str
    broker_trade_id:   Optional[str] = None  # broker's own trade ID
    exit_price:        Optional[float] = None # used for demo/internal

# ── Helpers ───────────────────────────────────────────────────
def _get_lot_multiplier(pair: str) -> float:
    p = pair.upper()
    if any(x in p for x in ["BTC","ETH","BNB","SOL","XRP","ADA","DOGE","AVAX","DOT","LINK","MATIC"]):
        return 1.0
    if "XAU" in p: return 100.0
    if "XAG" in p: return 50.0
    if "JPY" in p: return 1000.0
    if any(x in p for x in ["US30","SPX","NAS","GER","UK1","JPN"]): return 1.0
    if any(x in p for x in ["WTI","OIL","BRENT","XTI","XBR"]): return 10.0
    return 100000.0

def _pair_to_oanda(pair: str) -> str:
    """EUR/USD → EUR_USD"""
    if "/" in pair:
        return pair.replace("/","_")
    return pair

def _pair_to_binance(pair: str) -> str:
    """BTC/USD → BTCUSDT"""
    p = pair.replace("/","").upper()
    if p.endswith("USD") and not p.endswith("USDT"):
        return p + "T"
    return p

# ── POST /api/broker-trade  ───────────────────────────────────
@router.post("")
async def execute_broker_trade(body: BrokerTradeBody, current_user: dict = Depends(get_current_user)):
    """
    Route a trade to the appropriate broker and record it in our DB.
    """
    db  = get_db_client()
    uid = current_user["sub"]

    # Load broker account
    acc_res = db.table("broker_accounts").select("*").eq("id", body.broker_account_id).eq("user_id", uid).execute()
    if not acc_res.data:
        raise HTTPException(404, "Broker account not found")

    acc    = acc_res.data[0]
    broker = acc["broker"]
    key    = _decrypt(acc.get("api_key_enc",""))
    secret = _decrypt(acc.get("api_secret_enc",""))
    extra  = json.loads(_decrypt(acc.get("extra_enc","")) or "{}")
    atype  = acc.get("account_type","live")

    broker_trade_id = None
    is_demo         = (broker == "demo")
    actual_entry    = body.entry_price or 0.0

    if body.action not in ("BUY","SELL"):
        raise HTTPException(400, "action must be BUY or SELL")
    if body.lots <= 0:
        raise HTTPException(400, "lots must be > 0")

    # ── Demo: just record in DB ───────────────────────────────
    if broker == "demo":
        is_demo = True
        # Use provided entry_price (from frontend live feed)

    # ── OANDA ─────────────────────────────────────────────────
    elif broker == "oanda":
        base      = "https://api-fxpractice.oanda.com" if atype=="practice" else "https://api-fxtrade.oanda.com"
        oanda_id  = extra.get("account_id") or acc.get("broker_account_id","")
        units     = int(body.lots * 100000)
        if body.action == "SELL":
            units = -units
        instrument = _pair_to_oanda(body.pair)

        order_data: dict = {
            "order": {
                "type":       "MARKET" if body.order_type=="market" else "LIMIT",
                "instrument": instrument,
                "units":      str(units),
                "timeInForce":"GTC",
            }
        }
        if body.order_type == "limit" and body.entry_price:
            order_data["order"]["price"] = str(body.entry_price)
        if body.sl:
            order_data["order"]["stopLossOnFill"] = {"price": str(body.sl), "timeInForce": "GTC"}
        if body.tp:
            order_data["order"]["takeProfitOnFill"] = {"price": str(body.tp), "timeInForce": "GTC"}

        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                r = await client.post(
                    f"{base}/v3/accounts/{oanda_id}/orders",
                    json=order_data,
                    headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                )
            if r.status_code in (200, 201):
                data = r.json()
                fill = data.get("orderFillTransaction") or data.get("orderCreateTransaction",{})
                broker_trade_id = fill.get("tradeOpened",{}).get("tradeID") or fill.get("id")
                actual_entry    = float(fill.get("price", body.entry_price or 0))
            else:
                raise HTTPException(400, f"OANDA error {r.status_code}: {r.text[:300]}")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(502, f"OANDA connection error: {e}")

    # ── Alpaca ────────────────────────────────────────────────
    elif broker == "alpaca":
        base = "https://paper-api.alpaca.markets" if atype=="paper" else "https://api.alpaca.markets"
        order_data = {
            "symbol":     body.pair,
            "qty":        str(body.lots),
            "side":       body.action.lower(),
            "type":       body.order_type,
            "time_in_force": "gtc",
        }
        if body.order_type == "limit" and body.entry_price:
            order_data["limit_price"] = str(body.entry_price)

        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                r = await client.post(
                    f"{base}/v2/orders",
                    json=order_data,
                    headers={"APCA-API-KEY-ID": key, "APCA-API-SECRET-KEY": secret},
                )
            if r.status_code in (200, 201):
                data            = r.json()
                broker_trade_id = data.get("id")
                actual_entry    = float(data.get("filled_avg_price") or body.entry_price or 0)
            else:
                raise HTTPException(400, f"Alpaca error {r.status_code}: {r.text[:300]}")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(502, f"Alpaca connection error: {e}")

    # ── Binance (Spot / Futures) ──────────────────────────────
    elif broker == "binance":
        ts        = int(time.time() * 1000)
        symbol    = _pair_to_binance(body.pair)
        side      = body.action  # BUY | SELL
        qty_str   = str(body.lots)
        params    = f"symbol={symbol}&side={side}&type={body.order_type.upper()}&quantity={qty_str}&timestamp={ts}"
        if body.order_type == "limit" and body.entry_price:
            params += f"&price={body.entry_price}&timeInForce=GTC"
        sig       = hmac.new(secret.encode(), params.encode(), hashlib.sha256).hexdigest()
        params   += f"&signature={sig}"

        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                r = await client.post(
                    "https://api.binance.com/api/v3/order",
                    data=dict(p.split("=",1) for p in params.split("&")),
                    headers={"X-MBX-APIKEY": key},
                )
            if r.status_code == 200:
                data            = r.json()
                broker_trade_id = str(data.get("orderId",""))
                fills           = data.get("fills",[])
                actual_entry    = float(fills[0]["price"]) if fills else (body.entry_price or 0)
            else:
                raise HTTPException(400, f"Binance error {r.status_code}: {r.text[:300]}")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(502, f"Binance connection error: {e}")

    # ── MetaApi (MT4/MT5) ─────────────────────────────────────
    elif broker == "metaapi":
        ma_account_id = extra.get("metaapi_account_id","")
        symbol        = body.pair.replace("/","")
        order_data    = {
            "symbol":      symbol,
            "actionType":  "ORDER_TYPE_BUY" if body.action=="BUY" else "ORDER_TYPE_SELL",
            "volume":      body.lots,
            "openPrice":   body.entry_price or None,
        }
        if body.sl:  order_data["stopLoss"]   = body.sl
        if body.tp:  order_data["takeProfit"] = body.tp

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                r = await client.post(
                    f"https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts/{ma_account_id}/trade",
                    json=order_data,
                    headers={"auth-token": key, "Content-Type": "application/json"},
                )
            if r.status_code in (200,201):
                data            = r.json()
                broker_trade_id = str(data.get("positionId") or data.get("orderId",""))
                actual_entry    = float(data.get("openPrice") or body.entry_price or 0)
            else:
                raise HTTPException(400, f"MetaApi error {r.status_code}: {r.text[:300]}")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(502, f"MetaApi connection error: {e}")

    else:
        raise HTTPException(400, f"Unknown broker: {broker}")

    # ── Record trade in our DB ────────────────────────────────
    trade_row = {
        "user_id":           uid,
        "broker_account_id": body.broker_account_id,
        "pair":              body.pair,
        "action":            body.action,
        "lots":              body.lots,
        "entry_price":       actual_entry or body.entry_price or 0,
        "sl":                body.sl,
        "tp":                body.tp,
        "status":            "open",
        "broker_trade_id":   broker_trade_id,
        "is_demo":           is_demo,
        "opened_at":         datetime.utcnow().isoformat(),
    }

    db_res = db.table("trades").insert(trade_row).execute()
    if not db_res.data:
        raise HTTPException(500, "Trade executed on broker but DB insert failed")

    return {
        "ok":             True,
        "trade":          db_res.data[0],
        "broker":         broker,
        "broker_trade_id":broker_trade_id,
        "is_demo":        is_demo,
    }

# ── POST /api/broker-trade/close  ────────────────────────────
@router.post("/close/{trade_id}")
async def close_broker_trade(trade_id: str, body: BrokerCloseBody, current_user: dict = Depends(get_current_user)):
    db  = get_db_client()
    uid = current_user["sub"]

    trade_res = db.table("trades").select("*").eq("id", trade_id).eq("user_id", uid).execute()
    if not trade_res.data:
        raise HTTPException(404, "Trade not found")

    trade = trade_res.data[0]
    if trade["status"] != "open":
        raise HTTPException(400, "Trade is not open")

    acc_res = db.table("broker_accounts").select("*").eq("id", body.broker_account_id).eq("user_id", uid).execute()
    if not acc_res.data:
        raise HTTPException(404, "Broker account not found")

    acc    = acc_res.data[0]
    broker = acc["broker"]
    key    = _decrypt(acc.get("api_key_enc",""))
    secret = _decrypt(acc.get("api_secret_enc",""))
    extra  = json.loads(_decrypt(acc.get("extra_enc","")) or "{}")
    atype  = acc.get("account_type","live")

    exit_price = body.exit_price or 0.0

    # ── Demo ──────────────────────────────────────────────────
    if broker == "demo":
        pass  # just use exit_price from body

    # ── OANDA ─────────────────────────────────────────────────
    elif broker == "oanda":
        base      = "https://api-fxpractice.oanda.com" if atype=="practice" else "https://api-fxtrade.oanda.com"
        oanda_id  = extra.get("account_id") or acc.get("broker_account_id","")
        oanda_tid = trade.get("broker_trade_id") or body.broker_trade_id
        if not oanda_tid:
            raise HTTPException(400, "Missing OANDA trade ID")
        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                r = await client.put(
                    f"{base}/v3/accounts/{oanda_id}/trades/{oanda_tid}/close",
                    headers={"Authorization": f"Bearer {key}"},
                )
            if r.status_code == 200:
                data       = r.json()
                fill       = data.get("orderFillTransaction",{})
                exit_price = float(fill.get("price", exit_price))
            else:
                raise HTTPException(400, f"OANDA close error: {r.text[:200]}")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(502, f"OANDA connection error: {e}")

    # ── Alpaca ────────────────────────────────────────────────
    elif broker == "alpaca":
        base      = "https://paper-api.alpaca.markets" if atype=="paper" else "https://api.alpaca.markets"
        symbol    = trade["pair"]
        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                r = await client.delete(
                    f"{base}/v2/positions/{symbol}",
                    headers={"APCA-API-KEY-ID": key, "APCA-API-SECRET-KEY": secret},
                )
            if r.status_code in (200,204):
                data       = r.json() if r.content else {}
                exit_price = float(data.get("avg_entry_price") or exit_price)
            else:
                raise HTTPException(400, f"Alpaca close error: {r.text[:200]}")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(502, f"Alpaca connection error: {e}")

    # ── Binance ───────────────────────────────────────────────
    elif broker == "binance":
        ts        = int(time.time() * 1000)
        symbol    = _pair_to_binance(trade["pair"])
        close_side = "SELL" if trade["action"]=="BUY" else "BUY"
        qty_str   = str(trade["lots"])
        params    = f"symbol={symbol}&side={close_side}&type=MARKET&quantity={qty_str}&timestamp={ts}"
        sig       = hmac.new(secret.encode(), params.encode(), hashlib.sha256).hexdigest()
        params   += f"&signature={sig}"
        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                r = await client.post(
                    "https://api.binance.com/api/v3/order",
                    data=dict(p.split("=",1) for p in params.split("&")),
                    headers={"X-MBX-APIKEY": key},
                )
            if r.status_code == 200:
                data       = r.json()
                fills      = data.get("fills",[])
                exit_price = float(fills[0]["price"]) if fills else exit_price
            else:
                raise HTTPException(400, f"Binance close error: {r.text[:200]}")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(502, f"Binance connection error: {e}")

    # ── MetaApi ───────────────────────────────────────────────
    elif broker == "metaapi":
        ma_account_id = extra.get("metaapi_account_id","")
        position_id   = trade.get("broker_trade_id") or body.broker_trade_id
        if not position_id:
            raise HTTPException(400, "Missing MetaApi position ID")
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                r = await client.post(
                    f"https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts/{ma_account_id}/trade",
                    json={"actionType":"POSITION_CLOSE_ID","positionId":position_id},
                    headers={"auth-token": key, "Content-Type": "application/json"},
                )
            if r.status_code in (200,201):
                data       = r.json()
                exit_price = float(data.get("closePrice") or exit_price)
            else:
                raise HTTPException(400, f"MetaApi close error: {r.text[:200]}")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(502, f"MetaApi connection error: {e}")

    # ── Calculate P&L ─────────────────────────────────────────
    entry  = float(trade["entry_price"] or 0)
    diff   = exit_price - entry
    if trade["action"] == "SELL":
        diff = -diff
    pl = round(diff * float(trade["lots"]) * _get_lot_multiplier(trade["pair"]), 2)

    # ── Update DB ─────────────────────────────────────────────
    db.table("trades").update({
        "status":     "closed",
        "exit_price": exit_price,
        "pl":         pl,
        "closed_at":  datetime.utcnow().isoformat(),
    }).eq("id", trade_id).execute()

    # Update demo balance only
    if trade.get("is_demo"):
        user_res  = db.table("users").select("balance").eq("id", uid).execute()
        old_bal   = float(user_res.data[0]["balance"]) if user_res.data else 10000.0
        db.table("users").update({"balance": round(old_bal + pl, 2)}).eq("id", uid).execute()

    return {"ok": True, "trade_id": trade_id, "pl": pl, "exit_price": exit_price, "broker": broker}
