"""
LLM Service
Manages conversations, messages, and LLM interactions
"""
from datetime import datetime
from typing import Dict, Any, Optional, AsyncGenerator, List
import uuid
from opensearchpy import OpenSearch
from app.db import opensearch_client
from app.services.provider_factory import provider_factory
from app.services.llm_provider import ChatMessage
from app.services.opensearch_service import OpenSearchService
from app.services.reference_service import ReferenceService


class LLMService:
    """Service for managing LLM interactions and message persistence"""
    
    def __init__(self):
        self.client: OpenSearch = opensearch_client.client
        self.provider_factory = provider_factory
        self.opensearch_service = OpenSearchService()
        self.reference_service = ReferenceService(self.opensearch_service)
    
    # ==================== Conversation Management ====================
    
    def create_conversation(
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
    
    def get_conversation(self, conversation_id: str, user_id: str) -> Optional[Dict[str, Any]]:
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
    
    def list_conversations(
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
    
    def update_conversation(
        self,
        conversation_id: str,
        user_id: str,
        **updates
    ) -> bool:
        """Update conversation fields"""
        try:
            # Verify ownership first
            conversation = self.get_conversation(conversation_id, user_id)
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
    
    def delete_conversation(self, conversation_id: str, user_id: str) -> bool:
        """Delete a conversation and all its messages"""
        try:
            # Verify ownership
            conversation = self.get_conversation(conversation_id, user_id)
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
    
    def save_message(
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
        self._update_conversation_metadata(conversation_id)
        
        return message
    
    def get_messages(
        self,
        conversation_id: str,
        user_id: str,
        limit: int = 100,
        offset: int = 0
    ) -> list[Dict[str, Any]]:
        """Get messages for a conversation (most recent first, then reversed to chronological)"""
        try:
            # Verify conversation ownership
            conversation = self.get_conversation(conversation_id, user_id)
            if not conversation:
                return []
            
            query = {
                "query": {
                    "term": {"conversation_id": conversation_id}
                },
                "sort": [{"created_at": {"order": "desc"}}],
                "from": offset,
                "size": limit
            }
            
            result = self.client.search(
                index="marie_messages",
                body=query
            )
            
            messages = [hit["_source"] for hit in result["hits"]["hits"]]
            messages.reverse()
            return messages
        except Exception as e:
            print(f"Error getting messages: {e}")
            return []
    
    def delete_messages_after(self, conversation_id: str, user_id: str, timestamp: str, inclusive: bool = False) -> bool:
        """Delete all messages in a conversation created after (or at) a certain timestamp"""
        try:
            # Verify ownership
            conversation = self.get_conversation(conversation_id, user_id)
            if not conversation:
                return False
            
            range_query = {"gte": timestamp} if inclusive else {"gt": timestamp}
            
            query = {
                "query": {
                    "bool": {
                        "must": [
                            {"term": {"conversation_id": conversation_id}},
                            {"range": {"created_at": range_query}}
                        ]
                    }
                }
            }
            
            self.client.delete_by_query(
                index="marie_messages",
                body=query,
                refresh=True
            )
            
            # Update conversation metadata
            self._update_conversation_metadata(conversation_id)
            return True
        except Exception as e:
            print(f"Error deleting messages after: {e}")
            return False
    
    def _update_conversation_metadata(self, conversation_id: str):
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
        stream: bool = True,
        attachments: Optional[List[Dict[str, Any]]] = None,
        referenced_conv_ids: Optional[List[str]] = None
    ) -> AsyncGenerator[Dict[str, Any], None] | Dict[str, Any]:
        """
        Send a message and get LLM response
        
        Args:
            conversation_id: Conversation ID
            user_id: User ID
            user_message: User's message content
            stream: Whether to stream the response
            attachments: Optional list of file attachments with extracted text
            referenced_conv_ids: Optional list of conversation IDs to reference
        
        Returns:
            AsyncGenerator if stream=True, Dict otherwise
        """
        print(f"[SERVICE] chat_completion ENTRY: conv={conversation_id[:8]}, stream={stream}")
        # Get conversation
        conversation = self.get_conversation(conversation_id, user_id)
        print(f"[SERVICE] Got conversation")
        if not conversation:
            raise ValueError("Conversation not found or access denied")
        
        # Build context with references if any
        references_metadata = None
        if referenced_conv_ids:
            print(f"[SERVICE] Building context for {len(referenced_conv_ids)} references")
            # Fetch references once to use for both metadata and context
            ref_convs = self.reference_service.get_referenced_conversations(
                referenced_conv_ids, 
                user_id
            )
            
            # Prepare metadata for the UI
            references_metadata = [
                {"id": c["id"], "title": c["title"]} for c in ref_convs
            ]
            
            # Build context string manually or update build_context_with_references to accept pre-fetched convs
            user_message_with_context = self.reference_service.build_context_with_references(
                user_message=user_message,
                referenced_conv_ids=referenced_conv_ids,
                user_id=user_id
            )
            print(f"[SERVICE] Context built, length: {len(user_message_with_context)}")
        else:
            user_message_with_context = user_message

        # Save user message with attachments and references in metadata
        print(f"[SERVICE] Saving user message")
        saved_user_msg = self.save_message(
            conversation_id=conversation_id,
            user_id=user_id,
            role="user",
            content=user_message,
            metadata={
                "attachments": attachments,
                "referenced_conv_ids": referenced_conv_ids,
                "references": references_metadata
            } if attachments or referenced_conv_ids else None
        )
        current_msg_id = saved_user_msg["id"]

        # Get conversation history
        messages = self.get_messages(conversation_id, user_id, limit=50)
        print(f"[SERVICE] Retrieved {len(messages)} messages for history")
        
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
            # If it's the current message, use the context-enriched version
            if msg["id"] == current_msg_id:
                content = user_message_with_context
            else:
                content = msg["content"]
            
            # If message has attachments, prepend extracted text to the content for the LLM
            msg_metadata = msg.get("metadata", {})
            msg_attachments = msg_metadata.get("attachments", [])
            if msg_attachments:
                context_parts = []
                for att in msg_attachments:
                    if att.get("extracted_text"):
                        context_parts.append(f"--- FILE: {att['filename']} ---\n{att['extracted_text']}\n--- END FILE ---")
                
                if context_parts:
                    # If we already have context from references, we append the file context
                    content = "\n".join(context_parts) + "\n\n" + content

            llm_messages.append({
                "role": msg["role"],
                "content": content
            })
        
        # Log the final prompt for debugging (first 500 chars of each message)
        print(f"[DEBUG] Final LLM Messages count: {len(llm_messages)}")
        for i, m in enumerate(llm_messages):
            print(f"[DEBUG] Msg {i} ({m['role']}): {m['content'][:200]}...")
            if "CONTEXTO DE CONVERSACIONES" in m['content']:
                print(f"[DEBUG] Context found in message {i}!")
        
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

    async def _non_stream_completion(
        self,
        conversation_id: str,
        user_id: str,
        model: str,
        messages: list[Dict[str, str]],
        temperature: float,
        max_tokens: int
    ) -> Dict[str, Any]:
        """Non-streaming chat completion"""
        # Get conversation to determine provider
        conversation = self.get_conversation(conversation_id, user_id)
        provider_name = conversation.get('provider', 'ollama') if conversation else 'ollama'
        
        # Get provider
        provider = self.provider_factory.get_provider(provider_name)
        if not provider:
            raise ValueError(f"Provider {provider_name} not found")
        
        # Convert messages to ChatMessage objects
        chat_messages = [ChatMessage(role=m['role'], content=m['content']) for m in messages]
        
        # Get completion (non-streaming yields single chunk)
        result = None
        async for chunk in provider.chat_completion(
            model=model,
            messages=chat_messages,
            stream=False,
            temperature=temperature,
            max_tokens=max_tokens
        ):
            result = chunk
        
        if not result:
            raise ValueError("No response from provider")

        # Save assistant message
        assistant_message = self.save_message(
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
        conversation = self.get_conversation(conversation_id, user_id)
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
                self.save_message(
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
            self.save_message(
                conversation_id=conversation_id,
                user_id=user_id,
                role="assistant",
                content=full_content,
                tokens_used=total_tokens,
                metadata={"model": model, "provider": provider_name}
            )


# Global instance
llm_service = LLMService()
