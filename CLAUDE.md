# Re-CC Project Guidelines

## Project Overview
Re-CC is a Python reimplementation of the Claude Code CLI. This project creates a terminal-based AI coding assistant that can understand codebases, edit files, run commands, and handle workflows through natural language interactions. Unlike the original Node.js version, Re-CC supports multiple LLM providers through API keys rather than OAuth authentication.

## Current Implementation Status
- Core provider architecture with support for Anthropic, OpenAI, and Ollama
- Secure API key management using system keyring
- Configuration management with YAML 
- Terminal UI with Rich and Textual libraries
- Interactive CLI with comprehensive slash command system
- File editing capabilities with word-level diff visualization
- Code search and navigation with language-specific patterns
- Command execution with streaming output
- Context-aware interactions with Git repositories
- Conversation management with /compact command
- Bug reporting and version information features
- Tool management capabilities
- Fuzzy command matching for improved user experience

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
- Comprehensive command system with slash commands:
  - File operations: `/edit`, `/view`, `/create`, `/find`, etc.
  - Shell access: `/run`, `/shell`
  - Provider management: `/provider`, `/providers`
  - System features: `/help`, `/bug`, `/version`, `/tools`, `/compact`
- File editing with word-level diff visualization and confirmation
- Code search with language-specific patterns (functions, classes)
- Command execution with real-time streaming output
- Git repository awareness and context gathering
- Fuzzy command matching for intuitive user interaction

## Conversation & Planning System

The Re-CC application implements a hybrid planning system that combines LLM capabilities with structured state management:

### Conversation Management
- Maintains conversation history buffer to provide context for the LLM
- Persists conversations across sessions using secure local storage
- Implements the `/compact` command to summarize long conversations
- Tracks message types (user input, assistant response, system messages)

### Environment Context
- Automatically gathers relevant context from the codebase
- Analyzes git repository information for project understanding
- Builds language-specific context based on file types
- Maintains project-specific knowledge across sessions

### Hybrid Planning Approach
- **LLM-Driven Planning**: Relies on the LLM to break down complex tasks
- **Structured State Tracking**: Maintains a light task state in application code
- **Plan Verification**: Validates plan steps against available tools
- **Adaptive Context**: Dynamically adjusts context based on the task

### Key Components
- **ConversationBuffer**: Manages and persists chat history
- **ContextGatherer**: Collects relevant environment information
- **TaskTracker**: Maintains the state of multi-step tasks
- **PlanManager**: Coordinates between user input and LLM planning

## Next Steps
- Complete refactoring the agent implementation to fully support multi-step tool operations
- Finish updating the providers to handle tool calls correctly
- Complete the environment context gathering system
- Integrate tool call patterns into the main CLI
- Set up CI/CD pipeline
- Create packaging and distribution for PyPI
- Build platform-specific packages (pip, conda)
- Implement auto-update mechanisms
- Add more language-specific features
- Enhance error handling and recovery mechanisms

## Current Implementation Progress (2024-11-03)

### Recently Completed
- [x] Implemented structured prompt library with comprehensive prompts from prompts.js
  - Created general.py with get_general_cli_prompt and get_tool_usage_prompt
  - Created tools.py with specific tool prompts matching original JS
- [x] Created typed Tool registry with validation
  - Implemented Tool data class with typed parameters
  - Created ToolRegistry class for tool management
- [x] Restructured tools as PascalCase Tool classes for better organization
  - Created file_operations.py with ViewFile, EditFile, CreateFile, ListFiles tools
  - Created search.py with GlobTool, GrepTool, FindFunction, FindClass tools
  - Created command.py with Bash tool
  - Created mcp.py with MCPList, MCPAdd, MCPRemove, MCPExecute tools
  - Created task.py with CreateTask, ListTasks, TaskStatus, CompleteTask, CancelTask tools
  - Created agent.py with DispatchAgent tool
- [x] Implemented the Task system for multi-step operations
  - Complete task state management with status tracking
  - Support for subtasks and hierarchical task organization
- [x] Added MCP (Master Control Program) service integration
  - Support for external service registration and execution
  - Proper interface for tool interaction
- [x] Added conversation history buffer with persistence
  - Save/load conversation across sessions
  - Secure local storage with proper paths
  - Message typing for different roles
- [x] Implemented `/compact` and `/clear` commands for conversation management
  - Summarization of conversations to save context
  - Complete clearing of history when needed
- [x] Fixed main application flow to correctly handle tool calls
  - LLM can now call tools directly when responding to user
  - Agent integration with proper tool handling
- [x] Finalized the command system integration
  - Enhanced Tool class with visibility, command_aliases, and command_pattern
  - Updated ToolRegistry to support command matching and filtering
  - Implemented `!` prefix for direct terminal commands
  - Added comprehensive user-facing commands like `/config`, `/doctor`, etc.
  - Created dynamic help display from tool registry
  - Added PR review and comment commands with GitHub CLI integration
- [x] Improved CLI entry point for better user experience
  - Fixed the main application flow to default to the CLI when no command is specified
  - Implemented Typer callback with invoke_without_command to handle top-level options
  - Improved command-line argument handling for version and config flags
  - Ensured consistent user experience regardless of how the application is invoked

### Currently Working On
- [ ] Testing and validating the complete command system
- [ ] Improving the provider interface for tool calling with better error handling
- [ ] Finishing the planning system integration with the CLI
- [ ] Preparing for packaging and distribution to PyPI
- [ ] Adding comprehensive documentation for all commands and features

Remember to respect user data privacy and follow security best practices when handling API keys.

# Full Requirements:

This JavaScript file defines the core functionality of "Claude Code," a CLI tool by Anthropic designed to assist with software engineering tasks. Below, I’ll reconstruct the main flow, explain the key components, and detail how the tools are integrated and utilized by the LLM, focusing on their prompts and purposes.

---

### Main Flow Reconstruction

The file serves as the backbone of a CLI application that leverages an LLM to assist users with coding tasks. Here's the high-level flow:

1. **CLI Setup (Commander)**:
   - The `main` function sets up the CLI using the `commander` library, defining commands, options, and arguments for user interaction.
   - Default behavior starts an interactive session, but options like `--print` allow non-interactive use (e.g., for scripting/piping).
   - Subcommands (`config`, `approved-tools`, `mcp`, `doctor`) manage configuration, tool permissions, server connections, and diagnostics.

2. **Environment and Context Setup**:
   - The `getEnvironmentDetails` function gathers runtime context (working directory, git status, platform, etc.) and embeds it into prompts for situational awareness.
   - If a `CLAUDE.md` file exists, it’s automatically included in the context, providing codebase-specific details (commands, style preferences, etc.).

3. **Prompt Construction**:
   - The `generalCLIPrompt` defines the LLM’s overarching behavior, emphasizing conciseness, safety (e.g., refusing malicious code), and tool usage.
   - Tool-specific prompts (e.g., `BashTool.prompt`, `FileReadTool.prompt`) provide detailed instructions for how each tool should be used, including security and usage policies.

4. **Tool Integration**:
   - Tools are defined as objects with properties like `name`, `description`, `prompt`, `inputSchema`, and `userFacingName`. These tools are invoked by the LLM to perform tasks such as file reading, editing, searching, or running bash commands.
   - The LLM uses tools by outputting structured `tool_use` blocks, which the system interprets to execute the corresponding tool actions.

5. **Task Execution**:
   - The LLM processes user prompts, optionally using tools to gather data, modify files, or execute commands.
   - Tasks are completed in a stateless manner per user request, with the LLM returning concise responses (often 1-3 lines) to the CLI.

6. **Feedback and Safety**:
   - User interactions are treated as feedback per Anthropic’s terms, potentially used to improve models.
   - Safety mechanisms (e.g., `BashPolicySpec`, banned commands) ensure malicious or risky actions are blocked.

---

### Key Components and How They Work

#### 1. **Prompts and LLM Behavior**
   - **General CLI Prompt (`generalCLIPrompt`)**:
     - Defines the LLM’s role as an interactive CLI tool for software engineering tasks.
     - Enforces conciseness (responses < 4 lines unless detail is requested), safety (refusing malicious code), and tool usage policies.
     - Includes slash commands (`/help`, `/compact`) and feedback instructions.
     - Encourages proactive behavior (e.g., suggesting updates to `CLAUDE.md`) but avoids surprising actions without user approval.
   - **Tool Usage Prompt (`getToolUsagePrompt`)**:
     - Reinforces conciseness and directness in tool usage.
     - Ensures file paths in responses are absolute, not relative.
   - **Tool-Specific Prompts**:
     - Each tool has a `prompt` function that provides detailed instructions on its usage, including security checks, verification steps, and output formatting.

#### 2. **Tools Overview**
Tools are the primary mechanism for the LLM to interact with the filesystem, execute commands, and perform tasks. Here’s a breakdown of the main tools, their prompts, and what they do:

- **File Read Tool (`FileReadTool`)**:
  - **Purpose**: Reads file contents from the local filesystem.
  - **Prompt**: Instructs the LLM to use absolute paths, read up to 2000 lines by default, and optionally specify an offset/limit for large files. For images, it displays them; for Jupyter notebooks, it defers to another tool (`VH`).
  - **Input Schema**: `file_path` (required), `offset`, `limit` (optional).
  - **LLM Usage**: The LLM calls this tool to view file contents before editing or analyzing, ensuring it understands context.

- **List Files Tool (`ListFilesTool`)**:
  - **Purpose**: Lists files and directories in a given path.
  - **Prompt**: Requires absolute paths and suggests preferring `Glob` or `Grep` tools for targeted searches.
  - **Input Schema**: `path` (required).
  - **LLM Usage**: Used to verify directory contents before creating files or running commands affecting directories.

- **Bash Tool (`BashTool`)**:
  - **Purpose**: Executes bash commands in a persistent shell session.
  - **Prompt**:
    - Enforces security by banning commands like `curl`, `wget`, etc., to prevent network access or malicious actions.
    - Requires absolute paths and avoids `cd` unless explicitly requested, preserving shell state.
    - Prohibits using search commands (`find`, `grep`) or read commands (`cat`, `ls`) directly, deferring to specialized tools (`GrepTool`, `FileReadTool`, etc.).
    - Provides detailed steps for git commits and pull requests, including analysis, formatting, and safety checks (e.g., no interactive `-i` flags, no pushing to remote).
    - Limits output to 30,000 characters and supports timeouts (default 30 minutes, max 10 minutes).
  - **Input Schema**: `command` (required), `timeout` (optional).
  - **LLM Usage**: The LLM uses this tool to execute commands, especially for git operations, after verifying safety via `BashPolicySpec`.

- **Bash Policy Spec (`BashPolicySpec`)**:
  - **Purpose**: Analyzes bash commands to detect command injection and determine command prefixes for approval.
  - **Prompt**: Defines rules to extract command prefixes (e.g., `cat`, `git commit`) and flags commands with injection risks as `command_injection_detected`.
  - **LLM Usage**: The LLM uses this to ensure commands are safe before execution, requiring user approval for risky commands.

- **Init Codebase Tool (`InitCodebaseTool`)**:
  - **Purpose**: Creates or improves a `CLAUDE.md` file with codebase documentation.
  - **Prompt**: Analyzes the codebase to document build/lint/test commands, code style guidelines, and conventions, integrating rules from `.cursor/rules/` or `.github/copilot-instructions.md`.
  - **LLM Usage**: The LLM calls this tool when initializing or updating `CLAUDE.md` to enhance future interactions.

- **PR Comments Tool (`PRCommentsTool`)**:
  - **Purpose**: Fetches and displays comments from a GitHub pull request.
  - **Prompt**: Uses `gh` commands to fetch PR details, comments, and code context, formatting them with diff hunks and threading.
  - **LLM Usage**: The LLM calls this tool to display PR feedback, ensuring it only returns formatted comments without explanatory text.

- **PR Review Tool (`PRReviewTool`)**:
  - **Purpose**: Reviews a pull request, providing detailed feedback.
  - **Prompt**: Uses `gh` commands to fetch PR details and diffs, then analyzes code quality, style, correctness, performance, test coverage, and security, formatting feedback into sections.
  - **LLM Usage**: The LLM calls this tool to assist users in reviewing PRs, focusing on actionable suggestions.

- **Search Glob Tool (`SearchGlobTool`)**:
  - **Purpose**: Finds files matching glob patterns (e.g., `**/*.js`).
  - **Prompt**: Recommends using this for file name searches and deferring to `Agent` for open-ended searches.
  - **Input Schema**: `pattern` (required), `path` (optional).
  - **LLM Usage**: The LLM uses this to locate files by pattern, sorting results by modification time.

- **Grep Tool (`GrepTool`)**:
  - **Purpose**: Searches file contents using regex patterns.
  - **Prompt**: Supports full regex syntax, allows filtering by file pattern, and recommends `Agent` for iterative searches.
  - **Input Schema**: `pattern` (required), `path`, `include` (optional).
  - **LLM Usage**: The LLM uses this to find specific content within files, sorting results by modification time.

- **Thinking Tool (`ThinkingTool`)**:
  - **Purpose**: Logs thoughts without taking actions, aiding in complex reasoning.
  - **Prompt**: Encourages use for brainstorming bug fixes, test strategies, refactoring, feature design, or debugging.
  - **Input Schema**: `thought` (required).
  - **LLM Usage**: The LLM calls this to organize thoughts transparently, returning only a log confirmation.

- **Jupyter Notebook Edit Tool (`NotebookEditCellTool`)**:
  - **Purpose**: Edits specific cells in Jupyter notebooks.
  - **Prompt**: Supports replacing, inserting, or deleting cells using absolute paths and 0-based indices, requiring `cell_type` for insertions.
  - **Input Schema**: `notebook_path`, `cell_number`, `new_source` (required), `cell_type`, `edit_mode` (optional).
  - **LLM Usage**: The LLM uses this to modify Jupyter notebooks, returning concise edit confirmations.

- **File Edit Tool (`FileEditTool`)**:
  - **Purpose**: Edits files by replacing specific text.
  - **Prompt**:
    - Requires absolute paths and exact, unique `old_string` matches (including 3-5 lines of context) to ensure precise edits.
    - Supports creating new files (empty `old_string`) or deleting content (empty `new_string`).
    - Prohibits edits that break code or leave it in an invalid state.
  - **Input Schema**: `file_path`, `old_string`, `new_string` (required).
  - **LLM Usage**: The LLM uses this for targeted edits, verifying context with `FileReadTool` first.

- **File Replace Tool (`FileReplaceTool`)**:
  - **Purpose**: Overwrites entire files.
  - **Prompt**: Requires absolute paths and verification of parent directories for new files, using `FileReadTool` for context and `ListFilesTool` for directory checks.
  - **Input Schema**: `file_path`, `content` (required).
  - **LLM Usage**: The LLM uses this for large-scale file changes, returning creation/update confirmations with line-numbered snippets.

- **Task Tool / Dispatch Agent (`TaskTool`)**:
  - **Purpose**: Launches a new agent to perform complex tasks autonomously.
  - **Prompt**:
    - Provides access to most tools (except `Bash`, `FileReplace`, `FileEdit`, `NotebookEditCell` unless permissions are skipped).
    - Encourages concurrent agent launches for performance, requiring detailed task descriptions and specific return data.
    - Notes that agent results are not user-visible, requiring the LLM to summarize them.
  - **Input Schema**: `prompt` (required).
  - **LLM Usage**: The LLM uses this for open-ended searches or multi-step tasks, summarizing results for the user.

- **Architect Tool (`ArchitectTool`)**:
  - **Purpose**: Plans technical implementations without coding.
  - **Prompt**: Analyzes requirements, defines technical approaches, and breaks tasks into actionable steps, avoiding actual code writing.
  - **Input Schema**: `prompt` (required), `context` (optional).
  - **LLM Usage**: The LLM uses this to provide implementation plans, ensuring clarity for junior engineers.

- **Clear/Compact Conversation Tools (`clearLocalConversationHistory`, `compactLocalConversationHistory`)**:
  - **Purpose**: Manages conversation history to free up context.
  - **Prompt (Compact)**: Summarizes conversations, focusing on ongoing tasks, files, and next steps.
  - **LLM Usage**: The LLM calls these via slash commands (`/clear`, `/compact`) to manage context limits.

- **Anthropic Swag Stickers Tool**:
  - **Purpose**: Sends swag stickers to users.
  - **Prompt**: Triggers on explicit user requests for stickers/swag, displaying a shipping form.
  - **LLM Usage**: The LLM uses this only when users explicitly request stickers, avoiding false positives (e.g., coding tasks involving "stickers").

#### 3. **Tool Invocation by the LLM**
   - **Mechanism**: The LLM invokes tools by outputting `tool_use` blocks in its response, specifying the tool name and input parameters (conforming to the `inputSchema`).
   - **Concurrency**: For independent tasks, the LLM includes multiple `tool_use` blocks in a single message to maximize performance.
   - **Safety Checks**: Tools like `BashTool` require safety checks (e.g., `BashPolicySpec`) before execution, prompting user approval for risky commands.
   - **Result Handling**: Tool results are returned to the LLM, which may summarize them for the user (e.g., `TaskTool` results) or display them directly (e.g., `BashTool` git outputs).

#### 4. **Safety and Security**
   - **Malicious Code Detection**: The LLM refuses to work on files or tasks that appear malicious, based on filenames, directory structure, or intent, even if the request seems benign.
   - **Banned Commands**: `BashTool` bans network-related commands (`curl`, `wget`, etc.) to prevent external access.
   - **Command Injection Detection**: `BashPolicySpec` ensures commands are safe, flagging injection risks.
   - **Secrets Protection**: The LLM avoids exposing or committing secrets, adhering to security best practices.

#### 5. **Git and PR Management**
   - **Git Commits**:
     - The LLM uses `BashTool` to run `git status`, `git diff`, and `git log` to understand changes, then analyzes them to draft commit messages.
     - Commits include a standardized footer (`🤖 Generated with Claude Code`) and are formatted via HEREDOCs for consistency.
     - Pre-commit hooks are handled by retrying once or amending commits if files are modified.
   - **Pull Requests**:
     - The LLM uses `BashTool` with `gh` commands to fetch PR details, diffs, and branch status, then analyzes changes to draft PR summaries.
     - PR creation uses `gh pr create` with formatted bodies, including summaries and test plans.

#### 6. **Code Style and Conventions**
   - **Style Adherence**: The LLM mimics existing code conventions by analyzing surrounding code, imports, and project files (e.g., `package.json`, `CLAUDE.md`).
   - **Library Checks**: The LLM verifies library availability before use, avoiding assumptions about frameworks or dependencies.
   - **Linting/Typechecking**: After edits, the LLM runs lint and typecheck commands if provided, suggesting additions to `CLAUDE.md` if not.

---

### How Tools Are Called by the LLM

The LLM integrates tools into its workflow by following these steps:

1. **Understand the Task**:
   - Analyzes the user’s prompt and context (including `CLAUDE.md` and environment details).
   - Uses search tools (`SearchGlobTool`, `GrepTool`, `TaskTool`) to gather information if needed.

2. **Plan Actions**:
   - For complex tasks, uses `ThinkingTool` or `ArchitectTool` to brainstorm or plan steps without taking actions.
   - Determines which tools are appropriate based on prompts and constraints (e.g., avoiding `Bash` for file searches, using `FileReadTool` instead of `cat`).

3. **Execute Tools**:
   - Outputs `tool_use` blocks with the tool name and input parameters, adhering to the `inputSchema`.
   - For example, to read a file, the LLM might output:
     ```json
     {
       "tool_use": {
         "name": "View",
         "input": { "file_path": "/path/to/file.js" }
       }
     }
     ```
   - For concurrent actions, includes multiple `tool_use` blocks in one message, e.g., fetching git status, diff, and log simultaneously.

4. **Process Results**:
   - Receives tool results and decides how to proceed (e.g., summarizing `TaskTool` results, displaying `BashTool` output directly, or using `FileReadTool` contents to plan edits).
   - Ensures responses are concise and user-visible, avoiding unnecessary verbosity.

5. **Complete the Task**:
   - Returns the final answer or confirmation to the user, often as plain text or formatted output (e.g., PR comments, commit messages).
   - Avoids committing changes unless explicitly requested, ensuring user control.

---

### Example Scenarios

Here are examples of how the LLM might use tools for common tasks:

#### Example 1: Reading a File
- **User Prompt**: "Show me the contents of `/src/index.js`."
- **LLM Actions**:
  - Calls `FileReadTool` with `file_path: "/src/index.js"`.
  - Receives the file contents and outputs them directly to the user.

#### Example 2: Searching for a Function
- **User Prompt**: "Where is the `calculateTotal` function defined?"
- **LLM Actions**:
  - Calls `GrepTool` with `pattern: "function calculateTotal"`, `include: "*.js"`.
  - Receives matching file paths, sorted by modification time, and outputs the absolute path of the most relevant match.

#### Example 3: Committing Changes
- **User Prompt**: "Commit my changes to `src/feature.js` with message 'Add new feature'."
- **LLM Actions**:
  - Calls `BashTool` with multiple `tool_use` blocks in one message:
    - `git status` to check untracked files.
    - `git diff` to view changes.
    - `git log` to review commit message style.
  - Analyzes results, stages `src/feature.js` with `git add`, and commits using `git commit -m` with a HEREDOC-formatted message, appending the standard footer.
  - Calls `BashTool` with `git status` to confirm success.
  - Returns an empty response, letting the user see git output directly.

#### Example 4: Reviewing a PR
- **User Prompt**: "Review PR #42."
- **LLM Actions**:
  - Calls `PRReviewTool` with `prompt: "PR number: 42"`.
  - The tool internally uses `BashTool` to run `gh pr view 42`, `gh pr diff 42`, and analyzes the changes.
  - Returns a formatted review with sections on correctness, style, performance, etc.

#### Example 5: Planning a Feature
- **User Prompt**: "How should I implement a caching layer for my API?"
- **LLM Actions**:
  - Calls `ArchitectTool` with `prompt: "Implement a caching layer for my API"`.
  - Receives a detailed plan with steps, technologies, and considerations, and outputs it directly to the user.

---

### Advice on Usage and Improvements

1. **Prompt Clarity**:
   - The prompts are well-structured and emphasize safety, conciseness, and tool usage policies. However, some prompts (e.g., `BashTool.prompt`) are lengthy and could be streamlined by moving static examples to external documentation, reducing context overhead.

2. **Tool Overlap**:
   - Tools like `FileEditTool` and `FileReplaceTool` have overlapping use cases (targeted edits vs. full overwrites). Consider consolidating them into a single `FileModifyTool` with modes (`replace`, `edit`, `create`) to simplify the LLM’s decision-making.

3. **Safety Enhancements**:
   - The `BashPolicySpec` is robust for command injection detection, but consider adding a whitelist of approved commands (beyond banned ones) to further reduce risk.
   - For `FileEditTool`, the uniqueness requirement for `old_string` is strict but could be enhanced with a pre-check tool to count matches, reducing failed edits.

4. **Performance**:
   - The emphasis on concurrent tool calls is excellent for performance, but the `TaskTool` could benefit from a mechanism to report intermediate progress for long-running tasks, improving user experience in interactive sessions.

5. **User Experience**:
   - The strict conciseness requirement (< 4 lines) is ideal for CLI output but may limit helpfulness for complex tasks. Consider allowing the LLM to detect when detail is implicitly needed (e.g., for PR reviews) without requiring an explicit user request.
   - The `Anthropic Swag Stickers Tool` is a nice touch but should include a rate-limiting mechanism to prevent abuse.

6. **Documentation**:
   - The `CLAUDE.md` auto-inclusion is a powerful feature, but the LLM should periodically remind users to review and update it, as outdated commands or preferences could lead to errors.

7. **Error Handling**:
   - Tools like `FileReadTool` and `FileEditTool` could benefit from explicit error messages (e.g., "File not found", "Multiple matches found") returned to the LLM, which could then suggest corrective actions (e.g., using `SearchGlobTool` to find the correct path).

---

### Conclusion

The "Code" CLI is a sophisticated tool that leverages an LLM to perform software engineering tasks securely and efficiently. Its main flow involves setting up a CLI, defining prompts for LLM behavior, and integrating a suite of tools for file manipulation, command execution, and codebase analysis. The tools are called via structured `tool_use` blocks, with prompts ensuring safety, conciseness, and adherence to conventions. By understanding the codebase context (via `CLAUDE.md`, git history, etc.), the LLM provides targeted assistance while minimizing user surprise and maximizing safety.