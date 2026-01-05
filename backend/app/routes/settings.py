from typing import Any

from flask import Blueprint, jsonify, request

from app.services.settings_service import settings_service
from app.utils.auth import admin_required

settings_bp = Blueprint("settings", __name__)


@settings_bp.route("/public", methods=["GET"])
def get_public_settings():
    """Get public system settings (white label)"""
    config = settings_service.get_settings()
    # Only return white label info
    return jsonify({"white_label": config.get("white_label", {})}), 200


@settings_bp.route("", methods=["GET"])
@admin_required
def get_settings():
    """Get system settings"""
    config = settings_service.get_settings()
    return jsonify(config), 200


@settings_bp.route("", methods=["PUT"])
@admin_required
def update_settings():
    """Update system settings"""
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    success = settings_service.update_settings(data)
    if success:
        # Re-initialize providers to apply new API keys/endpoints
        from app.services.provider_factory import initialize_providers

        initialize_providers()
        return jsonify({"message": "Settings updated successfully"}), 200
    return jsonify({"error": "Failed to update settings"}), 500


@settings_bp.route("/test-provider", methods=["POST"])
@admin_required
def test_provider():
    """Test a provider connection with provided configuration"""
    data = request.get_json()
    provider_name = data.get("provider")
    config = data.get("config", {})

    if not provider_name:
        return jsonify({"error": "Provider name is required"}), 400

    try:
        from app.services.agent_provider import AgentProvider
        from app.services.huggingface_provider import HuggingFaceProvider
        from app.services.ollama_provider import OllamaProvider
        from app.services.openai_provider import OpenAIProvider

        provider_classes = {
            "ollama": OllamaProvider,
            "huggingface": HuggingFaceProvider,
            "openai": OpenAIProvider,
            "agent": AgentProvider,
        }

        if provider_name not in provider_classes:
            return jsonify({"error": f"Unknown provider: {provider_name}"}), 400

        # Create a temporary instance to test
        provider_class = provider_classes[provider_name]
        temp_provider: Any = provider_class(config)  # type: ignore[abstract]
        health = temp_provider.health_check()

        return jsonify(health), 200
    except Exception as e:
        return jsonify({"error": str(e), "available": False}), 500


@settings_bp.route("/providers", methods=["POST"])
@admin_required
def add_provider():
    """Add a new provider"""
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    try:
        provider_id = settings_service.add_provider(data)
        # Re-initialize providers to include the new one
        from app.services.provider_factory import initialize_providers

        initialize_providers()
        return jsonify({"id": provider_id, "message": "Provider added successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@settings_bp.route("/providers/<provider_id>", methods=["PUT"])
@admin_required
def update_provider(provider_id: str):
    """Update an existing provider"""
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    try:
        success = settings_service.update_provider(provider_id, data)
        if success:
            # Re-initialize providers to apply changes
            from app.services.provider_factory import initialize_providers

            initialize_providers()
            return jsonify({"message": "Provider updated successfully"}), 200
        return jsonify({"error": "Provider not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@settings_bp.route("/providers/<provider_id>", methods=["DELETE"])
@admin_required
def delete_provider(provider_id: str):
    """Delete a provider"""
    try:
        success = settings_service.delete_provider(provider_id)
        if success:
            # Re-initialize providers to remove the deleted one
            from app.services.provider_factory import initialize_providers

            initialize_providers()
            return jsonify({"message": "Provider deleted successfully"}), 200
        return jsonify({"error": "Provider not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
