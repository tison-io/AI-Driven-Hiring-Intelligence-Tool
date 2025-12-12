import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

def calculate_skill_match(candidate_skills, core_skills, example_skills):
    """Pure rule-based skill matching - deterministic."""
    all_required = core_skills + example_skills
    if not all_required:
        return 100
    
    cand_lower = [s.lower().strip() for s in candidate_skills]
    core_lower = [s.lower().strip() for s in core_skills]
    example_lower = [s.lower().strip() for s in example_skills]
    core_matches = sum(1 for req in core_lower if any(req in cand or cand in req for cand in cand_lower))
    core_score = (core_matches / len(core_lower)) * 100 if core_lower else 100
    example_matches = sum(1 for req in example_lower if any(req in cand or cand in req for cand in cand_lower))
    example_score = (example_matches / len(example_lower)) * 100 if example_lower else 0
    final_score = (core_score * 0.7) + (example_score * 0.3)
    return int(final_score)

def calculate_cert_match(candidate_certs, required_certs):
    """Rule-based certification matching with similarity."""
    if not required_certs:
        return 100
    
    if not candidate_certs:
        return 0
    
    cand_lower = [c.lower().strip() for c in candidate_certs]
    req_lower = [r.lower().strip() for r in required_certs]
    
    matches = 0
    for req in req_lower:
        if req in cand_lower:
            matches += 1
            continue
        req_words = set(req.split())
        for cand in cand_lower:
            cand_words = set(cand.split())
            if len(req_words & cand_words) / len(req_words) >= 0.7:
                matches += 1
                break
    
    return int((matches / len(req_lower)) * 100)

def parse_date(date_str):
    """Parses YYYY-MM dates into datetime objects."""
    if not date_str or date_str.lower() == "present":
        return datetime.now()
    try:
        return datetime.strptime(date_str, "%Y-%m")
    except:
        return None

def calculate_relevant_years(candidate: dict) -> float:
    """Simple rule-based experience calculation."""
    return candidate.get("total_years_experience", 0)

def calculate_math_score(candidate: dict, requirements: dict, job_description: str = "") -> dict:
    cand_skills = candidate.get("flat_skills_list", []) or candidate.get("skills", [])
    core_skills = requirements.get("core_skills", [])
    example_skills = requirements.get("example_skills", [])
    required_certs = requirements.get("required_certifications", [])
    has_cert_reqs = len(required_certs) > 0
    
    if has_cert_reqs:
        W_SKILL, W_EXP, W_EDU, W_CERT = 0.40, 0.30, 0.15, 0.15
    else:
        W_SKILL, W_EXP, W_EDU, W_CERT = 0.55, 0.30, 0.15, 0.00
    skill_raw = calculate_skill_match(cand_skills, core_skills, example_skills)
    weighted_skill = skill_raw * W_SKILL
    c_years = calculate_relevant_years(candidate)
    r_years = requirements.get("required_years", 0)
    
    if r_years == 0 or c_years >= r_years:
        exp_raw = 100
    else:
        exp_raw = (c_years / r_years) * 100
    
    weighted_exp = exp_raw * W_EXP
    levels = {"phd": 4, "master": 3, "bachelor": 2, "associate": 1, "none": 0}
    c_deg_str = "none"
    if candidate.get("education") and len(candidate["education"]) > 0:
        raw_deg = candidate["education"][0].get("degree", "None").lower()
        if "phd" in raw_deg: c_deg_str = "phd"
        elif "master" in raw_deg or "msc" in raw_deg: c_deg_str = "master"
        elif "bachelor" in raw_deg or "bsc" in raw_deg: c_deg_str = "bachelor"
        elif "associate" in raw_deg: c_deg_str = "associate"
    
    r_deg_input = requirements.get("required_degree", "none")
    r_deg_str = str(r_deg_input).lower() if r_deg_input else "none"
    
    c_lvl = levels.get(c_deg_str, 0)
    r_lvl = 0
    if "phd" in r_deg_str: r_lvl = 4
    elif "master" in r_deg_str: r_lvl = 3
    elif "bachelor" in r_deg_str: r_lvl = 2
    elif "associate" in r_deg_str: r_lvl = 1

    if c_lvl >= r_lvl: edu_raw = 100
    elif c_lvl == r_lvl - 1: edu_raw = 80
    elif c_lvl == r_lvl - 2: edu_raw = 60
    else: edu_raw = 40

    weighted_edu = edu_raw * W_EDU
    if has_cert_reqs:
        cand_certs = candidate.get("certifications", [])
        cert_raw = calculate_cert_match(cand_certs, required_certs)
    else:
        cert_raw = 100
    
    weighted_cert = cert_raw * W_CERT
    base_score = weighted_skill + weighted_exp + weighted_edu + weighted_cert

    return {
        "base_score": int(base_score),
        "breakdown": {
            "skill_match": int(skill_raw),
            "experience_relevance": int(exp_raw),
            "education_fit": int(edu_raw),
            "certifications": int(cert_raw),
            "weighted_skill": int(weighted_skill),
            "weighted_exp": int(weighted_exp),
            "weighted_edu": int(weighted_edu),
            "weighted_cert": int(weighted_cert),
            "relevant_years_calculated": c_years
        }
    }