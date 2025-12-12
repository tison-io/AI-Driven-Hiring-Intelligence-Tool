import os
import json
from openai import OpenAI
from dotenv import load_dotenv
from prompts import JD_PARSING_PROMPT

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def parse_jd_requirements(job_description: str, role_name: str):
    """
    Parses the job description to extract requirements.
    """
    try:
        context = f"Job Role: {role_name}\n"
        if job_description:
            context += f"Job Description:\n{job_description}"
        else:
            context += "Job Description: Not provided (Infer standard requirements)."

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": JD_PARSING_PROMPT},
                {"role": "user", "content": f"Parse job requirements and return JSON:\n{context}"}
            ],
            response_format={"type": "json_object"},
            temperature=0.0,
            max_tokens=1500
        )
        
        result = json.loads(response.choices[0].message.content)
        if "required_years" not in result:
            result["required_years"] = 0
        if "skill_requirements" not in result:
            result["skill_requirements"] = []
        if "required_degree" not in result:
            result["required_degree"] = ""
        if "required_certifications" not in result:
            result["required_certifications"] = []
        
        return result
        
    except Exception as e:
        print(f"Error parsing job description: {e}")
        return {
            "required_years": 0,
            "skill_requirements": [],
            "required_degree": "",
            "required_certifications": []
        }