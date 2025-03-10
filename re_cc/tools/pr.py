"""GitHub Pull Request tools for viewing and reviewing PRs."""

import json
import os
import subprocess
from typing import Dict, List, Any, Optional, Union

from re_cc.tools import Tool, tool_registry
from re_cc.utils.command import execute_command


def handle_pr_comments(pr_number: str) -> Dict[str, Any]:
    """Handler for PRComments tool.
    
    Args:
        pr_number: The PR number to fetch comments for
        
    Returns:
        Result of the operation
    """
    try:
        # Check if gh CLI is installed
        try:
            result = execute_command("gh --version")
            if not result.success:
                return {
                    "success": False,
                    "error": "GitHub CLI is not installed. Please install it to use PR tools."
                }
        except Exception:
            return {
                "success": False,
                "error": "GitHub CLI is not installed. Please install it to use PR tools."
            }
        
        # Fetch the PR data
        pr_view_result = execute_command(f"gh pr view {pr_number} --json number,title,body,author,comments,reviewRequests")
        
        if not pr_view_result.success:
            return {
                "success": False,
                "error": f"Failed to fetch PR #{pr_number}: {pr_view_result.stderr}"
            }
        
        try:
            pr_data = json.loads(pr_view_result.stdout)
        except json.JSONDecodeError:
            return {
                "success": False,
                "error": f"Failed to parse PR data: {pr_view_result.stdout}"
            }
        
        # Get PR comments
        comments = pr_data.get("comments", [])
        
        # Fetch PR diff to provide context for comments
        pr_diff_result = execute_command(f"gh pr diff {pr_number}")
        
        diff_content = ""
        if pr_diff_result.success:
            diff_content = pr_diff_result.stdout
        
        # Get PR reviews
        pr_reviews_result = execute_command(f"gh pr reviews {pr_number} --json author,body,state,url")
        reviews = []
        
        if pr_reviews_result.success:
            try:
                reviews = json.loads(pr_reviews_result.stdout)
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
        try:
            result = execute_command("gh --version")
            if not result.success:
                return {
                    "success": False,
                    "error": "GitHub CLI is not installed. Please install it to use PR tools."
                }
        except Exception:
            return {
                "success": False,
                "error": "GitHub CLI is not installed. Please install it to use PR tools."
            }
        
        # Fetch the PR data first
        pr_view_result = execute_command(f"gh pr view {pr_number} --json number,title,body,author,additions,deletions,changedFiles,files")
        
        if not pr_view_result.success:
            return {
                "success": False,
                "error": f"Failed to fetch PR #{pr_number}: {pr_view_result.stderr}"
            }
        
        try:
            pr_data = json.loads(pr_view_result.stdout)
        except json.JSONDecodeError:
            return {
                "success": False,
                "error": f"Failed to parse PR data: {pr_view_result.stdout}"
            }
        
        # Get PR diff for review
        pr_diff_result = execute_command(f"gh pr diff {pr_number}")
        
        diff_content = ""
        if pr_diff_result.success:
            diff_content = pr_diff_result.stdout
        
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


# Tool prompt content
pr_comments_prompt = """
Fetches and displays comments from a GitHub pull request.

This tool uses the GitHub CLI (gh) to fetch PR details, comments, and code context, formatting them with diff hunks and threading.

IMPORTANT: This tool requires the GitHub CLI to be installed and authenticated on your system.

Usage:
- Provide the PR number to fetch
- The tool will return all comments, reviews, and the PR diff for context
"""

pr_review_prompt = """
Reviews a pull request, providing detailed feedback.

This tool uses the GitHub CLI (gh) to fetch PR details and diffs, then analyzes code quality, style, correctness, performance, test coverage, and security, formatting feedback into sections.

IMPORTANT: This tool requires the GitHub CLI to be installed and authenticated on your system.

Usage:
- Provide the PR number to review
- The tool will return PR details and diffs for you to analyze and provide feedback
"""

# Create and register the PR tools
PRComments = Tool(
    name="PRComments",
    description="Fetches and displays comments from a GitHub pull request",
    handler=handle_pr_comments,
    prompt=pr_comments_prompt,
    parameters={
        "pr_number": {"description": "The PR number to fetch comments for", "type": "string"}
    },
    required_params=["pr_number"],
    user_facing_name="PRComments",
    visibility="user",
    command_aliases=["comments"],
    command_pattern=r"^/pr-comments\s+(\d+)$"
)

PRReview = Tool(
    name="PRReview",
    description="Reviews a pull request, providing detailed feedback",
    handler=handle_pr_review,
    prompt=pr_review_prompt,
    parameters={
        "pr_number": {"description": "The PR number to review", "type": "string"}
    },
    required_params=["pr_number"],
    user_facing_name="PRReview",
    visibility="user",
    command_aliases=["review-pr"],
    command_pattern=r"^/review\s+(\d+)$"
)

# Register the tools
for tool in [PRComments, PRReview]:
    tool_registry.register_tool(tool)