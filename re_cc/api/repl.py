"""
Re-CC API for programmatic access.

This module provides a high-level API for programmatic integration with Re-CC.
"""

import asyncio
from typing import Any, AsyncGenerator, Dict, List, Optional, Union

from re_cc.repl.interface import ReCC, ReCCResponse


class ReCCAPI:
    """High-level API for programmatic integration with Re-CC.
    
    This class provides a simplified API for programmatic integration with Re-CC,
    abstracting away the details of the REPL interface.
    
    Example:
        ```python
        from re_cc.api.repl import ReCCAPI
        
        # Create an API instance
        api = ReCCAPI()
        
        # Send a query
        response = api.query("Explain the concept of monads in functional programming")
        print(response.text)
        
        # Stream a response
        async for chunk in api.stream_query("Write a recursive function to calculate factorial"):
            print(chunk.text, end="")
        ```
    """
    
    def __init__(
        self,
        provider_name: Optional[str] = None,
        config_path: Optional[str] = None,
        conversation_id: Optional[str] = None,
        debug: bool = False,
    ):
        """Initialize the Re-CC API.
        
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
    
    def query(self, prompt: str) -> ReCCResponse:
        """Send a query to the LLM and get a response.
        
        Args:
            prompt: The prompt to send to the LLM.
            
        Returns:
            The response from the LLM.
        """
        return self.recc.query(prompt)
    
    async def query_async(self, prompt: str) -> ReCCResponse:
        """Send a query to the LLM and get a response asynchronously.
        
        Args:
            prompt: The prompt to send to the LLM.
            
        Returns:
            The response from the LLM.
        """
        return await self.recc.query_async(prompt)
    
    async def stream_query(self, prompt: str) -> AsyncGenerator[ReCCResponse, None]:
        """Send a query to the LLM and stream the response.
        
        Args:
            prompt: The prompt to send to the LLM.
            
        Yields:
            Chunks of the response as they are received.
        """
        async for chunk in self.recc.stream_query(prompt):
            yield chunk
    
    def execute_command(self, command: str) -> ReCCResponse:
        """Execute a slash command or query the LLM.
        
        Args:
            command: The command or query to execute.
            
        Returns:
            The response from the command or LLM.
        """
        return self.recc.execute_command(command)
    
    async def execute_command_async(self, command: str) -> Union[ReCCResponse, AsyncGenerator[ReCCResponse, None]]:
        """Execute a slash command or query the LLM asynchronously.
        
        Args:
            command: The command or query to execute.
            
        Returns:
            The response from the command or LLM, or an async generator for streaming responses.
        """
        return await self.recc.execute_command_async(command)
    
    def clear_conversation(self) -> None:
        """Clear the conversation history."""
        self.recc.clear_conversation()
    
    def save_conversation(self) -> str:
        """Save the conversation history.
        
        Returns:
            The ID of the saved conversation.
        """
        return self.recc.save_conversation()
    
    def load_conversation(self, conversation_id: str) -> None:
        """Load a saved conversation.
        
        Args:
            conversation_id: The ID of the conversation to load.
        """
        self.recc.load_conversation(conversation_id)
    
    def switch_provider(self, provider_name: str) -> None:
        """Switch to a different LLM provider.
        
        Args:
            provider_name: The name of the provider to switch to.
        """
        self.recc.switch_provider(provider_name)
    
    def get_available_providers(self) -> List[str]:
        """Get the list of available providers.
        
        Returns:
            The list of available provider names.
        """
        return self.recc.get_available_providers()