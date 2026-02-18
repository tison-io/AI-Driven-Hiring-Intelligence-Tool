from typing import List
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import RetryPolicy

from states import AgentState
from nodes import(
    extract_resume_node,
    parse_jd_node,
    jd_role_alignment_node,
    tech_agent_node,
    experience_agent_node,
    culture_agent_node,
    aggregator_node,
    feedback_node    
)

checkpointer = MemorySaver()

llm_retry = RetryPolicy(max_attempts=3)

workflow = StateGraph(AgentState)

workflow.add_node("jd_parser", parse_jd_node, retry=llm_retry)
workflow.add_node("alignment_check", jd_role_alignment_node, retry=llm_retry)
workflow.add_node("extractor", extract_resume_node, retry=llm_retry)
workflow.add_node("tech_agent", tech_agent_node, retry=llm_retry)
workflow.add_node("exp_agent", experience_agent_node, retry=llm_retry)
workflow.add_node("culture_agent", culture_agent_node, retry=llm_retry)
workflow.add_node("aggregator", aggregator_node, retry=llm_retry)
workflow.add_node("feedback", feedback_node, retry=llm_retry)
workflow.add_edge(START, "jd_parser")
workflow.add_edge("jd_parser", "alignment_check")
workflow.add_edge("alignment_check", "extractor")
workflow.add_edge("extractor", "tech_agent")
workflow.add_edge("extractor", "exp_agent")
workflow.add_edge("extractor", "culture_agent")
workflow.add_edge("tech_agent", "aggregator")
workflow.add_edge("exp_agent", "aggregator")
workflow.add_edge("culture_agent", "aggregator")
workflow.add_edge("aggregator", "feedback")
workflow.add_edge("feedback", END)

app_graph = workflow.compile(checkpointer=checkpointer)
