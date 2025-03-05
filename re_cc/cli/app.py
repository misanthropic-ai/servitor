"""Main CLI application logic."""

import asyncio
import os
import re
import shlex
from typing import Optional, List, Dict, Any, Tuple

from rich.console import Console
from rich.prompt import Prompt, Confirm
from rich.panel import Panel
from rich.markdown import Markdown
from rich.syntax import Syntax
from rich.table import Table

from re_cc.config.manager import ConfigManager
from re_cc.providers.base import ProviderFactory
from re_cc.api.client import LLMClient
from re_cc.utils.git import is_git_repo, get_repo_info, get_modified_files
from re_cc.utils.fs import read_file, write_file, get_project_files
from re_cc.utils.search import search_with_ripgrep, find_function_definition, find_class_definition
from re_cc.utils.editor import edit_file, create_file, show_diff
from re_cc.utils.command import execute_command


console = Console()


async def process_query(
    query: str,
    provider_name: Optional[str] = None,
    system_prompt: Optional[str] = None,
    context: Optional[str] = None,
) -> str:
    """Process a query using the selected LLM provider.
    
    Args:
        query: The query to process
        provider_name: The provider to use, or None for default
        system_prompt: Optional system prompt
        context: Optional additional context
        
    Returns:
        The response from the LLM
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
    
    with console.status("[bold green]Thinking...[/]"):
        try:
            response = await provider.generate(
                prompt=full_prompt,
                system_prompt=system_prompt,
            )
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
    # Define command patterns
    patterns = {
        # File operations
        r"^/edit\s+(\S+)(?:\s+(.*))?$": "edit_file",
        r"^/view\s+(\S+)$": "view_file",
        r"^/create\s+(\S+)$": "create_file",
        r"^/find\s+(.+)$": "find_pattern",
        r"^/function\s+(.+)$": "find_function",
        r"^/class\s+(.+)$": "find_class",
        
        # Command execution
        r"^/run\s+(.+)$": "run_command",
        r"^/shell\s+(.+)$": "run_shell",
        
        # Provider management
        r"^/provider\s+(.+)$": "set_provider",
        r"^/providers$": "list_providers",
        
        # Help and other
        r"^/help$": "show_help",
        r"^/context$": "show_context",
    }
    
    # Check for command matches
    for pattern, command in patterns.items():
        match = re.match(pattern, query)
        if match:
            args = match.groups()
            return True, command, {"args": args}
    
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
        help_text = """
# Re-CC Commands

## File Operations
- `/edit <file> [description]` - Edit a file
- `/view <file>` - View a file
- `/create <file>` - Create a new file
- `/find <pattern>` - Search for a pattern in files
- `/function <name>` - Find a function definition
- `/class <name>` - Find a class definition

## Command Execution
- `/run <command>` - Run a command
- `/shell <command>` - Run a shell command

## Provider Management
- `/provider <name>` - Set the default provider
- `/providers` - List available providers

## Other
- `/help` - Show this help
- `/context` - Show repository context
- `exit`, `quit`, `q` - Exit the application
"""
        console.print(Markdown(help_text))
        return None  # No response needed, help already shown
    
    elif command == "show_context":
        context = get_repo_context()
        console.print(f"[bold green]Repository Context:[/]\n{context}")
        return None  # No response needed, context already shown
    
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
    
    if in_git_repo:
        # Show repository information
        context = get_repo_context()
        console.print(f"📁 [dim]{context.splitlines()[0]}[/]")
    
    # Show help hint
    console.print("[dim]Type /help for available commands[/]")
    
    # Main interaction loop
    while True:
        try:
            query = Prompt.ask("\n[bold blue]>[/]")
            
            if query.lower() in ("exit", "quit", "q"):
                console.print("[dim]Goodbye![/]")
                break
            
            # Check for special commands
            is_special, command, args = parse_special_commands(query)
            
            if is_special:
                # Handle special command
                response = await handle_special_command(command, args)
                
                # Display the response if any
                if response:
                    console.print(response)
            else:
                # Process the query
                response = asyncio.run(process_query(query))
                
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