import os
import json
from openai import OpenAI
from dotenv import load_dotenv
from prompts import SYSTEM_EXTRACTION_PROMPT

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def extract_resume_data(raw_text: str):
    """
    Sends raw text to GPT to get a structured JSON.
    """
    if not raw_text:
        return {"error": "No text provided"}

    try:
        response=client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_EXTRACTION_PROMPT},
                {"role": "user", "content": f"Resume Text:\n{raw_text}"}
            ],
            response_format={"type": "json_object"},
            temperature=0.0
        )

        data = json.loads(response.choices[0].message.content)

        all_skills = []
        if "extracted skills" in data:
            for category in data["extracted skills"].values():
                if isinstance(category, list):
                    all_skills.extend(category)

        data["flat_skills_list"] = list(set(all_skills))

        return data
            

    except Exception as e:
        print(f"LLM Extraction Error: {e}")
        return {"error": str(e)}


