import base64
import os
import tempfile

import edge_tts
from faster_whisper import WhisperModel
from langdetect import DetectorFactory, detect

from app.config import Settings
from app.services.huggingface_hub_service import huggingface_hub_service
from app.services.settings_service import settings_service

# For consistent language detection
DetectorFactory.seed = 0

settings = Settings()


class SpeechService:
    def __init__(self):
        self.settings_service = settings_service
        config = self.settings_service.get_settings()

        self.stt_model_size = config.get("stt", {}).get("model_size", settings.WHISPER_MODEL)
        self.device = settings.WHISPER_DEVICE
        self._stt_model = None

        # Default voices for different languages
        self.default_voices = config.get("tts", {}).get(
            "default_voices",
            {
                "es": "es-CO-GonzaloNeural",
                "en": "en-US-AndrewNeural",
                "fr": "fr-FR-HenriNeural",
                "de": "de-DE-ConradNeural",
                "it": "it-IT-DiegoNeural",
                "pt": "pt-BR-AntonioNeural",
            },
        )

    @property
    def stt_model(self):
        if self._stt_model is None:
            # Initialize model lazily
            device = self.device
            if device == "auto":
                import torch

                device = "cuda" if torch.cuda.is_available() else "cpu"

            # Check if we have a local version
            # Note: faster-whisper models on HF are usually under 'Systran/faster-whisper-...'
            repo_id = f"Systran/faster-whisper-{self.stt_model_size}"
            local_path = huggingface_hub_service.get_local_path(repo_id, "audio")
            model_to_load = local_path if local_path else self.stt_model_size

            print(f"🎙️ Initializing Whisper model: {model_to_load} on {device}")
            try:
                self._stt_model = WhisperModel(
                    model_to_load,
                    device=device,
                    compute_type="float16" if device == "cuda" else "int8",
                )
            except Exception as e:
                if device == "cuda":
                    print(f"⚠️ Failed to initialize Whisper on GPU: {e}. Falling back to CPU.")
                    self._stt_model = WhisperModel(model_to_load, device="cpu", compute_type="int8")
                else:
                    raise e
        return self._stt_model

    def transcribe(self, audio_path: str, language: str | None = None) -> str:
        """Transcribe audio file to text using faster-whisper"""
        try:
            # language=None triggers auto-detection
            model = self.stt_model
            try:
                segments, info = model.transcribe(audio_path, beam_size=5, language=language)

                print(
                    f"🎙️ Detected language '{info.language}' with probability {info.language_probability:.2f}"
                )

                full_text = ""
                for segment in segments:
                    full_text += segment.text + " "

                return full_text.strip()
            except Exception as e:
                if model.device == "cuda":
                    print(f"⚠️ Error during GPU transcription: {e}. Retrying on CPU...")
                    # Force re-initialization on CPU
                    self._stt_model = WhisperModel(
                        self.stt_model_size, device="cpu", compute_type="int8"
                    )
                    return self.transcribe(audio_path, language=language)
                else:
                    raise e
        except Exception as e:
            print(f"❌ Transcription error: {e}")
            return ""

    def transcribe_base64(self, base64_audio: str, language: str | None = None) -> str:
        """Transcribe base64 encoded audio"""
        try:
            # Remove header if present (e.g., "data:audio/wav;base64,")
            if "," in base64_audio:
                base64_audio = base64_audio.split(",")[1]

            audio_data = base64.b64decode(base64_audio)

            # Use a generic suffix or none, ffmpeg/av will detect the format
            with tempfile.NamedTemporaryFile(delete=False, suffix=".tmp") as temp_audio:
                temp_audio.write(audio_data)
                temp_path = temp_audio.name

            try:
                text = self.transcribe(temp_path, language=language)
                return text
            finally:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
        except Exception as e:
            print(f"❌ Base64 transcription error: {e}")
            return ""

    async def text_to_speech(self, text: str, output_path: str, voice: str = "es-CO-GonzaloNeural"):
        """Convert text to speech using edge-tts"""
        try:
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(output_path)
        except Exception as e:
            print(f"❌ TTS error: {e}")

    async def text_to_speech_base64(self, text: str, voice: str = "es-CO-GonzaloNeural") -> str:
        """Convert text to speech and return base64 encoded audio with auto language detection"""
        try:
            # Detect language to ensure the voice matches the text
            try:
                detected_lang = detect(text)
                print(f"🔊 Detected language for TTS: {detected_lang}")

                # Voice format is usually 'lang-country-NameNeural' (e.g., 'es-CO-GonzaloNeural')
                voice_lang = voice.split("-")[0]

                # If detected language is different from the voice language, switch to default for that language
                if detected_lang != voice_lang and detected_lang in self.default_voices:
                    new_voice = self.default_voices[detected_lang]
                    print(
                        f"🔄 Switching voice from {voice} to {new_voice} for language {detected_lang}"
                    )
                    voice = new_voice
            except Exception as le:
                print(f"⚠️ Language detection failed: {le}")

            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_audio:
                temp_path = temp_audio.name

            try:
                await self.text_to_speech(text, temp_path, voice)

                with open(temp_path, "rb") as audio_file:
                    audio_data = audio_file.read()
                    base64_audio = base64.b64encode(audio_data).decode("utf-8")

                return f"data:audio/mp3;base64,{base64_audio}"
            finally:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
        except Exception as e:
            print(f"❌ Base64 TTS error: {e}")
            return ""


speech_service = SpeechService()
