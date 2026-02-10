from typing import TypedDict, Optional, Dict, Any, Annotated


def merge_dict(existing: Optional[Dict[str, Any]], new: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if new is not None:
        return new
    return existing


class InputState(TypedDict):
    resume_text: str
    job_description_text: str
    role_name: str


class AgentState(InputState):
    candidate_profile: Optional[Dict[str, Any]]
    extracted_scoring_rules: Optional[Dict[str, Any]]
    jd_role_alignment: Optional[Dict[str, Any]]
    
    tech_evaluation: Annotated[Optional[Dict[str, Any]], merge_dict]
    experience_evaluation: Annotated[Optional[Dict[str, Any]], merge_dict]
    culture_evaluation: Annotated[Optional[Dict[str, Any]], merge_dict]
    
    final_evaluation: Optional[Dict[str, Any]]

    candidate_feedback: Optional[Dict[str, Any]]