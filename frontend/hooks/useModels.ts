import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  description?: string;
  context_length?: number;
  max_tokens?: number;
  parameters?: string;
  quantization?: string;
  size?: string;
  capabilities?: string[];
  metadata?: Record<string, any>;
}

export interface ModelsResponse {
  models: Record<string, ModelInfo[]>;
  total: number;
}

export interface ProviderHealth {
  provider: string;
  status: string;
  available: boolean;
  models_count?: number;
  supports_streaming?: boolean;
  supports_embeddings?: boolean;
  default_model?: string;
  error?: string;
}

export function useModels(token: string | null) {
  const [models, setModels] = useState<Record<string, ModelInfo[]>>({});
  const [allModels, setAllModels] = useState<ModelInfo[]>([]);
  const [providers, setProviders] = useState<string[]>([]);
  const [providersHealth, setProvidersHealth] = useState<Record<string, ProviderHealth>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all models
  const fetchModels = useCallback(
    async (forceRefresh: boolean = false) => {
      if (!token) return;

      try {
        setLoading(true);
        setError(null);

        const response = await axios.get<ModelsResponse>(
          `${API_BASE}/models${forceRefresh ? '?refresh=true' : ''}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setModels(response.data.models);

        // Flatten all models into a single array
        const flatModels: ModelInfo[] = [];
        Object.values(response.data.models).forEach((providerModels) => {
          flatModels.push(...providerModels);
        });
        setAllModels(flatModels);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch models');
        console.error('Error fetching models:', err);
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  // Fetch models by provider
  const fetchModelsByProvider = useCallback(
    async (provider: string, forceRefresh: boolean = false) => {
      if (!token) return [];

      try {
        const response = await axios.get<{ provider: string; models: ModelInfo[] }>(
          `${API_BASE}/models/${provider}${forceRefresh ? '?refresh=true' : ''}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        return response.data.models;
      } catch (err: any) {
        console.error(`Error fetching models for ${provider}:`, err);
        return [];
      }
    },
    [token]
  );

  // Get model info
  const getModelInfo = useCallback(
    async (provider: string, modelId: string): Promise<ModelInfo | null> => {
      if (!token) return null;

      try {
        const response = await axios.get<ModelInfo>(
          `${API_BASE}/models/${provider}/${modelId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        return response.data;
      } catch (err: any) {
        console.error(`Error getting model info for ${provider}/${modelId}:`, err);
        return null;
      }
    },
    [token]
  );

  // Search models
  const searchModels = useCallback(
    async (query: string) => {
      if (!token || !query.trim()) return [];

      try {
        const response = await axios.get<{ query: string; results: Array<{ provider: string; model: ModelInfo }> }>(
          `${API_BASE}/models/search?q=${encodeURIComponent(query)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        return response.data.results;
      } catch (err: any) {
        console.error('Error searching models:', err);
        return [];
      }
    },
    [token]
  );

  // Fetch providers
  const fetchProviders = useCallback(async () => {
    if (!token) return;

    try {
      const response = await axios.get<{ providers: string[] }>(
        `${API_BASE}/models/providers`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProviders(response.data.providers);
    } catch (err: any) {
      console.error('Error fetching providers:', err);
    }
  }, [token]);

  // Fetch providers health
  const fetchProvidersHealth = useCallback(async () => {
    if (!token) return;

    try {
      const response = await axios.get<Record<string, ProviderHealth>>(
        `${API_BASE}/models/providers/health`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProvidersHealth(response.data);
    } catch (err: any) {
      console.error('Error fetching providers health:', err);
    }
  }, [token]);

  // Load data on mount
  useEffect(() => {
    if (token) {
      fetchModels();
      fetchProviders();
      fetchProvidersHealth();
    }
  }, [token, fetchModels, fetchProviders, fetchProvidersHealth]);

  return {
    models,
    allModels,
    providers,
    providersHealth,
    loading,
    error,
    fetchModels,
    fetchModelsByProvider,
    getModelInfo,
    searchModels,
    fetchProvidersHealth,
  };
}
