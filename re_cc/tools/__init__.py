"""Tool registry and base classes for Re-CC tools."""

from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional, Callable, Type, Union, Set, Tuple
import inspect
import importlib
import logging
import re


@dataclass
class Tool:
    """Base class for all tools."""
    name: str
    description: str
    handler: Callable
    prompt: str 
    parameters: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    required_params: List[str] = field(default_factory=list)
    user_facing_name: Optional[str] = None
    # Visibility controls whether the tool is available to users, agents, or both
    visibility: str = "both"  # Options: "user", "agent", "both"
    # Command aliases for slash commands
    command_aliases: List[str] = field(default_factory=list)
    # Command pattern for slash command parsing (regex pattern string)
    command_pattern: Optional[str] = None
    
    def validate_parameters(self, params: Dict[str, Any]) -> Dict[str, str]:
        """Validate parameters for this tool.
        
        Args:
            params: Parameters to validate
            
        Returns:
            Dictionary of validation errors, empty if valid
        """
        errors = {}
        
        # Check required parameters
        for param_name in self.required_params:
            if param_name not in params:
                errors[param_name] = f"Parameter '{param_name}' is required"
        
        # Check parameter types
        for param_name, param_value in params.items():
            if param_name in self.parameters:
                param_spec = self.parameters[param_name]
                expected_type = param_spec.get("type")
                
                # Only validate if we have a type
                if expected_type and not isinstance(param_value, self._get_type(expected_type)):
                    errors[param_name] = f"Parameter '{param_name}' must be of type {expected_type}"
        
        return errors
    
    def _get_type(self, type_name: str) -> Type:
        """Convert type name to Python type.
        
        Args:
            type_name: Name of the type
            
        Returns:
            Python type object
        """
        type_map = {
            "string": str,
            "number": (int, float),
            "integer": int,
            "boolean": bool,
            "object": dict,
            "array": list,
        }
        
        return type_map.get(type_name, str)
    
    def is_user_visible(self) -> bool:
        """Check if this tool is visible to users.
        
        Returns:
            True if visible to users
        """
        return self.visibility in ("user", "both")
    
    def is_agent_visible(self) -> bool:
        """Check if this tool is visible to agents.
        
        Returns:
            True if visible to agents
        """
        return self.visibility in ("agent", "both")


class ToolRegistry:
    """Registry for available tools."""
    
    def __init__(self):
        """Initialize the tool registry."""
        self.tools: Dict[str, Tool] = {}
        self.command_patterns: Dict[str, Tool] = {}
    
    def register_tool(self, tool: Tool) -> None:
        """Register a tool.
        
        Args:
            tool: The tool to register
        """
        self.tools[tool.name] = tool
        
        # Register command pattern if provided
        if tool.command_pattern:
            self.command_patterns[tool.command_pattern] = tool
    
    def get_tool(self, name: str) -> Optional[Tool]:
        """Get a tool by name.
        
        Args:
            name: Name of the tool
            
        Returns:
            The tool, or None if not found
        """
        return self.tools.get(name)
    
    def list_tools(self, visibility: Optional[str] = None) -> List[Tool]:
        """List all registered tools with optional filtering by visibility.
        
        Args:
            visibility: Optional filter by visibility ("user", "agent", "both")
            
        Returns:
            List of tools
        """
        if visibility is None:
            return list(self.tools.values())
        
        return [
            tool for tool in self.tools.values() 
            if tool.visibility == visibility or tool.visibility == "both"
        ]
    
    def get_tool_names(self, visibility: Optional[str] = None) -> List[str]:
        """Get names of all registered tools with optional filtering by visibility.
        
        Args:
            visibility: Optional filter by visibility ("user", "agent", "both")
            
        Returns:
            List of tool names
        """
        return [tool.name for tool in self.list_tools(visibility)]
    
    def get_user_commands(self) -> Dict[str, Dict[str, Any]]:
        """Get all user-facing commands.
        
        Returns:
            Dictionary mapping command name to info dictionary
        """
        commands = {}
        
        for tool in self.list_tools(visibility="user"):
            # Use user_facing_name if available, otherwise tool name
            command_name = tool.user_facing_name or tool.name.lower()
            
            # Skip if already added (handles duplicates)
            if command_name in commands:
                continue
            
            commands[command_name] = {
                "tool": tool,
                "description": tool.description,
                "pattern": tool.command_pattern,
                "aliases": tool.command_aliases
            }
            
            # Add aliases
            for alias in tool.command_aliases:
                if alias not in commands:
                    commands[alias] = {
                        "tool": tool,
                        "description": f"Alias for {command_name}",
                        "pattern": None,  # Aliases don't have patterns
                        "is_alias": True,
                        "main_command": command_name
                    }
        
        return commands
    
    def match_command(self, command_text: str) -> Tuple[Optional[Tool], Dict[str, Any]]:
        """Match command text to a registered tool and extract arguments.
        
        Args:
            command_text: The command text to match
            
        Returns:
            Tuple of (matched tool or None, extracted arguments dictionary)
        """
        for pattern, tool in self.command_patterns.items():
            # Skip if tool is not user-visible
            if not tool.is_user_visible():
                continue
                
            match = re.match(pattern, command_text)
            if match:
                # Extract arguments from regex groups
                args = match.groups()
                # Convert tuple to dictionary based on required params
                arg_dict = {}
                
                # Match positional arguments to parameter names
                for i, param_name in enumerate(tool.required_params):
                    if i < len(args):
                        arg_dict[param_name] = args[i]
                
                return tool, arg_dict
        
        return None, {}


# Global tool registry instance
tool_registry = ToolRegistry()


def load_all_tools() -> None:
    """Load and register all available tools."""
    # List of all tool modules to import
    tool_modules = [
        "re_cc.tools.file_operations",
        "re_cc.tools.search",
        "re_cc.tools.agent",
        "re_cc.tools.mcp",
        "re_cc.tools.task",
        "re_cc.tools.system",
        "re_cc.tools.notebook",
        "re_cc.tools.pr",
        "re_cc.tools.planning",
        "re_cc.tools.bash",
        "re_cc.tools.provider",
        # Add more tool modules here as they are implemented
    ]
    
    # Import each module to register its tools
    for module_name in tool_modules:
        try:
            importlib.import_module(module_name)
            logging.debug(f"Loaded tool module: {module_name}")
        except ImportError as e:
            logging.error(f"Failed to load tool module {module_name}: {str(e)}")


# Load all tools on module import
load_all_tools()