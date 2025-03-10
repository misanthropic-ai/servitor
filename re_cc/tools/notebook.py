"""Jupyter notebook tools for reading and editing notebooks."""

import json
import os
from typing import Dict, List, Any, Optional, Callable, Union

from re_cc.tools import Tool, tool_registry
from re_cc.utils.fs import read_file, write_file


def read_notebook(notebook_path: str) -> Dict[str, Any]:
    """Read a Jupyter notebook file.
    
    Args:
        notebook_path: Path to the notebook file
        
    Returns:
        The notebook content as a Python object
        
    Raises:
        FileNotFoundError: If the notebook file doesn't exist
        json.JSONDecodeError: If the notebook file is not valid JSON
    """
    if not os.path.exists(notebook_path):
        raise FileNotFoundError(f"Notebook not found: {notebook_path}")
    
    notebook_content = read_file(notebook_path)
    notebook_data = json.loads(notebook_content)
    
    return notebook_data


def write_notebook(notebook_path: str, notebook_data: Dict[str, Any]) -> None:
    """Write a Jupyter notebook file.
    
    Args:
        notebook_path: Path to the notebook file
        notebook_data: The notebook content as a Python object
        
    Raises:
        ValueError: If the notebook data is not valid
    """
    try:
        notebook_content = json.dumps(notebook_data, indent=2)
        write_file(notebook_path, notebook_content)
    except Exception as e:
        raise ValueError(f"Failed to write notebook: {str(e)}")


def handle_read_notebook(notebook_path: str) -> Dict[str, Any]:
    """Handler for ReadNotebook tool.
    
    Args:
        notebook_path: Path to the notebook file
        
    Returns:
        Result of the operation
    """
    try:
        notebook_data = read_notebook(notebook_path)
        
        # Extract cells with their outputs
        cells = []
        for idx, cell in enumerate(notebook_data.get("cells", [])):
            cell_type = cell.get("cell_type", "")
            source = "".join(cell.get("source", []))
            
            # Format outputs
            outputs = []
            for output in cell.get("outputs", []):
                output_type = output.get("output_type", "")
                
                if output_type == "stream":
                    outputs.append({
                        "type": "stream",
                        "name": output.get("name", "stdout"),
                        "text": "".join(output.get("text", []))
                    })
                elif output_type == "execute_result":
                    outputs.append({
                        "type": "execute_result",
                        "data": output.get("data", {})
                    })
                elif output_type == "display_data":
                    outputs.append({
                        "type": "display_data",
                        "data": output.get("data", {})
                    })
                elif output_type == "error":
                    outputs.append({
                        "type": "error",
                        "ename": output.get("ename", ""),
                        "evalue": output.get("evalue", ""),
                        "traceback": output.get("traceback", [])
                    })
            
            cells.append({
                "cell_number": idx,
                "cell_type": cell_type,
                "source": source,
                "outputs": outputs
            })
        
        return {
            "success": True,
            "notebook_path": notebook_path,
            "metadata": notebook_data.get("metadata", {}),
            "cells": cells
        }
    except FileNotFoundError as e:
        return {
            "success": False,
            "error": str(e)
        }
    except json.JSONDecodeError:
        return {
            "success": False,
            "error": f"Invalid notebook format: {notebook_path}"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Error reading notebook: {str(e)}"
        }


def handle_edit_notebook_cell(
    notebook_path: str,
    cell_number: int,
    new_source: str,
    cell_type: Optional[str] = None,
    edit_mode: str = "replace"
) -> Dict[str, Any]:
    """Handler for NotebookEditCell tool.
    
    Args:
        notebook_path: Path to the notebook file
        cell_number: The index of the cell to edit (0-based)
        new_source: The new source for the cell
        cell_type: Optional cell type (code or markdown) if specified
        edit_mode: The type of edit to make (replace, insert, delete)
        
    Returns:
        Result of the operation
    """
    try:
        if not os.path.exists(notebook_path):
            return {
                "success": False,
                "error": f"Notebook not found: {notebook_path}"
            }
        
        # Read the notebook
        notebook_data = read_notebook(notebook_path)
        cells = notebook_data.get("cells", [])
        
        # Check if cell number is valid
        if edit_mode == "insert":
            if cell_number < 0 or cell_number > len(cells):
                return {
                    "success": False,
                    "error": f"Invalid cell number for insert: {cell_number}"
                }
            
            # For insert, we need a cell type
            if not cell_type:
                return {
                    "success": False,
                    "error": "Cell type is required for insert mode"
                }
            
            # Create a new cell
            new_cell = {
                "cell_type": cell_type,
                "source": new_source.splitlines(True),
                "metadata": {}
            }
            
            # Add outputs field for code cells
            if cell_type == "code":
                new_cell["outputs"] = []
                new_cell["execution_count"] = None
            
            # Insert the new cell
            cells.insert(cell_number, new_cell)
            
        elif edit_mode == "delete":
            if cell_number < 0 or cell_number >= len(cells):
                return {
                    "success": False,
                    "error": f"Invalid cell number for delete: {cell_number}"
                }
            
            # Delete the cell
            del cells[cell_number]
            
        else:  # replace (default)
            if cell_number < 0 or cell_number >= len(cells):
                return {
                    "success": False,
                    "error": f"Invalid cell number: {cell_number}"
                }
            
            # Update the cell
            cell = cells[cell_number]
            
            # Update cell type if specified
            if cell_type:
                old_type = cell.get("cell_type", "")
                cell["cell_type"] = cell_type
                
                # If changing between code and markdown, update cell structure
                if old_type != cell_type:
                    if cell_type == "code":
                        cell["outputs"] = []
                        cell["execution_count"] = None
                    else:
                        if "outputs" in cell:
                            del cell["outputs"]
                        if "execution_count" in cell:
                            del cell["execution_count"]
            
            # Update cell source
            cell["source"] = new_source.splitlines(True)
        
        # Update the notebook
        notebook_data["cells"] = cells
        write_notebook(notebook_path, notebook_data)
        
        return {
            "success": True,
            "notebook_path": notebook_path,
            "cell_number": cell_number,
            "edit_mode": edit_mode,
            "message": f"Cell {cell_number} {edit_mode}d in {notebook_path}"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Error editing notebook cell: {str(e)}"
        }


# Tool prompt content
read_notebook_prompt = """
Reads a Jupyter notebook (.ipynb file) and returns all of the cells with their outputs. Jupyter notebooks are interactive documents that combine code, text, and visualizations, commonly used for data analysis and scientific computing. The notebook_path parameter must be an absolute path, not a relative path.
"""

edit_notebook_cell_prompt = """
Completely replaces the contents of a specific cell in a Jupyter notebook (.ipynb file) with new source. Jupyter notebooks are interactive documents that combine code, text, and visualizations, commonly used for data analysis and scientific computing. The notebook_path parameter must be an absolute path, not a relative path. The cell_number is 0-indexed. Use edit_mode=insert to add a new cell at the index specified by cell_number. Use edit_mode=delete to delete the cell at the index specified by cell_number.
"""

# Register the notebook tools
@tool_registry.register_tool
def register_notebook_tools() -> List[Tool]:
    """Register notebook tools."""
    tools = [
        Tool(
            name="ReadNotebook",
            description="Reads a Jupyter notebook (.ipynb file) and returns all of the cells with their outputs",
            handler=handle_read_notebook,
            prompt=read_notebook_prompt,
            parameters={
                "notebook_path": {"description": "The absolute path to the Jupyter notebook file to read", "type": "string"}
            },
            required_params=["notebook_path"]
        ),
        Tool(
            name="NotebookEditCell",
            description="Completely replaces the contents of a specific cell in a Jupyter notebook with new source",
            handler=handle_edit_notebook_cell,
            prompt=edit_notebook_cell_prompt,
            parameters={
                "notebook_path": {"description": "The absolute path to the Jupyter notebook file to edit", "type": "string"},
                "cell_number": {"description": "The index of the cell to edit (0-based)", "type": "number"},
                "new_source": {"description": "The new source for the cell", "type": "string"},
                "cell_type": {"description": "The type of the cell (code or markdown)", "type": "string"},
                "edit_mode": {"description": "The type of edit to make (replace, insert, delete)", "type": "string"}
            },
            required_params=["notebook_path", "cell_number", "new_source"]
        )
    ]
    
    return tools