"""
Core REPL interface for Re-CC.

This module provides the core ReCC class for programmatic interaction
with the Re-CC application, enabling REPL functionality and integration
with other applications.
"""

import asyncio
import logging
from dataclasses import dataclass
from typing import Any, AsyncGenerator, Dict, List, Optional, Union

from re_cc.config.manager import ConfigManager
# Import all providers to ensure they get registered
from re_cc.providers import LLMProvider, ProviderFactory, LLMResponse
from re_cc.utils.conversation import ConversationBuffer
from re_cc.tools import ToolRegistry, get_global_registry

logger = logging.getLogger(__name__)


@dataclass
class ReCCResponse:
    """Response from the Re-CC REPL interface.
    
    This dataclass encapsulates the response from an LLM query, including
    the full text response, any tool calls that were made, the raw
    response from the provider, and the results of any tool calls.
    """
    text: str
    tool_calls: List[Dict[str, Any]] = None
    raw_response: Any = None
    tool_results: List[Dict[str, Any]] = None
    
    def __str__(self) -> str:
        """Return the text of the response."""
        return self.text


class ReCC:
    """Core Re-CC interface for programmatic access.
    
    This class provides a programmatic interface to Re-CC, enabling REPL
    functionality and integration with other applications.
    
    Attributes:
        config: The configuration manager.
        provider: The LLM provider.
        conversation: The conversation buffer.
        tool_registry: The registry of available tools.
    """
    
    def __init__(
        self,
        provider_name: Optional[str] = None,
        config_path: Optional[str] = None,
        conversation_id: Optional[str] = None,
        debug: bool = False,
    ):
        """Initialize the Re-CC interface.
        
        Args:
            provider_name: The name of the LLM provider to use.
            config_path: The path to the configuration file.
            conversation_id: The ID of the conversation to resume.
            debug: Whether to enable debug logging.
        """
        self.config = ConfigManager(config_path)
        
        if debug:
            logging.basicConfig(level=logging.DEBUG)
        
        # Get the global tool registry
        logger.debug("Getting global tool registry")
        self.tool_registry = get_global_registry()
        
        # Make sure tools are loaded
        self.tool_registry.register_all_tools()
        
        # Log the registered tools
        logger.debug(f"Using global registry with {len(self.tool_registry.tools)} tools")
        if len(self.tool_registry.tools) > 0:
            tool_names = list(self.tool_registry.tools.keys())
            logger.debug(f"First 5 tools: {tool_names[:5]}")
        
        # Initialize the provider
        provider_name = provider_name or self.config.get_default_provider()
        logger.debug(f"Initializing provider: {provider_name}")
        self.provider = self._initialize_provider(provider_name)
        
        # Initialize the conversation buffer
        self.conversation = ConversationBuffer(conversation_id)
        logger.debug("ReCC initialization complete")
    
    def _initialize_provider(self, provider_name: str) -> LLMProvider:
        """Initialize the LLM provider.
        
        Args:
            provider_name: The name of the provider to initialize.
            
        Returns:
            The initialized provider.
        """
        return ProviderFactory.create(provider_name)
    
    def get_available_providers(self) -> List[str]:
        """Get the list of available providers.
        
        Returns:
            The list of available provider names.
        """
        return self.config.get_available_providers()
    
    def switch_provider(self, provider_name: str) -> None:
        """Switch to a different LLM provider.
        
        Args:
            provider_name: The name of the provider to switch to.
        """
        self.provider = self._initialize_provider(provider_name)
        logger.debug(f"Switched to provider: {provider_name}")
    
    def clear_conversation(self) -> None:
        """Clear the conversation history."""
        self.conversation.clear()
        logger.debug("Conversation history cleared")
    
    def save_conversation(self) -> str:
        """Save the conversation history.
        
        Returns:
            The ID of the saved conversation.
        """
        return self.conversation.save()
    
    def load_conversation(self, conversation_id: str) -> None:
        """Load a saved conversation.
        
        Args:
            conversation_id: The ID of the conversation to load.
        """
        self.conversation.load(conversation_id)
        logger.debug(f"Loaded conversation: {conversation_id}")
    
    def query(self, prompt: str) -> ReCCResponse:
        """Send a query to the LLM and get a response.
        
        This is a synchronous wrapper around query_async.
        
        Args:
            prompt: The prompt to send to the LLM.
            
        Returns:
            The response from the LLM.
        """
        return asyncio.run(self.query_async(prompt))
    
    async def query_async(self, prompt: str) -> ReCCResponse:
        """Send a query to the LLM and get a response asynchronously.
        
        Args:
            prompt: The prompt to send to the LLM.
            
        Returns:
            The response from the LLM.
        """
        # Add the user message to the conversation
        self.conversation.add_user_message(prompt)
        
        # Get the full conversation context
        context = self.conversation.get_context()
        
        # Get list of tool names to pass to the provider
        tool_names = []
        for tool_name, tool in self.tool_registry.tools.items():
            if tool.is_agent_visible():
                tool_names.append(tool_name)
        
        logger.debug(f"Passing {len(tool_names)} tools to provider")
        for name in tool_names[:10]:  # Log first 10 to avoid too much output
            logger.debug(f"Tool for provider: {name}")
        if len(tool_names) > 10:
            logger.debug(f"...and {len(tool_names) - 10} more tools")
        
        # Query the provider with tools
        try:
            response = await self.provider.generate(
                prompt, 
                context=context, 
                tools=tool_names
            )
            
            logger.debug(f"Response received from provider: {type(response)}")
            logger.debug(f"Response text length: {len(response.text)}")
            logger.debug(f"Tool calls in response: {response.tool_calls}")
            
            # Process tool calls if any
            tool_results = []
            if response.tool_calls and len(response.tool_calls) > 0:
                logger.debug(f"Processing {len(response.tool_calls)} tool calls")
                
                for i, tool_call in enumerate(response.tool_calls):
                    tool_name = tool_call.get("name")
                    arguments = tool_call.get("arguments", {})
                    
                    logger.debug(f"Tool call {i+1}: {tool_name}")
                    logger.debug(f"Arguments: {arguments}")
                    
                    # Get the tool from registry
                    tool = self.tool_registry.get_tool(tool_name)
                    result = None
                    
                    if tool:
                        logger.debug(f"Executing tool: {tool_name}")
                        try:
                            # Execute the tool with arguments
                            result = self.tool_registry.execute(tool_name, **arguments)
                            logger.debug(f"Tool execution result: {result}")
                            
                            # Store the result
                            tool_results.append({
                                "name": tool_name,
                                "arguments": arguments,
                                "result": result,
                                "success": True if result and isinstance(result, dict) and result.get("success", False) else False,
                                "error": None
                            })
                        except Exception as e:
                            error_msg = str(e)
                            logger.error(f"Error executing tool {tool_name}: {error_msg}")
                            
                            # Store the error
                            tool_results.append({
                                "name": tool_name,
                                "arguments": arguments,
                                "result": None,
                                "success": False,
                                "error": error_msg
                            })
                    else:
                        error_msg = f"Tool not found in registry: {tool_name}"
                        logger.error(error_msg)
                        
                        # Store the error
                        tool_results.append({
                            "name": tool_name,
                            "arguments": arguments,
                            "result": None,
                            "success": False,
                            "error": error_msg
                        })
            
            # Add the assistant message to the conversation
            self.conversation.add_assistant_message(response.text)
            
            # Return the response with tool results
            return ReCCResponse(
                text=response.text,
                tool_calls=response.tool_calls,
                raw_response=response.metadata,
                tool_results=tool_results if tool_results else None
            )
        except Exception as e:
            logger.error(f"Error in query_async: {str(e)}")
            raise
    
    async def stream_query(self, prompt: str) -> AsyncGenerator[ReCCResponse, None]:
        """Send a query to the LLM and stream the response.
        
        Args:
            prompt: The prompt to send to the LLM.
            
        Yields:
            Chunks of the response as they are received.
        """
        # Add the user message to the conversation
        self.conversation.add_user_message(prompt)
        
        # Get the full conversation context
        context = self.conversation.get_context()
        
        # Build the full response text
        full_text = ""
        
        # Stream the response from the provider
        async for chunk in self.provider.generate_stream(prompt, context=context):
            full_text += chunk
            yield ReCCResponse(
                text=chunk,
                tool_calls=None,
                raw_response=None
            )
        
        # Add the full assistant message to the conversation
        self.conversation.add_assistant_message(full_text)
    
    def execute_command(self, command: str) -> ReCCResponse:
        """Execute a slash command or query the LLM.
        
        This method checks if the input is a slash command and executes it
        if it is, otherwise it queries the LLM.
        
        Args:
            command: The command or query to execute.
            
        Returns:
            The response from the command or LLM.
        """
        # Check if the input is a slash command
        if command.startswith("/"):
            # Parse the command
            parts = command.strip().split(" ", 1)
            cmd = parts[0][1:]  # Remove the leading slash
            args = parts[1] if len(parts) > 1 else ""
            
            # Check if the command exists in the tool registry
            tool = self.tool_registry.get_tool_by_command(cmd)
            if tool:
                # Execute the command and return the result
                result = tool.execute(args)
                return ReCCResponse(text=str(result))
            else:
                return ReCCResponse(text=f"Unknown command: {cmd}")
        
        # If not a command, query the LLM
        return self.query(command)
    
    async def execute_command_async(self, command: str) -> Union[ReCCResponse, AsyncGenerator[ReCCResponse, None]]:
        """Execute a slash command or query the LLM asynchronously.
        
        This method checks if the input is a slash command and executes it
        if it is, otherwise it queries the LLM asynchronously.
        
        Args:
            command: The command or query to execute.
            
        Returns:
            The response from the command or LLM, or an async generator for streaming responses.
        """
        # Check if the input is a slash command
        if command.startswith("/"):
            # Parse the command
            parts = command.strip().split(" ", 1)
            cmd = parts[0][1:]  # Remove the leading slash
            args = parts[1] if len(parts) > 1 else ""
            
            # Check if the command exists in the tool registry
            tool = self.tool_registry.get_tool_by_command(cmd)
            if tool:
                # Execute the command and return the result
                result = tool.execute(args)
                return ReCCResponse(text=str(result))
            else:
                return ReCCResponse(text=f"Unknown command: {cmd}")
        
        # If not a command, stream the response
        return self.stream_query(command)