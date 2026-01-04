"""
HuggingFace Hub Service
Handles downloading and managing local models from HuggingFace Hub
"""

import os

from huggingface_hub import snapshot_download

from app.config import settings


class HuggingFaceHubService:
    """Service for managing local models from HuggingFace Hub"""

    def __init__(self):
        self.api_key = settings.HUGGINGFACE_API_KEY
        self.cache_dir = settings.MODELS_CACHE_DIR
        os.makedirs(self.cache_dir, exist_ok=True)

    def download_model(self, repo_id: str, task: str = "generic") -> str:
        """
        Download a model from HuggingFace Hub to local cache

        Args:
            repo_id: The HuggingFace repository ID (e.g., 'sentence-transformers/all-MiniLM-L6-v2')
            task: The task category for organization (embedding, image, audio, etc.)

        Returns:
            The local path to the downloaded model
        """
        print(f"📥 Downloading model {repo_id} for task {task}...")

        # Create task-specific subdirectory
        task_dir = os.path.join(self.cache_dir, task)
        os.makedirs(task_dir, exist_ok=True)

        # Download the model
        local_path = snapshot_download(
            repo_id=repo_id,
            token=self.api_key,
            local_dir=os.path.join(task_dir, repo_id.replace("/", "_")),
            local_dir_use_symlinks=False,
        )

        print(f"✅ Model {repo_id} downloaded to {local_path}")
        return local_path

    def get_local_path(self, repo_id: str, task: str = "generic") -> str | None:
        """Get the local path of a model if it exists"""
        task_dir = os.path.join(self.cache_dir, task)
        model_dir = os.path.join(task_dir, repo_id.replace("/", "_"))

        if os.path.exists(model_dir):
            return model_dir
        return None


huggingface_hub_service = HuggingFaceHubService()
