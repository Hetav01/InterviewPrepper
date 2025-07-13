# AI Agent Generator - LangGraph Implementation
# 
# This module handles AI generation for InterviewPrepper using LangGraph workflows.
# Functions generate MCQ challenges, scenario challenges, and evaluate user answers.
# 
# PROMPT CUSTOMIZATION:
# The basic prompts are provided as templates - customize them for better results.
# Focus on: specific output format, difficulty calibration, and evaluation criteria.

import os
import json
from typing import List, Dict, Any, TypedDict
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, END

# Load environment variables
load_dotenv()

if not os.getenv("OPENAI_API_KEY"):
    raise ValueError("OPENAI_API_KEY is not set in environment variables")

# Initialize LLM with conservative temperature for consistent outputs
llm = ChatOpenAI(
    api_key=os.getenv("OPENAI_API_KEY"), 
    temperature=0.1,  # Lower temperature for more consistent JSON outputs
    model="gpt-4.1-mini-2025-04-14"  # Use cost-effective model
)

# ========================================================================================
# LANGGRAPH STATE DEFINITION
# ========================================================================================
    
class AgentState(TypedDict):
    """State management for LangGraph workflows"""
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

# ========================================================================================
# BASIC PROMPT TEMPLATES (Customize these for better results!)
# ========================================================================================

def get_mcq_prompt(topic: str, difficulty: str, num_questions: int) -> str:
    """
    MCQ PROMPT:
    Output a JSON array of {num_questions} questions about {topic} at {difficulty} level.
    Each question must have:
    - title (string)
    - options (list of 4 strings)
    - correct_answer_id (0-3)
    - explaination (string, typo intentional)
    """
    return f"""Act as a Senior Data Scientist with significant managerial experience in hiring and mentoring machine learning candidates. Your task is to generate {num_questions} multiple choice interview questions on the topic of {topic}, targeting the {difficulty} level as defined below.

CRITICAL REQUIREMENTS:
- Return a JSON array with EXACTLY {num_questions} questions.
- Each question object must have these 4 fields (using these exact field names): title, options, correct_answer_id, explaination
- options: array of exactly 4 plausible and roughly equal-length strings
- correct_answer_id: integer (0, 1, 2, or 3), matching the correct option's index in options
- explaination: a detailed, educational explanation of the answer (typo in field name is intentional—do NOT correct it)

DIFFICULTY GUIDELINES:
- {difficulty} difficulty means: {{"Basic concepts and definitions" if difficulty == "Easy" else "Intermediate application and analysis" if difficulty == "Medium" else "Advanced problem-solving and complex scenarios"}}

QUALITY REQUIREMENTS:
- Questions should be realistic interview questions used in the ML/Data Science field.
- All 4 options must be plausible and competitive, but only one correct.
- Avoid any obvious or trivial wrong answers.
- Explanations must be thorough and educational, clarifying both why the correct answer is correct and why the others are not.
- Strictly follow the JSON array structure below. Do NOT add extra text, formatting, markdown, or commentary.

EXACT JSON FORMAT REQUIRED:
[
  {{
    "title": "What is the primary purpose of...",
    "options": ["Option A description", "Option B description", "Option C description", "Option D description"],
    "correct_answer_id": 2,
    "explaination": "The correct answer is C because..."
  }},
  {{
    "title": "Which approach would be most effective for...",
    "options": ["First approach", "Second approach", "Third approach", "Fourth approach"],
    "correct_answer_id": 0,
    "explaination": "Option A is correct because..."
  }}
]

Generate exactly {num_questions} questions following this format."""

def get_scenario_prompt(topic: str, difficulty: str, num_questions: int) -> str:
    """
    SCENARIO PROMPT:
    Output a JSON object with:
    - title (string)
    - questions (list of objects with "prompt" field)
    - correct_answer (string)
    - explanation (string)
    """
    return f"""Act as a Senior Data Scientist and hiring manager experienced in technical interviews for data science and ML roles. Create a **realistic interview scenario** related to {topic} at {difficulty} difficulty level, following the guidelines below.

CRITICAL REQUIREMENTS:
- Output a single JSON object with EXACTLY these 4 fields: title, questions, correct_answer, explanation
- "title": Set a realistic context (include company, role, and key scenario constraints)
- "questions": Array of {num_questions} objects, each with a "prompt" field. These should be logically connected, with each question building on the scenario.
- "correct_answer": A model answer or bullet points that demonstrate ideal approaches, frameworks, or considerations
- "explanation": Scoring rubric or specific criteria (technical accuracy, depth, communication, etc.)
- All fields are required and must be filled; do not leave any blank.

DIFFICULTY GUIDELINES:
- {difficulty} means: {{"Entry-level scenarios with basic problem-solving" if difficulty == "Easy" else "Mid-level complexity requiring analysis and trade-offs" if difficulty == "Medium" else "Senior-level challenges with complex constraints and decisions"}}

SCENARIO & QUESTION GUIDELINES:
- Set a professional, realistic context relevant to ML/Data Science (e.g., “You are a Machine Learning Engineer at a fintech company…”)
- For harder scenarios, occasionally use a short high-level system design question (not always, but for some hard questions).
- Each question in "questions" should build on the scenario logically, challenging the candidate's analysis, decision-making, and practical skills.
- Include practical trade-offs and interview-appropriate complexity.
- Make the scenario and questions engaging and relevant to real-world roles.

EXACT JSON FORMAT REQUIRED:
{{
  "title": "You are a [role] at [company]. [Scenario description with relevant context and constraints]",
  "questions": [
    {{"prompt": "How would you approach this problem initially?"}},
    {{"prompt": "What challenges might you face and how would you address them?"}},
    {{"prompt": "How would you measure success and iterate on your solution?"}}
    // ...add more as needed to total {num_questions}
  ],
  "correct_answer": "A strong answer should include: [key frameworks, best practices, considerations that show deep competency]",
  "explanation": "Evaluate based on: [criteria for scoring—technical accuracy, problem-solving, practicality, and communication clarity]"
}}

Generate a scenario with exactly {num_questions} questions in the questions array, following this structure and all requirements above. Do NOT include any extra text or formatting."""

def get_evaluation_prompt(user_answer: str, correct_answer: str, scenario_title: str, questions: str) -> str:
    """
    EVALUATION PROMPT:
    Output a JSON object with:
    - score (integer 0-100)
    - feedback (string)
    - correct_answer (string)
    """
    return f"""Act as a Senior Data Scientist and seasoned hiring manager. Evaluate the candidate's response to the scenario below, following the rubric and output specifications exactly.

SCENARIO TITLE:
{scenario_title}

QUESTIONS ASKED:
{questions}

USER'S ANSWER:
{user_answer}

REFERENCE ANSWER (for comparison):
{correct_answer}

CRITICAL OUTPUT REQUIREMENTS:
- Return **only** a single JSON object, no extra text or formatting.
- The JSON must contain exactly these three fields, using these exact names and order: score, feedback, correct_answer.
  • "score": integer 0-100 (must reflect the weighted rubric).  
  • "feedback": concise, specific, and actionable; highlight strengths first, then areas to improve.  
  • "correct_answer": a polished, ideal model answer that fully addresses the scenario.

RUBRIC & WEIGHTING (use when assigning the score):
- Technical accuracy - 40 %  
- Problem-solving methodology - 30 %  
- Communication clarity - 20 %  
- Practical considerations - 10 %

SCORING BANDS:
90-100  Exceptional: comprehensive, insightful, virtually flawless  
80-89   Strong: solid coverage with some notable insights  
70-79   Good: covers most key points, minor gaps  
60-69   Adequate: misses several important elements  
50-59   Weak: significant gaps or misunderstandings  
<50     Poor: major issues, little demonstrated competency

EXACT JSON FORMAT EXAMPLE (use this structure, adapt values):
{{
  "score": 85,
  "feedback": "Strengths: clear articulation of trade-offs and solid model selection rationale. Improvements: expand on data validation steps and provide more explicit performance metrics. Consider outlining an A/B testing plan for deployment.",
  "correct_answer": "An ideal answer would detail … [concise but complete model solution, trade-offs, validation strategy, monitoring plan, and communication approach]."
}}

Generate your evaluation now, following all instructions above and outputting only the JSON object."""

# ========================================================================================
# LANGGRAPH NODES
# ========================================================================================

def mcq_generation_node(state: AgentState) -> AgentState:
    """Generate MCQ challenges"""
    prompt = get_mcq_prompt(state['topic'], state['difficulty'], state['num_questions'])
    
    response = llm([HumanMessage(content=prompt)])
    questions_data = json.loads(response.content)
    
    # Simple validation and formatting
    validated_questions = []
    for q in questions_data:
        validated_questions.append({
            "title": q["title"],
            "options": json.dumps(q["options"]),  # Convert to JSON string for DB
            "correct_answer_id": q["correct_answer_id"],
            "explaination": q["explaination"]
        })
    
    state["result"] = validated_questions
    return state

def scenario_generation_node(state: AgentState) -> AgentState:
    """Generate scenario challenges"""
    prompt = get_scenario_prompt(state['topic'], state['difficulty'], state['num_questions'])
    
    response = llm([HumanMessage(content=prompt)])
    scenario_data = json.loads(response.content)
    
    # Format for database (questions as JSON string)
    result = {
        "title": scenario_data["title"],
        "questions": json.dumps(scenario_data["questions"]),  # Convert to JSON string for DB
        "correct_answer": scenario_data["correct_answer"],
        "explanation": scenario_data["explanation"]
    }
    
    state["result"] = result
    return state

def evaluation_node(state: AgentState) -> AgentState:
    """Evaluate scenario answers"""
    prompt = get_evaluation_prompt(
        state['user_answer'], 
        state['correct_answer'], 
        state['scenario_title'], 
        state['questions']
    )
    
    response = llm([HumanMessage(content=prompt)])
    eval_data = json.loads(response.content)
    
    # Format for database
    result = {
        "score": int(eval_data["score"]),  # Ensure integer for DB
        "feedback": eval_data["feedback"],
        "correct_answer": eval_data["correct_answer"]
    }
    
    state["result"] = result
    return state

# ========================================================================================
# LANGGRAPH WORKFLOWS
# ========================================================================================

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

# ========================================================================================
# PUBLIC API FUNCTIONS
# ========================================================================================

def generate_interview_challenges(topic: str, difficulty: str, num_questions: int) -> List[Dict[str, Any]]:
    """Generate MCQ challenges using LangGraph workflow"""
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
        "result": []
    }
    
    final_state = workflow.invoke(initial_state)
    return final_state["result"]

def generate_scenario_challenge(topic: str, difficulty: str, num_questions: int) -> Dict[str, Any]:
    """Generate scenario challenge using LangGraph workflow"""
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
    """Evaluate scenario answer using LangGraph workflow"""
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