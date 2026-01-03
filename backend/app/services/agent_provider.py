"""
Agent Provider Implementation
Proxy provider for external agentic systems (LangGraph, LangServe, etc.)
"""

import json
from collections.abc import AsyncGenerator
from typing import Any

import httpx

from app.domain.entities.chat import ChatCompletionChunk, ChatMessage, ModelInfo

from .llm_provider import LLMProvider


class AgentProvider(LLMProvider):
    """
    Provider for external agentic systems.
    Acts as a proxy to systems like LangGraph Cloud or custom LangServe deployments.
    """

    def __init__(self, config: dict[str, Any] | None = None):
        super().__init__(config)
        self.base_url = self.config.get("base_url", "")
        self.api_key = self.config.get("api_key", "")
        self._schema_cache: dict[str, Any] = {}

    def list_models(self) -> list[ModelInfo]:
        """
        List available agents from the external service by parsing its OpenAPI schema.
        If the service doesn't support discovery, returns a default 'agent' model.
        """
        print(f"🔍 AgentProvider: Listing models from {self.base_url}")
        if not self.base_url:
            print("⚠️ AgentProvider: No base_url configured")
            return []

        try:
            # Try to discover models via LangServe openapi.json
            import httpx

            with httpx.Client(timeout=5.0) as client:
                # Ensure base_url doesn't end with slash for joining
                base = self.base_url.rstrip("/")
                print(f"🔍 AgentProvider: Fetching {base}/openapi.json")
                response = client.get(f"{base}/openapi.json")

                if response.status_code == 200:
                    schema = response.json()
                    paths = schema.get("paths", {})
                    print(f"🔍 AgentProvider: Found {len(paths)} paths in OpenAPI")

                    # Find all unique base paths that have an /invoke endpoint
                    # e.g., /llama3/invoke -> llama3
                    discovered_ids = set()
                    for path in paths.keys():
                        if path.endswith("/invoke") and "{" not in path:
                            # Strip leading slash and trailing /invoke
                            model_id = path[1:-7] if path.startswith("/") else path[:-7]
                            if model_id:
                                discovered_ids.add(model_id)

                    if discovered_ids:
                        print(f"✅ AgentProvider: Discovered models: {discovered_ids}")
                        return [
                            ModelInfo(
                                id=mid,
                                name=mid.replace("_", " ").title(),
                                description=f"Remote agent at /{mid}",
                                context_length=128000,
                                provider="agent",
                            )
                            for mid in sorted(discovered_ids)
                        ]
                else:
                    print(f"⚠️ AgentProvider: openapi.json returned status {response.status_code}")

            print("ℹ️ AgentProvider: Falling back to default model")
            # Fallback to default agent model plus any configured in settings
            default_agent = ModelInfo(
                id="external-agent",
                name="External Agent",
                description="Custom agentic system via remote API",
                context_length=128000,
                provider="agent",
            )

            # If the user provided specific model IDs in config, add them
            custom_models = self.config.get("models", [])
            if not custom_models:
                return [default_agent]

            return [
                ModelInfo(
                    id=m.get("id", "agent"),
                    name=m.get("name", "Agent"),
                    description=m.get("description", "Remote Agent"),
                    context_length=m.get("context_length", 128000),
                    provider="agent",
                )
                for m in custom_models
            ]
        except Exception as e:
            print(f"Error discovering models from AgentProvider: {e}")
            return []

    def get_model_info(self, model_id: str) -> ModelInfo | None:
        models = self.list_models()
        return next((m for m in models if m.id == model_id), None)

    async def _get_input_schema(self, model: str) -> dict[str, Any] | None:
        """Fetch and cache the input schema for a specific model"""
        if model in self._schema_cache:
            return self._schema_cache[model]

        base = self.base_url.rstrip("/")
        url = (
            f"{base}/input_schema" if model == "external-agent" else f"{base}/{model}/input_schema"
        )

        async with httpx.AsyncClient(timeout=5.0) as client:
            try:
                response = await client.get(url)
                if response.status_code == 200:
                    schema = response.json()
                    self._schema_cache[model] = schema
                    return schema
            except Exception as e:
                print(f"🔍 AgentProvider: Error fetching input schema for {model}: {e}")
        return None

    async def _prepare_payload(
        self, model: str, messages: list[ChatMessage], temperature: float, **kwargs
    ) -> dict[str, Any]:
        """Builds the payload based on the remote agent's input schema"""
        schema = await self._get_input_schema(model)
        print(f"🔍 AgentProvider: Schema for {model}: {schema}")

        input_data = {}
        last_message = messages[-1].content if messages else ""

        # Adaptive input mapping
        # Some schemas might not have "type": "object" but have "properties"
        if schema and (schema.get("type") == "object" or "properties" in schema):
            properties = schema.get("properties", {})
            print(f"🔍 AgentProvider: Properties found: {list(properties.keys())}")

            if "messages" in properties:
                # Standard chat history
                input_data = {"messages": [m.to_dict() for m in messages]}
            elif len(properties) == 1:
                # Single property (e.g., 'topic', 'input', 'question')
                prop_name = list(properties.keys())[0]
                input_data = {prop_name: last_message}
                print(f"🔍 AgentProvider: Mapping last message to single property '{prop_name}'")
            elif "topic" in properties:
                input_data = {"topic": last_message}
            elif "input" in properties:
                input_data = {"input": last_message}
            elif "question" in properties:
                input_data = {"question": last_message}
            else:
                # Fallback to messages
                input_data = {"messages": [m.to_dict() for m in messages]}
        elif schema and schema.get("type") == "string":
            # Simple string input
            input_data = last_message
        else:
            # No schema or unknown type, fallback to standard messages format
            print("⚠️ AgentProvider: No clear schema, falling back to 'messages' format")
            input_data = {"messages": [m.to_dict() for m in messages]}

        payload = {"input": input_data}

        # Only add config if there are relevant settings to pass
        # and if it's not a simple string input (which usually doesn't take config)
        if isinstance(input_data, dict):
            payload["config"] = {"configurable": {"temperature": temperature, **kwargs}}

        print(f"🚀 AgentProvider: Prepared payload: {json.dumps(payload)[:200]}...")
        return payload

    async def chat_completion(
        self,
        model: str,
        messages: list[ChatMessage],
        stream: bool = True,
        temperature: float = 0.7,
        max_tokens: int | None = None,
        **kwargs,
    ) -> AsyncGenerator[ChatCompletionChunk, None]:
        """
        Proxy chat completion to external agent
        """
        if not self.base_url:
            yield ChatCompletionChunk(content="Error: Agent Provider base URL not configured.")
            return

        # Prepare payload dynamically based on schema
        payload = await self._prepare_payload(model, messages, temperature, **kwargs)

        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        if stream:
            async for chunk in self._stream_remote(model, payload, headers):
                yield chunk
        else:
            result = await self._call_remote(model, payload, headers)
            yield result

    def chat_completion_sync(
        self,
        model: str,
        messages: list[ChatMessage],
        temperature: float = 0.7,
        max_tokens: int | None = None,
        **kwargs,
    ) -> ChatCompletionChunk:
        """
        Synchronous chat completion (not recommended for agents, but required by interface)
        """
        import asyncio

        try:
            # Get the current event loop or create a new one
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)

            # Run the async call in the event loop
            return loop.run_until_complete(
                self._call_remote_sync_wrapper(model, messages, temperature, max_tokens, **kwargs)
            )
        except Exception as e:
            return ChatCompletionChunk(content=f"Error in sync call: {str(e)}")

    async def _call_remote_sync_wrapper(self, *args, **kwargs):
        # Helper to call the async _call_remote from sync context
        model = args[0]
        messages = args[1]
        temperature = args[2]

        payload = await self._prepare_payload(model, messages, temperature, **kwargs)

        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return await self._call_remote(model, payload, headers)

    async def _call_remote(self, model: str, payload: dict, headers: dict) -> ChatCompletionChunk:
        """Non-streaming call to external agent"""
        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                # Construct URL based on model ID
                # If model is 'external-agent', we use the base URL directly
                base = self.base_url.rstrip("/")
                url = f"{base}/invoke" if model == "external-agent" else f"{base}/{model}/invoke"

                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                result = response.json()

                # Extract content from LangServe/LangGraph response format
                output = result.get("output", {})
                content = ""
                if isinstance(output, dict) and "messages" in output:
                    content = output["messages"][-1].get("content", "")
                elif isinstance(output, str):
                    content = output
                else:
                    content = str(output)

                return ChatCompletionChunk(content=content)
            except Exception as e:
                return ChatCompletionChunk(content=f"Error calling remote agent: {str(e)}")

    async def _stream_remote(
        self, model: str, payload: dict, headers: dict
    ) -> AsyncGenerator[ChatCompletionChunk, None]:
        """Streaming call to external agent"""
        import eventlet

        async with httpx.AsyncClient(timeout=300.0) as client:
            try:
                # Construct URL based on model ID
                base = self.base_url.rstrip("/")
                url = f"{base}/stream" if model == "external-agent" else f"{base}/{model}/stream"

                print(f"[AGENT] Streaming from {url}")
                async with client.stream("POST", url, json=payload, headers=headers) as response:
                    print(f"[AGENT] Got response status: {response.status_code}")
                    response.raise_for_status()

                    async for line in response.aiter_lines():
                        if not line or line.startswith(":"):
                            continue

                        if line.startswith("data: "):
                            data_str = line[6:]
                            if data_str.strip() == "[DONE]":
                                print("[AGENT] Stream completed")
                                yield ChatCompletionChunk(content="", done=True)
                                break

                            try:
                                data = json.loads(data_str)
                                content = self._extract_content_from_chunk(data)
                                if content:
                                    print(f"[AGENT] Chunk: {content[:50]}...")
                                    yield ChatCompletionChunk(content=content, done=False)
                                    # Yield control to eventlet
                                    eventlet.sleep(0)
                            except json.JSONDecodeError as e:
                                print(f"[AGENT] JSON decode error: {e}")
                                continue

                    # Ensure final done signal
                    yield ChatCompletionChunk(content="", done=True)

            except Exception as e:
                print(f"[AGENT] Error streaming: {e}")
                import traceback

                traceback.print_exc()
                yield ChatCompletionChunk(content=f"\n\nError: {str(e)}", done=True)

    def _extract_content_from_chunk(self, chunk: Any) -> str:
        """Extracts text content from various LangGraph/LangServe chunk formats"""
        # Format 0: Raw string chunk (common in simple LangServe streams)
        if isinstance(chunk, str):
            return chunk

        # Format 1: LangServe stream_log (JSON Patch)
        if isinstance(chunk, dict) and "ops" in chunk:
            for op in chunk["ops"]:
                if op.get("path", "").endswith("/content"):
                    return op.get("value", "")

        # Format 2: Simple message chunk
        if isinstance(chunk, dict) and "content" in chunk:
            return chunk["content"]

        return ""

    def validate_connection(self) -> bool:
        """Check if the remote service is reachable"""
        if not self.base_url:
            return False

        try:
            # Try a simple GET to the base URL or a health endpoint
            import httpx

            with httpx.Client(timeout=5.0) as client:
                response = client.get(self.base_url)
                return response.status_code < 500
        except Exception:
            return False
