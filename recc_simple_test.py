#!/usr/bin/env python3
"""
Simple test script for Re-CC.
This script tests the most basic functionality of the Re-CC interface.
"""

import os
import sys
import asyncio
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
TEST_DIR = tempfile.mkdtemp(prefix="recc_simple_test_")
print(f"Created test directory: {TEST_DIR}")

# Test scenarios
async def run_tests():
    # Initialize ReCC
    recc = ReCC(debug=True)
    
    # Simple test to check configuration and provider
    print("Running simple help test...")
    try:
        response = await recc.query_async("What tools do you have available?")
        print(f"Response received: {response.text[:100]}...")
        print("Basic test successful!")
    except Exception as e:
        print(f"Error in basic test: {str(e)}")
    
    # File operation test
    test_file_path = os.path.join(TEST_DIR, "test_file.txt")
    print(f"\nTesting file creation at {test_file_path}...")
    try:
        response = await recc.query_async(f"Create a file at {test_file_path} with content 'Hello, Re-CC!'")
        print(f"Response received: {response.text[:100]}...")
        
        if os.path.exists(test_file_path):
            with open(test_file_path, 'r') as f:
                content = f.read()
                print(f"File created successfully with content: {content}")
        else:
            print("File creation failed - file does not exist")
    except Exception as e:
        print(f"Error in file creation test: {str(e)}")
    
    # Clean up
    print(f"\nCleaning up test directory: {TEST_DIR}")
    shutil.rmtree(TEST_DIR)
    print("Test completed!")

if __name__ == "__main__":
    asyncio.run(run_tests())