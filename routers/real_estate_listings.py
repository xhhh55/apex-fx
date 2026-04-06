# routers/real_estate_listings.py
# ══════════════════════════════════════════════════════════════
#  Real Estate Listings — full CRUD + fractional investment
#  All data is read/written from the real_estate_listings table
#  in Supabase. No hardcoded or simulated data.
# ══════════════════════════════════════════════════════════════
import os
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from database import get_db_client
from auth_utils import get_current_user

router = APIRouter()

# ── Schemas ───────────────────────────────────────────────────
class ListingCreate(BaseModel):
    title:           str
    title_ar:        Optional[str] = None
    description:     Optional[str] = None
    description_ar:  Optional[str] = None
    listing_type:    str                          # sale | rent | investment | fractional
    property_type:   str                          # apartment | villa | office | land | warehouse | retail | hotel
    country:         str = "UAE"
    city:            str
    district:        Optional[str] = None
    address:         Optional[str] = None
    lat:             Optional[float] = None
    lng:             Optional[float] = None
    price:           Optional[float] = None
    currency:        str = "USD"
    rent_per_month:  Optional[float] = None
    service_charge:  Optional[float] = None
    annual_yield:    Optional[float] = None
    price_per_sqm:   Optional[float] = None
    area_sqm:        Optional[float] = None
    bedrooms:        Optional[int] = None
    bathrooms:       Optional[int] = None
    floors:          Optional[int] = None
    year_built:      Optional[int] = None
    # Fractional fields
    total_tokens:    Optional[int] = None
    token_price:     Optional[float] = None
    min_investment:  Optional[float] = None
    images:          Optional[List[str]] = None
    amenities:       Optional[List[str]] = None

class ListingUpdate(BaseModel):
    title:           Optional[str] = None
    title_ar:        Optional[str] = None
    description:     Optional[str] = None
    description_ar:  Optional[str] = None
    price:           Optional[float] = None
    rent_per_month:  Optional[float] = None
    annual_yield:    Optional[float] = None
    status:          Optional[str] = None       # active | sold | rented | pending | inactive
    featured:        Optional[bool] = None
    images:          Optional[List[str]] = None
    amenities:       Optional[List[str]] = None

class InvestBody(BaseModel):
    listing_id: str
    tokens:     int

# ── GET /api/real-estate  ─────────────────────────────────────
@router.get("")
async def list_listings(
    city:            Optional[str]   = Query(None),
    listing_type:    Optional[str]   = Query(None),
    property_type:   Optional[str]   = Query(None),
    min_price:       Optional[float] = Query(None),
    max_price:       Optional[float] = Query(None),
    min_yield:       Optional[float] = Query(None),
    bedrooms:        Optional[int]   = Query(None),
    featured:        Optional[bool]  = Query(None),
    status:          str             = Query("active"),
    limit:           int             = Query(50, le=200),
    offset:          int             = Query(0),
):
    db    = get_db_client()
    query = db.table("real_estate_listings").select("*").eq("status", status)

    if city:           query = query.ilike("city", f"%{city}%")
    if listing_type:   query = query.eq("listing_type", listing_type)
    if property_type:  query = query.eq("property_type", property_type)
    if min_price:      query = query.gte("price", min_price)
    if max_price:      query = query.lte("price", max_price)
    if min_yield:      query = query.gte("annual_yield", min_yield)
    if bedrooms:       query = query.eq("bedrooms", bedrooms)
    if featured is not None: query = query.eq("featured", featured)

    res = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    return {"listings": res.data or [], "count": len(res.data or [])}

# ── GET /api/real-estate/{id}  ────────────────────────────────
@router.get("/{listing_id}")
async def get_listing(listing_id: str):
    db  = get_db_client()
    res = db.table("real_estate_listings").select("*").eq("id", listing_id).execute()
    if not res.data:
        raise HTTPException(404, "Listing not found")
    listing = res.data[0]
    # Increment view counter (fire-and-forget style)
    try:
        db.table("real_estate_listings").update(
            {"views": (listing.get("views") or 0) + 1}
        ).eq("id", listing_id).execute()
    except Exception:
        pass
    return listing

# ── POST /api/real-estate  ────────────────────────────────────
@router.post("")
async def create_listing(body: ListingCreate, current_user: dict = Depends(get_current_user)):
    db  = get_db_client()
    uid = current_user["sub"]

    VALID_TYPES  = {"sale","rent","investment","fractional"}
    VALID_PTYPES = {"apartment","villa","office","land","warehouse","retail","hotel"}
    if body.listing_type not in VALID_TYPES:
        raise HTTPException(400, f"listing_type must be one of: {', '.join(VALID_TYPES)}")
    if body.property_type not in VALID_PTYPES:
        raise HTTPException(400, f"property_type must be one of: {', '.join(VALID_PTYPES)}")

    if body.listing_type == "fractional":
        if not body.total_tokens or not body.token_price:
            raise HTTPException(400, "Fractional listings require total_tokens and token_price")

    row = {
        "owner_id":      uid,
        "title":         body.title.strip(),
        "title_ar":      body.title_ar,
        "description":   body.description,
        "description_ar":body.description_ar,
        "listing_type":  body.listing_type,
        "property_type": body.property_type,
        "country":       body.country,
        "city":          body.city.strip(),
        "district":      body.district,
        "address":       body.address,
        "lat":           body.lat,
        "lng":           body.lng,
        "price":         body.price,
        "currency":      body.currency,
        "rent_per_month":body.rent_per_month,
        "service_charge":body.service_charge,
        "annual_yield":  body.annual_yield,
        "price_per_sqm": body.price_per_sqm,
        "area_sqm":      body.area_sqm,
        "bedrooms":      body.bedrooms,
        "bathrooms":     body.bathrooms,
        "floors":        body.floors,
        "year_built":    body.year_built,
        "total_tokens":  body.total_tokens,
        "token_price":   body.token_price,
        "min_investment":body.min_investment,
        "tokens_sold":   0,
        "status":        "active",
        "verified":      False,
        "featured":      False,
        "views":         0,
        "images":        body.images or [],
        "amenities":     body.amenities or [],
        "created_at":    datetime.utcnow().isoformat(),
        "updated_at":    datetime.utcnow().isoformat(),
    }

    res = db.table("real_estate_listings").insert(row).execute()
    if not res.data:
        raise HTTPException(500, "Failed to create listing")
    return res.data[0]

# ── PUT /api/real-estate/{id}  ────────────────────────────────
@router.put("/{listing_id}")
async def update_listing(listing_id: str, body: ListingUpdate, current_user: dict = Depends(get_current_user)):
    db  = get_db_client()
    uid = current_user["sub"]

    res = db.table("real_estate_listings").select("id,owner_id").eq("id", listing_id).execute()
    if not res.data:
        raise HTTPException(404, "Listing not found")
    if res.data[0]["owner_id"] != uid:
        raise HTTPException(403, "Not your listing")

    patch = {"updated_at": datetime.utcnow().isoformat()}
    for field in ["title","title_ar","description","description_ar","price",
                  "rent_per_month","annual_yield","status","featured","images","amenities"]:
        val = getattr(body, field)
        if val is not None:
            patch[field] = val

    updated = db.table("real_estate_listings").update(patch).eq("id", listing_id).execute()
    return updated.data[0]

# ── DELETE /api/real-estate/{id}  ────────────────────────────
@router.delete("/{listing_id}")
async def delete_listing(listing_id: str, current_user: dict = Depends(get_current_user)):
    db  = get_db_client()
    uid = current_user["sub"]

    res = db.table("real_estate_listings").select("id,owner_id").eq("id", listing_id).execute()
    if not res.data:
        raise HTTPException(404, "Listing not found")
    if res.data[0]["owner_id"] != uid:
        raise HTTPException(403, "Not your listing")

    db.table("real_estate_listings").delete().eq("id", listing_id).execute()
    return {"message": "Listing deleted"}

# ── POST /api/real-estate/invest  ────────────────────────────
@router.post("/invest")
async def invest_fractional(body: InvestBody, current_user: dict = Depends(get_current_user)):
    """
    Buy fractional tokens in a property. Deducts from user balance.
    """
    db  = get_db_client()
    uid = current_user["sub"]

    # Fetch listing
    res = db.table("real_estate_listings").select("*").eq("id", body.listing_id).execute()
    if not res.data:
        raise HTTPException(404, "Listing not found")
    listing = res.data[0]

    if listing["listing_type"] != "fractional":
        raise HTTPException(400, "This listing is not a fractional investment")
    if listing["status"] != "active":
        raise HTTPException(400, "Listing is not active")

    available = (listing["total_tokens"] or 0) - (listing["tokens_sold"] or 0)
    if body.tokens > available:
        raise HTTPException(400, f"Only {available} tokens available")

    token_price = float(listing["token_price"] or 0)
    total_cost  = body.tokens * token_price

    # Check user balance
    user_res = db.table("users").select("balance").eq("id", uid).execute()
    if not user_res.data:
        raise HTTPException(404, "User not found")
    balance = float(user_res.data[0]["balance"])
    if balance < total_cost:
        raise HTTPException(400, f"Insufficient balance. Need {total_cost:.2f}, have {balance:.2f}")

    # Deduct balance
    db.table("users").update({"balance": balance - total_cost}).eq("id", uid).execute()

    # Record investment
    inv_res = db.table("re_investments").insert({
        "user_id":      uid,
        "listing_id":   body.listing_id,
        "tokens":       body.tokens,
        "price_paid":   total_cost,
        "purchase_date":datetime.utcnow().isoformat(),
        "status":       "active",
    }).execute()

    # Update tokens_sold
    db.table("real_estate_listings").update({
        "tokens_sold": (listing["tokens_sold"] or 0) + body.tokens
    }).eq("id", body.listing_id).execute()

    return {
        "message":    "Investment recorded",
        "tokens":     body.tokens,
        "price_paid": total_cost,
        "investment": inv_res.data[0] if inv_res.data else None,
    }

# ── GET /api/real-estate/my-investments  ─────────────────────
@router.get("/my/investments")
async def my_investments(current_user: dict = Depends(get_current_user)):
    db  = get_db_client()
    uid = current_user["sub"]

    res = db.table("re_investments").select(
        "*, real_estate_listings(id,title,title_ar,city,country,token_price,annual_yield,images)"
    ).eq("user_id", uid).order("purchase_date", desc=True).execute()

    return {"investments": res.data or [], "count": len(res.data or [])}

# ── GET /api/real-estate/stats/summary  ──────────────────────
@router.get("/stats/summary")
async def listings_summary():
    """Public stats — total listings, avg yield, cities."""
    db = get_db_client()
    res = db.table("real_estate_listings").select(
        "city,listing_type,annual_yield,price,currency"
    ).eq("status","active").execute()

    data = res.data or []
    cities = list({r["city"] for r in data if r.get("city")})
    yields = [float(r["annual_yield"]) for r in data if r.get("annual_yield")]
    avg_yield = round(sum(yields)/len(yields), 2) if yields else 0
    by_type = {}
    for r in data:
        t = r.get("listing_type","unknown")
        by_type[t] = by_type.get(t, 0) + 1

    return {
        "total":     len(data),
        "cities":    sorted(cities),
        "avg_yield": avg_yield,
        "by_type":   by_type,
    }
