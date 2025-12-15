import os
import json
from openai import OpenAI
from langsmith.wrappers import wrap_openai
from dotenv import load_dotenv
from prompts import SYSTEM_UNIFIED_ANALYSIS_PROMPT

load_dotenv()
client =wrap_openai(OpenAI(api_key=os.getenv("OPENAI_API_KEY")))

def get_unified_analysis(candidate_data, jd_requirements, role_name):
    """
    Performs a unified semantic analysis for both work experience and skills.
    """
    try:
        user_content = f"""
        TARGET ROLE: {role_name}

        JOB_REQUIREMENTS:
        {json.dumps(jd_requirements)}

        CANDIDATE PROFILE:
        {json.dumps(candidate_data)}
        """

        response=client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_UNIFIED_ANALYSIS_PROMPT},
                {"role": "user", "content": f"Analyze semantic matches and return JSON analysis:\n{user_content}"}
            ],
            response_format={"type": "json_object"},
            temperature=0.0,
        )

        return json.loads(response.choices[0].message.content)

    except Exception as e:
        print(f"Unified Analysis Failed: {e}")
        return {
            "work_experience_analysis": [],
            "skill_analysis": []
        }