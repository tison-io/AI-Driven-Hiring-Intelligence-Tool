from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from parsing import parse_pdf, parse_docx
from extraction import extract_resume_data
from scoring import score_candidate
from semantic_matcher import get_unified_analysis
from jd_parsing import parse_jd_requirements

load_dotenv()

app = FastAPI(title="TalentScan AI Backend")


class ScoreRequest(BaseModel):
    candidate_data: dict
    role_name: str
    job_description: str

class SemanticTestRequest(BaseModel):
    candidate_data: dict
    role_name: str
    job_description: str

class JDParsingTestRequest(BaseModel):
    job_description: str
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
        "data": structures_data,
    }


@app.post("/score")
def calculate_score(request: ScoreRequest):
    """
    Analyzes the candidate's JSON against a job description.
    """
    result = score_candidate(
        request.candidate_data, request.job_description, request.role_name
    )
    return result

@app.post("/test-semantic")
def test_semantic_matcher(request: SemanticTestRequest):
    """
    Test semantic matcher in isolation with detailed debug output.
    """
    try:
        jd_requirements = parse_jd_requirements(request.job_description, request.role_name)
        semantic_result = get_unified_analysis(
            request.candidate_data, 
            jd_requirements, 
            request.role_name
        )
        
        return {
            "success": True,
            "jd_requirements": jd_requirements,
            "semantic_analysis": semantic_result,
            "debug_info": {
                "candidate_jobs_count": len(request.candidate_data.get('work_experience', [])),
                "skill_categories_count": len(jd_requirements.get('skill_requirements', [])),
                "experience_analysis_count": len(semantic_result.get('work_experience_analysis', [])),
                "skill_analysis_count": len(semantic_result.get('skill_analysis', []))
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__
        }

@app.post("/test-jd-parsing")
def test_jd_parsing(request: JDParsingTestRequest):
    """
    Test job description parsing in isolation with detailed debug output.
    """
    try:
        print(f"\n=== JD PARSING TEST START ===")
        print(f"Role Name: {request.role_name}")
        print(f"JD Length: {len(request.job_description)} characters")
        print(f"JD Preview: {request.job_description[:200]}...")
        
        jd_requirements = parse_jd_requirements(request.job_description, request.role_name)
        
        print(f"Parsed Requirements:")
        print(f"  Required Years: {jd_requirements.get('required_years', 0)}")
        print(f"  Responsibilities: {len(jd_requirements.get('responsibilities', []))}")
        print(f"  Education Required: {jd_requirements.get('education_requirement', {}).get('required_level', 'None')}")
        print(f"  Certifications: {len(jd_requirements.get('required_certifications', []))}")
        
        if jd_requirements.get('responsibilities'):
            print(f"  Sample Responsibilities:")
            for i, resp in enumerate(jd_requirements['responsibilities'][:3]):
                print(f"    {i+1}. {resp.get('text', 'N/A')[:100]}...")
        
        print(f"=== JD PARSING TEST END ===\n")
        
        return {
            "success": True,
            "parsed_requirements": jd_requirements,
            "debug_info": {
                "input_length": len(request.job_description),
                "responsibilities_count": len(jd_requirements.get('responsibilities', [])),
                "has_education_req": bool(jd_requirements.get('education_requirement', {}).get('required_level')),
                "certifications_count": len(jd_requirements.get('required_certifications', [])),
                "required_years": jd_requirements.get('required_years', 0)
            }
        }
    except Exception as e:
        print(f"\n=== JD PARSING FAILED ===")
        print(f"Error: {e}")
        print(f"Error Type: {type(e).__name__}")
        print(f"=== JD PARSING TEST END ===\n")
        
        return {
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__
        }

@app.post("/analyze")
async def analyze_resume(
    file: UploadFile = File(...),
    role_name: str = Form(...),
    job_description: str = Form(None),
):
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

    evaluation = score_candidate(candidate_profile, job_description or "", role_name)

    return {
        "filename": file.filename,
        "candidate_profile": candidate_profile,
        "evaluation": evaluation,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
