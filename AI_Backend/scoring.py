import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

clientt=OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_SCORING_PROMPT="""
You are a "TalentScan AI," an expert Technical Recruiter.
Your task is to evaluate a candidate's structured profile against a Target Job Description.

### SCORING RULES (0-100):
- **90-100:** Perfect match. Exceeds requirements.
- **75-89:** Strong match. Meets core requirements with minor gaps.
- **60-74:** Moderate match. Missing some key skills or experience years.
-**<60:** Weak match. Significant skill gaps or irrelevant experience.

### INSTRUCTIONS:
1. **Chain of THought:** You must first analyze the candidate step-by-step in the 'reasoning_steps' array beofre assigning a score.
2. **Evidence-Based:** Every "stength" or "weakness" must include a 'source_quote' from the resume.
3. **Balanced Evaluation:** Highlight both strengths and weaknesses.
4. **Bias Check:** Check if evaluation if influenced by gender, ehnicity, university prestige and other non-technical factors. Flag if detected.
5. **Interview Questions:** Generate 3-10 technical questions targeting the candidate's specific skill gaps.

### OUTPUT SCHEMA:
{
  "reasonig_steps": [
    "step 1: Analyze experience vs JD...",
    "step 2: Compare tech stack..."
  ],
  "role_fit_score": number,
  "confidence_score": number,
  "scoring_breakdown": {
    "skill_match": number,
    "experience_relevance": number,
    "education_fit": number
  },
  "key_strengths": [
    {"strength": "string", "source_quote": "string"}
    ],
  "potential_weaknesses": [
    {"weakness": "string", "source_quote": "string"}
    ],
  "missing_skills": ["string"],
  "recommended_interview_questions": ["string"]'
  "bias_check_flag": {
    "detected": boolean,
    "flags": ["string"]
    }
}
"""

def score_candidate(candidate_data: dict, job_description: str, role_name: str):
    """
    Compares candidate JSON against JD text
    """
    try:
        candidate_str=json.dumps(candidate_data)

        prompt = f"""
        Target Job Role: {role_name}

        Target Job Description:
        \"\"\"
        {job_description}
        \"\"\"

        Candidate Profile (JSON):
        \"\"\"
        {candidate_str}
        \"\"\"
        """

        response = clientt.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_SCORING_PROMPT},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.2
        )

        return json.loads(response.choices[0].message.content)
        
    except Exception as e:
        print(f"scoring Error: {e}")
        return {"error": str(e)}




    
    
