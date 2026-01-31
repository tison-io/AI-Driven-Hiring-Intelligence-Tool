import json
import os
from datetime import datetime
from langchain_openai import ChatOpenAI
import dotenv
from langchain_core.output_parsers import JsonOutputParser

from states import AgentState
from prompts import (
    RESUME_EXTRACTION_PROMPT,
    JD_PARSING_PROMPT,
    COMPETENCY_EVAL_PROMPT,
    EXP_EVAL_PROMPT,
    CULTURE_EVAL_PROMPT,
    AGGREGATOR_PROMPT,
)

dotenv.load_dotenv()
client=os.getenv("OPENAI_API_KEY")

llm=ChatOpenAI(model="gpt-4o-mini", temperature=0)

def log_stage(stage_name: str, data: dict, is_output: bool = False):
    separator = "=" * 60
    direction = "OUTPUT" if is_output else "INPUT"
    print(f"\n{separator}")
    print(f"[{stage_name}] {direction}")
    print(separator)
    print(json.dumps(data, indent=2, default=str))
    print(separator + "\n")

def calculate_total_years(work_experience: list, current_date: datetime) -> float:
    print("\n" + "=" * 60)
    print("[EXPERIENCE CALCULATION DEBUG]")
    print("=" * 60)
    print(f"Current Date: {current_date.strftime('%Y-%m-%d')}")
    print("-" * 60)
    
    total_months = 0
    for exp in work_experience:
        company = exp.get("company", "Unknown")
        title = exp.get("job_title", "Unknown")
        start_str = exp.get("start_date", "")
        end_str = exp.get("end_date", "")
        
        try:
            start_date = datetime.strptime(start_str, "%Y-%m")
        except:
            print(f"  WARNING: Could not parse start_date '{start_str}' for {company}")
            continue
        
        if end_str.lower() == "present":
            end_date = current_date
        else:
            try:
                end_date = datetime.strptime(end_str, "%Y-%m")
            except:
                print(f"  WARNING: Could not parse end_date '{end_str}' for {company}")
                continue
        
        months = (end_date.year - start_date.year) * 12 + (end_date.month - start_date.month)
        years = months / 12
        total_months += months
        
        print(f"  {title} @ {company}")
        print(f"    Start: {start_str} | End: {end_str} | Duration: {months} months ({years:.2f} years)")
    
    total_years = total_months / 12
    print("-" * 60)
    print(f"TOTAL: {total_months} months = {total_years:.2f} years")
    print("=" * 60 + "\n")
    
    return total_years

def extract_resume_node(state: AgentState):
    print("STAGE: RESUME EXTRACTION")
    
    log_stage("RESUME_EXTRACTION", {
        "resume_text_length": len(state.get("resume_text", "")),
        "resume_text_preview": state.get("resume_text", "")[:500] + "..." if len(state.get("resume_text", "")) > 500 else state.get("resume_text", "")
    }, is_output=False)

    chain=RESUME_EXTRACTION_PROMPT | llm | JsonOutputParser()

    try:
        result=chain.invoke({"resume_text": state["resume_text"]})
        
        work_experience = result.get("work_experience", [])
        if work_experience:
            calculated_years = calculate_total_years(work_experience, datetime.now())
            result["total_years_experience"] = round(calculated_years, 2)
            print(f"[RESUME_EXTRACTION] Overriding total_years_experience with calculated value: {calculated_years:.2f}")
        
        log_stage("RESUME_EXTRACTION", result, is_output=True)
        return {"candidate_profile": result}
    except Exception as e:
        error_result = {"error": str(e), "candidate_profile": {}}
        log_stage("RESUME_EXTRACTION_ERROR", error_result, is_output=True)
        return {"candidate_profile": {}}

def parse_jd_node(state: AgentState):
    print("STAGE: JD PARSING")
    
    log_stage("JD_PARSING", {
        "job_description_length": len(state.get("job_description_text", "")),
        "job_description_preview": state.get("job_description_text", "")[:500] + "..." if len(state.get("job_description_text", "")) > 500 else state.get("job_description_text", "")
    }, is_output=False)

    chain=JD_PARSING_PROMPT | llm | JsonOutputParser()

    try:
        result=chain.invoke({"job_description_text": state["job_description_text"]})
        target_role=result.get("role_title", "Candidate")
        log_stage("JD_PARSING", result, is_output=True)
        return{
            "extracted_scoring_rules": result,
            "target_role": target_role
        }
    except Exception as e:
        error_result = {"error": str(e)}
        log_stage("JD_PARSING_ERROR", error_result, is_output=True)
        return {"extracted_scoring_rules": {}}

def tech_agent_node(state: AgentState):
    print("STAGE: TECH/COMPETENCY AGENT")
    candidate = state.get("candidate_profile", {})
    jd = state.get("extracted_scoring_rules", {})
    
    input_data = {
        "role_name": state["role_name"],
        "jd_skills": jd.get("primary_requirements", []),
        "candidate_skills": candidate.get("skills", []),
        "candidate_evidence": candidate.get("capability_evidence", []),
        "candidate_education": candidate.get("education", []),
        "candidate_certifications": candidate.get("certifications", [])
    }
    log_stage("TECH_AGENT", input_data, is_output=False)
    
    combined_evidence = {
        "work_evidence": candidate.get("capability_evidence", []),
        "education": candidate.get("education", []),
        "certifications": candidate.get("certifications", [])
    }
    
    chain = COMPETENCY_EVAL_PROMPT | llm | JsonOutputParser()
    try:
        result = chain.invoke({
            "role_name": state["role_name"],
            "jd_skills": json.dumps(jd.get("primary_requirements", [])),
            "candidate_skills": json.dumps(candidate.get("skills", [])),
            "candidate_evidence": json.dumps(combined_evidence)
        })
        log_stage("TECH_AGENT", result, is_output=True)
        return {"tech_evaluation": result}
    except Exception as e:
        error_result = {"score": 0, "reasoning": str(e), "error": True}
        log_stage("TECH_AGENT_ERROR", error_result, is_output=True)
        return {"tech_evaluation": {"score": 0, "reasoning": str(e)}}


def experience_agent_node(state: AgentState):
    print("STAGE: EXPERIENCE AGENT")
    candidate = state.get("candidate_profile", {})
    jd = state.get("extracted_scoring_rules", {})
    work_experience = candidate.get("work_experience", [])
    current_dt = datetime.now()
    calculated_years = calculate_total_years(work_experience, current_dt)
    
    input_data = {
        "role_name": state["role_name"],
        "jd_experience_rules": {
            "required_years": jd.get("required_years"),
            "education_requirement": jd.get("education_requirement")
        },
        "candidate_experience": candidate.get("work_experience", []),
        "candidate_education": candidate.get("education", []),
        "calculated_total_years": calculated_years  # Added for visibility
    }
    log_stage("EXPERIENCE_AGENT", input_data, is_output=False)
    
    chain = EXP_EVAL_PROMPT | llm | JsonOutputParser()
    current_date = current_dt.strftime("%Y-%m-%d")
    try:
        result = chain.invoke({
            "role_name": state["role_name"],
            "current_date": current_date,
            "total_years_calculated": calculated_years,
            "jd_experience_rules": json.dumps(jd),
            "candidate_experience": json.dumps(candidate.get("work_experience", [])),
            "candidate_education": json.dumps(candidate.get("education", [])) 
        })
        log_stage("EXPERIENCE_AGENT", result, is_output=True)
        return {"experience_evaluation": result}
    except Exception as e:
        error_result = {"score": 0, "reasoning": str(e), "error": True}
        log_stage("EXPERIENCE_AGENT_ERROR", error_result, is_output=True)
        return {"experience_evaluation": {"score": 0, "reasoning": str(e)}}

def culture_agent_node(state: AgentState):
    print("STAGE: CULTURE/BEHAVIORAL AGENT")
    candidate = state.get("candidate_profile", {})
    jd = state.get("extracted_scoring_rules", {})
    
    input_data = {
        "jd_responsibilities": jd.get("responsibilities", []),
        "candidate_summary": candidate.get("summary", ""),
        "candidate_evidence_count": len(candidate.get("capability_evidence", []))
    }
    log_stage("CULTURE_AGENT", input_data, is_output=False)
    
    chain = CULTURE_EVAL_PROMPT | llm | JsonOutputParser()
    try:
        result = chain.invoke({
            "jd_responsibilities": json.dumps(jd.get("responsibilities", [])),
            "candidate_summary": candidate.get("summary", ""),
            "candidate_evidence": json.dumps(candidate.get("capability_evidence", []))
        })
        log_stage("CULTURE_AGENT", result, is_output=True)
        return {"culture_evaluation": result}
    except Exception as e:
        error_result = {"score": 0, "reasoning": str(e), "error": True}
        log_stage("CULTURE_AGENT_ERROR", error_result, is_output=True)
        return {"culture_evaluation": {"score": 0, "reasoning": str(e)}}

def aggregator_node(state: AgentState):
    print("STAGE: FINAL AGGREGATOR")
    
    jd = state.get("extracted_scoring_rules", {})
    jd_requirements = jd.get("primary_requirements", [])
    jd_responsibilities = jd.get("responsibilities", [])
    if len(jd_requirements) >= 5:
        evaluation_criteria = jd_requirements
        criteria_source = "requirements_only"
    else:
        evaluation_criteria = jd_requirements + jd_responsibilities
        criteria_source = "requirements_and_responsibilities"
    
    input_data = {
        "role_name": state["role_name"],
        "tech_eval_score": state.get("tech_evaluation", {}).get("score"),
        "experience_eval_score": state.get("experience_evaluation", {}).get("score"),
        "culture_eval_score": state.get("culture_evaluation", {}).get("score"),
        "jd_requirements_count": len(jd_requirements),
        "jd_responsibilities_count": len(jd_responsibilities),
        "evaluation_criteria_count": len(evaluation_criteria),
        "criteria_source": criteria_source
    }
    log_stage("AGGREGATOR", input_data, is_output=False)
    
    print("FULL AGENT REPORTS")
    log_stage("TECH_EVAL_FULL", state.get("tech_evaluation", {}), is_output=False)
    log_stage("EXPERIENCE_EVAL_FULL", state.get("experience_evaluation", {}), is_output=False)
    log_stage("CULTURE_EVAL_FULL", state.get("culture_evaluation", {}), is_output=False)
    
    chain = AGGREGATOR_PROMPT | llm | JsonOutputParser()
    try:
        result = chain.invoke({
            "role_name": state["role_name"],
            "evaluation_criteria": json.dumps(evaluation_criteria),
            "criteria_count": len(evaluation_criteria),
            "tech_eval": json.dumps(state.get("tech_evaluation")),
            "exp_eval": json.dumps(state.get("experience_evaluation")),
            "culture_eval": json.dumps(state.get("culture_evaluation"))
        })
        log_stage("AGGREGATOR", result, is_output=True)
        return {"final_evaluation": result}
    except Exception as e:
        error_result = {"final_score": 0, "final_reasoning": str(e), "error": True}
        log_stage("AGGREGATOR_ERROR", error_result, is_output=True)
        return {"final_evaluation": {"final_score": 0, "final_reasoning": str(e)}}
        return {"final_evaluation": {"final_score": 0, "final_reasoning": str(e)}}