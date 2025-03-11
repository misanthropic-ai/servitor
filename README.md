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
- **REPL & API Interfaces**: Programmatic access for embedding in other applications
- **FastAPI Server**: REST API for remote access and integration with other tools

## Feature Set

Implements all features from the original Claude Code CLI, including:

- **File Operations**: Editing, viewing, creating files with word-level diffs
- **Code Search**: Pattern, function, and class finding with language awareness
- **Command Execution**: Run commands with streaming output
- **Git Integration**: Repository awareness and context gathering
- **Slash Commands**: Full command system with fuzzy matching
  - File operations: `/edit`, `/view`, `/create`, `/find`
  - Shell access: `/run`, `/shell`
  - Provider management: `/provider`, `/providers`
  - System features: `/help`, `/version`, `/bug`, `/tools`, `/compact`
  - Task management: `/task create`, `/task list`, etc.
  - MCP services: `/mcp list`, `/mcp add`, etc.
- **Tool Management**: Enable/disable features as needed
- **Conversation Management**: Compact and continue conversations

### Hybrid Planning System

Our enhanced planning approach combines LLM capabilities with structured application logic:

- **Conversation Memory**: Persistent history with context management
- **Environment Context**: Automatic code and repository analysis
- **Task Tracking**: Lightweight state management for complex tasks
- **Plan Validation**: Verifies LLM plans against available tools
- **Adaptive Prompting**: Dynamically adjusts prompts based on tasks

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
   - [x] Fix main CLI entry point with default behavior

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

6. **Conversation & Planning System**
   - [x] Implement conversation history buffer with persistence
   - [ ] Create environment context gathering for improved planning
   - [x] Build hybrid LLM planning system with light structure
   - [x] Add task tracking with state management
   - [x] Implement the `/compact` command with summarization
   - [x] Create session management for continued conversations

7. **Testing & Documentation**
   - [ ] Write unit tests for core components
   - [ ] Create integration tests for API interaction
   - [x] Add docstrings to all modules and functions
   - [x] Create usage examples with command interface

8. **Security & Privacy**
   - [x] Implement secure API key storage with keyring
   - [x] Create configuration management with YAML
   - [x] Build privacy safeguards for API keys

9. **Release & Deployment**
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
- Similar user experience to original Claude CLI, with enhancements

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

# Copy and configure environment variables (optional)
cp .env.example .env
# Edit .env with your API keys and settings

# Run the application and configure settings
python -m re_cc

# Configure providers using CLI options (optional)
python -m re_cc config --provider anthropic --api-key your_anthropic_key
python -m re_cc config --provider openai --api-key your_openai_key
python -m re_cc config --provider ollama --endpoint http://localhost:11434

# Set custom endpoints (optional)
python -m re_cc config --provider custom --endpoint https://your-custom-endpoint.com/v1 --api-key your_key --model your_model_name

# Use in your project
cd /path/to/your/project
python -m re_cc
```

### Environment Variable Configuration

Re-CC supports configuration via environment variables. You can set these in a `.env` file or directly in your environment:

| Environment Variable | Description | Example |
|---------------------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | `sk-proj-xxxxxxxxxxxx` |
| `OPENAI_API_BASE` | Custom OpenAI API endpoint | `https://api.example.com/v1` |
| `ANTHROPIC_API_KEY` | Anthropic API key | `sk-ant-api03-xxxxxxxxxxxx` |
| `OLLAMA_API_BASE` | Custom Ollama endpoint | `http://localhost:11434` |
| `CUSTOM_API_BASE` | Custom provider API endpoint | `https://your-api.example.com/v1` |
| `CUSTOM_API_KEY` | Custom provider API key | `your-api-key` |
| `DEBUG` | Enable debug logging | `true` |

The environment variables take precedence over the settings in the config file, allowing you to override configuration per environment without modifying the config file.

### REPL and API Integration

Re-CC provides several ways to integrate with other applications:

#### Python API

Import and use Re-CC directly in your Python applications:

```python
import asyncio
from re_cc import ReCCAPI

async def example():
    # Simple one-off query
    response = await ReCCAPI.query("What is Python?")
    print(response)
    
    # Or create a stateful session
    session = ReCCAPI.create_session()
    try:
        # Multiple queries in the same conversation
        await session.query("What is Python?")
        await session.query("What are its main features?")
    finally:
        session.close()

asyncio.run(example())
```

#### REPL Mode

Start an interactive REPL for simpler command-line usage:

```bash
# Start REPL with default provider
python -m re_cc repl

# Or specify provider and working directory
python -m re_cc repl --provider openai --directory /path/to/project
```

#### HTTP API Server

Launch a FastAPI server to provide HTTP access to Re-CC capabilities:

```bash
# Start the API server
python -m re_cc server --port 8080

# Then make requests to it
curl -X POST http://localhost:8080/api/query \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What is Python?"}'
```

The HTTP API provides endpoints for:
- Single queries: `/api/query`
- Streaming responses: `/api/query/stream`
- Session management: `/api/sessions`
- And other operations like conversation compacting and clearing

### Configuration Interface

Re-CC includes a built-in TUI (Terminal User Interface) for managing providers and API keys:

- Navigate through provider settings
- Securely store and manage API keys
- Configure custom endpoints and model names
- Set default providers for different operations
- Test connections to ensure proper configuration

## Contributing

Contributions are welcome! Check the issues page for current tasks or feature requests.

## Recent Changes

### 2024-11-04
- Improved error handling and tool execution
  - Enhanced parameter validation in Tool registry
  - Added tool results to ReCCResponse for better debugging
  - Fixed GrepTool parameter handling for improved compatibility
  - Made Bash tool properly async to avoid coroutine warnings
  - Improved error reporting in ToolRegistry with detailed messages
  - Added automatic type conversion for tool parameters when possible
  - Implemented tool result tracking in REPL interface
  - Added fuzzy tool name matching for better user experience
  - Enhanced the Task tool system with proper error handling

### 2024-11-03
- Fixed the CLI entry point for better user experience
  - Improved main application flow to default to the CLI when no command is specified
  - Implemented Typer callback with invoke_without_command to handle top-level options
  - Updated command-line argument handling for version and config flags
  - Ensured consistent user experience regardless of how the application is invoked
- Added environment variable support
  - Integrated python-dotenv for loading configuration from .env files
  - Added support for API keys and endpoints from environment variables
  - Implemented debug logging with DEBUG environment variable
  - Created comprehensive documentation for environment variable usage
- Implemented REPL and API interfaces
  - Created core ReCC class for stateful interaction with LLM providers
  - Added ReplCLI class for interactive terminal experience
  - Implemented ReCCAPI for programmatic integration
  - Created FastAPI-based HTTP server with RESTful endpoints
  - Added session management for stateful conversations
  - Implemented streaming responses for real-time output
  - Added rich-formatted markdown rendering in REPL output
  - Created persistent conversation storage across sessions
  - Fixed provider registration and initialization issues
  - Added compatibility with different Anthropic client versions
  - Improved streaming response handling with fallback options
  - Fixed configuration loading with optional paths

### 2024-10-07
- Finalized the command system integration
  - Enhanced Tool class with visibility, command_aliases, and command_pattern
  - Updated ToolRegistry to support command matching and filtering
  - Implemented `!` prefix for direct terminal commands
  - Added comprehensive user-facing commands like `/config`, `/doctor`, etc.
  - Created dynamic help display from tool registry
  - Added PR review and comment commands with GitHub CLI integration

### 2024-10-06
- Completed the agent implementation to properly use the tool registry
  - Added multi-round tool call processing with maximum iteration limit
  - Implemented tool call format compatibility for different providers
  - Added proper task state management with progress tracking
  - Improved error handling and recovery for tool calls
- Improved CLI app integration with the agent system
  - Refactored process_query to leverage the enhanced agent for tool processing
  - Added better conversation history management during tool execution
  - Created more robust error handling in tool execution flow
- Added all missing tool implementations from original Claude CLI
  - Implemented notebook tools (ReadNotebook, NotebookEditCell)
  - Added PR tools (PRComments, PRReview) with GitHub CLI integration
  - Created planning tools (Thinking, Architect) for reasoning and design
  - Implemented BashPolicySpec for command safety verification
- Enhanced the tool registry system
  - Updated init module to automatically load all tool modules
  - Improved tool registration with validation
  - Added support for different tool formats from various providers
- Enhanced provider interfaces and model management
  - Implemented OpenAI provider with robust tool calling support
  - Added Ollama provider with local model tool capabilities
  - Created comprehensive model configuration system
  - Added YAML-based model configuration with tool support information
  - Implemented model management API for adding/updating/removing models
- Refactored and reorganized codebase for better maintainability
  - Merged redundant bash command tools into unified module
  - Consolidated provider-specific model configurations
  - Improved error handling patterns across the codebase
  - Added complete type annotations for better IDE support

### 2024-10-03
- Implemented structured prompt library with comprehensive prompts from prompts.js
- Created properly typed Tool registry with validation
- Improved Agent implementation to work with tools registry
- Added conversation history buffer with persistence
- Implemented `/compact` and `/clear` commands for conversation management
- Restructured tools as PascalCase Tool classes for better organization
- Created proper implementation of Task system for tracking multi-step operations
- Added MCP service integration for extensibility
- Reorganized codebase to better match the original architecture
- Fixed the main flow to correctly handle LLM tool calls

## Next Steps

### High Priority
- [x] Finish updating agent.py implementation 
  - Properly connect agent system to use global tool registry
  - Fix circular import issues
  - Create proper tool handlers for user commands vs. agent tools
- [x] Improve provider interfaces for tool calling
  - Complete OpenAI provider implementation for tool calls
  - Add Ollama provider implementation for tool calls
  - Implement proper JSON schema generation for tools
- [x] Integrate planning system with CLI
  - Connect planning components to the main CLI flow
  - Implement proper task state tracking during multi-step operations
- [x] Fix main CLI entry point
  - Make application run properly when no command is specified
  - Ensure consistent CLI behavior regardless of invocation method
  - Properly handle command-line flags at top level
- [x] Implement REPL and Server interfaces
  - Create core ReCC class for programmatic access
  - Add REPL command for interactive use
  - Create HTTP API server for remote access
  - Implement session management
- [x] Fix tool integration with REPL
  - Properly register file operation tools
  - Enable tool execution from LLM responses
  - Add proper error handling for tool failures
  - Track tool execution results for debugging
  - Improve parameter validation and error reporting

### Medium Priority
- [x] Implement missing tools
  - PR tools (PRComments, PRReview)
  - BashPolicySpec for command safety
  - Thinking tool for reasoning steps
  - Architect tool for planning
  - Provider management tools
- [x] Complete slash command handler system
  - Properly map slash commands to tool registry
  - Separate user-facing commands from agent-only tools
  - Implement proper error handling for commands
- [x] Add error handling and recovery
  - Implement proper error messages for tool call failures
  - Add rate limiting and retry mechanisms for API calls
  - Create recovery strategies for failed operations
- [x] Add comprehensive testing
  - Created test scripts for core functionality
  - Implemented tests for edge cases and error handling
  - Added tool parameter validation tests
  - Created task management system tests
  - Developed bash command execution tests
  - Added test framework for future expansion
  - [ ] Add unit tests for core components
  - [ ] Add integration tests for API interaction

### Low Priority
- [ ] Set up CI/CD pipeline
- [ ] Create packaging for PyPI
- [ ] Build platform-specific packages
- [ ] Implement auto-update mechanism
- [ ] Add language-specific features
- [ ] Create plugin system

## Command System Design

Re-CC uses two different but related systems for handling commands:

### 1. Slash Commands (User Interface)

Slash commands are text prefixed with `/` that users type directly in the terminal interface. These are human-facing commands intended for direct interaction and include:

- **File Operations**: `/edit`, `/view`, `/create`, `/find`, etc.
- **Shell Access**: `/run`, `/shell`
- **Provider Management**: `/provider`, `/providers`
- **System Features**: `/help`, `/bug`, `/version`, `/tools`, `/compact`
- **Task Management**: `/task create`, `/task list`, etc.
- **MCP Services**: `/mcp list`, `/mcp add`, etc.

The CLI application parses these commands directly and maps them to the appropriate functionality, which may or may not involve calling LLM tools.

### 2. Tool Registry (LLM Interface)

The tool registry contains Tool objects that the LLM can call during its reasoning process. These tools:

- Have formal schema definitions (parameters, types, validation)
- Are registered in a global registry
- Can be invoked by the LLM through `tool_use` blocks
- Include both user-accessible tools and LLM-only internal tools

Some tools (like ViewFile) are accessible through both systems, while others (like ThinkingTool) are meant only for LLM use.

### Mapping Between Systems

The relationship between user slash commands and LLM tools follows these patterns:

1. **Direct Mapping**: Many slash commands map 1:1 to tools (e.g., `/edit` → EditFile)
2. **Command-Only**: Some slash commands don't use tools (e.g., `/provider` for configuration)
3. **Tool-Only**: Some tools are only for LLM use (e.g., ThinkingTool, DispatchAgent)
4. **Command Groups**: Some slash commands create a namespace (e.g., `/task list` maps to ListTasks tool)

The `parse_special_commands` function in app.py provides the mapping between user input and the appropriate handler, which may then use tools from the registry.

## License

See LICENSE.md file for details.