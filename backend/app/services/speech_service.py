import os
import tempfile
import base64
from faster_whisper import WhisperModel
import edge_tts
import asyncio
from typing import Optional
from langdetect import detect, DetectorFactory
from app.config import Settings

# For consistent language detection
DetectorFactory.seed = 0

settings = Settings()

class SpeechService:
    def __init__(self):
        self.stt_model_size = settings.WHISPER_MODEL
        self.device = settings.WHISPER_DEVICE
        self._stt_model = None
        
        # Default voices for different languages
        self.default_voices = {
            'es': 'es-CO-GonzaloNeural',
            'en': 'en-US-AndrewNeural',
            'fr': 'fr-FR-HenriNeural',
            'de': 'de-DE-ConradNeural',
            'it': 'it-IT-DiegoNeural',
            'pt': 'pt-BR-AntonioNeural'
        }

    @property
    def stt_model(self):
        if self._stt_model is None:
            # Initialize model lazily
            print(f"🎙️ Initializing Whisper model: {self.stt_model_size} on {self.device}")
            self._stt_model = WhisperModel(self.stt_model_size, device=self.device, compute_type="int8")
        return self._stt_model

    def transcribe(self, audio_path: str, language: Optional[str] = None) -> str:
        """Transcribe audio file to text using faster-whisper"""
        try:
            # language=None triggers auto-detection
            segments, info = self.stt_model.transcribe(audio_path, beam_size=5, language=language)
            
            print(f"🎙️ Detected language '{info.language}' with probability {info.language_probability:.2f}")
            
            full_text = ""
            for segment in segments:
                full_text += segment.text + " "
                
            return full_text.strip()
        except Exception as e:
            print(f"❌ Transcription error: {e}")
            return ""

    def transcribe_base64(self, base64_audio: str, language: Optional[str] = None) -> str:
        """Transcribe base64 encoded audio"""
        try:
            # Remove header if present (e.g., "data:audio/wav;base64,")
            if "," in base64_audio:
                base64_audio = base64_audio.split(",")[1]
            
            audio_data = base64.b64decode(base64_audio)
            
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
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
                voice_lang = voice.split('-')[0]
                
                # If detected language is different from the voice language, switch to default for that language
                if detected_lang != voice_lang and detected_lang in self.default_voices:
                    new_voice = self.default_voices[detected_lang]
                    print(f"🔄 Switching voice from {voice} to {new_voice} for language {detected_lang}")
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
