"""
REPL command-line interface for Re-CC.

This module provides a simple command-line REPL for interacting with Re-CC.
"""

import asyncio
import logging
import os
import sys
from typing import Optional

from rich.console import Console
from rich.markdown import Markdown
from rich.prompt import Prompt
from rich.syntax import Syntax

from re_cc.repl.interface import ReCC, ReCCResponse
from re_cc.utils.conversation import format_conversation

logger = logging.getLogger(__name__)


class ReplCLI:
    """Command-line REPL interface for Re-CC.
    
    This class provides a simple command-line REPL for interacting with Re-CC.
    It handles user input, executes commands, and displays responses.
    """
    
    def __init__(
        self,
        provider_name: Optional[str] = None,
        config_path: Optional[str] = None,
        conversation_id: Optional[str] = None,
        debug: bool = False,
    ):
        """Initialize the REPL CLI.
        
        Args:
            provider_name: The name of the LLM provider to use.
            config_path: The path to the configuration file.
            conversation_id: The ID of the conversation to resume.
            debug: Whether to enable debug logging.
        """
        self.recc = ReCC(
            provider_name=provider_name,
            config_path=config_path,
            conversation_id=conversation_id,
            debug=debug,
        )
        self.console = Console()
        self.running = False
    
    def print_welcome_message(self) -> None:
        """Print the welcome message."""
        self.console.print("[bold blue]Re-CC REPL[/bold blue]")
        self.console.print("Type [bold]/help[/bold] for available commands")
        self.console.print("Type [bold]/exit[/bold] to exit")
        self.console.print()
        
        # Display the current provider
        provider_name = type(self.recc.provider).__name__
        self.console.print(f"Using provider: [bold]{provider_name}[/bold]")
        self.console.print()
    
    def handle_exit_command(self) -> bool:
        """Handle the exit command.
        
        Returns:
            True if the REPL should exit, False otherwise.
        """
        # Ask if the user wants to save the conversation
        if len(self.recc.conversation.messages) > 0:
            save = Prompt.ask("Do you want to save this conversation?", choices=["y", "n"], default="n")
            if save.lower() == "y":
                conversation_id = self.recc.save_conversation()
                self.console.print(f"Conversation saved with ID: [bold]{conversation_id}[/bold]")
        
        return True
    
    def handle_help_command(self) -> None:
        """Handle the help command."""
        self.console.print("[bold]Available Commands:[/bold]")
        self.console.print("  [bold]/help[/bold]                     Show this help message")
        self.console.print("  [bold]/exit[/bold]                     Exit the REPL")
        self.console.print("  [bold]/clear[/bold]                    Clear the conversation history")
        self.console.print("  [bold]/save[/bold]                     Save the conversation")
        self.console.print("  [bold]/load[/bold] <conversation_id>   Load a saved conversation")
        self.console.print("  [bold]/provider[/bold] <provider_name> Switch to a different provider")
        self.console.print("  [bold]/providers[/bold]                List available providers")
        self.console.print("  [bold]/compact[/bold]                  Compact the conversation history")
        self.console.print()
        self.console.print("All other commands will be sent to the LLM as queries.")
    
    def handle_clear_command(self) -> None:
        """Handle the clear command."""
        self.recc.clear_conversation()
        self.console.print("Conversation history cleared")
    
    def handle_save_command(self) -> None:
        """Handle the save command."""
        conversation_id = self.recc.save_conversation()
        self.console.print(f"Conversation saved with ID: [bold]{conversation_id}[/bold]")
    
    def handle_load_command(self, args: str) -> None:
        """Handle the load command.
        
        Args:
            args: The command arguments.
        """
        if not args:
            self.console.print("[bold red]Error:[/bold red] Missing conversation ID")
            return
        
        try:
            self.recc.load_conversation(args)
            self.console.print(f"Loaded conversation: [bold]{args}[/bold]")
            
            # Display the conversation
            formatted = format_conversation(self.recc.conversation.messages)
            self.console.print(Markdown(formatted))
        except Exception as e:
            self.console.print(f"[bold red]Error:[/bold red] {str(e)}")
    
    def handle_provider_command(self, args: str) -> None:
        """Handle the provider command.
        
        Args:
            args: The command arguments.
        """
        if not args:
            self.console.print("[bold red]Error:[/bold red] Missing provider name")
            return
        
        try:
            self.recc.switch_provider(args)
            provider_name = type(self.recc.provider).__name__
            self.console.print(f"Switched to provider: [bold]{provider_name}[/bold]")
        except Exception as e:
            self.console.print(f"[bold red]Error:[/bold red] {str(e)}")
    
    def handle_providers_command(self) -> None:
        """Handle the providers command."""
        providers = self.recc.get_available_providers()
        self.console.print("[bold]Available Providers:[/bold]")
        for provider in providers:
            self.console.print(f"  {provider}")
    
    def handle_command(self, command: str) -> bool:
        """Handle a command.
        
        Args:
            command: The command to handle.
            
        Returns:
            True if the REPL should exit, False otherwise.
        """
        if not command:
            return False
        
        if command == "/exit":
            return self.handle_exit_command()
        elif command == "/help":
            self.handle_help_command()
        elif command == "/clear":
            self.handle_clear_command()
        elif command == "/save":
            self.handle_save_command()
        elif command.startswith("/load "):
            self.handle_load_command(command[6:].strip())
        elif command.startswith("/provider "):
            self.handle_provider_command(command[10:].strip())
        elif command == "/providers":
            self.handle_providers_command()
        else:
            # Execute the command or query
            try:
                response = self.recc.execute_command(command)
                if isinstance(response.text, str) and response.text.strip():
                    self.console.print(Markdown(response.text))
            except Exception as e:
                self.console.print(f"[bold red]Error:[/bold red] {str(e)}")
        
        return False
    
    async def handle_command_async(self, command: str) -> bool:
        """Handle a command asynchronously.
        
        Args:
            command: The command to handle.
            
        Returns:
            True if the REPL should exit, False otherwise.
        """
        if not command:
            return False
        
        if command == "/exit":
            return self.handle_exit_command()
        elif command == "/help":
            self.handle_help_command()
        elif command == "/clear":
            self.handle_clear_command()
        elif command == "/save":
            self.handle_save_command()
        elif command.startswith("/load "):
            self.handle_load_command(command[6:].strip())
        elif command.startswith("/provider "):
            self.handle_provider_command(command[10:].strip())
        elif command == "/providers":
            self.handle_providers_command()
        else:
            # Execute the command or query asynchronously
            try:
                result = await self.recc.execute_command_async(command)
                
                # Check if the result is a streaming response
                if hasattr(result, "__aiter__"):
                    # Stream the response
                    buffer = ""
                    async for chunk in result:
                        if chunk.text:
                            self.console.print(chunk.text, end="")
                            sys.stdout.flush()
                            buffer += chunk.text
                    self.console.print()  # Print a newline at the end
                else:
                    # Print the full response at once
                    if isinstance(result.text, str) and result.text.strip():
                        self.console.print(Markdown(result.text))
            except Exception as e:
                self.console.print(f"[bold red]Error:[/bold red] {str(e)}")
        
        return False
    
    def run(self) -> None:
        """Run the REPL synchronously."""
        self.running = True
        self.print_welcome_message()
        
        while self.running:
            try:
                command = Prompt.ask("\n[bold blue]>>[/bold blue]")
                should_exit = self.handle_command(command)
                if should_exit:
                    self.running = False
            except KeyboardInterrupt:
                self.console.print("\nUse [bold]/exit[/bold] to exit")
            except EOFError:
                self.running = False
    
    async def run_async(self) -> None:
        """Run the REPL asynchronously."""
        self.running = True
        self.print_welcome_message()
        
        while self.running:
            try:
                command = Prompt.ask("\n[bold blue]>>[/bold blue]")
                should_exit = await self.handle_command_async(command)
                if should_exit:
                    self.running = False
            except KeyboardInterrupt:
                self.console.print("\nUse [bold]/exit[/bold] to exit")
            except EOFError:
                self.running = False


def main(
    provider_name: Optional[str] = None,
    config_path: Optional[str] = None,
    conversation_id: Optional[str] = None,
    debug: bool = False,
    async_mode: bool = True,
) -> None:
    """Run the REPL CLI.
    
    Args:
        provider_name: The name of the LLM provider to use.
        config_path: The path to the configuration file.
        conversation_id: The ID of the conversation to resume.
        debug: Whether to enable debug logging.
        async_mode: Whether to run in async mode.
    """
    repl = ReplCLI(
        provider_name=provider_name,
        config_path=config_path,
        conversation_id=conversation_id,
        debug=debug,
    )
    
    if async_mode:
        asyncio.run(repl.run_async())
    else:
        repl.run()


if __name__ == "__main__":
    main()