"""Provider management tools for Re-CC."""

from typing import Dict, List, Any, Optional

from re_cc.tools import Tool, tool_registry
from re_cc.config.manager import ConfigManager, ModelConfig


def handle_list_providers() -> Dict[str, Any]:
    """Handler for the ListProviders tool.
    
    Returns:
        Result of the operation
    """
    try:
        config_manager = ConfigManager()
        providers = config_manager.get_all_providers()
        default_provider = config_manager.get_default_provider()
        
        # Format provider data
        providers_data = []
        for name, config in providers.items():
            # Get default model
            default_model = config_manager.get_default_model(name)
            
            # Count models with tool support
            tool_enabled_models = sum(1 for model in config.models if model.supports_tools)
            
            providers_data.append({
                "name": name,
                "is_default": name == default_provider,
                "default_model": default_model,
                "endpoint": config.endpoint,
                "model_count": len(config.models),
                "tool_enabled_models": tool_enabled_models
            })
        
        return {
            "success": True,
            "providers": providers_data,
            "default_provider": default_provider
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Error listing providers: {str(e)}"
        }


def handle_set_provider(provider_name: str) -> Dict[str, Any]:
    """Handler for the SetProvider tool.
    
    Args:
        provider_name: The provider to set as default
        
    Returns:
        Result of the operation
    """
    try:
        config_manager = ConfigManager()
        
        # Check if provider exists
        if provider_name not in config_manager.get_all_providers():
            return {
                "success": False,
                "error": f"Provider '{provider_name}' not found"
            }
        
        # Set as default
        config_manager.set_default_provider(provider_name)
        
        return {
            "success": True,
            "provider": provider_name,
            "message": f"Default provider set to {provider_name}"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Error setting provider: {str(e)}"
        }


def handle_list_models(provider_name: str) -> Dict[str, Any]:
    """Handler for the ListModels tool.
    
    Args:
        provider_name: The provider name
        
    Returns:
        Result of the operation
    """
    try:
        config_manager = ConfigManager()
        
        # Check if provider exists
        if provider_name not in config_manager.get_all_providers():
            return {
                "success": False,
                "error": f"Provider '{provider_name}' not found"
            }
        
        # Get models
        models = config_manager.get_provider_models(provider_name)
        default_model = config_manager.get_default_model(provider_name)
        
        # Format model data
        models_data = []
        for model in models:
            models_data.append({
                "name": model.name,
                "is_default": model.is_default or model.name == default_model,
                "description": model.description,
                "context_window": model.context_window,
                "supports_tools": model.supports_tools
            })
        
        return {
            "success": True,
            "provider": provider_name,
            "models": models_data,
            "default_model": default_model
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Error listing models: {str(e)}"
        }


def handle_set_model(provider_name: str, model_name: str) -> Dict[str, Any]:
    """Handler for the SetModel tool.
    
    Args:
        provider_name: The provider name
        model_name: The model name to set as default
        
    Returns:
        Result of the operation
    """
    try:
        config_manager = ConfigManager()
        
        # Set default model
        config_manager.set_default_model(provider_name, model_name)
        
        return {
            "success": True,
            "provider": provider_name,
            "model": model_name,
            "message": f"Default model for {provider_name} set to {model_name}"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Error setting model: {str(e)}"
        }


def handle_add_model(
    provider_name: str,
    model_name: str,
    description: Optional[str] = None,
    context_window: Optional[int] = None,
    supports_tools: bool = False,
    is_default: bool = False
) -> Dict[str, Any]:
    """Handler for the AddModel tool.
    
    Args:
        provider_name: The provider name
        model_name: The model name
        description: Optional description
        context_window: Optional context window size
        supports_tools: Whether the model supports tools
        is_default: Whether to set as default model
        
    Returns:
        Result of the operation
    """
    try:
        config_manager = ConfigManager()
        
        # Create model config
        model_config = ModelConfig(
            name=model_name,
            description=description or f"{model_name} model",
            context_window=context_window,
            supports_tools=supports_tools,
            is_default=is_default
        )
        
        # Add model
        config_manager.add_model(provider_name, model_config)
        
        return {
            "success": True,
            "provider": provider_name,
            "model": model_name,
            "message": f"Added model {model_name} to provider {provider_name}"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Error adding model: {str(e)}"
        }


def handle_remove_model(provider_name: str, model_name: str) -> Dict[str, Any]:
    """Handler for the RemoveModel tool.
    
    Args:
        provider_name: The provider name
        model_name: The model name
        
    Returns:
        Result of the operation
    """
    try:
        config_manager = ConfigManager()
        
        # Remove model
        config_manager.remove_model(provider_name, model_name)
        
        return {
            "success": True,
            "provider": provider_name,
            "model": model_name,
            "message": f"Removed model {model_name} from provider {provider_name}"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Error removing model: {str(e)}"
        }


# Tool prompt content
list_providers_prompt = """
Lists all configured LLM providers.

This tool returns information about all configured providers, including:
- Provider name
- Whether it's the default provider
- Default model for each provider
- Custom endpoint (if configured)
- Number of available models
- Number of models with tool support
"""

set_provider_prompt = """
Sets the default LLM provider.

This tool updates the configuration to use the specified provider as the default for future interactions. The provider must already be configured.
"""

list_models_prompt = """
Lists all available models for a provider.

This tool returns information about all models configured for a specific provider, including:
- Model name
- Whether it's the default model
- Description
- Context window size
- Whether it supports tool calls
"""

set_model_prompt = """
Sets the default model for a provider.

This tool updates the configuration to use the specified model as the default for a provider. The model must already be configured for the provider.
"""

add_model_prompt = """
Adds a new model to a provider.

This tool adds a new model to the configuration for a specific provider. You can specify:
- Model name (required)
- Description
- Context window size
- Whether it supports tool calls
- Whether to set as default
"""

remove_model_prompt = """
Removes a model from a provider.

This tool removes a model from the configuration for a specific provider. If the model is the default, another model will be set as default.
"""

# Register provider tools
@tool_registry.register_tool
def register_provider_tools() -> List[Tool]:
    """Register provider tools."""
    tools = [
        Tool(
            name="ListProviders",
            description="Lists all configured LLM providers",
            handler=handle_list_providers,
            prompt=list_providers_prompt,
            parameters={},
            required_params=[]
        ),
        Tool(
            name="SetProvider",
            description="Sets the default LLM provider",
            handler=handle_set_provider,
            prompt=set_provider_prompt,
            parameters={
                "provider_name": {"description": "The provider to set as default", "type": "string"}
            },
            required_params=["provider_name"]
        ),
        Tool(
            name="ListModels",
            description="Lists all available models for a provider",
            handler=handle_list_models,
            prompt=list_models_prompt,
            parameters={
                "provider_name": {"description": "The provider name", "type": "string"}
            },
            required_params=["provider_name"]
        ),
        Tool(
            name="SetModel",
            description="Sets the default model for a provider",
            handler=handle_set_model,
            prompt=set_model_prompt,
            parameters={
                "provider_name": {"description": "The provider name", "type": "string"},
                "model_name": {"description": "The model name to set as default", "type": "string"}
            },
            required_params=["provider_name", "model_name"]
        ),
        Tool(
            name="AddModel",
            description="Adds a new model to a provider",
            handler=handle_add_model,
            prompt=add_model_prompt,
            parameters={
                "provider_name": {"description": "The provider name", "type": "string"},
                "model_name": {"description": "The model name", "type": "string"},
                "description": {"description": "Optional description", "type": "string"},
                "context_window": {"description": "Optional context window size", "type": "number"},
                "supports_tools": {"description": "Whether the model supports tools", "type": "boolean"},
                "is_default": {"description": "Whether to set as default model", "type": "boolean"}
            },
            required_params=["provider_name", "model_name"]
        ),
        Tool(
            name="RemoveModel",
            description="Removes a model from a provider",
            handler=handle_remove_model,
            prompt=remove_model_prompt,
            parameters={
                "provider_name": {"description": "The provider name", "type": "string"},
                "model_name": {"description": "The model name", "type": "string"}
            },
            required_params=["provider_name", "model_name"]
        )
    ]
    
    return tools