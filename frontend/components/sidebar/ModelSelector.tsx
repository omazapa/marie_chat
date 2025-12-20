'use client';

import { useState, useEffect } from 'react';
import { Select, Card, Typography, Space } from 'antd';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

const { Title, Text } = Typography;
const { Option } = Select;

interface ModelSelectorProps {
  onModelChange?: (provider: string, model: string) => void;
  defaultProvider?: string;
  defaultModel?: string;
}

export default function ModelSelector({
  onModelChange,
  defaultProvider = 'ollama',
  defaultModel = 'llama3.2',
}: ModelSelectorProps) {
  const [providers, setProviders] = useState<Record<string, any>>({});
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>(defaultProvider);
  const [selectedModel, setSelectedModel] = useState<string>(defaultModel);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Only load models if user is authenticated
    if (isAuthenticated) {
      loadModels();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadModels = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getModels();

      if (response.data) {
        setProviders(response.data.providers);
        setAvailableProviders(response.data.available_providers);
        
        const defaultProv = response.data.default_provider || defaultProvider;
        setSelectedProvider(defaultProv);
        
        const defaultMod = response.data.providers[defaultProv]?.default || defaultModel;
        setSelectedModel(defaultMod);
        
        if (onModelChange) {
          onModelChange(defaultProv, defaultMod);
        }
      }
    } catch (error) {
      console.error('Error loading models:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider);
    const models = providers[provider]?.models || [];
    const defaultModel = providers[provider]?.default || models[0] || '';
    setSelectedModel(defaultModel);
    
    if (onModelChange) {
      onModelChange(provider, defaultModel);
    }
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    
    if (onModelChange) {
      onModelChange(selectedProvider, model);
    }
  };

  const currentModels = providers[selectedProvider]?.models || [];

  return (
    <Card size="small" style={{ marginBottom: '16px' }}>
      <Space orientation="vertical" style={{ width: '100%' }} size="small">
        <div>
          <Text strong>Provider:</Text>
          <Select
            value={selectedProvider}
            onChange={handleProviderChange}
            style={{ width: '100%', marginTop: '8px' }}
            loading={loading}
          >
            {availableProviders.map((provider) => (
              <Option key={provider} value={provider}>
                {provider.charAt(0).toUpperCase() + provider.slice(1)}
              </Option>
            ))}
          </Select>
        </div>

        <div>
          <Text strong>Model:</Text>
          <Select
            value={selectedModel}
            onChange={handleModelChange}
            style={{ width: '100%', marginTop: '8px' }}
            loading={loading}
            disabled={currentModels.length === 0}
          >
            {currentModels.map((model: string) => (
              <Option key={model} value={model}>
                {model}
              </Option>
            ))}
          </Select>
        </div>
      </Space>
    </Card>
  );
}

