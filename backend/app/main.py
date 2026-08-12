import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import upload, course, chat, quiz, progress, search, pyq


app = FastAPI(
    title="EduForge API",
    description="AI-Powered PDF to E-Course Learning Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/upload", tags=["Upload"])
app.include_router(course.router, prefix="/course", tags=["Course"])
app.include_router(chat.router, prefix="/chat", tags=["Chat"])
app.include_router(quiz.router, prefix="/quiz", tags=["Quiz"])
app.include_router(progress.router, prefix="/progress", tags=["Progress"])
app.include_router(search.router, prefix="/search", tags=["Search"])
app.include_router(pyq.router, prefix="/pyq", tags=["PYQ"])

@app.get("/")
async def root():
    return {"status": "EduForge API is running", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}