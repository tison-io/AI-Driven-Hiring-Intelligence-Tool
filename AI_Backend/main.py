import asyncio
from fastapi import FastAPI, HTTPException, File, UploadFile, Form, Body
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from parsing import parse_pdf, parse_docx
from extraction import extract_resume_data
from scoring import score_candidate, score_stage_1_math, score_stage_2_qualitative
from jd_parsing import parse_jd_requirements

load_dotenv()

app = FastAPI(title="TalentScan AI Backend")

class ScoreRequest(BaseModel):
    candidate_data: dict
    role_name: str
    job_description: str

class Stage2Request(BaseModel):
    """
    Input for the second stage. 
    It requires the output from Stage 1 to avoid re-calculating.
    """
    stage_1_result: dict
    jd_rules: dict
    role_name: str

class SemanticTestRequest(BaseModel):
    candidate_data: dict
    role_name: str
    job_description: str

class JDParsingTestRequest(BaseModel):
    job_description: str
    role_name: str

class TextRequest(BaseModel):
    text: str


@app.get("/")
async def health_check():
    return {"status": "AI Backend is running"}

@app.post("/parse")
async def parse_resume(file: UploadFile = File(...)):
    filename = file.filename.lower()
    file_content = await file.read()

    if filename.endswith(".pdf"):
        extracted_text = await asyncio.to_thread(parse_pdf, file_content)
    elif filename.endswith(".docx"):
        extracted_text = await asyncio.to_thread(parse_docx, file_content)
    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Please upload a PDF or DOCX.",
        )

    if not extracted_text:
        raise HTTPException(status_code=400, detail="Failed to extract text.")

    structures_data = await asyncio.to_thread(extract_resume_data, extracted_text)

    return {
        "filename": file.filename,
        "processed": True,
        "content_length": len(extracted_text),
        "data": structures_data,
    }


@app.post("/parse-text")
async def parse_text(request: TextRequest):
    if not request.text:
        raise HTTPException(status_code=400, detail="No text provided.")

    structures_data = await asyncio.to_thread(extract_resume_data, request.text)

    return {
        "processed": True,
        "content_length": len(request.text),
        "data": structures_data,
    }

@app.post("/analyze/fast")
async def analyze_fast(
    file: UploadFile | None = File(None),
    raw_text: str | None = Form(None),
    role_name: str = Form(...),
    job_description: str | None = Form(None),
):
    """
    STAGE 1: FAST ANALYSIS (Math Only)
    Returns: Score, Breakdown, and Parsed Data.
    Time: ~2-4 seconds.
    """
    final_raw_text = ""

    if file:
        file_content = await file.read()
        filename = file.filename.lower()
        if filename.endswith(".pdf"):
            final_raw_text = await asyncio.to_thread(parse_pdf, file_content)
        elif filename.endswith(".docx"):
            final_raw_text = await asyncio.to_thread(parse_docx, file_content)
    elif raw_text:
        final_raw_text = raw_text

    if not final_raw_text:
        raise HTTPException(status_code=400, detail="No valid text provided.")

    candidate_task = asyncio.to_thread(extract_resume_data, final_raw_text)
    jd_task = asyncio.to_thread(parse_jd_requirements, role_name, job_description or "")

    results = await asyncio.gather(candidate_task, jd_task)
    candidate_profile = results[0]
    jd_rules = results[1]

    stage_1_result = await score_stage_1_math(candidate_profile, jd_rules, role_name)

    return {
        "stage": "fast_math",
        "role_fit_score": stage_1_result["base_score"],
        "scoring_breakdown": stage_1_result["math_result"]["breakdown"],
        "payload_for_stage_2": {
            "stage_1_result": stage_1_result,
            "jd_rules": jd_rules,
            "role_name": role_name
        }
    }


@app.post("/analyze/detailed")
async def analyze_detailed(request: Stage2Request):
    """
    STAGE 2: DEEP DIVE (LLM Analysis)
    Input: The 'payload_for_stage_2' returned by /analyze/fast.
    Returns: Interview Questions, Strengths, Weaknesses.
    Time: ~10-15 seconds.
    """
    final_result = await score_stage_2_qualitative(
        request.stage_1_result, 
        request.jd_rules, 
        request.role_name
    )
    
    return final_result

@app.post("/score")
async def calculate_score(request: ScoreRequest):
    jd_rules = await asyncio.to_thread(
        parse_jd_requirements, request.role_name, request.job_description
    )
    result = await score_candidate(request.candidate_data, jd_rules, request.role_name)
    return result


@app.post("/test-semantic")
async def test_semantic_matcher(request: SemanticTestRequest):
    try:
        jd_requirements = await asyncio.to_thread(
            parse_jd_requirements, request.role_name, request.job_description
        )
        semantic_result = await get_unified_analysis(
            request.candidate_data, jd_requirements, request.role_name
        )
        return {
            "success": True,
            "jd_requirements": jd_requirements,
            "semantic_analysis": semantic_result,
            "debug_info": {
                "candidate_jobs_count": len(request.candidate_data.get("work_experience", [])),
                "skill_categories_count": len(jd_requirements.get("skill_requirements", [])),
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/test-jd-parsing")
async def test_jd_parsing(request: JDParsingTestRequest):
    try:
        jd_requirements = await asyncio.to_thread(
            parse_jd_requirements, request.role_name, request.job_description
        )
        return {
            "success": True,
            "parsed_requirements": jd_requirements,
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/analyze")
async def analyze_resume(
    file: UploadFile | None = File(None),
    raw_text: str | None = Form(None),
    role_name: str = Form(...),
    job_description: str | None = Form(None),
):
    """
    Legacy monolithic endpoint. Runs both stages sequentially.
    """
    final_raw_text = ""
    if file:
        file_content = await file.read()
        filename = file.filename.lower()
        if filename.endswith(".pdf"):
            final_raw_text = await asyncio.to_thread(parse_pdf, file_content)
        elif filename.endswith(".docx"):
            final_raw_text = await asyncio.to_thread(parse_docx, file_content)
    elif raw_text:
        final_raw_text = raw_text

    if not final_raw_text:
        raise HTTPException(status_code=400, detail="No text provided.")

    candidate_task = asyncio.to_thread(extract_resume_data, final_raw_text)
    jd_task = asyncio.to_thread(parse_jd_requirements, role_name, job_description or "")

    results = await asyncio.gather(candidate_task, jd_task)
    candidate_profile = results[0]
    jd_rules = results[1]

    evaluation = await score_candidate(candidate_profile, jd_rules, role_name)

    return {
        "filename": "file",
        "candidate_profile": candidate_profile,
        "evaluation": evaluation,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)