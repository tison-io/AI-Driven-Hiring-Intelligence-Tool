import os
import json
from openai import OpenAI
from dotenv import load_dotenv
from prompts import SYSTEM_EXTRACTION_PROMPT

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def extract_resume_data(raw_text: str):
    """
    Sends raw text to GPT to get a structured JSON.
    """
    if not raw_text:
        return {"error": "No text provided"}

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": SYSTEM_EXTRACTION_PROMPT},
                {"role": "user", "content": f"Extract resume data and return as JSON:\n{raw_text}"}
            ],
            response_format={"type": "json_object"},
            temperature=0.0,
            max_tokens=2000
        )

        data = json.loads(response.choices[0].message.content)
        skills = data.get("skills", [])
        if skills:
            if isinstance(skills, dict):
                flat_skills = []
                for category, skill_list in skills.items():
                    if isinstance(skill_list, list):
                        flat_skills.extend(skill_list)
                data["skills"] = flat_skills
            elif isinstance(skills, list):
                data["skills"] = skills
        data["flat_skills_list"] = data.get("skills", [])
        
        if "is_valid_resume" not in data:
            data["is_valid_resume"] = True
        if "candidate_name" not in data:
            data["candidate_name"] = "Anonymous"
        if "total_years_experience" not in data:
            data["total_years_experience"] = 0
        
        return data
        
    except Exception as e:
        print(f"LLM Extraction Error: {e}")
        return {
            "error": str(e),
            "is_valid_resume": False,
            "candidate_name": "Error",
            "skills": [],
            "flat_skills_list": []
        }