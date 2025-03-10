"""Ollama provider implementation."""

import httpx
import json
from typing import Optional, AsyncGenerator, Dict, Any, List

from re_cc.providers.base import LLMProvider, LLMResponse, ProviderFactory
from re_cc.config.manager import ProviderConfig


class OllamaProvider(LLMProvider):
    """Ollama provider implementation."""
    
    def __init__(self, config: ProviderConfig, api_key: str) -> None:
        """Initialize the Ollama provider.
        
        Args:
            config: The provider configuration
            api_key: The API key for authentication (not used for Ollama)
        """
        self.config = config
        self.endpoint = config.endpoint or "http://localhost:11434"
        self.model = config.model or "llama3"
        self.client = httpx.AsyncClient(base_url=self.endpoint)
    
    def _format_tools_for_ollama(self, tools: Optional[List[str]] = None) -> str:
        """Format tools for Ollama as part of a special prompt format.
        
        Args:
            tools: Optional list of tool names to include
            
        Returns:
            Tool definition text for Ollama in JSON schema format
        """
        from re_cc.tools import tool_registry
        
        if not tools:
            return ""
        
        tool_schemas = []
        
        for name in tools:
            tool = tool_registry.get_tool(name)
            if tool:
                schema = {
                    "type": "function",
                    "function": {
                        "name": tool.name,
                        "description": tool.description,
                        "parameters": {
                            "type": "object",
                            "properties": tool.parameters,
                            "required": tool.required_params
                        }
                    }
                }
                tool_schemas.append(schema)
        
        if not tool_schemas:
            return ""
        
        # Format for Ollama prompt
        tools_json = json.dumps(tool_schemas, indent=2)
        return f"""
<tools>
{tools_json}
</tools>
"""

    def _parse_tool_calls(self, response_text: str) -> List[Dict[str, Any]]:
        """Parse tool calls from Ollama response text.
        
        Args:
            response_text: The text response from Ollama
            
        Returns:
            List of parsed tool calls
        """
        tool_calls = []
        
        # Look for tool call format in the text
        tool_call_pattern = r"<tool_use>\s*(.+?)\s*</tool_use>"
        import re
        
        matches = re.findall(tool_call_pattern, response_text, re.DOTALL)
        for match in matches:
            try:
                # Try to parse as JSON
                tool_data = json.loads(match)
                if "name" in tool_data and "arguments" in tool_data:
                    tool_calls.append({
                        "name": tool_data["name"],
                        "arguments": tool_data["arguments"]
                    })
            except json.JSONDecodeError:
                # If not valid JSON, try to extract name and arguments separately
                name_match = re.search(r'"name"\s*:\s*"([^"]+)"', match)
                args_match = re.search(r'"arguments"\s*:\s*(\{.+\})', match)
                
                if name_match and args_match:
                    try:
                        args = json.loads(args_match.group(1))
                        tool_calls.append({
                            "name": name_match.group(1),
                            "arguments": args
                        })
                    except json.JSONDecodeError:
                        # Ignore malformed arguments
                        pass
        
        return tool_calls
        
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        context: Optional[str] = None,
        tools: Optional[List[str]] = None,
    ) -> LLMResponse:
        """Generate a response from Ollama.
        
        Args:
            prompt: The prompt to send to Ollama
            system_prompt: Optional system prompt
            temperature: The temperature to use for generation
            max_tokens: The maximum number of tokens to generate
            context: Optional additional context for the prompt
            tools: Optional list of tool names available to the LLM
            
        Returns:
            The LLM response
            
        Raises:
            Exception: If there is an error generating the response
        """
        try:
            # Format full prompt with context if provided
            full_prompt = prompt
            if context:
                full_prompt = f"{context}\n\n{prompt}"
            
            # Add tool definitions if provided
            tools_text = ""
            if tools and len(tools) > 0:
                tools_text = self._format_tools_for_ollama(tools)
                
                # If we have tool definitions, add them to the system prompt
                if tools_text and system_prompt:
                    system_prompt = f"{system_prompt}\n\n{tools_text}"
                elif tools_text:
                    system_prompt = tools_text
            
            body: Dict[str, Any] = {
                "model": self.model,
                "prompt": full_prompt,
                "temperature": temperature,
            }
            
            if system_prompt:
                body["system"] = system_prompt
            
            if max_tokens:
                body["num_predict"] = max_tokens
            
            response = await self.client.post("/api/generate", json=body)
            response.raise_for_status()
            
            data = response.json()
            response_text = data["response"]
            
            # Check for tool calls in the response
            tool_calls = self._parse_tool_calls(response_text)
            
            # Clean up response text by removing tool call sections
            if tool_calls:
                import re
                cleaned_text = re.sub(r"<tool_use>\s*(.+?)\s*</tool_use>", "", response_text, flags=re.DOTALL)
                response_text = cleaned_text.strip()
            
            return LLMResponse(
                text=response_text,
                metadata={
                    "model": data.get("model", self.model),
                    "eval_count": data.get("eval_count", 0),
                },
                tool_calls=tool_calls
            )
        except Exception as e:
            raise Exception(f"Error generating response from Ollama: {str(e)}")
    
    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        context: Optional[str] = None,
        tools: Optional[List[str]] = None,
    ) -> AsyncGenerator[str, None]:
        """Generate a streaming response from Ollama.
        
        Args:
            prompt: The prompt to send to Ollama
            system_prompt: Optional system prompt
            temperature: The temperature to use for generation
            max_tokens: The maximum number of tokens to generate
            context: Optional additional context for the prompt
            tools: Optional list of tool names available to the LLM
            
        Yields:
            Chunks of the generated text
            
        Raises:
            Exception: If there is an error generating the response
        """
        try:
            # Format full prompt with context if provided
            full_prompt = prompt
            if context:
                full_prompt = f"{context}\n\n{prompt}"
            
            # Add tool definitions if provided
            # Ollama models may not fully support tool use with streaming properly
            # so when tools are provided, we'll want to use the non-streaming API
            if tools and len(tools) > 0:
                # Use non-streaming API for tool calls
                non_streaming_response = await self.generate(
                    prompt=prompt,
                    system_prompt=system_prompt,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    context=context,
                    tools=tools,
                )
                
                # If there are tool calls or we provided tools, yield the complete response
                # at once rather than streaming
                yield non_streaming_response.text
                return
                
            # If no tools are provided, proceed with standard streaming
            body: Dict[str, Any] = {
                "model": self.model,
                "prompt": full_prompt,
                "temperature": temperature,
                "stream": True,
            }
            
            if system_prompt:
                body["system"] = system_prompt
            
            if max_tokens:
                body["num_predict"] = max_tokens
            
            async with self.client.stream("POST", "/api/generate", json=body) as response:
                response.raise_for_status()
                
                async for line in response.aiter_lines():
                    if not line.strip():
                        continue
                    
                    try:
                        data = json.loads(line)
                        if "response" in data:
                            yield data["response"]
                    except json.JSONDecodeError:
                        # Skip malformed JSON
                        continue
        except Exception as e:
            raise Exception(f"Error streaming response from Ollama: {str(e)}")
    
    async def test_connection(self) -> bool:
        """Test if the connection to Ollama is working.
        
        Returns:
            True if the connection is working, False otherwise
        """
        try:
            # Try to list models
            response = await self.client.get("/api/tags")
            response.raise_for_status()
            return True
        except Exception:
            return False


@ProviderFactory.register("ollama")
def create_ollama_provider(config: ProviderConfig, api_key: str) -> LLMProvider:
    """Create an Ollama provider instance.
    
    Args:
        config: The provider configuration
        api_key: The API key for authentication (not used for Ollama)
        
    Returns:
        An Ollama provider instance
    """
    if not config.endpoint:
        # Use default endpoint
        config.endpoint = "http://localhost:11434"
    
    return OllamaProvider(config, api_key)