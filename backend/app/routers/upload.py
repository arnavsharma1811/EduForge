from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from app.services.pdf_service import extract_text_from_pdf
from app.services.supabase_client import get_supabase_client
from app.utils.auth import get_current_user

router = APIRouter()

@router.post("/")
async def upload_pdf(
    file: UploadFile = File(...),
    user = Depends(get_current_user)
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDFs are allowed")
    
    content = await file.read()
    text, pages = extract_text_from_pdf(content)
    
    if not text.strip():
        raise HTTPException(status_code=400, detail="No text could be extracted")
    
    supabase = get_supabase_client()
    result = supabase.table("courses").insert({
        "user_id": user["id"],
        "filename": file.filename,
        "extracted_text": text,
        "status": "uploaded"
    }).execute()
    
    return {
        "course_id": result.data[0]["id"],
        "filename": file.filename,
        "pages": pages,
        "characters": len(text)
    }