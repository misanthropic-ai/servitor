"""OpenAI provider implementation."""

from typing import Optional, AsyncGenerator, Dict, Any, List

from openai import AsyncOpenAI

from re_cc.providers.base import LLMProvider, LLMResponse, ProviderFactory
from re_cc.config.manager import ProviderConfig


class OpenAIProvider(LLMProvider):
    """OpenAI provider implementation."""
    
    def __init__(self, config: ProviderConfig, api_key: str) -> None:
        """Initialize the OpenAI provider.
        
        Args:
            config: The provider configuration
            api_key: The API key for authentication
        """
        self.config = config
        self.api_key = api_key
        
        # Set up client with optional custom endpoint
        client_kwargs = {"api_key": api_key}
        if config.endpoint:
            client_kwargs["base_url"] = config.endpoint
        
        self.client = AsyncOpenAI(**client_kwargs)
        self.model = config.model or "gpt-4o"
    
    def _create_tool_schemas(self, tools: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """Create tool schemas for tools to be used by the provider.
        
        Args:
            tools: Optional list of tool names to include
            
        Returns:
            List of tool definitions in OpenAI's format
        """
        from re_cc.tools import tool_registry
        
        tool_list = []
        
        if not tools:
            return tool_list
            
        for name in tools:
            tool = tool_registry.get_tool(name)
            if tool:
                # Convert to OpenAI Tool format
                parameters = {
                    "type": "object",
                    "properties": tool.parameters,
                    "required": tool.required_params
                }
                
                tool_list.append({
                    "type": "function",
                    "function": {
                        "name": tool.name,
                        "description": tool.description,
                        "parameters": parameters
                    }
                })
        
        return tool_list

    def _parse_tool_calls(self, response) -> List[Dict[str, Any]]:
        """Parse tool calls from OpenAI response.
        
        Args:
            response: The raw response from OpenAI
            
        Returns:
            List of parsed tool calls
        """
        tool_calls = []
        
        for choice in response.choices:
            if hasattr(choice.message, 'tool_calls') and choice.message.tool_calls:
                for tool_call in choice.message.tool_calls:
                    if tool_call.type == "function":
                        tool_calls.append({
                            "name": tool_call.function.name,
                            "arguments": tool_call.function.arguments
                        })
        
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
        """Generate a response from OpenAI.
        
        Args:
            prompt: The prompt to send to OpenAI
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
            messages = []
            
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            
            # Add context if provided
            full_prompt = prompt
            if context:
                full_prompt = f"{context}\n\n{prompt}"
                
            messages.append({"role": "user", "content": full_prompt})
            
            kwargs: Dict[str, Any] = {
                "model": self.model,
                "messages": messages,
                "temperature": temperature,
            }
            
            if max_tokens:
                kwargs["max_tokens"] = max_tokens
            
            # Add tools if specified
            if tools and len(tools) > 0:
                tool_schemas = self._create_tool_schemas(tools)
                if tool_schemas:
                    kwargs["tools"] = tool_schemas
                    # Set to "auto" to allow the model to decide when to use tools
                    kwargs["tool_choice"] = "auto"
            
            response = await self.client.chat.completions.create(**kwargs)
            
            # Get the text content from the response
            text_content = ""
            if response.choices and response.choices[0].message:
                text_content = response.choices[0].message.content or ""
            
            # Parse tool calls if any
            tool_calls = self._parse_tool_calls(response)
            
            return LLMResponse(
                text=text_content,
                metadata={
                    "model": response.model,
                    "usage": {
                        "input_tokens": response.usage.prompt_tokens,
                        "output_tokens": response.usage.completion_tokens,
                    },
                },
                tool_calls=tool_calls
            )
        except Exception as e:
            raise Exception(f"Error generating response from OpenAI: {str(e)}")
    
    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        context: Optional[str] = None,
        tools: Optional[List[str]] = None,
    ) -> AsyncGenerator[str, None]:
        """Generate a streaming response from OpenAI.
        
        Args:
            prompt: The prompt to send to OpenAI
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
            messages = []
            
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            
            # Add context if provided
            full_prompt = prompt
            if context:
                full_prompt = f"{context}\n\n{prompt}"
                
            messages.append({"role": "user", "content": full_prompt})
            
            kwargs: Dict[str, Any] = {
                "model": self.model,
                "messages": messages,
                "temperature": temperature,
                "stream": True,
            }
            
            if max_tokens:
                kwargs["max_tokens"] = max_tokens
            
            # Add tools if specified
            # Note: OpenAI doesn't support both streaming and tool use in the same request
            # When tools are provided, we'll want to prioritize tool use over streaming
            # by falling back to non-streaming mode
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
                
                # If there are tool calls, we need to yield the response text
                # all at once rather than streaming
                if non_streaming_response.tool_calls:
                    yield non_streaming_response.text
                    return
            
            # If we reach here, either there were no tools or no tool calls were made
            # So we can use the streaming API
            async for chunk in await self.client.chat.completions.create(**kwargs):
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            raise Exception(f"Error streaming response from OpenAI: {str(e)}")
    
    async def test_connection(self) -> bool:
        """Test if the connection to OpenAI API is working.
        
        Returns:
            True if the connection is working, False otherwise
        """
        try:
            # Simple prompt to test the connection
            response = await self.generate(
                prompt="Hello, this is a connection test. Please respond with 'Connection successful'.",
                max_tokens=20,
                temperature=0.0,
            )
            return "Connection successful" in response.text
        except Exception:
            return False


@ProviderFactory.register("openai")
def create_openai_provider(config: ProviderConfig, api_key: str) -> LLMProvider:
    """Create an OpenAI provider instance.
    
    Args:
        config: The provider configuration
        api_key: The API key for authentication
        
    Returns:
        An OpenAI provider instance
        
    Raises:
        ValueError: If the API key is missing
    """
    if not api_key:
        raise ValueError("OpenAI API key is required")
    
    return OpenAIProvider(config, api_key)