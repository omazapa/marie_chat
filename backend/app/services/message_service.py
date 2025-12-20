"""Message service for managing messages."""
from datetime import datetime
from typing import Optional, Dict, Any, List
from app.services.opensearch_service import OpenSearchService


class MessageService:
    """Service for message operations."""
    
    def __init__(self, opensearch_service: OpenSearchService):
        """Initialize MessageService."""
        self.opensearch = opensearch_service
        self.index = "marie_messages"
    
    def create_message(
        self,
        conversation_id: str,
        user_id: str,
        role: str,
        content: str,
        tokens_used: Optional[int] = None,
        content_vector: Optional[List[float]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create a new message."""
        message_id = f"msg_{datetime.now().timestamp()}_{conversation_id}"
        
        doc = {
            "id": message_id,
            "conversation_id": conversation_id,
            "user_id": user_id,
            "role": role,  # user, assistant, system
            "content": content,
            "tokens_used": tokens_used,
            "metadata": metadata or {},
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Add vector if provided
        if content_vector:
            doc["content_vector"] = content_vector
        
        self.opensearch.index_document(self.index, doc, doc_id=message_id)
        return doc
    
    def get_message(self, message_id: str) -> Optional[Dict[str, Any]]:
        """Get message by ID."""
        return self.opensearch.get_document(self.index, message_id)
    
    def get_conversation_messages(
        self,
        conversation_id: str,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get messages for a conversation ordered by created_at."""
        query = {
            "query": {
                "term": {"conversation_id": conversation_id}
            },
            "sort": [{"created_at": {"order": "asc"}}],
            "size": limit,
            "from": offset
        }
        
        return self.opensearch.search(self.index, query, size=limit, from_=offset)
    
    def delete_message(self, message_id: str) -> bool:
        """Delete message."""
        return self.opensearch.delete_document(self.index, message_id)
    
    def update_message(
        self,
        message_id: str,
        updates: Dict[str, Any]
    ) -> bool:
        """Update message."""
        return self.opensearch.update_document(self.index, message_id, updates)

