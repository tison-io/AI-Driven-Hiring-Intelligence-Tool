import re
from datetime import datetime

def normalize_text(text):
    if not text: return ""
    return text.lower().strip().replace("-", " ").replace("_", " ").replace(".", "")

def clean_cert_text(text):
    if not text: return ""
    return re.sub(r'[^\w\s]', '', text.lower())

def parse_date(date_str):
    if not date_str: return None
    date_lower = date_str.lower().strip()
    if date_lower in ["present", "current", "now", "ongoing"]:
        return datetime.now()

    formats = [
        "%Y-%m",           
        "%b %Y", 
        "%B %Y",
        "%m/%Y",
        "%Y",
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(date_str.strip(), fmt)
        except:
            continue
    
    if any(word in date_lower for word in ["present", "current", "now", "ongoing"]):
        return datetime.now()
    
    return None

def calculate_duration_years(start_str, end_str):
    start = parse_date(start_str)
    end = parse_date(end_str)
    if not start or not end: return 0
    return max(0, (end - start).days / 365.25)

def calculate_relevant_years_hybrid(candidate, semantic_analysis, role_name):
    """
    Calculates years using AI verdicts. 
    Falls back to strict title matching if AI data is missing.
    """
    work_history = candidate.get("work_experience", [])
    if not work_history: return 0

    ai_verdicts = semantic_analysis.get("work_experience_analysis", [])
    ai_relevance_map = {}
    if ai_verdicts:
        for item in ai_verdicts:
            idx = item.get("job_index")
            if idx is not None:
                ai_relevance_map[idx] = item.get("is_relevant", False)

    total_years = 0
    role_tokens = set(normalize_text(role_name).split())

    for index, job in enumerate(work_history):
        is_relevant = False
        if index in ai_relevance_map:
            is_relevant = ai_relevance_map[index]
            if is_relevant:
                print(f"DEBUG: AI marked job #{index} '{job.get('job_title')}' as RELEVANT.")
        else:
            title = normalize_text(job.get("job_title", ""))
            job_tokens = set(title.split())
            common_stops = {"senior", "junior", "lead", "manager", "associate", "principal", "staff"}
            overlap = role_tokens.intersection(job_tokens) - common_stops
            if len(overlap) > 0:
                is_relevant = True
                print(f"DEBUG: Fallback marked job '{title}' as RELEVANT.")

        if is_relevant:
            job_years = calculate_duration_years(job.get("start_date"), job.get("end_date"))
            print(f"DEBUG: Job '{job.get('job_title')}' ({job.get('start_date')} to {job.get('end_date')}) = {job_years:.1f} years")
            total_years += job_years

    return total_years

def calculate_skill_match_hybrid(candidate, skill_requirements, semantic_analysis):
    """
    Calculates skills using AI verdicts.
    """
    if not skill_requirements: return 100
    ai_skill_map = {
        item.get("category"): item.get("candidate_has_skill", False)
        for item in semantic_analysis.get("skill_gap_analysis", [])
    }
    cand_blob = normalize_text(str(candidate)) 
    
    group_scores = []

    for group in skill_requirements:
        category = group.get("category")
        logic_type = group.get("logic_type", "OR")
        count_required = group.get("count_required", 1)
        if category in ai_skill_map and ai_skill_map[category] is True:
            group_scores.append(100)
            continue

        target_skills = group.get("skills", [])
        matches_found = 0
        
        for skill in target_skills:
            norm_skill = normalize_text(skill)
            if f" {norm_skill} " in f" {cand_blob} ":
                matches_found += 1

        if logic_type == "AND":
            required = len(target_skills)
            score = (matches_found / required) * 100 if required > 0 else 100
        elif logic_type == "AT_LEAST_N":
            score = min(100, (matches_found / count_required) * 100)
        else:
            score = 100 if matches_found >= 1 else 0
            
        group_scores.append(score)

    if not group_scores: return 100
    return int(sum(group_scores) / len(group_scores))

def calculate_education_score(candidate_edu, req_edu):
    if not req_edu or not req_edu.get("required_level"): return 100
    if not candidate_edu: return 0

    levels = {"phd": 5, "doctorate": 5, "master": 4, "bachelor": 3, "associate": 2, "diploma": 1, "none": 0}
    
    req_level_str = normalize_text(req_edu.get("required_level", "none"))
    req_val = 0
    for key, val in levels.items():
        if key in req_level_str: req_val = val; break

    valid_majors = [normalize_text(m) for m in req_edu.get("valid_majors", [])]
    best_edu_score = 0

    for edu in candidate_edu:
        cand_level_str = normalize_text(edu.get("degree_level", ""))
        cand_major_str = normalize_text(edu.get("field_of_study", ""))
        
        is_major_relevant = False
        if not valid_majors: is_major_relevant = True
        else:
            for req_major in valid_majors:
                req_tokens = set(req_major.split())
                cand_tokens = set(cand_major_str.split())
                if len(req_tokens.intersection(cand_tokens)) >= 1:
                    is_major_relevant = True; break

        if not is_major_relevant: continue

        cand_val = 0
        for key, val in levels.items():
            if key in cand_level_str: cand_val = val; break

        score = 0
        if cand_val >= req_val: score = 100
        elif cand_val == req_val - 1: score = 50
        else: score = 0
            
        if score > best_edu_score: best_edu_score = score

    return int(best_edu_score)

def calculate_cert_match(candidate_certs, required_certs):
    if not required_certs: return 100
    if not candidate_certs: return 0
    
    cand_certs_cleaned = [clean_cert_text(c) for c in candidate_certs]
    hierarchy = {"associate": 1, "professional": 2, "expert": 3}
    matches = 0
    
    for req in required_certs:
        req_clean = clean_cert_text(req)
        req_tokens = set(req_clean.split())
        req_level = 0
        for w in req_tokens:
            if w in hierarchy: req_level = hierarchy[w]

        best_match = False
        for cand in cand_certs_cleaned:
            cand_tokens = set(cand.split())
            cand_level = 0
            for w in cand_tokens:
                if w in hierarchy: cand_level = hierarchy[w]
            
            level_words = set(hierarchy.keys())
            req_subj = req_tokens - level_words
            cand_subj = cand_tokens - level_words
            
            if not req_subj: overlap = 0
            else: overlap = len(req_subj.intersection(cand_subj)) / len(req_subj)

            if overlap > 0.6 and cand_level >= req_level:
                best_match = True; break
        
        if best_match: matches += 1
            
    return int((matches / len(required_certs)) * 100)

def calculate_math_score(candidate: dict, requirements: dict, semantic_analysis: dict, role_name: str = "") -> dict:
    r_years = requirements.get("required_years", 0)
    c_years_relevant = calculate_relevant_years_hybrid(candidate, semantic_analysis, role_name)
    
    if r_years == 0: exp_score = 100
    elif c_years_relevant >= r_years: exp_score = 100
    else: exp_score = (c_years_relevant / r_years) * 100

    skill_score = calculate_skill_match_hybrid(candidate, requirements.get("skill_requirements", []), semantic_analysis)
    edu_score = calculate_education_score(candidate.get("education", []), requirements.get("education_requirement", {}))

    required_certs = requirements.get("required_certifications", [])
    has_cert_reqs = len(required_certs) > 0    
    if has_cert_reqs:
        cert_score = calculate_cert_match(candidate.get("certifications", []), required_certs)
        W_SKILL, W_EXP, W_EDU, W_CERT = 0.40, 0.30, 0.15, 0.15
    else:
        cert_score = 100
        W_SKILL, W_EXP, W_EDU, W_CERT = 0.55, 0.30, 0.15, 0.00

    final_score = (skill_score * W_SKILL) + (exp_score * W_EXP) + (edu_score * W_EDU) + (cert_score * W_CERT)

    return {
        "base_score": int(final_score),
        "breakdown": {
            "skill_match": int(skill_score),
            "experience_relevance": int(exp_score),
            "education_fit": int(edu_score),
            "certifications": int(cert_score),
            "relevant_years_calculated": round(c_years_relevant, 1)
        }
    }