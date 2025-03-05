# Re-CC Project Guidelines

## Project Overview
Re-CC is a Python reimplementation of the Claude Code CLI. This project creates a terminal-based AI coding assistant that can understand codebases, edit files, run commands, and handle workflows through natural language interactions. Unlike the original Node.js version, Re-CC supports multiple LLM providers through API keys rather than OAuth authentication.

## Current Implementation Status
- Core provider architecture with support for Anthropic, OpenAI, and Ollama
- Secure API key management using system keyring
- Configuration management with YAML 
- Terminal UI with Rich and Textual libraries
- Interactive CLI with special command support
- File editing capabilities with diff visualization
- Code search and navigation with language-specific patterns
- Command execution with streaming output
- Context-aware interactions with Git repositories

## Development Setup
- **Package Manager**: UV (`uv`)
- **Python Version**: 3.9+
- **Setup Commands**: 
  - `uv venv` - Create virtual environment
  - `source .venv/bin/activate` (Unix) or `.venv\Scripts\activate` (Windows)
  - `uv pip install -e .` - Install package in development mode
  - `python -m re_cc` - Run the application
  - `python -m re_cc config` - Launch configuration UI

## Code Style & Conventions
- **Language**: Python 3.9+
- **Style Guide**: PEP 8 with Black formatting
- **Naming**: snake_case for variables/functions, PascalCase for classes
- **Error Handling**: Use try/except blocks with specific error types
- **Format**: Use consistent indentation (4 spaces) and follow Black formatting 
- **Imports**: Group standard library, third-party, and local imports
- **Documentation**: Google-style docstrings for functions and classes
- **Types**: Use type hints throughout (PEP 484)
- **Testing**: Write pytest tests for all new features
- **CLI Framework**: Typer for command-line interface, Textual for TUI

## Project Structure
- CLI entry point: `re_cc/__main__.py`
- Core modules: 
  - `api/` - LLM API client
  - `cli/` - Command-line interface components
  - `utils/` - Helper utilities and tools
  - `terminal/` - Terminal UI rendering
  - `config/` - Configuration management
  - `providers/` - Provider-specific implementations
  - `security/` - API key storage and management

## LLM Providers
- **Anthropic**: Claude models via Anthropic Python client
- **OpenAI**: GPT models via OpenAI Python client
- **Ollama**: Local models via Ollama client
- **Custom**: Support for OpenAI-compatible API endpoints

## Configuration Management
- YAML-based configuration files for readability and comments
- `keyring` for secure storage of API keys
- `platformdirs` for cross-platform configuration locations
- Provider-agnostic abstraction for LLM interactions
- Custom endpoints and model names support
- TUI for API key management and provider settings

## Key Features
- Multi-LLM provider support through API keys (Anthropic, OpenAI, Ollama)
- Terminal UI for configuration management
- File system and Git utility modules
- Interactive terminal interface with Rich formatting
- Provider factory pattern for flexible LLM integration
- Command system with slash commands (/help, /edit, /view, etc.)
- File editing with diff visualization and confirmation
- Code search with language-specific patterns (functions, classes)
- Command execution with real-time streaming output
- Git repository awareness and context gathering

## Next Steps
- Implement unit and integration tests
- Set up CI/CD pipeline
- Create packaging and distribution for PyPI
- Build platform-specific packages (pip, conda)
- Implement auto-update mechanisms
- Add more language-specific features
- Enhance error handling and recovery mechanisms

Remember to respect user data privacy and follow security best practices when handling API keys.