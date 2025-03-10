"""Planning tools for reasoning and architecture design."""

from typing import Dict, List, Any, Optional

from re_cc.tools import Tool, tool_registry


def handle_thinking(thought: str) -> Dict[str, Any]:
    """Handler for the Thinking tool.
    
    Args:
        thought: The thought to log
        
    Returns:
        Result of the operation
    """
    try:
        # This tool doesn't actually do anything except log the thought
        # It's useful for the LLM to organize its reasoning process
        return {
            "success": True,
            "thought": thought,
            "message": "Thought logged"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Error logging thought: {str(e)}"
        }


def handle_architect(prompt: str, context: Optional[str] = None) -> Dict[str, Any]:
    """Handler for the Architect tool.
    
    Args:
        prompt: The prompt specifying the technical task
        context: Optional additional context
        
    Returns:
        Result of the operation
    """
    try:
        # This tool is for planning only, not for taking actions
        # It returns the prompt and context to encourage the LLM to
        # provide an architecture plan based on them
        return {
            "success": True,
            "prompt": prompt,
            "context": context or "",
            "message": "Planning started"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Error handling architect request: {str(e)}"
        }


# Tool prompt content
thinking_prompt = """
The Thinking tool logs thoughts without taking actions, aiding in complex reasoning.

Use this tool for brainstorming bug fixes, test strategies, refactoring, feature design, or debugging. The tool allows you to organize your thoughts transparently, returning only a log confirmation.

This is useful when:
- You need to break down a complex problem
- You want to explain your reasoning process
- You're exploring multiple solution approaches
- You're debugging something step by step
- You're planning a multi-step implementation

The tool doesn't actually perform any actions - it just helps you organize your thoughts.
"""

architect_prompt = """
The Architect tool plans technical implementations without coding.

This tool helps you analyze requirements, define technical approaches, and break tasks into actionable steps. It's designed for planning rather than code writing.

Key uses:
- Design system architecture
- Plan implementation strategies  
- Break down complex features
- Assess technical approaches
- Provide guidance for junior engineers

When using this tool, focus on the "why" and "how" rather than specific code details. Provide clear, structured plans that explain the reasoning behind architectural decisions.
"""

# Register the planning tools
# Do not use the decorator here since we're registering multiple tools
def register_planning_tools() -> List[Tool]:
    """Register planning tools."""
    tools = [
        Tool(
            name="Thinking",
            description="Logs thoughts without taking actions, aiding in complex reasoning",
            handler=handle_thinking,
            prompt=thinking_prompt,
            parameters={
                "thought": {"description": "The thought to log", "type": "string"}
            },
            required_params=["thought"]
        ),
        Tool(
            name="Architect",
            description="Plans technical implementations without coding",
            handler=handle_architect,
            prompt=architect_prompt,
            parameters={
                "prompt": {"description": "The prompt specifying the technical task", "type": "string"},
                "context": {"description": "Optional additional context", "type": "string"}
            },
            required_params=["prompt"]
        )
    ]
    
    return tools
    
    
# Register the planning tools
for tool in register_planning_tools():
    tool_registry.register_tool(tool)