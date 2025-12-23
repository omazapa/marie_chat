"""
Memory Service
Manages long-term memory (facts, preferences, entities) using OpenSearch vector search
"""
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from opensearchpy import OpenSearch
from sentence_transformers import SentenceTransformer
from app.db import opensearch_client

class MemoryService:
    """Service for managing long-term memory (facts, preferences, entities)"""
    
    def __init__(self):
        self.client: OpenSearch = opensearch_client.client
        self.index = "marie_memory"
        self._embedding_model = None

    @property
    def embedding_model(self):
        """Lazy-initialize embedding model"""
        if self._embedding_model is None:
            print("🧠 Loading embedding model for MemoryService...")
            import torch
            device = "cuda" if torch.cuda.is_available() else "cpu"
            self._embedding_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2', device=device)
            print(f"✅ Memory embedding model loaded on {device}")
        return self._embedding_model

    def save_memory(
        self,
        user_id: str,
        content: str,
        memory_type: str = "fact",
        importance: int = 1,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Save a piece of information to long-term memory"""
        memory_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        # Generate embedding
        content_vector = self.embedding_model.encode(content).tolist()
        
        memory_doc = {
            "id": memory_id,
            "user_id": user_id,
            "content": content,
            "content_vector": content_vector,
            "memory_type": memory_type,
            "importance": importance,
            "metadata": metadata or {},
            "created_at": now,
            "updated_at": now
        }
        
        self.client.index(
            index=self.index,
            id=memory_id,
            body=memory_doc,
            refresh=True
        )
        
        return memory_doc

    def retrieve_memories(
        self,
        user_id: str,
        query_text: str,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Retrieve relevant memories using hybrid search"""
        try:
            query_vector = self.embedding_model.encode(query_text).tolist()
            
            query = {
                "size": limit,
                "query": {
                    "bool": {
                        "must": [
                            {"term": {"user_id": user_id}}
                        ],
                        "should": [
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
                "knn": {
                    "content_vector": {
                        "vector": query_vector,
                        "k": limit
                    }
                }
            }
            
            result = self.client.search(
                index=self.index,
                body=query
            )
            
            return [hit["_source"] for hit in result["hits"]["hits"]]
        except Exception as e:
            print(f"Error retrieving memories: {e}")
            return []

    def delete_memory(self, memory_id: str, user_id: str) -> bool:
        """Delete a specific memory"""
        try:
            # Verify ownership first
            res = self.client.get(index=self.index, id=memory_id)
            if res["_source"]["user_id"] != user_id:
                return False
                
            self.client.delete(index=self.index, id=memory_id, refresh=True)
            return True
        except Exception:
            return False

# Global instance
memory_service = MemoryService()
