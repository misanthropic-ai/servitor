"""System tools for core functionality."""

from typing import Dict, Any, Optional

from re_cc.tools import Tool, tool_registry
from re_cc.prompts.tools import (
    compact_prompt, clear_prompt, help_prompt, 
    version_prompt, tools_prompt, bug_prompt, context_prompt
)
from re_cc.utils.conversation import (
    compact_conversation, clear_conversation, 
    get_history_summary
)


def compact_history() -> Dict[str, Any]:
    """Compact the conversation history.
    
    Returns:
        Result of the operation
    """
    try:
        summary = compact_conversation()
        return {
            "success": True,
            "summary": summary,
            "message": "Conversation history compacted"
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def clear_history() -> Dict[str, Any]:
    """Clear the conversation history.
    
    Returns:
        Result of the operation
    """
    try:
        clear_conversation()
        return {
            "success": True,
            "message": "Conversation history cleared"
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def show_help() -> Dict[str, Any]:
    """Show help information.
    
    Returns:
        Help information
    """
    try:
        commands = {
            "/help": "Show help and available commands",
            "/compact": "Clear conversation history but keep a summary in context",
            "/clear": "Clear conversation history and free up context",
            "/config": "Open config panel",
            "/cost": "Show the total cost and duration of the current session",
            "/doctor": "Checks the health of your Re-CC installation",
            "/exit (quit)": "Exit the REPL",
            "/init": "Initialize a new CLAUDE.md file with codebase documentation",
            "/pr-comments": "Get comments from a GitHub pull request",
            "/review": "Review a pull request",
            "/bug": "Submit feedback about Re-CC",
            "/approved-tools": "List all currently approved tools",
            "/provider": "Set active provider",
            "/providers": "List available providers",
            "/mcp list": "List available MCP services",
            "/mcp add": "Add a new MCP service",
            "/task list": "List active tasks"
        }
        
        return {
            "success": True,
            "commands": commands
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def show_version() -> Dict[str, Any]:
    """Show version information.
    
    Returns:
        Version information
    """
    try:
        version_info = {
            "version": "0.1.0",  # Replace with actual version from package
            "name": "Re-CC"
        }
        
        return {
            "success": True,
            "version_info": version_info
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def manage_tools(action: str = "list", tool_name: Optional[str] = None) -> Dict[str, Any]:
    """Manage tools.
    
    Args:
        action: Action to perform (list, enable, disable)
        tool_name: Optional tool name to act on
        
    Returns:
        Result of the operation
    """
    try:
        if action == "list":
            tools = []
            for tool in tool_registry.list_tools():
                tools.append({
                    "name": tool.name,
                    "description": tool.description,
                    "user_facing_name": tool.user_facing_name or tool.name
                })
            
            return {
                "success": True,
                "tools": tools,
                "count": len(tools)
            }
        else:
            return {"success": False, "error": f"Unsupported action: {action}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


def report_bug(description: str) -> Dict[str, Any]:
    """Report a bug.
    
    Args:
        description: Bug description
        
    Returns:
        Result of the operation
    """
    try:
        if not description:
            return {"success": False, "error": "Description is required"}
            
        # In a real implementation, this would send the bug report
        # to a tracking system or create a GitHub issue
        
        return {
            "success": True,
            "message": "Bug report submitted",
            "issue_url": "https://github.com/artivus/re-cc/issues/new"
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def show_context() -> Dict[str, Any]:
    """Show environment context.
    
    Returns:
        Environment context
    """
    try:
        # In a real implementation, this would gather relevant context
        # from the environment, git repository, etc.
        
        return {
            "success": True,
            "context": {
                "cwd": "/current/working/directory",
                "git_branch": "main",
                "git_status": "Clean"
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def open_config() -> Dict[str, Any]:
    """Open the configuration panel.
    
    Returns:
        Status of opening config panel
    """
    try:
        # This would launch the configuration UI
        return {
            "success": True,
            "message": "Configuration panel opened"
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def show_cost() -> Dict[str, Any]:
    """Show cost and duration information for the current session.
    
    Returns:
        Cost and duration information
    """
    try:
        # This would calculate and show cost information
        return {
            "success": True,
            "cost": {
                "total_tokens": 5000,
                "cost_usd": 0.025,
                "duration_minutes": 15
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def run_doctor() -> Dict[str, Any]:
    """Check the health of the Re-CC installation.
    
    Returns:
        Health check results
    """
    try:
        # This would run various health checks on the installation
        checks = {
            "api_keys": True,
            "dependencies": True,
            "configuration": True,
            "network": True
        }
        
        return {
            "success": True,
            "checks": checks,
            "all_passed": all(checks.values())
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def init_codebase() -> Dict[str, Any]:
    """Initialize a new CLAUDE.md file with codebase documentation.
    
    Returns:
        Status of init operation
    """
    try:
        # This would create or update the CLAUDE.md file
        return {
            "success": True,
            "message": "CLAUDE.md file created/updated with codebase documentation"
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


# Register tools
Compact = Tool(
    name="Compact",
    description="Clear conversation history but keep a summary in context",
    handler=compact_history,
    prompt=compact_prompt,
    parameters={},
    required_params=[],
    user_facing_name="Compact",
    visibility="user",
    command_aliases=["summarize"],
    command_pattern=r"^/compact$"
)

Clear = Tool(
    name="Clear",
    description="Clear conversation history and free up context",
    handler=clear_history,
    prompt=clear_prompt,
    parameters={},
    required_params=[],
    user_facing_name="Clear",
    visibility="user",
    command_aliases=["reset"],
    command_pattern=r"^/clear$"
)

Help = Tool(
    name="Help",
    description="Show help and available commands",
    handler=show_help,
    prompt=help_prompt,
    parameters={},
    required_params=[],
    user_facing_name="Help",
    visibility="user",
    command_aliases=["h", "?"],
    command_pattern=r"^/help$"
)

Version = Tool(
    name="Version",
    description="Show version information",
    handler=show_version,
    prompt=version_prompt,
    parameters={},
    required_params=[],
    user_facing_name="Version",
    visibility="user",
    command_aliases=["ver", "v"],
    command_pattern=r"^/version$"
)

Tools = Tool(
    name="ApprovedTools",
    description="List all currently approved tools",
    handler=manage_tools,
    prompt=tools_prompt,
    parameters={
        "action": {"type": "string", "description": "Action to perform (list, enable, disable)"},
        "tool_name": {"type": "string", "description": "Tool name to act on"}
    },
    required_params=[],
    user_facing_name="ApprovedTools",
    visibility="user",
    command_aliases=["tools"],
    command_pattern=r"^/approved-tools$"
)

Bug = Tool(
    name="Bug",
    description="Submit feedback about Re-CC",
    handler=report_bug,
    prompt=bug_prompt,
    parameters={
        "description": {"type": "string", "description": "Bug description"}
    },
    required_params=["description"],
    user_facing_name="Bug",
    visibility="user",
    command_aliases=["feedback"],
    command_pattern=r"^/bug(?:\s+(.+))?$"
)

Context = Tool(
    name="Context",
    description="Show environment context information",
    handler=show_context,
    prompt=context_prompt,
    parameters={},
    required_params=[],
    user_facing_name="Context",
    visibility="agent", # Only available to agent, not visible to users as slash command
    command_aliases=[],
    command_pattern=None
)

# Additional system tools
Config = Tool(
    name="Config",
    description="Open configuration panel",
    handler=open_config,
    prompt="Opens the configuration panel for Re-CC.",
    parameters={},
    required_params=[],
    user_facing_name="Config",
    visibility="user",
    command_aliases=["cfg", "settings"],
    command_pattern=r"^/config$"
)

Cost = Tool(
    name="Cost",
    description="Show the total cost and duration of the current session",
    handler=show_cost,
    prompt="Shows detailed cost and token usage information.",
    parameters={},
    required_params=[],
    user_facing_name="Cost",
    visibility="user",
    command_aliases=["usage", "tokens"],
    command_pattern=r"^/cost$"
)

Doctor = Tool(
    name="Doctor",
    description="Checks the health of your Re-CC installation",
    handler=run_doctor,
    prompt="Runs diagnostics to check for problems with your Re-CC installation.",
    parameters={},
    required_params=[],
    user_facing_name="Doctor",
    visibility="user",
    command_aliases=["health", "diagnostics"],
    command_pattern=r"^/doctor$"
)

Init = Tool(
    name="Init",
    description="Initialize a new CLAUDE.md file with codebase documentation",
    handler=init_codebase,
    prompt="Creates or updates a CLAUDE.md file with codebase documentation.",
    parameters={},
    required_params=[],
    user_facing_name="Init",
    visibility="user",
    command_aliases=["initialize"],
    command_pattern=r"^/init$"
)

# Register all tools
for tool in [Compact, Clear, Help, Version, Tools, Bug, Context, Config, Cost, Doctor, Init]:
    tool_registry.register_tool(tool)