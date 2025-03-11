#!/bin/bash
# Script to run all Re-CC tests

echo "========================================"
echo "Running comprehensive Python interface tests..."
echo "========================================"
python recc_comprehensive_test.py

echo "========================================"
echo "Running edge case tests..."
echo "========================================"
python recc_edge_test.py

echo "========================================"
echo "Running tool parameter tests..."
echo "========================================"
python recc_tool_params_test.py

echo "========================================"
echo "Running task management tests..."
echo "========================================"
python recc_task_test.py

echo "========================================"
echo "Running MCP service tests..."
echo "========================================"
python recc_mcp_test.py

echo "========================================"
echo "Running notebook tool tests..."
echo "========================================"
python recc_notebook_test.py

echo "========================================"
echo "Running PR tool tests..."
echo "========================================"
python recc_pr_test.py

echo "========================================"
echo "Running planning tool tests..."
echo "========================================"
python recc_planning_test.py

echo "========================================"
echo "Running CLI interface tests..."
echo "========================================"
chmod +x recc_cli_test.sh
./recc_cli_test.sh

echo "========================================"
echo "All tests completed!"
echo "========================================"