"""OpenSearch service for database operations."""
from opensearchpy import OpenSearch, helpers
from datetime import datetime
from typing import Optional, Dict, List, Any
import uuid


class OpenSearchService:
    """Service for interacting with OpenSearch."""
    
    def __init__(self, hosts: list, auth: tuple = None, use_ssl: bool = True, verify_certs: bool = False):
        """Initialize OpenSearch client."""
        self.client = OpenSearch(
            hosts=hosts,
            http_auth=auth,
            use_ssl=use_ssl,
            verify_certs=verify_certs,
            ssl_show_warn=False
        )
    
    def index_exists(self, index_name: str) -> bool:
        """Check if an index exists."""
        return self.client.indices.exists(index=index_name)
    
    def create_index(self, index_name: str, mapping: Dict[str, Any], settings: Optional[Dict[str, Any]] = None) -> bool:
        """Create an index with mapping and settings."""
        body = {"mappings": mapping}
        if settings:
            body["settings"] = settings
        
        try:
            self.client.indices.create(index=index_name, body=body)
            return True
        except Exception as e:
            print(f"Error creating index {index_name}: {e}")
            return False
    
    def delete_index(self, index_name: str) -> bool:
        """Delete an index."""
        try:
            self.client.indices.delete(index=index_name)
            return True
        except Exception as e:
            print(f"Error deleting index {index_name}: {e}")
            return False
    
    def index_document(self, index_name: str, document: Dict[str, Any], doc_id: Optional[str] = None) -> Optional[str]:
        """Index a document."""
        if doc_id is None:
            doc_id = str(uuid.uuid4())
        
        try:
            response = self.client.index(index=index_name, id=doc_id, body=document)
            return response.get('_id')
        except Exception as e:
            print(f"Error indexing document: {e}")
            return None
    
    def get_document(self, index_name: str, doc_id: str) -> Optional[Dict[str, Any]]:
        """Get a document by ID."""
        try:
            response = self.client.get(index=index_name, id=doc_id)
            doc = response.get('_source', {})
            doc['id'] = response.get('_id')
            return doc
        except Exception as e:
            print(f"Error getting document {doc_id}: {e}")
            return None
    
    def update_document(self, index_name: str, doc_id: str, updates: Dict[str, Any]) -> bool:
        """Update a document."""
        try:
            self.client.update(index=index_name, id=doc_id, body={"doc": updates})
            return True
        except Exception as e:
            print(f"Error updating document {doc_id}: {e}")
            return False
    
    def delete_document(self, index_name: str, doc_id: str) -> bool:
        """Delete a document."""
        try:
            self.client.delete(index=index_name, id=doc_id)
            return True
        except Exception as e:
            print(f"Error deleting document {doc_id}: {e}")
            return False
    
    def search(self, index_name: str, query: Dict[str, Any], size: int = 10, from_: int = 0) -> List[Dict[str, Any]]:
        """Search documents."""
        try:
            response = self.client.search(
                index=index_name,
                body=query,
                size=size,
                from_=from_
            )
            hits = response.get('hits', {}).get('hits', [])
            results = []
            for hit in hits:
                doc = hit.get('_source', {})
                doc['id'] = hit.get('_id')
                doc['_score'] = hit.get('_score')
                results.append(doc)
            return results
        except Exception as e:
            print(f"Error searching: {e}")
            return []
    
    def bulk_index(self, index_name: str, documents: List[Dict[str, Any]]) -> bool:
        """Bulk index documents."""
        try:
            actions = [
                {
                    '_index': index_name,
                    '_id': doc.get('id') or str(uuid.uuid4()),
                    '_source': doc
                }
                for doc in documents
            ]
            helpers.bulk(self.client, actions)
            return True
        except Exception as e:
            print(f"Error bulk indexing: {e}")
            return False

