"""Bash command execution and security tools."""

import re
import shlex
from typing import Dict, List, Any, Optional, Tuple

from re_cc.tools import Tool, tool_registry
from re_cc.prompts.tools import bash_tool_prompt
from re_cc.utils.command import execute_command as cmd_execute


BANNED_COMMANDS = [
    "curl", "wget", "axel", "aria2c", "nc", "netcat", "telnet", 
    "lynx", "w3m", "links", "httpie", "xh", "http-prompt",
    "chrome", "firefox", "safari", "chromium", "brave"
]


def analyze_command(command: str) -> Dict[str, Any]:
    """Analyze a bash command for safety.
    
    Args:
        command: The command to analyze
        
    Returns:
        Analysis result with command_prefix, has_injection, etc.
    """
    try:
        # Strip command of any leading/trailing whitespace
        command = command.strip()
        
        # Check for banned commands
        command_parts = shlex.split(command)
        if not command_parts:
            return {
                "command_prefix": "",
                "has_injection": False,
                "injection_type": None,
                "banned_commands": [],
                "analysis": "Empty command"
            }
        
        # Get the base command (first word)
        base_command = command_parts[0]
        
        # Check for simple command injection
        has_injection = False
        injection_type = None
        
        # Check for shell operators that could be used for command injection
        injection_patterns = [
            r"(;|&&|\|\||\|)", # Command separators
            r">(>)?|<(<)?",    # Redirects
            r"\$\(",           # Command substitution
            r"`",              # Backticks
            r"\$\{",           # Variable expansion
        ]
        
        for pattern in injection_patterns:
            if re.search(pattern, command):
                # This might be a false positive for legitimate use
                # so we'll just flag it rather than blocking
                has_injection = True
                injection_type = "Potential command injection detected"
                break
        
        # Check for banned commands
        found_banned_commands = []
        for banned in BANNED_COMMANDS:
            if banned == base_command or any(part == banned for part in command_parts):
                found_banned_commands.append(banned)
        
        return {
            "command_prefix": base_command,
            "has_injection": has_injection,
            "injection_type": injection_type,
            "banned_commands": found_banned_commands,
            "analysis": "Command analyzed for safety"
        }
    except Exception as e:
        return {
            "command_prefix": "",
            "has_injection": True,
            "injection_type": f"Error analyzing command: {str(e)}",
            "banned_commands": [],
            "analysis": f"Error: {str(e)}"
        }


def handle_bash_policy_spec(command: str) -> Dict[str, Any]:
    """Handler for the BashPolicySpec tool.
    
    Args:
        command: The command to analyze
        
    Returns:
        Result of the operation
    """
    try:
        analysis = analyze_command(command)
        
        result = {
            "success": True,
            "command": command,
            "command_prefix": analysis["command_prefix"],
            "command_injection_detected": analysis["has_injection"],
            "banned_commands": analysis["banned_commands"],
        }
        
        if analysis["has_injection"]:
            result["injection_type"] = analysis["injection_type"]
        
        if analysis["banned_commands"]:
            result["is_approved"] = False
            result["reason"] = f"Command contains banned components: {', '.join(analysis['banned_commands'])}"
        elif analysis["has_injection"]:
            result["is_approved"] = False
            result["reason"] = f"Potential command injection detected: {analysis['injection_type']}"
        else:
            result["is_approved"] = True
            result["reason"] = "Command appears safe"
        
        return result
    except Exception as e:
        return {
            "success": False,
            "error": f"Error analyzing command: {str(e)}"
        }


# Tool prompt content
bash_policy_spec_prompt = """
Analyzes bash commands to detect command injection and determine command prefixes for approval.

This tool helps ensure that commands are safe to execute by:
1. Checking for banned commands that could pose security risks
2. Detecting potential command injection patterns
3. Extracting the base command for approval

Usage:
- Pass a shell command to analyze
- The tool will return safety information including command prefix, injection detection, and approval status

The tool will check for unsafe commands like curl, wget, and network utilities which are banned for security reasons.

For increased safety, always review commands before execution, especially those containing shell operators like |, >, ;, &&, etc.
"""

def execute_command(command: str, timeout: Optional[int] = None) -> Dict[str, Any]:
    """Execute a shell command.
    
    Args:
        command: The command to execute
        timeout: Optional timeout in milliseconds
        
    Returns:
        Result of command execution
    """
    try:
        if not command:
            return {"success": False, "error": "Command is required"}
            
        # Analyze the command for safety
        analysis = analyze_command(command)
        
        # Check if command is banned
        if analysis["banned_commands"]:
            return {
                "success": False,
                "command": command,
                "error": f"Command contains banned components: {', '.join(analysis['banned_commands'])}",
                "is_approved": False
            }
            
        # Flag potential command injection
        if analysis["has_injection"]:
            # Still execute, but include the warning
            pass  # We might want to block this in the future
        
        # Convert timeout from ms to seconds if provided
        timeout_seconds = None
        if timeout:
            timeout_seconds = timeout / 1000
        
        # Execute the command
        result = cmd_execute(command=command, timeout=timeout_seconds)
        
        return {
            "success": result.success,
            "command": command,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "return_code": result.return_code,
            "duration": result.duration,
            "command_prefix": analysis["command_prefix"],
            "command_injection_detected": analysis["has_injection"],
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


# Register bash tools
@tool_registry.register_tool
def register_bash_tools() -> List[Tool]:
    """Register bash command execution and security tools."""
    tools = [
        Tool(
            name="Bash",
            description="Execute a shell command.",
            handler=execute_command,
            prompt=bash_tool_prompt,
            parameters={
                "command": {"type": "string", "description": "The command to execute"},
                "timeout": {"type": "integer", "description": "Optional timeout in milliseconds"}
            },
            required_params=["command"],
            user_facing_name="Bash"
        ),
        Tool(
            name="BashPolicySpec",
            description="Analyzes bash commands to detect command injection and determine command prefixes for approval",
            handler=handle_bash_policy_spec,
            prompt=bash_policy_spec_prompt,
            parameters={
                "command": {"description": "The command to analyze", "type": "string"}
            },
            required_params=["command"]
        )
    ]
    
    return tools