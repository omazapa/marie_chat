import eventlet
eventlet.monkey_patch()

from app import create_app
from app.services.opensearch_service import OpenSearchService

app = create_app()
with app.app_context():
    service = OpenSearchService()
    email = "test@example.com"
    password = "password123"
    
    user = service.get_user_by_email(email)
    if user:
        print(f"User {email} already exists. Updating password...")
        # We don't have a direct update password but we can delete and recreate or just assume it's fine if we know the password.
        # Let's just delete and recreate to be sure.
        service.client.delete(index="marie_users", id=user['id'], refresh=True)
    
    user = service.create_user(
        email=email,
        password=password,
        full_name="Test User"
    )
    print(f"User created: {user}")
