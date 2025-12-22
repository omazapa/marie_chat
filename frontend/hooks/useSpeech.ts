import { useState, useRef, useCallback } from 'react';
import axios from 'axios';

interface UseSpeechProps {
  accessToken: string | null;
  onTranscription: (text: string) => void;
}

export const useSpeech = ({ accessToken, onTranscription }: UseSpeechProps) => {
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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  }, [accessToken]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const transcribeAudio = async (audioBlob: Blob) => {
    if (!accessToken) return;

    setIsTranscribing(true);
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/speech/transcribe`, formData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
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
