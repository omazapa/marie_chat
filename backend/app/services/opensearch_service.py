from opensearchpy import OpenSearch
from datetime import datetime
import uuid
import bcrypt
from typing import Optional, List, Dict
from app.db import opensearch_client


class OpenSearchService:
    """Service for OpenSearch operations"""
    
    def __init__(self):
        self.client: OpenSearch = opensearch_client.client
    
    # ==================== USERS ====================
    
    def create_user(
        self, 
        email: str, 
        password: str,
        full_name: str = None,
        role: str = "user"
    ) -> dict:
        """Create a new user"""
        user_id = str(uuid.uuid4())
        
        # Hash password
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        doc = {
            "id": user_id,
            "email": email,
            "password_hash": password_hash,
            "full_name": full_name,
            "role": role,
            "roles": [role],
            "permissions": self._get_default_permissions(role),
            "is_active": True,
            "is_email_verified": False,
            "avatar_url": None,
            "last_login_at": None,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }
        
        self.client.index(index="marie_users", id=user_id, body=doc, refresh=True)
        
        # Remove password_hash from returned doc
        doc.pop('password_hash', None)
        return doc
    
    def _get_default_permissions(self, role: str) -> dict:
        """Get default permissions for a role"""
        if role == "admin":
            return {
                "can_create_users": True,
                "can_manage_system": True,
                "can_view_logs": True,
                "can_manage_models": True,
            }
        return {
            "can_create_users": False,
            "can_manage_system": False,
            "can_view_logs": False,
            "can_manage_models": False,
        }
    
    def get_user_by_email(self, email: str) -> Optional[dict]:
        """Get user by email"""
        query = {
            "query": {
                "term": {
                    "email": email
                }
            }
        }
        
        result = self.client.search(index="marie_users", body=query)
        hits = result["hits"]["hits"]
        
        if hits:
            return hits[0]["_source"]
        return None
    
    def get_user_by_id(self, user_id: str) -> Optional[dict]:
        """Get user by ID"""
        try:
            result = self.client.get(index="marie_users", id=user_id)
            return result["_source"]
        except Exception:
            return None
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    
    def update_last_login(self, user_id: str):
        """Update user's last login timestamp"""
        self.client.update(
            index="marie_users",
            id=user_id,
            body={
                "doc": {
                    "last_login_at": datetime.utcnow().isoformat()
                }
            }
        )
    
    # ==================== CONVERSATIONS ====================
    
    def create_conversation(
        self, 
        user_id: str, 
        model: str, 
        provider: str,
        title: str = "Nueva conversación",
        system_prompt: str = None
    ) -> dict:
        """Create a new conversation"""
        conv_id = str(uuid.uuid4())
        
        doc = {
            "id": conv_id,
            "user_id": user_id,
            "title": title,
            "model": model,
            "provider": provider,
            "system_prompt": system_prompt,
            "settings": {},
            "message_count": 0,
            "last_message_at": None,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }
        
        self.client.index(index="marie_conversations", id=conv_id, body=doc, refresh=True)
        return doc
    
    def get_user_conversations(self, user_id: str, limit: int = 50) -> List[dict]:
        """Get user's conversations"""
        query = {
            "query": {
                "term": {
                    "user_id": user_id
                }
            },
            "sort": [
                {"updated_at": {"order": "desc"}}
            ],
            "size": limit
        }
        
        result = self.client.search(index="marie_conversations", body=query)
        return [hit["_source"] for hit in result["hits"]["hits"]]
    
    def get_conversation(self, conversation_id: str) -> Optional[dict]:
        """Get conversation by ID"""
        try:
            result = self.client.get(index="marie_conversations", id=conversation_id)
            return result["_source"]
        except Exception:
            return None
    
    def update_conversation(self, conversation_id: str, updates: dict):
        """Update conversation"""
        updates["updated_at"] = datetime.utcnow().isoformat()
        
        self.client.update(
            index="marie_conversations",
            id=conversation_id,
            body={"doc": updates}
        )
    
    def delete_conversation(self, conversation_id: str):
        """Delete conversation"""
        self.client.delete(index="marie_conversations", id=conversation_id)
        
        # Also delete all messages in this conversation
        query = {
            "query": {
                "term": {
                    "conversation_id": conversation_id
                }
            }
        }
        
        self.client.delete_by_query(index="marie_messages", body=query)
    
    # ==================== MESSAGES ====================
    
    def create_message(
        self,
        conversation_id: str,
        user_id: str,
        role: str,
        content: str,
        tokens_used: int = None,
        metadata: dict = None,
        content_vector: list = None
    ) -> dict:
        """Create a new message"""
        msg_id = str(uuid.uuid4())
        
        doc = {
            "id": msg_id,
            "conversation_id": conversation_id,
            "user_id": user_id,
            "role": role,
            "content": content,
            "tokens_used": tokens_used,
            "metadata": metadata or {},
            "created_at": datetime.utcnow().isoformat(),
        }
        
        if content_vector:
            doc["content_vector"] = content_vector
        
        self.client.index(index="marie_messages", id=msg_id, body=doc, refresh=True)
        
        # Update conversation message count and last_message_at
        self.client.update(
            index="marie_conversations",
            id=conversation_id,
            body={
                "script": {
                    "source": "ctx._source.message_count += 1; ctx._source.last_message_at = params.now; ctx._source.updated_at = params.now",
                    "params": {
                        "now": datetime.utcnow().isoformat()
                    }
                }
            }
        )
        
        return doc
    
    def get_conversation_messages(self, conversation_id: str, limit: int = 1000) -> List[dict]:
        """Get messages from a conversation (most recent first, then reversed to chronological)"""
        query = {
            "query": {
                "term": {
                    "conversation_id": conversation_id
                }
            },
            "sort": [
                {"created_at": {"order": "desc"}}
            ],
            "size": limit
        }
        
        result = self.client.search(index="marie_messages", body=query)
        messages = [hit["_source"] for hit in result["hits"]["hits"]]
        print(f"[OPENSEARCH] Found {len(messages)} messages for conversation {conversation_id}")
        messages.reverse()
        return messages
