"""User settings routes."""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from pydantic import ValidationError

from app.services.user_settings_service import user_settings_service
from app.schemas.user_settings import (
    UpdateProfileRequest,
    ChangePasswordRequest,
    AgentPreferencesRequest,
    InterfacePreferencesRequest,
    PrivacyPreferencesRequest,
)

user_settings_bp = Blueprint("user_settings", __name__)


# ==================== PROFILE ENDPOINTS ====================


@user_settings_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    """Get current user profile."""
    user_id = get_jwt_identity()
    profile = user_settings_service.get_user_profile(user_id)

    if not profile:
        return jsonify({"error": "User not found"}), 404

    return jsonify(profile), 200


@user_settings_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    """Update user profile (name and/or email)."""
    try:
        data = UpdateProfileRequest(**request.get_json())
    except ValidationError as e:
        return jsonify({"error": "Validation error", "details": e.errors()}), 400

    user_id = get_jwt_identity()

    # Check if at least one field is being updated
    if data.full_name is None and data.email is None:
        return jsonify({"error": "No fields to update"}), 400

    updated_profile = user_settings_service.update_user_profile(
        user_id=user_id, full_name=data.full_name, email=data.email
    )

    if not updated_profile:
        return jsonify({"error": "Email already taken or user not found"}), 400

    return jsonify({"message": "Profile updated successfully", "user": updated_profile}), 200


@user_settings_bp.route("/password", methods=["PUT"])
@jwt_required()
def change_password():
    """Change user password."""
    try:
        data = ChangePasswordRequest(**request.get_json())
    except ValidationError as e:
        return jsonify({"error": "Validation error", "details": e.errors()}), 400

    user_id = get_jwt_identity()

    success = user_settings_service.change_user_password(
        user_id=user_id,
        current_password=data.current_password,
        new_password=data.new_password,
    )

    if not success:
        return jsonify({"error": "Current password is incorrect"}), 400

    return jsonify({"message": "Password changed successfully"}), 200


# ==================== PREFERENCES ENDPOINTS ====================


@user_settings_bp.route("/preferences", methods=["GET"])
@jwt_required()
def get_preferences():
    """Get all user preferences."""
    user_id = get_jwt_identity()
    preferences = user_settings_service.get_user_preferences(user_id)
    return jsonify(preferences), 200


@user_settings_bp.route("/preferences/agent", methods=["PUT"])
@jwt_required()
def update_agent_preferences():
    """Update agent/LLM preferences."""
    try:
        data = AgentPreferencesRequest(**request.get_json())
    except ValidationError as e:
        return jsonify({"error": "Validation error", "details": e.errors()}), 400

    user_id = get_jwt_identity()

    # Convert to dict and remove None values
    prefs_dict = {k: v for k, v in data.model_dump().items() if v is not None}

    # Handle nested parameters
    if data.parameters:
        prefs_dict["parameters"] = {
            k: v for k, v in data.parameters.model_dump().items() if v is not None
        }

    updated_prefs = user_settings_service.update_agent_preferences(user_id, prefs_dict)

    return jsonify(
        {"message": "Agent preferences updated successfully", "preferences": updated_prefs}
    ), 200


@user_settings_bp.route("/preferences/interface", methods=["PUT"])
@jwt_required()
def update_interface_preferences():
    """Update interface preferences."""
    try:
        data = InterfacePreferencesRequest(**request.get_json())
    except ValidationError as e:
        return jsonify({"error": "Validation error", "details": e.errors()}), 400

    user_id = get_jwt_identity()
    prefs_dict = {k: v for k, v in data.model_dump().items() if v is not None}

    updated_prefs = user_settings_service.update_interface_preferences(user_id, prefs_dict)

    return jsonify(
        {"message": "Interface preferences updated successfully", "preferences": updated_prefs}
    ), 200


@user_settings_bp.route("/preferences/privacy", methods=["PUT"])
@jwt_required()
def update_privacy_preferences():
    """Update privacy preferences."""
    try:
        data = PrivacyPreferencesRequest(**request.get_json())
    except ValidationError as e:
        return jsonify({"error": "Validation error", "details": e.errors()}), 400

    user_id = get_jwt_identity()
    prefs_dict = {k: v for k, v in data.model_dump().items() if v is not None}

    updated_prefs = user_settings_service.update_privacy_preferences(user_id, prefs_dict)

    return jsonify(
        {"message": "Privacy preferences updated successfully", "preferences": updated_prefs}
    ), 200


# ==================== DATA MANAGEMENT ENDPOINTS ====================


@user_settings_bp.route("/conversations", methods=["DELETE"])
@jwt_required()
def delete_all_conversations():
    """Delete all user conversations."""
    user_id = get_jwt_identity()
    deleted_count = user_settings_service.delete_all_user_conversations(user_id)

    return jsonify(
        {"message": "All conversations deleted successfully", "deleted_count": deleted_count}
    ), 200
