"""
V1 Settings Routes
External REST API for managing system settings using API Key authentication
"""

from flask import Blueprint, jsonify, request

from app.services.settings_service import settings_service
from app.utils.auth import api_key_required

v1_settings_bp = Blueprint("v1_settings", __name__)


@v1_settings_bp.route("/registration", methods=["PUT"])
@api_key_required
def toggle_registration():
    """Toggle user registration via API Key"""
    data = request.get_json()
    if not data or "enabled" not in data:
        return jsonify({"error": "Field 'enabled' is required"}), 400

    enabled = bool(data.get("enabled"))

    # Get current settings
    settings = settings_service.get_settings()

    # Update registration_enabled
    if "white_label" not in settings:
        settings["white_label"] = {}

    settings["white_label"]["registration_enabled"] = enabled

    success = settings_service.update_settings(settings)
    if success:
        return jsonify(
            {
                "message": f"Registration {'enabled' if enabled else 'disabled'} successfully",
                "registration_enabled": enabled,
            }
        ), 200

    return jsonify({"error": "Failed to update settings"}), 500
