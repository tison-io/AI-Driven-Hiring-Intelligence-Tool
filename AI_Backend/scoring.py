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
        jd_rules = parse_jd_requirements(job_description, role_name)
        math_result = calculate_math_score(candidate_data, jd_rules, job_description)
        base_score = math_result["base_score"]
        candidate_str = json.dumps(candidate_data)
        math_str = json.dumps(math_result)
        rules_str = json.dumps(jd_rules)

        prompt_content = f"""
        TARGET ROLE: {role_name}

        EXTRACTED SCORING RULES:
        {rules_str}

        CALCULATED MATH SCORE: {base_score}/100
        
        MATH BREAKDOWN:
        {math_str}

        CANDIDATE PROFILE (JSON):
        \"\"\"
        {candidate_str}
        \"\"\"

        INSTRUCTIONS:
        1. The Calculated Math Score is the baseline. 
        2. Your job is to determine the "Qualitative Adjustment" (-10 to +10).
        3. Do NOT ignore the math. Only adjust if the math missed context (e.g. gap years, weird career switch).
        """

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": SYSTEM_SCORING_PROMPT},
                {"role": "user", "content": prompt_content},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
        )

        llm_result = json.loads(response.choices[0].message.content)
        suggested_score = llm_result.get("role_fit_score", base_score)
        raw_adj = suggested_score - base_score
        final_adjustment = max(-10, min(10, raw_adj))
        final_score = base_score + final_adjustment
        final_score = max(0, min(100, final_score))
        confidence_score = calculate_confidence_score(candidate_data, llm_result)

        result = {
            "role_fit_score": int(final_score),
            "confidence_score": int(confidence_score),
            "reasoning_steps": llm_result.get("reasoning_steps", []),
            "scoring_breakdown": {
                **math_result["breakdown"],
                "base_math_score": int(base_score),
                "qualitative_adjustment": int(final_adjustment)
            },
            "key_strengths": llm_result.get("key_strengths", []),
            "potential_weaknesses": llm_result.get("potential_weaknesses", []),
            "missing_skills": llm_result.get("missing_skills", []),
            "recommended_interview_questions": llm_result.get("recommended_interview_questions", []),
            "bias_check_flag": llm_result.get("bias_check_flag", {"detected": False})
        }

        return result
        
    except Exception as e:
        print(f"Scoring Orchestrator Error: {e}")
        return {"error": str(e), "role_fit_score": 0}

def calculate_confidence_score(candidate_data: dict, llm_result: dict) -> int:
    """
    Calculates confidence based on Data Completeness and Bias.
    """
    present = 0
    if candidate_data.get("skills"): present += 1
    if candidate_data.get("work_experience"): present += 1
    if candidate_data.get("education"): present += 1
    
    if present == 3: comp_score = 100
    elif present == 2: comp_score = 85
    else: comp_score = 70
    bias_detected = llm_result.get("bias_check_flag", {}).get("detected", False)
    bias_score = 70 if bias_detected else 100
    return int((comp_score * 0.6) + (bias_score * 0.4))