"""
API Key Service
Manages creation, validation, and revocation of API keys
"""
import uuid
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from opensearchpy import OpenSearch
from app.db import opensearch_client

class APIKeyService:
    """Service for managing API keys"""
    
    def __init__(self):
        self.client: OpenSearch = opensearch_client.client
        self.index = "marie_api_keys"

    def _hash_key(self, api_key: str) -> str:
        """Hash the API key for secure storage"""
        return hashlib.sha256(api_key.encode()).hexdigest()

    def create_api_key(
        self, 
        user_id: str, 
        name: str, 
        expires_in_days: int = 365,
        rate_limit: int = 1000
    ) -> Dict[str, Any]:
        """Create a new API key for a user"""
        # Generate a secure random key with prefix
        raw_key = f"mc_{secrets.token_urlsafe(32)}"
        key_hash = self._hash_key(raw_key)
        
        key_id = str(uuid.uuid4())
        now = datetime.utcnow()
        expires_at = now + timedelta(days=expires_in_days)
        
        key_doc = {
            "id": key_id,
            "user_id": user_id,
            "name": name,
            "key_hash": key_hash,
            "is_active": True,
            "last_used_at": None,
            "usage_count": 0,
            "expires_at": expires_at.isoformat(),
            "rate_limit": rate_limit,
            "created_at": now.isoformat()
        }
        
        self.client.index(
            index=self.index,
            id=key_id,
            body=key_doc,
            refresh=True
        )
        
        # Return the raw key only once during creation
        key_doc_with_raw = key_doc.copy()
        key_doc_with_raw["api_key"] = raw_key
        # Remove hash from response
        if "key_hash" in key_doc_with_raw: del key_doc_with_raw["key_hash"]
        
        return key_doc_with_raw

    def list_api_keys(self, user_id: str) -> List[Dict[str, Any]]:
        """List all API keys for a user"""
        query = {
            "query": {
                "term": {"user_id": user_id}
            },
            "sort": [{"created_at": {"order": "desc"}}]
        }
        
        try:
            result = self.client.search(index=self.index, body=query)
            keys = []
            for hit in result["hits"]["hits"]:
                key = hit["_source"]
                # Never return the hash
                if "key_hash" in key: del key["key_hash"]
                keys.append(key)
            return keys
        except Exception as e:
            print(f"Error listing API keys: {e}")
            return []

    def revoke_api_key(self, key_id: str, user_id: str) -> bool:
        """Revoke (deactivate) an API key"""
        try:
            # Verify ownership first
            res = self.client.get(index=self.index, id=key_id)
            if res["_source"]["user_id"] != user_id:
                return False
                
            self.client.update(
                index=self.index,
                id=key_id,
                body={"doc": {"is_active": False, "updated_at": datetime.utcnow().isoformat()}},
                refresh=True
            )
            return True
        except Exception as e:
            print(f"Error revoking API key: {e}")
            return False

    def validate_api_key(self, api_key: str) -> Optional[Dict[str, Any]]:
        """Validate an API key and return the associated key info"""
        if not api_key:
            return None
            
        key_hash = self._hash_key(api_key)
        
        query = {
            "query": {
                "bool": {
                    "must": [
                        {"term": {"key_hash": key_hash}},
                        {"term": {"is_active": True}}
                    ]
                }
            }
        }
        
        try:
            result = self.client.search(index=self.index, body=query)
            if not result["hits"]["hits"]:
                return None
                
            key_doc = result["hits"]["hits"][0]["_source"]
            
            # Check expiration
            expires_at = datetime.fromisoformat(key_doc["expires_at"])
            if datetime.utcnow() > expires_at:
                return None
                
            # Update usage stats (fire and forget or background)
            self.client.update(
                index=self.index,
                id=key_doc["id"],
                body={
                    "doc": {
                        "last_used_at": datetime.utcnow().isoformat()
                    },
                    "script": {
                        "source": "ctx._source.usage_count += 1"
                    }
                }
            )
            
            return key_doc
        except Exception as e:
            print(f"Error validating API key: {e}")
            return None

# Global instance
api_key_service = APIKeyService()
