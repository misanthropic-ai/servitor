"""MCP (Master Control Program) services integration for extended capabilities."""

import json
import os
import subprocess
from dataclasses import dataclass
from typing import Dict, List, Optional, Any, Callable


@dataclass
class MCPService:
    """An MCP service with metadata and capabilities."""
    id: str
    name: str
    description: str
    version: str
    status: str
    capabilities: List[str]
    metadata: Dict[str, Any]


class MCPManager:
    """Manager for interacting with MCP services."""
    
    def __init__(self):
        """Initialize the MCP manager."""
        self.services: Dict[str, MCPService] = {}
        self._loaded = False
    
    def _ensure_loaded(self) -> None:
        """Ensure services are loaded from MCP."""
        if not self._loaded:
            self.load_services()
    
    def load_services(self) -> bool:
        """Load available services from MCP.
        
        Returns:
            True if successful, False otherwise
        """
        try:
            # Check if claude mcp command is available
            result = subprocess.run(
                ["claude", "mcp", "list", "--json"],
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                return False
            
            # Parse JSON output
            services_data = json.loads(result.stdout)
            
            # Reset services
            self.services = {}
            
            # Add each service
            for service_data in services_data:
                service = MCPService(
                    id=service_data["id"],
                    name=service_data["name"],
                    description=service_data.get("description", ""),
                    version=service_data.get("version", "unknown"),
                    status=service_data.get("status", "unknown"),
                    capabilities=service_data.get("capabilities", []),
                    metadata=service_data.get("metadata", {})
                )
                self.services[service.id] = service
            
            self._loaded = True
            return True
        except Exception:
            # Fallback: handle when MCP is not available
            self._loaded = True
            return False
    
    def get_all_services(self) -> List[MCPService]:
        """Get all available MCP services.
        
        Returns:
            List of MCP services
        """
        self._ensure_loaded()
        return list(self.services.values())
    
    def get_service(self, service_id: str) -> Optional[MCPService]:
        """Get a service by ID.
        
        Args:
            service_id: The ID of the service to retrieve
            
        Returns:
            The service if found, None otherwise
        """
        self._ensure_loaded()
        return self.services.get(service_id)
    
    def add_service(self, service_url: str) -> bool:
        """Add a new MCP service.
        
        Args:
            service_url: The URL of the service to add
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Run MCP add command
            result = subprocess.run(
                ["claude", "mcp", "add", service_url],
                capture_output=True,
                text=True
            )
            
            # Reload services if successful
            if result.returncode == 0:
                self.load_services()
                return True
            
            return False
        except Exception:
            return False
    
    def remove_service(self, service_id: str) -> bool:
        """Remove an MCP service.
        
        Args:
            service_id: The ID of the service to remove
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Check if service exists
            if service_id not in self.services:
                return False
            
            # Run MCP remove command
            result = subprocess.run(
                ["claude", "mcp", "remove", service_id],
                capture_output=True,
                text=True
            )
            
            # Reload services if successful
            if result.returncode == 0:
                self.load_services()
                return True
            
            return False
        except Exception:
            return False
    
    def execute_service(
        self, 
        service_id: str, 
        args: List[str], 
        callback: Optional[Callable[[str], None]] = None
    ) -> Dict[str, Any]:
        """Execute an MCP service.
        
        Args:
            service_id: The ID of the service to execute
            args: Arguments to pass to the service
            callback: Optional callback for streaming output
            
        Returns:
            The service result
        """
        try:
            # Check if service exists
            if service_id not in self.services:
                return {"error": "Service not found"}
            
            # Prepare command
            cmd = ["claude", "mcp", "execute", service_id, *args]
            
            # Execute with or without callback
            if callback:
                # Stream output
                process = subprocess.Popen(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    bufsize=1
                )
                
                # Process output line by line
                result_lines = []
                for line in iter(process.stdout.readline, ""):
                    result_lines.append(line)
                    if callback:
                        callback(line)
                
                process.wait()
                
                # Try to parse as JSON if possible
                result_text = "".join(result_lines)
                try:
                    return json.loads(result_text)
                except json.JSONDecodeError:
                    return {"output": result_text}
            else:
                # Capture all output at once
                result = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True
                )
                
                # Try to parse as JSON if possible
                try:
                    return json.loads(result.stdout)
                except json.JSONDecodeError:
                    return {"output": result.stdout}
        except Exception as e:
            return {"error": str(e)}


# Global MCP manager instance
mcp_manager = MCPManager()