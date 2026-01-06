/**
 * Agent Configuration Store
 * Manages agent configuration state with Zustand
 */

import { create } from 'zustand';
import apiClient from '@/lib/api';

// Type for config field values
type ConfigValue = string | number | boolean | string[] | number[] | null | undefined;

export interface ConfigField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'integer' | 'boolean' | 'enum' | 'array';
  default: ConfigValue;
  description?: string;
  min?: number;
  max?: number;
  enumValues?: string[];
  itemsType?: string;
  required: boolean;
}

export interface AgentConfig {
  id: string;
  user_id: string;
  provider: string;
  model_id: string;
  scope: 'global' | 'conversation';
  conversation_id?: string;
  config_values: Record<string, ConfigValue>;
  created_at: string;
  updated_at: string;
}

export interface ConfigSchema {
  provider: string;
  model_id: string;
  fields: ConfigField[];
  raw_schema?: {
    type: string;
    properties: Record<string, unknown>;
    [key: string]: unknown;
  };
}

interface AgentConfigStore {
  // State
  configs: Record<string, Record<string, ConfigValue>>; // key: `${provider}:${model}:${conversationId?}`, value: config_values
  schemas: Record<string, ConfigSchema>; // key: `${provider}:${model}`, value: schema
  loading: boolean;
  error: string | null;

  // Actions
  fetchSchema: (providerId: string, modelId: string) => Promise<ConfigSchema | null>;
  loadConfig: (
    providerId: string,
    modelId: string,
    conversationId?: string
  ) => Promise<Record<string, ConfigValue>>;
  saveConfig: (
    providerId: string,
    modelId: string,
    configValues: Record<string, ConfigValue>,
    scope: 'global' | 'conversation',
    conversationId?: string
  ) => Promise<void>;
  deleteConfig: (
    provider: string,
    modelId: string,
    scope: 'global' | 'conversation',
    conversationId?: string
  ) => Promise<void>;
  hasConfig: (provider: string, modelId: string, conversationId?: string) => boolean;
  getConfig: (
    provider: string,
    modelId: string,
    conversationId?: string
  ) => Record<string, ConfigValue>;
  clearError: () => void;
  reset: () => void;
}

const getConfigKey = (provider: string, modelId: string, conversationId?: string): string => {
  return conversationId ? `${provider}:${modelId}:${conversationId}` : `${provider}:${modelId}`;
};

const getSchemaKey = (provider: string, modelId: string): string => {
  return `${provider}:${modelId}`;
};

export const useAgentConfig = create<AgentConfigStore>((set, get) => ({
  configs: {},
  schemas: {},
  loading: false,
  error: null,

  fetchSchema: async (providerId: string, modelId: string) => {
    const schemaKey = getSchemaKey(providerId, modelId);

    // Return cached schema if available
    const cached = get().schemas[schemaKey];
    if (cached) {
      return cached;
    }

    set({ loading: true, error: null });

    try {
      const response = await apiClient.get<ConfigSchema>(
        `/models/${providerId}/${modelId}/config/schema`
      );

      const schema = response.data;

      set((state) => ({
        schemas: {
          ...state.schemas,
          [schemaKey]: schema,
        },
        loading: false,
      }));

      return schema;
    } catch (error: unknown) {
      const errorMsg =
        (error as { response?: { data?: { error?: string } }; message?: string }).response?.data
          ?.error ||
        (error as { message?: string }).message ||
        'Failed to fetch schema';
      set({ error: errorMsg, loading: false });
      console.error('Error fetching config schema:', error);
      return null;
    }
  },

  loadConfig: async (providerId: string, modelId: string, conversationId?: string) => {
    const configKey = getConfigKey(providerId, modelId, conversationId);

    set({ loading: true, error: null });

    try {
      const params: Record<string, string> = {};
      if (conversationId) {
        params.conversation_id = conversationId;
      }

      const response = await apiClient.get<Record<string, ConfigValue>>(
        `/models/${providerId}/${modelId}/config/values`,
        { params }
      );

      const configValues = response.data;

      set((state) => ({
        configs: {
          ...state.configs,
          [configKey]: configValues,
        },
        loading: false,
      }));

      return configValues;
    } catch (error: unknown) {
      const errorMsg =
        (error as { response?: { data?: { error?: string } }; message?: string }).response?.data
          ?.error ||
        (error as { message?: string }).message ||
        'Failed to load config';
      set({ error: errorMsg, loading: false });
      console.error('Error loading config:', error);
      return {};
    }
  },

  saveConfig: async (
    providerId: string,
    modelId: string,
    configValues: Record<string, ConfigValue>,
    scope: 'global' | 'conversation',
    conversationId?: string
  ) => {
    set({ loading: true, error: null });

    try {
      const params: Record<string, string> = { scope };
      if (conversationId) {
        params.conversation_id = conversationId;
      }

      await apiClient.post(
        `/models/${providerId}/${modelId}/config/values`,
        { config_values: configValues },
        { params }
      );

      const configKey = getConfigKey(providerId, modelId, conversationId);

      set((state) => ({
        configs: {
          ...state.configs,
          [configKey]: configValues,
        },
        loading: false,
      }));
    } catch (error: unknown) {
      const errorMsg =
        (error as { response?: { data?: { error?: string } }; message?: string }).response?.data
          ?.error ||
        (error as { message?: string }).message ||
        'Failed to save config';
      set({ error: errorMsg, loading: false });
      console.error('Error saving config:', error);
      throw error;
    }
  },

  deleteConfig: async (
    provider: string,
    modelId: string,
    scope: 'global' | 'conversation',
    conversationId?: string
  ) => {
    set({ loading: true, error: null });

    try {
      const params: Record<string, string> = { scope };
      if (conversationId) {
        params.conversation_id = conversationId;
      }

      await apiClient.delete(`/models/${provider}/${modelId}/config`, { params });

      const configKey = getConfigKey(provider, modelId, conversationId);

      set((state) => {
        const newConfigs = { ...state.configs };
        delete newConfigs[configKey];
        return {
          configs: newConfigs,
          loading: false,
        };
      });
    } catch (error: unknown) {
      const errorMsg =
        (error as { response?: { data?: { error?: string } }; message?: string }).response?.data
          ?.error ||
        (error as { message?: string }).message ||
        'Failed to delete config';
      set({ error: errorMsg, loading: false });
      console.error('Error deleting config:', error);
      throw error;
    }
  },

  hasConfig: (provider: string, modelId: string, conversationId?: string) => {
    const configKey = getConfigKey(provider, modelId, conversationId);
    const config = get().configs[configKey];
    return config && Object.keys(config).length > 0;
  },

  getConfig: (provider: string, modelId: string, conversationId?: string) => {
    const configKey = getConfigKey(provider, modelId, conversationId);
    return get().configs[configKey] || {};
  },

  clearError: () => set({ error: null }),

  reset: () => set({ configs: {}, schemas: {}, loading: false, error: null }),
}));
