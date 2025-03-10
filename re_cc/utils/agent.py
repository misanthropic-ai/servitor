"""Agent system for handling complex multi-step tasks."""

import asyncio
import re
import json
import shlex
import os
import platform
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple, Callable, Union

from rich.console import Console
from rich.panel import Panel
from rich.markdown import Markdown

from re_cc.api.client import LLMClient
from re_cc.providers.base import ProviderFactory, LLMProvider
from re_cc.config.manager import ConfigManager
from re_cc.utils.task import task_manager, Task, TaskStatus
from re_cc.prompts.general import get_tool_usage_prompt
from re_cc.utils.fs import read_file, write_file, get_project_files
from re_cc.utils.search import search_with_ripgrep, find_function_definition, find_class_definition
from re_cc.utils.editor import edit_file, create_file, show_diff
from re_cc.utils.command import execute_command
from re_cc.utils.mcp import mcp_manager
# Import the registry, but avoid circular import of Tool class
from re_cc.tools import tool_registry


console = Console()

# Import tool-specific prompts
from re_cc.prompts.tools import (
    view_file_prompt, edit_file_prompt, create_file_prompt, 
    ls_prompt, glob_tool_prompt, grep_tool_prompt, bash_tool_prompt, 
    dispatch_agent_prompt
)


async def dispatch_agent(prompt: str) -> str:
    """Dispatch an agent to handle a task.
    
    Args:
        prompt: The task prompt
        
    Returns:
        Agent response
    """
    # Create an agent instance
    agent = Agent()
    
    # Run the agent with the prompt
    response = await agent.run(prompt)
    
    return response


class Agent:
    """Agent that can execute commands and perform tasks."""
    
    def __init__(
        self, 
        provider_name: Optional[str] = None,
        system_prompt: Optional[str] = None,
        parent_task: Optional[Task] = None
    ):
        """Initialize the agent.
        
        Args:
            provider_name: Provider to use for the agent, or None for default
            system_prompt: Optional system prompt to use
            parent_task: Optional parent task for tracking
        """
        self.provider_name = provider_name
        self.system_prompt = system_prompt
        self.parent_task = parent_task
        self.task: Optional[Task] = None
        self.provider: Optional[LLMProvider] = None
        self._conversation_history: List[Dict[str, Any]] = []
        
        # Create a task for this agent if parent_task is provided
        if parent_task:
            self.task = task_manager.create_task(
                name="Agent Task",
                description="Executing agent commands",
                parent_id=parent_task.id
            )
            self.task.update_status(TaskStatus.IN_PROGRESS)
    
    async def _initialize_provider(self) -> None:
        """Initialize the provider for this agent."""
        # Get the configuration
        config_manager = ConfigManager()
        
        # Use default provider if none specified
        if not self.provider_name:
            self.provider_name = config_manager.get_default_provider()
        
        # Create the provider
        try:
            self.provider = ProviderFactory.create(self.provider_name)
        except ValueError as e:
            console.print(f"[bold red]Error initializing agent provider:[/] {str(e)}")
            raise
    
    def register_tools(self) -> None:
        """Register standard tools for this agent."""
        # File operations
        if not tool_registry.get_tool("ViewFile"):
            tool_registry.register_tool(Tool(
                name="ViewFile",
                description="Reads a file from the local filesystem",
                handler=self.view_file,
                prompt=view_file_prompt,
                parameters={
                    "file_path": {"description": "The absolute path to the file to read", "type": "string"},
                    "limit": {"description": "The number of lines to read", "type": "number"},
                    "offset": {"description": "The line number to start reading from", "type": "number"}
                },
                required_params=["file_path"]
            ))
            
        if not tool_registry.get_tool("EditFile"):
            tool_registry.register_tool(Tool(
                name="EditFile",
                description="Edits a file by replacing specific text",
                handler=self.edit_file,
                prompt=edit_file_prompt,
                parameters={
                    "file_path": {"description": "The absolute path to the file to modify", "type": "string"},
                    "old_string": {"description": "The text to replace", "type": "string"},
                    "new_string": {"description": "The text to replace it with", "type": "string"}
                },
                required_params=["file_path", "old_string", "new_string"]
            ))
            
        if not tool_registry.get_tool("CreateFile"):
            tool_registry.register_tool(Tool(
                name="CreateFile",
                description="Creates a new file with the specified content",
                handler=self.create_file,
                prompt=create_file_prompt,
                parameters={
                    "file_path": {"description": "The absolute path to the file to create", "type": "string"},
                    "content": {"description": "The content to write to the file", "type": "string"}
                },
                required_params=["file_path", "content"]
            ))
            
        if not tool_registry.get_tool("FindPattern"):
            tool_registry.register_tool(Tool(
                name="FindPattern",
                description="Searches file contents using regular expressions",
                handler=self.find_pattern,
                prompt=grep_tool_prompt,
                parameters={
                    "pattern": {"description": "The regular expression pattern to search for", "type": "string"}
                },
                required_params=["pattern"]
            ))
            
        if not tool_registry.get_tool("FindFunction"):
            tool_registry.register_tool(Tool(
                name="FindFunction",
                description="Finds a function definition in the codebase",
                handler=self.find_function,
                prompt="Finds a function definition in the codebase by name",
                parameters={
                    "function_name": {"description": "The name of the function to find", "type": "string"}
                },
                required_params=["function_name"]
            ))
            
        if not tool_registry.get_tool("FindClass"):
            tool_registry.register_tool(Tool(
                name="FindClass",
                description="Finds a class definition in the codebase",
                handler=self.find_class,
                prompt="Finds a class definition in the codebase by name",
                parameters={
                    "class_name": {"description": "The name of the class to find", "type": "string"}
                },
                required_params=["class_name"]
            ))
            
        if not tool_registry.get_tool("Bash"):
            tool_registry.register_tool(Tool(
                name="Bash",
                description="Executes a given bash command in a persistent shell session",
                handler=self.run_command,
                prompt=bash_tool_prompt,
                parameters={
                    "command": {"description": "The command to execute", "type": "string"},
                    "timeout": {"description": "Optional timeout in milliseconds", "type": "number"}
                },
                required_params=["command"]
            ))
            
        if not tool_registry.get_tool("CreateTask"):
            tool_registry.register_tool(Tool(
                name="CreateTask",
                description="Creates a new task for tracking",
                handler=self.create_task,
                prompt="Creates a new task for tracking progress",
                parameters={
                    "description": {"description": "The task description", "type": "string"}
                },
                required_params=["description"]
            ))
            
        if not tool_registry.get_tool("ListTasks"):
            tool_registry.register_tool(Tool(
                name="ListTasks",
                description="Lists all tasks",
                handler=self.list_tasks,
                prompt="Lists all tasks and their status",
                parameters={},
                required_params=[]
            ))
            
        if not tool_registry.get_tool("CompleteTask"):
            tool_registry.register_tool(Tool(
                name="CompleteTask",
                description="Marks a task as complete",
                handler=self.complete_task,
                prompt="Marks a task as complete",
                parameters={
                    "task_id": {"description": "The task ID to complete", "type": "string"}
                },
                required_params=["task_id"]
            ))
            
        if not tool_registry.get_tool("ListServices"):
            tool_registry.register_tool(Tool(
                name="ListServices",
                description="Lists all available MCP services",
                handler=self.list_services,
                prompt="Lists all available MCP services",
                parameters={},
                required_params=[]
            ))
            
        if not tool_registry.get_tool("ExecuteService"):
            tool_registry.register_tool(Tool(
                name="ExecuteService",
                description="Executes an MCP service",
                handler=self.execute_service,
                prompt="Executes an MCP service with the given arguments",
                parameters={
                    "service_id": {"description": "The service ID to execute", "type": "string"},
                    "args": {"description": "Optional arguments for the service", "type": "array"}
                },
                required_params=["service_id"]
            ))
    
    # Tool implementations
    def view_file(self, file_path: str) -> Dict[str, Any]:
        """View a file.
        
        Args:
            file_path: The path to the file
            
        Returns:
            Result of the operation
        """
        try:
            if not file_path:
                return {"success": False, "error": "File path is required"}
                
            content = read_file(file_path)
            return {
                "success": True,
                "content": content,
                "file_path": file_path
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def edit_file(self, file_path: str, old_content: str, new_content: str) -> Dict[str, Any]:
        """Edit a file.
        
        Args:
            file_path: The path to the file
            old_content: The content to replace
            new_content: The new content
            
        Returns:
            Result of the operation
        """
        try:
            if not file_path:
                return {"success": False, "error": "File path is required"}
                
            success, error = edit_file(file_path, old_content, new_content)
            
            if success:
                return {
                    "success": True,
                    "file_path": file_path,
                    "message": f"File edited: {file_path}"
                }
            else:
                return {"success": False, "error": error}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def create_file(self, file_path: str, content: str) -> Dict[str, Any]:
        """Create a file.
        
        Args:
            file_path: The path to the file
            content: The file content
            
        Returns:
            Result of the operation
        """
        try:
            if not file_path:
                return {"success": False, "error": "File path is required"}
                
            success, error = create_file(file_path, content)
            
            if success:
                return {
                    "success": True,
                    "file_path": file_path,
                    "message": f"File created: {file_path}"
                }
            else:
                return {"success": False, "error": error}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def find_pattern(self, pattern: str) -> Dict[str, Any]:
        """Search for a pattern in files.
        
        Args:
            pattern: The pattern to search for
            
        Returns:
            Result of the operation
        """
        try:
            if not pattern:
                return {"success": False, "error": "Pattern is required"}
                
            results = search_with_ripgrep(pattern)
            
            formatted_results = []
            for result in results:
                formatted_results.append({
                    "file_path": result.file_path,
                    "line_number": result.line_number,
                    "line": result.line
                })
            
            return {
                "success": True,
                "pattern": pattern,
                "results": formatted_results,
                "count": len(formatted_results)
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def find_function(self, function_name: str) -> Dict[str, Any]:
        """Find a function definition.
        
        Args:
            function_name: The function name to find
            
        Returns:
            Result of the operation
        """
        try:
            if not function_name:
                return {"success": False, "error": "Function name is required"}
                
            result = find_function_definition(function_name)
            
            if not result:
                return {
                    "success": False,
                    "error": f"Function not found: {function_name}"
                }
            
            return {
                "success": True,
                "function_name": function_name,
                "file_path": result.file_path,
                "line_number": result.line_number,
                "line": result.line,
                "context_before": result.context_before,
                "context_after": result.context_after
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def find_class(self, class_name: str) -> Dict[str, Any]:
        """Find a class definition.
        
        Args:
            class_name: The class name to find
            
        Returns:
            Result of the operation
        """
        try:
            if not class_name:
                return {"success": False, "error": "Class name is required"}
                
            result = find_class_definition(class_name)
            
            if not result:
                return {
                    "success": False,
                    "error": f"Class not found: {class_name}"
                }
            
            return {
                "success": True,
                "class_name": class_name,
                "file_path": result.file_path,
                "line_number": result.line_number,
                "line": result.line,
                "context_before": result.context_before,
                "context_after": result.context_after
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def run_command(self, command: str) -> Dict[str, Any]:
        """Run a command.
        
        Args:
            command: The command to run
            
        Returns:
            Result of the operation
        """
        try:
            if not command:
                return {"success": False, "error": "Command is required"}
            
            # Capture output as strings rather than streaming for agents
            result = execute_command(command=command)
            
            return {
                "success": result.success,
                "command": command,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "return_code": result.return_code,
                "duration": result.duration
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def create_task(self, description: str) -> Dict[str, Any]:
        """Create a task.
        
        Args:
            description: The task description
            
        Returns:
            Result of the operation
        """
        try:
            if not description:
                return {"success": False, "error": "Description is required"}
            
            # Parse name and description
            if ":" in description:
                name, desc = description.split(":", 1)
                name = name.strip()
                desc = desc.strip()
            else:
                name = "Task"
                desc = description.strip()
            
            task = task_manager.create_task(name, desc)
            
            return {
                "success": True,
                "task_id": task.id,
                "name": task.name,
                "description": task.description
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def list_tasks(self) -> Dict[str, Any]:
        """List all tasks.
        
        Returns:
            Result of the operation
        """
        try:
            tasks = task_manager.get_all_tasks()
            
            formatted_tasks = []
            for task in tasks:
                formatted_tasks.append({
                    "id": task.id,
                    "name": task.name,
                    "description": task.description,
                    "status": task.status.value,
                    "progress": task.progress
                })
            
            return {
                "success": True,
                "tasks": formatted_tasks,
                "count": len(formatted_tasks)
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def complete_task(self, task_id: str) -> Dict[str, Any]:
        """Complete a task.
        
        Args:
            task_id: The task ID
            
        Returns:
            Result of the operation
        """
        try:
            if not task_id:
                return {"success": False, "error": "Task ID is required"}
            
            success = task_manager.complete_task(task_id)
            
            if success:
                return {
                    "success": True,
                    "task_id": task_id,
                    "message": f"Task {task_id} completed"
                }
            else:
                return {
                    "success": False,
                    "error": f"Task not found: {task_id}"
                }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def list_services(self) -> Dict[str, Any]:
        """List MCP services.
        
        Returns:
            Result of the operation
        """
        try:
            # Load services
            mcp_manager.load_services()
            services = mcp_manager.get_all_services()
            
            formatted_services = []
            for service in services:
                formatted_services.append({
                    "id": service.id,
                    "name": service.name,
                    "description": service.description,
                    "version": service.version,
                    "status": service.status,
                    "capabilities": service.capabilities
                })
            
            return {
                "success": True,
                "services": formatted_services,
                "count": len(formatted_services)
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def execute_service(self, service_id: str, args: Optional[List[str]] = None) -> Dict[str, Any]:
        """Execute an MCP service.
        
        Args:
            service_id: The service ID
            args: Optional arguments for the service
            
        Returns:
            Result of the operation
        """
        try:
            if not service_id:
                return {"success": False, "error": "Service ID is required"}
            
            # Check if service exists
            service = mcp_manager.get_service(service_id)
            if not service:
                return {
                    "success": False,
                    "error": f"Service not found: {service_id}"
                }
            
            # Execute service
            result = mcp_manager.execute_service(
                service_id=service_id,
                args=args or []
            )
            
            if "error" in result:
                return {
                    "success": False,
                    "error": result["error"]
                }
            
            return {
                "success": True,
                "service_id": service_id,
                "result": result
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def call_tool(self, tool_name: str, **kwargs) -> Dict[str, Any]:
        """Call a tool by name with arguments.
        
        Args:
            tool_name: The tool name
            **kwargs: Tool arguments
            
        Returns:
            Tool result
        """
        # Get the tool from the registry
        tool = tool_registry.get_tool(tool_name)
        
        if not tool or not tool.handler:
            return {
                "success": False,
                "error": f"Tool not found: {tool_name}"
            }
        
        # Validate parameters
        errors = tool.validate_parameters(kwargs)
        if errors:
            return {
                "success": False,
                "error": f"Invalid parameters for tool {tool_name}: {errors}"
            }
            
        # Call the handler
        try:
            return tool.handler(**kwargs)
        except Exception as e:
            return {
                "success": False,
                "error": f"Error calling tool {tool_name}: {str(e)}"
            }
    
    async def process_tool_call(self, tool_call: Dict[str, Any]) -> Dict[str, Any]:
        """Process a tool call from the LLM.
        
        Args:
            tool_call: The tool call dictionary
            
        Returns:
            Tool result
        """
        try:
            # Extract tool call information
            tool_name = tool_call.get("name")
            tool_arguments = tool_call.get("arguments", {})
            
            # Handle different formats from different providers
            # Anthropic format
            if isinstance(tool_arguments, dict):
                arguments = tool_arguments
            # OpenAI format (JSON string)
            elif isinstance(tool_arguments, str):
                try:
                    arguments = json.loads(tool_arguments)
                except json.JSONDecodeError:
                    return {
                        "success": False,
                        "error": f"Invalid JSON in tool arguments: {tool_arguments}"
                    }
            else:
                arguments = {}
            
            if not tool_name:
                return {
                    "success": False,
                    "error": "Tool name is required"
                }
            
            # Log the tool call
            console.print(f"[dim]Agent calling tool: {tool_name}[/dim]")
            
            # Call the tool
            result = self.call_tool(tool_name, **arguments)
            
            # Add to conversation history
            self._conversation_history.append({
                "role": "function",
                "name": tool_name,
                "content": json.dumps(result)
            })
            
            return result
        except Exception as e:
            console.print(f"[bold red]Error processing tool call:[/] {str(e)}")
            return {
                "success": False,
                "error": f"Error processing tool call: {str(e)}"
            }
    
    def _format_conversation_history(self) -> str:
        """Format conversation history for context.
        
        Returns:
            The formatted history
        """
        if not self._conversation_history:
            return ""
        
        formatted = "## Previous conversation:\n\n"
        
        for msg in self._conversation_history:
            role = msg["role"]
            content = msg["content"]
            
            if role == "user":
                formatted += f"User: {content}\n\n"
            elif role == "assistant":
                formatted += f"Assistant: {content}\n\n"
            elif role == "function":
                name = msg.get("name", "function")
                formatted += f"Function {name}: {content}\n\n"
            else:
                formatted += f"System: {content}\n\n"
        
        return formatted
    
    async def run(self, prompt: str, max_iterations: int = 10) -> str:
        """Run the agent with a specific prompt.
        
        Args:
            prompt: The prompt to process
            max_iterations: Maximum number of tool call iterations
            
        Returns:
            The agent's response
        """
        try:
            # Register tools
            self.register_tools()
            
            # Initialize provider if needed
            if not self.provider:
                await self._initialize_provider()
            
            # Add prompt to conversation history
            self._conversation_history.append({
                "role": "user",
                "content": prompt
            })
            
            # Process the prompt
            with console.status(f"[bold green]Agent working...[/]"):
                # Set up the last prompt and response
                current_prompt = prompt
                final_response = None
                iterations = 0
                
                # Tool call loop - continue until we get a response with no tool calls or reach max iterations
                while iterations < max_iterations:
                    iterations += 1
                    
                    # Update progress if we have a task
                    if self.task:
                        # Calculate progress between 0.1 and 0.9 based on iterations
                        progress = min(0.1 + (0.8 * iterations / max_iterations), 0.9)
                        self.task.update_progress(progress)
                    
                    # Prepare context from conversation history
                    context = self._format_conversation_history()
                    
                    # Generate response with tool use
                    response = await self.provider.generate(
                        prompt=current_prompt,
                        system_prompt=self.system_prompt,
                        context=context,
                        tools=tool_registry.get_tool_names()
                    )
                    
                    # Save the response for potential return
                    final_response = response
                    
                    # Check if the response contains tool calls
                    if not response.tool_calls:
                        # No more tool calls, we're done
                        break
                    
                    # Process each tool call in sequence
                    tool_call_results = {}
                    has_failed_tool = False
                    
                    for idx, tool_call in enumerate(response.tool_calls):
                        # Process the tool call
                        tool_result = await self.process_tool_call(tool_call)
                        tool_name = tool_call.get("name", f"tool_{idx}")
                        tool_call_results[tool_name] = tool_result
                        
                        # Check if tool failed
                        if not tool_result.get("success", False):
                            has_failed_tool = True
                            console.print(f"[bold orange]Tool {tool_name} failed:[/] {tool_result.get('error', 'Unknown error')}")
                    
                    # If any tool failed, break the loop
                    if has_failed_tool:
                        # Give the LLM one more chance to respond with the tool failures
                        continue
                    
                    # Create a follow-up prompt for the LLM with the tool results
                    current_prompt = "Continue based on the tool results."
                    
                # Add final response to history
                if final_response:
                    self._conversation_history.append({
                        "role": "assistant",
                        "content": final_response.text
                    })
                    
                    # Mark task as completed if it exists
                    if self.task:
                        self.task.update_status(TaskStatus.COMPLETED)
                        self.task.update_progress(1.0)
                    
                    return final_response.text
                else:
                    error_msg = "Agent failed to generate a response after multiple attempts"
                    
                    # Mark task as failed if it exists
                    if self.task:
                        self.task.update_status(TaskStatus.FAILED)
                    
                    return error_msg
        except Exception as e:
            # Mark task as failed if it exists
            if self.task:
                self.task.update_status(TaskStatus.FAILED)
            
            error_msg = f"Agent error: {str(e)}"
            console.print(f"[bold red]{error_msg}[/]")
            return error_msg


async def dispatch_agent(prompt: str, provider_name: Optional[str] = None) -> str:
    """Create and run an agent with the given prompt.
    
    Args:
        prompt: The prompt for the agent
        provider_name: Optional provider name to use
        
    Returns:
        The agent's response
    """
    # Create a task for tracking
    task = task_manager.create_task(
        name="Agent Task",
        description=f"Processing prompt: {prompt[:50]}..."
    )
    task.update_status(TaskStatus.IN_PROGRESS)
    
    # Get the system prompt from the prompts file
    system_prompt = dispatch_agent_prompt
    
    try:
        # Create and run the agent
        console.print("[dim]Dispatching agent...[/dim]")
        agent = Agent(provider_name=provider_name, system_prompt=system_prompt, parent_task=task)
        
        # Run with a maximum of 5 iterations for tool calls
        result = await agent.run(prompt, max_iterations=5)
        
        # Check if the result is an error
        if result and result.startswith("Agent error:"):
            task.update_status(TaskStatus.FAILED)
            console.print(f"[bold red]Agent task failed:[/] {result}")
        else:
            task.update_status(TaskStatus.COMPLETED)
            task.update_progress(1.0)
        
        return result
    except Exception as e:
        # Mark task as failed if there's an exception
        task.update_status(TaskStatus.FAILED)
        error_msg = f"Agent dispatch error: {str(e)}"
        console.print(f"[bold red]{error_msg}[/]")
        return error_msg