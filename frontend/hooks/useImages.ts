import { useState, useCallback } from 'react';
import apiClient, { getErrorMessage } from '../lib/api';

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
  conversation_id?: string;
}

export function useImages(token: string | null) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageModels, setImageModels] = useState<ImageModel[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchImageModels = useCallback(async () => {
    if (!token) return;
    try {
      const response = await apiClient.get('/images/models');
      setImageModels(response.data.models);
    } catch (err) {
      console.error('Error fetching image models:', err);
    }
  }, [token]);

  const generateImage = useCallback(
    async (params: {
      prompt: string;
      model?: string;
      conversation_id?: string;
      text_model?: string;
      text_provider?: string;
      negative_prompt?: string;
      width?: number;
      height?: number;
    }) => {
      if (!token) return null;

      setIsGenerating(true);
      setError(null);

      try {
        const response = await apiClient.post('/images/generate', params, {
          timeout: 300000, // 5 minutes for local generation
        });
        return response.data as GeneratedImage;
      } catch (err: unknown) {
        const msg = getErrorMessage(err, 'Failed to generate image');
        setError(msg);
        console.error('Image generation error:', msg);
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [token]
  );

  return {
    isGenerating,
    imageModels,
    error,
    fetchImageModels,
    generateImage,
  };
}
