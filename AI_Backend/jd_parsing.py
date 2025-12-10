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
        context=f"Job Role: {role_name}\n"
        if job_description:
            context += f"Job Description: {job_description}\n{job_description}"
        else:
            context += "Job Description: Not provided (Infer standard requirements)."

        response=client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                 {"role": "system", "content": JD_PARSING_PROMPT},
                {"role": "user", "content": context}
            ],
            response_format={"type": "json_object"},
            temperature=0.0
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Error parsing job description: {e}")
        return {
            "required_years": 0,
            "required_skills": [],
            "required_degree": "None",
            "required_certs_count": 0    
        }