"""Conversation service for managing conversations."""
from datetime import datetime
from typing import Optional, Dict, Any, List
from app.services.opensearch_service import OpenSearchService


class ConversationService:
    """Service for conversation operations."""
    
    def __init__(self, opensearch_service: OpenSearchService):
        """Initialize ConversationService."""
        self.opensearch = opensearch_service
        self.index = "marie_conversations"
    
    def create_conversation(
        self,
        user_id: str,
        model: str = "llama3.2",
        provider: str = "ollama",
        title: Optional[str] = None,
        system_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new conversation."""
        conversation_id = f"conv_{datetime.now().timestamp()}_{user_id}"
        
        doc = {
            "id": conversation_id,
            "user_id": user_id,
            "title": title or "New Conversation",
            "model": model,
            "provider": provider,
            "system_prompt": system_prompt,
            "settings": {},
            "message_count": 0,
            "last_message_at": None,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        self.opensearch.index_document(self.index, doc, doc_id=conversation_id)
        return doc
    
    def get_conversation(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """Get conversation by ID."""
        return self.opensearch.get_document(self.index, conversation_id)
    
    def get_user_conversations(
        self,
        user_id: str,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get user conversations ordered by last_message_at."""
        query = {
            "query": {
                "term": {"user_id": user_id}
            },
            "sort": [
                {"last_message_at": {"order": "desc", "missing": "_last"}},
                {"created_at": {"order": "desc"}}
            ],
            "size": limit,
            "from": offset
        }
        
        return self.opensearch.search(self.index, query, size=limit, from_=offset)
    
    def update_conversation(
        self,
        conversation_id: str,
        updates: Dict[str, Any]
    ) -> bool:
        """Update conversation."""
        updates["updated_at"] = datetime.utcnow().isoformat()
        return self.opensearch.update_document(self.index, conversation_id, updates)
    
    def update_title(self, conversation_id: str, title: str) -> bool:
        """Update conversation title."""
        return self.update_conversation(conversation_id, {"title": title})
    
    def increment_message_count(self, conversation_id: str) -> bool:
        """Increment message count and update last_message_at."""
        conv = self.get_conversation(conversation_id)
        if conv:
            new_count = conv.get("message_count", 0) + 1
            return self.update_conversation(conversation_id, {
                "message_count": new_count,
                "last_message_at": datetime.utcnow().isoformat()
            })
        return False
    
    def delete_conversation(self, conversation_id: str) -> bool:
        """Delete conversation."""
        return self.opensearch.delete_document(self.index, conversation_id)

