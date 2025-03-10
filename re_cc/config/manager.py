"""Configuration manager for Re-CC."""

import os
from typing import Any, Dict, Optional, List
import platformdirs
import yaml
from pydantic import BaseModel, Field

from re_cc.security.keyring import KeyringManager


class ModelConfig(BaseModel):
    """Configuration for a model within a provider."""
    
    name: str
    description: Optional[str] = None
    context_window: Optional[int] = None
    supports_tools: bool = False
    is_default: bool = False


class ProviderConfig(BaseModel):
    """Configuration for an LLM provider."""
    
    provider: str
    model: Optional[str] = None
    endpoint: Optional[str] = None
    # API key is stored separately in keyring
    models: List[ModelConfig] = Field(default_factory=list)


class AppConfig(BaseModel):
    """Application configuration."""
    
    default_provider: str = "anthropic"
    providers: Dict[str, ProviderConfig] = {}


class ConfigManager:
    """Manages the application configuration."""
    
    def __init__(self) -> None:
        """Initialize the configuration manager."""
        self.config_dir = platformdirs.user_config_dir("re-cc")
        self.config_file = os.path.join(self.config_dir, "config.yaml")
        self.keyring = KeyringManager()
        
        # Create config directory if it doesn't exist
        os.makedirs(self.config_dir, exist_ok=True)
        
        # Load or create config
        self.config = self._load_config()
    
    def _load_config(self) -> AppConfig:
        """Load configuration from file or create default."""
        if os.path.exists(self.config_file):
            try:
                with open(self.config_file, "r") as f:
                    config_data = yaml.safe_load(f)
                return AppConfig(**config_data)
            except Exception:
                # If config is corrupt, create a new one
                return self._create_default_config()
        else:
            return self._create_default_config()
    
    def _create_default_config(self) -> AppConfig:
        """Create default configuration."""
        return AppConfig(
            default_provider="anthropic",
            providers={
                "anthropic": ProviderConfig(
                    provider="anthropic",
                    model="claude-3-opus-20240229",
                    models=[
                        ModelConfig(
                            name="claude-3-opus-20240229",
                            description="Most capable Claude model with high-quality output",
                            context_window=200000,
                            supports_tools=True,
                            is_default=True
                        ),
                        ModelConfig(
                            name="claude-3-sonnet-20240229",
                            description="Balanced Claude model with good performance",
                            context_window=200000,
                            supports_tools=True,
                        ),
                        ModelConfig(
                            name="claude-3-haiku-20240307",
                            description="Fast and efficient Claude model",
                            context_window=200000,
                            supports_tools=True,
                        ),
                    ],
                ),
                "openai": ProviderConfig(
                    provider="openai",
                    model="gpt-4o",
                    models=[
                        ModelConfig(
                            name="gpt-4o",
                            description="Latest GPT-4 model with optimal capabilities",
                            context_window=128000,
                            supports_tools=True,
                            is_default=True
                        ),
                        ModelConfig(
                            name="gpt-4-turbo",
                            description="Larger context window variant of GPT-4",
                            context_window=128000,
                            supports_tools=True,
                        ),
                        ModelConfig(
                            name="gpt-3.5-turbo",
                            description="Fast and efficient GPT model",
                            context_window=16000, 
                            supports_tools=True,
                        ),
                    ],
                ),
                "ollama": ProviderConfig(
                    provider="ollama",
                    endpoint="http://localhost:11434",
                    model="llama3",
                    models=[
                        ModelConfig(
                            name="llama3",
                            description="Default Llama 3 model",
                            supports_tools=True,
                            is_default=True
                        ),
                        ModelConfig(
                            name="llama2",
                            description="Llama 2 model",
                            supports_tools=False,
                        ),
                        ModelConfig(
                            name="gemma",
                            description="Google's Gemma model",
                            supports_tools=False,
                        ),
                        ModelConfig(
                            name="mistral",
                            description="Mistral model",
                            supports_tools=False,
                        ),
                        ModelConfig(
                            name="codellama",
                            description="Code-optimized Llama model",
                            supports_tools=True,
                        ),
                    ],
                ),
            },
        )
    
    def _save_config(self) -> None:
        """Save configuration to file."""
        # Convert to dictionary with comments
        config_dict = self.config.model_dump()
        
        with open(self.config_file, "w") as f:
            # Add header comment
            f.write("# Re-CC Configuration File\n")
            f.write("# This file is automatically generated and updated by Re-CC\n")
            f.write("# You can manually edit this file, but it's recommended to use the configuration UI\n\n")
            
            # Use yaml.dump for the actual config
            yaml.dump(config_dict, f, default_flow_style=False, sort_keys=False)
    
    def get_provider_config(self, provider: str) -> Optional[ProviderConfig]:
        """Get configuration for a specific provider."""
        return self.config.providers.get(provider)
    
    def get_default_provider(self) -> str:
        """Get the default provider."""
        return self.config.default_provider
    
    def set_default_provider(self, provider: str) -> None:
        """Set the default provider."""
        if provider not in self.config.providers:
            raise ValueError(f"Provider '{provider}' not configured")
        
        self.config.default_provider = provider
        self._save_config()
    
    def update_provider(
        self,
        provider: str,
        api_key: Optional[str] = None,
        endpoint: Optional[str] = None,
        model: Optional[str] = None,
    ) -> None:
        """Update configuration for a provider."""
        # Get existing config or create new
        provider_config = self.config.providers.get(
            provider,
            ProviderConfig(provider=provider),
        )
        
        # Update fields if provided
        if endpoint is not None:
            provider_config.endpoint = endpoint
        
        if model is not None:
            provider_config.model = model
        
        # Update config
        self.config.providers[provider] = provider_config
        self._save_config()
        
        # Update API key if provided
        if api_key is not None:
            self.keyring.set_api_key(provider, api_key)
    
    def get_provider_api_key(self, provider: str) -> Optional[str]:
        """Get API key for a provider."""
        return self.keyring.get_api_key(provider)
    
    def get_all_providers(self) -> Dict[str, ProviderConfig]:
        """Get all configured providers."""
        return self.config.providers
        
    def get_provider_models(self, provider: str) -> List[ModelConfig]:
        """Get all models for a provider.
        
        Args:
            provider: The provider name
            
        Returns:
            List of model configurations
            
        Raises:
            ValueError: If the provider is not configured
        """
        provider_config = self.get_provider_config(provider)
        if not provider_config:
            raise ValueError(f"Provider '{provider}' not configured")
            
        return provider_config.models
        
    def get_default_model(self, provider: str) -> Optional[str]:
        """Get the default model for a provider.
        
        Args:
            provider: The provider name
            
        Returns:
            The default model name, or None if not found
            
        Raises:
            ValueError: If the provider is not configured
        """
        provider_config = self.get_provider_config(provider)
        if not provider_config:
            raise ValueError(f"Provider '{provider}' not configured")
            
        # Check if we have a specific default model set
        if provider_config.model:
            return provider_config.model
            
        # Otherwise, look for a model marked as default in the models list
        for model in provider_config.models:
            if model.is_default:
                return model.name
                
        # If none found and we have models, use the first one
        if provider_config.models:
            return provider_config.models[0].name
            
        return None
        
    def set_default_model(self, provider: str, model_name: str) -> None:
        """Set the default model for a provider.
        
        Args:
            provider: The provider name
            model_name: The model name
            
        Raises:
            ValueError: If the provider or model is not configured
        """
        provider_config = self.get_provider_config(provider)
        if not provider_config:
            raise ValueError(f"Provider '{provider}' not configured")
            
        # Check if the model exists in the models list
        model_exists = any(model.name == model_name for model in provider_config.models)
        if not model_exists:
            raise ValueError(f"Model '{model_name}' not found for provider '{provider}'")
            
        # Set the default model
        provider_config.model = model_name
        
        # Update the default flag in the models list
        for model in provider_config.models:
            model.is_default = (model.name == model_name)
            
        # Save the updated config
        self._save_config()
        
    def add_model(self, provider: str, model_config: ModelConfig) -> None:
        """Add a new model to a provider.
        
        Args:
            provider: The provider name
            model_config: The model configuration
            
        Raises:
            ValueError: If the provider is not configured or the model already exists
        """
        provider_config = self.get_provider_config(provider)
        if not provider_config:
            raise ValueError(f"Provider '{provider}' not configured")
            
        # Check if the model already exists
        if any(model.name == model_config.name for model in provider_config.models):
            raise ValueError(f"Model '{model_config.name}' already exists for provider '{provider}'")
            
        # If this is marked as default, update other models
        if model_config.is_default:
            for model in provider_config.models:
                model.is_default = False
            provider_config.model = model_config.name
            
        # Add the new model
        provider_config.models.append(model_config)
        
        # Save the updated config
        self._save_config()
        
    def update_model(self, provider: str, model_name: str, **kwargs) -> None:
        """Update a model configuration.
        
        Args:
            provider: The provider name
            model_name: The model name
            **kwargs: The fields to update
            
        Raises:
            ValueError: If the provider or model is not configured
        """
        provider_config = self.get_provider_config(provider)
        if not provider_config:
            raise ValueError(f"Provider '{provider}' not configured")
            
        # Find the model in the models list
        model_found = False
        for model in provider_config.models:
            if model.name == model_name:
                model_found = True
                
                # Update the model fields
                for key, value in kwargs.items():
                    if hasattr(model, key):
                        setattr(model, key, value)
                
                # If this is now the default model, update other models
                if kwargs.get("is_default", False):
                    for other_model in provider_config.models:
                        if other_model.name != model_name:
                            other_model.is_default = False
                    provider_config.model = model_name
                    
                break
                
        if not model_found:
            raise ValueError(f"Model '{model_name}' not found for provider '{provider}'")
            
        # Save the updated config
        self._save_config()
        
    def remove_model(self, provider: str, model_name: str) -> None:
        """Remove a model from a provider.
        
        Args:
            provider: The provider name
            model_name: The model name
            
        Raises:
            ValueError: If the provider or model is not configured
        """
        provider_config = self.get_provider_config(provider)
        if not provider_config:
            raise ValueError(f"Provider '{provider}' not configured")
            
        # Find the model in the models list
        for i, model in enumerate(provider_config.models):
            if model.name == model_name:
                # Check if this is the default model
                was_default = model.is_default
                
                # Remove the model
                provider_config.models.pop(i)
                
                # If this was the default model, update the default
                if was_default and provider_config.models:
                    provider_config.models[0].is_default = True
                    provider_config.model = provider_config.models[0].name
                
                # Save the updated config
                self._save_config()
                return
                
        raise ValueError(f"Model '{model_name}' not found for provider '{provider}'")