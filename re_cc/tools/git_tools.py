"""Git and GitHub tools for repository and PR management."""

import json
import os
import re
import subprocess
from typing import Dict, List, Any, Optional, Union, Tuple

from re_cc.tools import Tool, tool_registry
from re_cc.utils.git import is_git_repo, get_repo_info, get_modified_files

# Helper functions for Git operations

def run_command(command: str) -> Dict[str, Any]:
    """Run a command synchronously and return the result.
    
    Args:
        command: Command to run
        
    Returns:
        Result dictionary with success, stdout, stderr
    """
    # Execute the command using subprocess directly
    try:
        process = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True
        )
        
        return {
            "success": process.returncode == 0,
            "stdout": process.stdout,
            "stderr": process.stderr,
            "command": command
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "command": command
        }

def run_git_command(command: str) -> Dict[str, Any]:
    """Run a git command synchronously and return the result.
    
    Args:
        command: Git command to run
        
    Returns:
        Result dictionary with success, stdout, stderr
    """
    # Add git prefix if it's not there
    if not command.strip().startswith("git "):
        command = f"git {command}"
        
    return run_command(command)

def check_gh_cli_installed() -> bool:
    """Check if GitHub CLI is installed.
    
    Returns:
        True if installed, False otherwise
    """
    result = run_command("gh --version")
    return result["success"]

# Git repository operations

def handle_git_status() -> Dict[str, Any]:
    """Handler for GitStatus tool.
    
    Returns:
        Result of git status command with parsed information
    """
    try:
        if not is_git_repo():
            return {
                "success": False,
                "error": "Not in a Git repository"
            }
        
        # Get repository info
        repo_info = get_repo_info()
        
        # Get status information
        status_result = run_git_command("status --porcelain")
        if not status_result["success"]:
            return {
                "success": False,
                "error": "Failed to get git status: " + status_result.get("stderr", "")
            }
        
        # Parse status output
        modified = []
        added = []
        deleted = []
        untracked = []
        
        for line in status_result["stdout"].splitlines():
            if not line.strip():
                continue
                
            status = line[:2]
            file_path = line[3:].strip()
            
            if status.startswith("M"):
                modified.append(file_path)
            elif status.startswith("A"):
                added.append(file_path)
            elif status.startswith("D"):
                deleted.append(file_path)
            elif status.startswith("??"):
                untracked.append(file_path)
        
        # Get branch info
        branch_result = run_git_command("branch -v")
        current_branch = ""
        
        for line in branch_result.get("stdout", "").splitlines():
            if line.startswith("*"):
                current_branch = line[1:].strip().split()[0]
                break
        
        return {
            "success": True,
            "repository": repo_info["root"],
            "branch": current_branch,
            "modified": modified,
            "added": added,
            "deleted": deleted,
            "untracked": untracked,
            "clean": len(modified) + len(added) + len(deleted) + len(untracked) == 0,
            "raw_output": status_result["stdout"]
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Error getting git status: {str(e)}"
        }

def handle_git_log(limit: Optional[int] = 10) -> Dict[str, Any]:
    """Handler for GitLog tool.
    
    Args:
        limit: Maximum number of commits to show
        
    Returns:
        Result of git log command with parsed information
    """
    try:
        if not is_git_repo():
            return {
                "success": False,
                "error": "Not in a Git repository"
            }
        
        # Format: hash, author name, date, and subject
        format_str = "--pretty=format:'%H|%an|%ad|%s'"
        
        # Get log
        log_result = run_git_command(f"log {format_str} --date=iso -n {limit}")
        if not log_result["success"]:
            return {
                "success": False,
                "error": "Failed to get git log: " + log_result.get("stderr", "")
            }
        
        # Parse log output
        commits = []
        for line in log_result["stdout"].splitlines():
            if not line.strip():
                continue
            
            parts = line.split("|", 3)
            if len(parts) == 4:
                commits.append({
                    "hash": parts[0],
                    "author": parts[1],
                    "date": parts[2],
                    "message": parts[3]
                })
        
        return {
            "success": True,
            "commits": commits,
            "count": len(commits)
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Error getting git log: {str(e)}"
        }

def handle_git_branch(name: Optional[str] = None, base: Optional[str] = None) -> Dict[str, Any]:
    """Handler for GitBranch tool.
    
    Args:
        name: Branch name to create (if None, just list branches)
        base: Base branch to create from (if None, use current branch)
        
    Returns:
        Result of the branch operation
    """
    try:
        if not is_git_repo():
            return {
                "success": False,
                "error": "Not in a Git repository"
            }
        
        # If no branch name, list branches
        if not name:
            branch_result = run_git_command("branch")
            if not branch_result["success"]:
                return {
                    "success": False,
                    "error": "Failed to list branches: " + branch_result.get("stderr", "")
                }
            
            branches = []
            current = None
            
            for line in branch_result["stdout"].splitlines():
                line = line.strip()
                if not line:
                    continue
                
                if line.startswith("*"):
                    branch_name = line[1:].strip()
                    branches.append(branch_name)
                    current = branch_name
                else:
                    branches.append(line)
            
            return {
                "success": True,
                "branches": branches,
                "current": current,
                "count": len(branches)
            }
        
        # Create new branch
        create_args = []
        if base:
            create_args.append(base)
        
        branch_result = run_git_command(f"checkout -b {name} {' '.join(create_args)}")
        if not branch_result["success"]:
            return {
                "success": False,
                "error": "Failed to create branch: " + branch_result.get("stderr", "")
            }
        
        return {
            "success": True,
            "branch": name,
            "base": base,
            "message": f"Created and switched to branch '{name}'"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Error managing branches: {str(e)}"
        }

def handle_git_checkout(target: str) -> Dict[str, Any]:
    """Handler for GitCheckout tool.
    
    Args:
        target: Branch or commit to checkout
        
    Returns:
        Result of the checkout operation
    """
    try:
        if not is_git_repo():
            return {
                "success": False,
                "error": "Not in a Git repository"
            }
        
        if not target:
            return {
                "success": False,
                "error": "No branch or commit specified for checkout"
            }
        
        checkout_result = run_git_command(f"checkout {target}")
        if not checkout_result["success"]:
            return {
                "success": False,
                "error": "Failed to checkout: " + checkout_result.get("stderr", "")
            }
        
        return {
            "success": True,
            "target": target,
            "message": checkout_result["stdout"] or f"Switched to {target}"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Error during checkout: {str(e)}"
        }

def handle_git_commit(message: str, all_changes: bool = False) -> Dict[str, Any]:
    """Handler for GitCommit tool.
    
    Args:
        message: Commit message
        all_changes: Whether to add all changes before committing
        
    Returns:
        Result of the commit operation
    """
    try:
        if not is_git_repo():
            return {
                "success": False,
                "error": "Not in a Git repository"
            }
        
        if not message:
            return {
                "success": False,
                "error": "No commit message provided"
            }
        
        # Add all changes if requested
        if all_changes:
            add_result = run_git_command("add -A")
            if not add_result["success"]:
                return {
                    "success": False,
                    "error": "Failed to add changes: " + add_result.get("stderr", "")
                }
        
        # Commit with message
        commit_result = run_git_command(f"commit -m '{message}'")
        if not commit_result["success"]:
            return {
                "success": False,
                "error": "Failed to commit: " + commit_result.get("stderr", "")
            }
        
        # Get the commit hash from the output
        commit_hash = ""
        stdout = commit_result.get("stdout", "")
        hash_match = re.search(r'\[.*\s([a-f0-9]+)\]', stdout)
        if hash_match:
            commit_hash = hash_match.group(1)
        
        return {
            "success": True,
            "hash": commit_hash,
            "message": message,
            "added_all": all_changes,
            "output": stdout
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Error during commit: {str(e)}"
        }

def handle_git_push(remote: str = "origin", branch: Optional[str] = None, set_upstream: bool = False) -> Dict[str, Any]:
    """Handler for GitPush tool.
    
    Args:
        remote: Remote name
        branch: Branch to push (if None, push current branch)
        set_upstream: Whether to set the upstream branch
        
    Returns:
        Result of the push operation
    """
    try:
        if not is_git_repo():
            return {
                "success": False,
                "error": "Not in a Git repository"
            }
        
        # Get current branch if not specified
        if not branch:
            branch_result = run_git_command("rev-parse --abbrev-ref HEAD")
            if not branch_result["success"]:
                return {
                    "success": False,
                    "error": "Failed to get current branch: " + branch_result.get("stderr", "")
                }
            
            branch = branch_result["stdout"].strip()
            if not branch or branch == "HEAD":
                return {
                    "success": False,
                    "error": "Could not determine current branch"
                }
        
        # Build push command
        push_cmd = f"push {remote} {branch}"
        if set_upstream:
            push_cmd += f" --set-upstream"
        
        # Execute push
        push_result = run_git_command(push_cmd)
        if not push_result["success"]:
            return {
                "success": False,
                "error": "Failed to push: " + push_result.get("stderr", "")
            }
        
        return {
            "success": True,
            "remote": remote,
            "branch": branch,
            "set_upstream": set_upstream,
            "output": push_result["stdout"]
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Error during push: {str(e)}"
        }

def handle_git_pull(remote: str = "origin", branch: Optional[str] = None) -> Dict[str, Any]:
    """Handler for GitPull tool.
    
    Args:
        remote: Remote name
        branch: Branch to pull (if None, pull current branch)
        
    Returns:
        Result of the pull operation
    """
    try:
        if not is_git_repo():
            return {
                "success": False,
                "error": "Not in a Git repository"
            }
        
        # Get current branch if not specified
        if not branch:
            branch_result = run_git_command("rev-parse --abbrev-ref HEAD")
            if not branch_result["success"]:
                return {
                    "success": False,
                    "error": "Failed to get current branch: " + branch_result.get("stderr", "")
                }
            
            branch = branch_result["stdout"].strip()
            if not branch or branch == "HEAD":
                return {
                    "success": False,
                    "error": "Could not determine current branch"
                }
        
        # Execute pull
        pull_result = run_git_command(f"pull {remote} {branch}")
        if not pull_result["success"]:
            return {
                "success": False,
                "error": "Failed to pull: " + pull_result.get("stderr", "")
            }
        
        return {
            "success": True,
            "remote": remote,
            "branch": branch,
            "output": pull_result["stdout"]
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Error during pull: {str(e)}"
        }

def handle_git_diff(file: Optional[str] = None) -> Dict[str, Any]:
    """Handler for GitDiff tool.
    
    Args:
        file: Specific file to diff, or None for all changes
        
    Returns:
        Result of the diff operation
    """
    try:
        if not is_git_repo():
            return {
                "success": False,
                "error": "Not in a Git repository"
            }
        
        # Build diff command
        diff_cmd = "diff"
        if file:
            diff_cmd += f" -- {file}"
        
        # Execute diff
        diff_result = run_git_command(diff_cmd)
        if not diff_result["success"] and diff_result.get("stderr", ""):
            return {
                "success": False,
                "error": "Failed to get diff: " + diff_result.get("stderr", "")
            }
        
        return {
            "success": True,
            "file": file,
            "has_changes": bool(diff_result.get("stdout", "")),
            "diff": diff_result.get("stdout", "")
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Error getting diff: {str(e)}"
        }

# GitHub PR operations

def handle_pr_list() -> Dict[str, Any]:
    """Handler for PRList tool.
    
    Returns:
        List of open pull requests
    """
    try:
        # Check if gh CLI is installed
        if not check_gh_cli_installed():
            return {
                "success": False,
                "error": "GitHub CLI is not installed. Please install it to use PR tools."
            }
        
        # Get PR list
        process = subprocess.run(
            "gh pr list --json number,title,headRefName,baseRefName,author,state,url",
            shell=True,
            capture_output=True,
            text=True
        )
        
        result_success = process.returncode == 0
        result_stdout = process.stdout
        result_stderr = process.stderr
        
        if not result_success:
            return {
                "success": False,
                "error": f"Failed to list PRs: {result_stderr}"
            }
        
        try:
            # Parse JSON output
            prs = json.loads(result_stdout)
            
            return {
                "success": True,
                "pull_requests": prs,
                "count": len(prs)
            }
        except json.JSONDecodeError:
            return {
                "success": False,
                "error": f"Failed to parse PR list: {result_stdout}"
            }
    except Exception as e:
        return {
            "success": False,
            "error": f"Error listing PRs: {str(e)}"
        }

def handle_pr_create(
    title: str,
    body: Optional[str] = None,
    base: Optional[str] = None,
    head: Optional[str] = None
) -> Dict[str, Any]:
    """Handler for PRCreate tool.
    
    Args:
        title: PR title
        body: PR description (optional)
        base: Base branch (optional)
        head: Head branch (optional)
        
    Returns:
        Result of PR creation
    """
    try:
        # Check if gh CLI is installed
        if not check_gh_cli_installed():
            return {
                "success": False,
                "error": "GitHub CLI is not installed. Please install it to use PR tools."
            }
        
        # Build command
        cmd = ["gh", "pr", "create", "--title", title]
        
        if body:
            cmd.extend(["--body", body])
        
        if base:
            cmd.extend(["--base", base])
        
        if head:
            cmd.extend(["--head", head])
        
        # Run command
        process = subprocess.run(cmd, capture_output=True, text=True)
        
        if process.returncode != 0:
            return {
                "success": False,
                "error": f"Failed to create PR: {process.stderr}"
            }
        
        # Extract PR number from URL (usually in the output)
        pr_number = None
        url = None
        
        for line in process.stdout.splitlines():
            if "https://github.com/" in line and "/pull/" in line:
                url = line.strip()
                pr_parts = url.split("/pull/")
                if len(pr_parts) > 1:
                    pr_number = pr_parts[1].strip()
                break
        
        return {
            "success": True,
            "title": title,
            "body": body,
            "base": base,
            "head": head,
            "pr_number": pr_number,
            "url": url,
            "output": process.stdout
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Error creating PR: {str(e)}"
        }

def handle_pr_checkout(pr_number: str) -> Dict[str, Any]:
    """Handler for PRCheckout tool.
    
    Args:
        pr_number: PR number to checkout
        
    Returns:
        Result of PR checkout
    """
    try:
        # Check if gh CLI is installed
        if not check_gh_cli_installed():
            return {
                "success": False,
                "error": "GitHub CLI is not installed. Please install it to use PR tools."
            }
        
        # Checkout PR
        process = subprocess.run(
            f"gh pr checkout {pr_number}",
            shell=True,
            capture_output=True,
            text=True
        )
        
        result_success = process.returncode == 0
        result_stdout = process.stdout
        result_stderr = process.stderr
        
        if not result_success:
            return {
                "success": False,
                "error": f"Failed to checkout PR: {result_stderr}"
            }
        
        return {
            "success": True,
            "pr_number": pr_number,
            "output": result_stdout
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Error checking out PR: {str(e)}"
        }

def handle_pr_view(pr_number: str) -> Dict[str, Any]:
    """Handler for PRView tool.
    
    Args:
        pr_number: PR number to view
        
    Returns:
        PR details
    """
    try:
        # Check if gh CLI is installed
        if not check_gh_cli_installed():
            return {
                "success": False,
                "error": "GitHub CLI is not installed. Please install it to use PR tools."
            }
        
        # Get PR data
        pr_cmd = f"gh pr view {pr_number} --json number,title,body,author,state,baseRefName,headRefName,createdAt,updatedAt,closedAt,mergeable,mergeStateStatus,additions,deletions,changedFiles"
        process = subprocess.run(
            pr_cmd,
            shell=True,
            capture_output=True,
            text=True
        )
        
        result_success = process.returncode == 0
        result_stdout = process.stdout
        result_stderr = process.stderr
        
        if not result_success:
            return {
                "success": False,
                "error": f"Failed to view PR: {result_stderr}"
            }
        
        try:
            # Parse JSON output
            pr_data = json.loads(result_stdout)
            
            # Get PR diff
            diff_process = subprocess.run(
                f"gh pr diff {pr_number}",
                shell=True,
                capture_output=True,
                text=True
            )
            diff_success = diff_process.returncode == 0
            diff_stdout = diff_process.stdout
            
            return {
                "success": True,
                "pr_number": pr_number,
                "pr_data": pr_data,
                "diff": diff_stdout if diff_success else ""
            }
        except json.JSONDecodeError:
            return {
                "success": False,
                "error": f"Failed to parse PR data: {result_stdout}"
            }
    except Exception as e:
        return {
            "success": False,
            "error": f"Error viewing PR: {str(e)}"
        }

def handle_pr_comments(pr_number: str) -> Dict[str, Any]:
    """Handler for PRComments tool.
    
    Args:
        pr_number: The PR number to fetch comments for
        
    Returns:
        Result of the operation
    """
    try:
        # Check if gh CLI is installed
        if not check_gh_cli_installed():
            return {
                "success": False,
                "error": "GitHub CLI is not installed. Please install it to use PR tools."
            }
        
        # Fetch the PR data
        view_result = run_command(f"gh pr view {pr_number} --json number,title,body,author,comments,reviewRequests")
        
        if not view_result["success"]:
            return {
                "success": False,
                "error": f"Failed to fetch PR #{pr_number}: {view_result['stderr']}"
            }
        
        try:
            pr_data = json.loads(view_result["stdout"])
        except json.JSONDecodeError:
            return {
                "success": False,
                "error": f"Failed to parse PR data: {view_result['stdout']}"
            }
        
        # Get PR comments
        comments = pr_data.get("comments", [])
        
        # Fetch PR diff to provide context for comments
        diff_result = run_command(f"gh pr diff {pr_number}")
        
        diff_content = ""
        if diff_result["success"]:
            diff_content = diff_result["stdout"]
        
        # Get PR reviews
        reviews_result = run_command(f"gh pr reviews {pr_number} --json author,body,state,url")
        reviews = []
        
        if reviews_result["success"]:
            try:
                reviews = json.loads(reviews_result["stdout"])
            except json.JSONDecodeError:
                pass  # Just skip reviews if we can't parse them
        
        return {
            "success": True,
            "pr_number": pr_number,
            "title": pr_data.get("title", ""),
            "body": pr_data.get("body", ""),
            "author": pr_data.get("author", {}).get("login", ""),
            "comments": comments,
            "reviews": reviews,
            "diff": diff_content
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Error fetching PR comments: {str(e)}"
        }

def handle_pr_review(pr_number: str) -> Dict[str, Any]:
    """Handler for PRReview tool.
    
    Args:
        pr_number: The PR number to review
        
    Returns:
        Result of the operation
    """
    try:
        # Check if gh CLI is installed
        if not check_gh_cli_installed():
            return {
                "success": False,
                "error": "GitHub CLI is not installed. Please install it to use PR tools."
            }
        
        # Fetch the PR data first
        view_result = run_command(f"gh pr view {pr_number} --json number,title,body,author,additions,deletions,changedFiles,files")
        
        if not view_result["success"]:
            return {
                "success": False,
                "error": f"Failed to fetch PR #{pr_number}: {view_result['stderr']}"
            }
        
        try:
            pr_data = json.loads(view_result["stdout"])
        except json.JSONDecodeError:
            return {
                "success": False,
                "error": f"Failed to parse PR data: {view_result['stdout']}"
            }
        
        # Get PR diff for review
        diff_result = run_command(f"gh pr diff {pr_number}")
        
        diff_content = ""
        if diff_result["success"]:
            diff_content = diff_result["stdout"]
        
        # Get files changed in PR
        files_changed = pr_data.get("files", [])
        
        return {
            "success": True,
            "pr_number": pr_number,
            "title": pr_data.get("title", ""),
            "body": pr_data.get("body", ""),
            "author": pr_data.get("author", {}).get("login", ""),
            "additions": pr_data.get("additions", 0),
            "deletions": pr_data.get("deletions", 0),
            "changed_files": pr_data.get("changedFiles", 0),
            "files": files_changed,
            "diff": diff_content
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Error reviewing PR: {str(e)}"
        }

def handle_pr_comment_add(pr_number: str, body: str) -> Dict[str, Any]:
    """Handler for PRCommentAdd tool.
    
    Args:
        pr_number: The PR number to comment on
        body: The comment text
        
    Returns:
        Result of adding the comment
    """
    try:
        # Check if gh CLI is installed
        if not check_gh_cli_installed():
            return {
                "success": False,
                "error": "GitHub CLI is not installed. Please install it to use PR tools."
            }
        
        if not body:
            return {
                "success": False,
                "error": "Comment body is required"
            }
        
        # Add comment
        result = run_command(f"gh pr comment {pr_number} --body \"{body}\"")
        
        if not result["success"]:
            return {
                "success": False,
                "error": f"Failed to add comment: {result['stderr']}"
            }
        
        return {
            "success": True,
            "pr_number": pr_number,
            "body": body,
            "output": result["stdout"]
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Error adding comment: {str(e)}"
        }

def handle_pr_merge(pr_number: str, method: str = "merge") -> Dict[str, Any]:
    """Handler for PRMerge tool.
    
    Args:
        pr_number: The PR number to merge
        method: Merge method (merge, squash, rebase)
        
    Returns:
        Result of merging the PR
    """
    try:
        # Check if gh CLI is installed
        if not check_gh_cli_installed():
            return {
                "success": False,
                "error": "GitHub CLI is not installed. Please install it to use PR tools."
            }
        
        # Validate method
        if method not in ["merge", "squash", "rebase"]:
            return {
                "success": False,
                "error": f"Invalid merge method: {method}. Must be one of: merge, squash, rebase"
            }
        
        # Merge PR
        result = run_command(f"gh pr merge {pr_number} --{method}")
        
        if not result["success"]:
            return {
                "success": False,
                "error": f"Failed to merge PR: {result['stderr']}"
            }
        
        return {
            "success": True,
            "pr_number": pr_number,
            "method": method,
            "output": result["stdout"]
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Error merging PR: {str(e)}"
        }

# Tool prompts
git_status_prompt = """
Shows the working tree status in a Git repository.

This tool runs `git status` and returns information about:
- Current branch
- Files that are staged for commit
- Files that are modified but not staged
- Untracked files
- Whether the working directory is clean

It returns a structured result with lists of modified, added, deleted, and untracked files.

Use this when you need to understand what files have been changed or need to be committed.
"""

git_log_prompt = """
Shows the commit history in a Git repository.

This tool runs `git log` and returns information about recent commits, including:
- Commit hash
- Author name
- Commit date
- Commit message

You can specify a limit to control how many commits to show (default: 10).

Use this when you need to understand the project history or find specific commits.
"""

git_branch_prompt = """
Lists or creates branches in a Git repository.

When used without parameters, this tool shows all branches in the repository and indicates the current branch.

When used with a branch name parameter, it creates a new branch with that name. 
You can optionally specify a base branch to create from (defaults to the current branch).

Use this when you need to manage Git branches or start work on a new feature.
"""

git_checkout_prompt = """
Switches branches or restores working tree files in a Git repository.

This tool runs `git checkout` to switch to a different branch or commit.
You must specify the branch name or commit hash to checkout.

Use this when you need to switch to a different branch or version of the code.
"""

git_commit_prompt = """
Records changes to the repository with a commit.

This tool runs `git commit` to create a new commit with your message.
You must provide a commit message. You can optionally stage all changes before committing.

Use this when you've made changes that you want to save in the repository history.
"""

git_push_prompt = """
Updates remote refs along with associated objects.

This tool runs `git push` to send your local commits to a remote repository.
You can specify the remote name (defaults to "origin") and branch name.
You can also set the upstream tracking reference with set_upstream=True.

Use this when you want to share your commits with others or publish changes to GitHub.
"""

git_pull_prompt = """
Fetches from and integrates with another repository or a local branch.

This tool runs `git pull` to update your local branch with changes from a remote repository.
You can specify the remote name (defaults to "origin") and branch name.

Use this when you want to update your local repository with changes made by others.
"""

git_diff_prompt = """
Shows changes between commits, commit and working tree, etc.

This tool runs `git diff` to display changes in your working tree.
You can optionally specify a file path to show changes only for that file.

Use this when you want to see what changes have been made but not yet committed.
"""

pr_list_prompt = """
Lists pull requests from GitHub.

This tool uses the GitHub CLI to fetch a list of open pull requests for the current repository.
It returns details including PR number, title, author, and branches.

IMPORTANT: This tool requires the GitHub CLI to be installed and authenticated.

Use this when you want to see what pull requests are currently open or find a specific PR.
"""

pr_create_prompt = """
Creates a new pull request on GitHub.

This tool uses the GitHub CLI to create a new pull request.
You must provide a title, and can optionally provide a body, base branch, and head branch.

IMPORTANT: This tool requires the GitHub CLI to be installed and authenticated.

Use this when you want to submit changes for review or merge into another branch.
"""

pr_checkout_prompt = """
Checks out a pull request locally.

This tool uses the GitHub CLI to check out a specific pull request.
You must provide the PR number to checkout.

IMPORTANT: This tool requires the GitHub CLI to be installed and authenticated.

Use this when you want to review or work on changes from a pull request locally.
"""

pr_view_prompt = """
Shows details for a specific pull request.

This tool uses the GitHub CLI to fetch detailed information about a pull request.
It returns PR metadata and the diff of changes.

IMPORTANT: This tool requires the GitHub CLI to be installed and authenticated.

Use this when you want to see details about a specific pull request.
"""

pr_comments_prompt = """
Fetches and displays comments from a GitHub pull request.

This tool uses the GitHub CLI to fetch PR details, comments, and code context, formatting them with diff hunks and threading.

IMPORTANT: This tool requires the GitHub CLI to be installed and authenticated.

Use this when you want to see what feedback has been given on a pull request.
"""

pr_review_prompt = """
Reviews a pull request, providing detailed information for feedback.

This tool uses the GitHub CLI to fetch PR details and diffs for review.
It provides a comprehensive view of changes to facilitate code review.

IMPORTANT: This tool requires the GitHub CLI to be installed and authenticated.

Use this when you need to perform a code review on a pull request.
"""

pr_comment_add_prompt = """
Adds a comment to a GitHub pull request.

This tool uses the GitHub CLI to add a new comment to a specific pull request.
You must provide the PR number and comment body.

IMPORTANT: This tool requires the GitHub CLI to be installed and authenticated.

Use this when you want to provide feedback on a pull request.
"""

pr_merge_prompt = """
Merges a pull request on GitHub.

This tool uses the GitHub CLI to merge a specific pull request.
You must provide the PR number and can specify the merge method (merge, squash, rebase).

IMPORTANT: This tool requires the GitHub CLI to be installed and authenticated.

Use this when you want to merge changes from a pull request into the base branch.
"""

# Register the tools
def register_git_tools() -> List[Tool]:
    """Register Git and PR tools."""
    tools = [
        # Git repository tools
        Tool(
            name="GitStatus",
            description="Shows the status of the working tree in a Git repository",
            handler=handle_git_status,
            prompt=git_status_prompt,
            parameters={},
            required_params=[],
            user_facing_name="GitStatus",
            command_aliases=["git-status", "status"],
            visibility="both"
        ),
        Tool(
            name="GitLog",
            description="Shows commit logs in a Git repository",
            handler=handle_git_log,
            prompt=git_log_prompt,
            parameters={
                "limit": {"type": "integer", "description": "Maximum number of commits to show"}
            },
            required_params=[],
            user_facing_name="GitLog",
            command_aliases=["git-log", "log"],
            visibility="both"
        ),
        Tool(
            name="GitBranch",
            description="Lists or creates branches in a Git repository",
            handler=handle_git_branch,
            prompt=git_branch_prompt,
            parameters={
                "name": {"type": "string", "description": "Branch name to create (if None, just list branches)"},
                "base": {"type": "string", "description": "Base branch to create from (if None, use current branch)"}
            },
            required_params=[],
            user_facing_name="GitBranch",
            command_aliases=["git-branch", "branch"],
            visibility="both"
        ),
        Tool(
            name="GitCheckout",
            description="Switches branches or restores working tree files",
            handler=handle_git_checkout,
            prompt=git_checkout_prompt,
            parameters={
                "target": {"type": "string", "description": "Branch or commit to checkout"}
            },
            required_params=["target"],
            user_facing_name="GitCheckout",
            command_aliases=["git-checkout", "checkout"],
            visibility="both"
        ),
        Tool(
            name="GitCommit",
            description="Records changes to the repository",
            handler=handle_git_commit,
            prompt=git_commit_prompt,
            parameters={
                "message": {"type": "string", "description": "Commit message"},
                "all_changes": {"type": "boolean", "description": "Whether to add all changes before committing"}
            },
            required_params=["message"],
            user_facing_name="GitCommit",
            command_aliases=["git-commit", "commit"],
            visibility="both"
        ),
        Tool(
            name="GitPush",
            description="Updates remote refs along with associated objects",
            handler=handle_git_push,
            prompt=git_push_prompt,
            parameters={
                "remote": {"type": "string", "description": "Remote name"},
                "branch": {"type": "string", "description": "Branch to push (if None, push current branch)"},
                "set_upstream": {"type": "boolean", "description": "Whether to set the upstream branch"}
            },
            required_params=[],
            user_facing_name="GitPush",
            command_aliases=["git-push", "push"],
            visibility="both"
        ),
        Tool(
            name="GitPull",
            description="Fetches from and integrates with another repository or local branch",
            handler=handle_git_pull,
            prompt=git_pull_prompt,
            parameters={
                "remote": {"type": "string", "description": "Remote name"},
                "branch": {"type": "string", "description": "Branch to pull (if None, pull current branch)"}
            },
            required_params=[],
            user_facing_name="GitPull",
            command_aliases=["git-pull", "pull"],
            visibility="both"
        ),
        Tool(
            name="GitDiff",
            description="Shows changes between commits, commit and working tree, etc.",
            handler=handle_git_diff,
            prompt=git_diff_prompt,
            parameters={
                "file": {"type": "string", "description": "Specific file to diff, or None for all changes"}
            },
            required_params=[],
            user_facing_name="GitDiff",
            command_aliases=["git-diff", "diff"],
            visibility="both"
        ),
        
        # GitHub PR tools
        Tool(
            name="PRList",
            description="Lists pull requests from GitHub",
            handler=handle_pr_list,
            prompt=pr_list_prompt,
            parameters={},
            required_params=[],
            user_facing_name="PRList",
            command_aliases=["pr-list", "prs"],
            visibility="both"
        ),
        Tool(
            name="PRCreate",
            description="Creates a new pull request on GitHub",
            handler=handle_pr_create,
            prompt=pr_create_prompt,
            parameters={
                "title": {"type": "string", "description": "PR title"},
                "body": {"type": "string", "description": "PR description (optional)"},
                "base": {"type": "string", "description": "Base branch (optional)"},
                "head": {"type": "string", "description": "Head branch (optional)"}
            },
            required_params=["title"],
            user_facing_name="PRCreate",
            command_aliases=["pr-create", "create-pr"],
            visibility="both"
        ),
        Tool(
            name="PRCheckout",
            description="Checks out a pull request locally",
            handler=handle_pr_checkout,
            prompt=pr_checkout_prompt,
            parameters={
                "pr_number": {"type": "string", "description": "PR number to checkout"}
            },
            required_params=["pr_number"],
            user_facing_name="PRCheckout",
            command_aliases=["pr-checkout"],
            visibility="both"
        ),
        Tool(
            name="PRView",
            description="Shows details for a specific pull request",
            handler=handle_pr_view,
            prompt=pr_view_prompt,
            parameters={
                "pr_number": {"type": "string", "description": "PR number to view"}
            },
            required_params=["pr_number"],
            user_facing_name="PRView",
            command_aliases=["pr-view", "view-pr"],
            visibility="both"
        ),
        Tool(
            name="PRComments",
            description="Fetches and displays comments from a GitHub pull request",
            handler=handle_pr_comments,
            prompt=pr_comments_prompt,
            parameters={
                "pr_number": {"type": "string", "description": "The PR number to fetch comments for"}
            },
            required_params=["pr_number"],
            user_facing_name="PRComments",
            command_aliases=["pr-comments", "comments"],
            command_pattern=r"^/pr-comments\s+(\d+)$",
            visibility="both"
        ),
        Tool(
            name="PRReview",
            description="Reviews a pull request, providing detailed information for feedback",
            handler=handle_pr_review,
            prompt=pr_review_prompt,
            parameters={
                "pr_number": {"type": "string", "description": "The PR number to review"}
            },
            required_params=["pr_number"],
            user_facing_name="PRReview",
            command_aliases=["review-pr"],
            command_pattern=r"^/review\s+(\d+)$",
            visibility="both"
        ),
        Tool(
            name="PRCommentAdd",
            description="Adds a comment to a GitHub pull request",
            handler=handle_pr_comment_add,
            prompt=pr_comment_add_prompt,
            parameters={
                "pr_number": {"type": "string", "description": "The PR number to comment on"},
                "body": {"type": "string", "description": "The comment text"}
            },
            required_params=["pr_number", "body"],
            user_facing_name="PRCommentAdd",
            command_aliases=["pr-comment", "comment-pr"],
            visibility="both"
        ),
        Tool(
            name="PRMerge",
            description="Merges a pull request on GitHub",
            handler=handle_pr_merge,
            prompt=pr_merge_prompt,
            parameters={
                "pr_number": {"type": "string", "description": "The PR number to merge"},
                "method": {"type": "string", "description": "Merge method (merge, squash, rebase)"}
            },
            required_params=["pr_number"],
            user_facing_name="PRMerge",
            command_aliases=["pr-merge", "merge-pr"],
            visibility="both"
        )
    ]
    
    return tools

# Register tools
for tool in register_git_tools():
    tool_registry.register_tool(tool)