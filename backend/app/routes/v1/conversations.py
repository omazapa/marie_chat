"""
V1 Conversations Routes
External REST API for managing conversations using API Key authentication
"""

from typing import Any, cast

from flask import Blueprint, jsonify, request

from app.services.llm_service import llm_service
from app.utils.auth import api_key_required

v1_conversations_bp = Blueprint("v1_conversations", __name__)


@v1_conversations_bp.route("", methods=["GET"])
@api_key_required
def list_conversations():
    """List user's conversations via API"""
    user_id = cast(Any, request).user_id

    # Get query parameters for pagination
    limit = request.args.get("limit", 20, type=int)
    offset = request.args.get("offset", 0, type=int)

    # Use the existing service method
    conversations = llm_service.list_conversations(user_id, limit=limit, offset=offset)
    return jsonify({"conversations": conversations}), 200


@v1_conversations_bp.route("", methods=["POST"])
@api_key_required
def create_conversation():
    """Create a new conversation via API"""
    user_id = cast(Any, request).user_id
    data = request.get_json()

    if not data:
        data = {}

    title = data.get("title", "New API Conversation")
    model = data.get("model")
    provider = data.get("provider")
    system_prompt = data.get("system_prompt")

    conversation = llm_service.create_conversation(
        user_id=user_id, title=title, model=model, provider=provider, system_prompt=system_prompt
    )

    return jsonify(conversation), 201


@v1_conversations_bp.route("/<conversation_id>", methods=["GET"])
@api_key_required
def get_conversation(conversation_id):
    """Get conversation details via API"""
    user_id = cast(Any, request).user_id

    conversation = llm_service.get_conversation(conversation_id, user_id)
    if not conversation:
        return jsonify({"error": "Conversation not found"}), 404

    return jsonify(conversation), 200


@v1_conversations_bp.route("/<conversation_id>", methods=["DELETE"])
@api_key_required
def delete_conversation(conversation_id):
    """Delete a conversation via API"""
    user_id = cast(Any, request).user_id

    success = llm_service.delete_conversation(conversation_id, user_id)
    if not success:
        return jsonify({"error": "Conversation not found or access denied"}), 404

    return jsonify({"message": "Conversation deleted"}), 200


@v1_conversations_bp.route("/bulk-delete", methods=["POST"])
@api_key_required
def bulk_delete_conversations():
    """Delete multiple conversations via API"""
    user_id = cast(Any, request).user_id
    data = request.get_json()

    conversation_ids = data.get("conversation_ids", [])
    if not conversation_ids:
        return jsonify({"error": "No conversation IDs provided"}), 400

    success = llm_service.delete_conversations(conversation_ids, user_id)
    if not success:
        return jsonify({"error": "Bulk delete failed"}), 500

    return jsonify({"message": f"{len(conversation_ids)} conversations deleted"}), 200


@v1_conversations_bp.route("/<conversation_id>/messages", methods=["GET"])
@api_key_required
def get_messages(conversation_id):
    """Get messages from a conversation via API"""
    user_id = cast(Any, request).user_id

    # Verify conversation exists and belongs to user
    conversation = llm_service.get_conversation(conversation_id, user_id)
    if not conversation:
        return jsonify({"error": "Conversation not found"}), 404

    messages = llm_service.get_messages(conversation_id, user_id)
    return jsonify({"messages": messages}), 200
