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
    return f"""Act as a Senior Data & AI Leader with extensive experience in hiring and mentoring candidates across Data Science, Machine Learning, Deep Learning, Data Engineering, Data Analytics, Artificial Intelligence, Neural Networks, Generative AI, NLP, Computer Vision, MLOps, and related fields. Your task is to generate {num_questions} multiple choice interview questions on the topic of {topic}, targeting the {difficulty} level as defined below.

CRITICAL REQUIREMENTS:
- Return a JSON array with EXACTLY {num_questions} questions.
- Each question object must have these 4 fields (using these exact field names): title, options, correct_answer_id, explaination
- options: array of exactly 4 plausible and roughly equal-length strings
- correct_answer_id: integer (0, 1, 2, or 3), matching the correct option's index in options
- explaination: a detailed, educational explanation of the answer (typo in field name is intentional—do NOT correct it)

DIFFICULTY GUIDELINES:
- {difficulty} difficulty means: {{"Basic concepts and definitions" if difficulty == "Easy" else "Intermediate application and analysis" if difficulty == "Medium" else "Advanced problem-solving and complex scenarios"}}

TOPIC COVERAGE:
Focus on real-world applications across these data-related domains:
- Data Science & Analytics: statistics, hypothesis testing, experimental design, business metrics
- Machine Learning: supervised/unsupervised learning, model selection, feature engineering, evaluation metrics
- Deep Learning: neural architectures, training strategies, optimization, regularization
- Data Engineering: ETL/ELT pipelines, data warehousing, streaming, cloud platforms, data quality
- Artificial Intelligence: search algorithms, knowledge representation, reasoning systems
- Natural Language Processing: text preprocessing, embeddings, transformers, language models
- Computer Vision: image processing, CNNs, object detection, segmentation
- Generative AI: GANs, VAEs, diffusion models, large language models, prompt engineering
- MLOps: model deployment, monitoring, versioning, CI/CD, infrastructure
- Big Data: distributed computing, Spark, Hadoop, NoSQL databases
- Cloud Platforms: AWS, GCP, Azure data services and ML platforms

QUALITY REQUIREMENTS:
- Questions should reflect real interview scenarios used in top tech companies, startups, and data-driven organizations.
- All 4 options must be plausible and competitive, avoiding obvious wrong answers.
- Include practical considerations like scalability, cost, performance, and business impact.
- Cover both theoretical understanding and hands-on implementation knowledge.
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
    - questions (list of objects with "prompt" and "explanation" fields)
    - correct_answer (string)
    - explanation (string)
    """
    return f"""Act as a Senior Data & AI Leader and hiring manager with extensive experience in technical interviews across Data Science, Machine Learning, Deep Learning, Data Engineering, Data Analytics, Artificial Intelligence, Neural Networks, Generative AI, NLP, Computer Vision, MLOps, and emerging AI technologies. Create a **realistic interview scenario** related to {topic} at {difficulty} difficulty level, following the guidelines below.

CRITICAL REQUIREMENTS:
- Output a single JSON object with EXACTLY these 4 fields: title, questions, correct_answer, explanation
- "title": Set a realistic context (include company, role, and key scenario constraints)
- "questions": Array of {num_questions} objects, each with "prompt" and "explanation" fields. These should be logically connected, with each question building on the scenario.
- "correct_answer": A model answer or bullet points that demonstrate ideal approaches, frameworks, or considerations for the overall scenario
- "explanation": General scoring rubric or specific criteria (technical accuracy, depth, communication, etc.) for the entire scenario
- All fields are required and must be filled; do not leave any blank.

DIFFICULTY GUIDELINES:
- {difficulty}

DOMAIN EXPERTISE AREAS:
Cover realistic scenarios from these high-demand fields:
- Data Science & Analytics: A/B testing, customer analytics, predictive modeling, business intelligence
- Machine Learning Engineering: model productionization, feature stores, model monitoring, AutoML
- Deep Learning: neural architecture design, training large models, transfer learning, model optimization
- Data Engineering: real-time data pipelines, data lakes, streaming analytics, data governance
- Artificial Intelligence: AI system design, multi-modal AI, AI safety, responsible AI
- Natural Language Processing: chatbot development, document analysis, search systems, LLM applications
- Computer Vision: image recognition systems, video analytics, medical imaging, autonomous systems
- Generative AI: content generation, AI assistants, prompt optimization, fine-tuning strategies
- MLOps & Platform: model deployment, containerization, orchestration, monitoring, scaling
- Big Data Analytics: distributed processing, real-time analytics, data lake architecture
- Cloud AI/ML: platform selection, cost optimization, serverless ML, edge deployment

SCENARIO & QUESTION GUIDELINES:
- Set a professional, realistic context relevant to modern data/AI roles (e.g., "You are a Senior ML Engineer at a fintech startup...", "As a Data Scientist at a healthcare company...")
- Include real-world constraints: budget, timeline, data privacy, scalability, regulatory compliance
- For harder scenarios, incorporate system design elements, cross-functional collaboration, and strategic decision-making
- Each question in "questions" should build on the scenario logically, challenging analytical thinking, technical depth, and practical implementation skills
- Each question should have its own specific explanation covering key technical and business considerations
- Include practical trade-offs between accuracy vs. latency, cost vs. performance, explainability vs. complexity
- Address modern challenges: data drift, model bias, ethical AI, GDPR compliance, model interpretability
- Make scenarios engaging and directly relevant to current industry practices and emerging trends

EXACT JSON FORMAT REQUIRED:
{{
  "title": "You are a [role] at [company]. [Scenario description with relevant context and constraints]",
  "questions": [
    {{
      "prompt": "How would you approach this problem initially?",
      "explanation": "Key points: data exploration strategy, problem definition, initial hypotheses, stakeholder alignment"
    }},
    {{
      "prompt": "What challenges might you face and how would you address them?",
      "explanation": "Key points: data quality issues, scalability concerns, model interpretability, deployment challenges"
    }},
    {{
      "prompt": "How would you measure success and iterate on your solution?",
      "explanation": "Key points: success metrics definition, A/B testing strategy, monitoring setup, feedback loops"
    }}
    // ...add more as needed to total {num_questions}
  ],
  "correct_answer": "A strong answer should include: [key frameworks, best practices, considerations that show deep competency for the overall scenario]",
  "explanation": "Evaluate based on: [criteria for scoring—technical accuracy, problem-solving, practicality, and communication clarity for the entire scenario]"
}}

Generate a scenario with exactly {num_questions} questions in the questions array, following this structure and all requirements above. Each question must have both prompt and explanation fields. Do NOT include any extra text or formatting."""

def get_evaluation_prompt(user_answer: str, correct_answer: str, scenario_title: str, questions: str) -> str:
    """
    EVALUATION PROMPT:
    Output a JSON object with:
    - score (integer 0-100)
    - feedback (string)
    - correct_answer (string)
    """
    return f"""Act as a Senior Data & AI Leader and seasoned hiring manager with expertise across Data Science, Machine Learning, Deep Learning, Data Engineering, Data Analytics, Artificial Intelligence, Neural Networks, Generative AI, NLP, Computer Vision, MLOps, and emerging technologies. Evaluate the candidate's response to the scenario below, following the rubric and output specifications exactly.

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
  • "score": integer 0-100 (must reflect the weighted rubric) The score must not always be a multiple of 5, it can be any number.  
  • "feedback": concise, specific, and actionable; highlight strengths first, then areas to improve.  
  • "correct_answer": a polished, ideal model answer that fully addresses the scenario.

EVALUATION CRITERIA FOR DATA & AI ROLES:
Consider expertise across these domains when scoring:
- Technical depth in relevant areas (ML/DL algorithms, data engineering patterns, AI architectures)
- Practical implementation knowledge (tools, frameworks, cloud platforms, best practices)
- System design thinking (scalability, reliability, performance, cost considerations)
- Data governance & ethics (privacy, bias, fairness, explainability, regulatory compliance)
- Business acumen (ROI, stakeholder management, problem framing, impact measurement)
- Modern practices (MLOps, AutoML, LLMOps, real-time ML, edge deployment)

RUBRIC & WEIGHTING (use when assigning the score)(be thorough in your evaluation, but remember to keep a light hand and the evaluation should sound like coming from a manager in a real interview. The score should be a reflection of the overall performance of the candidate. The explanation and guidance should be thorough but the tone should be light and friendly and as if sitting in a real interview.):
- Technical accuracy & depth - 40 %  
- Problem-solving methodology & system thinking - 30 %  
- Communication clarity & structure - 10 %  
- Practical considerations & business impact - 20 %

SCORING BANDS(use this as a guide, but the score can be any number. be strict but fair and consider that this is a real interview question so the answer can be a bit unstructured but if the main key points are there, you can consider it above good.):
90-100  Exceptional: comprehensive, insightful, demonstrates senior-level expertise across technical and business dimensions
80-89   Strong: solid technical foundation with good practical considerations and clear communication  
70-79   Good: covers most key technical points, shows understanding of practical constraints
60-69   Adequate: demonstrates basic competency but misses several important technical or business elements  
50-59   Weak: significant gaps in technical understanding or practical application
<50     Poor: major technical misconceptions, little demonstrated competency in the domain

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