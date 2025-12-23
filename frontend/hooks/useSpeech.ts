import { useState, useRef, useCallback } from 'react';
import apiClient from '../lib/api';

interface UseSpeechProps {
  accessToken: string | null;
  onTranscription: (text: string) => void;
  onTranscribe?: (base64Audio: string) => void;
}

export const useSpeech = ({ accessToken, onTranscription, onTranscribe }: UseSpeechProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        
        if (onTranscribe) {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64Audio = reader.result as string;
            onTranscribe(base64Audio);
          };
        } else {
          await transcribeAudio(audioBlob);
        }
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  }, [accessToken, onTranscribe]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const transcribeAudio = async (audioBlob: Blob, language?: string) => {
    if (!accessToken) return;

    setIsTranscribing(true);
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.wav');
    if (language) {
      formData.append('language', language);
    }

    try {
      const response = await apiClient.post('/speech/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.text) {
        onTranscription(response.data.text);
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
    } finally {
      setIsTranscribing(false);
    }
  };

  return {
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording,
  };
};
