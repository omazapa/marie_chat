"""
Admin Initialization Service
Creates initial admin user if none exists
"""

import os

from opensearchpy import OpenSearch

from app.db import opensearch_client


def init_admin_user() -> None:
    """
    Create initial admin user if no admin exists.

    Uses ADMIN_EMAIL and ADMIN_PASSWORD from environment variables.
    Only creates the user if:
    1. Environment variables are set
    2. No admin user exists in the system

    Security notes:
    - This only runs on first startup
    - Admin password should be changed after first login
    - Credentials are never logged
    """
    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")

    # Skip if credentials not provided
    if not admin_email or not admin_password:
        print("ℹ️  No ADMIN_EMAIL/ADMIN_PASSWORD provided, skipping admin creation")
        return

    try:
        client: OpenSearch = opensearch_client.client

        # Check if marie_users index exists
        if not client.indices.exists(index="marie_chat_users"):
            print("⚠️  marie_users index doesn't exist yet, skipping admin creation")
            return

        # Check if any admin user exists
        admin_query = {"query": {"term": {"role.keyword": "admin"}}, "size": 1}

        result = client.search(index="marie_chat_users", body=admin_query)

        if result["hits"]["total"]["value"] > 0:
            print("✅ Admin user already exists, skipping creation")
            return

        # Create admin user
        import uuid
        from datetime import datetime

        import bcrypt

        user_id = str(uuid.uuid4())
        password_hash = bcrypt.hashpw(admin_password.encode("utf-8"), bcrypt.gensalt()).decode(
            "utf-8"
        )

        admin_user = {
            "email": admin_email,
            "full_name": "Admin",
            "password_hash": password_hash,
            "role": "admin",
            "permissions": {
                "can_create_users": True,
                "can_manage_system": True,
                "can_view_logs": True,
                "can_manage_models": True,
            },
            "is_active": True,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }

        client.index(index="marie_chat_users", id=user_id, body=admin_user, refresh=True)

        print(f"✅ Created initial admin user: {admin_email}")
        print("⚠️  IMPORTANT: Change the admin password after first login!")

    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        print("   You may need to create an admin user manually")
