from fastapi import FastAPI, HTTPException, File, UploadFile
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
    job_description: str
    role_name: str

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


    structures_data=extract_resume_data(extracted_text)
    
    return {
        "filename": file.filename,
        "processed": True,
        "content_length": len(extracted_text),
        "data": structures_data
    }

@app.post("/score")
def calculate_score(request: ScoreRequest):
    """
    Analyzes the candidate's JSON against a job description.
    """
    result=score_candidate(
        request.candidate_data,
        request.job_description,
        request.role_name
    )    
    return result

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
