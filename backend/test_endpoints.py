"""
EduForge API — Full Endpoint Test Script
=========================================
Run this AFTER starting the backend:
    cd backend
    venv\Scripts\activate
    uvicorn app.main:app --reload

Usage:
    python test_endpoints.py

This script tests the full flow:
  1. Health check
  2. Upload PDF → get course_id
  3. Generate course structure
  4. Chat with course content
  5. Generate quiz
  6. Track progress
  7. Search courses
"""

import requests
import json
import time
import sys
import os

# ─── Configuration ──────────────────────────────────────────────────
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")
# Path to a test PDF — update this to point to any PDF on your machine
TEST_PDF_PATH = os.getenv("TEST_PDF", None)

PASS = "✅"
FAIL = "❌"
SKIP = "⏭️ "
results = []


def log(status, name, detail=""):
    icon = PASS if status == "pass" else (FAIL if status == "fail" else SKIP)
    msg = f"  {icon} {name}"
    if detail:
        msg += f" — {detail}"
    print(msg)
    results.append((status, name, detail))


def section(title):
    print(f"\n{'═' * 60}")
    print(f"  {title}")
    print(f"{'═' * 60}")


# ════════════════════════════════════════════════════════════════════
# 1. Health check
# ════════════════════════════════════════════════════════════════════
section("1. Health Check")
try:
    r = requests.get(f"{BASE_URL}/health", timeout=5)
    if r.status_code == 200:
        log("pass", "GET /health", r.json().get("status"))
    else:
        log("fail", "GET /health", f"status={r.status_code}")
except requests.ConnectionError:
    log("fail", "GET /health", "Cannot connect — is the server running?")
    print("\n⛔ Server is not reachable. Start it with:")
    print("   cd backend && venv\\Scripts\\activate && uvicorn app.main:app --reload")
    sys.exit(1)

try:
    r = requests.get(f"{BASE_URL}/", timeout=5)
    log("pass", "GET /", r.json().get("status"))
except Exception as e:
    log("fail", "GET /", str(e))


# ════════════════════════════════════════════════════════════════════
# 2. Upload PDF
# ════════════════════════════════════════════════════════════════════
section("2. Upload PDF")
course_id = None

if TEST_PDF_PATH and os.path.exists(TEST_PDF_PATH):
    try:
        with open(TEST_PDF_PATH, "rb") as f:
            r = requests.post(
                f"{BASE_URL}/upload/",
                files={"file": (os.path.basename(TEST_PDF_PATH), f, "application/pdf")},
                timeout=30,
            )
        if r.status_code == 200:
            data = r.json()
            course_id = data.get("course_id")
            log("pass", "POST /upload/", f"course_id={course_id}, pages={data.get('pages')}, chars={data.get('characters')}")
        else:
            log("fail", "POST /upload/", f"status={r.status_code} — {r.text[:200]}")
    except Exception as e:
        log("fail", "POST /upload/", str(e))
else:
    log("skip", "POST /upload/", "No TEST_PDF path set. Set TEST_PDF=path/to/file.pdf")
    # Try to find an existing course to use for subsequent tests
    print("  ℹ️  Looking for an existing course in Supabase...")
    try:
        r = requests.get(f"{BASE_URL}/search/?q=", timeout=10)
        if r.status_code == 200:
            courses = r.json().get("results", [])
            if courses:
                course_id = courses[0]["id"]
                print(f"  ℹ️  Found existing course: {course_id}")
            else:
                print("  ℹ️  No existing courses found.")
        elif r.status_code == 422:
            # Search requires min_length=1, try with a wildcard
            r = requests.get(f"{BASE_URL}/search/?q=a", timeout=10)
            if r.status_code == 200:
                courses = r.json().get("results", [])
                if courses:
                    course_id = courses[0]["id"]
                    print(f"  ℹ️  Found existing course: {course_id}")
    except Exception:
        pass


# ════════════════════════════════════════════════════════════════════
# 3. Generate Course Structure
# ════════════════════════════════════════════════════════════════════
section("3. Generate Course Structure")

if course_id:
    try:
        print("  ⏳ This may take 1–5 minutes (Ollama is generating content)...")
        r = requests.post(
            f"{BASE_URL}/course/{course_id}/generate",
            timeout=600,  # 10 minutes max
        )
        if r.status_code == 200:
            data = r.json()
            structure = data.get("course_structure", {})
            n_chapters = len(structure.get("chapters", []))
            log("pass", "POST /course/{id}/generate",
                f"title=\"{structure.get('title', '?')}\", chapters={n_chapters}")
        else:
            log("fail", "POST /course/{id}/generate",
                f"status={r.status_code} — {r.text[:300]}")
    except requests.Timeout:
        log("fail", "POST /course/{id}/generate", "Timed out after 600s")
    except Exception as e:
        log("fail", "POST /course/{id}/generate", str(e))
else:
    log("skip", "POST /course/{id}/generate", "No course_id available")


# ════════════════════════════════════════════════════════════════════
# 4. Get Course (verify it's ready)
# ════════════════════════════════════════════════════════════════════
section("4. Get Course Details")

course_ready = False
if course_id:
    try:
        r = requests.get(f"{BASE_URL}/course/{course_id}", timeout=10)
        if r.status_code == 200:
            data = r.json()
            status = data.get("status", "?")
            course_ready = status == "ready"
            log("pass", "GET /course/{id}", f"status={status}, title={data.get('title', '?')}")
        else:
            log("fail", "GET /course/{id}", f"status={r.status_code}")
    except Exception as e:
        log("fail", "GET /course/{id}", str(e))
else:
    log("skip", "GET /course/{id}", "No course_id available")


# ════════════════════════════════════════════════════════════════════
# 5. Chat with Course
# ════════════════════════════════════════════════════════════════════
section("5. Chat (RAG)")

if course_id and course_ready:
    try:
        r = requests.post(
            f"{BASE_URL}/chat/{course_id}",
            json={"message": "What is the main topic of this course?"},
            timeout=120,
        )
        if r.status_code == 200:
            resp = r.json().get("response", "")
            log("pass", "POST /chat/{id}", f"response={resp[:100]}...")
        else:
            log("fail", "POST /chat/{id}", f"status={r.status_code} — {r.text[:300]}")
    except Exception as e:
        log("fail", "POST /chat/{id}", str(e))
else:
    log("skip", "POST /chat/{id}",
        "No ready course" if course_id else "No course_id available")


# ════════════════════════════════════════════════════════════════════
# 6. Generate Quiz
# ════════════════════════════════════════════════════════════════════
section("6. Quiz Generation")

if course_id and course_ready:
    try:
        r = requests.post(
            f"{BASE_URL}/quiz/generate/{course_id}/0",
            timeout=120,
        )
        if r.status_code == 200:
            questions = r.json().get("questions", [])
            log("pass", "POST /quiz/generate/{id}/0",
                f"{len(questions)} questions generated")
            for i, q in enumerate(questions):
                print(f"     Q{i+1}: {q.get('question', '?')[:80]}")
        else:
            log("fail", "POST /quiz/generate/{id}/0",
                f"status={r.status_code} — {r.text[:300]}")
    except Exception as e:
        log("fail", "POST /quiz/generate/{id}/0", str(e))
else:
    log("skip", "POST /quiz/generate/{id}/0",
        "No ready course" if course_id else "No course_id available")


# ════════════════════════════════════════════════════════════════════
# 7. Progress Tracking
# ════════════════════════════════════════════════════════════════════
section("7. Progress Tracking")

if course_id:
    # Mark a lesson complete
    try:
        r = requests.put(
            f"{BASE_URL}/progress/{course_id}/lesson_0_0",
            timeout=10,
        )
        if r.status_code == 200:
            log("pass", "PUT /progress/{id}/lesson_0_0", r.json())
        else:
            log("fail", "PUT /progress/{id}/lesson_0_0",
                f"status={r.status_code} — {r.text[:200]}")
    except Exception as e:
        log("fail", "PUT /progress/{id}/lesson_0_0", str(e))

    # Get progress
    try:
        r = requests.get(f"{BASE_URL}/progress/{course_id}", timeout=10)
        if r.status_code == 200:
            data = r.json()
            log("pass", "GET /progress/{id}",
                f"completed={data.get('completed_lessons')}/{data.get('total_lessons')} "
                f"({data.get('completion_percentage')}%)")
        else:
            log("fail", "GET /progress/{id}",
                f"status={r.status_code} — {r.text[:200]}")
    except Exception as e:
        log("fail", "GET /progress/{id}", str(e))
else:
    log("skip", "PUT /progress/{id}/{lesson}", "No course_id available")
    log("skip", "GET /progress/{id}", "No course_id available")


# ════════════════════════════════════════════════════════════════════
# 8. Search
# ════════════════════════════════════════════════════════════════════
section("8. Search")

try:
    r = requests.get(f"{BASE_URL}/search/?q=course", timeout=10)
    if r.status_code == 200:
        data = r.json()
        log("pass", "GET /search/?q=course", f"{data.get('count', 0)} results")
    else:
        log("fail", "GET /search/?q=course",
            f"status={r.status_code} — {r.text[:200]}")
except Exception as e:
    log("fail", "GET /search/?q=course", str(e))


# ════════════════════════════════════════════════════════════════════
# Summary
# ════════════════════════════════════════════════════════════════════
section("SUMMARY")
passed = sum(1 for s, _, _ in results if s == "pass")
failed = sum(1 for s, _, _ in results if s == "fail")
skipped = sum(1 for s, _, _ in results if s == "skip")
total = len(results)

print(f"\n  {PASS} Passed:  {passed}/{total}")
print(f"  {FAIL} Failed:  {failed}/{total}")
print(f"  {SKIP} Skipped: {skipped}/{total}")

if failed == 0 and passed > 0:
    print(f"\n  🎉 All tests passed! You're ready to record the demo.")
elif failed > 0:
    print(f"\n  ⚠️  {failed} test(s) failed. Check the output above for details.")
    print(f"  Check the backend terminal for full tracebacks.")

print()
