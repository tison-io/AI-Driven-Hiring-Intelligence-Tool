import os
import numpy as np
from openai import OpenAI
from dotenv import load_dotenv
from sklearn.metrics.pairwise import cosine_similarity

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def get_embedding(text_list):
    if not text_list: return np.zeros(1536)
    text = ", ".join(text_list)
    res = client.embeddings.create(input=text, model="text-embedding-3-small")
    return res.data[0].embedding

def calculate_math_score(candidate: dict, requirements: dict, job_description: str = "") -> dict:

    cand_skills = candidate.get("flat_skills_list", []) or candidate.get("skills", [])

    target_skills = list(set(
        requirements.get("core_skills", []) + 
        requirements.get("example_skills", [])
    ))

    if not target_skills:
        skill_final = 50 
    else:
        cand_vec = get_embedding(cand_skills)
        target_vec = get_embedding(target_skills)
        similarity = cosine_similarity([cand_vec], [target_vec])[0][0]

        vector_score = max(0, min(100, (similarity - 0.3) * 192))
        matched_count = 0
        for target in target_skills:
            t_clean = target.lower().strip()
            if any(t_clean in s.lower() for s in cand_skills):
                matched_count += 1
        
        keyword_score = (matched_count / len(target_skills)) * 100
        if vector_score > 85 and keyword_score < 60:
            skill_final = vector_score
        else:
            skill_final = max(vector_score, keyword_score)

    w_skill = skill_final * 0.40
    c_years = candidate.get("total_years_experience", 0) 
    if c_years is None: c_years = 0
    r_years = requirements.get("required_years", 0)
    
    if r_years == 0:
        exp_raw = 100
    elif c_years >= r_years:
        exp_raw = 100
    else:
        exp_raw = (c_years / r_years) * 100
    
    w_exp = exp_raw * 0.30
    levels = {"phd": 4, "master": 3, "bachelor": 2, "associate": 1, "none": 0}
    c_deg_str = "none"
    if candidate.get("education") and len(candidate["education"]) > 0:
        raw_deg = candidate["education"][0].get("degree", "None").lower()
        if "phd" in raw_deg: c_deg_str = "phd"
        elif "master" in raw_deg or "msc" in raw_deg: c_deg_str = "master"
        elif "bachelor" in raw_deg or "bsc" in raw_deg: c_deg_str = "bachelor"
        elif "associate" in raw_deg: c_deg_str = "associate"

    req_deg_input = requirements.get("required_degree", [])
    if isinstance(req_deg_input, list) and req_deg_input:
        r_deg_str = str(req_deg_input[0]).lower()
    else:
        r_deg_str = "none"

    if "phd" in r_deg_str: r_level = 4
    elif "master" in r_deg_str: r_level = 3
    elif "bachelor" in r_deg_str: r_level = 2
    elif "associate" in r_deg_str: r_level = 1
    else: r_level = 0

    c_level = levels.get(c_deg_str, 0)

    if c_level >= r_level: edu_raw = 100
    elif c_level == r_level - 1: edu_raw = 80
    else: edu_raw = 60

    w_edu = edu_raw * 0.15

    c_certs = candidate.get("certifications", [])
    cert_count = len(c_certs)
    
    if cert_count == 0: cert_raw = 50
    elif cert_count <= 2: cert_raw = 80
    elif cert_count <= 4: cert_raw = 90
    else: cert_raw = 100
    
    w_cert = cert_raw * 0.15

    base_score = w_skill + w_exp + w_edu + w_cert

    return {
        "base_score": int(base_score),
        "breakdown": {
            "skill_match": int(skill_final),
            "experience_relevance": int(exp_raw),
            "education_fit": int(edu_raw),
            "certifications": int(cert_raw),
            "weighted_skill": int(w_skill),
            "weighted_exp": int(w_exp),
            "weighted_edu": int(w_edu),
            "weighted_cert": int(w_cert)
        }
    }