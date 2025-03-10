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
# Removed dispatch_agent import to break circular import
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
    
    # Ensure all tools are loaded and get available tools from the registry
    from re_cc.tools import tool_registry, load_all_tools
    # Load all tools explicitly here to avoid circular imports
    load_all_tools() 
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
                # Handle tool calls directly in process_query
                console.print("[dim]Processing tool calls...[/]")
                
                # Process tools
                final_response_text = response.text
                tool_calls_processed = 0
                max_iterations = 5
                
                # Process tools in multiple iterations if needed
                while response.tool_calls and tool_calls_processed < max_iterations:
                    # Process each tool call
                    for tool_call in response.tool_calls:
                        tool_name = tool_call.get("name")
                        tool_params = tool_call.get("parameters", {})
                        
                        # Get the tool from registry
                        tool = tool_registry.get_tool(tool_name)
                        if not tool:
                            console.print(f"[bold red]Unknown tool:[/] {tool_name}")
                            continue
                        
                        # Execute the tool
                        try:
                            console.print(f"[dim]Executing tool:[/] {tool_name}")
                            # Check if the handler is async
                            if asyncio.iscoroutinefunction(tool.handler):
                                result = await tool.handler(**tool_params)
                            else:
                                result = tool.handler(**tool_params)
                            
                            # Add tool result to conversation for context
                            if conversation_history:
                                conversation_history.append({
                                    "role": "tool", 
                                    "tool_name": tool_name,
                                    "content": str(result)
                                })
                        except Exception as e:
                            console.print(f"[bold red]Error executing {tool_name}:[/] {str(e)}")
                            result = f"Error: {str(e)}"
                    
                    # Increment counter
                    tool_calls_processed += 1
                    
                    # Stop if we've reached the limit
                    if tool_calls_processed >= max_iterations:
                        break
                        
                    # Generate a follow-up response based on tool results
                    response = await provider.generate(
                        prompt="Continue processing based on the tool results",
                        system_prompt=system_prompt,
                        context=context,
                        tools=available_tools,
                        conversation_history=conversation_history
                    )
                    
                    # Update final response
                    final_response_text = response.text
                
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
    # First, try to use the command patterns from the tool registry
    if query.startswith('/'):
        from re_cc.tools import tool_registry
        tool, params = tool_registry.match_command(query)
        
        if tool:
            return True, tool.name, {"args": tuple(params.values())}
    
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
        
        # If we found a good fuzzy match
        if best_match:
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
    
    # Check if this is a direct tool name in the registry
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
            # Check if handler is async
            if asyncio.iscoroutinefunction(tool.handler):
                result = await tool.handler(**params)
            else:
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
            
    # Unknown command
    return f"Unknown command: {command}"


async def app() -> None:
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
                if command == "Compact":
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
                
                # Handle the /clear command specially for conversation management
                elif command == "Clear":
                    # Clear the conversation buffer
                    conversation_buffer.clear()
                    
                    # Update the in-memory conversation history
                    conversation_history.clear()
                
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
