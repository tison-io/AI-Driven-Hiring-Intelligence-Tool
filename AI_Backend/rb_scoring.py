import os

import numpy as np

from openai import OpenAI

from dotenv import load_dotenv

from sklearn.metrics.pairwise import cosine_similarity


load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))



def get_embedding(text_list):

    if not text_list:

        return np.zeros(1536)

    text = ", ".join(text_list)

    res = client.embeddings.create(input=text, model="text-embedding-3-small")

    return res.data[0].embedding




def calculate_math_score(candidate: dict, requirements: dict) -> dict:
    jls_extract_var = """
        Implements a math-based scoring mechanism.
        """
    jls_extract_var


    cand_skills = candidate.get("flat_skills_list", []) or candidate.get("skills", [])

    req_skills = requirements.get("required_skills", [])


    if not req_skills:

        skill_raw = 50
    else:

        cand_vec = get_embedding(cand_skills)

        req_vec = get_embedding(req_skills)

        similarity = cosine_similarity([cand_vec], [req_vec])[0][0]

        skill_raw = max(0, min(100, (similarity - 0.3) * 166))


    w_skill = skill_raw * 0.40


    c_years = candidate.get("total_years_experience", 0) or 0

    r_years = requirements.get("required_years", 0) or 0


    if r_years == 0:

        exp_raw = 100

    elif c_years >= r_years:

        exp_raw = 100
    else:

        exp_raw = (c_years / r_years) * 100


    w_exp = exp_raw * 0.30


    levels = {"phd": 4, "master": 3, "bachelor": 2, "associate": 1, "none": 0}


    c_level = 0

    if candidate.get("education"):

        deg_str = candidate["education"][0].get("degree", "None").lower()

        if "phd" in deg_str:

            c_level = 4

        elif "master" in deg_str or "msc" in deg_str:

            c_level = 3

        elif "bachelor" in deg_str or "bsc" in deg_str:

            c_level = 2

        elif "associate" in deg_str:

            c_level = 1


    r_deg_req = requirements.get("required_degree", "None")
    r_deg_str = r_deg_req.lower() if isinstance(r_deg_req, str) else str(r_deg_req).lower()

    r_level = 0

    if "phd" in r_deg_str:

        r_level = 4

    elif "master" in r_deg_str:

        r_level = 3

    elif "bachelor" in r_deg_str:

        r_level = 2

    elif "associate" in r_deg_str:

        r_level = 1


    if c_level == r_level:

        edu_raw = 100

    elif c_level > r_level:

        edu_raw = 95

    elif c_level == r_level - 1:

        edu_raw = 80

    elif c_level <= r_level - 2:

        edu_raw = 60
    else:

        edu_raw = 60


    edu_raw = edu_raw * 0.9

    w_edu = edu_raw * 0.15


    c_certs = len(candidate.get("certifications", []))


    if c_certs == 0:

        cert_raw = 50

    elif c_certs <= 2:

        cert_raw = 80

    elif c_certs <= 4:

        cert_raw = 90
    else:

        cert_raw = 100


    w_cert = cert_raw * 0.15


    base_score = w_skill + w_exp + w_edu + w_cert


    return {

        "base_score": int(base_score),

        "breakdown": {

            "skill_match": int(skill_raw),

            "experience_relevance": int(exp_raw),

            "education_fit": int(edu_raw),

            "certifications": int(cert_raw),

            "weighted_skill": int(w_skill),

            "weighted_exp": int(w_exp),

            "weighted_edu": int(w_edu),

            "weighted_cert": int(w_cert),

        },

    }

