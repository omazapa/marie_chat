"""
Conversation Routes
REST API endpoints for conversation management
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.services.llm_service import llm_service

conversations_bp = Blueprint("conversations", __name__)


@conversations_bp.route("", methods=["POST"])
@jwt_required()
def create_conversation():
    """Create a new conversation"""
    user_id = get_jwt_identity()
    data = request.get_json()

    title = data.get("title", "New Conversation")
    model = data.get("model")
    provider = data.get("provider")
    system_prompt = data.get("system_prompt")
    settings = data.get("settings", {})

    conversation = llm_service.create_conversation(
        user_id=user_id,
        title=title,
        model=model,
        provider=provider,
        system_prompt=system_prompt,
        settings=settings,
    )

    return jsonify(conversation), 201


@conversations_bp.route("", methods=["GET"])
@jwt_required()
def get_conversations():
    """List user's conversations"""
    user_id = get_jwt_identity()

    limit = request.args.get("limit", 50, type=int)
    offset = request.args.get("offset", 0, type=int)

    conversations = llm_service.list_conversations(user_id=user_id, limit=limit, offset=offset)

    return jsonify({"conversations": conversations}), 200


@conversations_bp.route("/search", methods=["GET"])
@jwt_required()
def search_conversations():
    """Search conversations and messages"""
    user_id = get_jwt_identity()
    query = request.args.get("q", "")
    scope = request.args.get("scope", "conversations")  # 'conversations' or 'messages'
    conversation_id = request.args.get("conversation_id")
    limit = request.args.get("limit", 20, type=int)
    offset = request.args.get("offset", 0, type=int)

    if not query:
        return jsonify({"results": []}), 200

    if scope == "messages":
        results = llm_service.search_messages(
            user_id=user_id,
            query_text=query,
            conversation_id=conversation_id,
            limit=limit,
            offset=offset,
        )
    else:
        results = llm_service.search_conversations(
            user_id=user_id, query_text=query, limit=limit, offset=offset
        )

    return jsonify({"results": results}), 200


@conversations_bp.route("/<conversation_id>", methods=["GET"])
@jwt_required()
def get_conversation(conversation_id: str):
    """Get a specific conversation"""
    user_id = get_jwt_identity()

    conversation = llm_service.get_conversation(conversation_id=conversation_id, user_id=user_id)

    if not conversation:
        return jsonify({"error": "Conversation not found"}), 404

    return jsonify(conversation), 200


@conversations_bp.route("/<conversation_id>", methods=["PATCH"])
@jwt_required()
def update_conversation(conversation_id: str):
    """Update a conversation"""
    user_id = get_jwt_identity()
    data = request.get_json()

    # Only allow updating certain fields
    allowed_fields = ["title", "model", "provider", "system_prompt", "settings"]
    updates = {k: v for k, v in data.items() if k in allowed_fields}

    success = llm_service.update_conversation(
        conversation_id=conversation_id, user_id=user_id, **updates
    )

    if not success:
        return jsonify({"error": "Conversation not found or update failed"}), 404

    return jsonify({"message": "Conversation updated"}), 200


@conversations_bp.route("/<conversation_id>", methods=["DELETE"])
@jwt_required()
def delete_conversation(conversation_id: str):
    """Delete a conversation"""
    user_id = get_jwt_identity()

    success = llm_service.delete_conversation(conversation_id=conversation_id, user_id=user_id)

    if not success:
        return jsonify({"error": "Conversation not found or delete failed"}), 404

    return jsonify({"message": "Conversation deleted"}), 200


@conversations_bp.route("/bulk-delete", methods=["POST"])
@jwt_required()
def bulk_delete_conversations():
    """Delete multiple conversations"""
    user_id = get_jwt_identity()
    data = request.get_json()

    conversation_ids = data.get("conversation_ids", [])

    if not conversation_ids:
        return jsonify({"error": "No conversation IDs provided"}), 400

    success = llm_service.delete_conversations(conversation_ids=conversation_ids, user_id=user_id)

    if not success:
        return jsonify({"error": "Bulk delete failed"}), 500

    return jsonify({"message": f"{len(conversation_ids)} conversations deleted"}), 200


@conversations_bp.route("/<conversation_id>/messages", methods=["GET"])
@jwt_required()
def get_conversation_messages(conversation_id: str):
    """Get messages for a conversation"""
    user_id = get_jwt_identity()

    limit = request.args.get("limit", 100, type=int)
    offset = request.args.get("offset", 0, type=int)

    try:
        messages = llm_service.get_messages(
            conversation_id=conversation_id, user_id=user_id, limit=limit, offset=offset
        )
        return jsonify({"messages": messages}), 200
    except Exception as e:
        print(f"❌ Error in get_conversation_messages: {e}")
        return jsonify({"error": str(e)}), 500


@conversations_bp.route("/<conversation_id>/messages/truncate", methods=["POST"])
@jwt_required()
def truncate_conversation(conversation_id: str):
    """Delete messages after a certain timestamp"""
    user_id = get_jwt_identity()
    data = request.get_json()

    timestamp = data.get("timestamp")
    inclusive = data.get("inclusive", False)

    if not timestamp:
        return jsonify({"error": "timestamp is required"}), 400

    success = llm_service.delete_messages_after(
        conversation_id=conversation_id, user_id=user_id, timestamp=timestamp, inclusive=inclusive
    )

    if not success:
        return jsonify({"error": "Failed to truncate conversation"}), 500

    return jsonify({"message": "Conversation truncated"}), 200
