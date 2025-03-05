"""Git utilities for Re-CC."""

import os
from typing import Optional, List, Dict, Any

import git


def is_git_repo(path: Optional[str] = None) -> bool:
    """Check if a directory is a Git repository.
    
    Args:
        path: The path to check, or None for current directory
        
    Returns:
        True if the directory is a Git repository, False otherwise
    """
    try:
        git.Repo(path or os.getcwd(), search_parent_directories=True)
        return True
    except git.InvalidGitRepositoryError:
        return False


def get_repo_info(path: Optional[str] = None) -> Dict[str, Any]:
    """Get information about a Git repository.
    
    Args:
        path: The path to the repository, or None for current directory
        
    Returns:
        A dictionary with repository information
        
    Raises:
        ValueError: If the directory is not a Git repository
    """
    try:
        repo = git.Repo(path or os.getcwd(), search_parent_directories=True)
        
        # Get the remote URL
        remote_url = None
        if repo.remotes:
            for remote in repo.remotes:
                remote_url = remote.url
                break
        
        # Get the current branch
        branch = None
        try:
            branch = repo.active_branch.name
        except:
            # Detached HEAD state
            branch = "HEAD"
        
        # Get the latest commit
        latest_commit = None
        if repo.heads:
            latest_commit = {
                "hash": repo.head.commit.hexsha,
                "message": repo.head.commit.message.strip(),
                "author": f"{repo.head.commit.author.name} <{repo.head.commit.author.email}>",
                "date": repo.head.commit.committed_datetime.isoformat(),
            }
        
        return {
            "root": repo.working_dir,
            "branch": branch,
            "remote_url": remote_url,
            "latest_commit": latest_commit,
        }
    
    except git.InvalidGitRepositoryError:
        raise ValueError("Not a Git repository")


def get_modified_files(path: Optional[str] = None) -> List[str]:
    """Get a list of modified files in a Git repository.
    
    Args:
        path: The path to the repository, or None for current directory
        
    Returns:
        A list of modified file paths
        
    Raises:
        ValueError: If the directory is not a Git repository
    """
    try:
        repo = git.Repo(path or os.getcwd(), search_parent_directories=True)
        
        # Get the modified files
        modified_files = []
        for item in repo.index.diff(None):
            modified_files.append(item.a_path)
        
        # Get untracked files
        for item in repo.untracked_files:
            modified_files.append(item)
        
        return modified_files
    
    except git.InvalidGitRepositoryError:
        raise ValueError("Not a Git repository")