"""Initialize and register all tools."""

# Import all tools to ensure they're registered
from re_cc.tools import tool_registry
from re_cc.tools.file_operations import ViewFile, EditFile, CreateFile, ListFiles
from re_cc.tools.search import GlobTool, GrepTool, FindFunction, FindClass
from re_cc.tools.command import Bash
from re_cc.tools.mcp import MCPList, MCPAdd, MCPRemove, MCPExecute
from re_cc.tools.task import CreateTask, ListTasks, TaskStatus, CompleteTask, CancelTask
from re_cc.tools.agent import DispatchAgent


def get_all_tools():
    """Get a dictionary of all registered tools.
    
    Returns:
        Dictionary of tool name to Tool object
    """
    return tool_registry.tools


def get_tool_names():
    """Get a list of all registered tool names.
    
    Returns:
        List of tool names
    """
    return tool_registry.get_tool_names()


if __name__ == "__main__":
    # Print all registered tools
    for name, tool in get_all_tools().items():
        print(f"{name}: {tool.description}")