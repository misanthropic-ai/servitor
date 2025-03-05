# Re-CC: Python CLI for LLM-Powered Coding

![](https://img.shields.io/badge/Python-3.9%2B-blue?style=flat-square)

Re-CC is a Python reimplementation of the Claude Code CLI. It creates a terminal-based AI coding assistant that understands codebases, edits files, runs commands, and handles workflows through natural language interactions.

## Key Differences from Original Claude Code

- **Multi-LLM Support**: Works with multiple AI providers:
  - Anthropic Claude
  - OpenAI GPT models
  - Local Ollama models
  - Custom endpoints using OpenAI-compatible API
- **API Key Authentication**: Uses API keys instead of OAuth for simpler, more flexible authentication
- **Custom Endpoint Configuration**: Set custom API endpoints and model names per provider
- **Python-Based**: Built with Python 3.9+ using modern async patterns
- **Package Management**: Uses UV for dependency management
- **TUI Configuration**: Terminal user interface for managing API keys and provider settings
- **Enhanced Features**: Includes additional capabilities beyond the original Node.js version

## Python CLI Implementation Plan

This document outlines the tasks necessary to create a Python version of the Claude Code CLI.

### Task List

1. **Project Setup**
   - [x] Create project structure and directory layout
   - [x] Set up Python package configuration (pyproject.toml)
   - [ ] Configure packaging and distribution (PyPI)
   - [x] Create virtual environment management (uv)

2. **Core Architecture**
   - [x] Design command-line argument parsing system (using Typer)
   - [x] Implement error handling framework
   - [x] Create provider abstraction layer
   - [x] Build event-based architecture for command handling

3. **API Integration**
   - [x] Implement HTTP client for multiple LLM APIs (Anthropic, OpenAI, etc.)
   - [x] Create API key management and secure storage
   - [x] Build request/response processing pipeline
   - [x] Implement proper error handling for API responses

4. **Terminal UI**
   - [x] Design interactive terminal interface
   - [x] Implement Rich for text formatting
   - [x] Create Textual-based TUI for configuration
   - [x] Build responsive terminal rendering

5. **Feature Implementation**
   - [x] Create utility modules for file system operations
   - [x] Create utility modules for Git operations
   - [x] Implement file editing capabilities with diff visualization
   - [x] Create code search and navigation features
   - [x] Implement command execution features with streaming output
   - [x] Create codebase understanding with context-aware commands

6. **Testing & Documentation**
   - [ ] Write unit tests for core components
   - [ ] Create integration tests for API interaction
   - [x] Add docstrings to all modules and functions
   - [x] Create usage examples with command interface

7. **Security & Privacy**
   - [x] Implement secure API key storage with keyring
   - [x] Create configuration management with YAML
   - [x] Build privacy safeguards for API keys

8. **Release & Deployment**
   - [ ] Set up CI/CD pipeline
   - [x] Create installation instructions
   - [ ] Build platform-specific packages (pip, conda)
   - [ ] Implement auto-update mechanism

### Key Requirements

- Python 3.9+ compatibility
- Multi-LLM provider support
- API key-based authentication
- Cross-platform support (Windows, macOS, Linux)
- Minimal dependencies
- Clean, maintainable code architecture
- Comprehensive error handling
- Similar user experience to original Node.js version, with enhancements

## Installation & Usage

```bash
# Clone the repository
git clone https://github.com/yourusername/re-cc.git
cd re-cc

# Create and activate virtual environment using UV
uv venv
source .venv/bin/activate  # On Unix/MacOS
# or
.venv\Scripts\activate  # On Windows

# Install dependencies
uv pip install -e .

# Install development dependencies
uv pip install -e ".[dev]"

# Run the application and configure settings
python -m re_cc

# Configure providers using CLI options (optional)
python -m re_cc config --provider anthropic --api-key your_anthropic_key
python -m re_cc config --provider openai --api-key your_openai_key
python -m re_cc config --provider ollama --endpoint http://localhost:11434

# Set custom endpoints (optional)
python -m re_cc config --provider custom --endpoint https://your-custom-endpoint/v1 --api-key your_key --model your_model_name

# Use in your project
cd /path/to/your/project
python -m re_cc
```

### Configuration Interface

Re-CC includes a built-in TUI (Terminal User Interface) for managing providers and API keys:

- Navigate through provider settings
- Securely store and manage API keys
- Configure custom endpoints and model names
- Set default providers for different operations
- Test connections to ensure proper configuration

## Contributing

Contributions are welcome! Check the issues page for current tasks or feature requests.

## License

See LICENSE.md file for details.
