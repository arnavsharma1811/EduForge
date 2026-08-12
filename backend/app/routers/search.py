from fastapi import APIRouter, Depends, Query, Request
from app.services.supabase_client import get_supabase_client
from app.utils.auth import get_current_user

router = APIRouter()

@router.get("/")
async def search(
    request: Request,
    q: str = Query(default="", min_length=0),
    user = Depends(get_current_user)
):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = auth_header.split(" ")[1]
    supabase = get_supabase_client(token)
    
    if q and q.strip():
        results = supabase.table("courses")\
            .select("id", "title", "status")\
            .ilike("title", f"%{q}%")\
            .eq("user_id", user.id)\
            .execute()
    else:
        results = supabase.table("courses")\
            .select("id", "title", "status")\
            .eq("user_id", user.id)\
            .execute()
    
    return {
        "results": results.data,
        "count": len(results.data)
    }