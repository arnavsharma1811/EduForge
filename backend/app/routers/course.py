from fastapi import APIRouter, HTTPException, Depends, Request
from app.services.langgraph_agent import CourseGenerationAgent
from app.services.supabase_client import get_supabase_client
from app.utils.auth import get_current_user
import asyncio

router = APIRouter()
agent = CourseGenerationAgent()

@router.post("/{course_id}/generate")
async def generate_course(
    request: Request,
    course_id: str,
    user = Depends(get_current_user)
):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = auth_header.split(" ")[1]
    supabase = get_supabase_client(token)
    
    course = supabase.table("courses").select("*").eq("id", course_id).eq("user_id", user.id).execute()
    if not course.data:
        raise HTTPException(status_code=404, detail="Course not found")

    supabase.table("courses").update({"status": "generating"}).eq("id", course_id).execute()

    try:
        text = course.data[0]["extracted_text"]
        if len(text) > 5000:
            text = text[:5000]

        loop = asyncio.get_event_loop()
        structure = await loop.run_in_executor(None, agent.run, text)

        supabase.table("courses").update({
            "course_structure": structure,
            "title": structure.get("title", "Untitled Course"),
            "status": "ready"
        }).eq("id", course_id).execute()

        return {"course_id": course_id, "status": "ready", "course_structure": structure}
    except Exception as e:
        supabase.table("courses").update({"status": "error"}).eq("id", course_id).execute()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{course_id}")
async def get_course(
    request: Request,
    course_id: str,
    user = Depends(get_current_user)
):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = auth_header.split(" ")[1]
    supabase = get_supabase_client(token)
    
    result = supabase.table("courses").select("*").eq("id", course_id).eq("user_id", user.id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Course not found")
    return result.data[0]