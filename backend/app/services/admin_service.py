import uuid
from datetime import datetime
from typing import Any

import bcrypt

from app.services.opensearch_service import OpenSearchService


class AdminService:
    def __init__(self):
        self.opensearch = OpenSearchService()
        self.client = self.opensearch.client

    def _get_default_permissions(self, role: str) -> dict[str, bool]:
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

    def get_system_stats(self) -> dict[str, Any]:
        """Get system-wide statistics from OpenSearch"""
        try:
            # Get indices stats
            indices = [
                "marie_chat_users",
                "marie_chat_conversations",
                "marie_chat_messages",
                "marie_chat_memory",
            ]
            stats = {}

            for index in indices:
                try:
                    res = self.client.indices.stats(index=index)
                    stats[index] = {
                        "docs_count": res["indices"][index]["total"]["docs"]["count"],
                        "store_size_bytes": res["indices"][index]["total"]["store"][
                            "size_in_bytes"
                        ],
                    }
                except Exception:
                    stats[index] = {"docs_count": 0, "store_size_bytes": 0}

            # Get cluster health
            health = self.client.cluster.health()

            return {
                "indices": stats,
                "cluster_health": health["status"],
                "nodes_count": health["number_of_nodes"],
                "timestamp": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            print(f"Error getting system stats: {e}")
            return {"error": str(e)}

    def list_users(self, limit: int = 50, offset: int = 0) -> list[dict[str, Any]]:
        """List all users with pagination"""
        try:
            query = {
                "query": {"match_all": {}},
                "size": limit,
                "from": offset,
                "sort": [{"created_at": {"order": "desc"}}],
            }
            res = self.client.search(index="marie_chat_users", body=query)
            users = []
            for hit in res["hits"]["hits"]:
                user = hit["_source"]
                user["id"] = hit["_id"]  # Add the document ID
                user.pop("password_hash", None)
                user.pop("hashed_password", None)  # Remove both variants
                users.append(user)
            return users
        except Exception as e:
            print(f"Error listing users: {e}")
            return []

    def update_user_status(self, user_id: str, is_active: bool) -> bool:
        """Enable or disable a user account"""
        try:
            self.client.update(
                index="marie_chat_users",
                id=user_id,
                body={"doc": {"is_active": is_active, "updated_at": datetime.utcnow().isoformat()}},
                refresh=True,
            )
            return True
        except Exception as e:
            print(f"Error updating user status: {e}")
            return False

    def update_user_role(self, user_id: str, role: str) -> bool:
        """Change user role (admin/user)"""
        try:
            # Get default permissions for the new role
            permissions = self._get_default_permissions(role)

            self.client.update(
                index="marie_chat_users",
                id=user_id,
                body={
                    "doc": {
                        "role": role,
                        "permissions": permissions,
                        "updated_at": datetime.utcnow().isoformat(),
                    }
                },
                refresh=True,
            )
            return True
        except Exception as e:
            print(f"Error updating user role: {e}")
            return False

    def create_user(
        self, email: str, full_name: str, password: str, role: str = "user"
    ) -> dict[str, Any] | None:
        """Create a new user"""
        try:
            # Check if user already exists
            existing = self.client.search(
                index="marie_chat_users", body={"query": {"term": {"email.keyword": email}}}, size=1
            )
            if existing["hits"]["total"]["value"] > 0:
                return None

            # Hash password
            hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode(
                "utf-8"
            )

            # Get default permissions
            permissions = self._get_default_permissions(role)

            # Create user document
            user_id = str(uuid.uuid4())
            now = datetime.utcnow().isoformat()

            user_doc = {
                "email": email,
                "full_name": full_name,
                "password_hash": hashed_password,  # Changed from hashed_password
                "role": role,
                "permissions": permissions,
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            }

            self.client.index(index="marie_chat_users", id=user_id, body=user_doc, refresh=True)

            # Return user without password
            return {
                "id": user_id,
                "email": email,
                "full_name": full_name,
                "role": role,
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            }
        except Exception as e:
            print(f"Error creating user: {e}")
            return None

    def delete_user(self, user_id: str) -> bool:
        """Delete a user and all their associated data"""
        try:
            # 1. Delete user's messages
            self.client.delete_by_query(
                index="marie_chat_messages",
                body={"query": {"term": {"user_id": user_id}}},
                refresh=True,
            )

            # 2. Delete user's conversations
            self.client.delete_by_query(
                index="marie_chat_conversations",
                body={"query": {"term": {"user_id": user_id}}},
                refresh=True,
            )

            # 3. Delete user's API keys
            self.client.delete_by_query(
                index="marie_chat_api_keys",
                body={"query": {"term": {"user_id": user_id}}},
                refresh=True,
            )

            # 4. Delete user's memory
            self.client.delete_by_query(
                index="marie_chat_memory",
                body={"query": {"term": {"user_id": user_id}}},
                refresh=True,
            )

            # 5. Delete the user document
            self.client.delete(index="marie_chat_users", id=user_id, refresh=True)

            return True
        except Exception as e:
            print(f"Error deleting user {user_id}: {e}")
            return False


admin_service = AdminService()
