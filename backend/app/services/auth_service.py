"""Authentication service."""
from datetime import datetime
from typing import Optional, Dict, Any
import bcrypt
from app.services.opensearch_service import OpenSearchService


class AuthService:
    """Service for authentication operations."""
    
    def __init__(self, opensearch_service: OpenSearchService):
        """Initialize AuthService."""
        self.opensearch = opensearch_service
        self.index = "marie_users"
    
    def hash_password(self, password: str) -> str:
        """Hash a password using bcrypt."""
        salt = bcrypt.gensalt(rounds=12)
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    def verify_password(self, password: str, password_hash: str) -> bool:
        """Verify a password against a hash."""
        return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
    
    def create_user(self, email: str, password: str, full_name: str, role: str = "user") -> Optional[str]:
        """Create a new user."""
        # Check if user already exists
        existing = self.get_user_by_email(email)
        if existing:
            return None
        
        # Hash password
        password_hash = self.hash_password(password)
        
        # Create user document
        user_id = f"user_{datetime.now().timestamp()}_{email}"
        user_doc = {
            "id": user_id,
            "email": email,
            "password_hash": password_hash,
            "full_name": full_name,
            "role": role,
            "permissions": [],
            "is_active": True,
            "avatar_url": None,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Index user
        doc_id = self.opensearch.index_document(self.index, user_doc, doc_id=user_id)
        return doc_id
    
    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID."""
        user = self.opensearch.get_document(self.index, user_id)
        if user:
            # Remove sensitive data
            user.pop('password_hash', None)
        return user
    
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email."""
        # Use match query instead of term for case-insensitive search
        query = {
            "query": {
                "match": {
                    "email": email.lower()
                }
            }
        }
        results = self.opensearch.search(self.index, query, size=1)
        if results:
            user = results[0]
            # Remove sensitive data
            user.pop('password_hash', None)
            return user
        return None
    
    def authenticate_user(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        """Authenticate a user with email and password."""
        # Get user with password hash - use match for case-insensitive search
        query = {
            "query": {
                "match": {
                    "email": email.lower()
                }
            }
        }
        results = self.opensearch.search(self.index, query, size=1)
        if not results:
            return None
        
        user = results[0]
        password_hash = user.get('password_hash')
        
        # Verify password
        if not password_hash or not self.verify_password(password, password_hash):
            return None
        
        # Check if user is active
        if not user.get('is_active', False):
            return None
        
        # Remove sensitive data
        user.pop('password_hash', None)
        return user
    
    def update_user(self, user_id: str, updates: Dict[str, Any]) -> bool:
        """Update user information."""
        updates['updated_at'] = datetime.utcnow().isoformat()
        # Don't allow updating password_hash through this method
        updates.pop('password_hash', None)
        return self.opensearch.update_document(self.index, user_id, updates)
    
    def update_password(self, user_id: str, new_password: str) -> bool:
        """Update user password."""
        password_hash = self.hash_password(new_password)
        return self.update_user(user_id, {"password_hash": password_hash})

