import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Depends
from app.services.supabase_client import get_supabase_client
from app.utils.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()


@router.put("/{course_id}/{lesson_id}")
async def mark_lesson_complete(
    course_id: str,
    lesson_id: str,
    user=Depends(get_current_user),
):
    supabase = get_supabase_client()

    # Verify the course belongs to this user
    course = (
        supabase.table("courses")
        .select("id")
        .eq("id", course_id)
        .eq("user_id", user["id"])
        .execute()
    )
    if not course.data:
        raise HTTPException(status_code=404, detail="Course not found")

    try:
        supabase.table("progress").upsert(
            {
                "user_id": user["id"],
                "course_id": course_id,
                "lesson_id": lesson_id,
                "completed": True,
                # Use a proper ISO timestamp instead of "now()" string
                "completed_at": datetime.now(timezone.utc).isoformat(),
            },
            on_conflict="user_id,course_id,lesson_id",
        ).execute()
    except Exception as e:
        logger.error("Failed to upsert progress: %s", e)
        raise HTTPException(status_code=500, detail=f"Could not save progress: {e}")

    return {"status": "success", "lesson_id": lesson_id, "completed": True}


@router.get("/{course_id}")
async def get_progress(
    course_id: str,
    user=Depends(get_current_user),
):
    supabase = get_supabase_client()

    # ── 1. Verify course exists and get structure ───────────────────
    course = (
        supabase.table("courses")
        .select("id, course_structure")
        .eq("id", course_id)
        .eq("user_id", user["id"])
        .execute()
    )
    if not course.data:
        raise HTTPException(status_code=404, detail="Course not found")

    # ── 2. Count total lessons from course structure ────────────────
    structure = course.data[0].get("course_structure") or {}
    total_lessons = 0
    for chapter in structure.get("chapters", []):
        for topic in chapter.get("topics", []):
            total_lessons += len(topic.get("lessons", []))

    # ── 3. Fetch completed progress records ─────────────────────────
    result = (
        supabase.table("progress")
        .select("*")
        .eq("course_id", course_id)
        .eq("user_id", user["id"])
        .execute()
    )

    completed = sum(1 for p in result.data if p.get("completed", False))

    # Use the actual total from course structure if available,
    # otherwise fall back to progress records count
    effective_total = total_lessons if total_lessons > 0 else max(completed, 1)

    return {
        "course_id": course_id,
        "total_lessons": effective_total,
        "completed_lessons": completed,
        "completion_percentage": round(
            (completed / effective_total * 100) if effective_total > 0 else 0, 1
        ),
        "progress": result.data,
    }