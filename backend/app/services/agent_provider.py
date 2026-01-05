"""
Agent Provider Implementation
Proxy provider for external agentic systems (LangGraph, LangServe, OpenAI-compatible)
Supports both LangServe and OpenAI protocols automatically
"""

import json
from collections.abc import AsyncGenerator
from typing import Any, Literal

import httpx

from app.domain.entities.agent_config import ConfigField
from app.domain.entities.chat import ChatCompletionChunk, ChatMessage, ModelInfo

from .llm_provider import LLMProvider

AgentType = Literal["openai", "langserve", "unknown"]


class AgentProvider(LLMProvider):
    """
    Provider for external agentic systems.
    Supports both OpenAI-compatible and LangServe protocols.
    Automatically detects the agent type and uses the appropriate protocol.
    """

    def __init__(self, config: dict[str, Any] | None = None):
        super().__init__(config)
        self.base_url = self.config.get("base_url", "")
        self.api_key = self.config.get("api_key", "")
        self._schema_cache: dict[str, Any] = {}
        self._agent_types: dict[str, AgentType] = {}  # Cache detected agent types

    def list_models(self) -> list[ModelInfo]:
        """
        List available agents from the external service.
        Auto-detects protocol type (OpenAI vs LangServe) and caches it.

        Discovery strategies:
        1. OpenAI-compatible /v1/models (Open WebUI, standard OpenAI servers)
        2. LangServe /openapi.json (LangGraph Cloud, custom LangServe)
        3. Fallback to default agent
        """
        print(f"🔍 AgentProvider: Listing models from {self.base_url}")
        if not self.base_url:
            print("⚠️ AgentProvider: No base_url configured")
            return []

        try:
            import httpx

            with httpx.Client(timeout=5.0) as client:
                base = self.base_url.rstrip("/")

                # Strategy 1: Try OpenAI-compatible /v1/models first
                try:
                    headers = {}
                    if self.api_key:
                        headers["Authorization"] = f"Bearer {self.api_key}"

                    print(f"🔍 AgentProvider: Trying OpenAI format at {base}/v1/models")
                    response = client.get(f"{base}/v1/models", headers=headers)

                    if response.status_code == 200:
                        data = response.json()
                        models_data = data.get("data", [])

                        if models_data:
                            print(
                                f"✅ AgentProvider: Discovered {len(models_data)} OpenAI-compatible models"
                            )
                            discovered_models = []
                            for model in models_data:
                                model_id = model.get("id")
                                if model_id:
                                    # Mark as OpenAI type
                                    self._agent_types[model_id] = "openai"
                                    discovered_models.append(
                                        ModelInfo(
                                            id=model_id,
                                            name=model.get("name", model_id),
                                            description=f"OpenAI-compatible agent: {model.get('name', model_id)}",
                                            context_length=model.get("context_length", 128000),
                                            provider="agent",
                                        )
                                    )
                            return discovered_models
                except Exception as e:
                    print(f"⚠️ AgentProvider: OpenAI /v1/models failed: {e}")

                # Strategy 2: Try LangServe openapi.json discovery
                try:
                    print(f"🔍 AgentProvider: Trying LangServe format at {base}/openapi.json")
                    response = client.get(f"{base}/openapi.json")

                    if response.status_code == 200:
                        schema = response.json()
                        paths = schema.get("paths", {})
                        print(f"🔍 AgentProvider: Found {len(paths)} paths in OpenAPI")

                        # Find all unique base paths that have an /invoke endpoint
                        discovered_ids = set()
                        for path in paths.keys():
                            if path.endswith("/invoke") and "{" not in path:
                                model_id = path[1:-7] if path.startswith("/") else path[:-7]
                                if model_id:
                                    discovered_ids.add(model_id)

                        if discovered_ids:
                            print(
                                f"✅ AgentProvider: Discovered {len(discovered_ids)} LangServe agents"
                            )
                            discovered_models = []
                            for mid in sorted(discovered_ids):
                                # Mark as LangServe type
                                self._agent_types[mid] = "langserve"
                                discovered_models.append(
                                    ModelInfo(
                                        id=mid,
                                        name=mid.replace("_", " ").title(),
                                        description=f"LangServe agent at /{mid}",
                                        context_length=128000,
                                        provider="agent",
                                    )
                                )
                            return discovered_models
                except Exception as e:
                    print(f"⚠️ AgentProvider: LangServe openapi.json failed: {e}")

            print("ℹ️ AgentProvider: Falling back to default model")
            # Fallback to default agent model (type unknown, will detect on first call)
            self._agent_types["external-agent"] = "unknown"
            return [
                ModelInfo(
                    id="external-agent",
                    name="External Agent",
                    description="Custom agentic system via remote API",
                    context_length=128000,
                    provider="agent",
                )
            ]

        except Exception as e:
            print(f"❌ AgentProvider: Error listing models: {e}")
            return []

    def get_model_info(self, model_id: str) -> ModelInfo | None:
        models = self.list_models()
        return next((m for m in models if m.id == model_id), None)

    def _get_agent_type(self, model: str) -> AgentType:
        """
        Get the cached agent type or detect it.

        Returns:
            "openai" for OpenAI-compatible agents
            "langserve" for LangServe/LangGraph agents
            "unknown" if not yet detected
        """
        if model in self._agent_types:
            return self._agent_types[model]

        # If not cached, try to detect by checking available endpoints
        print(f"🔍 Detecting agent type for {model}...")

        base = self.base_url.rstrip("/")
        headers = {}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        try:
            import httpx

            with httpx.Client(timeout=3.0) as client:
                # Check for OpenAI format
                try:
                    response = client.get(f"{base}/v1/models", headers=headers)
                    if response.status_code == 200:
                        data = response.json()
                        model_ids = [m.get("id") for m in data.get("data", [])]
                        if model in model_ids:
                            print(f"✅ Detected {model} as OpenAI-compatible")
                            self._agent_types[model] = "openai"
                            return "openai"
                except Exception:
                    pass

                # Check for LangServe format
                invoke_url = (
                    f"{base}/{model}/invoke" if model != "external-agent" else f"{base}/invoke"
                )
                try:
                    response = client.options(invoke_url, headers=headers)
                    if response.status_code in [200, 204, 405]:  # 405 means POST is expected
                        print(f"✅ Detected {model} as LangServe")
                        self._agent_types[model] = "langserve"
                        return "langserve"
                except Exception:
                    pass

        except Exception as e:
            print(f"⚠️ Could not detect agent type for {model}: {e}")

        # Default to unknown (will try both protocols)
        self._agent_types[model] = "unknown"
        return "unknown"

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

        input_data: dict[str, Any] | str = {}
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

        payload: dict[str, Any] = {"input": input_data}

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
        Proxy chat completion to external agent.
        Automatically uses the correct protocol (OpenAI or LangServe).
        """
        if not self.base_url:
            yield ChatCompletionChunk(content="Error: Agent Provider base URL not configured.")
            return

        # Detect agent type
        agent_type = self._get_agent_type(model)
        print(f"🤖 Using {agent_type} protocol for {model}")

        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        # Use appropriate protocol
        if agent_type == "openai":
            # OpenAI protocol
            if stream:
                async for chunk in self._stream_openai(
                    model, messages, temperature, max_tokens, headers, **kwargs
                ):
                    yield chunk
            else:
                result = await self._call_openai(
                    model, messages, temperature, max_tokens, headers, **kwargs
                )
                yield result
        else:
            # LangServe protocol (or unknown - fallback to LangServe)
            payload = await self._prepare_payload(model, messages, temperature, **kwargs)
            if stream:
                async for chunk in self._stream_langserve(model, payload, headers):
                    yield chunk
            else:
                result = await self._call_langserve(model, payload, headers)
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
        """Non-streaming call to external agent (LangServe format) - DEPRECATED, use _call_langserve"""
        return await self._call_langserve(model, payload, headers)

    async def _call_langserve(
        self, model: str, payload: dict, headers: dict
    ) -> ChatCompletionChunk:
        """Non-streaming call to LangServe agent"""
        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                base = self.base_url.rstrip("/")
                url = f"{base}/invoke" if model == "external-agent" else f"{base}/{model}/invoke"

                print(f"[LANGSERVE] Calling {url}")
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
                print(f"❌ [LANGSERVE] Error: {e}")
                return ChatCompletionChunk(content=f"Error calling LangServe agent: {str(e)}")

    async def _call_openai(
        self,
        model: str,
        messages: list[ChatMessage],
        temperature: float,
        max_tokens: int | None,
        headers: dict,
        **kwargs,
    ) -> ChatCompletionChunk:
        """Non-streaming call to OpenAI-compatible agent"""
        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                base = self.base_url.rstrip("/")
                url = f"{base}/v1/chat/completions"

                payload = {
                    "model": model,
                    "messages": [{"role": m.role, "content": m.content} for m in messages],
                    "temperature": temperature,
                    "stream": False,
                }

                if max_tokens:
                    payload["max_tokens"] = max_tokens

                # Add any extra parameters
                payload.update(kwargs)

                print(f"[OPENAI] Calling {url} with model {model}")
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                result = response.json()

                # Extract content from OpenAI response format
                content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                return ChatCompletionChunk(content=content)
            except Exception as e:
                print(f"❌ [OPENAI] Error: {e}")
                return ChatCompletionChunk(content=f"Error calling OpenAI agent: {str(e)}")

    async def _stream_remote(
        self, model: str, payload: dict, headers: dict
    ) -> AsyncGenerator[ChatCompletionChunk, None]:
        """Streaming call to external agent (LangServe format) - DEPRECATED, use _stream_langserve"""
        async for chunk in self._stream_langserve(model, payload, headers):
            yield chunk

    async def _stream_langserve(
        self, model: str, payload: dict, headers: dict
    ) -> AsyncGenerator[ChatCompletionChunk, None]:
        """Streaming call to LangServe agent"""
        import asyncio

        async with httpx.AsyncClient(timeout=300.0) as client:
            try:
                base = self.base_url.rstrip("/")
                url = f"{base}/stream" if model == "external-agent" else f"{base}/{model}/stream"

                print(f"[LANGSERVE] Streaming from {url}")
                async with client.stream("POST", url, json=payload, headers=headers) as response:
                    print(f"[LANGSERVE] Got response status: {response.status_code}")
                    response.raise_for_status()

                    async for line in response.aiter_lines():
                        if not line or line.startswith(":"):
                            continue

                        if line.startswith("data: "):
                            data_str = line[6:]
                            if data_str.strip() == "[DONE]":
                                print("[LANGSERVE] Stream completed")
                                yield ChatCompletionChunk(content="", done=True)
                                break

                            try:
                                data = json.loads(data_str)
                                content = self._extract_content_from_chunk(data)
                                if content:
                                    print(f"[LANGSERVE] Chunk: {content[:50]}...")
                                    yield ChatCompletionChunk(content=content, done=False)
                                    await asyncio.sleep(0)
                            except json.JSONDecodeError as e:
                                print(f"[LANGSERVE] JSON decode error: {e}")
                                continue

                    # Ensure final done signal
                    yield ChatCompletionChunk(content="", done=True)

            except Exception as e:
                print(f"❌ [LANGSERVE] Streaming error: {e}")
                import traceback

                traceback.print_exc()
                yield ChatCompletionChunk(
                    content=f"Error streaming from LangServe: {str(e)}", done=True
                )

    async def _stream_openai(
        self,
        model: str,
        messages: list[ChatMessage],
        temperature: float,
        max_tokens: int | None,
        headers: dict,
        **kwargs,
    ) -> AsyncGenerator[ChatCompletionChunk, None]:
        """Streaming call to OpenAI-compatible agent"""
        import asyncio

        async with httpx.AsyncClient(timeout=300.0) as client:
            try:
                base = self.base_url.rstrip("/")
                url = f"{base}/v1/chat/completions"

                payload = {
                    "model": model,
                    "messages": [{"role": m.role, "content": m.content} for m in messages],
                    "temperature": temperature,
                    "stream": True,
                }

                if max_tokens:
                    payload["max_tokens"] = max_tokens

                # Add any extra parameters
                payload.update(kwargs)

                print(f"[OPENAI] Streaming from {url} with model {model}")
                async with client.stream("POST", url, json=payload, headers=headers) as response:
                    print(f"[OPENAI] Got response status: {response.status_code}")
                    response.raise_for_status()

                    async for line in response.aiter_lines():
                        if not line or line.startswith(":"):
                            continue

                        if line.startswith("data: "):
                            data_str = line[6:]
                            if data_str.strip() == "[DONE]":
                                print("[OPENAI] Stream completed")
                                yield ChatCompletionChunk(content="", done=True)
                                break

                            try:
                                data = json.loads(data_str)
                                # OpenAI format: choices[0].delta.content
                                content = (
                                    data.get("choices", [{}])[0].get("delta", {}).get("content", "")
                                )
                                if content:
                                    print(f"[OPENAI] Chunk: {content[:50]}...")
                                    yield ChatCompletionChunk(content=content, done=False)
                                    await asyncio.sleep(0)
                            except json.JSONDecodeError as e:
                                print(f"[OPENAI] JSON decode error: {e}")
                                continue

                    # Ensure final done signal
                    yield ChatCompletionChunk(content="", done=True)

            except Exception as e:
                print(f"❌ [OPENAI] Streaming error: {e}")
                import traceback

                traceback.print_exc()
                yield ChatCompletionChunk(
                    content=f"Error streaming from OpenAI agent: {str(e)}", done=True
                )
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

    async def get_config_schema(self, model: str) -> dict[str, Any] | None:
        """
        Fetch configuration schema from agent service.

        Tries multiple strategies:
        1. LangServe /config_schema endpoint
        2. Open WebUI /pipelines/{id}/valves endpoint
        3. OpenAPI schema inspection

        Args:
            model: Model/agent identifier

        Returns:
            JSON schema dict or None if not available
        """
        base = self.base_url.rstrip("/")
        headers = {}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        async with httpx.AsyncClient(timeout=5.0) as client:
            # Strategy 1: LangServe config_schema
            try:
                url = (
                    f"{base}/config_schema"
                    if model == "external-agent"
                    else f"{base}/{model}/config_schema"
                )
                response = await client.get(url, headers=headers)
                if response.status_code == 200:
                    schema = response.json()
                    print(f"✅ AgentProvider: Found config_schema for {model}")
                    return schema
            except Exception as e:
                print(f"⚠️ Strategy 1 (config_schema) failed: {e}")

            # Strategy 2: Open WebUI valves (try multiple URL patterns)
            for valves_url_pattern in [
                f"{base}/api/pipelines/{model}/valves",  # Open WebUI with /api
                f"{base}/pipelines/{model}/valves",  # Direct path
                f"{base}/api/v1/pipelines/{model}/valves",  # Alternative API version
            ]:
                try:
                    print(f"🔍 Trying valves at: {valves_url_pattern}")
                    response = await client.get(valves_url_pattern, headers=headers)
                    if response.status_code == 200:
                        valves = response.json()
                        print(f"✅ AgentProvider: Found valves for {model} at {valves_url_pattern}")
                        print(f"📋 Valves content: {valves}")
                        # Convert valves format to JSON schema-like format
                        return self._convert_valves_to_schema(valves)
                except Exception as e:
                    print(f"⚠️ Valves attempt {valves_url_pattern} failed: {e}")
                    continue

            # Strategy 3: Check OpenAPI for configurable hints
            try:
                url = f"{base}/openapi.json"
                response = await client.get(url)
                if response.status_code == 200:
                    openapi = response.json()
                    # Extract schema from OpenAPI if available
                    schema = self._extract_schema_from_openapi(openapi, model)
                    if schema:
                        print(f"✅ AgentProvider: Extracted schema from OpenAPI for {model}")
                        return schema
            except Exception as e:
                print(f"⚠️ Strategy 3 (OpenAPI) failed: {e}")

        print(f"ℹ️ AgentProvider: No configuration schema found for {model}")
        return None

    def parse_schema_to_fields(self, schema: dict[str, Any]) -> list[ConfigField]:
        """
        Convert JSON Schema to list of ConfigField objects.

        Args:
            schema: JSON Schema dict

        Returns:
            List of ConfigField objects
        """
        fields: list[ConfigField] = []

        # Handle LangServe format: {"type": "object", "properties": {"configurable": {...}}}
        if "properties" in schema:
            if "configurable" in schema["properties"]:
                properties = schema["properties"]["configurable"].get("properties", {})
            else:
                properties = schema["properties"]
        else:
            properties = schema

        for key, prop in properties.items():
            field_type = prop.get("type", "string")

            # Map JSON Schema types to our field types
            if field_type == "number":
                field_type = "number"
            elif field_type == "integer":
                field_type = "integer"
            elif field_type == "boolean":
                field_type = "boolean"
            elif "enum" in prop:
                field_type = "enum"
            elif field_type == "array":
                field_type = "array"
            else:
                field_type = "string"

            field = ConfigField(
                key=key,
                label=prop.get("title", key.replace("_", " ").title()),
                type=field_type,  # type: ignore
                default=prop.get("default"),
                description=prop.get("description"),
                min=prop.get("minimum"),
                max=prop.get("maximum"),
                enum_values=prop.get("enum"),
                items_type=prop.get("items", {}).get("type") if field_type == "array" else None,
                required=key in schema.get("required", []),
            )
            fields.append(field)

        return fields

    def _convert_valves_to_schema(self, valves: dict[str, Any]) -> dict[str, Any]:
        """
        Convert Open WebUI valves format to JSON Schema format.

        Valves format (Open WebUI):
        {
          "field_name": {
            "type": "str" | "int" | "float" | "bool",
            "default": value,
            "description": "...",
            "enum": ["a", "b"],  # optional
            "range": [min, max]  # optional for numbers
          }
        }

        Also handles simplified format:
        {
          "field_name": default_value
        }
        """
        print(f"🔄 Converting valves to schema. Input: {valves}")
        properties = {}

        for key, valve_def in valves.items():
            # Handle simplified format (just value, not object)
            if not isinstance(valve_def, dict):
                # Infer type from value
                valve_type: str
                default_val: Any

                if isinstance(valve_def, bool):
                    valve_type = "bool"
                    default_val = valve_def
                elif isinstance(valve_def, int):
                    valve_type = "int"
                    default_val = valve_def
                elif isinstance(valve_def, float):
                    valve_type = "float"
                    default_val = valve_def
                else:
                    valve_type = "str"
                    default_val = str(valve_def)

                valve_def = {
                    "type": valve_type,
                    "default": default_val,
                }

            valve_type_str = valve_def.get("type", "str")

            # Map valve types to JSON Schema types
            if valve_type_str in ["float", "int", "number"]:
                prop_type = "number" if valve_type_str == "float" else "integer"
            elif valve_type_str in ["bool", "boolean"]:
                prop_type = "boolean"
            else:
                prop_type = "string"

            prop: dict[str, Any] = {
                "type": prop_type,
                "title": valve_def.get("title", key.replace("_", " ").title()),
                "default": valve_def.get("default"),
                "description": valve_def.get("description", ""),
            }

            if "enum" in valve_def:
                prop["enum"] = valve_def["enum"]
            if (
                "range" in valve_def
                and isinstance(valve_def["range"], list)
                and len(valve_def["range"]) == 2
            ):
                prop["minimum"] = valve_def["range"][0]
                prop["maximum"] = valve_def["range"][1]

            properties[key] = prop

        schema = {"type": "object", "properties": properties}
        print(f"✅ Converted schema: {schema}")
        return schema

    def _extract_schema_from_openapi(
        self, openapi: dict[str, Any], model: str
    ) -> dict[str, Any] | None:
        """
        Extract configuration schema from OpenAPI specification.

        Looks for config-related request bodies in invoke/stream endpoints.
        """
        paths = openapi.get("paths", {})
        model_path = f"/{model}/invoke" if model != "external-agent" else "/invoke"

        if model_path in paths:
            post_op = paths[model_path].get("post", {})
            request_body = post_op.get("requestBody", {})
            content = request_body.get("content", {})
            json_content = content.get("application/json", {})
            schema = json_content.get("schema", {})

            # Look for config in properties
            if "properties" in schema and "config" in schema["properties"]:
                return schema["properties"]["config"]

        return None
