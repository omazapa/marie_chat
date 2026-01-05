from opensearchpy import OpenSearch

from app.db import opensearch_client

# Index mappings
INDICES = {
    "marie_users": {
        "mappings": {
            "properties": {
                "id": {"type": "keyword"},
                "email": {"type": "keyword"},
                "password_hash": {"type": "keyword", "index": False},
                "full_name": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                "role": {"type": "keyword"},
                "roles": {"type": "keyword"},
                "permissions": {"type": "object", "enabled": True},
                "is_active": {"type": "boolean"},
                "is_email_verified": {"type": "boolean"},
                "avatar_url": {"type": "keyword", "index": False},
                "last_login_at": {"type": "date"},
                "created_at": {"type": "date"},
                "updated_at": {"type": "date"},
            }
        },
        "settings": {"number_of_shards": 1, "number_of_replicas": 1},
    },
    "marie_conversations": {
        "mappings": {
            "properties": {
                "id": {"type": "keyword"},
                "user_id": {"type": "keyword"},
                "title": {
                    "type": "text",
                    "analyzer": "standard",
                    "fields": {"keyword": {"type": "keyword"}},
                },
                "model": {"type": "keyword"},
                "provider": {"type": "keyword"},
                "system_prompt": {"type": "text"},
                "settings": {"type": "object", "enabled": True},
                "message_count": {"type": "integer"},
                "last_message_at": {"type": "date"},
                "created_at": {"type": "date"},
                "updated_at": {"type": "date"},
            }
        },
        "settings": {"number_of_shards": 2, "number_of_replicas": 1},
    },
    "marie_messages": {
        "mappings": {
            "properties": {
                "id": {"type": "keyword"},
                "conversation_id": {"type": "keyword"},
                "user_id": {"type": "keyword"},
                "role": {"type": "keyword"},
                "content": {
                    "type": "text",
                    "analyzer": "standard",
                    "fields": {"keyword": {"type": "keyword", "ignore_above": 256}},
                },
                "content_vector": {
                    "type": "knn_vector",
                    "dimension": 384,
                    "method": {
                        "name": "hnsw",
                        "space_type": "cosinesimil",
                        "engine": "lucene",
                        "parameters": {"ef_construction": 128, "m": 16},
                    },
                },
                "tokens_used": {"type": "integer"},
                "metadata": {"type": "object", "enabled": True},
                "created_at": {"type": "date"},
            }
        },
        "settings": {"number_of_shards": 3, "number_of_replicas": 1, "index.knn": True},
    },
    "marie_api_keys": {
        "mappings": {
            "properties": {
                "id": {"type": "keyword"},
                "user_id": {"type": "keyword"},
                "name": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                "key_hash": {"type": "keyword"},
                "is_active": {"type": "boolean"},
                "last_used_at": {"type": "date"},
                "usage_count": {"type": "integer"},
                "expires_at": {"type": "date"},
                "rate_limit": {"type": "integer"},
                "created_at": {"type": "date"},
            }
        },
        "settings": {"number_of_shards": 1, "number_of_replicas": 1},
    },
    "marie_memory": {
        "mappings": {
            "properties": {
                "id": {"type": "keyword"},
                "user_id": {"type": "keyword"},
                "content": {"type": "text", "analyzer": "standard"},
                "content_vector": {
                    "type": "knn_vector",
                    "dimension": 384,
                    "method": {
                        "name": "hnsw",
                        "space_type": "cosinesimil",
                        "engine": "lucene",
                        "parameters": {"ef_construction": 128, "m": 16},
                    },
                },
                "memory_type": {"type": "keyword"},
                "importance": {"type": "integer"},
                "metadata": {"type": "object", "enabled": True},
                "created_at": {"type": "date"},
                "updated_at": {"type": "date"},
            }
        },
        "settings": {"number_of_shards": 1, "number_of_replicas": 1, "index.knn": True},
    },
    "marie_agent_configs": {
        "mappings": {
            "properties": {
                "id": {"type": "keyword"},
                "user_id": {"type": "keyword"},
                "provider": {"type": "keyword"},
                "model_id": {"type": "keyword"},
                "scope": {"type": "keyword"},
                "conversation_id": {"type": "keyword"},
                "config_values": {"type": "object", "enabled": True},
                "created_at": {"type": "date"},
                "updated_at": {"type": "date"},
            }
        },
        "settings": {"number_of_shards": 1, "number_of_replicas": 1},
    },
    "marie_user_preferences": {
        "mappings": {
            "properties": {
                "user_id": {"type": "keyword"},
                "agent_preferences": {"type": "object", "enabled": True},
                "interface_preferences": {"type": "object", "enabled": True},
                "privacy_preferences": {"type": "object", "enabled": True},
                "created_at": {"type": "date"},
                "updated_at": {"type": "date"},
            }
        },
        "settings": {"number_of_shards": 1, "number_of_replicas": 1},
    },
}


def init_opensearch_indices():
    """Initialize OpenSearch indices"""
    client: OpenSearch = opensearch_client.client

    for index_name, config in INDICES.items():
        try:
            if not client.indices.exists(index=index_name):
                client.indices.create(index=index_name, body=config)
                print(f"✅ Index '{index_name}' created")
            else:
                print(f"ℹ️  Index '{index_name}' already exists")
        except Exception as e:
            print(f"❌ Error creating index '{index_name}': {e}")

    print("✅ OpenSearch indices initialized")


if __name__ == "__main__":
    init_opensearch_indices()
