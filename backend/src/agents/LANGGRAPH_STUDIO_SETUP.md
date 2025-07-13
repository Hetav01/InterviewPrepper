# 🎯 LangGraph Studio Integration Guide

This guide shows you how to connect your LangGraph agent to LangGraph Studio for powerful monitoring, debugging, and visualization capabilities.

## 🚀 What is LangGraph Studio?

LangGraph Studio is a visual debugging and monitoring tool that provides:
- **Real-time workflow visualization** 
- **Step-by-step execution tracking**
- **State inspection at each node**
- **Performance metrics and analytics**
- **Interactive debugging capabilities**
- **Collaboration features for teams**

## 📋 Prerequisites

1. **LangGraph Studio Account**: Sign up at [studio.langchain.com](https://studio.langchain.com)
2. **LangSmith API Key**: Get your API key from LangSmith dashboard
3. **Updated Dependencies**: Ensure you have the latest versions

## 🔧 Installation & Setup

### 1. Install Required Dependencies

```bash
pip install langsmith langgraph-studio
```

### 2. Update requirements.txt

Add these to your `requirements.txt`:

```txt
langsmith>=0.1.0
langgraph-studio>=0.1.0
langchain-core>=0.2.0
```

### 3. Environment Configuration

Add these to your `.env` file:

```env
# LangSmith Configuration
LANGCHAIN_TRACING_V2=true
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
LANGCHAIN_API_KEY=your_langsmith_api_key_here
LANGCHAIN_PROJECT=interview-prepper-agent

# Optional: Custom Studio Configuration
LANGGRAPH_STUDIO_URL=https://studio.langchain.com
LANGGRAPH_STUDIO_PROJECT_ID=your_project_id
```

## 🎨 Modified Agent Implementation

Update your `ai_generator_agentic.py` to include Studio integration:

```python
import os
from typing import List, Dict, Any, TypedDict
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, END
from langsmith import traceable
from langchain_core.tracers import LangChainTracer

load_dotenv()

# Configure LangSmith tracing
if os.getenv("LANGCHAIN_TRACING_V2"):
    tracer = LangChainTracer(
        project_name=os.getenv("LANGCHAIN_PROJECT", "interview-prepper-agent")
    )

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
    # Add metadata for Studio
    execution_id: str
    node_history: List[str]
    performance_metrics: Dict[str, Any]

# Add tracing decorators to your nodes
@traceable(name="mcq_generation_node")
def mcq_generation_node(state: AgentState) -> AgentState:
    """Node for generating MCQ challenges with Studio tracking"""
    state["node_history"].append("mcq_generation_node")
    
    # Your existing logic here...
    prompt = f"Generate {state['num_questions']} multiple choice questions..."
    
    # Add performance tracking
    import time
    start_time = time.time()
    
    response = llm([HumanMessage(content=prompt)])
    
    end_time = time.time()
    state["performance_metrics"]["mcq_generation_time"] = end_time - start_time
    
    # Your existing validation logic...
    
    return state

@traceable(name="scenario_generation_node")
def scenario_generation_node(state: AgentState) -> AgentState:
    """Node for generating scenario challenges with Studio tracking"""
    state["node_history"].append("scenario_generation_node")
    
    # Your existing logic with performance tracking...
    
    return state

@traceable(name="evaluation_node")
def evaluation_node(state: AgentState) -> AgentState:
    """Node for evaluating answers with Studio tracking"""
    state["node_history"].append("evaluation_node")
    
    # Your existing logic with performance tracking...
    
    return state
```

## 🔍 Enhanced Workflow Creation

Update your workflow creation functions:

```python
def create_mcq_workflow():
    """Create workflow for MCQ generation with Studio integration"""
    workflow = StateGraph(AgentState)
    
    # Add nodes with metadata
    workflow.add_node("generate", mcq_generation_node)
    workflow.set_entry_point("generate")
    workflow.add_edge("generate", END)
    
    # Compile with Studio configuration
    compiled_workflow = workflow.compile(
        checkpointer=None,  # Add checkpointer for state persistence
        debug=True if os.getenv("LANGCHAIN_TRACING_V2") else False
    )
    
    return compiled_workflow

@traceable(name="generate_interview_challenges")
def generate_interview_challenges(topic: str, difficulty: str, num_questions: int) -> List[Dict[str, Any]]:
    """Generate MCQ challenges with full Studio tracking"""
    workflow = create_mcq_workflow()
    
    import uuid
    execution_id = str(uuid.uuid4())
    
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
        "result": {},
        "execution_id": execution_id,
        "node_history": [],
        "performance_metrics": {}
    }
    
    # Execute with tracing
    final_state = workflow.invoke(
        initial_state,
        config={
            "callbacks": [tracer] if os.getenv("LANGCHAIN_TRACING_V2") else [],
            "tags": ["mcq_generation", f"difficulty_{difficulty}", f"topic_{topic}"],
            "metadata": {
                "execution_id": execution_id,
                "user_request": f"Generate {num_questions} {difficulty} questions on {topic}"
            }
        }
    )
    
    return final_state["result"]
```

## 📊 Studio Dashboard Setup

### 1. Create Project in Studio

1. Go to [studio.langchain.com](https://studio.langchain.com)
2. Create new project: "IntrVw. Agent"
3. Note your project ID for environment variables

### 2. Configure Monitoring

Set up monitoring for:
- **Execution frequency** per workflow type
- **Performance metrics** (response time, token usage)
- **Error rates** and failure patterns
- **User satisfaction** scores from evaluations

### 3. Custom Metrics

Add custom metrics to track:

```python
# In your agent functions
def log_custom_metrics(state: AgentState, metrics: Dict[str, Any]):
    """Log custom metrics to Studio"""
    from langsmith import Client
    
    client = Client()
    client.create_run(
        name="custom_metrics",
        inputs={"state": state},
        outputs={"metrics": metrics},
        run_type="tool",
        tags=["metrics", state["challenge_type"]]
    )
```

## 🎛️ Studio Features You Can Use

### 1. **Real-time Monitoring**
- Live workflow execution tracking
- Performance bottleneck identification
- Error rate monitoring

### 2. **Debugging Tools**
- Step-by-step state inspection
- Node execution timing
- Input/output validation

### 3. **Analytics Dashboard**
- Usage patterns analysis
- Performance trends
- User behavior insights

### 4. **Collaboration Features**
- Team workflow sharing
- Annotation and comments
- Version control integration

## 🔧 Advanced Configuration

### Custom Checkpointer for State Persistence

```python
from langgraph.checkpoint.sqlite import SqliteSaver

def create_workflow_with_checkpointer():
    """Create workflow with state persistence"""
    checkpointer = SqliteSaver.from_conn_string("checkpoints.db")
    
    workflow = StateGraph(AgentState)
    # ... add nodes ...
    
    return workflow.compile(checkpointer=checkpointer)
```

### Error Handling with Studio Integration

```python
@traceable(name="error_handler")
def handle_workflow_error(error: Exception, state: AgentState):
    """Handle errors with Studio logging"""
    from langsmith import Client
    
    client = Client()
    client.create_run(
        name="error_handler",
        inputs={"error": str(error), "state": state},
        outputs={"handled": True},
        run_type="tool",
        tags=["error", "workflow_failure"]
    )
```

## 🚀 Running with Studio Integration

### 1. Start Your Application

```bash
# Set environment variables
export LANGCHAIN_TRACING_V2=true
export LANGCHAIN_API_KEY=your_key_here

# Run your application
python -m uvicorn server:app --reload
```

### 2. Monitor in Studio

1. Open [studio.langchain.com](https://studio.langchain.com)
2. Navigate to your project
3. Watch real-time execution traces
4. Analyze performance metrics

### 3. Debug Issues

- Use the interactive debugger
- Inspect state at each node
- Replay failed executions
- Test workflow modifications

## 📈 Best Practices

1. **Meaningful Tags**: Use descriptive tags for easy filtering
2. **Custom Metadata**: Add context-rich metadata to runs
3. **Performance Tracking**: Monitor execution times and resource usage
4. **Error Categorization**: Classify errors for better debugging
5. **Regular Monitoring**: Set up alerts for unusual patterns

## 🎯 Studio Integration Benefits

- **🔍 Visibility**: Complete workflow transparency
- **🐛 Debugging**: Powerful debugging capabilities
- **📊 Analytics**: Deep insights into agent performance
- **🤝 Collaboration**: Team-friendly development environment
- **🚀 Optimization**: Data-driven performance improvements

## 🔗 Useful Resources

- [LangGraph Studio Documentation](https://docs.langchain.com/docs/langgraph-studio)
- [LangSmith Tracing Guide](https://docs.langchain.com/docs/langsmith)
- [LangGraph Best Practices](https://docs.langchain.com/docs/langgraph/best-practices)
- [Studio API Reference](https://docs.langchain.com/docs/langgraph-studio/api)

---

With this setup, you'll have complete visibility into your LangGraph agent's execution, making it easy to debug, optimize, and showcase your work to the world! 🌟 