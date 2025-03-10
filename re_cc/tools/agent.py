"""Agent tools."""

from typing import Dict, Any, Optional

from re_cc.tools import Tool, tool_registry
from re_cc.prompts.tools import dispatch_agent_prompt
# Import the function directly to avoid circular imports
from re_cc.cli.app import process_query


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
            
        # Use the main process_query function with a custom system prompt for agent
        from re_cc.prompts.tools import dispatch_agent_prompt
        agent_system_prompt = dispatch_agent_prompt
        
        # Process the prompt with the agent system prompt
        result = await process_query(
            query=prompt,
            system_prompt=agent_system_prompt,
        )
        
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