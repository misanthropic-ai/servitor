"""Search tools for finding files and patterns."""

from typing import Dict, Any, Optional, List

from re_cc.tools import Tool, tool_registry
from re_cc.prompts.tools import glob_tool_prompt, grep_tool_prompt
from re_cc.utils.search import (
    search_with_ripgrep, 
    find_function_definition, 
    find_class_definition,
    find_files_with_glob
)


def glob_search(pattern: str, path: Optional[str] = None) -> Dict[str, Any]:
    """Search for files matching a glob pattern.
    
    Args:
        pattern: The glob pattern to match
        path: Base directory to search in (optional)
        
    Returns:
        Results with matching files or error
    """
    try:
        if not pattern:
            return {"success": False, "error": "Pattern is required"}
            
        files = find_files_with_glob(pattern, base_dir=path)
        return {
            "success": True,
            "pattern": pattern,
            "path": path or ".",
            "files": files,
            "count": len(files)
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def grep_search(pattern: str, path: Optional[str] = None, include: Optional[str] = None) -> Dict[str, Any]:
    """Search for content matching a regex pattern.
    
    Args:
        pattern: The regex pattern to search for
        path: Base directory to search in (optional)
        include: File pattern to include (optional)
        
    Returns:
        Results with matching content or error
    """
    try:
        if not pattern:
            return {"success": False, "error": "Pattern is required"}
            
        results = search_with_ripgrep(pattern, path=path, include=include)
        
        formatted_results = []
        for result in results:
            formatted_results.append({
                "file_path": result.file_path,
                "line_number": result.line_number,
                "line": result.line
            })
        
        return {
            "success": True,
            "pattern": pattern,
            "path": path or ".",
            "include": include,
            "results": formatted_results,
            "count": len(formatted_results)
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def find_function(function_name: str) -> Dict[str, Any]:
    """Find a function definition.
    
    Args:
        function_name: The function name to find
        
    Returns:
        Results with function definition or error
    """
    try:
        if not function_name:
            return {"success": False, "error": "Function name is required"}
            
        result = find_function_definition(function_name)
        
        if not result:
            return {
                "success": False,
                "error": f"Function not found: {function_name}"
            }
        
        return {
            "success": True,
            "function_name": function_name,
            "file_path": result.file_path,
            "line_number": result.line_number,
            "line": result.line,
            "context_before": result.context_before,
            "context_after": result.context_after
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def find_class(class_name: str) -> Dict[str, Any]:
    """Find a class definition.
    
    Args:
        class_name: The class name to find
        
    Returns:
        Results with class definition or error
    """
    try:
        if not class_name:
            return {"success": False, "error": "Class name is required"}
            
        result = find_class_definition(class_name)
        
        if not result:
            return {
                "success": False,
                "error": f"Class not found: {class_name}"
            }
        
        return {
            "success": True,
            "class_name": class_name,
            "file_path": result.file_path,
            "line_number": result.line_number,
            "line": result.line,
            "context_before": result.context_before,
            "context_after": result.context_after
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


# Register tools
GlobTool = Tool(
    name="GlobTool",
    description="Fast file pattern matching using glob syntax.",
    handler=glob_search,
    prompt=glob_tool_prompt,
    parameters={
        "pattern": {"type": "string", "description": "The glob pattern to match files against"},
        "path": {"type": "string", "description": "Base directory to search in (optional)"}
    },
    required_params=["pattern"],
    user_facing_name="Glob"
)

GrepTool = Tool(
    name="GrepTool",
    description="Search file contents using regular expressions.",
    handler=grep_search,
    prompt=grep_tool_prompt,
    parameters={
        "pattern": {"type": "string", "description": "The regex pattern to search for"},
        "path": {"type": "string", "description": "Base directory to search in (optional)"},
        "include": {"type": "string", "description": "File pattern to include (optional)"}
    },
    required_params=["pattern"],
    user_facing_name="Grep"
)

FindFunction = Tool(
    name="FindFunction",
    description="Find a function definition in the codebase.",
    handler=find_function,
    prompt="Searches for a function definition in the codebase.",
    parameters={
        "function_name": {"type": "string", "description": "The function name to find"}
    },
    required_params=["function_name"],
    user_facing_name="FindFunction"
)

FindClass = Tool(
    name="FindClass",
    description="Find a class definition in the codebase.",
    handler=find_class,
    prompt="Searches for a class definition in the codebase.",
    parameters={
        "class_name": {"type": "string", "description": "The class name to find"}
    },
    required_params=["class_name"],
    user_facing_name="FindClass"
)

# Register all tools
for tool in [GlobTool, GrepTool, FindFunction, FindClass]:
    tool_registry.register_tool(tool)