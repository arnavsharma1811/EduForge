import asyncio
import json
import re
import logging
import traceback

from fastapi import APIRouter, HTTPException, Depends
from app.services.llm_service import LLMService, LLMTimeoutError, LLMServiceError
from app.services.supabase_client import get_supabase_client
from app.utils.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()
llm = LLMService()


def _extract_json_array(text: str) -> list:
    """Robustly extract a JSON array from LLM output that may contain
    markdown fences, preamble text, or other noise."""
    # Strip markdown code fences
    cleaned = re.sub(r"```(?:json)?\s*", "", text).strip()

    # Try parsing the whole cleaned string
    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, list):
            return parsed
        # If the model returned a dict with a "questions" key, extract it
        if isinstance(parsed, dict) and "questions" in parsed:
            return parsed["questions"]
    except json.JSONDecodeError:
        pass

    # Fallback: find the outermost [ ... ] using bracket-depth scanning
    start = cleaned.find("[")
    if start == -1:
        raise ValueError(
            f"No JSON array found in LLM response. Raw:\n{text[:500]}"
        )

    depth = 0
    for i in range(start, len(cleaned)):
        if cleaned[i] == "[":
            depth += 1
        elif cleaned[i] == "]":
            depth -= 1
            if depth == 0:
                candidate = cleaned[start : i + 1]
                try:
                    return json.loads(candidate)
                except json.JSONDecodeError:
                    break

    raise ValueError(
        f"Could not parse JSON array from LLM response. Raw:\n{text[:500]}"
    )


@router.post("/generate/{course_id}/{chapter_index}")
async def generate_quiz(
    course_id: str,
    chapter_index: int,
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

    chapters = structure.get("chapters", [])
    if chapter_index < 0 or chapter_index >= len(chapters):
        raise HTTPException(
            status_code=404,
            detail=f"Chapter index {chapter_index} out of range (0–{len(chapters) - 1})",
        )

    # ── 2. Build chapter content ────────────────────────────────────
    chapter = chapters[chapter_index]
    content = f"Chapter: {chapter.get('title', 'Untitled')}\n"
    for topic in chapter.get("topics", []):
        for lesson in topic.get("lessons", []):
            content += lesson.get("explanation", "") + "\n"

    if len(content.strip()) < 50:
        raise HTTPException(
            status_code=400,
            detail="Not enough content in this chapter to generate a quiz",
        )

    # ── 3. Generate quiz via LLM ────────────────────────────────────
    prompt = f"""Generate exactly 3 multiple-choice questions from the following content.
Output ONLY a valid JSON array — no markdown fences, no explanation.

Each object must have:
- "question": string
- "options": list of exactly 4 strings
- "correct_answer": string (must be one of the options)
- "explanation": string

Content:
{content[:3000]}

JSON array:"""

    try:
        response = await asyncio.to_thread(llm.generate, prompt, 0.3, 1000)
        logger.debug("Quiz LLM response:\n%s", response[:500])
        questions = _extract_json_array(response)
    except LLMTimeoutError as e:
        logger.error("Quiz LLM timeout: %s", traceback.format_exc())
        raise HTTPException(status_code=504, detail=f"AI timed out: {e}")
    except LLMServiceError as e:
        logger.error("Quiz LLM error: %s", traceback.format_exc())
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")
    except ValueError as e:
        logger.error("Quiz JSON parse error: %s", traceback.format_exc())
        raise HTTPException(
            status_code=422,
            detail=f"Could not parse quiz questions from AI response: {e}",
        )
    except Exception as e:
        logger.error("Quiz unexpected error: %s", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")

    # ── 4. Validate question structure ──────────────────────────────
    validated = []
    for i, q in enumerate(questions):
        if not isinstance(q, dict):
            continue
        validated.append({
            "question": q.get("question", f"Question {i + 1}"),
            "options": q.get("options", [])[:4],
            "correct_answer": q.get("correct_answer", ""),
            "explanation": q.get("explanation", ""),
        })

    if not validated:
        raise HTTPException(
            status_code=422,
            detail="AI returned questions but none had the expected structure",
        )

    # ── 5. Store quiz in Supabase ───────────────────────────────────
    try:
        supabase.table("quizzes").insert({
            "course_id": course_id,
            "chapter_index": chapter_index,
            "questions": validated,
            "user_id": user["id"],
        }).execute()
    except Exception as e:
        # Don't fail the response if storage fails
        logger.warning("Failed to store quiz in Supabase: %s", e)

    return {"questions": validated}