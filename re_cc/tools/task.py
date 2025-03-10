"""Task management tools."""

from typing import Dict, Any, Optional, List

from re_cc.tools import Tool, tool_registry
from re_cc.utils.task import task_manager, TaskStatus


def create_task(description: str) -> Dict[str, Any]:
    """Create a new task.
    
    Args:
        description: Task description
        
    Returns:
        Result of the operation
    """
    try:
        if not description:
            return {"success": False, "error": "Description is required"}
            
        # Parse name and description
        if ":" in description:
            name, desc = description.split(":", 1)
            name = name.strip()
            desc = desc.strip()
        else:
            name = "Task"
            desc = description.strip()
        
        task = task_manager.create_task(name, desc)
        
        return {
            "success": True,
            "task_id": task.id,
            "name": task.name,
            "description": task.description
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def list_tasks() -> Dict[str, Any]:
    """List all tasks.
    
    Returns:
        List of tasks
    """
    try:
        tasks = task_manager.get_all_tasks()
        
        formatted_tasks = []
        for task in tasks:
            formatted_tasks.append({
                "id": task.id,
                "name": task.name,
                "description": task.description,
                "status": task.status.value,
                "progress": task.progress
            })
        
        return {
            "success": True,
            "tasks": formatted_tasks,
            "count": len(formatted_tasks)
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def get_task_status(task_id: str) -> Dict[str, Any]:
    """Get task status.
    
    Args:
        task_id: Task ID
        
    Returns:
        Task status
    """
    try:
        if not task_id:
            return {"success": False, "error": "Task ID is required"}
            
        task = task_manager.get_task(task_id)
        
        if not task:
            return {"success": False, "error": f"Task not found: {task_id}"}
        
        subtasks = []
        for subtask_id in task.subtasks:
            subtask = task_manager.get_task(subtask_id)
            if subtask:
                subtasks.append({
                    "id": subtask.id,
                    "name": subtask.name,
                    "status": subtask.status.value,
                    "progress": subtask.progress
                })
        
        return {
            "success": True,
            "task_id": task.id,
            "name": task.name,
            "description": task.description,
            "status": task.status.value,
            "progress": task.progress,
            "subtasks": subtasks
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def complete_task(task_id: str) -> Dict[str, Any]:
    """Complete a task.
    
    Args:
        task_id: Task ID
        
    Returns:
        Result of the operation
    """
    try:
        if not task_id:
            return {"success": False, "error": "Task ID is required"}
            
        success = task_manager.complete_task(task_id)
        
        if not success:
            return {"success": False, "error": f"Task not found: {task_id}"}
        
        return {
            "success": True,
            "task_id": task_id,
            "message": f"Task {task_id} completed"
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def cancel_task(task_id: str) -> Dict[str, Any]:
    """Cancel a task.
    
    Args:
        task_id: Task ID
        
    Returns:
        Result of the operation
    """
    try:
        if not task_id:
            return {"success": False, "error": "Task ID is required"}
            
        success = task_manager.cancel_task(task_id)
        
        if not success:
            return {"success": False, "error": f"Task not found: {task_id}"}
        
        return {
            "success": True,
            "task_id": task_id,
            "message": f"Task {task_id} cancelled"
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


# Register tools
CreateTask = Tool(
    name="CreateTask",
    description="Create a new task.",
    handler=create_task,
    prompt="Creates a new tracked task with a name and description.",
    parameters={
        "description": {"type": "string", "description": "Task description (format: 'name: description')"}
    },
    required_params=["description"],
    user_facing_name="CreateTask"
)

ListTasks = Tool(
    name="ListTasks",
    description="List all tasks.",
    handler=list_tasks,
    prompt="Lists all tasks managed by the task system.",
    parameters={},
    required_params=[],
    user_facing_name="ListTasks"
)

TaskStatus = Tool(
    name="TaskStatus",
    description="Get status of a task.",
    handler=get_task_status,
    prompt="Gets detailed status information about a specific task.",
    parameters={
        "task_id": {"type": "string", "description": "The task ID to check"}
    },
    required_params=["task_id"],
    user_facing_name="TaskStatus"
)

CompleteTask = Tool(
    name="CompleteTask",
    description="Mark a task as completed.",
    handler=complete_task,
    prompt="Marks a task as completed.",
    parameters={
        "task_id": {"type": "string", "description": "The task ID to complete"}
    },
    required_params=["task_id"],
    user_facing_name="CompleteTask"
)

CancelTask = Tool(
    name="CancelTask",
    description="Cancel a task.",
    handler=cancel_task,
    prompt="Cancels a task and its subtasks.",
    parameters={
        "task_id": {"type": "string", "description": "The task ID to cancel"}
    },
    required_params=["task_id"],
    user_facing_name="CancelTask"
)

# Register all tools
for tool in [CreateTask, ListTasks, TaskStatus, CompleteTask, CancelTask]:
    tool_registry.register_tool(tool)