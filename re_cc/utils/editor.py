"""File editing utilities for Re-CC."""

import os
import tempfile
import subprocess
import difflib
from typing import Optional, Tuple, List

from re_cc.utils.fs import read_file, write_file


def get_editor_command() -> str:
    """Get the user's preferred editor command.
    
    Returns:
        The editor command to use
    """
    # Check environment variables in order of preference
    for env_var in ["VISUAL", "EDITOR"]:
        editor = os.environ.get(env_var)
        if editor:
            return editor
    
    # Default editors based on platform
    if os.name == "nt":  # Windows
        return "notepad.exe"
    else:  # Unix-like
        # Try to find a common editor
        for editor in ["nano", "vim", "vi", "emacs"]:
            try:
                subprocess.run(
                    ["which", editor], 
                    stdout=subprocess.PIPE, 
                    stderr=subprocess.PIPE, 
                    check=True
                )
                return editor
            except subprocess.CalledProcessError:
                continue
    
    # If all else fails, use a basic editor
    return "nano"


def edit_file_with_editor(file_path: str) -> bool:
    """Open a file in the user's preferred editor.
    
    Args:
        file_path: The path to the file to edit
        
    Returns:
        True if the file was edited, False otherwise
    """
    editor = get_editor_command()
    
    try:
        # Get the file's modification time before editing
        mtime_before = os.path.getmtime(file_path)
        
        # Open the editor
        subprocess.run([editor, file_path], check=True)
        
        # Check if the file was modified
        mtime_after = os.path.getmtime(file_path)
        
        return mtime_after > mtime_before
    except Exception as e:
        raise RuntimeError(f"Error editing file: {str(e)}")


def edit_file(
    file_path: str, 
    old_content: str, 
    new_content: str
) -> Tuple[bool, str]:
    """Edit a file by replacing content.
    
    Args:
        file_path: The path to the file to edit
        old_content: The content to replace
        new_content: The new content
        
    Returns:
        A tuple of (success, error_message)
    """
    try:
        # Read the current file content
        current_content = read_file(file_path)
        
        # Check if the old content exists
        if old_content not in current_content:
            return False, "The specified content was not found in the file"
        
        # Replace the content
        updated_content = current_content.replace(old_content, new_content)
        
        # Write the updated content
        write_file(file_path, updated_content)
        
        return True, ""
    except Exception as e:
        return False, str(e)


def create_file(file_path: str, content: str) -> Tuple[bool, str]:
    """Create a new file with the given content.
    
    Args:
        file_path: The path to the file to create
        content: The content to write to the file
        
    Returns:
        A tuple of (success, error_message)
    """
    try:
        # Check if the file already exists
        if os.path.exists(file_path):
            return False, "File already exists"
        
        # Create the file
        write_file(file_path, content)
        
        return True, ""
    except Exception as e:
        return False, str(e)


def show_diff(file_path: str, old_content: str, new_content: str, word_level: bool = True) -> List[str]:
    """Show a diff between old and new content.
    
    Args:
        file_path: The path to the file
        old_content: The old content
        new_content: The new content
        word_level: Whether to use word-level diff (True) or line-level (False)
        
    Returns:
        A list of diff lines
    """
    if not word_level:
        # Split the content into lines
        old_lines = old_content.splitlines()
        new_lines = new_content.splitlines()
        
        # Generate the diff
        diff = difflib.unified_diff(
            old_lines,
            new_lines,
            fromfile=f"a/{file_path}",
            tofile=f"b/{file_path}",
            lineterm="",
        )
        
        return list(diff)
    else:
        # Word-level diff using difflib's SequenceMatcher
        output = [
            f"--- a/{file_path}",
            f"+++ b/{file_path}",
        ]
        
        # Split the content into lines
        old_lines = old_content.splitlines()
        new_lines = new_content.splitlines()
        
        # Determine line-level changes first
        line_matcher = difflib.SequenceMatcher(None, old_lines, new_lines)
        
        # Process line-level changes
        for op, i1, i2, j1, j2 in line_matcher.get_opcodes():
            if op == 'equal':
                # For unchanged blocks, just add the lines with context
                context_lines = min(3, i2 - i1)  # Show up to 3 lines of context
                for i in range(i1, i1 + context_lines):
                    if i < i2:
                        output.append(f" {old_lines[i]}")
                
                if i2 - i1 > 6:  # If more than 6 lines of context
                    output.append("@@ ... skipping unchanged lines ... @@")
                    
                    # Show the last few lines of context
                    for i in range(i2 - context_lines, i2):
                        if i >= i1:
                            output.append(f" {old_lines[i]}")
            
            elif op == 'replace':
                # For replaced blocks, do word-level diff
                for i, old_line in enumerate(old_lines[i1:i2]):
                    for j, new_line in enumerate(new_lines[j1:j2]):
                        if i == j:  # Only compare corresponding lines
                            # Word-level diff for this line pair
                            word_matcher = difflib.SequenceMatcher(
                                None, 
                                old_line.split(), 
                                new_line.split()
                            )
                            
                            old_formatted = []
                            new_formatted = []
                            
                            # Process word-level changes
                            for word_op, wi1, wi2, wj1, wj2 in word_matcher.get_opcodes():
                                old_words = old_line.split()[wi1:wi2]
                                new_words = new_line.split()[wj1:wj2]
                                
                                if word_op == 'equal':
                                    old_formatted.extend(old_words)
                                    new_formatted.extend(new_words)
                                
                                elif word_op == 'delete':
                                    old_formatted.extend([f"[-{w}-]" for w in old_words])
                                
                                elif word_op == 'insert':
                                    new_formatted.extend([f"[+{w}+]" for w in new_words])
                                
                                elif word_op == 'replace':
                                    old_formatted.extend([f"[-{w}-]" for w in old_words])
                                    new_formatted.extend([f"[+{w}+]" for w in new_words])
                            
                            # Add the formatted lines
                            output.append(f"- {' '.join(old_formatted)}")
                            output.append(f"+ {' '.join(new_formatted)}")
            
            elif op == 'delete':
                # Lines deleted
                for line in old_lines[i1:i2]:
                    output.append(f"- {line}")
            
            elif op == 'insert':
                # Lines inserted
                for line in new_lines[j1:j2]:
                    output.append(f"+ {line}")
        
        return output


def apply_patch(file_path: str, patch: List[str]) -> Tuple[bool, str]:
    """Apply a patch to a file.
    
    Args:
        file_path: The path to the file to patch
        patch: The patch to apply as a list of diff lines
        
    Returns:
        A tuple of (success, error_message)
    """
    try:
        # Write the patch to a temporary file
        with tempfile.NamedTemporaryFile(mode="w", suffix=".patch", delete=False) as f:
            patch_file = f.name
            f.write("\n".join(patch))
        
        # Apply the patch
        process = subprocess.run(
            ["patch", file_path, patch_file],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=False,
        )
        
        # Clean up
        os.unlink(patch_file)
        
        if process.returncode != 0:
            return False, process.stderr
        
        return True, ""
    except Exception as e:
        return False, str(e)