"""Secure API key storage using the system keyring."""

import keyring
from typing import Optional


class KeyringManager:
    """Manages secure storage of API keys."""
    
    # Service name for keyring
    SERVICE_NAME = "re-cc"
    
    def __init__(self) -> None:
        """Initialize the keyring manager."""
        pass
    
    def set_api_key(self, provider: str, api_key: str) -> None:
        """Store an API key for a provider.
        
        Args:
            provider: The provider name
            api_key: The API key to store
        """
        username = f"{provider}_api_key"
        keyring.set_password(self.SERVICE_NAME, username, api_key)
    
    def get_api_key(self, provider: str) -> Optional[str]:
        """Retrieve an API key for a provider.
        
        Args:
            provider: The provider name
            
        Returns:
            The API key if found, None otherwise
        """
        username = f"{provider}_api_key"
        try:
            return keyring.get_password(self.SERVICE_NAME, username)
        except Exception:
            return None
    
    def delete_api_key(self, provider: str) -> None:
        """Delete an API key for a provider.
        
        Args:
            provider: The provider name
        """
        username = f"{provider}_api_key"
        try:
            keyring.delete_password(self.SERVICE_NAME, username)
        except keyring.errors.PasswordDeleteError:
            # Key doesn't exist, that's fine
            pass