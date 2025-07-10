import os
import json
from typing import List, Dict, Any, TypedDict
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, END

load_dotenv()

if not os.getenv("OPENAI_API_KEY"):
    raise ValueError("OPENAI_API_KEY is not set")

llm = ChatOpenAI(api_key=os.getenv("OPENAI_API_KEY"), temperature=0.3)

# Define state for LangGraph
class AgentState(TypedDict):
    messages: List[Dict[str, Any]]
    topic: str
    difficulty: str
    num_questions: int
    challenge_type: str
    user_answer: str
    correct_answer: str
    scenario_title: str
    questions: str
    result: Dict[str, Any]

# --- LANGGRAPH NODES ---
def mcq_generation_node(state: AgentState) -> AgentState:
    """Node for generating MCQ challenges"""
    prompt = f"Generate {state['num_questions']} multiple choice questions about {state['topic']} at {state['difficulty']} difficulty. Return JSON array with title, options (4 strings), correct_answer_id (0-3), explaination fields."
    
    response = llm([HumanMessage(content=prompt)])
    try:
        questions = json.loads(response.content)
        validated = []
        for q in questions:
            validated.append({
                "title": q["title"],
                "options": json.dumps(q["options"]),
                "correct_answer_id": q["correct_answer_id"],
                "explaination": q["explaination"]
            })
        state["result"] = validated
        return state
    except Exception as e:
        raise ValueError(f"Invalid MCQ output: {e}")

def scenario_generation_node(state: AgentState) -> AgentState:
    """Node for generating scenario challenges"""
    prompt = f"Generate a scenario challenge about {state['topic']} at {state['difficulty']} difficulty with {state['num_questions']} questions. Return JSON with title, questions (array of objects with prompt field), correct_answer, explanation fields."
    
    response = llm([HumanMessage(content=prompt)])
    try:
        scenario = json.loads(response.content)
        result = {
            "title": scenario["title"],
            "questions": json.dumps(scenario["questions"]),
            "correct_answer": scenario["correct_answer"],
            "explanation": scenario["explanation"]
        }
        state["result"] = result
        return state
    except Exception as e:
        raise ValueError(f"Invalid scenario output: {e}")

def evaluation_node(state: AgentState) -> AgentState:
    """Node for evaluating scenario answers"""
    prompt = f"Evaluate this answer for scenario '{state['scenario_title']}'. User answer: {state['user_answer']}. Correct answer: {state['correct_answer']}. Return JSON with score (0-100), feedback, correct_answer fields."
    
    response = llm([HumanMessage(content=prompt)])
    try:
        result = json.loads(response.content)
        state["result"] = result
        return state
    except Exception as e:
        raise ValueError(f"Invalid evaluation output: {e}")

# --- LANGGRAPH WORKFLOWS ---
def create_mcq_workflow():
    """Create workflow for MCQ generation"""
    workflow = StateGraph(AgentState)
    workflow.add_node("generate", mcq_generation_node)
    workflow.set_entry_point("generate")
    workflow.add_edge("generate", END)
    return workflow.compile()

def create_scenario_workflow():
    """Create workflow for scenario generation"""
    workflow = StateGraph(AgentState)
    workflow.add_node("generate", scenario_generation_node)
    workflow.set_entry_point("generate")
    workflow.add_edge("generate", END)
    return workflow.compile()

def create_evaluation_workflow():
    """Create workflow for answer evaluation"""
    workflow = StateGraph(AgentState)
    workflow.add_node("evaluate", evaluation_node)
    workflow.set_entry_point("evaluate")
    workflow.add_edge("evaluate", END)
    return workflow.compile()

# --- MAIN FUNCTIONS ---
def generate_interview_challenges(topic: str, difficulty: str, num_questions: int) -> List[Dict[str, Any]]:
    """Generate MCQ challenges using LangGraph"""
    workflow = create_mcq_workflow()
    initial_state = {
        "messages": [],
        "topic": topic,
        "difficulty": difficulty,
        "num_questions": num_questions,
        "challenge_type": "interview",
        "user_answer": "",
        "correct_answer": "",
        "scenario_title": "",
        "questions": "",
        "result": {}
    }
    final_state = workflow.invoke(initial_state)
    return final_state["result"]

def generate_scenario_challenge(topic: str, difficulty: str, num_questions: int) -> Dict[str, Any]:
    """Generate scenario challenge using LangGraph"""
    workflow = create_scenario_workflow()
    initial_state = {
        "messages": [],
        "topic": topic,
        "difficulty": difficulty,
        "num_questions": num_questions,
        "challenge_type": "scenario",
        "user_answer": "",
        "correct_answer": "",
        "scenario_title": "",
        "questions": "",
        "result": {}
    }
    final_state = workflow.invoke(initial_state)
    return final_state["result"]

def evaluate_scenario_answer(
    user_answer: str,
    correct_answer: str,
    scenario_title: str,
    questions: str
) -> Dict[str, Any]:
    """Evaluate scenario answer using LangGraph"""
    workflow = create_evaluation_workflow()
    initial_state = {
        "messages": [],
        "topic": "",
        "difficulty": "",
        "num_questions": 0,
        "challenge_type": "evaluation",
        "user_answer": user_answer,
        "correct_answer": correct_answer,
        "scenario_title": scenario_title,
        "questions": questions,
        "result": {}
    }
    final_state = workflow.invoke(initial_state)
    return final_state["result"]



