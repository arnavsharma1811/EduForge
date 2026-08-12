@echo off
echo ==========================================
echo       EduForge - Local Startup Script
echo ==========================================
echo.

:: 1. Start Ollama if it's not already running
echo [1/3] Checking if Ollama is running...
tasklist /FI "IMAGENAME eq ollama.exe" 2>NUL | find /I /N "ollama.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo Ollama is already running.
) else (
    echo Starting Ollama...
    start "" "ollama"
    timeout /t 5 >nul
)

:: 2. Start FastAPI Backend in a new window
echo [2/3] Starting FastAPI Backend...
start "EduForge Backend" cmd /k "cd backend && call venv\Scripts\activate && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

:: 3. Start Next.js Frontend in a new window
echo [3/3] Starting Next.js Frontend...
start "EduForge Frontend" cmd /k "npm run dev"

echo.
echo ==========================================
echo EduForge is booting up!
echo - Frontend: http://localhost:3000
echo - Backend:  http://localhost:8000
echo - Ollama:   http://localhost:11434
echo ==========================================
pause
