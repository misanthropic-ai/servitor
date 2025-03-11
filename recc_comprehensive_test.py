#!/usr/bin/env python3
"""
Comprehensive test script for Re-CC.
This script tests the functionality of Re-CC's REPL interface by running various scenarios
that exercise different tools and capabilities.
"""

import os
import sys
import asyncio
import shutil
import tempfile
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add the project root to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from re_cc.repl.interface import ReCC
from re_cc.utils.conversation import ConversationBuffer

# Create a temporary directory for test files
TEST_DIR = tempfile.mkdtemp(prefix="recc_test_")
print(f"Created test directory: {TEST_DIR}")

# Test scenarios
async def run_tests():
    # Initialize ReCC with debug logging
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
            print(f"Response: {response}")
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
    
    # Test 1: Basic file operations
    test_file_path = os.path.join(TEST_DIR, "test_file.txt")
    await run_test(
        "Create File",
        f"Create a file at {test_file_path} with the content 'Hello, World!'"
    )
    
    await run_test(
        "View File",
        f"Show me the contents of {test_file_path}"
    )
    
    await run_test(
        "Edit File",
        f"Change the content of {test_file_path} to say 'Hello, Re-CC!'"
    )
    
    await run_test(
        "View Edited File",
        f"Show me the contents of {test_file_path} again"
    )
    
    # Test 2: Search operations
    await run_test(
        "GlobTool Search",
        f"Find all Python files in the re_cc directory"
    )
    
    await run_test(
        "GrepTool Search",
        f"Search for 'def run_agent' in the codebase"
    )
    
    # Test 3: Bash commands
    await run_test(
        "Execute Bash Command",
        f"Run 'ls -la {TEST_DIR}'"
    )
    
    # Test 4: Multi-step operations
    python_file_path = os.path.join(TEST_DIR, "hello.py")
    await run_test(
        "Create Python File",
        f"Create a Python script at {python_file_path} that prints 'Hello, World!'"
    )
    
    await run_test(
        "Run Python Script",
        f"Run the Python script at {python_file_path}"
    )
    
    # Test 5: Complex task
    complex_task = f"""
    I want to build a simple calculator in Python.
    1. Create a file called {os.path.join(TEST_DIR, 'calculator.py')}
    2. Implement add, subtract, multiply, and divide functions
    3. Include input validation to prevent division by zero
    4. Include a main function that lets users input two numbers and an operation
    5. Run the script to test that it works
    """
    await run_test(
        "Complex Task - Calculator",
        complex_task
    )
    
    # Test 6: Agent delegation
    await run_test(
        "Agent Delegation",
        f"Find all functions in the re_cc directory that handle tool validation"
    )
    
    # Test 7: Multi-file project
    multi_file_project = f"""
    Create a simple Flask web application in the {TEST_DIR} directory with:
    1. An app.py file that sets up a Flask app with two routes:
       - A route for the homepage that displays a welcome message
       - A route for /api/status that returns JSON with app status
    2. A templates directory with an index.html template
    3. A static directory with a simple style.css file
    """
    await run_test(
        "Multi-File Project",
        multi_file_project
    )
    
    # Test 8: Task management tools
    await run_test(
        "Task Creation",
        "Create a task called 'Test Project' with description 'Implement and test task management features'"
    )
    
    await run_test(
        "List Tasks",
        "List all tasks"
    )
    
    await run_test(
        "Task Status",
        "Check the status of the Test Project task"
    )
    
    await run_test(
        "Create Subtask",
        "Create a subtask under the Test Project task called 'Unit Tests' with description 'Write unit tests for task management tools'"
    )
    
    await run_test(
        "Complete Task",
        "Mark the Unit Tests task as completed"
    )
    
    await run_test(
        "Check Task Status After Completion",
        "Check the status of all tasks"
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
    
    # Clean up test directory
    print(f"\nCleaning up test directory: {TEST_DIR}")
    shutil.rmtree(TEST_DIR)

if __name__ == "__main__":
    asyncio.run(run_tests())