from typing import List, Dict, Any, Optional
from datetime import datetime
from app.services.opensearch_service import OpenSearchService

class AdminService:
    def __init__(self):
        self.opensearch = OpenSearchService()
        self.client = self.opensearch.client

    def get_system_stats(self) -> Dict[str, Any]:
        """Get system-wide statistics from OpenSearch"""
        try:
            # Get indices stats
            indices = ["marie_users", "marie_conversations", "marie_messages", "marie_memory"]
            stats = {}
            
            for index in indices:
                try:
                    res = self.client.indices.stats(index=index)
                    stats[index] = {
                        "docs_count": res["indices"][index]["total"]["docs"]["count"],
                        "store_size_bytes": res["indices"][index]["total"]["store"]["size_in_bytes"]
                    }
                except Exception:
                    stats[index] = {"docs_count": 0, "store_size_bytes": 0}

            # Get cluster health
            health = self.client.cluster.health()
            
            return {
                "indices": stats,
                "cluster_health": health["status"],
                "nodes_count": health["number_of_nodes"],
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            print(f"Error getting system stats: {e}")
            return {"error": str(e)}

    def list_users(self, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """List all users with pagination"""
        try:
            query = {
                "query": {"match_all": {}},
                "size": limit,
                "from": offset,
                "sort": [{"created_at": {"order": "desc"}}]
            }
            res = self.client.search(index="marie_users", body=query)
            users = []
            for hit in res["hits"]["hits"]:
                user = hit["_source"]
                user.pop("password_hash", None)
                users.append(user)
            return users
        except Exception as e:
            print(f"Error listing users: {e}")
            return []

    def update_user_status(self, user_id: str, is_active: bool) -> bool:
        """Enable or disable a user account"""
        try:
            self.client.update(
                index="marie_users",
                id=user_id,
                body={"doc": {"is_active": is_active, "updated_at": datetime.utcnow().isoformat()}},
                refresh=True
            )
            return True
        except Exception as e:
            print(f"Error updating user status: {e}")
            return False

    def update_user_role(self, user_id: str, role: str) -> bool:
        """Change user role (admin/user)"""
        try:
            # Get default permissions for the new role
            permissions = self.opensearch._get_default_permissions(role)
            
            self.client.update(
                index="marie_users",
                id=user_id,
                body={
                    "doc": {
                        "role": role, 
                        "permissions": permissions,
                        "updated_at": datetime.utcnow().isoformat()
                    }
                },
                refresh=True
            )
            return True
        except Exception as e:
            print(f"Error updating user role: {e}")
            return False

    def delete_user(self, user_id: str) -> bool:
        """Delete a user and all their associated data"""
        try:
            # 1. Delete user's messages
            self.client.delete_by_query(
                index="marie_messages",
                body={"query": {"term": {"user_id": user_id}}},
                refresh=True
            )
            
            # 2. Delete user's conversations
            self.client.delete_by_query(
                index="marie_conversations",
                body={"query": {"term": {"user_id": user_id}}},
                refresh=True
            )
            
            # 3. Delete user's API keys
            self.client.delete_by_query(
                index="marie_api_keys",
                body={"query": {"term": {"user_id": user_id}}},
                refresh=True
            )
            
            # 4. Delete user's memory
            self.client.delete_by_query(
                index="marie_memory",
                body={"query": {"term": {"user_id": user_id}}},
                refresh=True
            )
            
            # 5. Delete the user document
            self.client.delete(index="marie_users", id=user_id, refresh=True)
            
            return True
        except Exception as e:
            print(f"Error deleting user {user_id}: {e}")
            return False

admin_service = AdminService()
