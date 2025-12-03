import os
import json
from openai import OpenAI
from dotenv import load_dotenv 
from prompts import SYSTEM_SCORING_PROMPT 

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def score_candidate(candidate_data: dict, role_name: str):
    """
    Compares candidate JSON against a given Job Role.
    """
    try:
        candidate_str=json.dumps(candidate_data)

        prompt = f"""
        Target Job Role: {role_name}

        Candidate Profile (JSON):
        \"\"\"
        {candidate_str}
        \"\"\"
        """

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_SCORING_PROMPT},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.2
        )

        return json.loads(response.choices[0].message.content)
        
    except Exception as e:
        print(f"scoring Error: {e}")
        return {"error": str(e)}




    
    
