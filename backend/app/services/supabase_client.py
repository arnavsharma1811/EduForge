import os
from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

def get_supabase_client(token: str = None):
    client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    if token:
        client.auth.set_session(access_token=token, refresh_token='')
    return client