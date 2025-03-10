"""Agent tools."""

from typing import Dict, Any, Optional

from re_cc.tools import Tool, tool_registry
from re_cc.prompts.tools import dispatch_agent_prompt
from re_cc.utils.agent import dispatch_agent as util_dispatch_agent


async def run_agent(prompt: str) -> Dict[str, Any]:
    """Run an agent to handle a task.
    
    Args:
        prompt: The prompt for the agent
        
    Returns:
        Agent response
    """
    try:
        if not prompt:
            return {"success": False, "error": "Prompt is required"}
            
        result = await util_dispatch_agent(prompt)
        
        return {
            "success": True,
            "prompt": prompt,
            "response": result
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


# Register tools
DispatchAgent = Tool(
    name="DispatchAgent",
    description="Launch an agent to perform a task.",
    handler=run_agent,
    prompt=dispatch_agent_prompt,
    parameters={
        "prompt": {"type": "string", "description": "The task for the agent to perform"}
    },
    required_params=["prompt"],
    user_facing_name="Agent"
)

# Register all tools
tool_registry.register_tool(DispatchAgent)