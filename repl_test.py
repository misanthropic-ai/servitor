#!/usr/bin/env python
"""
Test script for Re-CC REPL and API functionality.

This script demonstrates how to use the ReCC and ReCCAPI classes programmatically.
"""

import asyncio
import os
import sys
import logging
from dotenv import load_dotenv

# Enable debug logging
logging.basicConfig(level=logging.DEBUG, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# Load environment variables from .env file
load_dotenv()

# Check if we have an API key
if os.environ.get("ANTHROPIC_API_KEY"):
    print("Using Anthropic API key from environment")
else:
    print("ERROR: No Anthropic API key found in environment variables")
    print("Create a .env file with ANTHROPIC_API_KEY=your_key to run this test")
    sys.exit(1)

from re_cc.repl.interface import ReCC
from re_cc.api.repl import ReCCAPI


async def test_repl():
    """Test the ReCC class with various commands."""
    print("=== Testing ReCC Core Class ===")
    
    # Initialize the ReCC object with the Anthropic provider
    recc = ReCC(provider_name="anthropic")
    
    # Debug tool registry
    print("\nDEBUG: Checking tool registry")
    print(f"Total registered tools: {len(recc.tool_registry.tools)}")
    print("Registered tool names:")
    for tool_name in recc.tool_registry.tools.keys():
        print(f"  - {tool_name}")
    
    # Check specifically for file operation tools
    file_tools = [name for name in recc.tool_registry.tools.keys() 
                  if "file" in name.lower() or "view" in name.lower() or "edit" in name.lower()]
    print("\nFile operation tools:")
    for tool in file_tools:
        print(f"  - {tool}")
    
    # Check tools being passed to provider
    print("\nDEBUG: Checking tools passed to provider")
    # Add check to see what tools are available to the provider
    
    # Test a simple query
    print("\n1. Basic Query Test:")
    response = await recc.query_async("What is Python?")
    print(f"Response: {response.text[:150]}...")
    
    # Print raw response to see if it includes tool calls
    print("\nDEBUG: Response raw data:")
    print(f"Tool calls in response: {response.tool_calls}")
    print(f"Raw response metadata: {response.raw_response}")
    
    # Test directory creation and file operations
    print("\n2. Testing File Operations:")
    test_dir = os.path.expanduser("~/Workspace/artivus/test-project")
    
    # Ensure the test directory exists
    if not os.path.exists(test_dir):
        os.makedirs(test_dir)
    
    # Create a CLAUDE.md file in the test project
    prompt = f"""Create a CLAUDE.md file in {test_dir} with comprehensive guidelines for a Python resource monitoring tool.
    Include sections on:
    1. Code style and conventions
    2. System architecture
    3. Testing practices
    4. Contribution guidelines
    Keep it concise but informative."""
    
    response = await recc.query_async(prompt)
    print(f"File creation response: {response.text[:150]}...")
    
    # Check if file was created
    claude_md_path = os.path.join(test_dir, "CLAUDE.md")
    if os.path.exists(claude_md_path):
        print(f"Success! CLAUDE.md was created at: {claude_md_path}")
        with open(claude_md_path, "r") as f:
            content = f.read()
            print(f"First 200 characters of CLAUDE.md:\n{content[:200]}...")
    else:
        print(f"Error: CLAUDE.md was not created at {claude_md_path}")
    
    # Test command execution
    print("\n3. Testing Command Execution:")
    help_response = recc.execute_command("/help")
    print(f"Help command response: {help_response.text[:150]}...")
    
    # Save the conversation
    conversation_id = recc.save_conversation()
    print(f"\nConversation saved with ID: {conversation_id}")


async def test_api():
    """Test the ReCCAPI class."""
    print("\n=== Testing ReCCAPI Class ===")
    
    # Initialize the API
    api = ReCCAPI(provider_name="anthropic")
    
    # Test a simple query
    print("\n1. API Basic Query Test:")
    response = await api.query_async("What are the main features of Re-CC?")
    print(f"Response: {response.text[:150]}...")
    
    # Test command execution
    print("\n2. API Command Execution Test:")
    version_response = api.execute_command("/version")
    print(f"Version command response: {version_response.text}")


async def main():
    """Run all tests."""
    await test_repl()
    await test_api()


if __name__ == "__main__":
    asyncio.run(main())