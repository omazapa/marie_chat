import os
import tempfile
from faster_whisper import WhisperModel
import edge_tts
import asyncio
from typing import Optional

class SpeechService:
    def __init__(self):
        self.stt_model_size = os.getenv("WHISPER_MODEL", "base")
        self.device = os.getenv("WHISPER_DEVICE", "cpu") # "cuda" if available
        self._stt_model = None

    @property
    def stt_model(self):
        if self._stt_model is None:
            # Initialize model lazily
            self._stt_model = WhisperModel(self.stt_model_size, device=self.device, compute_type="int8")
        return self._stt_model

    def transcribe(self, audio_path: str) -> str:
        """Transcribe audio file to text using faster-whisper"""
        segments, info = self.stt_model.transcribe(audio_path, beam_size=5)
        
        full_text = ""
        for segment in segments:
            full_text += segment.text + " "
            
        return full_text.strip()

    async def text_to_speech(self, text: str, output_path: str, voice: str = "es-CO-GonzaloNeural"):
        """Convert text to speech using edge-tts"""
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(output_path)

speech_service = SpeechService()
