"""Main entry point for the Re-CC application."""

import sys
import os
import logging
import typer
from typing import Optional
from rich.console import Console
from dotenv import load_dotenv

from re_cc import __version__
from re_cc.cli.app import app as cli_app
from re_cc.config.manager import ConfigManager
from re_cc.terminal.tui import launch_tui

# Load environment variables from .env file
load_dotenv()

# Setup logging
if os.environ.get("DEBUG", "").lower() in ("1", "true", "yes"):
    logging.basicConfig(
        level=logging.DEBUG,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[logging.StreamHandler()]
    )
    logging.debug("Debug logging enabled")
else:
    logging.basicConfig(level=logging.INFO)

console = Console()
app = typer.Typer(help="Re-CC: Multi-LLM terminal-based coding assistant")


@app.callback(invoke_without_command=True)
def callback(
    ctx: typer.Context,
    version: Optional[bool] = typer.Option(
        False, "--version", "-v", help="Display version information and exit"
    ),
    config: Optional[bool] = typer.Option(
        False, "--config", "-c", help="Launch configuration interface"
    ),
) -> None:
    """Re-CC: Multi-LLM terminal-based coding assistant."""
    # Only run the default action if no subcommand is provided
    if ctx.invoked_subcommand is not None:
        return
        
    if version:
        console.print(f"Re-CC version: [bold green]{__version__}[/]")
        sys.exit(0)
    
    if config:
        # Launch the TUI configuration interface
        launch_tui()
        sys.exit(0)
    
    # Launch the main CLI app (async) by default when no subcommand is provided
    import asyncio
    asyncio.run(cli_app())


@app.command()
def main() -> None:
    """Re-CC: Multi-LLM terminal-based coding assistant."""
    # Launch the main CLI app (async)
    import asyncio
    asyncio.run(cli_app())


@app.command()
def config(
    provider: str = typer.Option(None, help="Provider name (anthropic, openai, ollama, custom)"),
    api_key: Optional[str] = typer.Option(None, help="API key for the provider"),
    endpoint: Optional[str] = typer.Option(None, help="API endpoint for the provider"),
    model: Optional[str] = typer.Option(None, help="Model name to use"),
) -> None:
    """Configure provider settings."""
    config_manager = ConfigManager()
    
    if not provider:
        # If no provider specified, launch the TUI
        launch_tui()
        return
    
    if provider not in ["anthropic", "openai", "ollama", "custom"]:
        console.print(f"[bold red]Error:[/] Unknown provider: {provider}")
        console.print("Available providers: anthropic, openai, ollama, custom")
        sys.exit(1)
    
    # Handle the configuration
    try:
        config_manager.update_provider(
            provider=provider,
            api_key=api_key,
            endpoint=endpoint,
            model=model,
        )
        console.print(f"[bold green]Success:[/] Updated configuration for {provider}")
    except Exception as e:
        console.print(f"[bold red]Error:[/] {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    app()