import os
import json
from openai import OpenAI
from langsmith.wrappers import wrap_openai
from dotenv import load_dotenv
from prompts import SEMANTIC_MATCH_PROMPT

load_dotenv()
client =wrap_openai(OpenAI(api_key=os.getenv("OPENAI_API_KEY")))

def get_semantic_analysis(candidate_data, jd_requirements, role_name):
    """
    Semantically mapping the candidate to the requirements.
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
            model="gpt-4o",
            messages=[
                {"role": "system", "content": SEMANTIC_MATCH_PROMPT},
                {"role": "user", "content": f"Analyze semantic matches and return JSON analysis:\n{user_content}"}
            ],
            response_format={"type": "json_object"},
            temperature=0.0,
        )

        return json.loads(response.choices[0].message.content)

    except Exception as e:
        print(f"Semantic Analysis Failed: {e}")
        return {relevant_work_experience: [], skill_analysis: []}