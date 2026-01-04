"""
Script to pre-download models from HuggingFace Hub for local use
"""

import os
import sys

# Add the current directory to sys.path to import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.config import settings
from app.services.huggingface_hub_service import huggingface_hub_service


def main():
    print("🚀 Starting model pre-download process...")

    # 1. Embedding Model
    embedding_model = settings.EMBEDDING_MODEL
    print(f"\n--- Embedding Model: {embedding_model} ---")
    huggingface_hub_service.download_model(embedding_model, "embedding")

    # 2. Image Model (Tiny SD)
    image_model = "segmind/tiny-sd"
    print(f"\n--- Image Model: {image_model} ---")
    huggingface_hub_service.download_model(image_model, "image")

    # 3. Audio Model (Whisper)
    whisper_size = settings.WHISPER_MODEL
    whisper_repo = f"Systran/faster-whisper-{whisper_size}"
    print(f"\n--- Audio Model: {whisper_repo} ---")
    huggingface_hub_service.download_model(whisper_repo, "audio")

    print("\n✨ All models downloaded successfully!")
    print(f"📁 Models are stored in: {os.path.abspath(settings.MODELS_CACHE_DIR)}")


if __name__ == "__main__":
    main()
