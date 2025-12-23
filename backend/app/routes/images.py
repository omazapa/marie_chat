"""
Image Routes
REST API endpoints for image generation and viewing
"""
import os
from flask import Blueprint, request, jsonify, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.image_service import image_service
from app.services.llm_service import llm_service

images_bp = Blueprint('images', __name__)

@images_bp.route('/generate', methods=['POST'])
@jwt_required()
def generate_image():
    """Generate an image from a prompt"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    prompt = data.get('prompt')
    if not prompt:
        return jsonify({'error': 'Prompt is required'}), 400
    
    model = data.get('model')
    conversation_id = data.get('conversation_id')
    
    try:
        # Generate image
        result = image_service.generate_image(
            prompt=prompt,
            model=model,
            negative_prompt=data.get('negative_prompt'),
            width=data.get('width', 512),
            height=data.get('height', 512)
        )
        
        # If conversation_id is provided, save a message with the image
        if conversation_id:
            llm_service.save_message(
                conversation_id=conversation_id,
                user_id=user_id,
                role="assistant",
                content=f"Generated image for: **{prompt}**",
                metadata={
                    "type": "image_generation",
                    "image": result
                }
            )
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@images_bp.route('/view/<filename>', methods=['GET'])
def view_image(filename):
    """View a generated image"""
    upload_dir = os.path.join(os.getcwd(), 'uploads', 'generated')
    return send_from_directory(upload_dir, filename)

@images_bp.route('/models', methods=['GET'])
@jwt_required()
def get_image_models():
    """List available image generation models"""
    models = [
        {"id": "stabilityai/stable-diffusion-3.5-large", "name": "Stable Diffusion 3.5 Large"},
        {"id": "stabilityai/stable-diffusion-xl-base-1.0", "name": "Stable Diffusion XL"},
        {"id": "runwayml/stable-diffusion-v1-5", "name": "Stable Diffusion v1.5"},
        {"id": "black-forest-labs/FLUX.1-dev", "name": "FLUX.1 Dev"},
        {"id": "black-forest-labs/FLUX.1-schnell", "name": "FLUX.1 Schnell"},
    ]
    return jsonify({'models': models}), 200
