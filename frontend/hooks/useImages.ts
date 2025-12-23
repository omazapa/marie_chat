import { useState, useCallback } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export interface ImageModel {
  id: string;
  name: string;
}

export interface GeneratedImage {
  id: string;
  filename: string;
  url: string;
  prompt: string;
  model: string;
  created_at: string;
}

export function useImages(token: string | null) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageModels, setImageModels] = useState<ImageModel[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchImageModels = useCallback(async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API_BASE}/images/models`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setImageModels(response.data.models);
    } catch (err) {
      console.error('Error fetching image models:', err);
    }
  }, [token]);

  const generateImage = useCallback(async (params: {
    prompt: string;
    model?: string;
    conversation_id?: string;
    negative_prompt?: string;
    width?: number;
    height?: number;
  }) => {
    if (!token) return null;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_BASE}/images/generate`, params, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data as GeneratedImage;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to generate image';
      setError(msg);
      console.error('Image generation error:', err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [token]);

  return {
    isGenerating,
    imageModels,
    error,
    fetchImageModels,
    generateImage
  };
}
