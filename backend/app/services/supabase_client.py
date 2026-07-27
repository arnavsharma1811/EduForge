import os
from supabase import create_client  # type: ignore[import]

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

def get_supabase_client():
    return create_client(SUPABASE_URL, SUPABASE_ANON_KEY)