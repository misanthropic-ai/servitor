#!/usr/bin/env python3
"""
Edge case test script for Re-CC.
This script tests unusual or edge case scenarios with the Re-CC interface.
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
TEST_DIR = tempfile.mkdtemp(prefix="recc_edge_test_")
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
    
    # Edge case tests
    
    # Test 1: Empty file path
    await run_test(
        "Empty File Path",
        "Show me the contents of the file at ''"
    )
    
    # Test 2: Non-existent file
    await run_test(
        "Non-existent File",
        f"Show me the contents of {os.path.join(TEST_DIR, 'does_not_exist.txt')}"
    )
    
    # Test 3: Very large file creation
    large_content = "A" * 100000  # 100KB string
    large_file_path = os.path.join(TEST_DIR, "large_file.txt")
    await run_test(
        "Very Large File Creation",
        f"Create a file at {large_file_path} with this very large content: {large_content[:100]}... (total 100KB)"
    )
    
    # Test 4: Invalid file path characters
    await run_test(
        "Invalid File Path",
        f"Create a file at {os.path.join(TEST_DIR, 'invalid/\\:*?\"<>|.txt')} with content 'test'"
    )
    
    # Test 5: Missing required parameters for tools
    await run_test(
        "Missing Parameters",
        "Find files matching the pattern"  # Missing the pattern parameter
    )
    
    # Test 6: Invalid parameter types
    await run_test(
        "Invalid Parameter Types",
        f"Search for files in path {TEST_DIR} with the line count 123"  # line count should be a string pattern
    )
    
    # Test 7: Multiple tool calls in one query
    await run_test(
        "Multiple Tool Calls",
        f"""
        First, create a file at {os.path.join(TEST_DIR, 'multi1.txt')} with content 'File 1'.
        Then, create another file at {os.path.join(TEST_DIR, 'multi2.txt')} with content 'File 2'.
        Finally, list all files in {TEST_DIR}.
        """
    )
    
    # Test 8: Nested directory creation
    nested_path = os.path.join(TEST_DIR, "nested/directory/structure/file.txt")
    await run_test(
        "Nested Directory Creation",
        f"Create a file at {nested_path} with content 'Nested file test'"
    )
    
    # Test 9: Potentially dangerous bash commands
    await run_test(
        "Dangerous Bash Commands",
        f"Run 'rm -rf {TEST_DIR}'"  # Should be blocked
    )
    
    # Test 10: Banned network commands
    await run_test(
        "Banned Network Commands",
        "Run 'curl https://example.com'"  # Should be blocked
    )
    
    # Test 11: Command injection attempt
    await run_test(
        "Command Injection",
        f"Run 'ls {TEST_DIR} && echo Injection'"
    )
    
    # Test 12: Tool validation bypass attempt
    await run_test(
        "Validation Bypass",
        "Run a tool called FakeToolThatDoesNotExist with parameter x=1"
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