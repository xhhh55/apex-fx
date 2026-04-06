# database.py — Supabase client singleton
import os
from supabase import create_client, Client
from functools import lru_cache

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")  # service_role key (server-side)

@lru_cache(maxsize=1)
def get_db_client() -> Client:
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars")
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
