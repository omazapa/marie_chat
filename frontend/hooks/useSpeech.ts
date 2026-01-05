import { useState, useRef, useCallback } from 'react';
import apiClient from '../lib/api';
import { useInterfaceStore } from '@/stores/interfaceStore';

interface UseSpeechProps {
  accessToken: string | null;
  onTranscription: (text: string) => void;
  onTranscribe?: (base64Audio: string) => void;
}

export const useSpeech = ({ accessToken, onTranscription, onTranscribe }: UseSpeechProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const { sttLanguage } = useInterfaceStore();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const transcribeAudio = useCallback(
    async (audioBlob: Blob, language?: string) => {
      if (!accessToken) return;

      setIsTranscribing(true);
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.wav');
      // Use user's STT language preference
      formData.append('language', language || sttLanguage || 'en-US');

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
    },
    [accessToken, onTranscription, sttLanguage]
  );

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
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  }, [onTranscribe, transcribeAudio]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  return {
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording,
  };
};
