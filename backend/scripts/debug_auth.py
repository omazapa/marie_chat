"""Debug script to check authentication."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import Config
from app.services.opensearch_service import OpenSearchService
from app.services.auth_service import AuthService

config = Config()
print(f"OpenSearch Hosts: {config.OPENSEARCH_HOSTS}")
print(f"OpenSearch User: {config.OPENSEARCH_USER}")
print(f"Use SSL: {config.OPENSEARCH_USE_SSL}")
print(f"Verify Certs: {config.OPENSEARCH_VERIFY_CERTS}")

try:
    opensearch_service = OpenSearchService(
        hosts=config.OPENSEARCH_HOSTS,
        auth=(config.OPENSEARCH_USER, config.OPENSEARCH_PASSWORD),
        use_ssl=config.OPENSEARCH_USE_SSL,
        verify_certs=config.OPENSEARCH_VERIFY_CERTS
    )
    
    # Check if index exists
    exists = opensearch_service.index_exists("marie_users")
    print(f"\nIndex marie_users exists: {exists}")
    
    if exists:
        # Search for user
        auth_service = AuthService(opensearch_service)
        
        # Try to find user
        query = {
            "query": {
                "match_all": {}
            }
        }
        results = opensearch_service.search("marie_users", query, size=10)
        print(f"\nTotal users found: {len(results) if results else 0}")
        
        if results:
            for user in results:
                email = user.get('email', 'N/A')
                has_password = 'password_hash' in user
                is_active = user.get('is_active', False)
                print(f"  - Email: {email}, Has password: {has_password}, Active: {is_active}")
        
        # Try to get user by email
        user = auth_service.get_user_by_email("test@test.com")
        if user:
            print(f"\nFound user test@test.com: {user.get('email')}")
        else:
            print("\nUser test@test.com NOT found")
            
        # Try authenticate
        auth_result = auth_service.authenticate_user("test@test.com", "poioiulkj")
        if auth_result:
            print(f"Authentication SUCCESS for test@test.com")
        else:
            print(f"Authentication FAILED for test@test.com")
            
except Exception as e:
    print(f"\nERROR: {e}")
    import traceback
    traceback.print_exc()

