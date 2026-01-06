"""
Agent Configuration Routes
API endpoints for managing agent runtime configurations
"""

import asyncio

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.domain.entities.agent_config import ConfigSchemaResponse
from app.services.agent_config_service import AgentConfigService
from app.services.llm_service import LLMService

agent_config_bp = Blueprint("agent_config", __name__)
config_service = AgentConfigService()
llm_service = LLMService()


@agent_config_bp.route("/models/<provider>/<path:model_id>/config/schema", methods=["GET"])
@jwt_required()
def get_config_schema(provider: str, model_id: str):
    """
    Get configuration schema for an agent.

    Returns the available configuration fields that can be modified
    for the specified agent/model.

    Args:
        provider: Provider name (e.g., 'agent')
        model_id: Model/agent identifier

    Returns:
        200: ConfigSchemaResponse with available fields
        404: If model not found or doesn't support configuration
        500: Server error
    """
    try:
        # Get the provider instance
        provider_instance = llm_service.provider_factory.get_provider(provider)

        if not provider_instance:
            return jsonify({"error": f"Provider '{provider}' not found"}), 404

        # Only agent providers support configuration discovery
        from app.services.agent_provider import AgentProvider

        if not isinstance(provider_instance, AgentProvider):
            return jsonify(
                {"error": f"Provider '{provider}' does not support dynamic configuration"}
            ), 400

        # Fetch schema from remote service (AgentProvider has this method)
        schema = asyncio.run(provider_instance.get_config_schema(model_id))

        if not schema:
            return jsonify(
                {
                    "provider": provider,
                    "model_id": model_id,
                    "fields": [],
                    "message": "No configuration schema available for this agent",
                }
            ), 200

        # Parse schema to fields
        fields = provider_instance.parse_schema_to_fields(schema)

        response = ConfigSchemaResponse(
            provider=provider, model_id=model_id, fields=fields, raw_schema=schema
        )

        return jsonify(response.model_dump()), 200

    except Exception as e:
        print(f"Error fetching config schema: {e}")
        import traceback

        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@agent_config_bp.route("/models/<provider>/<path:model_id>/config/values", methods=["GET"])
@jwt_required()
def get_config_values(provider: str, model_id: str):
    """
    Get current configuration values for an agent.

    Returns the saved configuration with priority:
    conversation-specific > global > empty dict

    Query Parameters:
        conversation_id: Optional conversation ID for conversation-scoped config

    Args:
        provider: Provider name
        model_id: Model/agent identifier

    Returns:
        200: Configuration values dict
        500: Server error
    """
    try:
        user_id = get_jwt_identity()
        conversation_id = request.args.get("conversation_id")

        config_values = asyncio.run(
            config_service.load_config(
                user_id=user_id,
                provider=provider,
                model_id=model_id,
                conversation_id=conversation_id,
            )
        )

        return jsonify(config_values), 200

    except Exception as e:
        print(f"Error loading config values: {e}")
        return jsonify({"error": str(e)}), 500


@agent_config_bp.route("/models/<provider>/<path:model_id>/config/values", methods=["POST"])
@jwt_required()
def set_config_values(provider: str, model_id: str):
    """
    Save configuration values for an agent.

    Request Body:
        config_values: dict - Configuration key-value pairs

    Query Parameters:
        scope: 'global' or 'conversation' (default: 'global')
        conversation_id: Required if scope is 'conversation'

    Args:
        provider: Provider name
        model_id: Model/agent identifier

    Returns:
        200: Saved AgentConfig
        400: Invalid request
        500: Server error
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        if not data or "config_values" not in data:
            return jsonify({"error": "config_values required in request body"}), 400

        config_values = data["config_values"]
        scope = request.args.get("scope", "global")
        conversation_id = request.args.get("conversation_id")

        if scope not in ["global", "conversation"]:
            return jsonify({"error": "scope must be 'global' or 'conversation'"}), 400

        if scope == "conversation" and not conversation_id:
            return jsonify({"error": "conversation_id required when scope is 'conversation'"}), 400

        saved_config = asyncio.run(
            config_service.save_config(
                user_id=user_id,
                provider=provider,
                model_id=model_id,
                config_values=config_values,
                scope=scope,  # type: ignore
                conversation_id=conversation_id,
            )
        )

        return jsonify(saved_config.model_dump()), 200

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        print(f"Error saving config: {e}")
        import traceback

        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@agent_config_bp.route("/models/<provider>/<path:model_id>/config", methods=["DELETE"])
@jwt_required()
def delete_config(provider: str, model_id: str):
    """
    Delete a configuration.

    Query Parameters:
        scope: 'global' or 'conversation' (default: 'global')
        conversation_id: Required if scope is 'conversation'

    Args:
        provider: Provider name
        model_id: Model/agent identifier

    Returns:
        200: Success message
        404: Configuration not found
        500: Server error
    """
    try:
        user_id = get_jwt_identity()
        scope = request.args.get("scope", "global")
        conversation_id = request.args.get("conversation_id")

        if scope not in ["global", "conversation"]:
            return jsonify({"error": "scope must be 'global' or 'conversation'"}), 400

        deleted = asyncio.run(
            config_service.delete_config(
                user_id=user_id,
                provider=provider,
                model_id=model_id,
                scope=scope,  # type: ignore
                conversation_id=conversation_id,
            )
        )

        if deleted:
            return jsonify({"message": "Configuration deleted successfully"}), 200
        else:
            return jsonify({"error": "Configuration not found"}), 404

    except Exception as e:
        print(f"Error deleting config: {e}")
        return jsonify({"error": str(e)}), 500


@agent_config_bp.route("/models/configs", methods=["GET"])
@jwt_required()
def list_user_configs():
    """
    List all configurations for the current user.

    Query Parameters:
        provider: Optional provider filter

    Returns:
        200: List of AgentConfig objects
        500: Server error
    """
    try:
        user_id = get_jwt_identity()
        provider = request.args.get("provider")

        configs = asyncio.run(config_service.list_user_configs(user_id=user_id, provider=provider))

        return jsonify([config.model_dump() for config in configs]), 200

    except Exception as e:
        print(f"Error listing configs: {e}")
        return jsonify({"error": str(e)}), 500
