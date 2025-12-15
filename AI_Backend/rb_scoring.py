import re
from datetime import datetime

def normalize_text(text):
    if not text:
        return ""
    return (
        text.lower()
        .strip()
        .replace("-", " ")
        .replace("_", " ")
        .replace(".", "")
    )

def clean_cert_text(text):
    if not text:
        return ""
    return re.sub(r"[^\w\s]", "", text.lower())

def parse_date(date_str):
    if not date_str:
        return None

    date_lower = date_str.lower().strip()
    if date_lower in {"present", "current", "now", "ongoing"}:
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
        except Exception:
            pass

    return None

def calculate_duration_years(start_str, end_str):
    start = parse_date(start_str)
    end = parse_date(end_str)
    if not start or not end:
        return 0.0
    return max(0.0, (end - start).days / 365.25)

EXPERIENCE_COLLAPSE = {
    "High": "Relevant",
    "Partial": "Relevant",
    "Low": "Irrelevant",
    "None": "Irrelevant",
}

EXPERIENCE_WEIGHT = {
    "Relevant": 1.0,
    "Irrelevant": 0.0,
}

def calculate_relevant_years(candidate, semantic_analysis, role_name):
    work_history = candidate.get("work_experience", [])
    if not work_history:
        return 0.0

    ai_map = {
        item.get("job_index"): item.get("relevance_level", "None")
        for item in semantic_analysis.get("work_experience_analysis", [])
        if item.get("job_index") is not None
    }

    total_years = 0.0

    for idx, job in enumerate(work_history):
        raw_level = ai_map.get(idx, "None")
        collapsed = EXPERIENCE_COLLAPSE.get(raw_level, "Irrelevant")
        weight = EXPERIENCE_WEIGHT[collapsed]

        if weight == 0.0:
            continue

        years = calculate_duration_years(
            job.get("start_date"),
            job.get("end_date")
        )

        total_years += years * weight

    return round(total_years, 2)

def calculate_experience_score(relevant_years, required_years):
    if required_years <= 0:
        return 100

    capped_years = min(relevant_years, required_years)
    return int((capped_years / required_years) * 100)

def calculate_skill_score(skill_analysis):
    if not skill_analysis:
        return 100

    required = len(skill_analysis)
    matched = sum(
        1
        for item in skill_analysis
        if item.get("match_level") in {"Strong Match", "Partial Match"}
    )

    if matched == 0:
        return 0

    return int((matched / required) * 100)


def calculate_education_score(candidate_edu, req_edu):
    if not req_edu or not req_edu.get("required_level"):
        return 100
    if not candidate_edu:
        return 0

    levels = {
        "phd": 5,
        "doctorate": 5,
        "master": 4,
        "bachelor": 3,
        "associate": 2,
        "diploma": 1,
        "none": 0,
    }

    req_level_str = normalize_text(req_edu.get("required_level", "none"))
    req_val = next((v for k, v in levels.items() if k in req_level_str), 0)

    valid_majors = [normalize_text(m) for m in req_edu.get("valid_majors", [])]
    best_score = 0

    for edu in candidate_edu:
        cand_level = normalize_text(edu.get("degree_level", ""))
        cand_major = normalize_text(edu.get("field_of_study", ""))

        if valid_majors:
            if not any(
                set(m.split()).intersection(cand_major.split())
                for m in valid_majors
            ):
                continue

        cand_val = next((v for k, v in levels.items() if k in cand_level), 0)

        if cand_val >= req_val:
            score = 100
        elif cand_val == req_val - 1:
            score = 50
        else:
            score = 0

        best_score = max(best_score, score)

    return best_score

def calculate_cert_match(candidate_certs, required_certs):
    if not required_certs:
        return 100
    if not candidate_certs:
        return 0

    cand_clean = [clean_cert_text(c) for c in candidate_certs]
    hierarchy = {"associate": 1, "professional": 2, "expert": 3}
    matches = 0

    for req in required_certs:
        req_clean = clean_cert_text(req)
        req_tokens = set(req_clean.split())

        req_level = max(
            (hierarchy[w] for w in req_tokens if w in hierarchy),
            default=0
        )

        req_subject = req_tokens - set(hierarchy.keys())
        matched = False

        for cand in cand_clean:
            cand_tokens = set(cand.split())
            cand_level = max(
                (hierarchy[w] for w in cand_tokens if w in hierarchy),
                default=0
            )
            cand_subject = cand_tokens - set(hierarchy.keys())

            if req_subject:
                overlap = len(req_subject & cand_subject) / len(req_subject)
            else:
                overlap = 0

            if overlap >= 0.6 and cand_level >= req_level:
                matched = True
                break

        if matched:
            matches += 1

    return int((matches / len(required_certs)) * 100)

def calculate_math_score(candidate, requirements, semantic_analysis, role_name=""):
    relevant_years = calculate_relevant_years(
        candidate,
        semantic_analysis,
        role_name
    )

    exp_score = calculate_experience_score(
        relevant_years,
        requirements.get("required_years", 0)
    )

    skill_score = calculate_skill_score(
        semantic_analysis.get("skill_analysis", [])
    )

    edu_score = calculate_education_score(
        candidate.get("education", []),
        requirements.get("education_requirement", {})
    )

    required_certs = requirements.get("required_certifications", [])
    has_cert_reqs = bool(required_certs)

    if has_cert_reqs:
        cert_score = calculate_cert_match(
            candidate.get("certifications", []),
            required_certs
        )
        W_SKILL, W_EXP, W_EDU, W_CERT = 0.15, 0.40, 0.25, 0.20
    else:
        cert_score = 100
        W_SKILL, W_EXP, W_EDU, W_CERT = 0.15, 0.55, 0.30, 0.00

    final_score = (
        skill_score * W_SKILL +
        exp_score * W_EXP +
        edu_score * W_EDU +
        cert_score * W_CERT
    )

    return {
        "base_score": int(final_score),
        "breakdown": {
            "skill_match": skill_score,
            "experience_relevance": exp_score,
            "education_fit": edu_score,
            "certifications": cert_score,
            "relevant_years_calculated": relevant_years,
        },
    }
