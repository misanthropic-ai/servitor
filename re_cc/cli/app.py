"""Main CLI application logic."""

import asyncio
import os
import re
import shlex
import json
import importlib.util
from typing import Optional, List, Dict, Any, Tuple

# Import prompts from the prompts module
from re_cc.prompts.general import get_cli_system_prompt

from rich.console import Console
from rich.prompt import Prompt, Confirm
from rich.panel import Panel
from rich.markdown import Markdown
from rich.syntax import Syntax
from rich.table import Table
from rich.progress import Progress

from re_cc.config.manager import ConfigManager
from re_cc.providers.base import ProviderFactory
from re_cc.api.client import LLMClient
from re_cc.utils.git import is_git_repo, get_repo_info, get_modified_files
from re_cc.utils.fs import read_file, write_file, get_project_files
from re_cc.utils.search import search_with_ripgrep, find_function_definition, find_class_definition
from re_cc.utils.editor import edit_file, create_file, show_diff
from re_cc.utils.command import execute_command
from re_cc.utils.task import task_manager, TaskStatus
from re_cc.utils.mcp import mcp_manager
from re_cc.utils.agent import dispatch_agent
from re_cc.utils.conversation import conversation_buffer


console = Console()


async def process_query(
    query: str,
    provider_name: Optional[str] = None,
    system_prompt: Optional[str] = None,
    context: Optional[str] = None,
    conversation_history: Optional[List[Dict[str, Any]]] = None,
) -> str:
    """Process a query using the selected LLM provider.
    
    Args:
        query: The query to process
        provider_name: The provider to use, or None for default
        system_prompt: Optional system prompt
        context: Optional additional context
        conversation_history: Optional conversation history
        
    Returns:
        The response from the LLM
    
    TODO: Improve this function to better integrate with the planning system:
    1. Add a proper mechanism to select which tools to make available for each query
    2. Implement a more sophisticated tool call processing loop that can handle multiple rounds
    3. Improve the mechanism for tracking conversation state during tool usage
    4. Use the task system to structure multi-step operations
    """
    # Get the configuration
    config_manager = ConfigManager()
    
    # Use default provider if none specified
    if not provider_name:
        provider_name = config_manager.get_default_provider()
    
    # Create the provider
    try:
        provider = ProviderFactory.create(provider_name)
    except ValueError as e:
        console.print(f"[bold red]Error:[/] {str(e)}")
        console.print("Please run [bold]re-cc config[/] to configure providers.")
        return "Failed to initialize provider"
    
    # Generate the response
    console.print(f"[dim]Using provider:[/] [blue]{provider_name}[/]")
    
    # Prepare the full prompt with context if provided
    full_prompt = query
    if context:
        full_prompt = f"{context}\n\n{query}"
    
    # Get available tools from the registry
    from re_cc.tools import tool_registry
    available_tools = tool_registry.get_tool_names()
    
    with console.status("[bold green]Thinking...[/]"):
        try:
            # Generate initial response with tool calling capability
            response = await provider.generate(
                prompt=full_prompt,
                system_prompt=system_prompt,
                context=context,
                tools=available_tools,
            )
            
            # Check if the response includes tool calls
            if response.tool_calls:
                # Instead of processing tools directly here, use our improved Agent class
                # which supports multi-round tool calling and better state management
                from re_cc.utils.agent import Agent
                
                # Create a new agent with the current provider
                agent = Agent(provider_name=provider_name, system_prompt=system_prompt)
                
                # Initialize conversation history if provided
                if conversation_history:
                    agent._conversation_history = conversation_history.copy()
                
                # Let the agent handle the full processing flow, including multiple rounds of tool calls
                console.print("[dim]Using agent for tool processing...[/]")
                
                # Run the agent with the query and allow up to 5 iterations of tool calls
                with console.status("[bold green]Processing tools...[/]"):
                    final_response_text = await agent.run(query, max_iterations=5)
                
                # Update our conversation history with the agent's updated history
                # to ensure we preserve the tool call context for future interactions
                conversation_history = agent._conversation_history
                
                # Create an LLMResponse object for consistent return handling
                from re_cc.providers.base import LLMResponse
                final_response = LLMResponse(
                    text=final_response_text,
                    metadata={"processed_by_agent": True}
                )
                
                return final_response.text
            
            # No tool calls, just return the text response
            return response.text
        except Exception as e:
            console.print(f"[bold red]Error:[/] {str(e)}")
            return f"Failed to generate response: {str(e)}"


def extract_code_blocks(markdown: str) -> List[Tuple[str, str]]:
    """Extract code blocks from markdown.
    
    Args:
        markdown: The markdown text
        
    Returns:
        A list of tuples (language, code)
    """
    pattern = r"```(\w*)\n(.*?)```"
    return re.findall(pattern, markdown, re.DOTALL)


def get_repo_context() -> str:
    """Get context about the current Git repository.
    
    Returns:
        Context information as a string
    """
    if not is_git_repo():
        return "Not in a Git repository."
    
    try:
        repo_info = get_repo_info()
        modified_files = get_modified_files()
        
        context = f"Git Repository: {repo_info['root']}\n"
        context += f"Branch: {repo_info['branch']}\n"
        
        if repo_info['remote_url']:
            context += f"Remote: {repo_info['remote_url']}\n"
        
        if repo_info['latest_commit']:
            commit = repo_info['latest_commit']
            context += f"Latest commit: {commit['hash'][:8]} - {commit['message']}\n"
        
        if modified_files:
            context += "\nModified files:\n"
            for file in modified_files[:10]:  # Limit to 10 files
                context += f"- {file}\n"
            
            if len(modified_files) > 10:
                context += f"... and {len(modified_files) - 10} more files\n"
        
        return context
    except Exception as e:
        return f"Error getting repository context: {str(e)}"


def parse_special_commands(query: str) -> Tuple[bool, str, Dict[str, Any]]:
    """Parse special commands from the query.
    
    Args:
        query: The input query
        
    Returns:
        A tuple of (is_special_command, remaining_query, command_args)
    """
    # Mapping for special commands that don't directly map to tools
    special_command_patterns = {
        # Provider management - special handlers (not tool-based)
        r"^/provider\s+(.+)$": "set_provider",
        r"^/providers$": "list_providers",
    }
    
    # First, try to use the command patterns from the tool registry
    if query.startswith('/'):
        from re_cc.tools import tool_registry
        tool, params = tool_registry.match_command(query)
        
        if tool:
            return True, tool.name, {"args": tuple(params.values())}
    
    # If no tool match, check for special command patterns
    for pattern, command in special_command_patterns.items():
        match = re.match(pattern, query)
        if match:
            args = match.groups()
            return True, command, {"args": args}
    
    # Check for fuzzy command matches if no exact match
    if query.startswith('/'):
        command_name = query.split(' ')[0][1:]  # Extract command without slash and args
        
        # Get all user commands from registry
        from re_cc.tools import tool_registry
        user_commands = tool_registry.get_user_commands()
        
        # Find best fuzzy match
        best_match = None
        best_score = 0
        best_name = None
        
        # Check against all command names and aliases
        for cmd_name, cmd_info in user_commands.items():
            # Calculate similarity score
            score = 0
            for i, c in enumerate(command_name):
                if i < len(cmd_name) and c == cmd_name[i]:
                    score += 1
            
            # Normalize score
            if len(cmd_name) > 0:
                normalized_score = score / len(cmd_name)
                
                # Update best match if better
                if normalized_score > best_score and normalized_score > 0.5:  # Threshold
                    best_score = normalized_score
                    best_match = cmd_info["tool"]
                    best_name = cmd_name
        
        # Also check special command patterns for fuzzy matching
        for pattern in special_command_patterns:
            # Extract command name from pattern
            pattern_cmd = pattern.split('\\s+')[0][3:]  # Remove "^/" and anything after space
            
            # Calculate similarity score
            score = 0
            for i, c in enumerate(command_name):
                if i < len(pattern_cmd) and c == pattern_cmd[i]:
                    score += 1
            
            # Normalize score
            if len(pattern_cmd) > 0:
                normalized_score = score / len(pattern_cmd)
                
                # Update best match if better
                if normalized_score > best_score and normalized_score > 0.5:  # Threshold
                    best_score = normalized_score
                    best_match = special_command_patterns[pattern]
                    best_name = pattern_cmd
        
        # If we found a good fuzzy match
        if best_match:
            if isinstance(best_match, str):
                # Special command
                console.print(f"[dim]Assuming command: /{best_name}[/]")
                return True, best_match, {"args": tuple()}
            else:
                # Tool
                console.print(f"[dim]Assuming command: /{best_match.user_facing_name or best_match.name.lower()}[/]")
                return True, best_match.name, {"args": tuple()}
    
    return False, query, {}


async def handle_special_command(
    command: str,
    args: Dict[str, Any],
) -> Optional[str]:
    """Handle a special command.
    
    Args:
        command: The command to handle
        args: The command arguments
        
    Returns:
        Response text if the command was handled, None otherwise
    """
    command_args = args.get("args", ())
    
    # First, check if this is a direct tool name in the registry
    from re_cc.tools import tool_registry
    tool = tool_registry.get_tool(command)
    
    # If we found a tool with this name, execute it
    if tool and tool.is_user_visible():
        try:
            # Extract parameters from args
            params = {}
            
            # Map positional arguments to parameter names
            for i, param_name in enumerate(tool.required_params):
                if i < len(command_args):
                    params[param_name] = command_args[i]
            
            # Validate parameters
            errors = tool.validate_parameters(params)
            if errors:
                error_msgs = [f"{param}: {error}" for param, error in errors.items()]
                return f"Error: {', '.join(error_msgs)}"
            
            # Execute the tool
            console.print(f"[bold green]Running {tool.user_facing_name or tool.name}...[/]")
            result = tool.handler(**params)
            
            # Handle result based on success/failure
            if isinstance(result, dict) and "success" in result:
                if result["success"]:
                    if "message" in result:
                        return result["message"]
                    return f"{tool.user_facing_name or tool.name} completed successfully."
                else:
                    return f"Error: {result.get('error', 'Unknown error')}"
            
            # For non-standard returns
            return str(result) if result is not None else None
        except Exception as e:
            return f"Error executing {tool.name}: {str(e)}"
            
    # Special handlers for commands that aren't direct tool calls
    
    # Provider management
    if command == "set_provider":
        provider_name = command_args[0] if command_args else None
        if not provider_name:
            return "Error: Provider name is required"
            
        try:
            config_manager = ConfigManager()
            
            if provider_name not in config_manager.get_all_providers():
                return f"Provider not found: {provider_name}. Run /providers to see available providers."
            
            config_manager.set_default_provider(provider_name)
            return f"Default provider set to: {provider_name}"
        except Exception as e:
            return f"Error setting provider: {str(e)}"
    
    elif command == "list_providers":
        try:
            config_manager = ConfigManager()
            providers = config_manager.get_all_providers()
            default_provider = config_manager.get_default_provider()
            
            console.print("[bold green]Available providers:[/]")
            
            table = Table("Provider", "Model", "Default")
            
            for name, config in providers.items():
                is_default = name == default_provider
                table.add_row(
                    name,
                    config.model or "",
                    "✓" if is_default else "",
                )
            
            console.print(table)
            return None  # No response needed, providers already shown
        except Exception as e:
            return f"Error listing providers: {str(e)}"
            
    # Unknown command
    return f"Unknown command: {command}"
    
    # The following code is legacy and unreachable - left as reference until it can be removed
    r"""
    # File operations
    if command == "edit_file":
        file_path, content = command_args
        if not content:
            # Open the file in an editor
            try:
                if not os.path.exists(file_path):
                    return f"File not found: {file_path}"
                
                file_content = read_file(file_path)
                
                console.print(f"[bold green]Editing file:[/] {file_path}")
                console.print(Syntax(file_content, lexer=os.path.splitext(file_path)[1][1:]))
                
                # Let the user provide the new content
                new_content = ""
                while not new_content.strip():
                    console.print("[bold]Enter new content (or /cancel to cancel):[/]")
                    new_content = console.input()
                    
                    if new_content.strip() == "/cancel":
                        return "Edit cancelled."
                
                # Confirm the edit
                confirm = Confirm.ask("Are you sure you want to save these changes?")
                if not confirm:
                    return "Edit cancelled."
                
                # Save the changes
                write_file(file_path, new_content)
                return f"File edited: {file_path}"
            except Exception as e:
                return f"Error editing file: {str(e)}"
        else:
            # Edit specific content in the file
            try:
                # Get old and new content from LLM
                context = f"File path: {file_path}\n\nYou are being asked to edit this file. Specify what to change from and to."
                response = await process_query(
                    query=content,
                    context=context,
                )
                
                # Try to extract code blocks
                blocks = extract_code_blocks(response)
                if len(blocks) >= 2:
                    old_content = blocks[0][1]
                    new_content = blocks[1][1]
                    
                    # Show the diff
                    diff = show_diff(file_path, old_content, new_content)
                    console.print("\n".join(diff))
                    
                    # Confirm the edit
                    confirm = Confirm.ask("Apply these changes?")
                    if not confirm:
                        return "Edit cancelled."
                    
                    # Apply the changes
                    success, error = edit_file(file_path, old_content, new_content)
                    if success:
                        return f"File edited: {file_path}"
                    else:
                        return f"Error editing file: {error}"
                else:
                    return "Could not determine what to edit. Please provide before and after code blocks."
            except Exception as e:
                return f"Error editing file: {str(e)}"
    
    elif command == "view_file":
        file_path = command_args[0]
        try:
            if not os.path.exists(file_path):
                return f"File not found: {file_path}"
            
            file_content = read_file(file_path)
            console.print(f"[bold green]File:[/] {file_path}")
            console.print(Syntax(file_content, lexer=os.path.splitext(file_path)[1][1:]))
            return None  # No response needed, file content already shown
        except Exception as e:
            return f"Error reading file: {str(e)}"
    
    elif command == "create_file":
        file_path = command_args[0]
        try:
            if os.path.exists(file_path):
                return f"File already exists: {file_path}"
            
            # Let the user provide the content
            console.print(f"[bold green]Creating file:[/] {file_path}")
            console.print("[bold]Enter content (or /cancel to cancel):[/]")
            content = console.input()
            
            if content.strip() == "/cancel":
                return "File creation cancelled."
            
            # Confirm creation
            confirm = Confirm.ask("Are you sure you want to create this file?")
            if not confirm:
                return "File creation cancelled."
            
            # Create the file
            success, error = create_file(file_path, content)
            if success:
                return f"File created: {file_path}"
            else:
                return f"Error creating file: {error}"
        except Exception as e:
            return f"Error creating file: {str(e)}"
    
    elif command == "find_pattern":
        pattern = command_args[0]
        try:
            results = search_with_ripgrep(pattern)
            
            if not results:
                return f"No matches found for: {pattern}"
            
            # Show the results
            console.print(f"[bold green]Search results for:[/] {pattern}")
            
            table = Table("File", "Line", "Match")
            
            for result in results[:10]:  # Limit to 10 results
                file_name = os.path.basename(result.file_path)
                file_dir = os.path.dirname(result.file_path)
                file_display = f"{file_name} [dim]({file_dir})[/]"
                
                table.add_row(
                    file_display,
                    str(result.line_number),
                    result.line,
                )
            
            console.print(table)
            
            if len(results) > 10:
                console.print(f"[dim]... and {len(results) - 10} more matches[/]")
            
            return None  # No response needed, results already shown
        except Exception as e:
            return f"Error searching: {str(e)}"
    
    elif command == "find_function":
        function_name = command_args[0]
        try:
            result = find_function_definition(function_name)
            
            if not result:
                return f"Function not found: {function_name}"
            
            # Show the function
            console.print(f"[bold green]Function:[/] {function_name}")
            console.print(f"[bold]File:[/] {result.file_path}")
            console.print(f"[bold]Line:[/] {result.line_number}")
            
            # Show the context
            console.print("\n".join(result.context_before))
            console.print(result.line, style="bold")
            console.print("\n".join(result.context_after))
            
            return None  # No response needed, function already shown
        except Exception as e:
            return f"Error finding function: {str(e)}"
    
    elif command == "find_class":
        class_name = command_args[0]
        try:
            result = find_class_definition(class_name)
            
            if not result:
                return f"Class not found: {class_name}"
            
            # Show the class
            console.print(f"[bold green]Class:[/] {class_name}")
            console.print(f"[bold]File:[/] {result.file_path}")
            console.print(f"[bold]Line:[/] {result.line_number}")
            
            # Show the context
            console.print("\n".join(result.context_before))
            console.print(result.line, style="bold")
            console.print("\n".join(result.context_after))
            
            return None  # No response needed, class already shown
        except Exception as e:
            return f"Error finding class: {str(e)}"
    
    # Command execution
    elif command == "run_command":
        cmd = command_args[0]
        try:
            console.print(f"[bold]Running command:[/] {cmd}")
            
            # Execute the command with streaming output
            def print_output(line):
                console.print(line, end="")
            
            result = execute_command(
                command=cmd,
                stream_stdout=print_output,
                stream_stderr=print_output,
            )
            
            if result.success:
                return f"Command completed successfully in {result.duration:.2f} seconds."
            else:
                return f"Command failed with exit code {result.return_code} in {result.duration:.2f} seconds."
        except Exception as e:
            return f"Error running command: {str(e)}"
    
    elif command == "run_shell":
        cmd = command_args[0]
        try:
            import subprocess
            
            console.print(f"[bold]Running shell command:[/] {cmd}")
            
            # Execute the command interactively
            process = subprocess.run(
                cmd,
                shell=True,
                check=False,
            )
            
            if process.returncode == 0:
                return "Command completed successfully."
            else:
                return f"Command failed with exit code {process.returncode}."
        except Exception as e:
            return f"Error running command: {str(e)}"
    
    # Provider management
    elif command == "set_provider":
        provider_name = command_args[0]
        try:
            config_manager = ConfigManager()
            
            if provider_name not in config_manager.get_all_providers():
                return f"Provider not found: {provider_name}. Run /providers to see available providers."
            
            config_manager.set_default_provider(provider_name)
            return f"Default provider set to: {provider_name}"
        except Exception as e:
            return f"Error setting provider: {str(e)}"
    
    elif command == "list_providers":
        try:
            config_manager = ConfigManager()
            providers = config_manager.get_all_providers()
            default_provider = config_manager.get_default_provider()
            
            console.print("[bold green]Available providers:[/]")
            
            table = Table("Provider", "Model", "Default")
            
            for name, config in providers.items():
                is_default = name == default_provider
                table.add_row(
                    name,
                    config.model or "",
                    "✓" if is_default else "",
                )
            
            console.print(table)
            return None  # No response needed, providers already shown
        except Exception as e:
            return f"Error listing providers: {str(e)}"
    
    # Help and other
    elif command == "show_help":
        # Get user commands from the tool registry
        from re_cc.tools import tool_registry
        user_commands = tool_registry.get_user_commands()
        
        # Build a list of commands from the registry
        tool_commands = []
        for cmd_name, cmd_info in user_commands.items():
            # Skip aliases (we'll show them with the main command)
            if cmd_info.get("is_alias"):
                continue
                
            tool = cmd_info["tool"]
            
            # Get aliases if any
            aliases = cmd_info.get("aliases", [])
            alias_text = f" ({', '.join(aliases)})" if aliases else ""
            
            # Format command
            if tool.command_pattern:
                # Extract pattern format for display
                pattern = tool.command_pattern.replace(r"^/", "/").replace(r"$", "")
                # Remove regex symbols for cleaner display
                pattern = pattern.replace(r"(?:\s+", " [").replace(r")?", "]")
                pattern = pattern.replace(r"(.+)", "<text>").replace(r"(\S+)", "<arg>")
                pattern = pattern.replace(r"(\w+)", "<word>")
                cmd_text = f"{pattern}{alias_text} - {tool.description}"
            else:
                cmd_text = f"/{cmd_name}{alias_text} - {tool.description}"
                
            tool_commands.append(cmd_text)
        
        # Special commands that don't use the tool system
        special_commands = [
            "/provider <name> - Set active provider",
            "/providers - List available providers",
            "! <command> - Execute a shell command directly",
            "exit, quit, q - Exit the application"
        ]
        
        # Build the help text
        help_text = """
# Re-CC Commands

## Core Commands
"""
        # Add tool commands sorted alphabetically
        for cmd in sorted(tool_commands):
            help_text += f"- {cmd}\n"
            
        # Add special commands
        help_text += "\n## Special Commands\n"
        for cmd in special_commands:
            help_text += f"- {cmd}\n"
            
        help_text += """
Note: Commands support fuzzy matching (e.g., `/ver` for `/version`)
For file operations and code search, you can use direct shell commands with the `!` prefix.
"""
        console.print(Markdown(help_text))
        return None  # No response needed, help already shown
    
    elif command == "show_context":
        context = get_repo_context()
        console.print(f"[bold green]Repository Context:[/]\n{context}")
        return None  # No response needed, context already shown
    
    elif command == "compact_conversation":
        console.print("[bold green]Compacting conversation...[/]")
        
        if not conversation_buffer.messages:
            return "No conversation to compact."
        
        # The actual compaction happens in the main loop after this function returns
        return "Compacting conversation. This will summarize the history to save context space."
        
    elif command == "clear_conversation":
        console.print("[bold green]Clearing conversation history...[/]")
        
        # Clear the conversation buffer
        conversation_buffer.clear()
        
        # Update the in-memory conversation history
        conversation_history.clear()
        
        return "Conversation history cleared."
    
    elif command == "report_bug":
        console.print("[bold green]Report a Bug[/]")
        console.print("""
To report bugs or issues with Re-CC:

1. Visit the GitHub repository: [link]https://github.com/yourusername/re-cc/issues[/link]
2. Click on "New Issue"
3. Describe the bug with as much detail as possible
4. Include steps to reproduce the issue
5. Submit the issue

Alternatively, you can provide feedback here:
""")
        
        # Let the user provide feedback
        console.print("[bold]Enter your bug report or feedback (or /cancel to cancel):[/]")
        feedback = console.input()
        
        if feedback.strip() == "/cancel":
            return "Bug report cancelled."
        
        # In a real implementation, we would send this feedback to a server
        # For now, just acknowledge it
        return "Thank you for your feedback! Your report has been recorded."
    
    elif command == "show_version":
        from re_cc import __version__
        
        console.print(f"[bold green]Re-CC Version:[/] {__version__}")
        console.print("""
[dim]Recent updates:[/dim]
- Added file editing with diff visualization
- Added code search with language-specific patterns
- Added command execution with streaming output
- Added support for multiple LLM providers
- Added task management system for complex operations
- Added MCP services integration for extended capabilities
- Implemented hybrid planning system architecture
""")
        return None  # No response needed, version already shown
    
    elif command == "manage_tools":
        console.print("[bold green]Manage Tools[/]")
        
        # List available tools
        console.print("[bold]Available tools:[/]")
        
        table = Table("Tool", "Status", "Description")
        
        tools = [
            ("File Operations", "✓ Enabled", "View, edit, and create files"),
            ("Code Search", "✓ Enabled", "Search for patterns, functions, and classes"),
            ("Command Execution", "✓ Enabled", "Run commands with streaming output"),
            ("Git Integration", "✓ Enabled", "Interact with Git repositories"),
            ("Task Management", "✓ Enabled", "Create and track multi-step tasks"),
            ("MCP Services", "✓ Enabled", "Integrate with Claude MCP services"),
        ]
        
        for tool, status, description in tools:
            table.add_row(tool, status, description)
        
        console.print(table)
        
        # In a real implementation, we would allow enabling/disabling tools
        # For now, just show the available tools
        return None  # No response needed, tools already shown
    
    # Task management commands
    elif command == "create_task":
        task_description = command_args[0]
        try:
            # Split into name and description if possible
            if ":" in task_description:
                name, description = task_description.split(":", 1)
                name = name.strip()
                description = description.strip()
            else:
                name = "Task"
                description = task_description.strip()
            
            # Create the task
            task = task_manager.create_task(name, description)
            
            console.print(f"[bold green]Task created:[/] {task.name}")
            console.print(f"[bold]ID:[/] {task.id}")
            console.print(f"[bold]Description:[/] {task.description}")
            
            return None  # No response needed, task info already shown
        except Exception as e:
            return f"Error creating task: {str(e)}"
    
    elif command == "list_tasks":
        try:
            tasks = task_manager.get_all_tasks()
            
            if not tasks:
                return "No tasks found."
            
            console.print("[bold green]Tasks:[/]")
            
            table = Table("ID", "Name", "Status", "Progress", "Description")
            
            for task in tasks:
                progress_str = f"{int(task.progress * 100)}%"
                table.add_row(
                    task.id,
                    task.name,
                    task.status.value,
                    progress_str,
                    task.description
                )
            
            console.print(table)
            return None  # No response needed, tasks already shown
        except Exception as e:
            return f"Error listing tasks: {str(e)}"
    
    elif command == "task_status":
        task_id = command_args[0]
        try:
            task = task_manager.get_task(task_id)
            
            if not task:
                return f"Task not found: {task_id}"
            
            console.print(f"[bold green]Task:[/] {task.name}")
            console.print(f"[bold]ID:[/] {task.id}")
            console.print(f"[bold]Status:[/] {task.status.value}")
            console.print(f"[bold]Progress:[/] {int(task.progress * 100)}%")
            console.print(f"[bold]Description:[/] {task.description}")
            
            # Show subtasks if any
            if task.subtasks:
                console.print("\n[bold]Subtasks:[/]")
                
                for subtask_id in task.subtasks:
                    subtask = task_manager.get_task(subtask_id)
                    if subtask:
                        console.print(f"- {subtask.name}: {subtask.status.value}")
            
            return None  # No response needed, task info already shown
        except Exception as e:
            return f"Error getting task status: {str(e)}"
    
    elif command == "complete_task":
        task_id = command_args[0]
        try:
            result = task_manager.complete_task(task_id)
            
            if not result:
                return f"Task not found: {task_id}"
            
            return f"Task {task_id} marked as completed."
        except Exception as e:
            return f"Error completing task: {str(e)}"
    
    elif command == "cancel_task":
        task_id = command_args[0]
        try:
            result = task_manager.cancel_task(task_id)
            
            if not result:
                return f"Task not found: {task_id}"
            
            return f"Task {task_id} cancelled."
        except Exception as e:
            return f"Error cancelling task: {str(e)}"
    
    # Agent command
    elif command == "dispatch_agent":
        agent_prompt = command_args[0]
        try:
            if not agent_prompt:
                return "Agent prompt is required"
            
            console.print(f"[bold green]Dispatching agent...[/]")
            
            # Run the agent
            with console.status("[bold green]Agent working...[/]"):
                result = await dispatch_agent(agent_prompt)
            
            # Display the agent result
            console.print(Panel(
                Markdown(result),
                title="Agent Response",
                border_style="blue",
                expand=False,
            ))
            
            return None  # No response needed, agent result already shown
        except Exception as e:
            return f"Error dispatching agent: {str(e)}"
    
    # MCP service commands
    elif command == "list_services":
        try:
            # Load services
            mcp_manager.load_services()
            services = mcp_manager.get_all_services()
            
            if not services:
                return "No MCP services found. Use '/mcp add <url>' to add a service."
            
            console.print("[bold green]MCP Services:[/]")
            
            table = Table("ID", "Name", "Status", "Version", "Description")
            
            for service in services:
                table.add_row(
                    service.id,
                    service.name,
                    service.status,
                    service.version,
                    service.description
                )
            
            console.print(table)
            return None  # No response needed, services already shown
        except Exception as e:
            return f"Error listing MCP services: {str(e)}"
    
    elif command == "add_service":
        service_url = command_args[0]
        try:
            # Check if claude mcp is available
            try:
                import subprocess
                result = subprocess.run(
                    ["claude", "mcp", "--help"],
                    capture_output=True,
                    text=True
                )
                if result.returncode != 0:
                    return "Claude MCP is not available. Please install it first."
            except Exception:
                return "Claude MCP is not available. Please install it first."
            
            # Add the service
            success = mcp_manager.add_service(service_url)
            
            if success:
                return f"MCP service added: {service_url}"
            else:
                return f"Failed to add MCP service: {service_url}"
        except Exception as e:
            return f"Error adding MCP service: {str(e)}"
    
    elif command == "remove_service":
        service_id = command_args[0]
        try:
            # Remove the service
            success = mcp_manager.remove_service(service_id)
            
            if success:
                return f"MCP service removed: {service_id}"
            else:
                return f"Failed to remove MCP service: {service_id}"
        except Exception as e:
            return f"Error removing MCP service: {str(e)}"
    
    elif command == "execute_service":
        service_id = command_args[0]
        service_args = []
        
        if len(command_args) > 1 and command_args[1]:
            # Parse service args
            service_args = shlex.split(command_args[1])
        
        try:
            # Check if service exists
            service = mcp_manager.get_service(service_id)
            
            if not service:
                return f"MCP service not found: {service_id}"
            
            console.print(f"[bold green]Executing MCP service:[/] {service.name}")
            
            # Define callback for streaming output
            def output_callback(line):
                console.print(line, end="")
            
            # Execute the service
            with console.status(f"[bold green]Executing {service.name}...[/]"):
                result = mcp_manager.execute_service(service_id, service_args, output_callback)
            
            if "error" in result:
                return f"Error executing MCP service: {result['error']}"
            
            # For now, just return success
            return f"MCP service executed successfully: {service_id}"
        except Exception as e:
            return f"Error executing MCP service: {str(e)}"
    
    return None  # Command not recognized


def app() -> None:
    """Run the main CLI application."""
    console.print(Panel.fit(
        "Welcome to [bold green]Re-CC[/], a terminal-based AI coding assistant",
        title="Re-CC",
        border_style="green",
    ))
    
    # Check if we're in a Git repository
    in_git_repo = is_git_repo()
    
    # Start or load CLAUDE.md context
    claude_md_context = ""
    claude_md_path = os.path.join(os.getcwd(), "CLAUDE.md")
    if os.path.exists(claude_md_path):
        try:
            claude_md_context = f"CLAUDE.md file contents:\n{read_file(claude_md_path)}"
        except Exception:
            pass
    
    # Initialize or load existing conversation
    conversation_messages = conversation_buffer.get_messages()
    conversation_history = [
        {"role": msg.role, "content": msg.content} 
        for msg in conversation_messages
    ]
    
    # Use the CLI system prompt from the prompts module
    system_prompt = get_cli_system_prompt()

    # Gather repository context if in a git repo
    if in_git_repo:
        repo_context = get_repo_context()
        console.print(f"📁 [dim]{repo_context.splitlines()[0]}[/]")
        context = f"{claude_md_context}\n\nRepository Context:\n{repo_context}"
    else:
        context = claude_md_context
    
    # Show help hints
    console.print("[dim]Type /help for available commands or just chat with the assistant[/]")
    console.print("[dim]Use ! prefix for direct shell commands (e.g., !ls, !cat file.txt)[/]")
    console.print("[dim]Type /compact to summarize conversation history and save context space[/]")
    
    # Main interaction loop
    while True:
        try:
            query = Prompt.ask("\n[bold blue]>[/]")
            
            if query.lower() in ("exit", "quit", "q"):
                console.print("[dim]Goodbye![/]")
                break
            
            # Check for ! prefix for direct bash commands
            if query.startswith("!"):
                # Extract the bash command (remove the ! prefix)
                bash_cmd = query[1:].strip()
                
                if bash_cmd:
                    try:
                        console.print(f"[bold]Running command:[/] {bash_cmd}")
                        
                        # Execute the command with streaming output
                        def print_output(line):
                            console.print(line, end="")
                        
                        from re_cc.utils.command import execute_command
                        result = execute_command(
                            command=bash_cmd,
                            stream_stdout=print_output,
                            stream_stderr=print_output,
                        )
                        
                        if result.success:
                            console.print(f"\n[dim]Command completed successfully in {result.duration:.2f} seconds.[/]")
                        else:
                            console.print(f"\n[bold red]Command failed with exit code {result.return_code} in {result.duration:.2f} seconds.[/]")
                    except Exception as e:
                        console.print(f"[bold red]Error running command:[/] {str(e)}")
                    
                    # Don't add direct bash commands to conversation history
                    continue
            
            # Check for special commands
            is_special, command, args = parse_special_commands(query)
            
            if is_special:
                # Handle special command
                response = await handle_special_command(command, args)
                
                # Handle the /compact command specially for conversation management
                if command == "compact_conversation":
                    # Create a summarization function
                    async def summarize_conversation(content: str) -> str:
                        summary = await process_query(
                            query="Summarize our conversation so far in a detailed but concise way. Focus on information that would be helpful for continuing the conversation.",
                            system_prompt="You are a helpful AI assistant tasked with summarizing conversations.",
                            context=content,
                        )
                        return summary
                    
                    # Compact the conversation
                    with console.status("[bold green]Compacting conversation...[/]"):
                        await conversation_buffer.compact(summarize_conversation)
                        
                        # Update in-memory conversation history
                        conversation_messages = conversation_buffer.get_messages()
                        conversation_history = [
                            {"role": msg.role, "content": msg.content} 
                            for msg in conversation_messages
                        ]
                
                # Display the response if any
                if response:
                    console.print(response)
            else:
                # Add user message to history
                conversation_buffer.add_message("user", query)
                conversation_history.append({"role": "user", "content": query})
                
                # Process the query
                response = await process_query(
                    query=query,
                    system_prompt=system_prompt,
                    context=context,
                    conversation_history=conversation_history
                )
                
                # Add assistant response to history
                conversation_buffer.add_message("assistant", response)
                conversation_history.append({"role": "assistant", "content": response})
                
                # Display the response
                console.print(Panel(
                    Markdown(response),
                    border_style="dim",
                    expand=False,
                ))
        except KeyboardInterrupt:
            console.print("\n[dim]Interrupted[/]")
            continue
        except Exception as e:
            console.print(f"[bold red]Error:[/] {str(e)}")