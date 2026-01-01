"""
Authentication Utilities
Decorators and helpers for API authentication
"""

from functools import wraps
from typing import Any, cast

from flask import jsonify, request
from flask_jwt_extended import get_jwt, jwt_required

from app.services.api_key_service import api_key_service


def api_key_required(f):
    """Decorator to require a valid API Key in the X-API-Key header"""

    @wraps(f)
    def decorated(*args, **kwargs):
        api_key = request.headers.get("X-API-Key")
        if not api_key:
            return jsonify({"error": "API Key is required in X-API-Key header"}), 401

        key_info = api_key_service.validate_api_key(api_key)
        if not key_info:
            return jsonify({"error": "Invalid, expired, or inactive API Key"}), 401

        # Add user_id and key_id to request context for use in the route
        cast(Any, request).user_id = key_info["user_id"]
        cast(Any, request).api_key_id = key_info["id"]

        return f(*args, **kwargs)

    return decorated


def admin_required(f):
    """Decorator to require admin role in JWT claims"""

    @wraps(f)
    @jwt_required()
    def decorated(*args, **kwargs):
        claims = get_jwt()
        if claims.get("role") != "admin":
            return jsonify({"error": "Admin privileges required"}), 403
        return f(*args, **kwargs)

    return decorated
