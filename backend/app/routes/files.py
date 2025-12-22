from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.file_service import file_service
from app.config import settings
import os

files_bp = Blueprint('files', __name__)

@files_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_file():
    """Upload a file and extract its text"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    user_id = get_jwt_identity()
    
    try:
        # Save file
        file_info = file_service.save_file(file, user_id)
        
        # Extract text
        extracted_text = file_service.extract_text(file_info['path'], file_info['extension'])
        
        # Return file info and a snippet of extracted text
        return jsonify({
            'file_id': file_info['id'],
            'filename': file_info['filename'],
            'extension': file_info['extension'],
            'size': file_info['size'],
            'extracted_text': extracted_text, # We return the full text for now so the frontend can send it back or we can store it
            'message': 'File uploaded and processed successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@files_bp.route('/<file_id>', methods=['GET'])
@jwt_required()
def get_file_info(file_id):
    # This would need a database to store file metadata properly
    # For now, we'll just return a placeholder or implement basic lookup if needed
    return jsonify({'error': 'Not implemented'}), 501
