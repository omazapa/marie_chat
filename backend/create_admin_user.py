#!/usr/bin/env python3
import argparse

from app import create_app  # noqa: E402
from app.services.opensearch_service import OpenSearchService  # noqa: E402


def create_admin(email, password, full_name):
    app = create_app()
    with app.app_context():
        service = OpenSearchService()
        from datetime import datetime

        now = datetime.utcnow().isoformat()

        # Check if user already exists
        user = service.get_user_by_email(email)
        if user:
            print(f"User {email} already exists. Promoting to admin and updating password...")

            # Hash new password
            import bcrypt

            password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode(
                "utf-8"
            )

            # Update existing user to admin
            service.client.update(
                index="marie_users",
                id=user["id"],
                body={
                    "doc": {
                        "role": "admin",
                        "roles": ["admin"],
                        "password_hash": password_hash,
                        "permissions": service._get_default_permissions("admin"),
                        "updated_at": now,
                    }
                },
                refresh=True,
            )
            print(f"User {email} is now an admin with the new password.")

            # Create an API key for the admin if they don't have one
            from app.services.api_key_service import api_key_service

            keys = api_key_service.list_api_keys(user["id"])
            if not keys:
                key_info = api_key_service.create_api_key(user["id"], "Admin Master Key")
                print(f"✅ Created Admin Master API Key: {key_info['api_key']}")
            else:
                print(f"Admin already has {len(keys)} API keys.")
            return

        # Create new admin user
        user = service.create_user(
            email=email, password=password, full_name=full_name, role="admin"
        )
        print(f"Admin user created successfully: {email}")
        print(f"User ID: {user['id']}")

        # Create an API key for the admin
        from app.services.api_key_service import api_key_service

        # Check if an API key already exists for this user
        keys = api_key_service.list_api_keys(user["id"])
        if not keys:
            key_info = api_key_service.create_api_key(user["id"], "Admin Master Key")
            print(f"✅ Created Admin Master API Key: {key_info['api_key']}")
        else:
            print(f"Admin already has {len(keys)} API keys.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create or promote a Marie Chat admin user.")
    parser.add_argument("--email", required=True, help="Admin email")
    parser.add_argument("--password", required=True, help="Admin password")
    parser.add_argument("--name", default="System Admin", help="Admin full name")

    args = parser.parse_args()
    create_admin(args.email, args.password, args.name)
