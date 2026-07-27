import pdfplumber
import io
from typing import Tuple

def extract_text_from_pdf(content: bytes) -> Tuple[str, int]:
    with pdfplumber.open(io.BytesIO(content)) as pdf:
        text = "\n".join([page.extract_text() or "" for page in pdf.pages])
        pages = len(pdf.pages)
    return text, pages