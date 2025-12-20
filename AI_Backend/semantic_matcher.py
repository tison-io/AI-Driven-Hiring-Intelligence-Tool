import os
import json
from openai import OpenAI
from dotenv import load_dotenv
from langsmith.wrappers import wrap_openai
from prompts import SYSTEM_UNIFIED_ANALYSIS_PROMPT

load_dotenv()
client = wrap_openai(OpenAI(api_key=os.getenv("OPENAI_API_KEY")))


def get_unified_analysis(candidate_data, jd_requirements, role_name):
    """
    Performs a unified semantic analysis for both work experience and JD responsibilities.
    Handles experience relevance and responsibility match analysis.
    """
    try:
        primary_reqs = jd_requirements.get("primary_requirements", [])
        responsibilities = jd_requirements.get("responsibilities", [])

        items_to_analyze = primary_reqs if primary_reqs else responsibilities
        education_req = jd_requirements.get("education_requirement", {})

        user_content = f"""
TARGET ROLE: {role_name}

JOB RESPONSIBILITIES:
{json.dumps(items_to_analyze)}

EDUCATION REQUIREMENT:
{json.dumps(education_req)}

CANDIDATE PROFILE:
{json.dumps(candidate_data)}
"""

        if not items_to_analyze:
            prompt = f"The provided JD responsibilities are missing or vague. Infer standard industry requirements for a '{role_name}' role. Analyze semantic matches against these inferred requirements and return JSON analysis:\n{user_content}"
        else:
            prompt = f"Analyze semantic matches and return JSON analysis. Base your decision strictly on the provided text evidence:\n{user_content}"

        print("Calling OpenAI API...")
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": SYSTEM_UNIFIED_ANALYSIS_PROMPT},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.0,
            seed=42,
        )

        response_text = response.choices[0].message.content
        print(f"OpenAI Response Length: {len(response_text)} characters")
        print(f"Response Preview: {response_text[:200]}...")

        result = json.loads(response_text)

        exp_analysis = result.get("work_experience_analysis", [])
        print(f"Experience Analysis: {len(exp_analysis)} jobs analyzed")
        for item in exp_analysis:
            print(
                f"  Job {item.get('job_index')}: {item.get('job_title')} -> {item.get('relevance_level')}"
            )

        responsibility_analysis = result.get("responsibility_analysis", [])
        print(f"Responsibility Analysis: {len(responsibility_analysis)} items analyzed")
        for item in responsibility_analysis:
            print(f"  ID {item.get('responsibility_id')}: {item.get('match_level')}")

        print("=== SEMANTIC ANALYSIS END ===\n")
        return result

    except Exception as e:
        print("\n=== SEMANTIC ANALYSIS FAILED ===")
        return {
            "work_experience_analysis": [],
            "responsibility_analysis": [],
            "education_analysis": [],
        }
