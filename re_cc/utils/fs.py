"""File system utilities for Re-CC."""

import os
import glob
from typing import List, Optional


def find_files(pattern: str, path: Optional[str] = None) -> List[str]:
    """Find files matching a pattern.
    
    Args:
        pattern: The glob pattern to match
        path: The base path to search, or None for current directory
        
    Returns:
        A list of matching file paths
    """
    base_path = path or os.getcwd()
    search_pattern = os.path.join(base_path, pattern)
    
    return glob.glob(search_pattern, recursive=True)


def read_file(file_path: str) -> str:
    """Read a file and return its contents.
    
    Args:
        file_path: The path to the file
        
    Returns:
        The file contents as a string
        
    Raises:
        FileNotFoundError: If the file does not exist
        IOError: If there is an error reading the file
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()


def write_file(file_path: str, content: str) -> None:
    """Write content to a file.
    
    Args:
        file_path: The path to the file
        content: The content to write
        
    Raises:
        IOError: If there is an error writing the file
    """
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(os.path.abspath(file_path)), exist_ok=True)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)


def search_in_file(file_path: str, pattern: str) -> List[str]:
    """Search for a pattern in a file.
    
    Args:
        file_path: The path to the file
        pattern: The pattern to search for
        
    Returns:
        A list of matching lines
        
    Raises:
        FileNotFoundError: If the file does not exist
        IOError: If there is an error reading the file
    """
    import re
    
    matches = []
    
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            if re.search(pattern, line):
                matches.append(line.strip())
    
    return matches


def get_project_files(
    path: Optional[str] = None,
    ignore_patterns: Optional[List[str]] = None,
) -> List[str]:
    """Get a list of project files, ignoring common patterns.
    
    Args:
        path: The base path, or None for current directory
        ignore_patterns: Additional patterns to ignore
        
    Returns:
        A list of file paths
    """
    base_path = path or os.getcwd()
    
    # Default ignore patterns
    default_ignore_patterns = [
        "**/.git/**",
        "**/.venv/**",
        "**/node_modules/**",
        "**/__pycache__/**",
        "**/*.pyc",
        "**/*.pyo",
        "**/*.pyd",
        "**/.DS_Store",
        "**/venv/**",
        "**/env/**",
        "**/build/**",
        "**/dist/**",
    ]
    
    # Combine ignore patterns
    all_ignore_patterns = default_ignore_patterns
    if ignore_patterns:
        all_ignore_patterns.extend(ignore_patterns)
    
    # Find all files
    all_files = []
    for root, _, files in os.walk(base_path):
        for file in files:
            file_path = os.path.join(root, file)
            rel_path = os.path.relpath(file_path, base_path)
            all_files.append(rel_path)
    
    # Filter out ignored files
    import fnmatch
    
    filtered_files = []
    for file in all_files:
        ignored = False
        for pattern in all_ignore_patterns:
            if fnmatch.fnmatch(file, pattern):
                ignored = True
                break
        
        if not ignored:
            filtered_files.append(os.path.join(base_path, file))
    
    return filtered_files