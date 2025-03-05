"""OpenAI provider implementation."""

from typing import Optional, AsyncGenerator, Dict, Any

from openai import AsyncOpenAI

from re_cc.providers.base import LLMProvider, LLMResponse, ProviderFactory
from re_cc.config.manager import ProviderConfig


class OpenAIProvider(LLMProvider):
    """OpenAI provider implementation."""
    
    def __init__(self, config: ProviderConfig, api_key: str) -> None:
        """Initialize the OpenAI provider.
        
        Args:
            config: The provider configuration
            api_key: The API key for authentication
        """
        self.config = config
        self.api_key = api_key
        
        # Set up client with optional custom endpoint
        client_kwargs = {"api_key": api_key}
        if config.endpoint:
            client_kwargs["base_url"] = config.endpoint
        
        self.client = AsyncOpenAI(**client_kwargs)
        self.model = config.model or "gpt-4o"
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> LLMResponse:
        """Generate a response from OpenAI.
        
        Args:
            prompt: The prompt to send to OpenAI
            system_prompt: Optional system prompt
            temperature: The temperature to use for generation
            max_tokens: The maximum number of tokens to generate
            
        Returns:
            The LLM response
            
        Raises:
            Exception: If there is an error generating the response
        """
        try:
            messages = []
            
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            
            messages.append({"role": "user", "content": prompt})
            
            kwargs: Dict[str, Any] = {
                "model": self.model,
                "messages": messages,
                "temperature": temperature,
            }
            
            if max_tokens:
                kwargs["max_tokens"] = max_tokens
            
            response = await self.client.chat.completions.create(**kwargs)
            
            return LLMResponse(
                text=response.choices[0].message.content or "",
                metadata={
                    "model": response.model,
                    "usage": {
                        "input_tokens": response.usage.prompt_tokens,
                        "output_tokens": response.usage.completion_tokens,
                    },
                },
            )
        except Exception as e:
            raise Exception(f"Error generating response from OpenAI: {str(e)}")
    
    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> AsyncGenerator[str, None]:
        """Generate a streaming response from OpenAI.
        
        Args:
            prompt: The prompt to send to OpenAI
            system_prompt: Optional system prompt
            temperature: The temperature to use for generation
            max_tokens: The maximum number of tokens to generate
            
        Yields:
            Chunks of the generated text
            
        Raises:
            Exception: If there is an error generating the response
        """
        try:
            messages = []
            
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            
            messages.append({"role": "user", "content": prompt})
            
            kwargs: Dict[str, Any] = {
                "model": self.model,
                "messages": messages,
                "temperature": temperature,
                "stream": True,
            }
            
            if max_tokens:
                kwargs["max_tokens"] = max_tokens
            
            async for chunk in await self.client.chat.completions.create(**kwargs):
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            raise Exception(f"Error streaming response from OpenAI: {str(e)}")
    
    async def test_connection(self) -> bool:
        """Test if the connection to OpenAI API is working.
        
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


@ProviderFactory.register("openai")
def create_openai_provider(config: ProviderConfig, api_key: str) -> LLMProvider:
    """Create an OpenAI provider instance.
    
    Args:
        config: The provider configuration
        api_key: The API key for authentication
        
    Returns:
        An OpenAI provider instance
        
    Raises:
        ValueError: If the API key is missing
    """
    if not api_key:
        raise ValueError("OpenAI API key is required")
    
    return OpenAIProvider(config, api_key)