"""
HTTP API server for Re-CC.

This module provides a FastAPI-based HTTP server for remote access to Re-CC.
"""

import asyncio
import logging
import uuid
from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from re_cc.repl.interface import ReCC, ReCCResponse

logger = logging.getLogger(__name__)


class QueryRequest(BaseModel):
    """Request model for queries."""
    prompt: str
    session_id: Optional[str] = None
    provider: Optional[str] = None
    stream: bool = False


class CommandRequest(BaseModel):
    """Request model for commands."""
    command: str
    session_id: Optional[str] = None
    provider: Optional[str] = None
    stream: bool = False


class QueryResponse(BaseModel):
    """Response model for queries."""
    text: str
    tool_calls: Optional[List[Dict]] = None
    session_id: str


class SessionInfo(BaseModel):
    """Information about a session."""
    session_id: str
    provider: str
    created_at: str
    message_count: int


class SessionsResponse(BaseModel):
    """Response model for session listing."""
    sessions: List[SessionInfo]


class APIServer:
    """HTTP API server for Re-CC.
    
    This class provides a FastAPI-based HTTP server for remote access to Re-CC.
    It manages sessions, handles queries, and provides streaming responses.
    """
    
    def __init__(self, debug: bool = False):
        """Initialize the API server.
        
        Args:
            debug: Whether to enable debug logging.
        """
        self.app = FastAPI(
            title="Re-CC API",
            description="HTTP API for Re-CC",
            version="0.1.0",
        )
        self.debug = debug
        self.sessions: Dict[str, ReCC] = {}
        self._configure_routes()
        self._configure_middleware()
        
        if debug:
            logging.basicConfig(level=logging.DEBUG)
    
    def _configure_middleware(self) -> None:
        """Configure FastAPI middleware."""
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    
    def _configure_routes(self) -> None:
        """Configure API routes."""
        
        @self.app.get("/")
        async def root():
            """Root endpoint."""
            return {"message": "Re-CC API Server"}
        
        @self.app.post("/query", response_model=QueryResponse)
        async def query(request: QueryRequest):
            """Send a query to the LLM."""
            session_id = request.session_id or str(uuid.uuid4())
            
            # Get or create the session
            if session_id not in self.sessions:
                self.sessions[session_id] = ReCC(
                    provider_name=request.provider,
                    debug=self.debug,
                )
            
            # Switch provider if requested
            if request.provider and type(self.sessions[session_id].provider).__name__ != request.provider:
                self.sessions[session_id].switch_provider(request.provider)
            
            # Stream or full response
            if request.stream:
                return StreamingResponse(
                    self._stream_response(session_id, request.prompt),
                    media_type="text/event-stream",
                )
            else:
                # Get the response
                response = await self.sessions[session_id].query_async(request.prompt)
                
                # Return the response
                return QueryResponse(
                    text=response.text,
                    tool_calls=response.tool_calls,
                    session_id=session_id,
                )
        
        @self.app.post("/command", response_model=QueryResponse)
        async def command(request: CommandRequest):
            """Execute a command."""
            session_id = request.session_id or str(uuid.uuid4())
            
            # Get or create the session
            if session_id not in self.sessions:
                self.sessions[session_id] = ReCC(
                    provider_name=request.provider,
                    debug=self.debug,
                )
            
            # Switch provider if requested
            if request.provider and type(self.sessions[session_id].provider).__name__ != request.provider:
                self.sessions[session_id].switch_provider(request.provider)
            
            # Stream or full response
            if request.stream:
                return StreamingResponse(
                    self._stream_command(session_id, request.command),
                    media_type="text/event-stream",
                )
            else:
                # Execute the command
                result = await self.sessions[session_id].execute_command_async(request.command)
                
                # Check if the result is a streaming response
                if hasattr(result, "__aiter__"):
                    # Collect the full response
                    text = ""
                    async for chunk in result:
                        text += chunk.text
                    
                    return QueryResponse(
                        text=text,
                        session_id=session_id,
                    )
                else:
                    # Return the response
                    return QueryResponse(
                        text=result.text,
                        tool_calls=result.tool_calls,
                        session_id=session_id,
                    )
        
        @self.app.get("/sessions", response_model=SessionsResponse)
        async def list_sessions():
            """List active sessions."""
            sessions = []
            for session_id, recc in self.sessions.items():
                provider_name = type(recc.provider).__name__
                message_count = len(recc.conversation.messages)
                created_at = recc.conversation.created_at.isoformat() if recc.conversation.created_at else ""
                
                sessions.append(SessionInfo(
                    session_id=session_id,
                    provider=provider_name,
                    created_at=created_at,
                    message_count=message_count,
                ))
            
            return SessionsResponse(sessions=sessions)
        
        @self.app.delete("/sessions/{session_id}")
        async def delete_session(session_id: str):
            """Delete a session."""
            if session_id in self.sessions:
                del self.sessions[session_id]
                return {"message": f"Session {session_id} deleted"}
            else:
                raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
        
        @self.app.post("/sessions/{session_id}/save")
        async def save_session(session_id: str):
            """Save a session."""
            if session_id in self.sessions:
                saved_id = self.sessions[session_id].save_conversation()
                return {"message": f"Session saved with ID: {saved_id}"}
            else:
                raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
        
        @self.app.post("/sessions/{session_id}/load/{conversation_id}")
        async def load_session(session_id: str, conversation_id: str):
            """Load a conversation into a session."""
            if session_id not in self.sessions:
                self.sessions[session_id] = ReCC(debug=self.debug)
            
            try:
                self.sessions[session_id].load_conversation(conversation_id)
                return {"message": f"Loaded conversation {conversation_id} into session {session_id}"}
            except Exception as e:
                raise HTTPException(status_code=404, detail=str(e))
        
        @self.app.get("/providers")
        async def list_providers():
            """List available providers."""
            # Create a temporary ReCC instance to get providers
            recc = ReCC(debug=self.debug)
            providers = recc.get_available_providers()
            return {"providers": providers}
    
    async def _stream_response(self, session_id: str, prompt: str):
        """Stream a response from the LLM.
        
        Args:
            session_id: The session ID.
            prompt: The prompt to send to the LLM.
            
        Yields:
            Server-sent events with chunks of the response.
        """
        try:
            async for chunk in self.sessions[session_id].stream_query(prompt):
                # Format as a server-sent event
                yield f"data: {chunk.text}\n\n"
            
            # End of stream
            yield f"event: done\ndata: \n\n"
        except Exception as e:
            logger.error(f"Error streaming response: {str(e)}")
            yield f"event: error\ndata: {str(e)}\n\n"
    
    async def _stream_command(self, session_id: str, command: str):
        """Stream a command response.
        
        Args:
            session_id: The session ID.
            command: The command to execute.
            
        Yields:
            Server-sent events with chunks of the response.
        """
        try:
            result = await self.sessions[session_id].execute_command_async(command)
            
            # Check if the result is a streaming response
            if hasattr(result, "__aiter__"):
                async for chunk in result:
                    # Format as a server-sent event
                    yield f"data: {chunk.text}\n\n"
            else:
                # Return the full response at once
                yield f"data: {result.text}\n\n"
            
            # End of stream
            yield f"event: done\ndata: \n\n"
        except Exception as e:
            logger.error(f"Error streaming command: {str(e)}")
            yield f"event: error\ndata: {str(e)}\n\n"
    
    def run(self, host: str = "127.0.0.1", port: int = 8000):
        """Run the API server.
        
        Args:
            host: The host to bind to.
            port: The port to listen on.
        """
        import uvicorn
        uvicorn.run(self.app, host=host, port=port)


def create_app(debug: bool = False) -> FastAPI:
    """Create a FastAPI application.
    
    Args:
        debug: Whether to enable debug logging.
        
    Returns:
        The FastAPI application.
    """
    server = APIServer(debug=debug)
    return server.app


def main(host: str = "127.0.0.1", port: int = 8000, debug: bool = False):
    """Run the API server.
    
    Args:
        host: The host to bind to.
        port: The port to listen on.
        debug: Whether to enable debug logging.
    """
    server = APIServer(debug=debug)
    server.run(host=host, port=port)


if __name__ == "__main__":
    main()