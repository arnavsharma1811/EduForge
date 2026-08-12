from fastapi import APIRouter, HTTPException, Depends
from app.services.pyq_agent import PYQAnalysisAgent
from app.services.supabase_client import get_supabase_client
from app.utils.auth import get_current_user
import asyncio

router = APIRouter()
agent = PYQAnalysisAgent()

@router.post("/{course_id}/analyze")
async def analyze_pyq(course_id: str, user = Depends(get_current_user)):
    supabase = get_supabase_client()
    course = supabase.table("courses").select("*").eq("id", course_id).eq("user_id", user.id).execute()
    if not course.data:
        raise HTTPException(status_code=404, detail="Course not found")
        
    if course.data[0].get("type", "course") != "pyq":
        raise HTTPException(status_code=400, detail="Course is not of type 'pyq'")

    supabase.table("courses").update({"status": "analyzing"}).eq("id", course_id).execute()

    try:
        text = course.data[0]["extracted_text"]
        if len(text) > 8000:   # Truncate to avoid oversized prompt
            text = text[:8000]

        loop = asyncio.get_event_loop()
        structure = await loop.run_in_executor(None, agent.run, text)

        supabase.table("courses").update({
            "course_structure": structure,
            "status": "ready"
        }).eq("id", course_id).execute()

        return {"course_id": course_id, "status": "ready", "pyq_analysis": structure}
    except Exception as e:
        supabase.table("courses").update({"status": "error"}).eq("id", course_id).execute()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{course_id}")
async def get_pyq(course_id: str, user = Depends(get_current_user)):
    supabase = get_supabase_client()
    result = supabase.table("courses").select("*").eq("id", course_id).eq("user_id", user.id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Course not found")
    return result.data[0]
