"""Models routes."""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from app.services.llm_service import LLMService
import asyncio

models_bp = Blueprint('models', __name__, url_prefix='/api/models')
llm_service = LLMService()


@models_bp.route('/ollama', methods=['GET'])
@jwt_required()
def list_ollama_models():
    """List available Ollama models."""
    try:
        provider = llm_service.get_provider("ollama")
        if not provider:
            return jsonify({"error": "Ollama provider not available"}), 503
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        models = loop.run_until_complete(provider.list_models())
        loop.close()
        
        return jsonify({
            "models": models,
            "provider": "ollama"
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@models_bp.route('/huggingface', methods=['GET'])
@jwt_required()
def list_huggingface_models():
    """List available HuggingFace models."""
    try:
        provider = llm_service.get_provider("huggingface")
        if not provider:
            return jsonify({"error": "HuggingFace provider not available"}), 503
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        models = loop.run_until_complete(provider.list_models())
        loop.close()
        
        return jsonify({
            "models": models,
            "provider": "huggingface"
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@models_bp.route('', methods=['GET'])
@jwt_required()
def list_models():
    """List all available models from all providers."""
    try:
        provider_filter = request.args.get('provider')
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        all_models = loop.run_until_complete(
            llm_service.get_available_models(provider=provider_filter)
        )
        loop.close()
        
        # Format response
        providers_data = {}
        for provider_name, models in all_models.items():
            providers_data[provider_name] = {
                "models": models,
                "default": _get_default_model(provider_name, models)
            }
        
        return jsonify({
            "providers": providers_data,
            "available_providers": llm_service.get_available_providers(),
            "default_provider": llm_service.get_default_provider()
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def _get_default_model(provider: str, models: list) -> str:
    """Get default model for a provider."""
    if not models:
        return ""
    
    defaults = {
        "ollama": "llama3.2",
        "huggingface": "meta-llama/Llama-3.2-3B-Instruct"
    }
    
    default = defaults.get(provider)
    if default and default in models:
        return default
    
    return models[0] if models else ""

