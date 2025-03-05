"""Command execution utilities for Re-CC."""

import os
import subprocess
import shlex
import asyncio
import signal
from typing import List, Dict, Optional, Tuple, Any, Union, Callable


class CommandResult:
    """Result of a command execution."""
    
    def __init__(
        self,
        command: str,
        return_code: int,
        stdout: str,
        stderr: str,
        duration: float,
    ) -> None:
        """Initialize the command result.
        
        Args:
            command: The command that was executed
            return_code: The return code of the command
            stdout: The standard output of the command
            stderr: The standard error of the command
            duration: The duration of the command in seconds
        """
        self.command = command
        self.return_code = return_code
        self.stdout = stdout
        self.stderr = stderr
        self.duration = duration
    
    @property
    def success(self) -> bool:
        """Check if the command was successful.
        
        Returns:
            True if the command was successful, False otherwise
        """
        return self.return_code == 0


async def execute_command_async(
    command: str,
    cwd: Optional[str] = None,
    env: Optional[Dict[str, str]] = None,
    timeout: Optional[float] = None,
    stream_stdout: Optional[Callable[[str], None]] = None,
    stream_stderr: Optional[Callable[[str], None]] = None,
) -> CommandResult:
    """Execute a command asynchronously.
    
    Args:
        command: The command to execute
        cwd: The working directory, or None for current directory
        env: The environment variables, or None for current environment
        timeout: The timeout in seconds, or None for no timeout
        stream_stdout: A callback for streaming stdout, or None
        stream_stderr: A callback for streaming stderr, or None
        
    Returns:
        The command result
        
    Raises:
        asyncio.TimeoutError: If the command times out
        OSError: If the command cannot be executed
    """
    import time
    
    # Split the command
    if isinstance(command, str):
        args = shlex.split(command)
    else:
        args = command
    
    # Set up the environment
    cmd_env = os.environ.copy()
    if env:
        cmd_env.update(env)
    
    # Start the process
    start_time = time.time()
    
    process = await asyncio.create_subprocess_exec(
        *args,
        stdout=asyncio.subprocess.PIPE if stream_stdout else asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE if stream_stderr else asyncio.subprocess.PIPE,
        cwd=cwd,
        env=cmd_env,
    )
    
    # Stream output if requested
    stdout_data = []
    stderr_data = []
    
    async def read_stream(stream, data_list, callback):
        while True:
            line = await stream.readline()
            if not line:
                break
            
            line_str = line.decode("utf-8", errors="replace")
            data_list.append(line_str)
            
            if callback:
                callback(line_str)
    
    # Create tasks for reading stdout and stderr
    stdout_task = asyncio.create_task(
        read_stream(process.stdout, stdout_data, stream_stdout)
    )
    stderr_task = asyncio.create_task(
        read_stream(process.stderr, stderr_data, stream_stderr)
    )
    
    # Wait for the process to complete with timeout
    try:
        await asyncio.wait_for(
            asyncio.gather(
                process.wait(),
                stdout_task,
                stderr_task,
            ),
            timeout=timeout,
        )
        
        # Convert stdout and stderr to strings
        stdout = "".join(stdout_data)
        stderr = "".join(stderr_data)
        
        # Calculate duration
        duration = time.time() - start_time
        
        return CommandResult(
            command=command,
            return_code=process.returncode,
            stdout=stdout,
            stderr=stderr,
            duration=duration,
        )
    
    except asyncio.TimeoutError:
        # Kill the process
        try:
            process.send_signal(signal.SIGTERM)
            await asyncio.sleep(0.1)
            if process.returncode is None:
                process.kill()
        except Exception:
            pass
        
        # Cancel the tasks
        stdout_task.cancel()
        stderr_task.cancel()
        
        # Calculate duration
        duration = time.time() - start_time
        
        # Convert stdout and stderr to strings
        stdout = "".join(stdout_data)
        stderr = "".join(stderr_data)
        
        return CommandResult(
            command=command,
            return_code=-1,
            stdout=stdout,
            stderr=stderr + f"\nCommand timed out after {duration:.2f} seconds",
            duration=duration,
        )


def execute_command(
    command: str,
    cwd: Optional[str] = None,
    env: Optional[Dict[str, str]] = None,
    timeout: Optional[float] = None,
    stream_stdout: Optional[Callable[[str], None]] = None,
    stream_stderr: Optional[Callable[[str], None]] = None,
) -> CommandResult:
    """Execute a command.
    
    Args:
        command: The command to execute
        cwd: The working directory, or None for current directory
        env: The environment variables, or None for current environment
        timeout: The timeout in seconds, or None for no timeout
        stream_stdout: A callback for streaming stdout, or None
        stream_stderr: A callback for streaming stderr, or None
        
    Returns:
        The command result
        
    Raises:
        subprocess.TimeoutExpired: If the command times out
        OSError: If the command cannot be executed
    """
    # Run the command asynchronously
    return asyncio.run(execute_command_async(
        command=command,
        cwd=cwd,
        env=env,
        timeout=timeout,
        stream_stdout=stream_stdout,
        stream_stderr=stream_stderr,
    ))


def find_command(command_name: str) -> Optional[str]:
    """Find the path to a command.
    
    Args:
        command_name: The command name to find
        
    Returns:
        The path to the command if found, None otherwise
    """
    try:
        if os.name == "nt":  # Windows
            # Check if the command exists using where
            process = subprocess.run(
                ["where", command_name],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                check=False,
            )
            
            if process.returncode == 0:
                return process.stdout.strip().splitlines()[0]
        else:  # Unix-like
            # Check if the command exists using which
            process = subprocess.run(
                ["which", command_name],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                check=False,
            )
            
            if process.returncode == 0:
                return process.stdout.strip()
    
    except Exception:
        pass
    
    return None