"""Code search utilities for Re-CC."""

import os
import re
import subprocess
from typing import List, Dict, Optional, Tuple, Any
from dataclasses import dataclass

from re_cc.utils.fs import find_files, read_file, get_project_files


@dataclass
class SearchResult:
    """A search result."""
    
    file_path: str
    line_number: int
    line: str
    context_before: List[str]
    context_after: List[str]


def search_pattern(
    pattern: str,
    path: Optional[str] = None,
    file_pattern: Optional[str] = None,
    context_lines: int = 2,
) -> List[SearchResult]:
    """Search for a pattern in files.
    
    Args:
        pattern: The regex pattern to search for
        path: The path to search in, or None for current directory
        file_pattern: A glob pattern to filter files, or None for all files
        context_lines: The number of context lines to include
        
    Returns:
        A list of search results
    """
    results = []
    
    # Get the files to search
    base_path = path or os.getcwd()
    
    if file_pattern:
        files = find_files(file_pattern, base_path)
    else:
        files = get_project_files(base_path)
    
    # Compile the regex pattern
    regex = re.compile(pattern)
    
    # Search each file
    for file_path in files:
        try:
            # Read the file
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            # Search for the pattern
            for i, line in enumerate(lines):
                if regex.search(line):
                    # Get context lines
                    start = max(0, i - context_lines)
                    end = min(len(lines), i + context_lines + 1)
                    
                    context_before = [lines[j].rstrip() for j in range(start, i)]
                    context_after = [lines[j].rstrip() for j in range(i+1, end)]
                    
                    results.append(SearchResult(
                        file_path=file_path,
                        line_number=i + 1,  # 1-based line numbers
                        line=line.rstrip(),
                        context_before=context_before,
                        context_after=context_after,
                    ))
        except Exception:
            # Skip files that can't be read
            continue
    
    return results


def search_with_ripgrep(
    pattern: str,
    path: Optional[str] = None,
    file_pattern: Optional[str] = None,
    context_lines: int = 2,
) -> List[SearchResult]:
    """Search for a pattern using ripgrep (if available).
    
    Args:
        pattern: The regex pattern to search for
        path: The path to search in, or None for current directory
        file_pattern: A glob pattern to filter files, or None for all files
        context_lines: The number of context lines to include
        
    Returns:
        A list of search results, or empty list if ripgrep is not available
    """
    try:
        # Check if ripgrep is available
        subprocess.run(
            ["rg", "--version"], 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE,
            check=True
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        # Ripgrep not available, use fallback
        return search_pattern(pattern, path, file_pattern, context_lines)
    
    results = []
    base_path = path or os.getcwd()
    
    # Build the command
    cmd = ["rg", "--json", "-C", str(context_lines), pattern]
    
    if file_pattern:
        cmd.extend(["-g", file_pattern])
    
    # Run the command
    try:
        process = subprocess.run(
            cmd,
            cwd=base_path,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=False,
        )
        
        if process.returncode not in [0, 1]:  # 1 means no matches
            # Error running ripgrep
            return search_pattern(pattern, path, file_pattern, context_lines)
        
        # Parse the output
        import json
        
        current_file = None
        current_match = None
        
        for line in process.stdout.splitlines():
            try:
                data = json.loads(line)
                
                if data.get("type") == "begin":
                    current_file = data.get("data", {}).get("path", {}).get("text")
                
                elif data.get("type") == "match" and current_file:
                    match_data = data.get("data", {})
                    line_number = match_data.get("line_number", 0)
                    line_text = match_data.get("lines", {}).get("text", "").rstrip()
                    
                    # Start a new match
                    current_match = {
                        "file_path": current_file,
                        "line_number": line_number,
                        "line": line_text,
                        "context_before": [],
                        "context_after": [],
                    }
                
                elif data.get("type") == "context" and current_match:
                    context_data = data.get("data", {})
                    context_type = context_data.get("context_type", "")
                    line_text = context_data.get("lines", {}).get("text", "").rstrip()
                    
                    if context_type == "before":
                        current_match["context_before"].append(line_text)
                    elif context_type == "after":
                        current_match["context_after"].append(line_text)
                
                elif data.get("type") == "end" and current_match:
                    # Finalize the match
                    results.append(SearchResult(
                        file_path=current_match["file_path"],
                        line_number=current_match["line_number"],
                        line=current_match["line"],
                        context_before=current_match["context_before"],
                        context_after=current_match["context_after"],
                    ))
                    current_match = None
            
            except json.JSONDecodeError:
                continue
    
    except Exception:
        # Error running ripgrep, use fallback
        return search_pattern(pattern, path, file_pattern, context_lines)
    
    return results


def find_function_definition(
    function_name: str,
    path: Optional[str] = None,
    language: Optional[str] = None,
) -> Optional[SearchResult]:
    """Find a function definition.
    
    Args:
        function_name: The function name to find
        path: The path to search in, or None for current directory
        language: The programming language, or None to auto-detect
        
    Returns:
        The search result if found, None otherwise
    """
    # Build the search pattern based on language
    if language == "python":
        pattern = f"def\\s+{function_name}\\s*\\("
    elif language == "javascript" or language == "typescript":
        pattern = f"function\\s+{function_name}\\s*\\(|const\\s+{function_name}\\s*=\\s*\\(|{function_name}\\s*:\\s*function\\s*\\("
    elif language == "go":
        pattern = f"func\\s+{function_name}\\s*\\("
    elif language == "rust":
        pattern = f"fn\\s+{function_name}\\s*\\("
    elif language == "java" or language == "c" or language == "cpp":
        pattern = f"\\w+\\s+{function_name}\\s*\\("
    else:
        # Generic pattern for function definitions
        pattern = f"(function|def|fn|func)\\s+{function_name}\\s*\\(|{function_name}\\s*[=:]\\s*\\("
    
    # Search for the pattern
    results = search_with_ripgrep(pattern, path)
    
    # Return the first result if any
    return results[0] if results else None


def find_class_definition(
    class_name: str,
    path: Optional[str] = None,
    language: Optional[str] = None,
) -> Optional[SearchResult]:
    """Find a class definition.
    
    Args:
        class_name: The class name to find
        path: The path to search in, or None for current directory
        language: The programming language, or None to auto-detect
        
    Returns:
        The search result if found, None otherwise
    """
    # Build the search pattern based on language
    if language == "python":
        pattern = f"class\\s+{class_name}\\s*[\\(\\:]"
    elif language == "javascript" or language == "typescript":
        pattern = f"class\\s+{class_name}\\s*[{{\\extends]"
    elif language == "java":
        pattern = f"(class|interface|enum)\\s+{class_name}\\s*[{{\\implements\\extends]"
    elif language == "c" or language == "cpp":
        pattern = f"(class|struct)\\s+{class_name}\\s*[{{\\:]"
    else:
        # Generic pattern for class definitions
        pattern = f"class\\s+{class_name}\\s*[{{\\(\\:\\extends\\implements]"
    
    # Search for the pattern
    results = search_with_ripgrep(pattern, path)
    
    # Return the first result if any
    return results[0] if results else None


def find_import(
    module_name: str,
    path: Optional[str] = None,
    language: Optional[str] = None,
) -> List[SearchResult]:
    """Find imports of a module.
    
    Args:
        module_name: The module name to find
        path: The path to search in, or None for current directory
        language: The programming language, or None to auto-detect
        
    Returns:
        A list of search results
    """
    # Build the search pattern based on language
    if language == "python":
        pattern = f"import\\s+{module_name}|from\\s+{module_name}\\s+import"
    elif language == "javascript" or language == "typescript":
        pattern = f"import\\s+.*from\\s+['\\\"].*{module_name}|require\\(['\\\"].*{module_name}"
    elif language == "go":
        pattern = f"import\\s+[\\(\\s]*[\"_\\.]*{module_name}"
    elif language == "rust":
        pattern = f"use\\s+.*{module_name}"
    elif language == "java":
        pattern = f"import\\s+.*{module_name}"
    else:
        # Generic pattern for imports
        pattern = f"import\\s+.*{module_name}|from\\s+.*{module_name}|require\\s*\\(.*{module_name}|use\\s+.*{module_name}"
    
    # Search for the pattern
    return search_with_ripgrep(pattern, path)


def find_files_with_glob(pattern: str, base_dir: Optional[str] = None) -> List[str]:
    """Find files matching a glob pattern.
    
    Args:
        pattern: The glob pattern to match
        base_dir: The base directory to search in
        
    Returns:
        A list of matching file paths
    """
    import glob
    import os
    
    # Set base directory
    cwd = None
    if base_dir:
        cwd = os.getcwd()
        os.chdir(base_dir)
    
    try:
        # Find files
        files = glob.glob(pattern, recursive=True)
        
        # Convert to absolute paths
        abs_files = [os.path.abspath(f) for f in files]
        
        # Sort by modification time (newest first)
        abs_files.sort(key=lambda f: os.path.getmtime(f) if os.path.exists(f) else 0, reverse=True)
        
        return abs_files
    finally:
        # Restore directory if changed
        if cwd:
            os.chdir(cwd)