from langgraph.graph import StateGraph, END

from states import AgentState
from nodes import(
    extract_resume_node,
    parse_jd_node,
    tech_agent_node,
    experience_agent_node,
    culture_agent_node,
    aggregator_node    
)

workflow=StateGraph(AgentState)

workflow.add_node("extractor", extract_resume_node)
workflow.add_node("jd_parser", parse_jd_node)
workflow.add_node("tech_agent", tech_agent_node)
workflow.add_node("exp_agent", experience_agent_node)
workflow.add_node("culture_agent", culture_agent_node)
workflow.add_node("aggregator", aggregator_node)

workflow.set_entry_point("extractor")
workflow.add_edge("extractor", "jd_parser")
workflow.add_edge("jd_parser", "tech_agent")
workflow.add_edge("jd_parser", "exp_agent")
workflow.add_edge("jd_parser", "culture_agent")
workflow.add_edge("tech_agent", "aggregator")
workflow.add_edge("exp_agent", "aggregator")
workflow.add_edge("culture_agent", "aggregator")
workflow.add_edge("aggregator", END)

app_graph=workflow.compile()