from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="TalentScan AI Backend")


class ResumeRequest(BaseModel):
    text: str


@app.get("/")
def health_check():
    return {"status": "AI Backend is running"}


@app.post("/analyze/resume")
def analyze_resume(request: ResumeRequest):
    return {"message": "Resume received.", "length": len(request.text)}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
