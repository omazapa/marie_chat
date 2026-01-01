from flask import Blueprint, jsonify, request

from app.services.admin_service import admin_service
from app.utils.auth import admin_required

admin_bp = Blueprint("admin", __name__)


@admin_bp.route("/stats", methods=["GET"])
@admin_required
def get_stats():
    """Get system statistics"""
    stats = admin_service.get_system_stats()
    return jsonify(stats), 200


@admin_bp.route("/users", methods=["GET"])
@admin_required
def list_users():
    """List all users"""
    limit = request.args.get("limit", 50, type=int)
    offset = request.args.get("offset", 0, type=int)
    users = admin_service.list_users(limit, offset)
    return jsonify({"users": users}), 200


@admin_bp.route("/users/<user_id>/status", methods=["PUT"])
@admin_required
def update_user_status(user_id):
    """Enable/disable user"""
    data = request.get_json()
    is_active = data.get("is_active")

    if is_active is None:
        return jsonify({"error": "is_active field is required"}), 400

    success = admin_service.update_user_status(user_id, is_active)
    if success:
        return jsonify({"message": "User status updated successfully"}), 200
    return jsonify({"error": "Failed to update user status"}), 500


@admin_bp.route("/users/<user_id>/role", methods=["PUT"])
@admin_required
def update_user_role(user_id):
    """Change user role"""
    data = request.get_json()
    role = data.get("role")

    if role not in ["admin", "user"]:
        return jsonify({"error": "Invalid role. Must be admin or user"}), 400

    success = admin_service.update_user_role(user_id, role)
    if success:
        return jsonify({"message": "User role updated successfully"}), 200
    return jsonify({"error": "Failed to update user role"}), 500


@admin_bp.route("/users/<user_id>", methods=["DELETE"])
@admin_required
def delete_user(user_id):
    """Delete user and all data"""
    success = admin_service.delete_user(user_id)
    if success:
        return jsonify({"message": "User and all associated data deleted successfully"}), 200
    return jsonify({"error": "Failed to delete user"}), 500
