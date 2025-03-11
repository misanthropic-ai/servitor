#!/usr/bin/env python3
"""
Jupyter Notebook tools test script for Re-CC.
This script tests the functionality of notebook tools for reading and editing .ipynb files.
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
TEST_DIR = tempfile.mkdtemp(prefix="recc_notebook_test_")
print(f"Created test directory: {TEST_DIR}")

# Create a test notebook
TEST_NOTEBOOK = os.path.join(TEST_DIR, "test_notebook.ipynb")

# Sample notebook content
NOTEBOOK_CONTENT = {
    "cells": [
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "# Test Notebook\n",
                "\n",
                "This is a test notebook for Re-CC."
            ]
        },
        {
            "cell_type": "code",
            "execution_count": 1,
            "metadata": {},
            "outputs": [
                {
                    "name": "stdout",
                    "output_type": "stream",
                    "text": [
                        "Hello, world!\n"
                    ]
                }
            ],
            "source": [
                "print('Hello, world!')"
            ]
        },
        {
            "cell_type": "code",
            "execution_count": 2,
            "metadata": {},
            "outputs": [
                {
                    "data": {
                        "text/plain": [
                            "10"
                        ]
                    },
                    "execution_count": 2,
                    "metadata": {},
                    "output_type": "execute_result"
                }
            ],
            "source": [
                "5 + 5"
            ]
        }
    ],
    "metadata": {
        "kernelspec": {
            "display_name": "Python 3",
            "language": "python",
            "name": "python3"
        },
        "language_info": {
            "codemirror_mode": {
                "name": "ipython",
                "version": 3
            },
            "file_extension": ".py",
            "mimetype": "text/x-python",
            "name": "python",
            "nbconvert_exporter": "python",
            "pygments_lexer": "ipython3",
            "version": "3.8.5"
        }
    },
    "nbformat": 4,
    "nbformat_minor": 4
}

# Write the test notebook
with open(TEST_NOTEBOOK, 'w') as f:
    json.dump(NOTEBOOK_CONTENT, f, indent=2)

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
    
    # Test 1: Read the notebook
    await run_test(
        "Read Notebook",
        f"Read the notebook at {TEST_NOTEBOOK}"
    )
    
    # Test 2: Edit a markdown cell
    await run_test(
        "Edit Markdown Cell",
        f"Edit the markdown cell at index 0 in {TEST_NOTEBOOK} to say '# Modified Notebook Title\\n\\nThis notebook has been modified by Re-CC.'"
    )
    
    # Test 3: Read the notebook after editing
    await run_test(
        "Read Modified Notebook",
        f"Show me the contents of {TEST_NOTEBOOK} after the edit"
    )
    
    # Test 4: Edit a code cell
    await run_test(
        "Edit Code Cell",
        f"Change the second code cell (index 2) in {TEST_NOTEBOOK} to calculate 10 * 20"
    )
    
    # Test 5: Insert a new cell
    await run_test(
        "Insert New Cell",
        f"Insert a new markdown cell at index 1 in {TEST_NOTEBOOK} with the content '## Data Analysis'"
    )
    
    # Test 6: Delete a cell
    await run_test(
        "Delete Cell",
        f"Delete the last cell in {TEST_NOTEBOOK}"
    )
    
    # Test 7: Read notebook after all edits
    await run_test(
        "Final Notebook Read",
        f"Show me the final state of {TEST_NOTEBOOK}"
    )
    
    # Test 8: Change cell type
    await run_test(
        "Change Cell Type",
        f"Convert the markdown cell at index 1 in {TEST_NOTEBOOK} to a code cell with the content 'import numpy as np\\nimport matplotlib.pyplot as plt'"
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
    
    # Validate notebook integrity after tests
    try:
        with open(TEST_NOTEBOOK, 'r') as f:
            final_notebook = json.load(f)
        print("\nFinal notebook validation:")
        print(f"- Cell count: {len(final_notebook['cells'])}")
        for i, cell in enumerate(final_notebook['cells']):
            print(f"- Cell {i}: type={cell['cell_type']}, source length={len(''.join(cell['source']))}")
    except Exception as e:
        print(f"Error validating notebook: {str(e)}")
    
    # Save results to a JSON file
    results_file = os.path.join(TEST_DIR, "notebook_test_results.json")
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"Results saved to {results_file}")
    
    # Clean up
    print(f"\nCleaning up test directory: {TEST_DIR}")
    shutil.rmtree(TEST_DIR)
    print("Tests completed!")

if __name__ == "__main__":
    asyncio.run(run_tests())