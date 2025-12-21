import os
import json
from openai import OpenAI
from dotenv import load_dotenv
from langsmith.wrappers import wrap_openai
from prompts import JD_PARSING_PROMPT

load_dotenv()
client = wrap_openai(OpenAI(api_key=os.getenv("OPENAI_API_KEY")))

def parse_jd_requirements(role_name: str, job_description: str):
    """
    Parses the job description to extract atomic responsibilities, 
    education, certifications, and required experience.
    """
    try:
        context = f"Job Role: {role_name}\n"
        if job_description:
            context += f"Job Description:\n{job_description}"
        else:
            context += "Job Description: Not provided (Infer standard requirements)."

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": JD_PARSING_PROMPT},
                {"role": "user", "content": f"Parse job requirements and return JSON:\n{context}"}
            ],
            response_format={"type": "json_object"},
            temperature=0.0,
        )

        result = json.loads(response.choices[0].message.content)

        if "required_years" not in result:
            result["required_years"] = 0
        if "responsibilities" not in result:
            result["responsibilities"] = []
        if "education_requirement" not in result:
            result["education_requirement"] = {"required_level": "", "valid_majors": []}
        if "required_certifications" not in result:
            result["required_certifications"] = []

        return result

    except Exception as e:
        print(f"Error parsing job description: {e}")
        return {
            "required_years": 0,
            "responsibilities": [],
            "education_requirement": {"required_level": "", "valid_majors": []},
            "required_certifications": []
        }
