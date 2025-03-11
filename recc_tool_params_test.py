#!/usr/bin/env python3
"""
Tool parameter test script for Re-CC.
This script tests correct parameter handling for various tools.
"""

import os
import sys
import asyncio
import json
import shutil
import tempfile
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add the project root to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from re_cc.repl.interface import ReCC

# Create a temporary directory for test files
TEST_DIR = tempfile.mkdtemp(prefix="recc_tool_test_")
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
    
    # Tests for specific tool parameters
    
    # GrepTool tests with various parameter combinations
    await run_test(
        "GrepTool - Pattern only",
        "Search for 'def validate_parameters' in the codebase"
    )
    
    await run_test(
        "GrepTool - Pattern and path",
        "Search for 'def validate_parameters' in the 're_cc/tools' directory"
    )
    
    await run_test(
        "GrepTool - Pattern, path, and include",
        "Search for 'def validate_parameters' in the 're_cc/tools' directory, only including '*.py' files"
    )
    
    # GlobTool tests
    await run_test(
        "GlobTool - Pattern only",
        "Find all '*.py' files"
    )
    
    await run_test(
        "GlobTool - Pattern and path",
        "Find all '*.py' files in the 're_cc/tools' directory"
    )
    
    # EditFile tests
    test_file = os.path.join(TEST_DIR, "edit_test.txt")
    
    # First create a file
    await run_test(
        "EditFile - Create file first",
        f"Create a file at {test_file} with content 'Line 1\\nLine 2\\nLine 3'"
    )
    
    # Then test different edit scenarios
    await run_test(
        "EditFile - Single line edit",
        f"In {test_file}, change 'Line 2' to 'Modified Line 2'"
    )
    
    await run_test(
        "EditFile - Multiple line edit",
        f"In {test_file}, change 'Line 1\\nModified Line 2' to 'New Line 1\\nNew Line 2'"
    )
    
    # Bash command tests
    await run_test(
        "Bash - Simple command",
        f"Run 'echo hello'"
    )
    
    await run_test(
        "Bash - Command with timeout",
        f"Run 'sleep 2 && echo done' with a timeout of 5000 milliseconds"
    )
    
    # ListFiles (LS) tests
    await run_test(
        "ListFiles - Basic",
        f"List files in {TEST_DIR}"
    )
    
    await run_test(
        "ListFiles - With ignore pattern",
        f"List files in {TEST_DIR} ignoring '*_test.txt'"
    )
    
    # DispatchAgent tests
    await run_test(
        "DispatchAgent - Single task",
        f"Use an agent to find all Python files in the re_cc directory containing the word 'Tool'"
    )
    
    # FindFunction test
    await run_test(
        "FindFunction - Basic",
        "Find the function 'validate_parameters'"
    )
    
    # FindClass test
    await run_test(
        "FindClass - Basic",
        "Find the class 'Tool'"
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
    
    # Clean up test directory
    print(f"\nCleaning up test directory: {TEST_DIR}")
    shutil.rmtree(TEST_DIR)

if __name__ == "__main__":
    asyncio.run(run_tests())