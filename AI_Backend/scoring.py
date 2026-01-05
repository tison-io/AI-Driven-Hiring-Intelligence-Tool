import os
import json
from openai import AsyncOpenAI
from dotenv import load_dotenv
from langsmith.wrappers import wrap_openai

from prompts import SYSTEM_SCORING_PROMPT
from jd_parsing import parse_jd_requirements
from semantic_matcher import get_unified_analysis
from rb_scoring import calculate_math_score, normalize_text

load_dotenv()
client = wrap_openai(AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY")))


def ensure_consistent_skills(candidate_data: dict) -> dict:
    """Normalizes and deduplicates skills."""
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

    bias_info = llm_result.get("bias_check_flag", {})
    bias_detected = bias_info.get("detected", False)
    bias_flags = bias_info.get("flags", [])

    bias_score = 100
    if bias_detected:
        if any("jd-role mismatch" in flag.lower() for flag in bias_flags):
            bias_score = 0
        else:
            bias_score = 70

    return int((comp_score * 0.6) + (bias_score * 0.4))

async def score_stage_1_math(candidate_data: dict, jd_rules: dict, role_name: str) -> dict:
    """
    Executes the deterministic, logic-based scoring (Semantic + Math).
    """
    try:
        candidate_data = ensure_consistent_skills(candidate_data)
        print("DEBUG: Running Unified Analysis (Stage 1)...")

        unified_analysis = await get_unified_analysis(
            candidate_data, jd_rules, role_name
        )

        math_result = calculate_math_score(
            candidate_data, jd_rules, unified_analysis, role_name
        )

        return {
            "candidate_data": candidate_data,
            "unified_analysis": unified_analysis,
            "math_result": math_result,
            "base_score": math_result["base_score"]
        }
    except Exception as e:
        print(f"Stage 1 Error: {e}")
        raise e

async def score_stage_2_qualitative(stage_1_result: dict, jd_rules: dict, role_name: str) -> dict:
    """
    Executes the LLM analysis based on Stage 1 data.
    """
    try:
        final_score = stage_1_result["base_score"]
        math_result = stage_1_result["math_result"]
        unified_analysis = stage_1_result["unified_analysis"]
        candidate_data = stage_1_result["candidate_data"]

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
        analysis_str = json.dumps(unified_analysis)

        prompt_content = f"""
        TARGET ROLE: {role_name}
        CANDIDATE EXPERIENCE: {exp_context}

        EXTRACTED SCORING RULES:
        {rules_str}

        FINAL MATH SCORE: {final_score}/100
        
        MATH BREAKDOWN:
        {math_str}

        SEMANTIC ANALYSIS:
        {analysis_str}

        CANDIDATE PROFILE (JSON):
        \"\"\"
        {candidate_str}
        \"\"\"

        INSTRUCTIONS:
        1. The Score is {final_score}. Do NOT adjust it.
        2. Explain WHY the score is {final_score} based on the Breakdown.
        3. If Score < 100, identify the specific missing skills or certifications, or any potential gaps.
        4. List ALL strengths and weaknesses exhaustively.
            - CRITICAL: Check 'flat_skills_list', 'certifications', and 'SEMANTIC ANALYSIS' before declaring a gap.
        5. Generate at least 7 interview questions.
        """

        response = await client.chat.completions.create(
            model="gpt-4o-mini",
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
        print(f"Stage 2 Error: {e}")
        return {
            "role_fit_score": stage_1_result.get("base_score", 0),
            "error": str(e),
            "scoring_breakdown": stage_1_result.get("math_result", {}).get("breakdown", {})
        }


async def score_candidate(candidate_data: dict, jd_rules: dict, role_name: str):
    """
    Orchestrates the entire scoring process.
    """
    try:
        stage_1_results = await score_stage_1_math(candidate_data, jd_rules, role_name)
        
        final_result = await score_stage_2_qualitative(stage_1_results, jd_rules, role_name)
        
        return final_result

    except Exception as e:
        print(f"Scoring Error: {e}")
        return {"role_fit_score": 0, "error": str(e), "scoring_breakdown": {}}