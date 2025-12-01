from fastapi import FastAPI, HTTPException, File, UploadFile
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from parsing import parse_pdf, parse_docx

load_dotenv()

app = FastAPI(title="TalentScan AI Backend")

@app.get("/")
def health_check():
    return {"status": "AI Backend is running"}


@app.post("/parse")
async def parse_resume(file: UploadFile = File(...)):
    """
    Accepts a PDF or DOCX file and returns the extracted text.
    """
    filename = file.filename.lower()

    file_content = await file.read()

    extracted_text = ""

    if filename.endswith(".pdf"):
        extracted_text = parse_pdf(file_content)
    elif filename.endswith(".docx"):
        extracted_text = parse_docx(file_content)
    else:
        raise HTTPException(
            status_code=400,
            detail=" Unsupported file format. Please upload a PDF or DOCX.",
        )

    if not extracted_text:
        raise HTTPException(status_code=400, detail="Failed to extract text from file.")

    return {
        "filename": file.filename,
        "content_length": len(extracted_text),
        "extracted_text": extracted_text,
    }

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
