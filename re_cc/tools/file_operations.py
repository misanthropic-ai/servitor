"""File operation tools."""

from typing import Dict, Any, Optional, List, Tuple

from re_cc.tools import Tool, tool_registry
from re_cc.prompts.tools import (
    view_file_prompt, 
    edit_file_prompt, 
    create_file_prompt, 
    ls_prompt
)
from re_cc.utils.fs import read_file, get_project_files
from re_cc.utils.editor import edit_file as editor_edit_file, create_file as editor_create_file


def view_file(file_path: str, offset: Optional[int] = None, limit: Optional[int] = None) -> Dict[str, Any]:
    """Read a file from the filesystem.
    
    Args:
        file_path: Path to the file
        offset: Line offset to start reading from
        limit: Maximum number of lines to read
        
    Returns:
        Result with file content or error
    """
    try:
        if not file_path:
            return {"success": False, "error": "File path is required"}
            
        content = read_file(file_path, offset, limit)
        return {
            "success": True,
            "content": content,
            "file_path": file_path
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def edit_file(file_path: str, old_string: str, new_string: str) -> Dict[str, Any]:
    """Edit a file.
    
    Args:
        file_path: Path to the file
        old_string: Content to replace
        new_string: New content
        
    Returns:
        Result with success or error
    """
    try:
        if not file_path:
            return {"success": False, "error": "File path is required"}
            
        success, error = editor_edit_file(file_path, old_string, new_string)
        
        if success:
            return {
                "success": True,
                "file_path": file_path,
                "message": f"File edited: {file_path}"
            }
        else:
            return {"success": False, "error": error}
    except Exception as e:
        return {"success": False, "error": str(e)}


def create_file(file_path: str, content: str) -> Dict[str, Any]:
    """Create a new file.
    
    Args:
        file_path: Path to the file
        content: File content
        
    Returns:
        Result with success or error
    """
    try:
        if not file_path:
            return {"success": False, "error": "File path is required"}
            
        success, error = editor_create_file(file_path, content)
        
        if success:
            return {
                "success": True,
                "file_path": file_path,
                "message": f"File created: {file_path}"
            }
        else:
            return {"success": False, "error": error}
    except Exception as e:
        return {"success": False, "error": str(e)}


def list_files(path: str, ignore: Optional[List[str]] = None) -> Dict[str, Any]:
    """List files in a directory.
    
    Args:
        path: Directory path
        ignore: Patterns to ignore
        
    Returns:
        Result with file list or error
    """
    try:
        if not path:
            return {"success": False, "error": "Path is required"}
            
        files = get_project_files(path, ignore=ignore or [])
        return {
            "success": True,
            "path": path,
            "files": files
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


# Register tools
ViewFile = Tool(
    name="View",
    description="Read a file from the local filesystem.",
    handler=view_file,
    prompt=view_file_prompt,
    parameters={
        "file_path": {"type": "string", "description": "The absolute path to the file to read"},
        "offset": {"type": "integer", "description": "Line offset to start reading from (optional)"},
        "limit": {"type": "integer", "description": "Maximum number of lines to read (optional)"}
    },
    required_params=["file_path"],
    user_facing_name="View"
)

EditFile = Tool(
    name="Edit",
    description="Edit a file by replacing content.",
    handler=edit_file,
    prompt=edit_file_prompt,
    parameters={
        "file_path": {"type": "string", "description": "The absolute path to the file to modify"},
        "old_string": {"type": "string", "description": "Content to replace"},
        "new_string": {"type": "string", "description": "New content to insert"}
    },
    required_params=["file_path", "old_string", "new_string"],
    user_facing_name="Edit"
)

CreateFile = Tool(
    name="Create",
    description="Create a new file.",
    handler=create_file,
    prompt=create_file_prompt,
    parameters={
        "file_path": {"type": "string", "description": "The absolute path to the file to create"},
        "content": {"type": "string", "description": "Content to write to the file"}
    },
    required_params=["file_path", "content"],
    user_facing_name="Create"
)

ListFiles = Tool(
    name="LS",
    description="List files in a directory.",
    handler=list_files,
    prompt=ls_prompt,
    parameters={
        "path": {"type": "string", "description": "The absolute path to list files from"},
        "ignore": {"type": "array", "description": "Patterns to ignore (optional)"}
    },
    required_params=["path"],
    user_facing_name="List"
)

# Register all tools
for tool in [ViewFile, EditFile, CreateFile, ListFiles]:
    tool_registry.register_tool(tool)