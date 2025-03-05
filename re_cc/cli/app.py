"""Main CLI application logic."""

import asyncio
import os
from typing import Optional, List

from rich.console import Console
from rich.prompt import Prompt
from rich.panel import Panel
from rich.markdown import Markdown

from re_cc.config.manager import ConfigManager
from re_cc.providers.base import ProviderFactory


console = Console()


async def process_query(
    query: str,
    provider_name: Optional[str] = None,
    system_prompt: Optional[str] = None,
) -> str:
    """Process a query using the selected LLM provider.
    
    Args:
        query: The query to process
        provider_name: The provider to use, or None for default
        system_prompt: Optional system prompt
        
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
    
    with console.status("[bold green]Thinking...[/]"):
        try:
            response = await provider.generate(
                prompt=query,
                system_prompt=system_prompt,
            )
            return response.text
        except Exception as e:
            console.print(f"[bold red]Error:[/] {str(e)}")
            return f"Failed to generate response: {str(e)}"


def app() -> None:
    """Run the main CLI application."""
    console.print(Panel.fit(
        "Welcome to [bold green]Re-CC[/], a terminal-based AI coding assistant",
        title="Re-CC",
        border_style="green",
    ))
    
    # Check if we're in a Git repository
    in_git_repo = os.path.exists(".git")
    
    if in_git_repo:
        console.print("📁 [dim]Working in Git repository[/]")
    
    # Main interaction loop
    while True:
        try:
            query = Prompt.ask("\n[bold blue]>[/]")
            
            if query.lower() in ("exit", "quit", "q"):
                console.print("[dim]Goodbye![/]")
                break
            
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