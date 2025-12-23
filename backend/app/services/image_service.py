"""
Image Service
Handles image generation using diffusion models
"""
import os
import uuid
import requests
import base64
import torch
import threading
from datetime import datetime
from typing import Optional, Dict, Any
from flask import current_app

class ImageService:
    """Service for generating images using HuggingFace or local models"""
    
    def __init__(self):
        self.hf_token = os.getenv("HUGGINGFACE_API_KEY")
        self.base_url = "https://router.huggingface.co/hf-inference/models/"
        self.default_model = "stabilityai/stable-diffusion-3.5-large"
        self.local_model_id = "segmind/tiny-sd" # Much smaller and faster than SD 1.5
        self._local_pipe = None
        self._lock = threading.Lock() # Lock for concurrent generations
        
        # Ensure uploads directory exists using absolute path
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.upload_dir = os.path.join(base_dir, 'uploads', 'generated')
        os.makedirs(self.upload_dir, exist_ok=True)
        print(f"📁 Image upload directory: {self.upload_dir}", flush=True)

    @property
    def local_pipe(self):
        """Lazy-initialize local diffusion pipeline"""
        if self._local_pipe is None:
            print(f"🚀 Loading local image model: {self.local_model_id}...")
            from diffusers import StableDiffusionPipeline
            
            device = "cuda" if torch.cuda.is_available() else "cpu"
            print(f"💻 Using device: {device}")
            
            self._local_pipe = StableDiffusionPipeline.from_pretrained(
                self.local_model_id,
                torch_dtype=torch.float16 if device == "cuda" else torch.float32,
                safety_checker=None,
                requires_safety_checker=False
            )
            
            if device == "cuda":
                # Advanced memory optimizations for 4GB VRAM
                try:
                    # enable_sequential_cpu_offload() is the most memory-efficient
                    # but slower than enable_model_cpu_offload()
                    self._local_pipe.enable_sequential_cpu_offload()
                    print("✅ Enabled sequential CPU offloading (max memory saving)")
                except Exception as e:
                    print(f"⚠️ Could not enable sequential offload: {e}, trying model offload")
                    self._local_pipe.enable_model_cpu_offload()
                
                self._local_pipe.enable_attention_slicing()
            else:
                self._local_pipe = self._local_pipe.to(device)
                
            print(f"✅ Local image model loaded on {device} (with CPU offloading)")
        return self._local_pipe

    def get_models(self) -> list:
        """Get list of available image models"""
        models = [
            {"id": "local:segmind/tiny-sd", "name": "Tiny SD (Local, Fast)", "type": "local"}
        ]
        
        if self.hf_token:
            models.extend([
                {"id": "stabilityai/stable-diffusion-3.5-large", "name": "SD 3.5 Large (HF)", "type": "remote"},
                {"id": "black-forest-labs/FLUX.1-dev", "name": "FLUX.1 Dev (HF)", "type": "remote"},
                {"id": "runwayml/stable-diffusion-v1-5", "name": "SD 1.5 (HF)", "type": "remote"}
            ])
        
        return models

    def generate_image(
        self, 
        prompt: str, 
        model: Optional[str] = None,
        negative_prompt: Optional[str] = None,
        num_inference_steps: int = 30,
        guidance_scale: float = 7.5,
        width: int = 512,
        height: int = 512,
        progress_callback: Optional[callable] = None
    ) -> Dict[str, Any]:
        """Generate an image using HuggingFace Inference API or local model"""
        
        # If no API key, use local model
        if not self.hf_token:
            with self._lock:
                return self._generate_local(
                    prompt=prompt,
                    negative_prompt=negative_prompt,
                    num_inference_steps=num_inference_steps,
                    guidance_scale=guidance_scale,
                    width=width,
                    height=height,
                    progress_callback=progress_callback
                )

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
            
            # Handle model loading (503)
            if response.status_code == 503:
                error_data = response.json()
                wait_time = error_data.get('estimated_time', 20)
                raise Exception(f"Model is loading. Please try again in {int(wait_time)} seconds.")
            
            # If HF fails for other reasons, try local as fallback
            if response.status_code != 200:
                print(f"⚠️ HuggingFace API failed ({response.status_code}). Falling back to local model...")
                # Use fewer steps for local fallback to save memory/time
                local_steps = min(num_inference_steps, 15)
                return self._generate_local(prompt, negative_prompt, local_steps, guidance_scale, width, height, progress_callback)

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
                "model": f"hf:{model_id}",
                "created_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            print(f"Error generating image via HF: {e}. Trying local fallback...")
            try:
                local_steps = min(num_inference_steps, 15)
                return self._generate_local(prompt, negative_prompt, local_steps, guidance_scale, width, height, progress_callback)
            except Exception as local_e:
                raise Exception(f"Failed to generate image (HF and Local): {str(local_e)}")

    def _generate_local(
        self,
        prompt: str,
        negative_prompt: Optional[str] = None,
        num_inference_steps: int = 15, # Tiny-SD needs fewer steps
        guidance_scale: float = 5.0,   # Optimized for Tiny-SD
        width: int = 512,
        height: int = 512,
        progress_callback: Optional[callable] = None
    ) -> Dict[str, Any]:
        """Generate image using local diffusers model"""
        try:
            print(f"🎨 Starting local generation: '{prompt}'", flush=True)
            # Clear CUDA cache before generation
            if torch.cuda.is_available():
                torch.cuda.empty_cache()

            # Wrapper for diffusers callback (modern API)
            def callback_on_step_end(pipe, step_index, timestep, callback_kwargs):
                if progress_callback:
                    # print(f"DEBUG: Step {step_index} end", flush=True)
                    latents = callback_kwargs.get("latents")
                    progress_callback(step_index, num_inference_steps, latents)
                return callback_kwargs

            try:
                image = self.local_pipe(
                    prompt=prompt,
                    negative_prompt=negative_prompt,
                    num_inference_steps=num_inference_steps,
                    guidance_scale=guidance_scale,
                    width=width,
                    height=height,
                    callback_on_step_end=callback_on_step_end,
                    callback_on_step_end_tensor_inputs=["latents"]
                ).images[0]
            except Exception as e:
                if "CUDA out of memory" in str(e) or "OOM" in str(e):
                    print(f"⚠️ CUDA OOM detected, falling back to CPU: {e}")
                    # Force CPU
                    self._local_pipe = self.local_pipe.to("cpu")
                    image = self.local_pipe(
                        prompt=prompt,
                        negative_prompt=negative_prompt,
                        num_inference_steps=num_inference_steps,
                        guidance_scale=guidance_scale,
                        width=width,
                        height=height,
                        callback_on_step_end=callback_on_step_end,
                        callback_on_step_end_tensor_inputs=["latents"]
                    ).images[0]
                else:
                    raise e
            
            filename = f"local_{uuid.uuid4()}.png"
            filepath = os.path.join(self.upload_dir, filename)
            image.save(filepath)
            print(f"💾 Image saved to: {filepath}", flush=True)
            
            return {
                "id": str(uuid.uuid4()),
                "filename": filename,
                "url": f"/api/images/view/{filename}",
                "prompt": prompt,
                "model": f"local:{self.local_model_id}",
                "created_at": datetime.utcnow().isoformat()
            }
        except Exception as e:
            print(f"❌ Local generation error: {e}", flush=True)
            raise Exception(f"Local image generation failed: {str(e)}")

# Global instance
image_service = ImageService()
