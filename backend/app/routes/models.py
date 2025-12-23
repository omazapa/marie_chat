"""
Models API Routes
Endpoints for listing and managing LLM models
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from app.services.provider_factory import provider_factory, model_registry

models_bp = Blueprint('models', __name__, url_prefix='/api/models')


@models_bp.route('', methods=['GET'])
@jwt_required()
def list_all_models():
    """List all available models from all providers"""
    try:
        force_refresh = request.args.get('refresh', 'false').lower() == 'true'
        all_models = model_registry.list_all_models(force_refresh=force_refresh)
        
        # Convert ModelInfo objects to dicts
        models_dict = {}
        for provider_name, models in all_models.items():
            models_dict[provider_name] = [model.to_dict() for model in models]
        
        return jsonify({
            "models": models_dict,
            "total": sum(len(models) for models in models_dict.values())
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@models_bp.route('/<provider_name>', methods=['GET'])
@jwt_required()
def list_models_by_provider(provider_name: str):
    """List models from a specific provider"""
    try:
        force_refresh = request.args.get('refresh', 'false').lower() == 'true'
        models = model_registry.get_models_by_provider(provider_name, force_refresh=force_refresh)
        
        if not models and provider_name not in provider_factory.list_providers():
            return jsonify({"error": f"Provider '{provider_name}' not found"}), 404
        
        return jsonify({
            "provider": provider_name,
            "models": [model.to_dict() for model in models],
            "total": len(models)
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@models_bp.route('/<provider_name>/<path:model_id>', methods=['GET'])
@jwt_required()
def get_model_info(provider_name: str, model_id: str):
    """Get detailed information about a specific model"""
    try:
        model_info = model_registry.get_model_info(provider_name, model_id)
        
        if not model_info:
            return jsonify({"error": f"Model '{model_id}' not found in provider '{provider_name}'"}), 404
        
        return jsonify(model_info.to_dict()), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@models_bp.route('/search', methods=['GET'])
@jwt_required()
def search_models():
    """Search for models across all providers"""
    try:
        query = request.args.get('q', '')
        
        if not query:
            return jsonify({"error": "Query parameter 'q' is required"}), 400
        
        results = model_registry.search_models(query)
        
        return jsonify({
            "query": query,
            "results": results,
            "total": len(results)
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@models_bp.route('/providers', methods=['GET'])
@jwt_required()
def list_providers():
    """List all available providers"""
    try:
        providers = provider_factory.list_providers()
        return jsonify({
            "providers": providers,
            "total": len(providers)
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@models_bp.route('/providers/health', methods=['GET'])
@jwt_required()
def providers_health():
    """Get health status of all providers"""
    try:
        health_status = provider_factory.get_all_health_status()
        return jsonify(health_status), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@models_bp.route('/init', methods=['GET'])
@jwt_required()
def get_models_init():
    """Get all models, providers, and health status in a single call"""
    try:
        force_refresh = request.args.get('refresh', 'false').lower() == 'true'
        
        # Fetch everything in parallel (already parallelized in services)
        all_models = model_registry.list_all_models(force_refresh=force_refresh)
        providers = provider_factory.list_providers()
        health_status = provider_factory.get_all_health_status()
        
        # Convert ModelInfo objects to dicts
        models_dict = {}
        for provider_name, models in all_models.items():
            models_dict[provider_name] = [model.to_dict() for model in models]
            
        return jsonify({
            "models": models_dict,
            "providers": providers,
            "health": health_status,
            "total_models": sum(len(models) for models in models_dict.values())
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
