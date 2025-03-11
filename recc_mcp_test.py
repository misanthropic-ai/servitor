#!/usr/bin/env python3
"""
MCP (Master Control Program) tools test script for Re-CC.
This script tests the functionality of MCP integration tools.
"""

import os
import sys
import asyncio
import json
import tempfile
import shutil
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add the project root to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from re_cc.repl.interface import ReCC
import re_cc.utils.mcp as mcp_utils

# Create a temporary directory for test files
TEST_DIR = tempfile.mkdtemp(prefix="recc_mcp_test_")
print(f"Created test directory: {TEST_DIR}")

# Mock the subprocess.run method in mcp.py to simulate MCP operations
def mock_subprocess_run(args=None, **kwargs):
    """Mock subprocess.run for MCP tests."""
    # Mock results for specific MCP commands
    class MockResult:
        def __init__(self, returncode, stdout, stderr):
            self.returncode = returncode
            self.stdout = stdout
            self.stderr = stderr
    
    # Create a postgres MCP mock service JSON
    if args and args[0] == "claude" and "mcp" in args and "list" in args and "--json" in args:
        mock_services = [
            {
                "id": "postgres",
                "name": "PostgreSQL Database Server",
                "description": "PostgreSQL database access via MCP",
                "version": "1.0.0",
                "status": "active",
                "capabilities": ["query", "schema"]
            }
        ]
        return MockResult(0, json.dumps(mock_services), "")
    
    # Mock MCP add command
    elif args and args[0] == "claude" and "mcp" in args and "add" in args:
        service_url = args[-1]
        return MockResult(0, f"Added service: {service_url}", "")
    
    # Mock MCP remove command
    elif args and args[0] == "claude" and "mcp" in args and "remove" in args:
        service_id = args[-1]
        return MockResult(0, f"Removed service: {service_id}", "")
    
    # Mock MCP execute command
    elif args and args[0] == "claude" and "mcp" in args and "execute" in args:
        service_id = args[3]
        if service_id == "postgres":
            # Mock database query results
            if "schema" in args:
                mock_result = {
                    "tables": [
                        {"name": "users", "columns": ["id", "username", "email"]},
                        {"name": "orders", "columns": ["id", "user_id", "product", "quantity", "price"]}
                    ]
                }
                return MockResult(0, json.dumps(mock_result), "")
            else:
                mock_result = {"rows": [{"id": 1, "name": "Test Product"}]}
                return MockResult(0, json.dumps(mock_result), "")
        else:
            return MockResult(1, "", f"Service {service_id} not found")
    
    # Default fallback
    return MockResult(0, "", "")

# Save the original subprocess.run
original_subprocess_run = mcp_utils.subprocess.run

# Replace with our mock version
mcp_utils.subprocess.run = mock_subprocess_run

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
    
    # Test 1: List MCP services
    await run_test(
        "List MCP Services",
        "List all available MCP services"
    )
    
    # Test 2: Add MCP service
    await run_test(
        "Add MCP Service",
        "Add a new MCP service at npx -y @modelcontextprotocol/server-postgres postgresql://localhost/mydb"
    )
    
    # Test 3: Add MCP service with connection string
    await run_test(
        "Add MCP Service with Connection String",
        "Add a postgres-server MCP service with connection string postgresql://user:pass@localhost:5432/mydb"
    )
    
    # Test 4: Execute MCP service
    await run_test(
        "Execute MCP Service",
        "Execute the postgres MCP service to get schema information"
    )
    
    # Test 5: Execute MCP service with args
    await run_test(
        "Execute MCP Service with Args",
        "Use the postgres MCP service to query the database schema"
    )
    
    # Test 6: Remove MCP service
    await run_test(
        "Remove MCP Service",
        "Remove the postgres MCP service"
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
    results_file = os.path.join(TEST_DIR, "mcp_test_results.json")
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"Results saved to {results_file}")
    
    # Restore the original subprocess.run
    mcp_utils.subprocess.run = original_subprocess_run
    
    # Clean up
    print(f"\nCleaning up test directory: {TEST_DIR}")
    shutil.rmtree(TEST_DIR)
    print("Tests completed!")

if __name__ == "__main__":
    asyncio.run(run_tests())