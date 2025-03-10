"""MCP service tools."""

from typing import Dict, Any, Optional, List

from re_cc.tools import Tool, tool_registry
from re_cc.prompts.tools import (
    mcp_list_prompt,
    mcp_add_prompt,
    mcp_remove_prompt,
    mcp_execute_prompt
)
from re_cc.utils.mcp import mcp_manager


def list_services() -> Dict[str, Any]:
    """List available MCP services.
    
    Returns:
        List of services
    """
    try:
        # Load services
        mcp_manager.load_services()
        services = mcp_manager.get_all_services()
        
        formatted_services = []
        for service in services:
            formatted_services.append({
                "id": service.id,
                "name": service.name,
                "description": service.description,
                "version": service.version,
                "status": service.status,
                "capabilities": service.capabilities
            })
        
        return {
            "success": True,
            "services": formatted_services,
            "count": len(formatted_services)
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def add_service(service_url: str) -> Dict[str, Any]:
    """Add a new MCP service.
    
    Args:
        service_url: URL or command to add
        
    Returns:
        Result of the operation
    """
    try:
        if not service_url:
            return {"success": False, "error": "Service URL is required"}
            
        success = mcp_manager.add_service(service_url)
        
        if success:
            return {
                "success": True,
                "service_url": service_url,
                "message": f"Service added: {service_url}"
            }
        else:
            return {"success": False, "error": f"Failed to add service: {service_url}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


def remove_service(service_id: str) -> Dict[str, Any]:
    """Remove an MCP service.
    
    Args:
        service_id: Service ID to remove
        
    Returns:
        Result of the operation
    """
    try:
        if not service_id:
            return {"success": False, "error": "Service ID is required"}
            
        success = mcp_manager.remove_service(service_id)
        
        if success:
            return {
                "success": True,
                "service_id": service_id,
                "message": f"Service removed: {service_id}"
            }
        else:
            return {"success": False, "error": f"Failed to remove service: {service_id}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


def execute_service(service_id: str, args: Optional[List[str]] = None) -> Dict[str, Any]:
    """Execute an MCP service.
    
    Args:
        service_id: Service ID to execute
        args: Optional arguments for the service
        
    Returns:
        Result of the operation
    """
    try:
        if not service_id:
            return {"success": False, "error": "Service ID is required"}
            
        # Check if service exists
        service = mcp_manager.get_service(service_id)
        if not service:
            return {"success": False, "error": f"Service not found: {service_id}"}
        
        # Execute service
        result = mcp_manager.execute_service(service_id, args or [])
        
        if "error" in result:
            return {"success": False, "error": result["error"]}
        
        return {
            "success": True,
            "service_id": service_id,
            "args": args or [],
            "result": result
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


# Register tools
MCPList = Tool(
    name="MCPList",
    description="List available MCP services.",
    handler=list_services,
    prompt=mcp_list_prompt,
    parameters={},
    required_params=[],
    user_facing_name="MCPList"
)

MCPAdd = Tool(
    name="MCPAdd",
    description="Add a new MCP service.",
    handler=add_service,
    prompt=mcp_add_prompt,
    parameters={
        "service_url": {"type": "string", "description": "The service URL or command to add"}
    },
    required_params=["service_url"],
    user_facing_name="MCPAdd"
)

MCPRemove = Tool(
    name="MCPRemove",
    description="Remove an MCP service.",
    handler=remove_service,
    prompt=mcp_remove_prompt,
    parameters={
        "service_id": {"type": "string", "description": "The service ID to remove"}
    },
    required_params=["service_id"],
    user_facing_name="MCPRemove"
)

MCPExecute = Tool(
    name="MCPExecute",
    description="Execute an MCP service.",
    handler=execute_service,
    prompt=mcp_execute_prompt,
    parameters={
        "service_id": {"type": "string", "description": "The service ID to execute"},
        "args": {"type": "array", "description": "Optional arguments for the service"}
    },
    required_params=["service_id"],
    user_facing_name="MCPExecute"
)

# Register all tools
for tool in [MCPList, MCPAdd, MCPRemove, MCPExecute]:
    tool_registry.register_tool(tool)