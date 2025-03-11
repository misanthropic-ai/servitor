#!/usr/bin/env python3
"""
Task tool test script for Re-CC.
This script tests the functionality of the Task management tools.
"""

import os
import sys
import asyncio
import json
import tempfile
import shutil
import re
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add the project root to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from re_cc.repl.interface import ReCC
from re_cc.utils.task import task_manager

# Create a temporary directory for test files
TEST_DIR = tempfile.mkdtemp(prefix="recc_task_test_")
print(f"Created test directory: {TEST_DIR}")

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
            
            # Print raw response for debugging
            if hasattr(response, 'raw_response'):
                print(f"Raw response: {response.raw_response}")
            if hasattr(response, 'tool_calls'):
                print(f"Tool calls: {len(response.tool_calls) if response.tool_calls else 0}")
            
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
    
    # Create a task directly using the task manager
    test_task = task_manager.create_task("Test Project", "Implement and test task management features")
    print(f"\nCreated test task directly with ID: {test_task.id}")
    
    # Create a subtask directly using the task manager
    subtask = task_manager.create_task("Unit Tests", "Write unit tests for task management tools", parent_id=test_task.id)
    print(f"Created subtask directly with ID: {subtask.id}")
    
    # Test 1: Ask LLM to list tasks
    await run_test(
        "List Tasks",
        "List all tasks in the system"
    )
    
    # Test 2: Get Task Status
    await run_test(
        "Task Status",
        f"What is the status of task {test_task.id}?"
    )
    
    # Test 3: Complete Subtask
    await run_test(
        "Complete Subtask",
        f"Mark task {subtask.id} as completed"
    )
    
    # Test 4: Check Task Status After Completion
    await run_test(
        "Check Task Status After Completion",
        f"Check the status of task {test_task.id}"
    )
    
    # Test 5: Create new task with LLM
    await run_test(
        "Create New Task",
        "Create a task called 'Documentation' with description 'Write documentation for the task system'"
    )
    
    # Test 6: List all tasks again
    await run_test(
        "List All Tasks",
        "List all tasks again"
    )
    
    # Test 7: Cancel Task
    await run_test(
        "Cancel Task",
        f"Cancel task {test_task.id}"
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
    results_file = os.path.join(TEST_DIR, "test_results.json")
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"Results saved to {results_file}")
    
    # Clean up
    print(f"\nCleaning up test directory: {TEST_DIR}")
    shutil.rmtree(TEST_DIR)
    print("Tests completed!")

if __name__ == "__main__":
    asyncio.run(run_tests())