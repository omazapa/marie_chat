"""
Image Service
Handles image generation using diffusion models
"""
import os
import uuid
import requests
import base64
from datetime import datetime
from typing import Optional, Dict, Any
from flask import current_app

class ImageService:
    """Service for generating images using HuggingFace or local models"""
    
    def __init__(self):
        self.hf_token = os.getenv("HUGGINGFACE_API_KEY")
        self.base_url = "https://api-inference.huggingface.co/models/"
        self.default_model = "stabilityai/stable-diffusion-3.5-large"
        
        # Ensure uploads directory exists
        self.upload_dir = os.path.join(os.getcwd(), 'uploads', 'generated')
        os.makedirs(self.upload_dir, exist_ok=True)

    def generate_image(
        self, 
        prompt: str, 
        model: Optional[str] = None,
        negative_prompt: Optional[str] = None,
        num_inference_steps: int = 30,
        guidance_scale: float = 7.5,
        width: int = 512,
        height: int = 512
    ) -> Dict[str, Any]:
        """Generate an image using HuggingFace Inference API"""
        model_id = model or self.default_model
        api_url = f"{self.base_url}{model_id}"
        
        headers = {"Authorization": f"Bearer {self.hf_token}"}
        
        payload = {
            "inputs": prompt,
            "parameters": {
                "negative_prompt": negative_prompt,
                "num_inference_steps": num_inference_steps,
                "guidance_scale": guidance_scale,
                "width": width,
                "height": height
            }
        }
        
        try:
            response = requests.post(api_url, headers=headers, json=payload)
            response.raise_for_status()
            
            # The response is the image bytes
            image_bytes = response.content
            
            # Save image to disk
            filename = f"gen_{uuid.uuid4()}.png"
            filepath = os.path.join(self.upload_dir, filename)
            
            with open(filepath, "wb") as f:
                f.write(image_bytes)
            
            # Return metadata
            return {
                "id": str(uuid.uuid4()),
                "filename": filename,
                "url": f"/api/images/view/{filename}",
                "prompt": prompt,
                "model": model_id,
                "created_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            print(f"Error generating image: {e}")
            raise Exception(f"Failed to generate image: {str(e)}")

# Global instance
image_service = ImageService()
