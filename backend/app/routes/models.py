"""Models routes."""
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app.services.ollama_provider import OllamaProvider
import asyncio

models_bp = Blueprint('models', __name__, url_prefix='/api/models')


@models_bp.route('/ollama', methods=['GET'])
@jwt_required()
def list_ollama_models():
    """List available Ollama models."""
    try:
        provider = OllamaProvider()
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


@models_bp.route('', methods=['GET'])
@jwt_required()
def list_models():
    """List all available models from all providers."""
    try:
        # For now, only Ollama
        provider = OllamaProvider()
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        ollama_models = loop.run_until_complete(provider.list_models())
        loop.close()
        
        return jsonify({
            "providers": {
                "ollama": {
                    "models": ollama_models,
                    "default": "llama3.2"
                }
            }
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

