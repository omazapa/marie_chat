import eventlet
eventlet.monkey_patch()

import sys
import argparse
from app import create_app
from app.services.opensearch_service import OpenSearchService

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
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            # Update existing user to admin
            service.client.update(
                index="marie_users",
                id=user['id'],
                body={
                    "doc": {
                        "role": "admin",
                        "roles": ["admin"],
                        "password_hash": password_hash,
                        "permissions": service._get_default_permissions("admin"),
                        "updated_at": now
                    }
                },
                refresh=True
            )
            print(f"User {email} is now an admin with the new password.")
            return
        
        # Create new admin user
        user = service.create_user(
            email=email,
            password=password,
            full_name=full_name,
            role="admin"
        )
        print(f"Admin user created successfully: {email}")
        print(f"User ID: {user['id']}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create or promote a Marie Chat admin user.")
    parser.add_argument("--email", required=True, help="Admin email")
    parser.add_argument("--password", required=True, help="Admin password")
    parser.add_argument("--name", default="System Admin", help="Admin full name")
    
    args = parser.parse_args()
    create_admin(args.email, args.password, args.name)
