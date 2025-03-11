#!/bin/bash

# Activate virtual environment
source .venv/bin/activate

# Test help command
echo "=== Testing help command ==="
python -m re_cc repl --provider anthropic << EOF
/help
/exit
EOF

# Test creating a file in a test directory
echo -e "\n\n=== Testing file creation ==="
mkdir -p ~/Workspace/artivus/test-project
python -m re_cc repl --provider anthropic << EOF
Please create a CLAUDE.md file in /Users/shannon/Workspace/artivus/test-project/ with comprehensive guidelines for a Python resource monitoring tool. Include sections on code style, architecture, testing, and contribution guidelines.
/exit
EOF

# Check if the file was created
echo -e "\n\n=== Checking created file ==="
if [ -f ~/Workspace/artivus/test-project/CLAUDE.md ]; then
    echo "CLAUDE.md was successfully created"
    head -n 10 ~/Workspace/artivus/test-project/CLAUDE.md
else
    echo "ERROR: CLAUDE.md was not created"
fi