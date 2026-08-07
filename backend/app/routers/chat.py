import asyncio
import logging
import traceback

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.services.llm_service import LLMService, LLMTimeoutError, LLMServiceError
from app.services.supabase_client import get_supabase_client
from app.utils.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()
llm = LLMService()


class ChatRequest(BaseModel):
    message: str


@router.post("/{course_id}")
async def chat(
    course_id: str,
    body: ChatRequest,
    user=Depends(get_current_user),
):
    supabase = get_supabase_client()

    # ── 1. Fetch course ─────────────────────────────────────────────
    course = (
        supabase.table("courses")
        .select("*")
        .eq("id", course_id)
        .eq("user_id", user["id"])
        .execute()
    )
    if not course.data:
        raise HTTPException(status_code=404, detail="Course not found")

    structure = course.data[0].get("course_structure")
    if not structure:
        raise HTTPException(status_code=400, detail="Course not generated yet")

    # ── 2. Build context from lessons (simple RAG) ──────────────────
    context = []
    for chapter in structure.get("chapters", []):
        for topic in chapter.get("topics", []):
            for lesson in topic.get("lessons", []):
                if lesson.get("explanation"):
                    context.append(lesson["explanation"])

    if not context:
        raise HTTPException(status_code=400, detail="No content found in course")

    full_context = "\n\n".join(context[:5])  # limit to 5 lessons for speed

    prompt = f"""You are a helpful tutor. Answer the question based on the course material.
Course content: {full_context[:5000]}
Question: {body.message}
Answer:"""

    try:
        # Run the synchronous LLM call in a thread
        response = await asyncio.to_thread(llm.generate, prompt, 0.3, 500)
    except LLMTimeoutError as e:
        logger.error("Chat LLM timeout: %s", traceback.format_exc())
        raise HTTPException(status_code=504, detail=f"AI timed out: {e}")
    except LLMServiceError as e:
        logger.error("Chat LLM error: %s", traceback.format_exc())
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")
    except Exception as e:
        logger.error("Chat unexpected error: %s", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")

    # ── 3. Save chat history ────────────────────────────────────────
    try:
        supabase.table("chat_history").insert({
            "user_id": user["id"],
            "course_id": course_id,
            "message": body.message,
            "response": response,
        }).execute()
    except Exception as e:
        # Don't fail the whole request if history save fails
        logger.warning("Failed to save chat history: %s", e)

    return {"response": response}