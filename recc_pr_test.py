#!/usr/bin/env python3
"""
GitHub PR tools test script for Re-CC.
This script tests the functionality of the PR review and comment tools.
"""

import os
import sys
import asyncio
import json
import tempfile
import shutil
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add the project root to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from re_cc.repl.interface import ReCC
import re_cc.tools.pr as pr_tools
from re_cc.utils.command import execute_command as cmd_execute

# Create a temporary directory for test files
TEST_DIR = tempfile.mkdtemp(prefix="recc_pr_test_")
print(f"Created test directory: {TEST_DIR}")

# Mock the execute_command function to simulate GitHub CLI
class MockCommandResult:
    def __init__(self, success, stdout, stderr="", return_code=0):
        self.success = success
        self.stdout = stdout
        self.stderr = stderr
        self.return_code = return_code
        self.duration = 0.1

def mock_execute_command(command, **kwargs):
    """Mock execute_command for GitHub CLI tests."""
    if "gh --version" in command:
        return MockCommandResult(True, "gh version 2.30.0 (2023-04-02)\nhttps://github.com/cli/cli/releases/tag/v2.30.0\n")
    
    elif "gh pr view" in command:
        pr_number = command.split()[-2]
        if "--json" in command:
            # Mock PR data for JSON format
            mock_pr_data = {
                "number": int(pr_number),
                "title": f"Example PR #{pr_number}",
                "body": "This is a test pull request for PR tool testing.",
                "author": {"login": "testuser"},
                "comments": [
                    {
                        "author": {"login": "reviewer1"},
                        "body": "This looks good, but could use some tests.",
                        "createdAt": "2023-04-01T12:00:00Z"
                    },
                    {
                        "author": {"login": "reviewer2"},
                        "body": "Please fix the typo in the README.",
                        "createdAt": "2023-04-01T13:00:00Z"
                    }
                ],
                "additions": 42,
                "deletions": 10,
                "changedFiles": 3,
                "files": [
                    {
                        "path": "src/main.py",
                        "additions": 30,
                        "deletions": 5
                    },
                    {
                        "path": "README.md",
                        "additions": 7,
                        "deletions": 3
                    },
                    {
                        "path": "tests/test_main.py",
                        "additions": 5,
                        "deletions": 2
                    }
                ]
            }
            return MockCommandResult(True, json.dumps(mock_pr_data))
        else:
            # Mock PR data for text format
            return MockCommandResult(True, f"Example PR #{pr_number}\n\nThis is a test pull request for PR tool testing.\n")
    
    elif "gh pr diff" in command:
        pr_number = command.split()[-1]
        # Mock PR diff
        return MockCommandResult(True, f"""diff --git a/README.md b/README.md
index 1234567..abcdefg 100644
--- a/README.md
+++ b/README.md
@@ -1,5 +1,9 @@
 # Example Project
 
-This is an example project.
+This is an example project for testing the PR review tools.
+
+## Features
+
+- Feature 1
+- Feature 2
 
diff --git a/src/main.py b/src/main.py
index 1234567..abcdefg 100644
--- a/src/main.py
+++ b/src/main.py
@@ -1,3 +1,15 @@
 def hello():
-    return "Hello World"
+    return "Hello, World!"
+
+def calculate_sum(a, b):
+    return a + b
+
+def multiply(a, b):
+    return a * b
+
+if __name__ == "__main__":
+    print(hello())
+    print(calculate_sum(5, 10))
+    print(multiply(5, 10))
 
""")
    
    elif "gh pr reviews" in command:
        pr_number = command.split()[-2]
        # Mock PR reviews
        mock_reviews = [
            {
                "author": {"login": "reviewer1"},
                "body": "Overall looks good. Please add more tests.",
                "state": "APPROVED",
                "url": f"https://github.com/example/repo/pull/{pr_number}#pullrequestreview-1"
            }
        ]
        return MockCommandResult(True, json.dumps(mock_reviews))
    
    # Default fallback
    return MockCommandResult(False, "", "Command not found", 1)

# Save the original execute_command
original_execute_command = pr_tools.execute_command

# Replace with our mock version
pr_tools.execute_command = mock_execute_command

# Test scenarios
async def run_tests():
    # Initialize ReCC
    recc = ReCC(debug=True)
    
    # Store test results
    results = []
    
    # Helper function to run a test and collect results
    async def run_test(test_name, query):
        print(f"\n=== Running Test: {test_name} ===")
        print(f"Query: {query}")
        try:
            response = await recc.query_async(query)
            success = True
            error = None
            print(f"Response text: {response.text}")
            
            # Print tool results for debugging
            if hasattr(response, 'tool_results') and response.tool_results:
                print(f"Tool results: {response.tool_results}")
            
        except Exception as e:
            success = False
            error = str(e)
            print(f"Error: {error}")
        
        results.append({
            "test_name": test_name,
            "query": query,
            "success": success,
            "error": error if not success else None
        })
        return success
    
    # Test 1: Get PR comments for PR #123
    await run_test(
        "Get PR Comments",
        "Show comments for pull request #123"
    )
    
    # Test 2: Get PR comments using slash command
    await run_test(
        "Get PR Comments via Slash Command",
        "/pr-comments 123"
    )
    
    # Test 3: Review PR #456
    await run_test(
        "Review PR",
        "Review pull request #456"
    )
    
    # Test 4: Review PR using slash command
    await run_test(
        "Review PR via Slash Command",
        "/review 456"
    )
    
    # Test 5: Review PR with specific questions
    await run_test(
        "Review PR with Questions",
        "Review PR #789 and focus on code quality and test coverage"
    )
    
    # Test 6: Ask about a specific change in a PR
    await run_test(
        "Ask About PR Change",
        "What changes were made to the main.py file in PR #456?"
    )
    
    # Print summary
    print("\n=== Test Summary ===")
    success_count = sum(1 for r in results if r["success"])
    print(f"Tests passed: {success_count}/{len(results)}")
    
    if success_count < len(results):
        print("\nFailed tests:")
        for r in results:
            if not r["success"]:
                print(f"  - {r['test_name']}: {r['error']}")
    
    # Save results to a JSON file
    results_file = os.path.join(TEST_DIR, "pr_test_results.json")
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"Results saved to {results_file}")
    
    # Restore the original execute_command
    pr_tools.execute_command = original_execute_command
    
    # Clean up
    print(f"\nCleaning up test directory: {TEST_DIR}")
    shutil.rmtree(TEST_DIR)
    print("Tests completed!")

if __name__ == "__main__":
    asyncio.run(run_tests())