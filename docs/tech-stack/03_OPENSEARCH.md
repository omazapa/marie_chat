# OpenSearch 2.11 - Complete Reference Guide

> **Last Updated:** January 3, 2026
> **Version:** OpenSearch 2.11.x
> **MARIE Project Context**

---

## 📖 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Index Management](#index-management)
4. [Vector Search (k-NN)](#vector-search-k-nn)
5. [Hybrid Search](#hybrid-search)
6. [Query Optimization](#query-optimization)
7. [Aggregations](#aggregations)
8. [Performance Tuning](#performance-tuning)
9. [Monitoring & Maintenance](#monitoring--maintenance)
10. [Best Practices for MARIE](#best-practices-for-marie)

---

## Overview

### What is OpenSearch?

OpenSearch is a **distributed search and analytics engine** based on Apache Lucene. It provides:

- **Full-text search** - Powerful text analysis and ranking
- **Vector search (k-NN)** - Semantic similarity search with embeddings
- **Real-time indexing** - Near-instant search of new documents
- **Horizontal scalability** - Distribute data across nodes
- **High availability** - Automatic replication and failover
- **Rich query DSL** - Complex queries with filtering, aggregations, and scoring

### Why OpenSearch for MARIE?

1. **Semantic Search** - Find similar conversations using vector embeddings
2. **Hybrid Search** - Combine keyword and semantic search
3. **Scalability** - Handle millions of messages
4. **Real-time** - Search new messages immediately
5. **Flexible Schema** - Dynamic fields for different message types

---

## Architecture

### MARIE's OpenSearch Setup

```
┌──────────────────────────────────────────────────────────┐
│                   OPENSEARCH CLUSTER                     │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Primary Node (marie-node-1)                       │  │
│  │  - Master eligible                                 │  │
│  │  - Data node                                       │  │
│  │  - Handles indexing & search                       │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Indices                                            │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  marie_users                                 │  │  │
│  │  │  - User documents                            │  │  │
│  │  │  - Authentication data                       │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  marie_conversations                         │  │  │
│  │  │  - Conversation metadata                     │  │  │
│  │  │  - Titles, models, providers                 │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  marie_messages                              │  │  │
│  │  │  - Message content                           │  │  │
│  │  │  - Vector embeddings (384 dimensions)        │  │  │
│  │  │  - Full-text + k-NN search                   │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### Document Structure

```json
{
  "index": "marie_messages",
  "document": {
    "id": "msg_123456",
    "conversation_id": "conv_abc",
    "user_id": "user_xyz",
    "role": "assistant",
    "content": "Here's how you can implement vector search...",
    "content_vector": [0.123, -0.456, 0.789, ...],  // 384 dimensions
    "tokens_used": 150,
    "model": "llama3.2",
    "provider": "ollama",
    "created_at": "2026-01-03T10:30:00Z",
    "metadata": {
      "follow_ups": ["Can you explain more?", "What about performance?"],
      "references": ["doc1", "doc2"]
    }
  }
}
```

---

## Index Management

### Creating Indices with Python

```python
# backend/app/infrastructure/opensearch/indices.py
from opensearchpy import OpenSearch

def create_messages_index(client: OpenSearch):
    """
    Create messages index with k-NN enabled
    """
    index_body = {
        "settings": {
            "index": {
                "number_of_shards": 1,
                "number_of_replicas": 1,
                "knn": True,  # Enable k-NN plugin
                "knn.algo_param.ef_search": 100,  # HNSW search parameter
            },
            "analysis": {
                "analyzer": {
                    "message_analyzer": {
                        "type": "custom",
                        "tokenizer": "standard",
                        "filter": [
                            "lowercase",
                            "asciifolding",
                            "stop",
                            "snowball"
                        ]
                    }
                }
            }
        },
        "mappings": {
            "properties": {
                "id": {"type": "keyword"},
                "conversation_id": {"type": "keyword"},
                "user_id": {"type": "keyword"},
                "role": {"type": "keyword"},

                # Full-text search field
                "content": {
                    "type": "text",
                    "analyzer": "message_analyzer",
                    "fields": {
                        "keyword": {
                            "type": "keyword",
                            "ignore_above": 256
                        }
                    }
                },

                # Vector search field
                "content_vector": {
                    "type": "knn_vector",
                    "dimension": 384,  # all-MiniLM-L6-v2
                    "method": {
                        "name": "hnsw",  # Hierarchical Navigable Small World
                        "space_type": "cosinesimil",  # Cosine similarity
                        "engine": "nmslib",  # Non-Metric Space Library
                        "parameters": {
                            "ef_construction": 128,  # Build-time parameter
                            "m": 16  # Number of connections per node
                        }
                    }
                },

                "tokens_used": {"type": "integer"},
                "model": {"type": "keyword"},
                "provider": {"type": "keyword"},
                "created_at": {"type": "date"},

                # Nested metadata
                "metadata": {
                    "type": "object",
                    "properties": {
                        "follow_ups": {"type": "keyword"},
                        "references": {"type": "keyword"}
                    }
                }
            }
        }
    }

    # Create index
    if not client.indices.exists(index="marie_messages"):
        client.indices.create(
            index="marie_messages",
            body=index_body
        )
        print("✅ Created marie_messages index")
```

### Index Templates

```python
def create_index_template(client: OpenSearch):
    """
    Create template for time-series indices
    """
    template_body = {
        "index_patterns": ["marie_messages-*"],
        "template": {
            "settings": {
                "number_of_shards": 1,
                "number_of_replicas": 1,
                "knn": True
            },
            "mappings": {
                # Same mappings as above
            }
        }
    }

    client.indices.put_index_template(
        name="marie_messages_template",
        body=template_body
    )
```

### Index Lifecycle Management

```python
def rotate_index():
    """
    Rotate to new index monthly for better performance
    """
    from datetime import datetime

    current_month = datetime.now().strftime("%Y-%m")
    new_index = f"marie_messages-{current_month}"

    if not client.indices.exists(index=new_index):
        # Create new index from template
        client.indices.create(index=new_index)

        # Create alias
        client.indices.update_aliases(body={
            "actions": [
                {"add": {"index": new_index, "alias": "marie_messages"}}
            ]
        })
```

---

## Vector Search (k-NN)

### Understanding k-NN in OpenSearch

**k-NN (k-Nearest Neighbors)** finds documents most similar to a query vector.

#### HNSW Algorithm
- **Hierarchical**: Multi-layer graph structure
- **Navigable**: Efficient pathfinding through graph
- **Small World**: Short paths between any two nodes
- **Approximate**: Trade accuracy for speed (99%+ accuracy)

### Generating Embeddings

```python
# backend/app/services/embedding_service.py
from sentence_transformers import SentenceTransformer

class EmbeddingService:
    def __init__(self):
        # all-MiniLM-L6-v2: 384 dimensions, fast, good quality
        self.model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

    def encode(self, text: str) -> list[float]:
        """
        Generate embedding for text
        """
        embedding = self.model.encode(text, normalize_embeddings=True)
        return embedding.tolist()

    def encode_batch(self, texts: list[str]) -> list[list[float]]:
        """
        Batch encoding for performance
        """
        embeddings = self.model.encode(
            texts,
            normalize_embeddings=True,
            batch_size=32,
            show_progress_bar=True
        )
        return embeddings.tolist()

# Usage
embedding_service = EmbeddingService()
```

### Indexing Documents with Vectors

```python
def index_message(message_data: dict):
    """
    Index message with vector embedding
    """
    # Generate embedding
    content = message_data['content']
    vector = embedding_service.encode(content)

    # Prepare document
    document = {
        **message_data,
        "content_vector": vector,
        "created_at": datetime.utcnow().isoformat()
    }

    # Index
    response = client.index(
        index="marie_messages",
        id=message_data['id'],
        body=document,
        refresh=True  # Make searchable immediately
    )

    return response

# Bulk indexing for performance
def bulk_index_messages(messages: list[dict]):
    """
    Bulk index multiple messages
    """
    from opensearchpy import helpers

    # Generate all embeddings in batch
    contents = [msg['content'] for msg in messages]
    vectors = embedding_service.encode_batch(contents)

    # Prepare bulk operations
    actions = []
    for msg, vector in zip(messages, vectors):
        actions.append({
            "_index": "marie_messages",
            "_id": msg['id'],
            "_source": {
                **msg,
                "content_vector": vector
            }
        })

    # Bulk index
    helpers.bulk(client, actions)
```

### k-NN Search Queries

```python
def semantic_search(query_text: str, k: int = 10):
    """
    Find k most similar messages using vector search
    """
    # Generate query vector
    query_vector = embedding_service.encode(query_text)

    # k-NN query
    search_body = {
        "size": k,
        "query": {
            "knn": {
                "content_vector": {
                    "vector": query_vector,
                    "k": k
                }
            }
        },
        "_source": {
            "excludes": ["content_vector"]  # Don't return vector in results
        }
    }

    response = client.search(
        index="marie_messages",
        body=search_body
    )

    return [
        {
            "id": hit["_id"],
            "score": hit["_score"],
            "content": hit["_source"]["content"],
            "created_at": hit["_source"]["created_at"]
        }
        for hit in response["hits"]["hits"]
    ]

# With filters
def semantic_search_filtered(query_text: str, conversation_id: str, k: int = 10):
    """
    Semantic search within a specific conversation
    """
    query_vector = embedding_service.encode(query_text)

    search_body = {
        "size": k,
        "query": {
            "bool": {
                "must": [
                    {
                        "knn": {
                            "content_vector": {
                                "vector": query_vector,
                                "k": k
                            }
                        }
                    }
                ],
                "filter": [
                    {"term": {"conversation_id": conversation_id}}
                ]
            }
        }
    }

    return client.search(index="marie_messages", body=search_body)
```

---

## Hybrid Search

### Combining Text and Vector Search

```python
def hybrid_search(query_text: str, k: int = 10):
    """
    Combine keyword and semantic search for best results

    Benefits:
    - Keyword: Exact matches, specific terms
    - Semantic: Conceptual similarity, synonyms
    """
    query_vector = embedding_service.encode(query_text)

    search_body = {
        "size": k,
        "query": {
            "script_score": {
                "query": {
                    "bool": {
                        "should": [
                            # Text search (BM25 scoring)
                            {
                                "multi_match": {
                                    "query": query_text,
                                    "fields": ["content^2", "metadata.follow_ups"],
                                    "type": "best_fields",
                                    "boost": 1.5
                                }
                            }
                        ]
                    }
                },
                # Combine with vector similarity
                "script": {
                    "source": "knn_score",
                    "lang": "knn",
                    "params": {
                        "field": "content_vector",
                        "query_value": query_vector,
                        "space_type": "cosinesimil"
                    }
                }
            }
        }
    }

    return client.search(index="marie_messages", body=search_body)

# Advanced: Weighted hybrid search
def weighted_hybrid_search(query_text: str, text_weight: float = 0.3, vector_weight: float = 0.7):
    """
    Control the balance between text and vector search
    """
    query_vector = embedding_service.encode(query_text)

    search_body = {
        "query": {
            "script_score": {
                "query": {
                    "bool": {
                        "should": [
                            {
                                "multi_match": {
                                    "query": query_text,
                                    "fields": ["content"],
                                    "boost": text_weight
                                }
                            }
                        ]
                    }
                },
                "script": {
                    "source": f"{vector_weight} * cosineSimilarity(params.query_vector, 'content_vector') + 1.0",
                    "params": {
                        "query_vector": query_vector
                    }
                }
            }
        }
    }

    return client.search(index="marie_messages", body=search_body)
```

---

## Query Optimization

### Query Performance Tips

```python
# 1. Exclude unnecessary fields
search_body = {
    "query": {...},
    "_source": {
        "includes": ["id", "content", "created_at"],
        "excludes": ["content_vector", "metadata"]
    }
}

# 2. Use filters instead of queries when possible
# Filters are cached and faster
search_body = {
    "query": {
        "bool": {
            "must": [
                {"match": {"content": "python"}}  # Scored
            ],
            "filter": [
                {"term": {"conversation_id": "conv_123"}},  # Not scored, cached
                {"range": {"created_at": {"gte": "2026-01-01"}}}
            ]
        }
    }
}

# 3. Limit result size
search_body = {
    "size": 20,  # Default is 10, don't fetch more than needed
    "query": {...}
}

# 4. Use pagination
from opensearchpy import helpers

def scroll_all_documents(query):
    """
    Efficiently iterate through large result sets
    """
    for hit in helpers.scan(
        client,
        index="marie_messages",
        query=query,
        scroll="5m",  # Keep context for 5 minutes
        size=1000  # Batch size
    ):
        yield hit
```

### Query Caching

```python
# OpenSearch caches query results automatically
# Use consistent query structure for better cache hits

# Good: Cache-friendly
def search_messages(conversation_id: str, query: str):
    return client.search(
        index="marie_messages",
        body={
            "query": {
                "bool": {
                    "must": [{"match": {"content": query}}],
                    "filter": [{"term": {"conversation_id": conversation_id}}]
                }
            }
        }
    )

# Enable request cache explicitly
search_body = {
    "query": {...},
    "size": 0,  # Request cache works best with aggregations
    "aggs": {...}
}

response = client.search(
    index="marie_messages",
    body=search_body,
    request_cache=True
)
```

---

## Aggregations

### Basic Aggregations

```python
def get_message_stats():
    """
    Get statistics about messages
    """
    agg_body = {
        "size": 0,  # Don't return documents, only aggregations
        "aggs": {
            "messages_per_conversation": {
                "terms": {
                    "field": "conversation_id",
                    "size": 10
                },
                "aggs": {
                    "total_tokens": {
                        "sum": {"field": "tokens_used"}
                    },
                    "avg_tokens": {
                        "avg": {"field": "tokens_used"}
                    }
                }
            },
            "messages_over_time": {
                "date_histogram": {
                    "field": "created_at",
                    "calendar_interval": "day"
                }
            },
            "popular_models": {
                "terms": {
                    "field": "model",
                    "size": 5
                }
            }
        }
    }

    return client.search(index="marie_messages", body=agg_body)

# Result structure:
# {
#   "aggregations": {
#     "messages_per_conversation": {
#       "buckets": [
#         {
#           "key": "conv_123",
#           "doc_count": 50,
#           "total_tokens": {"value": 7500},
#           "avg_tokens": {"value": 150}
#         }
#       ]
#     },
#     ...
#   }
# }
```

---

## Performance Tuning

### Index Settings

```python
# Optimize for search performance
index_settings = {
    "settings": {
        "index": {
            # Refresh interval (trade-off: faster search vs. faster indexing)
            "refresh_interval": "30s",  # Default: 1s

            # Merge policy
            "merge.policy.max_merged_segment": "5gb",

            # Translog settings
            "translog.durability": "async",
            "translog.sync_interval": "30s",

            # Codec
            "codec": "best_compression",  # Smaller index size
        }
    }
}
```

### Query Performance

```python
# 1. Use filters for exact matches
# 2. Limit field data
# 3. Use doc values
# 4. Pre-compute expensive operations

# Example: Pre-compute message length
def index_with_computed_fields(message_data):
    document = {
        **message_data,
        "content_length": len(message_data['content']),
        "word_count": len(message_data['content'].split())
    }

    client.index(index="marie_messages", body=document)
```

---

## Monitoring & Maintenance

### Health Checks

```python
def check_cluster_health():
    """
    Check OpenSearch cluster status
    """
    health = client.cluster.health()

    return {
        "status": health["status"],  # green, yellow, red
        "nodes": health["number_of_nodes"],
        "data_nodes": health["number_of_data_nodes"],
        "active_shards": health["active_shards"],
        "unassigned_shards": health["unassigned_shards"]
    }

def check_index_stats(index_name: str):
    """
    Get index statistics
    """
    stats = client.indices.stats(index=index_name)

    return {
        "doc_count": stats["indices"][index_name]["total"]["docs"]["count"],
        "size_bytes": stats["indices"][index_name]["total"]["store"]["size_in_bytes"],
        "search_total": stats["indices"][index_name]["total"]["search"]["query_total"],
        "search_time_ms": stats["indices"][index_name]["total"]["search"]["query_time_in_millis"]
    }
```

### Maintenance Operations

```python
def optimize_index(index_name: str):
    """
    Force merge segments for better query performance
    """
    client.indices.forcemerge(
        index=index_name,
        max_num_segments=1  # Merge to single segment
    )

def clear_cache(index_name: str):
    """
    Clear index cache
    """
    client.indices.clear_cache(index=index_name)

def reindex_with_new_settings(old_index: str, new_index: str):
    """
    Reindex to apply new settings/mappings
    """
    # Create new index
    client.indices.create(index=new_index, body=new_settings)

    # Reindex
    client.reindex(
        body={
            "source": {"index": old_index},
            "dest": {"index": new_index}
        },
        wait_for_completion=False  # Async for large indices
    )
```

---

## Best Practices for MARIE

### 1. **Index Design**
- Separate indices for different data types (users, conversations, messages)
- Use time-based indices for messages if volume is high
- Enable k-NN only where needed

### 2. **Vector Search**
- Normalize embeddings before indexing
- Choose appropriate k value (10-50 for most cases)
- Use filters to narrow down search space

### 3. **Hybrid Search**
- Weight semantic search higher for conversational queries
- Weight keyword search higher for technical terms

### 4. **Performance**
- Exclude vector fields from results (`_source.excludes`)
- Use pagination for large result sets
- Cache frequently accessed queries

### 5. **Monitoring**
- Track cluster health daily
- Monitor query performance
- Set up alerts for red/yellow status

---

**Document Version:** 1.0
**Author:** AI Expert (Claude)
