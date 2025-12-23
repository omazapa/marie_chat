import eventlet
eventlet.monkey_patch()

from app import create_app
from app.services.opensearch_service import OpenSearchService

app = create_app()
with app.app_context():
    service = OpenSearchService()
    email = "admin@marie.com"
    password = "admin123"
    
    user = service.get_user_by_email(email)
    if user:
        print(f"User {email} already exists. Deleting...")
        service.client.delete(index="marie_users", id=user['id'], refresh=True)
    
    user = service.create_user(
        email=email,
        password=password,
        full_name="Administrator",
        role="admin"
    )
    print(f"Admin user created: {user}")
