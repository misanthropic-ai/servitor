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
                
                # Only validate if we have a type and the value is not None
                if expected_type and param_value is not None:
                    expected_python_type = self._get_type(expected_type)
                    
                    # Check if the type matches
                    if not isinstance(param_value, expected_python_type):
                        # For array type, check if we can convert to array/list
                        if expected_type == "array" and isinstance(param_value, str):
                            try:
                                # Try to interpret as comma-separated values
                                errors[param_name] = f"Parameter '{param_name}' must be an array/list, not a string. If you meant to provide multiple values, use a list instead of a comma-separated string."
                            except Exception:
                                errors[param_name] = f"Parameter '{param_name}' must be of type {expected_type}, not {type(param_value).__name__}"
                        else:
                            errors[param_name] = f"Parameter '{param_name}' must be of type {expected_type}, not {type(param_value).__name__}"
                
                # Check for additional constraints in the parameter spec
                if param_spec.get("enum") and param_value not in param_spec["enum"]:
                    valid_values = ", ".join([str(v) for v in param_spec["enum"]])
                    errors[param_name] = f"Parameter '{param_name}' must be one of: {valid_values}"
                
                # Check for numeric constraints
                if expected_type in ["number", "integer"] and param_value is not None:
                    if "minimum" in param_spec and param_value < param_spec["minimum"]:
                        errors[param_name] = f"Parameter '{param_name}' must be at least {param_spec['minimum']}"
                    if "maximum" in param_spec and param_value > param_spec["maximum"]:
                        errors[param_name] = f"Parameter '{param_name}' must be at most {param_spec['maximum']}"
        
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
        logging.debug(f"Registering tool: {tool.name}")
        self.tools[tool.name] = tool
        
        # Register command pattern if provided
        if tool.command_pattern:
            self.command_patterns[tool.command_pattern] = tool
            
        logging.debug(f"Tool registry now has {len(self.tools)} tools")
    
    def register_all_tools(self) -> None:
        """Register all available tools by loading all tool modules."""
        # Load all tool modules
        load_all_tools()
    
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
    
    def get_tool_by_command(self, command: str) -> Optional[Tool]:
        """Get a tool by its command name or alias.
        
        Args:
            command: The command name or alias
            
        Returns:
            The tool, or None if not found
        """
        commands = self.get_user_commands()
        if command in commands:
            return commands[command]["tool"]
        return None
    
    def execute(self, tool_name: str, **params) -> Any:
        """Execute a tool by name with parameters.
        
        Args:
            tool_name: Name of the tool to execute
            **params: Parameters to pass to the tool
            
        Returns:
            The result of the tool execution
            
        Raises:
            ValueError: If the tool is not found or parameters are invalid
            Exception: If the tool execution fails
        """
        # Try to find the tool
        tool = self.get_tool(tool_name)
        if not tool:
            # Check if tool exists with a different case
            available_tools = self.get_tool_names()
            for available_tool in available_tools:
                if available_tool.lower() == tool_name.lower():
                    return {
                        "success": False, 
                        "error": f"Tool '{tool_name}' not found. Did you mean '{available_tool}'?"
                    }
            
            error_message = f"Tool '{tool_name}' not found. Available tools: {', '.join(available_tools[:10])}"
            if len(available_tools) > 10:
                error_message += f" and {len(available_tools) - 10} more"
            
            return {"success": False, "error": error_message}
        
        # Validate parameters
        errors = tool.validate_parameters(params)
        if errors:
            error_str = ", ".join([f"{k}: {v}" for k, v in errors.items()])
            param_info = "Parameters provided: " + ", ".join([f"{k}={v!r}" for k, v in params.items()])
            required_params = f"Required parameters: {', '.join(tool.required_params)}" if tool.required_params else "No required parameters"
            error_detail = f"Invalid parameters for tool '{tool_name}': {error_str}\n{param_info}\n{required_params}"
            return {"success": False, "error": error_detail}
        
        try:
            # Execute the tool
            result = tool.handler(**params)
            
            # Ensure result has success field if it's a dict
            if isinstance(result, dict) and "success" not in result:
                result["success"] = True
                
            return result
        except Exception as e:
            error_detail = f"Error executing tool '{tool_name}': {str(e)}"
            logging.error(error_detail, exc_info=True)
            return {"success": False, "error": error_detail}
    
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
logging.debug("Created global tool registry instance")


def get_global_registry() -> ToolRegistry:
    """Get the global tool registry instance.
    
    Returns:
        The global tool registry
    """
    return tool_registry


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
    
    # Log the current tools before importing
    logging.debug(f"Current tools before loading: {len(tool_registry.tools)}")
    
    # Import each module to register its tools
    for module_name in tool_modules:
        try:
            module = importlib.import_module(module_name)
            logging.debug(f"Loaded tool module: {module_name}")
            
            # Check if module imported properly
            if hasattr(module, "__file__"):
                logging.debug(f"Module {module_name} loaded from {module.__file__}")
            
            # Check if tools were registered after loading this module
            logging.debug(f"Tools count after loading {module_name}: {len(tool_registry.tools)}")
        except ImportError as e:
            logging.error(f"Failed to load tool module {module_name}: {str(e)}")
    
    # Log all tools after loading all modules
    logging.debug(f"Final tools count: {len(tool_registry.tools)}")
    if tool_registry.tools:
        tool_names = list(tool_registry.tools.keys())
        logging.debug(f"Registered tools: {tool_names[:5]}...")
    else:
        logging.error("No tools registered!")


# We'll load tools explicitly in the app.py instead of on import
# This prevents circular imports