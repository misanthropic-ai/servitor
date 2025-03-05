"""Ollama provider implementation."""

import httpx
from typing import Optional, AsyncGenerator, Dict, Any

from re_cc.providers.base import LLMProvider, LLMResponse, ProviderFactory
from re_cc.config.manager import ProviderConfig


class OllamaProvider(LLMProvider):
    """Ollama provider implementation."""
    
    def __init__(self, config: ProviderConfig, api_key: str) -> None:
        """Initialize the Ollama provider.
        
        Args:
            config: The provider configuration
            api_key: The API key for authentication (not used for Ollama)
        """
        self.config = config
        self.endpoint = config.endpoint or "http://localhost:11434"
        self.model = config.model or "llama3"
        self.client = httpx.AsyncClient(base_url=self.endpoint)
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> LLMResponse:
        """Generate a response from Ollama.
        
        Args:
            prompt: The prompt to send to Ollama
            system_prompt: Optional system prompt
            temperature: The temperature to use for generation
            max_tokens: The maximum number of tokens to generate
            
        Returns:
            The LLM response
            
        Raises:
            Exception: If there is an error generating the response
        """
        try:
            body: Dict[str, Any] = {
                "model": self.model,
                "prompt": prompt,
                "temperature": temperature,
            }
            
            if system_prompt:
                body["system"] = system_prompt
            
            if max_tokens:
                body["num_predict"] = max_tokens
            
            response = await self.client.post("/api/generate", json=body)
            response.raise_for_status()
            
            data = response.json()
            
            return LLMResponse(
                text=data["response"],
                metadata={
                    "model": data.get("model", self.model),
                    "eval_count": data.get("eval_count", 0),
                },
            )
        except Exception as e:
            raise Exception(f"Error generating response from Ollama: {str(e)}")
    
    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> AsyncGenerator[str, None]:
        """Generate a streaming response from Ollama.
        
        Args:
            prompt: The prompt to send to Ollama
            system_prompt: Optional system prompt
            temperature: The temperature to use for generation
            max_tokens: The maximum number of tokens to generate
            
        Yields:
            Chunks of the generated text
            
        Raises:
            Exception: If there is an error generating the response
        """
        try:
            body: Dict[str, Any] = {
                "model": self.model,
                "prompt": prompt,
                "temperature": temperature,
                "stream": True,
            }
            
            if system_prompt:
                body["system"] = system_prompt
            
            if max_tokens:
                body["num_predict"] = max_tokens
            
            async with self.client.stream("POST", "/api/generate", json=body) as response:
                response.raise_for_status()
                
                async for line in response.aiter_lines():
                    if not line.strip():
                        continue
                    
                    try:
                        data = httpx.loads(line)
                        if "response" in data:
                            yield data["response"]
                    except Exception:
                        # Skip malformed JSON
                        continue
        except Exception as e:
            raise Exception(f"Error streaming response from Ollama: {str(e)}")
    
    async def test_connection(self) -> bool:
        """Test if the connection to Ollama is working.
        
        Returns:
            True if the connection is working, False otherwise
        """
        try:
            # Try to list models
            response = await self.client.get("/api/tags")
            response.raise_for_status()
            return True
        except Exception:
            return False


@ProviderFactory.register("ollama")
def create_ollama_provider(config: ProviderConfig, api_key: str) -> LLMProvider:
    """Create an Ollama provider instance.
    
    Args:
        config: The provider configuration
        api_key: The API key for authentication (not used for Ollama)
        
    Returns:
        An Ollama provider instance
    """
    if not config.endpoint:
        # Use default endpoint
        config.endpoint = "http://localhost:11434"
    
    return OllamaProvider(config, api_key)