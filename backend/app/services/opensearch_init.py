"""OpenSearch indices initialization."""
from typing import Dict, Any
from app.services.opensearch_service import OpenSearchService


# Index definitions
INDICES: Dict[str, Dict[str, Any]] = {
    "marie_users": {
        "mappings": {
            "properties": {
                "id": {"type": "keyword"},
                "email": {"type": "keyword"},
                "password_hash": {"type": "keyword", "index": False},
                "full_name": {
                    "type": "text",
                    "fields": {"keyword": {"type": "keyword"}}
                },
                "avatar_url": {"type": "keyword", "index": False},
                "role": {"type": "keyword"},  # user, admin
                "permissions": {"type": "keyword"},  # Array of permissions
                "is_active": {"type": "boolean"},
                "created_at": {"type": "date"},
                "updated_at": {"type": "date"}
            }
        },
        "settings": {
            "number_of_shards": 1,
            "number_of_replicas": 0
        }
    },
    "marie_conversations": {
        "mappings": {
            "properties": {
                "id": {"type": "keyword"},
                "user_id": {"type": "keyword"},
                "title": {
                    "type": "text",
                    "analyzer": "standard",
                    "fields": {"keyword": {"type": "keyword"}}
                },
                "model": {"type": "keyword"},
                "provider": {"type": "keyword"},
                "system_prompt": {"type": "text"},
                "settings": {"type": "object", "enabled": True},
                "message_count": {"type": "integer"},
                "last_message_at": {"type": "date"},
                "created_at": {"type": "date"},
                "updated_at": {"type": "date"}
            }
        },
        "settings": {
            "number_of_shards": 2,
            "number_of_replicas": 0
        }
    },
    "marie_messages": {
        "mappings": {
            "properties": {
                "id": {"type": "keyword"},
                "conversation_id": {"type": "keyword"},
                "user_id": {"type": "keyword"},
                "role": {"type": "keyword"},  # user, assistant, system
                "content": {
                    "type": "text",
                    "analyzer": "standard",
                    "fields": {
                        "keyword": {"type": "keyword", "ignore_above": 256}
                    }
                },
                "content_vector": {
                    "type": "knn_vector",
                    "dimension": 384,
                    "method": {
                        "name": "hnsw",
                        "space_type": "cosinesimil",
                        "engine": "lucene",
                        "parameters": {
                            "ef_construction": 128,
                            "m": 16
                        }
                    }
                },
                "tokens_used": {"type": "integer"},
                "metadata": {"type": "object", "enabled": True},
                "created_at": {"type": "date"}
            }
        },
        "settings": {
            "number_of_shards": 3,
            "number_of_replicas": 0,
            "index.knn": True
        }
    },
    "marie_api_keys": {
        "mappings": {
            "properties": {
                "id": {"type": "keyword"},
                "user_id": {"type": "keyword"},
                "key_type": {"type": "keyword"},  # user, developer
                "name": {
                    "type": "text",
                    "fields": {"keyword": {"type": "keyword"}}
                },
                "key_hash": {"type": "keyword"},
                "is_active": {"type": "boolean"},
                "last_used_at": {"type": "date"},
                "usage_count": {"type": "integer"},
                "expires_at": {"type": "date"},
                "rate_limit": {"type": "integer"},
                "created_at": {"type": "date"}
            }
        },
        "settings": {
            "number_of_shards": 1,
            "number_of_replicas": 0
        }
    }
}


def init_opensearch_indices(opensearch_service: OpenSearchService, recreate: bool = False) -> Dict[str, bool]:
    """Initialize all OpenSearch indices.
    
    Args:
        opensearch_service: OpenSearchService instance
        recreate: If True, delete existing indices before creating
    
    Returns:
        Dictionary mapping index names to success status
    """
    results = {}
    
    for index_name, index_config in INDICES.items():
        try:
            # Delete existing index if recreate is True
            if recreate and opensearch_service.index_exists(index_name):
                print(f"Deleting existing index: {index_name}")
                opensearch_service.delete_index(index_name)
            
            # Create index if it doesn't exist
            if not opensearch_service.index_exists(index_name):
                print(f"Creating index: {index_name}")
                success = opensearch_service.create_index(
                    index_name=index_name,
                    mapping=index_config["mappings"],
                    settings=index_config.get("settings")
                )
                results[index_name] = success
                if success:
                    print(f"✓ Successfully created index: {index_name}")
                else:
                    print(f"✗ Failed to create index: {index_name}")
            else:
                print(f"✓ Index already exists: {index_name}")
                results[index_name] = True
        except Exception as e:
            print(f"✗ Error initializing index {index_name}: {e}")
            results[index_name] = False
    
    return results

