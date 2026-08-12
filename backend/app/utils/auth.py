from fastapi import Request, HTTPException
from supabase import create_client
import os

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_ANON_KEY")
)

async def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    
    token = auth_header.split(" ")[1]
    try:
        user = supabase.auth.get_user(token)
        return user.user  
    except Exception as e:
        print("Auth error:", e)
        raise HTTPException(status_code=401, detail="Invalid token")