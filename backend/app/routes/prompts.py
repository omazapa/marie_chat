"""
Prompt Routes
API endpoints for prompt optimization and techniques
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.services.prompt_service import prompt_service

prompts_bp = Blueprint('prompts', __name__)

@prompts_bp.route('/techniques', methods=['GET'])
@jwt_required()
def get_techniques():
    """Get available prompt engineering techniques, templates, and user profiles"""
    return jsonify({
        "techniques": prompt_service.get_available_techniques(),
        "templates": prompt_service.get_available_templates(),
        "profiles": prompt_service.get_available_profiles()
    })

@prompts_bp.route('/optimize', methods=['POST'])
@jwt_required()
def optimize_prompt():
    """Optimize a user prompt"""
    data = request.json
    if not data or 'prompt' not in data:
        return jsonify({"error": "Missing 'prompt' in request body"}), 400
    
    user_input = data.get('prompt')
    technique = data.get('technique')
    context = data.get('context')
    profile = data.get('profile')
    
    optimized = prompt_service.optimize_prompt(user_input, technique, context, profile)
    
    return jsonify({
        "original": user_input,
        "optimized": optimized,
        "technique": technique,
        "profile": profile
    })
