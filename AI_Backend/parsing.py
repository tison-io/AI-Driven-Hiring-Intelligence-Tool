import io
import re
from pypdf import PdfReader
import mammoth

def clean_text(text: str) -> str:
    """Removes extra whitespace, tabs, and newlines.
    """
    if not text:
        return ""
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def parse_pdf(file_bytes: bytes) -> str:
    """Extrcts text from a PDF file using pypdf
    """
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            content=page.extract_text()
            if content:
                text += content + "\n"
        return clean_text(text)
    except Exception as e:
        print(f"Error parsing PDF: {e}") 
        return ""

def parse_docx(file_bytes: bytes) -> str:
    """Extracts text from a DOCX file using mammoth
    """
    try:
        result=mammoth.extract_raw_text(io.BytesIO(file_bytes))
        return clean_text(result.value)
    except Exception as e:
        print(f"Error parsing DOCX: {e}") 
        return ""

