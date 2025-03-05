"""API client for interacting with LLM providers."""

from typing import Optional, AsyncGenerator, Dict, Any, List

from re_cc.config.manager import ConfigManager
from re_cc.providers.base import ProviderFactory, LLMResponse


class LLMClient:
    """Client for interacting with LLM providers."""
    
    def __init__(self, provider_name: Optional[str] = None) -> None:
        """Initialize the client.
        
        Args:
            provider_name: The provider to use, or None for default
        """
        # Get the configuration
        config_manager = ConfigManager()
        
        # Use default provider if none specified
        if not provider_name:
            provider_name = config_manager.get_default_provider()
        
        self.provider_name = provider_name
        self.provider = ProviderFactory.create(provider_name)
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> LLMResponse:
        """Generate a response from the LLM.
        
        Args:
            prompt: The prompt to send to the LLM
            system_prompt: Optional system prompt
            temperature: The temperature to use for generation
            max_tokens: The maximum number of tokens to generate
            
        Returns:
            The LLM response
        """
        return await self.provider.generate(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=temperature,
            max_tokens=max_tokens,
        )
    
    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> AsyncGenerator[str, None]:
        """Generate a streaming response from the LLM.
        
        Args:
            prompt: The prompt to send to the LLM
            system_prompt: Optional system prompt
            temperature: The temperature to use for generation
            max_tokens: The maximum number of tokens to generate
            
        Yields:
            Chunks of the generated text
        """
        async for chunk in self.provider.generate_stream(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=temperature,
            max_tokens=max_tokens,
        ):
            yield chunk
    
    @property
    def provider_info(self) -> Dict[str, Any]:
        """Get information about the current provider.
        
        Returns:
            A dictionary with provider information
        """
        config_manager = ConfigManager()
        provider_config = config_manager.get_provider_config(self.provider_name)
        
        if not provider_config:
            return {"name": self.provider_name}
        
        return {
            "name": self.provider_name,
            "model": provider_config.model,
            "endpoint": provider_config.endpoint,
        }
    
    @classmethod
    def get_available_providers(cls) -> List[str]:
        """Get a list of available providers.
        
        Returns:
            A list of provider names
        """
        config_manager = ConfigManager()
        return list(config_manager.get_all_providers().keys())