"""Base provider interface and factory."""

import importlib
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Callable, AsyncGenerator

from re_cc.config.manager import ConfigManager, ProviderConfig


class LLMResponse:
    """Response from an LLM."""
    
    def __init__(self, text: str, metadata: Optional[Dict[str, Any]] = None) -> None:
        """Initialize the response.
        
        Args:
            text: The text response
            metadata: Additional metadata
        """
        self.text = text
        self.metadata = metadata or {}


class LLMProvider(ABC):
    """Base class for LLM providers."""
    
    @abstractmethod
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
            system_prompt: Optional system prompt for models that support it
            temperature: The temperature to use for generation
            max_tokens: The maximum number of tokens to generate
            
        Returns:
            The LLM response
        """
        pass
    
    @abstractmethod
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
            system_prompt: Optional system prompt for models that support it
            temperature: The temperature to use for generation
            max_tokens: The maximum number of tokens to generate
            
        Yields:
            Chunks of the generated text
        """
        pass
    
    @abstractmethod
    async def test_connection(self) -> bool:
        """Test if the provider connection is working.
        
        Returns:
            True if the connection is working, False otherwise
        """
        pass


class ProviderFactory:
    """Factory for creating LLM providers."""
    
    _providers: Dict[str, Callable[[ProviderConfig, str], LLMProvider]] = {}
    
    @classmethod
    def register(cls, name: str) -> Callable:
        """Register a provider factory function.
        
        Args:
            name: The provider name
            
        Returns:
            A decorator for the factory function
        """
        def decorator(func: Callable[[ProviderConfig, str], LLMProvider]) -> Callable:
            cls._providers[name] = func
            return func
        return decorator
    
    @classmethod
    def create(cls, provider_name: str) -> LLMProvider:
        """Create a provider instance.
        
        Args:
            provider_name: The name of the provider to create
            
        Returns:
            An LLM provider instance
            
        Raises:
            ValueError: If the provider is not found or cannot be created
        """
        # Load the configuration
        config_manager = ConfigManager()
        provider_config = config_manager.get_provider_config(provider_name)
        
        if not provider_config:
            raise ValueError(f"Provider '{provider_name}' not configured")
        
        # Get the API key
        api_key = config_manager.get_provider_api_key(provider_name)
        
        # Find the factory function
        factory = cls._providers.get(provider_name)
        
        if not factory:
            # Try to import the provider module dynamically
            try:
                module_name = f"re_cc.providers.{provider_name}"
                importlib.import_module(module_name)
                factory = cls._providers.get(provider_name)
            except ImportError:
                pass
        
        if not factory:
            raise ValueError(f"Provider '{provider_name}' is not supported")
        
        # Create the provider
        return factory(provider_config, api_key or "")