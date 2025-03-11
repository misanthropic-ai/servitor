#!/bin/bash
# Comprehensive test script for Re-CC CLI interface

# Create a test directory
TEST_DIR=$(mktemp -d -t recc_cli_test_XXXXXX)
echo "Created test directory: $TEST_DIR"

# Helper function to run a test
run_test() {
  local test_name="$1"
  local command="$2"
  
  echo ""
  echo "=== Running Test: $test_name ==="
  echo "Command: $command"
  
  # Run the command
  eval "$command"
  local exit_code=$?
  
  if [ $exit_code -eq 0 ]; then
    echo "Test passed!"
    return 0
  else
    echo "Test failed with exit code: $exit_code"
    return 1
  fi
}

# Test 1: Help command
run_test "Help Command" "python -m re_cc --help"

# Test 2: Version command
run_test "Version Command" "python -m re_cc --version"

# Test 3: REPL mode
run_test "REPL Mode" "echo 'exit' | python -m re_cc repl --print"

# Test 4: REPL with query
run_test "REPL with Query" "echo 'What tools do you have available?' | python -m re_cc repl --print"

# Test 5: File Creation via CLI
TEST_FILE="$TEST_DIR/test_file.txt"
run_test "File Creation" "echo \"Create a file at $TEST_FILE with content 'Hello from CLI test!'\" | python -m re_cc repl --print"

# Test 6: Check file was created
if [ -f "$TEST_FILE" ]; then
  echo "File creation verification passed!"
else
  echo "File creation verification failed - file was not created!"
fi

# Test 7: File Content Verification
if [ -f "$TEST_FILE" ]; then
  echo "File contents:"
  cat "$TEST_FILE"
fi

# Test 8: Search test
run_test "Search Test" "echo 'Find all Python files in the re_cc/tools directory' | python -m re_cc repl --print"

# Test 9: Bash command
run_test "Bash Command" "echo \"Run 'ls -la $TEST_DIR'\" | python -m re_cc repl --print"

# Test 10: Simple Python script creation
TEST_PYTHON_FILE="$TEST_DIR/hello.py"
run_test "Python Script Creation" "echo \"Create a Python script at $TEST_PYTHON_FILE that prints 'Hello, World!'\" | python -m re_cc repl --print"

# Test 11: Run the script
if [ -f "$TEST_PYTHON_FILE" ]; then
  echo "Python script contents:"
  cat "$TEST_PYTHON_FILE"
  echo "Running Python script:"
  python "$TEST_PYTHON_FILE"
fi

# Clean up
echo "Cleaning up test directory: $TEST_DIR"
rm -rf "$TEST_DIR"

echo "All tests completed!"