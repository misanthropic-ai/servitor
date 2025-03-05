"""Anthropic Claude provider implementation."""

import asyncio
from typing import Optional, AsyncGenerator, Dict, Any

import anthropic
from anthropic.types import Message

from re_cc.providers.base import LLMProvider, LLMResponse, ProviderFactory
from re_cc.config.manager import ProviderConfig


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
    
    async def generate(
        self, 
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> LLMResponse:
        """Generate a response from Claude.
        
        Args:
            prompt: The prompt to send to Claude
            system_prompt: Optional system prompt
            temperature: The temperature to use for generation
            max_tokens: The maximum number of tokens to generate
            
        Returns:
            The LLM response
            
        Raises:
            Exception: If there is an error generating the response
        """
        try:
            kwargs: Dict[str, Any] = {
                "model": self.model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": temperature,
            }
            
            if system_prompt:
                kwargs["system"] = system_prompt
            
            if max_tokens:
                kwargs["max_tokens"] = max_tokens
            
            response = await self.client.messages.create(**kwargs)
            
            return LLMResponse(
                text=response.content[0].text,
                metadata={
                    "model": response.model,
                    "usage": {
                        "input_tokens": response.usage.input_tokens,
                        "output_tokens": response.usage.output_tokens,
                    },
                },
            )
        except Exception as e:
            raise Exception(f"Error generating response from Claude: {str(e)}")
    
    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> AsyncGenerator[str, None]:
        """Generate a streaming response from Claude.
        
        Args:
            prompt: The prompt to send to Claude
            system_prompt: Optional system prompt
            temperature: The temperature to use for generation
            max_tokens: The maximum number of tokens to generate
            
        Yields:
            Chunks of the generated text
            
        Raises:
            Exception: If there is an error generating the response
        """
        try:
            kwargs: Dict[str, Any] = {
                "model": self.model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": temperature,
                "stream": True,
            }
            
            if system_prompt:
                kwargs["system"] = system_prompt
            
            if max_tokens:
                kwargs["max_tokens"] = max_tokens
            
            async with self.client.messages.stream(**kwargs) as stream:
                async for chunk in stream:
                    if chunk.type == "content_block_delta" and chunk.delta.type == "text":
                        yield chunk.delta.text
        except Exception as e:
            raise Exception(f"Error streaming response from Claude: {str(e)}")
    
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
        ValueError: If the API key is missing
    """
    if not api_key:
        raise ValueError("Anthropic API key is required")
    
    return AnthropicProvider(config, api_key)