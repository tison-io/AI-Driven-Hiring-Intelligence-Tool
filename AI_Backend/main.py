import asyncio
from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import BaseModel
import uvicorn
from fastapi import Request
import json

from graph import app_graph
from parsing import parse_pdf, parse_docx

app = FastAPI(title="TalentScan AI Backend (LangGraph)")

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

origins = [
    "https://scan-ai-six.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextRequest(BaseModel):
    text: str

@app.get("/")
async def health_check():
    return {"status": "AI Agent System is Running"}

@app.post("/analyze/graph")
@limiter.limit("5/minute")
async def analyze_with_graph(
    request: Request,
    file: UploadFile | None = File(None),
    raw_text: str | None = Form(None),
    job_description: str = Form(...),
    role_name: str = Form(...)
):

    resume_text = ""
    if file:
        content = await file.read()
        filename = file.filename.lower()
        if filename.endswith(".pdf"):
            resume_text = await asyncio.to_thread(parse_pdf, content)
        elif filename.endswith(".docx"):
            resume_text = await asyncio.to_thread(parse_docx, content)
        else:
            raise HTTPException(400, "Invalid file type. Use PDF or DOCX.")
    elif raw_text:
        resume_text = raw_text
    
    if not resume_text:
        raise HTTPException(400, "No resume text provided.")

    initial_state = {
        "resume_text": resume_text,
        "job_description_text": job_description,
        "role_name": role_name,
        "candidate_profile": {},
        "extracted_scoring_rules": {},
        "jd_role_alignment": {},
        "tech_evaluation": {},
        "experience_evaluation": {},
        "culture_evaluation": {},
        "candidate_feedback": {},
        "final_evaluation": {}
    }

    print(f"--- STARTING EVALUATION FOR: {role_name} ---")
    try:
        final_state = await app_graph.ainvoke(initial_state)

        return {
            "success": True,
            "role": role_name,
            "final_score": final_state["final_evaluation"].get("final_score", 0),
            "recommendation": final_state.get("candidate_feedback", {}).get("recommendation", "Maybe"),
            "summary": final_state["final_evaluation"],
            "agent_reports": {
                "competency_agent": final_state["tech_evaluation"],
                "experience_agent": final_state["experience_evaluation"],
                "behavioral_agent": final_state["culture_evaluation"]
            },
            "parsed_profile": final_state["candidate_profile"],
            "candidate_feedback": final_state.get("candidate_feedback", {})
        }
    except Exception as e:
        print(f"Graph Execution Error: {e}")
        raise HTTPException(500, f"Analysis failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)