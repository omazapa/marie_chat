from flask import Blueprint, jsonify


models_bp = Blueprint('models', __name__)


@models_bp.route('', methods=['GET'])
async def get_models():
    """Get available models"""
    # This will be implemented in Phase 3
    # For now, return hardcoded list
    models = [
        {
            "id": "llama3.2",
            "name": "Llama 3.2",
            "provider": "ollama",
            "description": "Meta's Llama 3.2 model"
        },
        {
            "id": "codellama",
            "name": "Code Llama",
            "provider": "ollama",
            "description": "Specialized for code generation"
        },
        {
            "id": "mistral",
            "name": "Mistral",
            "provider": "ollama",
            "description": "Mistral AI model"
        }
    ]
    
    return jsonify(models), 200


@models_bp.route('/ollama', methods=['GET'])
async def get_ollama_models():
    """Get Ollama models"""
    # Will be implemented in Phase 3
    return jsonify([]), 200


@models_bp.route('/huggingface', methods=['GET'])
async def get_huggingface_models():
    """Get HuggingFace models"""
    # Will be implemented in Phase 3
    return jsonify([]), 200
