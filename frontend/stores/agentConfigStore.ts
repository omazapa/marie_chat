/**
 * Agent Configuration Store
 * Manages agent configuration state with Zustand
 */

import { create } from 'zustand';
import apiClient from '@/lib/api';

export interface ConfigField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'integer' | 'boolean' | 'enum' | 'array';
  default: any;
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
  config_values: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ConfigSchema {
  provider: string;
  model_id: string;
  fields: ConfigField[];
  raw_schema?: any;
}

interface AgentConfigStore {
  // State
  configs: Record<string, Record<string, any>>; // key: `${provider}:${model}:${conversationId?}`, value: config_values
  schemas: Record<string, ConfigSchema>; // key: `${provider}:${model}`, value: schema
  loading: boolean;
  error: string | null;

  // Actions
  fetchSchema: (provider: string, modelId: string) => Promise<ConfigSchema | null>;
  loadConfig: (
    provider: string,
    modelId: string,
    conversationId?: string
  ) => Promise<Record<string, any>>;
  saveConfig: (
    provider: string,
    modelId: string,
    configValues: Record<string, any>,
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
  getConfig: (provider: string, modelId: string, conversationId?: string) => Record<string, any>;
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

  fetchSchema: async (provider: string, modelId: string) => {
    const schemaKey = getSchemaKey(provider, modelId);

    // Return cached schema if available
    const cached = get().schemas[schemaKey];
    if (cached) {
      return cached;
    }

    set({ loading: true, error: null });

    try {
      const response = await apiClient.get<ConfigSchema>(
        `/models/${provider}/${modelId}/config/schema`
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
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to fetch schema';
      set({ error: errorMsg, loading: false });
      console.error('Error fetching config schema:', error);
      return null;
    }
  },

  loadConfig: async (provider: string, modelId: string, conversationId?: string) => {
    const configKey = getConfigKey(provider, modelId, conversationId);

    set({ loading: true, error: null });

    try {
      const params: any = {};
      if (conversationId) {
        params.conversation_id = conversationId;
      }

      const response = await apiClient.get<Record<string, any>>(
        `/models/${provider}/${modelId}/config/values`,
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
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to load config';
      set({ error: errorMsg, loading: false });
      console.error('Error loading config:', error);
      return {};
    }
  },

  saveConfig: async (
    provider: string,
    modelId: string,
    configValues: Record<string, any>,
    scope: 'global' | 'conversation',
    conversationId?: string
  ) => {
    set({ loading: true, error: null });

    try {
      const params: any = { scope };
      if (conversationId) {
        params.conversation_id = conversationId;
      }

      await apiClient.post(
        `/models/${provider}/${modelId}/config/values`,
        { config_values: configValues },
        { params }
      );

      const configKey = getConfigKey(provider, modelId, conversationId);

      set((state) => ({
        configs: {
          ...state.configs,
          [configKey]: configValues,
        },
        loading: false,
      }));
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to save config';
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
      const params: any = { scope };
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
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to delete config';
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
