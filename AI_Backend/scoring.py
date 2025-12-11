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
                {"role": "user", "content": prompt_content},
            ],
            response_format={"type": "json_object"},
            temperature=0,
            seed=42,
        )

        llm_result = json.loads(response.choices[0].message.content)

        # Ensure the final score is deterministic
        final_score = base_score
        qualitative_adjustment = llm_result.get("role_fit_score", final_score) - final_score
        
        result = {
            "reasoning_steps": llm_result.get("reasoning_steps", []),
            "role_fit_score": final_score,
            "confidence_score": 100,
            "scoring_breakdown": {
                "skill_match": math_result["breakdown"]["skill_match"],
                "experience_relevance": math_result["breakdown"]["experience_relevance"],
                "education_fit": math_result["breakdown"]["education_fit"],
                "certifications": math_result["breakdown"]["certifications"],
                "base_math_score": base_score,
                "qualitative_adjustment": qualitative_adjustment,
            },
            "key_strengths": llm_result.get("key_strengths", []),
            "potential_weaknesses": llm_result.get("potential_weaknesses", []),
            "missing_skills": llm_result.get("missing_skills", []),
            "recommended_interview_questions": llm_result.get("recommended_interview_questions", []),
            "bias_check_flag": llm_result.get("bias_check_flag", {}),
        }

        return result
        
    except Exception as e:
        print(f"scoring Error: {e}")
        return {"error": str(e)}




    
    
