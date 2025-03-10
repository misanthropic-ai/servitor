"""Task tracking and management for multi-step operations."""

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional, Any, Callable


class TaskStatus(Enum):
    """Possible states for a task."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class Task:
    """A tracked task with state and metadata."""
    id: str
    name: str
    description: str
    status: TaskStatus = TaskStatus.PENDING
    progress: float = 0.0  # 0.0 to 1.0
    metadata: Dict[str, Any] = field(default_factory=dict)
    parent_id: Optional[str] = None
    subtasks: List[str] = field(default_factory=list)
    
    # Optional callbacks
    on_progress: Optional[Callable[[float], None]] = None
    on_status_change: Optional[Callable[[TaskStatus], None]] = None
    
    def update_progress(self, progress: float) -> None:
        """Update task progress value.
        
        Args:
            progress: New progress value (0.0 to 1.0)
        """
        self.progress = max(0.0, min(1.0, progress))
        if self.on_progress:
            self.on_progress(self.progress)
    
    def update_status(self, status: TaskStatus) -> None:
        """Update task status.
        
        Args:
            status: New status
        """
        self.status = status
        if self.on_status_change:
            self.on_status_change(self.status)
        
        # Auto-update progress based on status changes
        if status == TaskStatus.COMPLETED:
            self.update_progress(1.0)
        elif status == TaskStatus.PENDING:
            self.update_progress(0.0)


class TaskManager:
    """Manager for creating and tracking tasks."""
    
    def __init__(self):
        """Initialize the task manager."""
        self.tasks: Dict[str, Task] = {}
        self.next_id = 1
    
    def create_task(self, name: str, description: str, parent_id: Optional[str] = None) -> Task:
        """Create a new task and register it with the manager.
        
        Args:
            name: Task name
            description: Task description
            parent_id: Optional parent task ID
            
        Returns:
            The created task
        """
        task_id = f"task_{self.next_id}"
        self.next_id += 1
        
        task = Task(
            id=task_id,
            name=name,
            description=description,
            parent_id=parent_id
        )
        
        self.tasks[task_id] = task
        
        # Add as subtask to parent if specified
        if parent_id and parent_id in self.tasks:
            self.tasks[parent_id].subtasks.append(task_id)
        
        return task
    
    def get_task(self, task_id: str) -> Optional[Task]:
        """Get a task by ID.
        
        Args:
            task_id: The ID of the task to retrieve
            
        Returns:
            The task if found, None otherwise
        """
        return self.tasks.get(task_id)
    
    def get_all_tasks(self) -> List[Task]:
        """Get all tracked tasks.
        
        Returns:
            List of all tasks
        """
        return list(self.tasks.values())
    
    def get_active_tasks(self) -> List[Task]:
        """Get all active (pending or in-progress) tasks.
        
        Returns:
            List of active tasks
        """
        return [
            task for task in self.tasks.values() 
            if task.status in (TaskStatus.PENDING, TaskStatus.IN_PROGRESS)
        ]
    
    def complete_task(self, task_id: str, cascade: bool = True) -> bool:
        """Mark a task as completed.
        
        Args:
            task_id: The ID of the task to complete
            cascade: Whether to mark subtasks as completed too
            
        Returns:
            True if the task was found and completed, False otherwise
        """
        task = self.get_task(task_id)
        if not task:
            return False
        
        task.update_status(TaskStatus.COMPLETED)
        
        # Complete subtasks if cascade is True
        if cascade:
            for subtask_id in task.subtasks:
                self.complete_task(subtask_id, cascade=True)
        
        return True
    
    def fail_task(self, task_id: str, cascade: bool = True) -> bool:
        """Mark a task as failed.
        
        Args:
            task_id: The ID of the task to fail
            cascade: Whether to mark subtasks as failed too
            
        Returns:
            True if the task was found and marked as failed, False otherwise
        """
        task = self.get_task(task_id)
        if not task:
            return False
        
        task.update_status(TaskStatus.FAILED)
        
        # Fail subtasks if cascade is True
        if cascade:
            for subtask_id in task.subtasks:
                self.fail_task(subtask_id, cascade=True)
        
        return True
    
    def cancel_task(self, task_id: str, cascade: bool = True) -> bool:
        """Mark a task as cancelled.
        
        Args:
            task_id: The ID of the task to cancel
            cascade: Whether to mark subtasks as cancelled too
            
        Returns:
            True if the task was found and cancelled, False otherwise
        """
        task = self.get_task(task_id)
        if not task:
            return False
        
        task.update_status(TaskStatus.CANCELLED)
        
        # Cancel subtasks if cascade is True
        if cascade:
            for subtask_id in task.subtasks:
                self.cancel_task(subtask_id, cascade=True)
        
        return True


# Global task manager instance
task_manager = TaskManager()