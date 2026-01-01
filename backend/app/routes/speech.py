import os
import tempfile

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from app.services.speech_service import speech_service

speech_bp = Blueprint("speech", __name__)


@speech_bp.route("/transcribe", methods=["POST"])
@jwt_required()
def transcribe_audio():
    """Transcribe uploaded audio file"""
    if "file" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio_file = request.files["file"]
    language = request.form.get("language")  # Optional language hint

    # Create a temporary file to save the uploaded audio
    with tempfile.NamedTemporaryFile(
        delete=False, suffix=os.path.splitext(audio_file.filename)[1]
    ) as temp_audio:
        audio_file.save(temp_audio.name)
        temp_path = temp_audio.name

    try:
        text = speech_service.transcribe(temp_path, language=language)
        return jsonify({"text": text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@speech_bp.route("/tts", methods=["POST"])
@jwt_required()
async def text_to_speech():
    """Convert text to speech and return audio file path or stream"""
    data = request.json
    text = data.get("text")
    voice = data.get("voice", "es-CO-GonzaloNeural")

    if not text:
        return jsonify({"error": "No text provided"}), 400

    # For now, we'll save to a temp file and return the path or handle it differently
    # In a real app, you might want to stream this or save to a public uploads folder
    output_filename = f"tts_{os.urandom(8).hex()}.mp3"
    output_path = os.path.join("uploads", output_filename)

    try:
        await speech_service.text_to_speech(text, output_path, voice)
        return jsonify({"url": f"/api/files/download/{output_filename}"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
