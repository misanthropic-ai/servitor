"""Conversation history buffer and management."""

import json
import os
import time
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any, Tuple, Callable
from pathlib import Path

from rich.console import Console

console = Console()


@dataclass
class Message:
    """A message in a conversation."""
    role: str
    content: str
    timestamp: float = field(default_factory=time.time)
    metadata: Dict[str, Any] = field(default_factory=dict)


class ConversationBuffer:
    """Manages conversation history with persistence."""
    
    def __init__(self, conversation_id: Optional[str] = None, max_messages: int = 100):
        """Initialize the conversation buffer.
        
        Args:
            conversation_id: Optional conversation ID for persistence
            max_messages: Maximum number of messages to keep in memory
        """
        self.conversation_id = conversation_id or f"conversation_{int(time.time())}"
        self.max_messages = max_messages
        self.messages: List[Message] = []
        self._load_conversation()
    
    def add_message(self, role: str, content: str, metadata: Optional[Dict[str, Any]] = None) -> None:
        """Add a message to the conversation.
        
        Args:
            role: The role of the message sender (user, assistant, system)
            content: The message content
            metadata: Optional metadata
        """
        message = Message(
            role=role,
            content=content,
            timestamp=time.time(),
            metadata=metadata or {}
        )
        
        self.messages.append(message)
        
        # Trim if exceeding max_messages
        if len(self.messages) > self.max_messages:
            self.messages = self.messages[-self.max_messages:]
        
        # Persist the conversation
        self._save_conversation()
    
    def get_messages(self, limit: Optional[int] = None) -> List[Message]:
        """Get the conversation messages.
        
        Args:
            limit: Optional limit on number of messages to return
            
        Returns:
            List of messages
        """
        if limit is not None:
            return self.messages[-limit:]
        return self.messages
    
    def clear(self) -> None:
        """Clear the conversation history."""
        self.messages = []
        self._save_conversation()
    
    def as_dict_list(self) -> List[Dict[str, Any]]:
        """Convert messages to a list of dictionaries.
        
        Returns:
            List of message dictionaries
        """
        return [
            {
                "role": msg.role, 
                "content": msg.content,
                "timestamp": msg.timestamp,
                **msg.metadata
            }
            for msg in self.messages
        ]
    
    def _get_storage_path(self) -> Path:
        """Get the storage path for this conversation.
        
        Returns:
            Path to the conversation storage file
        """
        # Use XDG_DATA_HOME if available, otherwise platform-specific default
        if "XDG_DATA_HOME" in os.environ:
            base_dir = Path(os.environ["XDG_DATA_HOME"])
        else:
            home = Path.home()
            if os.name == "nt":  # Windows
                base_dir = home / "AppData" / "Local"
            elif os.name == "posix":  # Linux/Mac
                base_dir = home / ".local" / "share"
            else:
                base_dir = home / ".re-cc"
        
        # Create directory if it doesn't exist
        storage_dir = base_dir / "re-cc" / "conversations"
        storage_dir.mkdir(parents=True, exist_ok=True)
        
        return storage_dir / f"{self.conversation_id}.json"
    
    def _save_conversation(self) -> None:
        """Save the conversation to disk."""
        try:
            path = self._get_storage_path()
            with open(path, "w") as f:
                json.dump(
                    {
                        "conversation_id": self.conversation_id,
                        "messages": self.as_dict_list()
                    },
                    f,
                    indent=2
                )
        except Exception as e:
            console.print(f"[dim]Warning: Failed to save conversation: {str(e)}[/]")
    
    def _load_conversation(self) -> None:
        """Load the conversation from disk."""
        path = self._get_storage_path()
        if not path.exists():
            return
        
        try:
            with open(path, "r") as f:
                data = json.load(f)
                
                # Update conversation_id if different
                if data.get("conversation_id"):
                    self.conversation_id = data["conversation_id"]
                
                # Load messages
                for msg_data in data.get("messages", []):
                    role = msg_data.pop("role", "unknown")
                    content = msg_data.pop("content", "")
                    timestamp = msg_data.pop("timestamp", time.time())
                    
                    self.messages.append(Message(
                        role=role,
                        content=content,
                        timestamp=timestamp,
                        metadata=msg_data
                    ))
        except Exception as e:
            console.print(f"[dim]Warning: Failed to load conversation: {str(e)}[/]")
    
    async def compact(self, compactor_func) -> None:
        """Compact the conversation history.
        
        Args:
            compactor_func: A function that takes conversation content and returns a summary
        """
        if not self.messages:
            return
        
        # Get all message content
        content = "\n\n".join([
            f"{msg.role.upper()}: {msg.content}" 
            for msg in self.messages
        ])
        
        # Generate summary
        try:
            summary = await compactor_func(content)
            
            # Replace conversation with summary
            self.clear()
            self.add_message("system", f"Previous conversation summary: {summary}")
        except Exception as e:
            console.print(f"[bold red]Error compacting conversation: {str(e)}[/]")


# Global conversation buffer
conversation_buffer = ConversationBuffer()


async def compact_conversation() -> Dict[str, Any]:
    """Compact the conversation history for the current session.
    
    Returns:
        Result dictionary with success status
    """
    try:
        # Define a summarization function
        async def summarize_conversation(content: str) -> str:
            # Import here to avoid circular imports
            from re_cc.providers.base import ProviderFactory
            from re_cc.config.manager import ConfigManager
            
            # Get the default provider
            config_manager = ConfigManager()
            provider_name = config_manager.get_default_provider()
            provider = ProviderFactory.create(provider_name)
            
            # Generate a summary
            response = await provider.generate(
                prompt="Summarize our conversation so far in a detailed but concise way. Focus on information that would be helpful for continuing the conversation.",
                system_prompt="You are a helpful AI assistant tasked with summarizing conversations.",
                context=content,
            )
            
            return response.text
        
        # Compact the conversation
        await conversation_buffer.compact(summarize_conversation)
        
        return {
            "success": True,
            "message": "Conversation history has been compacted."
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
        
        
def clear_conversation() -> Dict[str, Any]:
    """Clear the conversation history for the current session.
    
    Returns:
        Result dictionary with success status
    """
    try:
        # Clear the conversation buffer
        conversation_buffer.clear()
        
        return {
            "success": True,
            "message": "Conversation history has been cleared."
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
        
        
def get_history_summary() -> str:
    """Get a summary of the conversation history.
    
    Returns:
        Summary of the conversation history
    """
    messages = conversation_buffer.get_messages()
    
    if not messages:
        return "No conversation history"
    
    # Get the last 3 messages or all if less than 3
    recent_messages = messages[-3:] if len(messages) > 3 else messages
    
    # Format the messages
    formatted_messages = []
    for msg in recent_messages:
        role = msg.role.upper()
        content = msg.content
        
        # Truncate long messages
        if len(content) > 100:
            content = content[:97] + "..."
            
        formatted_messages.append(f"{role}: {content}")
    
    # Add count information
    if len(messages) > 3:
        formatted_messages.insert(0, f"Conversation has {len(messages)} messages. Showing last 3:")
    
    return "\n".join(formatted_messages)