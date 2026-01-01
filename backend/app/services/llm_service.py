"""
LLM Service
Manages conversations, messages, and LLM interactions
"""
from datetime import datetime
from typing import Dict, Any, Optional, AsyncGenerator, List
import uuid
import re
from opensearchpy import OpenSearch
from sentence_transformers import SentenceTransformer
from app.db import opensearch_client
from app.services.provider_factory import provider_factory
from app.services.llm_provider import ChatMessage
from app.services.opensearch_service import OpenSearchService
from app.services.reference_service import ReferenceService
from app.services.memory_service import memory_service
from app.services.settings_service import settings_service


class LLMService:
    """Service for managing LLM interactions and message persistence"""
    
    def __init__(self):
        self.client: OpenSearch = opensearch_client.client
        self.provider_factory = provider_factory
        self.opensearch_service = OpenSearchService()
        self.reference_service = ReferenceService(self.opensearch_service)
        self.memory_service = memory_service
        self.settings_service = settings_service
        # Lazy-initialize embedding model for semantic search
        self._embedding_model = None
        
    @property
    def embedding_model(self):
        """Lazy-initialize embedding model for semantic search"""
        if self._embedding_model is None:
            print("🧠 Loading embedding model (paraphrase-multilingual-MiniLM-L12-v2)...")
            import torch
            device = "cuda" if torch.cuda.is_available() else "cpu"
            # paraphrase-multilingual-MiniLM-L12-v2 has 384 dimensions
            self._embedding_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2', device=device)
            print(f"✅ Embedding model loaded on {device}")
        return self._embedding_model
    
    # ==================== Conversation Management ====================
    
    def create_conversation(
        self,
        user_id: str,
        title: str = "New Conversation",
        model: Optional[str] = None,
        provider: Optional[str] = None,
        system_prompt: Optional[str] = None,
        settings: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create a new conversation"""
        if not model or not provider:
            config = self.settings_service.get_settings()
            model = model or config.get("llm", {}).get("default_model", "llama3.2")
            provider = provider or config.get("llm", {}).get("default_provider", "ollama")

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
    
    def search_conversations(
        self,
        user_id: str,
        query_text: str,
        limit: int = 20,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Search conversations by title and message content"""
        try:
            # 1. Search by title in marie_conversations
            title_query = {
                "query": {
                    "bool": {
                        "must": [
                            {"term": {"user_id": user_id}},
                            {
                                "multi_match": {
                                    "query": query_text,
                                    "fields": ["title^3", "title.keyword"],
                                    "fuzziness": "AUTO"
                                }
                            }
                        ]
                    }
                },
                "highlight": {
                    "fields": {
                        "title": {}
                    },
                    "pre_tags": ["<mark>"],
                    "post_tags": ["</mark>"]
                },
                "sort": [{"_score": {"order": "desc"}}, {"updated_at": {"order": "desc"}}],
                "size": limit
            }
            
            title_result = self.client.search(
                index="marie_conversations",
                body=title_query
            )
            
            conversation_hits = {}
            for hit in title_result["hits"]["hits"]:
                conv = hit["_source"]
                conv["_score"] = hit["_score"]
                if "highlight" in hit and "title" in hit["highlight"]:
                    conv["highlight_title"] = hit["highlight"]["title"][0]
                conversation_hits[conv["id"]] = conv

            # 2. Search by content in marie_messages
            # We use aggregation to get unique conversation IDs
            message_query = {
                "size": 0, # We only want aggregations
                "query": {
                    "bool": {
                        "must": [
                            {"term": {"user_id": user_id}},
                            {
                                "multi_match": {
                                    "query": query_text,
                                    "fields": ["content"],
                                    "fuzziness": "AUTO"
                                }
                            }
                        ]
                    }
                },
                "aggs": {
                    "unique_conversations": {
                        "terms": {
                            "field": "conversation_id",
                            "size": limit
                        },
                        "aggs": {
                            "top_message_hit": {
                                "top_hits": {
                                    "size": 1,
                                    "highlight": {
                                        "fields": {
                                            "content": {}
                                        },
                                        "pre_tags": ["<mark>"],
                                        "post_tags": ["</mark>"]
                                    }
                                }
                            }
                        }
                    }
                }
            }
            
            message_result = self.client.search(
                index="marie_messages",
                body=message_query
            )
            
            conv_ids_from_messages = []
            message_highlights = {}
            
            for bucket in message_result.get("aggregations", {}).get("unique_conversations", {}).get("buckets", []):
                conv_id = bucket["key"]
                conv_ids_from_messages.append(conv_id)
                
                # Get highlight from the top hit in this bucket
                top_hits = bucket.get("top_message_hit", {}).get("hits", {}).get("hits", [])
                if top_hits and "highlight" in top_hits[0] and "content" in top_hits[0]["highlight"]:
                    message_highlights[conv_id] = top_hits[0]["highlight"]["content"][0]

            # 3. Fetch conversations that matched via messages but not via title
            missing_conv_ids = [cid for cid in conv_ids_from_messages if cid not in conversation_hits]
            
            if missing_conv_ids:
                missing_query = {
                    "query": {
                        "ids": {
                            "values": missing_conv_ids
                        }
                    }
                }
                missing_result = self.client.search(
                    index="marie_conversations",
                    body=missing_query
                )
                for hit in missing_result["hits"]["hits"]:
                    conv = hit["_source"]
                    conv["_score"] = hit["_score"]
                    conversation_hits[conv["id"]] = conv

            # 4. Add message highlights to conversations
            for conv_id, highlight in message_highlights.items():
                if conv_id in conversation_hits:
                    conversation_hits[conv_id]["highlight_message"] = highlight

            # 5. Sort and return
            all_hits = list(conversation_hits.values())
            all_hits.sort(key=lambda x: x.get("_score", 0), reverse=True)
            
            return all_hits[:limit]
        except Exception as e:
            print(f"Error searching conversations: {e}")
            return []

    def search_messages(
        self,
        user_id: str,
        query_text: str,
        conversation_id: Optional[str] = None,
        limit: int = 20,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Hybrid search (text + semantic) in messages"""
        try:
            # Generate embedding for semantic search
            query_vector = self.embedding_model.encode(query_text).tolist()
            
            # Build hybrid query
            # We use a bool query with should for text and knn for vector
            query = {
                "size": limit,
                "from": offset,
                "query": {
                    "bool": {
                        "must": [
                            {"term": {"user_id": user_id}}
                        ],
                        "should": [
                            {
                                "multi_match": {
                                    "query": query_text,
                                    "fields": ["content^2"],
                                    "fuzziness": "AUTO"
                                }
                            }
                        ]
                    }
                },
                "highlight": {
                    "fields": {
                        "content": {}
                    },
                    "pre_tags": ["<mark>"],
                    "post_tags": ["</mark>"]
                }
            }
            
            if conversation_id:
                query["query"]["bool"]["must"].append({"term": {"conversation_id": conversation_id}})
            
            # Add k-NN search
            query["knn"] = {
                "content_vector": {
                    "vector": query_vector,
                    "k": limit
                }
            }
            
            result = self.client.search(
                index="marie_messages",
                body=query
            )
            
            # Process results to include conversation title if possible
            hits = []
            for hit in result["hits"]["hits"]:
                msg = hit["_source"]
                msg["_score"] = hit["_score"]
                
                # Add highlight if available
                if "highlight" in hit and "content" in hit["highlight"]:
                    msg["highlight"] = hit["highlight"]["content"][0]
                
                hits.append(msg)
                
            return hits
        except Exception as e:
            print(f"Error searching messages: {e}")
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
    
    def delete_conversations(self, conversation_ids: List[str], user_id: str) -> bool:
        """Delete multiple conversations and all their messages"""
        try:
            # Delete all messages in these conversations
            self.client.delete_by_query(
                index="marie_messages",
                body={
                    "query": {
                        "bool": {
                            "must": [
                                {"terms": {"conversation_id": conversation_ids}},
                                {"term": {"user_id": user_id}}
                            ]
                        }
                    }
                },
                refresh=True
            )
            
            # Delete the conversations
            self.client.delete_by_query(
                index="marie_conversations",
                body={
                    "query": {
                        "bool": {
                            "must": [
                                {"ids": {"values": conversation_ids}},
                                {"term": {"user_id": user_id}}
                            ]
                        }
                    }
                },
                refresh=True
            )
            
            return True
        except Exception as e:
            print(f"Error deleting conversations: {e}")
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
        """Save a message to OpenSearch with vector embeddings"""
        message_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        # Generate embedding for semantic search
        content_vector = None
        try:
            if content and len(content.strip()) > 0:
                content_vector = self.embedding_model.encode(content).tolist()
        except Exception as e:
            print(f"Error generating embedding: {e}")
        
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
        
        if content_vector:
            message["content_vector"] = content_vector
        
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
        referenced_conv_ids: Optional[List[str]] = None,
        referenced_msg_ids: Optional[List[str]] = None,
        regenerate: bool = False
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
            referenced_msg_ids: Optional list of message IDs to reference
            regenerate: Whether to regenerate the last response (skips saving user message)
        
        Returns:
            AsyncGenerator if stream=True, Dict otherwise
        """
        print(f"[SERVICE] chat_completion ENTRY: conv={conversation_id[:8]}, stream={stream}, regenerate={regenerate}")
        # Get conversation
        conversation = self.get_conversation(conversation_id, user_id)
        print(f"[SERVICE] Got conversation")
        if not conversation:
            raise ValueError("Conversation not found or access denied")
        
        # Build context with references if any
        references_metadata = None
        if referenced_conv_ids or referenced_msg_ids:
            print(f"[SERVICE] Building context for references")
            
            # Prepare metadata for the UI
            references_metadata = []
            
            if referenced_conv_ids:
                ref_convs = self.reference_service.get_referenced_conversations(
                    referenced_conv_ids, 
                    user_id
                )
                references_metadata.extend([
                    {"id": c["id"], "title": c["title"], "type": "conversation"} for c in ref_convs
                ])
            
            if referenced_msg_ids:
                ref_msgs = self.reference_service.get_referenced_messages(
                    referenced_msg_ids,
                    user_id
                )
                references_metadata.extend([
                    {
                        "id": m["id"], 
                        "content": m["content"][:50] + "...", 
                        "type": "message",
                        "conversation_id": m["conversation_id"]
                    } for m in ref_msgs
                ])
            
            # Build context string
            user_message_with_context = self.reference_service.build_context_with_references(
                user_message=user_message,
                referenced_conv_ids=referenced_conv_ids,
                user_id=user_id,
                referenced_msg_ids=referenced_msg_ids
            )
            print(f"[SERVICE] Context built, length: {len(user_message_with_context)}")
        else:
            user_message_with_context = user_message

        # Save user message with attachments and references in metadata
        current_msg_id = None
        if not regenerate:
            print(f"[SERVICE] Saving user message")
            saved_user_msg = self.save_message(
                conversation_id=conversation_id,
                user_id=user_id,
                role="user",
                content=user_message,
                metadata={
                    "attachments": attachments,
                    "referenced_conv_ids": referenced_conv_ids,
                    "referenced_msg_ids": referenced_msg_ids,
                    "references": references_metadata
                } if attachments or referenced_conv_ids or referenced_msg_ids else None
            )
            current_msg_id = saved_user_msg["id"]
            
            # Generate title if it's the first message and title is default
            if conversation.get("message_count", 0) == 0 and conversation.get("title") == "New Conversation":
                import asyncio
                asyncio.create_task(self.generate_conversation_title(conversation_id, user_id, user_message))
        else:
            print(f"[SERVICE] Regenerating: deleting last assistant message")
            # Find and delete the last assistant message
            messages = self.get_messages(conversation_id, user_id, limit=10)
            assistant_deleted = False
            for msg in reversed(messages):
                if msg["role"] == "assistant" and not assistant_deleted:
                    try:
                        self.client.delete(index="marie_messages", id=msg["id"], refresh=True)
                        print(f"[SERVICE] Deleted assistant message {msg['id']}")
                        assistant_deleted = True
                    except Exception as e:
                        print(f"Error deleting message for regeneration: {e}")
                elif msg["role"] == "user" and current_msg_id is None:
                    current_msg_id = msg["id"]
                    print(f"[SERVICE] Found last user message ID for regeneration: {current_msg_id}")

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
        
        # Retrieve relevant memories and add to context
        memories = self.memory_service.retrieve_memories(user_id, user_message)
        if memories:
            memory_context = "--- INFORMACIÓN RECORDADA DEL USUARIO ---\n"
            for mem in memories:
                memory_context += f"- {mem['content']}\n"
            memory_context += "------------------------------------------\n\n"
            
            if llm_messages and llm_messages[0]["role"] == "system":
                llm_messages[0]["content"] = memory_context + llm_messages[0]["content"]
            else:
                llm_messages.insert(0, {
                    "role": "system",
                    "content": memory_context + "Eres Marie, una asistente de investigación inteligente."
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
                max_tokens=max_tokens,
                references_metadata=references_metadata
            )
        
        # Streaming: return the generator
        print(f"[SERVICE] Returning stream completion generator")
        return self._stream_completion(
            conversation_id=conversation_id,
            user_id=user_id,
            model=model,
            messages=llm_messages,
            temperature=temperature,
            max_tokens=max_tokens,
            references_metadata=references_metadata
        )

    async def _non_stream_completion(
        self,
        conversation_id: str,
        user_id: str,
        model: str,
        messages: list[Dict[str, str]],
        temperature: float,
        max_tokens: int,
        references_metadata: Optional[List[Dict[str, Any]]] = None
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

        # Generate follow-ups
        follow_ups = await self.generate_follow_ups(
            model=model,
            provider_name=provider_name,
            history=chat_messages + [ChatMessage(role="assistant", content=result.content)]
        )

        # Save assistant message
        metadata = {"model": model, "provider": provider_name}
        if references_metadata:
            metadata["references"] = references_metadata
        if follow_ups:
            metadata["follow_ups"] = follow_ups

        assistant_message = self.save_message(
            conversation_id=conversation_id,
            user_id=user_id,
            role="assistant",
            content=result.content,
            tokens_used=result.tokens_used or 0,
            metadata=metadata
        )
        
        # Extract and save memories in background
        import asyncio
        user_msg = chat_messages[-1].content if chat_messages else ""
        asyncio.create_task(self._extract_and_save_memories(user_id, user_msg, result.content))
        
        return assistant_message
    
    async def _stream_completion(
        self,
        conversation_id: str,
        user_id: str,
        model: str,
        messages: list[Dict[str, str]],
        temperature: float,
        max_tokens: int,
        references_metadata: Optional[List[Dict[str, Any]]] = None
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
                # Generate follow-ups
                follow_ups = await self.generate_follow_ups(
                    model=model,
                    provider_name=provider_name,
                    history=chat_messages + [ChatMessage(role="assistant", content=full_content)]
                )
                
                metadata = {"model": model, "provider": provider_name}
                if references_metadata:
                    metadata["references"] = references_metadata
                if follow_ups:
                    metadata["follow_ups"] = follow_ups
                
                self.save_message(
                    conversation_id=conversation_id,
                    user_id=user_id,
                    role="assistant",
                    content=full_content,
                    tokens_used=total_tokens,
                    metadata=metadata
                )
                
                # Extract and save memories in background
                import asyncio
                user_msg = chat_messages[-1].content if chat_messages else ""
                asyncio.create_task(self._extract_and_save_memories(user_id, user_msg, full_content))
                
                # Yield follow-ups in a final special chunk if they exist
                if follow_ups:
                    yield {
                        "content": "",
                        "done": True,
                        "follow_ups": follow_ups
                    }
                
                saved = True
        
        # Final check: if loop finished but message wasn't saved (e.g. done flag missing)
        if not saved and full_content:
            print(f"[SERVICE] Final save for conversation {conversation_id} (done flag was missing)")
            
            # Generate follow-ups even if done flag was missing
            follow_ups = await self.generate_follow_ups(
                model=model,
                provider_name=provider_name,
                history=chat_messages + [ChatMessage(role="assistant", content=full_content)]
            )
            
            metadata = {"model": model, "provider": provider_name}
            if references_metadata:
                metadata["references"] = references_metadata
            if follow_ups:
                metadata["follow_ups"] = follow_ups
                
            self.save_message(
                conversation_id=conversation_id,
                user_id=user_id,
                role="assistant",
                content=full_content,
                tokens_used=total_tokens,
                metadata=metadata
            )
            
            if follow_ups:
                yield {
                    "content": "",
                    "done": True,
                    "follow_ups": follow_ups
                }

    async def generate_follow_ups(
        self,
        model: str,
        provider_name: str,
        history: List[ChatMessage]
    ) -> List[str]:
        """Generate follow-up questions based on conversation history"""
        try:
            provider = self.provider_factory.get_provider(provider_name)
            if not provider:
                return []
            
            # Create a prompt for follow-ups
            follow_up_prompt = (
                "Based on the previous conversation, generate 5 short and relevant follow-up questions "
                "that the user might want to ask next. "
                "Respond ONLY with the questions, one per line, without numbering, without bullets, and without additional text."
            )
            
            # We only take the last few messages to keep it relevant and fast
            recent_history = history[-5:]
            messages = recent_history + [ChatMessage(role="user", content=follow_up_prompt)]
            
            follow_ups_text = ""
            async for chunk in provider.chat_completion(
                model=model,
                messages=messages,
                stream=False,
                temperature=0.7,
                max_tokens=500
            ):
                follow_ups_text += chunk.content
            
            # Parse lines and clean up
            questions = []
            for line in follow_ups_text.split('\n'):
                line = line.strip()
                if not line:
                    continue
                # Remove common prefixes like "1. ", "- ", "* "
                import re
                line = re.sub(r'^(\d+\.|\-|\*)\s*', '', line)
                if line:
                    questions.append(line)
            
            # Return top 5
            return questions[:5]
        except Exception as e:
            print(f"Error generating follow-ups: {e}")
            return []

    async def _extract_and_save_memories(self, user_id: str, user_msg: str, assistant_msg: str):
        """Use LLM to extract facts from the interaction and save to memory"""
        prompt = f"""
        Extract important facts, user preferences, or entities from the following interaction.
        Only extract information that is worth remembering for future conversations.
        Format each fact as a single concise sentence in Spanish.
        If no important information is found, return "NONE".
        
        User: {user_msg}
        Assistant: {assistant_msg}
        
        Facts:
        """
        
        try:
            # Use a fast model for extraction
            provider = self.provider_factory.get_provider("ollama")
            # We use a non-streaming call for simplicity
            response_text = ""
            async for chunk in provider.chat_completion(
                model="llama3.2",
                messages=[ChatMessage(role="user", content=prompt)],
                temperature=0.1,
                max_tokens=500
            ):
                response_text += chunk.content
            
            if "NONE" in response_text.upper():
                return
            
            facts = [f.strip("- ").strip() for f in response_text.split("\n") if f.strip()]
            for fact in facts:
                if fact and len(fact) > 5 and "NONE" not in fact.upper():
                    self.memory_service.save_memory(user_id, fact)
                    print(f"🧠 Saved memory: {fact}")
        except Exception as e:
            print(f"Error extracting memories: {e}")

    async def generate_conversation_title(
        self,
        conversation_id: str,
        user_id: str,
        user_message: str
    ) -> str:
        """Generate a concise title for the conversation based on the first message"""
        try:
            # Get conversation to determine provider
            conversation = self.get_conversation(conversation_id, user_id)
            if not conversation:
                return "New Conversation"
            
            provider_name = conversation.get('provider', 'ollama')
            model = conversation.get('model', 'llama3.2')
            
            provider = self.provider_factory.get_provider(provider_name)
            if not provider:
                return "New Conversation"
            
            # Create a prompt for title generation
            title_prompt = (
                f"Genera un título muy conciso (máximo 5 palabras) en español para una conversación que comienza con este mensaje: \"{user_message}\". "
                "Responde ÚNICAMENTE con el título, sin comillas, sin punto al final y sin texto adicional."
            )
            
            title = ""
            async for chunk in provider.chat_completion(
                model=model,
                messages=[ChatMessage(role="user", content=title_prompt)],
                stream=False,
                temperature=0.7,
                max_tokens=50
            ):
                title += chunk.content
            
            title = title.strip().strip('"').strip("'")
            if title:
                # Update conversation title
                self.client.update(
                    index="marie_conversations",
                    id=conversation_id,
                    body={
                        "doc": {
                            "title": title,
                            "updated_at": datetime.utcnow().isoformat()
                        }
                    },
                    refresh=True
                )
                print(f"✨ Generated title for {conversation_id}: {title}")
                return title
            
            return "New Conversation"
        except Exception as e:
            print(f"Error generating conversation title: {e}")
            return "New Conversation"


# Global instance
llm_service = LLMService()
