"""Main entry point for the Re-CC application."""

import sys
import typer
from typing import Optional
from rich.console import Console

from re_cc import __version__
from re_cc.cli.app import app as cli_app
from re_cc.config.manager import ConfigManager
from re_cc.terminal.tui import launch_tui

console = Console()
app = typer.Typer(help="Re-CC: Multi-LLM terminal-based coding assistant")


@app.command()
def main(
    version: Optional[bool] = typer.Option(
        False, "--version", "-v", help="Display version information and exit"
    ),
    config: Optional[bool] = typer.Option(
        False, "--config", "-c", help="Launch configuration interface"
    ),
) -> None:
    """Re-CC: Multi-LLM terminal-based coding assistant."""
    if version:
        console.print(f"Re-CC version: [bold green]{__version__}[/]")
        sys.exit(0)
    
    if config:
        # Launch the TUI configuration interface
        launch_tui()
        sys.exit(0)
    
    # Launch the main CLI app
    cli_app()


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