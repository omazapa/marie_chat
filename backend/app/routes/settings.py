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
        return jsonify({"message": "Settings updated successfully"}), 200
    return jsonify({"error": "Failed to update settings"}), 500
