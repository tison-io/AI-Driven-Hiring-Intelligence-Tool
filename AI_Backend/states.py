from typing import TypedDict, Optional, Dict, Any

class InputState(TypedDict):
    resume_text: str
    job_description_text: str
    role_name: str

class AgentState(InputState):
    candidate_profile: Optional[Dict[str, Any]]
    extracted_scoring_rules: Optional[Dict[str, Any]]
    tech_evaluation: Optional[Dict[str, Any]]  
    experience_evaluation: Optional[Dict[str, Any]] 
    culture_evaluation: Optional[Dict[str, Any]] 
    final_evaluation: Optional[Dict[str, Any]]