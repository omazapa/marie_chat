import { useState, useCallback } from 'react';
import apiClient from '../lib/api';

export interface PromptTechnique {
  id: string;
  name: string;
  description: string;
}

export function usePrompts(token: string | null) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [techniques, setTechniques] = useState<Record<string, string>>({});
  const [templates, setTemplates] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const fetchTechniques = useCallback(async () => {
    if (!token) return;
    try {
      const response = await apiClient.get('/prompts/techniques');
      setTechniques(response.data.techniques);
      setTemplates(response.data.templates);
    } catch (err) {
      console.error('Error fetching prompt techniques:', err);
    }
  }, [token]);

  const optimizePrompt = useCallback(async (params: {
    prompt: string;
    technique?: string;
    context?: string;
  }) => {
    if (!token) return null;
    
    setIsOptimizing(true);
    setError(null);
    
    try {
      const response = await apiClient.post('/prompts/optimize', params);
      return response.data.optimized as string;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to optimize prompt';
      setError(msg);
      console.error('Prompt optimization error:', err);
      return null;
    } finally {
      setIsOptimizing(false);
    }
  }, [token]);

  return {
    isOptimizing,
    techniques,
    templates,
    error,
    fetchTechniques,
    optimizePrompt
  };
}
