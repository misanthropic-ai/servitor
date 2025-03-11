"""Anthropic Claude provider implementation."""

import asyncio
import json
import os
from typing import Optional, AsyncGenerator, Dict, Any, List

import anthropic
from anthropic.types import Message

# Try to import Tool from different locations depending on package version
try:
    from anthropic.types.tool_use import Tool, ToolUse
except ImportError:
    try:
        from anthropic.types import Tool
        ToolUse = None  # Might not be needed in newer versions
    except ImportError:
        # Define a minimal Tool class for compatibility
        class Tool:
            def __init__(self, name, description, input_schema):
                self.name = name
                self.description = description
                self.input_schema = input_schema

from re_cc.providers.base import LLMProvider, LLMResponse, ProviderFactory
from re_cc.config.manager import ProviderConfig
from re_cc.tools import tool_registry


class AnthropicProvider(LLMProvider):
    """Anthropic Claude provider implementation."""
    
    def __init__(self, config: ProviderConfig, api_key: str) -> None:
        """Initialize the Anthropic provider.
        
        Args:
            config: The provider configuration
            api_key: The API key for authentication
        """
        self.config = config
        self.api_key = api_key
        self.client = anthropic.AsyncAnthropic(api_key=api_key)
        self.model = config.model or "claude-3-opus-20240229"
    
    def _create_tool_schema(self, tool_names: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """Create tool schemas for tools to be used by the provider.
        
        Args:
            tool_names: Optional list of tool names to include
            
        Returns:
            List of tool definitions in Anthropic's format
        """
        tool_list = []
        
        if not tool_names:
            return tool_list
            
        for name in tool_names:
            tool = tool_registry.get_tool(name)
            if tool:
                # Create a dictionary for the tool schema - compatible with all Anthropic versions
                tool_dict = {
                    "name": tool.name,
                    "description": tool.description,
                    "input_schema": {
                        "type": "object",
                        "properties": tool.parameters,
                        "required": tool.required_params
                    }
                }
                tool_list.append(tool_dict)
        
        return tool_list
    
    def _parse_tool_calls(self, response) -> List[Dict[str, Any]]:
        """Parse tool calls from Anthropic response.
        
        Args:
            response: The raw response from Anthropic
            
        Returns:
            List of parsed tool calls
        """
        tool_calls = []
        
        # Handle different versions of the Anthropic client
        try:
            for content_block in response.content:
                if content_block.type == "tool_use":
                    # Get the tool name and input (arguments)
                    name = getattr(content_block, "name", None)
                    arguments = getattr(content_block, "input", {})
                    
                    # Handle different attribute names in newer versions
                    if name is None and hasattr(content_block, "tool_use"):
                        name = getattr(content_block.tool_use, "name", None)
                        arguments = getattr(content_block.tool_use, "input", {})
                    
                    if name:
                        tool_calls.append({
                            "name": name,
                            "arguments": arguments,
                        })
        except Exception as e:
            # If there's any error in parsing, log it and continue
            print(f"Error parsing tool calls: {str(e)}")
        
        return tool_calls
    
    async def generate(
        self, 
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        context: Optional[str] = None,
        tools: Optional[List[str]] = None,
    ) -> LLMResponse:
        """Generate a response from Claude.
        
        Args:
            prompt: The prompt to send to Claude
            system_prompt: Optional system prompt
            temperature: The temperature to use for generation
            max_tokens: The maximum number of tokens to generate
            context: Optional additional context for the prompt
            tools: Optional list of tool names available to the LLM
            
        Returns:
            The LLM response
            
        Raises:
            Exception: If there is an error generating the response
        """
        try:
            # Format full prompt with context if provided
            full_prompt = prompt
            if context:
                full_prompt = f"{context}\n\n{prompt}"
            
            kwargs: Dict[str, Any] = {
                "model": self.model,
                "messages": [{"role": "user", "content": full_prompt}],
                "temperature": temperature,
                "max_tokens": max_tokens or 8192,  # Default to 8192 tokens
            }
            
            if system_prompt:
                kwargs["system"] = system_prompt
            
            # Add tools if specified
            if tools and len(tools) > 0:
                tool_schemas = self._create_tool_schema(tools)
                if tool_schemas:
                    kwargs["tools"] = tool_schemas
            
            response = await self.client.messages.create(**kwargs)
            
            # Extract text and tool calls from the response
            response_text = ""
            for content_block in response.content:
                if content_block.type == "text":
                    response_text = content_block.text
                    break
            
            # Parse tool calls if any
            tool_calls = self._parse_tool_calls(response)
            
            return LLMResponse(
                text=response_text,
                metadata={
                    "model": response.model,
                    "usage": {
                        "input_tokens": response.usage.input_tokens,
                        "output_tokens": response.usage.output_tokens,
                    },
                },
                tool_calls=tool_calls
            )
        except Exception as e:
            raise Exception(f"Error generating response from Claude: {str(e)}")
    
    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        context: Optional[str] = None,
        tools: Optional[List[str]] = None,
    ) -> AsyncGenerator[str, None]:
        """Generate a streaming response from Claude.
        
        Args:
            prompt: The prompt to send to Claude
            system_prompt: Optional system prompt
            temperature: The temperature to use for generation
            max_tokens: The maximum number of tokens to generate
            context: Optional additional context for the prompt
            tools: Optional list of tool names available to the LLM
            
        Yields:
            Chunks of the generated text
            
        Raises:
            Exception: If there is an error generating the response
        """
        try:
            # Format full prompt with context if provided
            full_prompt = prompt
            if context:
                full_prompt = f"{context}\n\n{prompt}"
                
            kwargs: Dict[str, Any] = {
                "model": self.model,
                "messages": [{"role": "user", "content": full_prompt}],
                "temperature": temperature,
                "max_tokens": max_tokens or 8192,  # Default to 8192 tokens
            }
            
            if system_prompt:
                kwargs["system"] = system_prompt
            
            # Add tools if specified
            if tools and len(tools) > 0:
                tool_schemas = self._create_tool_schema(tools)
                if tool_schemas:
                    kwargs["tools"] = tool_schemas
            
            # For AsyncAnthropic we need to use async with
            async with self.client.messages.stream(**kwargs) as stream:
                # text_stream may not be available in older versions
                if hasattr(stream, 'text_stream'):
                    # In newer versions, text_stream is an iterable
                    for text in stream.text_stream:
                        yield text
                else:
                    # Fall back to the older streaming approach
                    async for chunk in stream:
                        if chunk.type == "content_block_delta" and chunk.delta.type == "text":
                            yield chunk.delta.text
        except Exception as e:
            # Fall back to non-streaming if there's an error
            try:
                print(f"Warning: Streaming failed: {str(e)}")
                print("Falling back to non-streaming mode")
                response = await self.generate(
                    prompt=prompt,
                    system_prompt=system_prompt,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    context=context,
                    tools=tools
                )
                yield response.text
            except Exception as inner_e:
                raise Exception(f"Error generating response from Claude: {str(inner_e)}")
    
    async def test_connection(self) -> bool:
        """Test if the connection to Anthropic API is working.
        
        Returns:
            True if the connection is working, False otherwise
        """
        try:
            # Simple prompt to test the connection
            response = await self.generate(
                prompt="Hello, this is a connection test. Please respond with 'Connection successful'.",
                max_tokens=20,
                temperature=0.0,
            )
            return "Connection successful" in response.text
        except Exception:
            return False


@ProviderFactory.register("anthropic")
def create_anthropic_provider(config: ProviderConfig, api_key: str) -> LLMProvider:
    """Create an Anthropic provider instance.
    
    Args:
        config: The provider configuration
        api_key: The API key for authentication
        
    Returns:
        An Anthropic provider instance
        
    Raises:
        ValueError: If the API key is missing and not running tests
    """
    # Allow empty API key for testing when environment variable is set
    is_testing = os.environ.get("RE_CC_TESTING", "").lower() in ("1", "true", "yes")
    
    if not api_key and not is_testing:
        raise ValueError("Anthropic API key is required")
    
    # If no API key provided but testing, use a dummy key
    if not api_key and is_testing:
        print("WARNING: Using dummy API key for testing")
        api_key = "dummy_key_for_testing"
    
    return AnthropicProvider(config, api_key)