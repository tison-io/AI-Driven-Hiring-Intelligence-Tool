import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_EXTRACTION_PROMPT="""
You are an expert AI Resume Parser. Your goal is to extract structured data from a resume with 100% precision.
You must output a valid JSON object matching the schema below.

### RULES:
1. **Dates:** Normalize all dates to "YYYY-MM" format. If a candidate is currently working, use "Present" as the end date.
2. **PII Readaction:** You must identify if the input text contains explicit PII like phone, email, and address. If found DO NOT output the values. Set 'contact_info_redacted' to true.
3. **Experience:** If specific dates are missing, estimate duration based on context or leave null.
4. **Skills:** Extract skills listed in a "Skills" section, BUT ALSO infer technical skills mentioned in the work experience descriptions.
5. **Validation:** Always try to extract data. Only return 'is_valid_resume: false' if the text is completely empty or clearly not a resume (like random characters).

### OUTPUT SCHEMA:
{
  "is_valid_resume": boolean,
  "candidate_name": "string (or 'Anonymous')",
  "contact_info_redacted": boolean,
  "summary": "string",
  "total_years_experience": number,
  "skills": ["string", "string"],
  "work_experience": [
    {
    "company": "string",
    "job_title": "string",
    "start_date": "YYYY-MM",
    "end_date": "YYYY-MM",
    "description": "string (summarized bullet points)",
    "technologies_used": ["string"]
    }
  ],
  "education": [
    {
    "institution": "string",
    "degree": "string",
    "year_graduated": "YYYY"
    }
  ],
  "certifications": ["string"]
}
"""

def extract_resume_data(raw_text: str):
    """
    Sends raw text to GPT to get a structured JSON.
    """
    if not raw_text:
        return {"error": "No text provided"}

    try:
        response=client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_EXTRACTION_PROMPT},
                {"role": "user", "content": f"Resume Text:\n{raw_text}"}
            ],
            response_format={"type": "json_object"},
            temperature=0.0
        )

        return json.loads(response.choices[0].message.content)

    except Exception as e:
        print(f"LLM Extraction Error: {e}")
        return {"error": str(e)}


