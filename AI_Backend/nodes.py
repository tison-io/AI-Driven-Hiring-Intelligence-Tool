import json
import os
import re
from datetime import datetime
from langchain_groq import ChatGroq  # Changed from langchain_openai
import dotenv
from langchain_core.output_parsers import JsonOutputParser

from states import AgentState
from prompts import (
    RESUME_EXTRACTION_PROMPT,
    JD_PARSING_PROMPT,
    JD_ROLE_ALIGNMENT_PROMPT,
    COMPETENCY_EVAL_PROMPT,
    EXP_EVAL_PROMPT,
    CULTURE_EVAL_PROMPT,
    AGGREGATOR_PROMPT,
    FEEDBACK_GENERATION_PROMPT,
)

dotenv.load_dotenv()

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0,
    groq_api_key=os.getenv("GROQ_API_KEY")
)

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
        
        if not result.get("is_valid_resume", True):
            print("[RESUME_EXTRACTION] Warning: Document may not be a valid resume")
            log_stage("RESUME_EXTRACTION_WARNING", {"is_valid_resume": False}, is_output=True)
        
        work_experience = result.get("work_experience", [])
        if work_experience:
            calculated_years = calculate_total_years(work_experience, datetime.now())
            result["total_years_experience"] = round(calculated_years, 2)
            print(f"[RESUME_EXTRACTION] Overriding total_years_experience with calculated value: {calculated_years:.2f}")
        
        years = result.get("total_years_experience", 0)
        try:
            years = float(years) if years is not None else 0
        except (TypeError, ValueError):
            years = 0
        result["total_years_experience"] = years
        if years <= 2:
            result["experience_level"] = "Entry"
        elif years <= 5:
            result["experience_level"] = "Mid"
        else:
            result["experience_level"] = "Senior"
        print(f"[RESUME_EXTRACTION] Experience level: {result['experience_level']} ({years} years)")
        
        candidate_name = result.get("candidate_name", "")
        if candidate_name and isinstance(candidate_name, str):
            result["first_name"] = candidate_name.split()[0] if candidate_name.split() else ""
        else:
            result["first_name"] = ""
        
        email = result.get("email")
        if email and isinstance(email, str):
            email = email.strip().lower()
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            
            format_valid = bool(re.match(email_pattern, email))
            
            if format_valid:
                local_part, domain = email.rsplit('@', 1)
                domain_name = domain.rsplit('.', 1)[0] if '.' in domain else domain
                
                fake_domains = {'xxx', 'yyy', 'zzz', 'abc', 'test', 'example', 'fake', 
                               'dummy', 'temp', 'placeholder', 'domain', 'email', 'mail'}
                
                fake_local = {'sample', 'test', 'demo', 'fake', 'placeholder', 'yourname',
                             'myemail', 'noreply', 'user', 'name', 'email', 'example'}
                
                is_fake = False
                if domain_name in fake_domains:
                    is_fake = True
                    print(f"[RESUME_EXTRACTION] Suspicious domain detected: {domain}")
                
                if local_part in fake_local:
                    is_fake = True
                    print(f"[RESUME_EXTRACTION] Suspicious email pattern: {local_part}")
                
                if re.match(r'^(.)\1{2,}', domain_name) or re.match(r'^(.)\1{2,}', local_part):
                    is_fake = True
                    print(f"[RESUME_EXTRACTION] Repeated character pattern detected: {email}")
                
                tld = domain.rsplit('.', 1)[-1] if '.' in domain else ''
                has_valid_tld = bool(tld) and tld.isalpha() and len(tld) >= 2
                if not has_valid_tld:
                    is_fake = True
                    print(f"[RESUME_EXTRACTION] Invalid domain TLD: {domain}")
                
                result["email_valid"] = not is_fake
                result["email"] = email
                
                if is_fake:
                    print(f"[RESUME_EXTRACTION] Warning: Placeholder/fake email detected: {email}")
            else:
                result["email_valid"] = False
                print(f"[RESUME_EXTRACTION] Warning: Invalid email format: {email}")
        else:
            result["email_valid"] = False
            result["email"] = None
        
        if not result.get("phone_number"):
            result["phone_number"] = None
        
        confidence = result.get("extraction_confidence", {})
        if isinstance(confidence, dict):
            for field in ["email", "phone", "experience"]:
                val = confidence.get(field)
                if isinstance(val, (int, float)) and val > 1:
                    confidence[field] = round(val / 100, 2)
                    print(f"[RESUME_EXTRACTION] Normalized {field} confidence: {val} -> {confidence[field]}")
            result["extraction_confidence"] = confidence
        
        action_words = {"and", "the", "for", "with", "managed", "developed", "created", "built",
                        "designed", "implemented", "supported", "maintained", "led", "coordinated",
                        "responsible", "worked", "collaborated", "ensured", "conducted", "optimized"}
        for exp in result.get("work_experience", []):
            desc = (exp.get("description") or "").strip()
            if desc and len(desc.split()) < 6:
                desc_words = set(desc.lower().split())
                has_action_words = bool(desc_words & action_words)
                if not has_action_words:
                    print(f"[RESUME_EXTRACTION] Warning: Description looks like a title, clearing: '{desc}'")
                    exp["description"] = ""
        
        if not result.get("current_position") and work_experience:
            for exp in work_experience:
                if (exp.get("end_date") or "").lower() == "present":
                    result["current_position"] = exp.get("job_title")
                    break
            if not result.get("current_position") and work_experience:
                result["current_position"] = work_experience[0].get("job_title")
        
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

def jd_role_alignment_node(state: AgentState):
    print("STAGE: JD-ROLE ALIGNMENT CHECK")
    
    jd = state.get("extracted_scoring_rules", {})
    role_name = state.get("role_name", "")
    
    primary_requirements = jd.get("primary_requirements") or []
    responsibilities = jd.get("responsibilities") or []
    
    original_jd_text = state.get("job_description_text", "")
    jd_word_count = len(original_jd_text.split())
    jd_is_vague_by_length = jd_word_count < 50  # Less than 50 words = vague JD
    jd_is_vague_by_content = len(primary_requirements) < 3 and len(responsibilities) < 3
    jd_is_vague = jd_is_vague_by_length or jd_is_vague_by_content
    
    if jd_is_vague:
        vague_reason = []
        if jd_is_vague_by_length:
            vague_reason.append(f"JD too short ({jd_word_count} words, need 50+)")
        if jd_is_vague_by_content:
            vague_reason.append(f"Too few explicit requirements ({len(primary_requirements)} reqs, {len(responsibilities)} resps)")
        print(f"[JD_ROLE_ALIGNMENT] JD flagged as vague: {', '.join(vague_reason)}")
    
    input_data = {
        "role_name": role_name,
        "jd_requirements_count": len(primary_requirements),
        "jd_responsibilities_count": len(responsibilities),
        "jd_is_vague": jd_is_vague
    }
    log_stage("JD_ROLE_ALIGNMENT", input_data, is_output=False)
    
    chain = JD_ROLE_ALIGNMENT_PROMPT | llm | JsonOutputParser()
    
    try:
        result = chain.invoke({
            "role_name": role_name,
            "jd_requirements": json.dumps(primary_requirements),
            "jd_responsibilities": json.dumps(responsibilities)
        })
        
        result["jd_is_vague"] = jd_is_vague
        
        jd_role_mismatch = result.get("jd_role_mismatch", False)
        use_market_standards = jd_role_mismatch or jd_is_vague
        result["use_market_standards"] = use_market_standards
        
        result["preserved_jd_requirements"] = {
            "required_years": jd.get("required_years"),
            "education_requirement": jd.get("education_requirement"),
            "required_certifications": jd.get("required_certifications", [])
        }
        
        if use_market_standards:
            reason = "JD-Role mismatch" if jd_role_mismatch else "Vague/insufficient JD"
            print(f"[JD_ROLE_ALIGNMENT] {reason} detected - will use market standards for {role_name}")
        
        log_stage("JD_ROLE_ALIGNMENT", result, is_output=True)
        return {"jd_role_alignment": result}
    except Exception as e:
        error_result = {
            "jd_role_mismatch": False,
            "jd_is_vague": jd_is_vague,
            "use_market_standards": jd_is_vague,
            "inferred_job_family": "Unknown",
            "stated_role_family": role_name,
            "reasoning": f"Error during alignment check: {str(e)}",
            "error": True,
            "preserved_jd_requirements": {
                "required_years": jd.get("required_years"),
                "education_requirement": jd.get("education_requirement"),
                "required_certifications": jd.get("required_certifications", [])
            }
        }
        log_stage("JD_ROLE_ALIGNMENT_ERROR", error_result, is_output=True)
        return {"jd_role_alignment": error_result}

def tech_agent_node(state: AgentState):
    print("STAGE: TECH/COMPETENCY AGENT")
    candidate = state.get("candidate_profile", {})
    jd = state.get("extracted_scoring_rules", {})
    alignment = state.get("jd_role_alignment", {})

    jd_role_mismatch = alignment.get("jd_role_mismatch", False)
    jd_is_vague = alignment.get("jd_is_vague", False)
    use_market_standards = alignment.get("use_market_standards", False)
    inferred_job_family = alignment.get("inferred_job_family", "Unknown")
    
    candidate_skills = candidate.get("skills", [])
    candidate_evidence = candidate.get("capability_evidence", [])
    candidate_education = candidate.get("education", [])
    candidate_certifications = candidate.get("certifications", [])
    
    jd_requirements = jd.get("primary_requirements", [])
    
    input_data = {
        "role_name": state["role_name"],
        "jd_role_mismatch": jd_role_mismatch,
        "jd_is_vague": jd_is_vague,
        "use_market_standards": use_market_standards,
        "inferred_job_family": inferred_job_family,
        "jd_skills": jd_requirements,
        "candidate_skills": candidate_skills,
        "candidate_evidence": candidate_evidence,
        "candidate_education": candidate_education,
        "candidate_certifications": candidate_certifications
    }
    log_stage("TECH_AGENT", input_data, is_output=False)
    
    combined_evidence = {
        "work_evidence": candidate_evidence,
        "education": candidate_education,
        "certifications": candidate_certifications
    }
    
    chain = COMPETENCY_EVAL_PROMPT | llm | JsonOutputParser()
    try:
        result = chain.invoke({
            "role_name": state["role_name"],
            "jd_role_mismatch": jd_role_mismatch,
            "jd_is_vague": jd_is_vague,
            "use_market_standards": use_market_standards,
            "inferred_job_family": inferred_job_family,
            "jd_skills": json.dumps(jd_requirements),
            "candidate_skills": json.dumps(candidate_skills),
            "candidate_evidence": json.dumps(combined_evidence)
        })

        result["jd_role_mismatch"] = jd_role_mismatch
        result["jd_is_vague"] = jd_is_vague
        result["use_market_standards"] = use_market_standards
        result["inferred_job_family"] = inferred_job_family
        
        matched = result.get("matched_competencies", [])
        missing = result.get("missing_competencies", [])
        total = len(matched) + len(missing)
        if total > 0 and not use_market_standards:
            correct_score = round((len(matched) / total) * 100)
            llm_score = result.get("score", 0)
            if abs(correct_score - llm_score) > 1:  # Only override if meaningfully different
                print(f"[TECH_AGENT] Score recalculated: LLM said {llm_score}, "
                      f"actual is ({len(matched)}/{total})*100 = {correct_score}")
                result["score"] = correct_score
                result["score_override_reason"] = (
                    f"Recalculated from matched/missing arrays: "
                    f"{len(matched)} matched, {len(missing)} missing out of {total}")
        
        result["score"] = round(result.get("score", 0))
        
        log_stage("TECH_AGENT", result, is_output=True)
        return {"tech_evaluation": result}
    except Exception as e:
        error_result = {"score": 0, "reasoning": str(e), "error": True, "jd_role_mismatch": jd_role_mismatch, "jd_is_vague": jd_is_vague, "use_market_standards": use_market_standards}
        log_stage("TECH_AGENT_ERROR", error_result, is_output=True)
        return {"tech_evaluation": error_result}


def experience_agent_node(state: AgentState):
    print("STAGE: EXPERIENCE AGENT")
    candidate = state.get("candidate_profile", {})
    jd = state.get("extracted_scoring_rules", {})
    alignment = state.get("jd_role_alignment", {})
    
    work_experience = candidate.get("work_experience", [])
    candidate_education = candidate.get("education", [])
    
    current_dt = datetime.now()
    calculated_years = calculate_total_years(work_experience, current_dt)
    
    jd_role_mismatch = alignment.get("jd_role_mismatch", False)
    jd_is_vague = alignment.get("jd_is_vague", False)
    use_market_standards = alignment.get("use_market_standards", False)
    inferred_job_family = alignment.get("inferred_job_family", "Unknown")
    preserved_reqs = alignment.get("preserved_jd_requirements", {})
    
    required_years = preserved_reqs.get("required_years") or jd.get("required_years")
    education_requirement = preserved_reqs.get("education_requirement") or jd.get("education_requirement")
    
    input_data = {
        "role_name": state["role_name"],
        "jd_role_mismatch": jd_role_mismatch,
        "jd_is_vague": jd_is_vague,
        "use_market_standards": use_market_standards,
        "inferred_job_family": inferred_job_family,
        "jd_experience_rules": {
            "required_years": required_years,
            "education_requirement": education_requirement
        },
        "candidate_experience": work_experience,
        "candidate_education": candidate_education,
        "calculated_total_years": calculated_years
    }
    log_stage("EXPERIENCE_AGENT", input_data, is_output=False)
    
    jd_experience_rules = {
        "required_years": required_years,
        "education_requirement": education_requirement
    }
    
    chain = EXP_EVAL_PROMPT | llm | JsonOutputParser()
    current_date = current_dt.strftime("%Y-%m-%d")
    try:
        result = chain.invoke({
            "role_name": state["role_name"],
            "jd_role_mismatch": jd_role_mismatch,
            "jd_is_vague": jd_is_vague,
            "use_market_standards": use_market_standards,
            "inferred_job_family": inferred_job_family,
            "current_date": current_date,
            "total_years_calculated": calculated_years,
            "preserved_required_years": required_years,
            "preserved_education_requirement": json.dumps(education_requirement) if education_requirement else "null",
            "jd_experience_rules": json.dumps(jd_experience_rules),  # Optimized: only experience rules, not entire JD
            "candidate_experience": json.dumps(work_experience),
            "candidate_education": json.dumps(candidate_education) 
        })

        result["jd_role_mismatch"] = jd_role_mismatch
        result["jd_is_vague"] = jd_is_vague
        result["use_market_standards"] = use_market_standards
        result["score"] = round(result.get("score", 0))
        log_stage("EXPERIENCE_AGENT", result, is_output=True)
        return {"experience_evaluation": result}
    except Exception as e:
        error_result = {"score": 0, "reasoning": str(e), "error": True, "jd_role_mismatch": jd_role_mismatch, "jd_is_vague": jd_is_vague, "use_market_standards": use_market_standards}
        log_stage("EXPERIENCE_AGENT_ERROR", error_result, is_output=True)
        return {"experience_evaluation": error_result}

def culture_agent_node(state: AgentState):
    print("STAGE: CULTURE/BEHAVIORAL AGENT")
    candidate = state.get("candidate_profile", {})
    jd = state.get("extracted_scoring_rules", {})
    alignment = state.get("jd_role_alignment", {})
    
    jd_role_mismatch = alignment.get("jd_role_mismatch", False)
    jd_is_vague = alignment.get("jd_is_vague", False)
    use_market_standards = alignment.get("use_market_standards", False)
    inferred_job_family = alignment.get("inferred_job_family", "Unknown")
    
    candidate_summary = candidate.get("summary", "")
    candidate_evidence = candidate.get("capability_evidence", [])
    
    jd_responsibilities = jd.get("responsibilities", [])
    
    input_data = {
        "role_name": state.get("role_name", ""),
        "jd_role_mismatch": jd_role_mismatch,
        "jd_is_vague": jd_is_vague,
        "use_market_standards": use_market_standards,
        "jd_responsibilities": jd_responsibilities,
        "candidate_summary": candidate_summary,
        "candidate_evidence_count": len(candidate_evidence)
    }
    log_stage("CULTURE_AGENT", input_data, is_output=False)
    
    chain = CULTURE_EVAL_PROMPT | llm | JsonOutputParser()
    try:
        result = chain.invoke({
            "role_name": state.get("role_name", ""),
            "jd_role_mismatch": jd_role_mismatch,
            "jd_is_vague": jd_is_vague,
            "use_market_standards": use_market_standards,
            "inferred_job_family": inferred_job_family,
            "jd_responsibilities": json.dumps(jd_responsibilities),
            "candidate_summary": candidate_summary,
            "candidate_evidence": json.dumps(candidate_evidence)
        })

        result["jd_role_mismatch"] = jd_role_mismatch
        result["jd_is_vague"] = jd_is_vague
        result["use_market_standards"] = use_market_standards
        result["score"] = round(result.get("score", 0))
        log_stage("CULTURE_AGENT", result, is_output=True)
        return {"culture_evaluation": result}
    except Exception as e:
        error_result = {"score": 0, "reasoning": str(e), "error": True, "jd_role_mismatch": jd_role_mismatch, "jd_is_vague": jd_is_vague, "use_market_standards": use_market_standards}
        log_stage("CULTURE_AGENT_ERROR", error_result, is_output=True)
        return {"culture_evaluation": error_result}



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
    
    tech_eval_full = state.get("tech_evaluation", {})
    exp_eval_full = state.get("experience_evaluation", {})
    culture_eval_full = state.get("culture_evaluation", {})
    
    tech_eval_summary = {
        "score": tech_eval_full.get("score", 0),
        "matched_count": len(tech_eval_full.get("matched_competencies", [])),
        "missing_count": len(tech_eval_full.get("missing_competencies", [])),
        "jd_role_mismatch": tech_eval_full.get("jd_role_mismatch", False),
        "jd_is_vague": tech_eval_full.get("jd_is_vague", False),
        "use_market_standards": tech_eval_full.get("use_market_standards", False),
        "jurisdiction_flag": tech_eval_full.get("jurisdiction_issue", False),
        "reasoning": tech_eval_full.get("reasoning", "")
    }
    
    exp_eval_summary = {
        "score": exp_eval_full.get("score", 0),
        "relevant_years_validated": exp_eval_full.get("relevant_years_validated", 0),
        "education_match": exp_eval_full.get("education_match", False),
        "jd_role_mismatch": exp_eval_full.get("jd_role_mismatch", False),
        "jd_is_vague": exp_eval_full.get("jd_is_vague", False),
        "use_market_standards": exp_eval_full.get("use_market_standards", False),
        "reasoning": exp_eval_full.get("reasoning", "")
    }
    
    culture_eval_summary = {
        "score": culture_eval_full.get("score", 0),
        "jd_role_mismatch": culture_eval_full.get("jd_role_mismatch", False),
        "jd_is_vague": culture_eval_full.get("jd_is_vague", False),
        "use_market_standards": culture_eval_full.get("use_market_standards", False),
        "reasoning": culture_eval_full.get("reasoning", "")
    }
    
    input_data = {
        "role_name": state["role_name"],
        "tech_eval_score": tech_eval_summary["score"],
        "experience_eval_score": exp_eval_summary["score"],
        "culture_eval_score": culture_eval_summary["score"],
        "jd_requirements_count": len(jd_requirements),
        "jd_responsibilities_count": len(jd_responsibilities),
        "evaluation_criteria_count": len(evaluation_criteria),
        "criteria_source": criteria_source
    }
    log_stage("AGGREGATOR", input_data, is_output=False)
    
    # NOTE: Logging full agent reports for debugging and continuous improvement.
    # This is intentional during development. Consider redacting PII for production.
    print("FULL AGENT REPORTS")
    log_stage("TECH_EVAL_FULL", tech_eval_full, is_output=False)
    log_stage("EXPERIENCE_EVAL_FULL", exp_eval_full, is_output=False)
    log_stage("CULTURE_EVAL_FULL", culture_eval_full, is_output=False)
    
    chain = AGGREGATOR_PROMPT | llm | JsonOutputParser()
    try:
        result = chain.invoke({
            "role_name": state["role_name"],
            "evaluation_criteria": json.dumps(evaluation_criteria),
            "criteria_count": len(evaluation_criteria),
            "tech_eval": json.dumps(tech_eval_summary),  
            "exp_eval": json.dumps(exp_eval_summary),    
            "culture_eval": json.dumps(culture_eval_summary)  
        })
        result["final_score"] = max(0, min(100, round(result.get("final_score", 0))))
        cat = result.get("category_scores", {})
        for key in ["competency", "experience", "soft_skills"]:
            if key in cat:
                cat[key] = max(0, min(100, round(cat[key])))
        result["category_scores"] = cat
        log_stage("AGGREGATOR", result, is_output=True)
        return {"final_evaluation": result}
    except Exception as e:
        error_result = {"final_score": 0, "final_reasoning": str(e), "error": True}
        log_stage("AGGREGATOR_ERROR", error_result, is_output=True)
        return {"final_evaluation": error_result}

def feedback_node(state: AgentState):
    print("STAGE: CANDIDATE FEEDBACK GENERATION") 

    candidate=state.get("candidate_profile", {})
    final_eval=state.get("final_evaluation", {})
    tech_eval=state.get("tech_evaluation", {})

    first_name=candidate.get("first_name", "Candidate")
    final_score=final_eval.get("final_score", 0)

    input_data={
        "first_name": first_name,
        "role_name": state.get("role_name", ""),
        "final_score": final_score,
    }      
    log_stage("FEEDBACK_GENERATION", input_data, is_output=False)

    chain = FEEDBACK_GENERATION_PROMPT | llm | JsonOutputParser()

    try:
        result=chain.invoke({
            "first_name": first_name,
            "role_name": state.get("role_name", ""),
            "final_score": final_score,
            "category_scores": json.dumps(final_eval.get("category_scores", {})),
            "strengths": json.dumps(final_eval.get("strengths", [])),
            "weaknesses": json.dumps(final_eval.get("weaknesses", [])),
            "matched_competencies": json.dumps(tech_eval.get("matched_competencies", [])),
            "missing_competencies": json.dumps(tech_eval.get("missing_competencies", [])),
            "experience_level": candidate.get("experience_level", "Unknown")
        })

        log_stage("FEEDBACK_GENERATION", result, is_output=True)
        return {"candidate_feedback": result}

    except Exception as e:
        role = state.get("role_name", "the position")
        error_result={
            "recommendation": "Maybe",
            "feedback_email": {
                "subject": f"Your Application Results - {role}",
                "body": (
                    f"Dear {first_name},\n\n"
                    f"Thank you for your interest in the {role} position and for taking the time to submit your application.\n\n"
                    f"We have received your application and our team is currently reviewing it. "
                    f"Unfortunately, we were unable to generate detailed feedback at this time.\n\n"
                    f"A member of our recruitment team will follow up with you shortly with more information about your application status and next steps.\n\n"
                    f"If you have any questions in the meantime, please don't hesitate to reach out to our recruitment team.\n\n"
                    f"We appreciate your interest and wish you all the best.\n\n"
                    f"Warm regards,\nThe TalentScan AI Team"
                )
            },
            "strengths": [],
            "improvement_areas": [],
            "error": str(e)
        }

        log_stage("FEEDBACK_GENERATION_ERROR", error_result, is_output=True)
        return {"candidate_feedback": error_result}