#!/usr/bin/env python3
"""
Planning tools test script for Re-CC.
This script tests the functionality of the Thinking and Architect tools.
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

# Create a temporary directory for test files
TEST_DIR = tempfile.mkdtemp(prefix="recc_planning_test_")
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
            print(f"Response text length: {len(response.text)}")
            print(f"Response excerpt: {response.text[:100]}...")
            
            # Print tool results for debugging
            if hasattr(response, 'tool_results') and response.tool_results:
                print(f"Tool call count: {len(response.tool_results)}")
                for i, tool_result in enumerate(response.tool_results):
                    print(f"Tool {i+1}: {tool_result['name']}")
            
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
    
    # Test 1: Simple Thinking tool test
    await run_test(
        "Simple Thinking",
        "Think about how to approach debugging a memory leak in a Python application"
    )
    
    # Test 2: Complex Thinking tool test with multiple steps
    await run_test(
        "Complex Thinking",
        "Think step by step about how to optimize a database query that's running slow. Consider indexes, query structure, and caching options."
    )
    
    # Test 3: Basic Architect tool test
    await run_test(
        "Basic Architecture",
        "Design a high-level architecture for a URL shortening service"
    )
    
    # Test 4: Complex Architect tool test with detailed requirements
    await run_test(
        "Complex Architecture",
        """Design an architecture for a real-time chat application with the following requirements:
        - Must support 100,000+ concurrent users
        - Messages should be delivered in under 500ms
        - Users should be able to create public and private chat rooms
        - Message history should be persistent
        - Should support text, images, and files up to 100MB
        - Must have end-to-end encryption for private chats
        """
    )
    
    # Test 5: Test thinking about code implementation
    await run_test(
        "Thinking About Code",
        f"Think about how to implement a function that recursively traverses a directory and finds all files matching a certain pattern."
    )
    
    # Test 6: Architect with context
    await run_test(
        "Architect With Context",
        """Design a REST API for the Re-CC application with the following context:
        
        The API should allow external applications to:
        1. Submit queries to LLM providers
        2. Manage conversations and sessions
        3. Access tool functionality
        4. Configure provider settings
        """
    )
    
    # Test 7: Combined tools approach
    await run_test(
        "Combined Approach",
        f"""I need to refactor a large Python codebase. Help me plan this process:
        1. First, think about the key principles for successful refactoring
        2. Then, design an architecture for a test harness to ensure the refactoring doesn't break existing functionality
        3. Finally, outline a step-by-step approach to incrementally refactor without disrupting development
        """
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
    results_file = os.path.join(TEST_DIR, "planning_test_results.json")
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"Results saved to {results_file}")
    
    # Clean up
    print(f"\nCleaning up test directory: {TEST_DIR}")
    shutil.rmtree(TEST_DIR)
    print("Tests completed!")

if __name__ == "__main__":
    asyncio.run(run_tests())