"""
Image Routes
REST API endpoints for image generation and viewing
"""

import queue

import eventlet  # type: ignore
import eventlet.tpool  # type: ignore
from flask import Blueprint, jsonify, request, send_from_directory
from flask_jwt_extended import get_jwt_identity, jwt_required

from app import socketio
from app.config import settings
from app.services.image_service import image_service
from app.services.llm_service import llm_service

images_bp = Blueprint("images", __name__)


@images_bp.route("/models", methods=["GET"])
@jwt_required()
def get_image_models():
    """Get list of available image models"""
    return jsonify({"models": image_service.get_models()})


@images_bp.route("/generate", methods=["POST"])
@jwt_required()
def generate_image():
    """Generate an image from a prompt"""
    user_id = get_jwt_identity()
    data = request.get_json()

    prompt = data.get("prompt")
    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400

    model = data.get("model")
    text_model = data.get("text_model")
    text_provider = data.get("text_provider")
    conversation_id = data.get("conversation_id")

    # Handle cases where frontend sends "None" or "undefined" as strings
    if conversation_id in [None, "None", "undefined", "null"]:
        conversation_id = None

    is_local = not image_service.hf_token
    num_steps = data.get("num_inference_steps", 15 if is_local else 30)

    # Create conversation if missing
    if not conversation_id:
        print(f"✨ Creating new conversation for image generation. Prompt: {prompt[:30]}...")
        try:
            # Create a truncated title from the prompt
            title_text = prompt[:30] + "..." if len(prompt) > 30 else prompt

            # Use the provided text model/provider or defaults for the conversation metadata
            # This ensures the header shows the LLM, not the diffusion model
            conv_model = text_model or settings.DEFAULT_LLM_MODEL
            conv_provider = text_provider or settings.DEFAULT_LLM_PROVIDER

            conv = llm_service.create_conversation(
                user_id=user_id,
                title=f"Image: {title_text}",
                model=conv_model,
                provider=conv_provider,
            )
            conversation_id = conv["id"]
            print(f"🆕 Created new conversation for image: {conversation_id} (Model: {conv_model})")
        except Exception as e:
            print(f"❌ Error creating conversation: {e}")
            return jsonify({"error": f"Failed to create conversation: {str(e)}"}), 500

    # Save user message
    try:
        # Include model info in the message content as requested
        display_model = model.split("/")[-1] if model and "/" in model else (model or "default")
        message_content = f"Generate an image using {display_model}: {prompt}"

        llm_service.save_message(
            conversation_id=conversation_id, user_id=user_id, role="user", content=message_content
        )
    except Exception as e:
        print(f"❌ Error saving user message: {e}")

    print(
        f"🚀 Image generation request: prompt='{prompt}', conv_id='{conversation_id}', steps={num_steps}"
    )

    # Define the background task for generation
    def run_generation_task(conv_id, u_id, p, m, steps):
        print(f"📡 Background generation task started for {conv_id}")

        # Give the frontend time to join the room
        eventlet.sleep(1.0)

        # Create a THREAD-SAFE queue for progress updates (native thread -> greenlet)
        progress_queue = queue.Queue()

        # Background task to consume the queue and emit events
        def emit_progress_task():
            print(f"📡 Progress emitter started for {conv_id}")
            while True:
                try:
                    # Use non-blocking get to avoid blocking the event loop
                    try:
                        item = progress_queue.get(block=False)
                    except queue.Empty:
                        eventlet.sleep(0.1)
                        continue

                    if item is None:  # Sentinel to stop
                        break

                    event_type = item.get("event", "image_progress")
                    payload = item.get("payload")
                    room = item.get("room")

                    # print(f"📤 Emitting {event_type} to room {room}")
                    socketio.emit(event_type, payload, room=room)
                except Exception as e:
                    print(f"❌ Emitter error: {str(e)}")
            print(f"🏁 Progress emitter finished for {conv_id}")

        # Start the emitter greenlet
        socketio.start_background_task(emit_progress_task)

        # Initial progress update
        progress_queue.put(
            {
                "event": "image_progress",
                "room": str(conv_id),
                "payload": {
                    "conversation_id": conv_id,
                    "step": 0,
                    "total_steps": steps,
                    "progress": 0,
                    "message": "Starting...",
                },
            }
        )

        # Simulated progress for remote models (HF doesn't support callbacks)
        is_remote = not (m and m.startswith("local:"))
        stop_simulated_progress = False

        def simulated_progress_task():
            current_sim_progress = 0
            while not stop_simulated_progress and current_sim_progress < 90:
                eventlet.sleep(2.0)
                if stop_simulated_progress:
                    break
                current_sim_progress += 5
                progress_queue.put(
                    {
                        "event": "image_progress",
                        "room": str(conv_id),
                        "payload": {
                            "conversation_id": conv_id,
                            "step": 0,
                            "total_steps": steps,
                            "progress": current_sim_progress,
                            "message": "Generating (remote)...",
                        },
                    }
                )

        if is_remote:
            eventlet.spawn(simulated_progress_task)

        def progress_callback(step, total_steps, latents):
            nonlocal stop_simulated_progress
            # Stop simulated progress if we get real progress
            stop_simulated_progress = True

            # Calculate progress
            progress = min(int(((step + 1) / total_steps) * 100), 99)
            # print(f"🖼️ Image progress: {progress}% (Step {step + 1}/{total_steps}) for room {conv_id}")

            payload = {
                "conversation_id": conv_id,
                "step": step + 1,
                "total_steps": total_steps,
                "progress": progress,
            }

            # Put into queue instead of emitting directly
            progress_queue.put(
                {"event": "image_progress", "room": str(conv_id), "payload": payload}
            )

        try:
            print(f"🎨 Starting image generation for conversation {conv_id}...")

            # Generate image in a native thread
            result = eventlet.tpool.execute(
                image_service.generate_image,
                prompt=p,
                model=m,
                num_inference_steps=steps,
                progress_callback=progress_callback,
            )

            if "error" in result:
                print(f"❌ Generation error: {result['error']}")
                stop_simulated_progress = True
                progress_queue.put(None)
                return

            image_url = result.get("url")
            stop_simulated_progress = True

            # Final progress update
            print(f"🏁 Emitting 100% progress for room {conv_id}")
            progress_queue.put(
                {
                    "event": "image_progress",
                    "room": str(conv_id),
                    "payload": {
                        "conversation_id": conv_id,
                        "step": steps,
                        "total_steps": steps,
                        "progress": 100,
                        "image_url": image_url,
                    },
                }
            )

            # Save message to database with correct metadata for frontend
            print(f"💾 Saving image message for conversation {conv_id}")
            metadata = {
                "type": "image_generation",
                "image": {"url": image_url, "prompt": p, "model": result.get("model")},
            }

            message = llm_service.save_message(
                conversation_id=conv_id,
                user_id=u_id,
                role="assistant",
                content=f"Generated image for: {p}",
                metadata=metadata,
            )

            # Create a copy for emission without the large vector
            display_message = message.copy()
            if "content_vector" in display_message:
                del display_message["content_vector"]

            # Emit final message response
            print(f"📡 Emitting message_response for room {conv_id}")
            progress_queue.put(
                {
                    "event": "message_response",
                    "room": str(conv_id),
                    "payload": {"conversation_id": conv_id, "message": display_message},
                }
            )

        except Exception as e:
            error_msg = str(e)
            print(f"❌ Error in background generation: {error_msg}")
            stop_simulated_progress = True

            # Emit error to frontend
            progress_queue.put(
                {
                    "event": "image_error",
                    "room": str(conv_id),
                    "payload": {
                        "conversation_id": conv_id,
                        "error": error_msg,
                        "message": "Image generation failed",
                    },
                }
            )

            # Save error message to database
            try:
                error_message = llm_service.save_message(
                    conversation_id=conv_id,
                    user_id=u_id,
                    role="assistant",
                    content=f"❌ Image generation failed: {error_msg}",
                    metadata={"type": "image_generation_error", "error": error_msg},
                )

                # Emit the error message
                display_error_message = error_message.copy()
                if "content_vector" in display_error_message:
                    del display_error_message["content_vector"]

                progress_queue.put(
                    {
                        "event": "message_response",
                        "room": str(conv_id),
                        "payload": {"conversation_id": conv_id, "message": display_error_message},
                    }
                )
            except Exception as save_error:
                print(f"⚠️ Could not save error message: {save_error}")
        finally:
            # Stop emitter
            stop_simulated_progress = True
            progress_queue.put(None)

    # Start the background task
    eventlet.spawn(run_generation_task, conversation_id, user_id, prompt, model, num_steps)

    # Yield control to allow the background task to start
    eventlet.sleep(0.1)

    # Return immediately with the conversation_id
    print(f"✅ Returning response to client for conv {conversation_id}")
    return jsonify({"status": "processing", "conversation_id": conversation_id})


@images_bp.route("/view/<path:filename>")
def view_image(filename):
    """View a generated image"""
    print(f"🖼️ Serving image: {filename} from {image_service.upload_dir}")
    return send_from_directory(image_service.upload_dir, filename)
