import asyncio
import logging
import traceback
from fastapi import APIRouter, HTTPException, Depends, Request
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
    request: Request,
    course_id: str,
    body: ChatRequest,
    user=Depends(get_current_user),
):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = auth_header.split(" ")[1]
    supabase = get_supabase_client(token)

    course = (
        supabase.table("courses")
        .select("*")
        .eq("id", course_id)
        .eq("user_id", user.id)
        .execute()
    )
    if not course.data:
        raise HTTPException(status_code=404, detail="Course not found")

    structure = course.data[0].get("course_structure")
    if not structure:
        raise HTTPException(status_code=400, detail="Course not generated yet")

    course_type = course.data[0].get("type", "course")

    context = []
    if course_type == "pyq":
        for topic in structure.get("priority_topics", []):
            topic_name = topic.get("topic", "Unknown")
            study_material = topic.get("study_material", {})
            summary = study_material.get("summary", "")
            key_points = "\n".join(study_material.get("key_points", []))
            context.append(f"Topic: {topic_name}\nSummary: {summary}\nKey Points:\n{key_points}")
            
        full_context = "\n\n".join(context[:5])
        prompt = f"""You are an exam preparation tutor. Answer based on the PYQ analysis and study material.
PYQ material: {full_context[:5000]}
Question: {body.message}
Answer:"""
    else:
        for chapter in structure.get("chapters", []):
            for topic in chapter.get("topics", []):
                for lesson in topic.get("lessons", []):
                    if lesson.get("explanation"):
                        context.append(lesson["explanation"])

        if not context:
            raise HTTPException(status_code=400, detail="No content found in course")

        full_context = "\n\n".join(context[:5])

        prompt = f"""You are a helpful tutor. Answer the question based on the course material.
Course content: {full_context[:5000]}
Question: {body.message}
Answer:"""

    try:
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

    try:
        supabase.table("chat_history").insert({
            "user_id": user.id,
            "course_id": course_id,
            "message": body.message,
            "response": response,
        }).execute()
    except Exception as e:
        logger.warning("Failed to save chat history: %s", e)

    return {"response": response}