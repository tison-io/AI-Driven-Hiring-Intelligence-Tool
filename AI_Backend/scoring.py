import os
import json
from openai import OpenAI
from dotenv import load_dotenv
from langsmith.wrappers import wrap_openai
from prompts import SYSTEM_SCORING_PROMPT 

from jd_parsing import parse_jd_requirements
from rb_scoring import calculate_math_score

load_dotenv()

client = wrap_openai(OpenAI(api_key=os.getenv("OPENAI_API_KEY")))

def score_candidate(candidate_data: dict, job_description: str, role_name: str):
    """
    Scoring Orchestrator.
    """
    try:
        jd_rules=parse_jd_requirements(job_description, role_name)
        math_result=calculate_math_score(candidate_data, jd_rules)
        base_score=math_result["base_score"]
        candidate_str=json.dumps(candidate_data)
        math_str=json.dumps(math_result)
        rules_str=json.dumps(jd_rules)


        prompt_content = f"""
        Target Role: {role_name}

        Extracted Scoring Rules:
        {rules_str}

        Calculated Math Score:
        {base_score}/100

        Math Breakdown:
        {math_str}

        Candidate Profile (JSON):
        \"\"\"
        {candidate_str}
        \"\"\"

        INSTRUCTIONS:
        The Math Score is the baseline.
        Review the candidate's soft skills and trajectory.
        Adjust the score only if the qualitative evidence implies that the math is misleading.
        """

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": SYSTEM_SCORING_PROMPT},
                {"role": "user", "content": prompt_content}
            ],
            response_format={"type": "json_object"},
            temperature=0,
            seed=42
        )

        result = json.loads(response.choices[0].message.content)
        
        # Fix confidence score if it's decimal (0.85 -> 85)
        if "confidence_score" in result and result["confidence_score"] < 1:
            result["confidence_score"] = int(result["confidence_score"] * 100)
            
        return result
        
    except Exception as e:
        print(f"scoring Error: {e}")
        return {"error": str(e)}




    
    
