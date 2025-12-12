import re
from datetime import datetime

def normalize_text(text):
    """
    Standard normalization for skills and general text.
    Preserves C#, C++, etc., but handles standard delimiters.
    """
    if not text:
        return ""
    return text.lower().strip().replace("-", " ").replace("_", " ").replace(".", "")

def clean_cert_text(text):
    """
    Aggressive cleaning for Certifications to fix the 'Oracle: Java' vs 'Oracle Java' bug.
    Removes ALL punctuation to ensure pure token matching.
    """
    if not text:
        return ""
    return re.sub(r'[^\w\s]', '', text.lower())

def parse_date(date_str):
    """Parses YYYY-MM dates into datetime objects."""
    if not date_str or date_str.lower() == "present":
        return datetime.now()
    try:
        return datetime.strptime(date_str, "%Y-%m")
    except:
        return None

def calculate_duration_years(start_str, end_str):
    """Calculates duration in years between two YYYY-MM dates."""
    start = parse_date(start_str)
    end = parse_date(end_str)

    if not start or not end:
        return 0

    delta = end - start
    return max(0, delta.days / 365.25)

def create_searchable_blob(candidate):
    """
    Consolidates all candidate text into one normalized string.
    This acts as a safety net if the LLM extraction misses a skill in the list.
    """
    blob = ""
    blob += " " + str(candidate.get("summary", ""))
    for job in candidate.get("work_experience", []):
        blob += " " + str(job.get("job_title", ""))
        blob += " " + str(job.get("description", ""))
        
    for edu in candidate.get("education", []):
        blob += " " + str(edu.get("degree_level", ""))
        blob += " " + str(edu.get("field_of_study", ""))
        
    return normalize_text(blob)

def calculate_relevant_years(candidate, role_name, skill_requirements):
    """
    Calculates years of experience ONLY for jobs that are relevant to the target role.
    It checks if the Job Title matches the Role Name OR if the Description contains core skills.
    """
    work_history = candidate.get("work_experience", [])
    if not work_history:
        return 0
        
    role_tokens = set(normalize_text(role_name).split())
    core_skill_tokens = set()
    if skill_requirements:
        for group in skill_requirements:
            for skill in group.get("skills", []):
                core_skill_tokens.add(normalize_text(skill))

    relevant_years = 0

    for job in work_history:
        title = normalize_text(job.get("job_title", ""))
        desc = normalize_text(job.get("description", ""))
        
        is_relevant = False
        job_title_tokens = set(title.split())
        common_stops = {
            "senior", "junior", "lead", "manager", "associate", 
            "iv", "iii", "ii", "i", "staff", "principal"
        }
        meaningful_overlap = role_tokens.intersection(job_title_tokens) - common_stops

        if len(meaningful_overlap) > 0:
            is_relevant = True
        if not is_relevant and core_skill_tokens:
            matches = 0
            for skill in core_skill_tokens:
                if f" {skill} " in f" {desc} ":
                    matches += 1
            if matches >= 2:
                is_relevant = True

        if is_relevant:
            duration = calculate_duration_years(
                job.get("start_date"), job.get("end_date")
            )
            relevant_years += duration
            print(f"DEBUG - Relevant Job Found: '{job.get('job_title')}' ({duration:.2f} years)")
        else:
            print(f"DEBUG - Irrelevant Job Skipped: '{job.get('job_title')}'")

    return relevant_years

def calculate_education_score(candidate_edu, req_edu):
    """
    Scores education. IF the Field of Study is not relevant, the score is ZERO.
    Degree Level only matters if the Major is valid.
    """
    if not req_edu or not req_edu.get("required_level"):
        return 100

    if not candidate_edu:
        return 0

    levels = {
        "phd": 5, "doctorate": 5, "master": 4, "bachelor": 3, 
        "associate": 2, "diploma": 1, "none": 0
    }

    req_level_str = normalize_text(req_edu.get("required_level", "none"))
    req_val = 0
    for key, val in levels.items():
        if key in req_level_str:
            req_val = val
            break

    valid_majors = [normalize_text(m) for m in req_edu.get("valid_majors", [])]
    best_edu_score = 0

    for edu in candidate_edu:
        cand_level_str = normalize_text(edu.get("degree_level", ""))
        cand_major_str = normalize_text(edu.get("field_of_study", ""))
        is_major_relevant = False
        if not valid_majors:
            is_major_relevant = True
        else:
            for req_major in valid_majors:
                req_tokens = set(req_major.split())
                cand_tokens = set(cand_major_str.split())
                if len(req_tokens.intersection(cand_tokens)) >= 1:
                    is_major_relevant = True
                    break

        if not is_major_relevant:
            print(f"DEBUG - Education Mismatch: '{cand_major_str}' is not in {valid_majors}")
            continue
        cand_val = 0
        for key, val in levels.items():
            if key in cand_level_str:
                cand_val = val
                break

        score = 0
        if cand_val >= req_val:
            score = 100
        elif cand_val == req_val - 1:
            score = 50
        else:
            score = 0

        if score > best_edu_score:
            best_edu_score = score

    return int(best_edu_score)

def calculate_skill_match(candidate, skill_requirements):
    """
    Scores skills using a hybrid approach:
    1. Check the extracted skill list (fast/explicit).
    2. If missing, check the full candidate text blob (safety net).
    """
    candidate_skills = candidate.get("flat_skills_list", [])
    cand_skills_norm = set([normalize_text(s) for s in candidate_skills])
    cand_blob = create_searchable_blob(candidate)
    
    if not skill_requirements:
        return 100

    group_scores = []
    
    for req_group in skill_requirements:
        target_skills = req_group.get("skills", [])
        logic_type = req_group.get("logic_type", "OR")
        count_required = req_group.get("count_required", 1)
        
        target_skills_norm = [normalize_text(s) for s in target_skills]

        matches_found = 0
        matched_skills = set()

        for target in target_skills_norm:
            found = False

            for cand_skill in cand_skills_norm:
                if target == cand_skill or (f" {target} " in f" {cand_skill} "):
                    found = True
                    break
            if not found:
                if f" {target} " in f" {cand_blob} ":
                    found = True
                    print(f"DEBUG: Found missing skill '{target}' in resume text blob.")

            if found:
                if target not in matched_skills:
                    matches_found += 1
                    matched_skills.add(target)

        if logic_type == "AND":
            required = len(target_skills_norm)
            group_score = (matches_found / required) * 100
        elif logic_type == "AT_LEAST_N":
            required = count_required
            group_score = min(100, (matches_found / required) * 100)
        else:
            group_score = 100 if matches_found >= 1 else 0

        group_scores.append(group_score)

    if not group_scores:
        return 100
        
    return int(sum(group_scores) / len(group_scores))

def calculate_cert_match(candidate_certs, required_certs):
    if not required_certs:
        return 100
    if not candidate_certs:
        return 0
    cand_certs_cleaned = [clean_cert_text(c) for c in candidate_certs]
    
    hierarchy = {"associate": 1, "professional": 2, "expert": 3, "specialty": 2}

    matches = 0
    for req in required_certs:
        req_clean = clean_cert_text(req)
        req_tokens = set(req_clean.split())
        req_level = 0
        for w in req_tokens:
            if w in hierarchy:
                req_level = hierarchy[w]

        best_match_for_this_req = False
        
        for cand in cand_certs_cleaned:
            cand_tokens = set(cand.split())
            cand_level = 0
            for w in cand_tokens:
                if w in hierarchy:
                    cand_level = hierarchy[w]
            level_words = set(hierarchy.keys())
            req_subject = req_tokens - level_words
            cand_subject = cand_tokens - level_words
            if not req_subject:
                subject_match = 0 
            else:
                overlap = len(req_subject.intersection(cand_subject))
                subject_match = overlap / len(req_subject)
            if subject_match > 0.6 and cand_level >= req_level:
                best_match_for_this_req = True
                break
        if best_match_for_this_req:
            matches += 1

    return int((matches / len(required_certs)) * 100)

def calculate_math_score(
    candidate: dict, requirements: dict, job_description: str = "", role_name: str = ""
) -> dict:
    skill_score = calculate_skill_match(
        candidate, 
        requirements.get("skill_requirements", [])
    )

    r_years = requirements.get("required_years", 0)
    c_years_relevant = calculate_relevant_years(
        candidate, role_name, requirements.get("skill_requirements", [])
    )

    if r_years == 0:
        exp_score = 100
    elif c_years_relevant >= r_years:
        exp_score = 100
    else:
        exp_score = (c_years_relevant / r_years) * 100

    edu_score = calculate_education_score(
        candidate.get("education", []), requirements.get("education_requirement", {})
    )

    required_certs = requirements.get("required_certifications", [])
    has_cert_reqs = len(required_certs) > 0
    
    if has_cert_reqs:
        cert_score = calculate_cert_match(
            candidate.get("certifications", []), required_certs
        )
        W_SKILL, W_EXP, W_EDU, W_CERT = 0.40, 0.30, 0.15, 0.15
    else:
        cert_score = 100
        W_SKILL, W_EXP, W_EDU, W_CERT = 0.55, 0.30, 0.15, 0.00

    final_score = (
        (skill_score * W_SKILL)
        + (exp_score * W_EXP)
        + (edu_score * W_EDU)
        + (cert_score * W_CERT)
    )

    return {
        "base_score": int(final_score),
        "breakdown": {
            "skill_match": int(skill_score),
            "experience_relevance": int(exp_score),
            "education_fit": int(edu_score),
            "certifications": int(cert_score),
            "relevant_years_calculated": round(c_years_relevant, 1),
        },
    }