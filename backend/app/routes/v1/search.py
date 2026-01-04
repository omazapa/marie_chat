"""
V1 Search Routes
External REST API for searching conversations and messages using API Key authentication
"""

from typing import Any, cast

from flask import Blueprint, jsonify, request

from app.services.llm_service import llm_service
from app.utils.auth import api_key_required

v1_search_bp = Blueprint("v1_search", __name__)


@v1_search_bp.route("", methods=["GET"])
@api_key_required
def search():
    """Search conversations and messages via API"""
    user_id = cast(Any, request).user_id
    query = request.args.get("q", "")

    if not query:
        return jsonify({"error": "Search query (q) is required"}), 400

    # Get search type: 'text' (default) or 'semantic'
    search_type = request.args.get("type", "text")
    limit = request.args.get("limit", 10, type=int)

    if search_type == "semantic":
        results = llm_service.search_messages(user_id, query, limit=limit)
    else:
        results = llm_service.search_conversations(user_id, query, limit=limit)

    return jsonify({"results": results}), 200
