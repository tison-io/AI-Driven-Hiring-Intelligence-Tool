from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from parsing import parse_pdf, parse_docx
from extraction import extract_resume_data
from scoring import score_candidate

load_dotenv()

app = FastAPI(title="TalentScan AI Backend")


class ScoreRequest(BaseModel):
    candidate_data: dict
    role_name: str


@app.get("/")
def health_check():
    return {"status": "AI Backend is running"}


class TextRequest(BaseModel):
    text: str

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

    structures_data = extract_resume_data(extracted_text)

    return {
        "filename": file.filename,
        "processed": True,
        "content_length": len(extracted_text),
        "data": structures_data,
    }

@app.post("/parse-text")
def parse_text(request: TextRequest):
    """
    Accepts raw text and returns structured data.
    """
    if not request.text:
        raise HTTPException(status_code=400, detail="No text provided.")

    structures_data = extract_resume_data(request.text)
    
    return {
        "processed": True,
        "content_length": len(request.text),
        "data": structures_data
    }

@app.post("/score")
def calculate_score(request: ScoreRequest):
    """
    Analyzes the candidate's JSON against a job description.
    """
    result = score_candidate(request.candidate_data, request.role_name)
    return result


@app.post("/analyze")
async def analyze_resume(file: UploadFile = File(...), role_name: str = Form(...)):
    """
    End-to-end endpoint to parse, extract, and score a resume against a job role.
    """

    filename = file.filename.lower()
    file_content = await file.read()

    raw_text = ""
    if filename.endswith(".pdf"):
        raw_text = parse_pdf(file_content)
    elif filename.endswith(".docx"):
        raw_text = parse_docx(file_content)
    else:
        raise HTTPException(
            status_code=400,
            detail=" Unsupported file format. Please upload a PDF or DOCX.",
        )

    if not raw_text:
        raise HTTPException(status_code=400, detail="Failed to extract text from file.")

    candidate_profile = extract_resume_data(raw_text)

    evaluation = score_candidate(candidate_profile, role_name)

    return {
        "filename": file.filename,
        "candidate_profile": candidate_profile,
        "evaluation": evaluation,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
