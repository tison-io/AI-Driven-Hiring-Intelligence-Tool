import os
import json
from openai import OpenAI
from dotenv import load_dotenv
from langsmith.wrappers import wrap_openai

from prompts import SYSTEM_SCORING_PROMPT
from jd_parsing import parse_jd_requirements
from semantic_matcher import get_semantic_analysis
from rb_scoring import calculate_math_score, normalize_text

load_dotenv()
client = wrap_openai(OpenAI(api_key=os.getenv("OPENAI_API_KEY")))


def ensure_consistent_skills(candidate_data: dict) -> dict:
    """Normalization helper."""
    existing_skills = candidate_data.get("skills", [])
    normalized_skills = []
    for skill in existing_skills:
        normalized = normalize_text(skill)
        if normalized and normalized not in normalized_skills:
            normalized_skills.append(normalized)

    normalized_skills.sort()
    candidate_data["skills"] = normalized_skills
    candidate_data["flat_skills_list"] = normalized_skills
    return candidate_data


def calculate_confidence_score(candidate_data: dict, llm_result: dict) -> int:
    present = 0
    if candidate_data.get("skills"):
        present += 1
    if candidate_data.get("work_experience"):
        present += 1
    if candidate_data.get("education"):
        present += 1

    if present == 3:
        comp_score = 100
    elif present == 2:
        comp_score = 85
    else:
        comp_score = 70

    bias_detected = llm_result.get("bias_check_flag", {}).get("detected", False)
    bias_score = 70 if bias_detected else 100

    return int((comp_score * 0.6) + (bias_score * 0.4))


def score_candidate(candidate_data: dict, job_description: str, role_name: str):
    try:
        jd_rules = parse_jd_requirements(job_description, role_name)
        candidate_data = ensure_consistent_skills(candidate_data)
        print("DEBUG: Running Semantic Analysis...")
        semantic_analysis = get_semantic_analysis(candidate_data, jd_rules, role_name)
        math_result = calculate_math_score(
            candidate_data, jd_rules, semantic_analysis, role_name
        )

        final_score = math_result["base_score"]
        years = candidate_data.get("total_years_experience", 0) or 0
        if years <= 2:
            exp_context = "Junior (0-2 years)"
        elif years <= 6:
            exp_context = "Mid-Level (3-6 years)"
        else:
            exp_context = "Senior/Lead (7+ years)"
        candidate_str = json.dumps(candidate_data)
        math_str = json.dumps(math_result)
        rules_str = json.dumps(jd_rules)

        prompt_content = f"""
        TARGET ROLE: {role_name}
        CANDIDATE EXPERIENCE: {exp_context}

        EXTRACTED SCORING RULES:
        {rules_str}

        FINAL MATH SCORE: {final_score}/100
        
        MATH BREAKDOWN:
        {math_str}

        CANDIDATE PROFILE (JSON):
        \"\"\"
        {candidate_str}
        \"\"\"

        INSTRUCTIONS:
        1. The Score is {final_score}. Do NOT adjust it.
        2. Explain WHY the score is {final_score} based on the Breakdown.
        3. If Score < 100, identify the specific missing skills or certifications.
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

        result = {
            "role_fit_score": int(final_score),
            "confidence_score": int(
                calculate_confidence_score(candidate_data, llm_result)
            ),
            "reasoning_steps": llm_result.get("reasoning_steps", []),
            "scoring_breakdown": {
                **math_result["breakdown"],
                "base_math_score": int(final_score),
            },
            "key_strengths": llm_result.get("key_strengths", []),
            "potential_weaknesses": llm_result.get("potential_weaknesses", []),
            "missing_skills": llm_result.get("missing_skills", []),
            "recommended_interview_questions": llm_result.get(
                "recommended_interview_questions", []
            ),
            "bias_check_flag": llm_result.get("bias_check_flag", {"detected": False}),
        }

        return result

    except Exception as e:
        print(f"Scoring Error: {e}")
        return {"role_fit_score": 0, "error": str(e), "scoring_breakdown": {}}
