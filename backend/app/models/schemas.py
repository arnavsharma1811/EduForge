
from pydantic import BaseModel
from typing import Optional, List

class UploadResponse(BaseModel):
    course_id: str
    filename: str
    pages: int
    characters: int

class CourseGenerateRequest(BaseModel):
    course_id: str

class CourseGenerateResponse(BaseModel):
    course_id: str
    status: str
    course_structure: Optional[dict] = None

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

class QuizGenerateRequest(BaseModel):
    course_id: str
    chapter_index: int

class QuizGenerateResponse(BaseModel):
    questions: List[dict]

class ProgressUpdateRequest(BaseModel):
    course_id: str
    lesson_id: str

class ProgressResponse(BaseModel):
    course_id: str
    total_lessons: int
    completed_lessons: int
    completion_percentage: float

class SearchResponse(BaseModel):
    results: List[dict]

class PYQAnalyzeResponse(BaseModel):
    course_id: str
    status: str
    pyq_analysis: Optional[dict] = None
