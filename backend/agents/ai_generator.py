import os
from dotenv import load_dotenv
from typing import List, Dict, Any, Optional
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

load_dotenv()

if not os.getenv("OPENAI_API_KEY"):
    raise ValueError("OPENAI_API_KEY is not set")

api_key = os.getenv("OPENAI_API_KEY")

# Initialize the LangChain OpenAI chat model
llm = ChatOpenAI(api_key=api_key, temperature=0.7)

# --- PROMPT TEMPLATES (fill these in as needed) ---
MCQ_PROMPT_TEMPLATE = """"""
# TODO: Write your MCQ/interview challenge prompt here
""""""

SCENARIO_PROMPT_TEMPLATE = """"""
# TODO: Write your scenario challenge prompt here
""""""

# --- GENERATION FUNCTIONS ---
def generate_mcq_challenge(
    difficulty: str, topic: str, num_questions: int
) -> List[Dict[str, Any]]:
    """
    Generate a list of MCQ/interview challenges using the LLM.
    Returns a list of dicts matching the InterviewChallenge model fields.
    """
    prompt = ChatPromptTemplate.from_template(MCQ_PROMPT_TEMPLATE)
    # You can add more variables as needed
    formatted_prompt = prompt.format_messages(
        difficulty=difficulty, topic=topic, num_questions=num_questions
    )
    response = llm(formatted_prompt)
    # TODO: Parse response.content into the expected format
    # Example output structure:
    # [
    #   {
    #     "title": "What is backpropagation?",
    #     "options": ["A", "B", "C", "D"],
    #     "correct_answer_id": 2,
    #     "explaination": "Explanation here"
    #   },
    #   ...
    # ]
    raise NotImplementedError("Parsing logic for MCQ challenge not implemented.")


def generate_scenario_challenge(
    difficulty: str, topic: str, num_questions: int
) -> Dict[str, Any]:
    """
    Generate a scenario challenge using the LLM.
    Returns a dict matching the ScenarioChallenge model fields.
    """
    prompt = ChatPromptTemplate.from_template(SCENARIO_PROMPT_TEMPLATE)
    formatted_prompt = prompt.format_messages(
        difficulty=difficulty, topic=topic, num_questions=num_questions
    )
    response = llm(formatted_prompt)
    # TODO: Parse response.content into the expected format
    # Example output structure:
    # {
    #   "title": "You are a data scientist at a startup...",
    #   "questions": [
    #       {"prompt": "How would you handle overfitting?"},
    #       ...
    #   ],
    #   "correct_answer": "Ideal answer here",
    #   "explanation": "Rubric or feedback here"
    # }
    raise NotImplementedError("Parsing logic for scenario challenge not implemented.")

# --- EXTENSIBILITY ---
# To add more challenge types, define a new function and prompt template.
