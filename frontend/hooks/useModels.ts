import { useState, useEffect, useCallback } from 'react';
import apiClient, { getErrorMessage } from '../lib/api';
import { Model as ModelInfo, ProviderHealth } from '@/types';

export function useModels(token: string | null) {
  const [models, setModels] = useState<Record<string, ModelInfo[]>>({});
  const [allModels, setAllModels] = useState<ModelInfo[]>([]);
  const [providers, setProviders] = useState<string[]>([]);
  const [providersHealth, setProvidersHealth] = useState<Record<string, ProviderHealth>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all models, providers and health in one call
  const fetchModelsInit = useCallback(
    async (forceRefresh: boolean = false) => {
      if (!token) return;

      try {
        setLoading(true);
        setError(null);

        const response = await apiClient.get<{
          models: Record<string, ModelInfo[]>;
          providers: string[];
          health: Record<string, ProviderHealth>;
        }>(`/models/init${forceRefresh ? '?refresh=true' : ''}`);

        setModels(response.data.models);
        setProviders(response.data.providers);
        setProvidersHealth(response.data.health);

        // Flatten all models into a single array
        const flatModels: ModelInfo[] = [];
        Object.values(response.data.models).forEach((providerModels) => {
          flatModels.push(...providerModels);
        });
        setAllModels(flatModels);
      } catch (err: unknown) {
        const errorMsg = getErrorMessage(err, 'Failed to fetch models');
        setError(errorMsg);
        console.error('Error fetching models init:', errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  // Fetch all models (legacy, now uses init)
  const fetchModels = useCallback(
    async (forceRefresh: boolean = false) => {
      return fetchModelsInit(forceRefresh);
    },
    [fetchModelsInit]
  );

  // Fetch models by provider
  const fetchModelsByProvider = useCallback(
    async (provider: string, forceRefresh: boolean = false) => {
      if (!token) return [];

      try {
        const response = await apiClient.get<{ provider: string; models: ModelInfo[] }>(
          `/models/${provider}${forceRefresh ? '?refresh=true' : ''}`
        );

        return response.data.models;
      } catch (err: unknown) {
        console.error(`Error fetching models for ${provider}:`, getErrorMessage(err));
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
        const response = await apiClient.get<ModelInfo>(`/models/${provider}/${modelId}`);

        return response.data;
      } catch (err: unknown) {
        console.error(`Error getting model info for ${provider}/${modelId}:`, getErrorMessage(err));
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
        const response = await apiClient.get<{
          query: string;
          results: Array<{ provider: string; model: ModelInfo }>;
        }>(`/models/search?q=${encodeURIComponent(query)}`);

        return response.data.results;
      } catch (err: unknown) {
        console.error('Error searching models:', getErrorMessage(err));
        return [];
      }
    },
    [token]
  );

  // Fetch providers health (legacy, now uses init)
  const fetchProvidersHealth = useCallback(async () => {
    return fetchModelsInit();
  }, [fetchModelsInit]);

  // Load data on mount
  useEffect(() => {
    if (token) {
      fetchModelsInit();
    }
  }, [token, fetchModelsInit]);

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
