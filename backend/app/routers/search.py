from fastapi import APIRouter, Depends, Query
from app.services.supabase_client import get_supabase_client
from app.utils.auth import get_current_user

router = APIRouter()

@router.get("/")
async def search(
    q: str = Query(default="", min_length=0),  # Allow empty string
    user = Depends(get_current_user)
):
    supabase = get_supabase_client()
    
    if q and q.strip():
        # Search with query
        results = supabase.table("courses")\
            .select("id", "title", "status")\
            .ilike("title", f"%{q}%")\
            .eq("user_id", user["id"])\
            .execute()
    else:
        # No query — return all courses for the user
        results = supabase.table("courses")\
            .select("id", "title", "status")\
            .eq("user_id", user["id"])\
            .execute()
    
    return {
        "results": results.data,
        "count": len(results.data)
    }