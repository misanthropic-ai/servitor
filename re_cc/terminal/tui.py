"""TUI for configuring Re-CC."""

import asyncio
from typing import Dict, Optional, List

from textual.app import App, ComposeResult
from textual.containers import Container, Horizontal, Vertical
from textual.widgets import (
    Button, Header, Footer, Static, Input, Select, Label, Tabs, Tab,
    RadioSet, RadioButton, TabPanel, TabbedContent
)
from textual.binding import Binding
from textual.message import Message

from re_cc.config.manager import ConfigManager, ProviderConfig
from re_cc.providers.base import ProviderFactory


class ProviderPanel(Container):
    """Panel for configuring a provider."""
    
    class ApiKeyChanged(Message):
        """Message when the API key is changed."""
        
        def __init__(self, provider_name: str, api_key: str) -> None:
            self.provider_name = provider_name
            self.api_key = api_key
            super().__init__()
    
    class ConfigChanged(Message):
        """Message when the configuration is changed."""
        
        def __init__(
            self, 
            provider_name: str, 
            endpoint: Optional[str] = None,
            model: Optional[str] = None,
        ) -> None:
            self.provider_name = provider_name
            self.endpoint = endpoint
            self.model = model
            super().__init__()
    
    def __init__(
        self,
        provider_name: str,
        config: ProviderConfig,
        api_key: Optional[str],
        *args,
        **kwargs,
    ) -> None:
        """Initialize the provider panel.
        
        Args:
            provider_name: The provider name
            config: The provider configuration
            api_key: The API key (or None if not set)
        """
        super().__init__(*args, **kwargs)
        self.provider_name = provider_name
        self.config = config
        self.api_key = api_key or ""
    
    def compose(self) -> ComposeResult:
        """Compose the provider panel widgets."""
        with Vertical():
            yield Label(f"Configure {self.provider_name.title()}")
            
            # API Key (if needed)
            if self.provider_name != "ollama":
                yield Label("API Key")
                api_key_input = Input(
                    value=self.api_key,
                    placeholder="Enter API key...",
                    password=True,
                    id=f"{self.provider_name}_api_key",
                )
                yield api_key_input
            
            # Endpoint (if supported)
            if self.provider_name in ["ollama", "custom"]:
                yield Label("API Endpoint")
                endpoint_input = Input(
                    value=self.config.endpoint or "",
                    placeholder="Enter API endpoint...",
                    id=f"{self.provider_name}_endpoint",
                )
                yield endpoint_input
            
            # Model
            yield Label("Model")
            model_input = Input(
                value=self.config.model or "",
                placeholder="Enter model name...",
                id=f"{self.provider_name}_model",
            )
            yield model_input
            
            # Buttons
            with Horizontal():
                yield Button("Save", variant="primary", id=f"{self.provider_name}_save")
                yield Button("Test Connection", id=f"{self.provider_name}_test")
    
    def on_button_pressed(self, event: Button.Pressed) -> None:
        """Handle button pressed events."""
        button_id = event.button.id
        
        if not button_id:
            return
        
        if button_id.endswith("_save"):
            # Save the configuration
            if self.provider_name != "ollama":
                api_key_input = self.query_one(f"#{self.provider_name}_api_key", Input)
                if api_key_input.value:
                    self.post_message(self.ApiKeyChanged(
                        provider_name=self.provider_name,
                        api_key=api_key_input.value,
                    ))
            
            # Endpoint (if supported)
            endpoint = None
            if self.provider_name in ["ollama", "custom"]:
                endpoint_input = self.query_one(f"#{self.provider_name}_endpoint", Input)
                endpoint = endpoint_input.value
            
            # Model
            model_input = self.query_one(f"#{self.provider_name}_model", Input)
            model = model_input.value
            
            self.post_message(self.ConfigChanged(
                provider_name=self.provider_name,
                endpoint=endpoint,
                model=model,
            ))
        
        elif button_id.endswith("_test"):
            # Test the connection
            self.run_worker(self.test_connection())
    
    async def test_connection(self) -> None:
        """Test the connection to the provider."""
        try:
            # Get the current values
            api_key = None
            if self.provider_name != "ollama":
                api_key_input = self.query_one(f"#{self.provider_name}_api_key", Input)
                api_key = api_key_input.value
            
            endpoint = None
            if self.provider_name in ["ollama", "custom"]:
                endpoint_input = self.query_one(f"#{self.provider_name}_endpoint", Input)
                endpoint = endpoint_input.value
            
            model_input = self.query_one(f"#{self.provider_name}_model", Input)
            model = model_input.value
            
            # Create a temporary config
            temp_config = ProviderConfig(
                provider=self.provider_name,
                endpoint=endpoint,
                model=model,
            )
            
            # Save temporary config
            config_manager = ConfigManager()
            config_manager.update_provider(
                provider=self.provider_name,
                endpoint=endpoint,
                model=model,
                api_key=api_key,
            )
            
            # Test the connection
            provider = ProviderFactory.create(self.provider_name)
            success = await provider.test_connection()
            
            if success:
                self.app.notify("Connection successful!", severity="information")
            else:
                self.app.notify("Connection failed", severity="error")
        except Exception as e:
            self.app.notify(f"Error testing connection: {str(e)}", severity="error")


class ConfigApp(App):
    """Configuration TUI application."""
    
    TITLE = "Re-CC Configuration"
    CSS_PATH = None
    
    BINDINGS = [
        Binding("q", "quit", "Quit"),
        Binding("s", "save", "Save"),
    ]
    
    def __init__(self) -> None:
        """Initialize the application."""
        super().__init__()
        self.config_manager = ConfigManager()
        self.providers = self.config_manager.get_all_providers()
        self.default_provider = self.config_manager.get_default_provider()
    
    def compose(self) -> ComposeResult:
        """Compose the application widgets."""
        yield Header()
        
        with Container():
            yield Static("Configure Re-CC providers and settings", classes="title")
            
            # Default provider selection
            yield Label("Default Provider")
            yield RadioSet(id="default_provider")
            
            # Provider tabs
            with TabbedContent():
                for provider_name, config in self.providers.items():
                    api_key = self.config_manager.get_provider_api_key(provider_name)
                    
                    with TabPanel(provider_name.title()):
                        yield ProviderPanel(provider_name, config, api_key)
                
                # Add tab for custom provider
                with TabPanel("Add Custom"):
                    yield Label("To add a custom provider, configure the 'custom' provider with your API endpoint and key")
        
        yield Footer()
    
    def on_mount(self) -> None:
        """Handle mount event."""
        # Set up default provider radio buttons
        radio_set = self.query_one("#default_provider", RadioSet)
        
        for provider_name in self.providers.keys():
            button = RadioButton(provider_name.title(), value=provider_name)
            radio_set.mount(button)
            
            if provider_name == self.default_provider:
                button.value = True
    
    def on_radio_set_changed(self, event: RadioSet.Changed) -> None:
        """Handle radio set changed events."""
        radio_set_id = event.radio_set.id
        
        if radio_set_id == "default_provider":
            # Set the default provider
            self.config_manager.set_default_provider(event.pressed.value)
            self.notify(f"Default provider set to {event.pressed.label}")
    
    def on_provider_panel_api_key_changed(self, event: ProviderPanel.ApiKeyChanged) -> None:
        """Handle API key changed events."""
        self.config_manager.update_provider(
            provider=event.provider_name,
            api_key=event.api_key,
        )
        self.notify(f"API key updated for {event.provider_name}")
    
    def on_provider_panel_config_changed(self, event: ProviderPanel.ConfigChanged) -> None:
        """Handle configuration changed events."""
        self.config_manager.update_provider(
            provider=event.provider_name,
            endpoint=event.endpoint,
            model=event.model,
        )
        self.notify(f"Configuration updated for {event.provider_name}")
    
    def action_save(self) -> None:
        """Save the configuration."""
        self.notify("Configuration saved")
    
    def action_quit(self) -> None:
        """Quit the application."""
        self.exit()


def launch_tui() -> None:
    """Launch the TUI configuration application."""
    app = ConfigApp()
    app.run()