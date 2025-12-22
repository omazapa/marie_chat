"""
LLM Service
Manages conversations, messages, and LLM interactions
"""
from datetime import datetime
from typing import Dict, Any, Optional, AsyncGenerator
import uuid
from opensearchpy import OpenSearch
from app.db import opensearch_client
from app.services.provider_factory import provider_factory
from app.services.llm_provider import ChatMessage


class LLMService:
    """Service for managing LLM interactions and message persistence"""
    
    def __init__(self):
        self.client: OpenSearch = opensearch_client.client
        self.provider_factory = provider_factory
    
    # ==================== Conversation Management ====================
    
    async def create_conversation(
        self,
        user_id: str,
        title: str = "New Conversation",
        model: str = "llama3.2",
        provider: str = "ollama",
        system_prompt: Optional[str] = None,
        settings: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create a new conversation"""
        conversation_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        conversation = {
            "id": conversation_id,
            "user_id": user_id,
            "title": title,
            "model": model,
            "provider": provider,
            "system_prompt": system_prompt,
            "settings": settings or {},
            "message_count": 0,
            "last_message_at": None,
            "created_at": now,
            "updated_at": now
        }
        
        self.client.index(
            index="marie_conversations",
            id=conversation_id,
            body=conversation,
            refresh=True
        )
        
        return conversation
    
    async def get_conversation(self, conversation_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a conversation by ID"""
        try:
            result = self.client.get(
                index="marie_conversations",
                id=conversation_id
            )
            
            conversation = result["_source"]
            
            # Verify ownership
            if conversation["user_id"] != user_id:
                return None
            
            return conversation
        except Exception as e:
            print(f"Error getting conversation: {e}")
            return None
    
    async def list_conversations(
        self,
        user_id: str,
        limit: int = 50,
        offset: int = 0
    ) -> list[Dict[str, Any]]:
        """List conversations for a user"""
        try:
            query = {
                "query": {
                    "term": {"user_id": user_id}
                },
                "sort": [{"updated_at": {"order": "desc"}}],
                "from": offset,
                "size": limit
            }
            
            result = self.client.search(
                index="marie_conversations",
                body=query
            )
            
            conversations = [hit["_source"] for hit in result["hits"]["hits"]]
            return conversations
        except Exception as e:
            print(f"Error listing conversations: {e}")
            return []
    
    async def update_conversation(
        self,
        conversation_id: str,
        user_id: str,
        **updates
    ) -> bool:
        """Update conversation fields"""
        try:
            # Verify ownership first
            conversation = await self.get_conversation(conversation_id, user_id)
            if not conversation:
                return False
            
            updates["updated_at"] = datetime.utcnow().isoformat()
            
            self.client.update(
                index="marie_conversations",
                id=conversation_id,
                body={"doc": updates},
                refresh=True
            )
            
            return True
        except Exception as e:
            print(f"Error updating conversation: {e}")
            return False
    
    async def delete_conversation(self, conversation_id: str, user_id: str) -> bool:
        """Delete a conversation and all its messages"""
        try:
            # Verify ownership
            conversation = await self.get_conversation(conversation_id, user_id)
            if not conversation:
                return False
            
            # Delete all messages in the conversation
            self.client.delete_by_query(
                index="marie_messages",
                body={
                    "query": {
                        "term": {"conversation_id": conversation_id}
                    }
                },
                refresh=True
            )
            
            # Delete the conversation
            self.client.delete(
                index="marie_conversations",
                id=conversation_id,
                refresh=True
            )
            
            return True
        except Exception as e:
            print(f"Error deleting conversation: {e}")
            return False
    
    # ==================== Message Management ====================
    
    async def save_message(
        self,
        conversation_id: str,
        user_id: str,
        role: str,
        content: str,
        tokens_used: int = 0,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Save a message to OpenSearch"""
        message_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        message = {
            "id": message_id,
            "conversation_id": conversation_id,
            "user_id": user_id,
            "role": role,
            "content": content,
            "tokens_used": tokens_used,
            "metadata": metadata or {},
            "created_at": now
        }
        
        self.client.index(
            index="marie_messages",
            id=message_id,
            body=message,
            refresh=True
        )
        
        # Update conversation metadata
        await self._update_conversation_metadata(conversation_id)
        
        return message
    
    async def get_messages(
        self,
        conversation_id: str,
        user_id: str,
        limit: int = 100,
        offset: int = 0
    ) -> list[Dict[str, Any]]:
        """Get messages for a conversation"""
        try:
            # Verify conversation ownership
            conversation = await self.get_conversation(conversation_id, user_id)
            if not conversation:
                return []
            
            query = {
                "query": {
                    "term": {"conversation_id": conversation_id}
                },
                "sort": [{"created_at": {"order": "asc"}}],
                "from": offset,
                "size": limit
            }
            
            result = self.client.search(
                index="marie_messages",
                body=query
            )
            
            messages = [hit["_source"] for hit in result["hits"]["hits"]]
            return messages
        except Exception as e:
            print(f"Error getting messages: {e}")
            return []
    
    async def _update_conversation_metadata(self, conversation_id: str):
        """Update conversation message count and last message time"""
        try:
            # Count messages
            count_result = self.client.count(
                index="marie_messages",
                body={
                    "query": {
                        "term": {"conversation_id": conversation_id}
                    }
                }
            )
            
            message_count = count_result["count"]
            now = datetime.utcnow().isoformat()
            
            self.client.update(
                index="marie_conversations",
                id=conversation_id,
                body={
                    "doc": {
                        "message_count": message_count,
                        "last_message_at": now,
                        "updated_at": now
                    }
                },
                refresh=True
            )
        except Exception as e:
            print(f"Error updating conversation metadata: {e}")
    
    # ==================== Chat Completion ====================
    
    async def chat_completion(
        self,
        conversation_id: str,
        user_id: str,
        user_message: str,
        stream: bool = True
    ) -> AsyncGenerator[Dict[str, Any], None] | Dict[str, Any]:
        """
        Send a message and get LLM response
        
        Args:
            conversation_id: Conversation ID
            user_id: User ID
            user_message: User's message content
            stream: Whether to stream the response
        
        Returns:
            AsyncGenerator if stream=True, Dict otherwise
        """
        print(f"[SERVICE] chat_completion ENTRY: conv={conversation_id[:8]}, stream={stream}")
        # Get conversation
        conversation = await self.get_conversation(conversation_id, user_id)
        print(f"[SERVICE] Got conversation")
        if not conversation:
            raise ValueError("Conversation not found or access denied")
        
        # Save user message
        print(f"[SERVICE] Saving user message")
        await self.save_message(
            conversation_id=conversation_id,
            user_id=user_id,
            role="user",
            content=user_message
        )
        
        # Get conversation history
        messages = await self.get_messages(conversation_id, user_id, limit=50)
        
        # Build messages array for LLM
        llm_messages = []
        
        # Add system prompt if exists
        if conversation.get("system_prompt"):
            llm_messages.append({
                "role": "system",
                "content": conversation["system_prompt"]
            })
        
        # Add conversation history
        for msg in messages:
            llm_messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })
        
        # Get model settings
        model = conversation.get("model", "llama3.2")
        settings = conversation.get("settings", {})
        temperature = settings.get("temperature", 0.7)
        max_tokens = settings.get("max_tokens", 2048)
        
        print(f"[SERVICE] chat_completion called: model={model}, stream={stream}, temp={temperature}")
        
        # Call LLM
        if not stream:
            # Non-streaming: call method directly and await it
            return await self._non_stream_completion(
                conversation_id=conversation_id,
                user_id=user_id,
                model=model,
                messages=llm_messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
        
        # Streaming: return the generator
        print(f"[SERVICE] Returning stream completion generator")
        return self._stream_completion(
            conversation_id=conversation_id,
            user_id=user_id,
            model=model,
            messages=llm_messages,
            temperature=temperature,
            max_tokens=max_tokens
        )
        """Non-streaming chat completion"""
        # Get conversation to determine provider
        conversation = await self.get_conversation(conversation_id, user_id)
        provider_name = conversation.get('provider', 'ollama') if conversation else 'ollama'
        
        # Get provider
        provider = self.provider_factory.get_provider(provider_name)
        if not provider:
            raise ValueError(f"Provider {provider_name} not found")
        
        # Convert messages to ChatMessage objects
        chat_messages = [ChatMessage(role=m['role'], content=m['content']) for m in messages]
        
        # Get completion (non-streaming yields single chunk)
        async for chunk in provider.chat_completion(
            model=model,
            messages=chat_messages,
            stream=False,
            temperature=temperature,
            max_tokens=max_tokens
        ):
            result = chunk
        
        # Save assistant message
        assistant_message = await self.save_message(
            conversation_id=conversation_id,
            user_id=user_id,
            role="assistant",
            content=result.content,
            tokens_used=result.tokens_used or 0,
            metadata={"model": model, "provider": provider_name}
        )
        
        return assistant_message
    
    async def _stream_completion(
        self,
        conversation_id: str,
        user_id: str,
        model: str,
        messages: list[Dict[str, str]],
        temperature: float,
        max_tokens: int
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Streaming chat completion"""
        print(f"[SERVICE] _stream_completion called for conversation {conversation_id}")
        # Get conversation to determine provider
        conversation = await self.get_conversation(conversation_id, user_id)
        provider_name = conversation.get('provider', 'ollama') if conversation else 'ollama'
        print(f"[SERVICE] Using provider: {provider_name}")
        
        # Get provider
        provider = self.provider_factory.get_provider(provider_name)
        if not provider:
            raise ValueError(f"Provider {provider_name} not found")
        print(f"[SERVICE] Got provider instance")
        
        # Convert messages to ChatMessage objects
        chat_messages = [ChatMessage(role=m['role'], content=m['content']) for m in messages]
        print(f"[SERVICE] Converted {len(chat_messages)} messages")
        
        full_content = ""
        total_tokens = 0
        saved = False
        
        print(f"[SERVICE] Starting provider.chat_completion iteration")
        async for chunk in provider.chat_completion(
            model=model,
            messages=chat_messages,
            stream=True,
            temperature=temperature,
            max_tokens=max_tokens
        ):
            full_content += chunk.content
            total_tokens = chunk.tokens_used or total_tokens
            
            # Yield chunk to client (convert to legacy format)
            yield {
                "content": chunk.content,
                "done": chunk.done,
                "model": chunk.model,
                "tokens_used": chunk.tokens_used
            }
            
            # Save complete message when done
            if chunk.done:
                await self.save_message(
                    conversation_id=conversation_id,
                    user_id=user_id,
                    role="assistant",
                    content=full_content,
                    tokens_used=total_tokens,
                    metadata={"model": model, "provider": provider_name}
                )
                saved = True
        
        # Final check: if loop finished but message wasn't saved (e.g. done flag missing)
        if not saved and full_content:
            print(f"[SERVICE] Final save for conversation {conversation_id} (done flag was missing)")
            await self.save_message(
                conversation_id=conversation_id,
                user_id=user_id,
                role="assistant",
                content=full_content,
                tokens_used=total_tokens,
                metadata={"model": model, "provider": provider_name}
            )


# Global instance
llm_service = LLMService()
