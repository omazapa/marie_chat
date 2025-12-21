'use client';

import { useState, useEffect } from 'react';
import { Select, Card, Space, Typography, Tag, Spin, Alert, Tooltip } from 'antd';
import { RobotOutlined, CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useModels, ModelInfo } from '@/hooks/useModels';

const { Text, Title } = Typography;
const { Option, OptGroup } = Select;

interface ModelSelectorProps {
  token: string | null;
  selectedProvider?: string;
  selectedModel?: string;
  onSelect: (provider: string, model: string) => void;
  showDetails?: boolean;
  size?: 'small' | 'middle' | 'large';
  disabled?: boolean;
}

export default function ModelSelector({
  token,
  selectedProvider = 'ollama',
  selectedModel = 'llama3.2',
  onSelect,
  showDetails = true,
  size = 'middle',
  disabled = false,
}: ModelSelectorProps) {
  const { models, providers, providersHealth, loading, error, fetchModels } = useModels(token);
  const [currentProvider, setCurrentProvider] = useState(selectedProvider);
  const [currentModel, setCurrentModel] = useState(selectedModel);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);

  useEffect(() => {
    setCurrentProvider(selectedProvider);
    setCurrentModel(selectedModel);
  }, [selectedProvider, selectedModel]);

  useEffect(() => {
    // Find current model info
    if (models[currentProvider]) {
      const found = models[currentProvider].find((m) => m.id === currentModel);
      setModelInfo(found || null);
    }
  }, [currentProvider, currentModel, models]);

  const handleProviderChange = (provider: string) => {
    setCurrentProvider(provider);
    
    // Select first available model from new provider
    if (models[provider] && models[provider].length > 0) {
      const firstModel = models[provider][0].id;
      setCurrentModel(firstModel);
      onSelect(provider, firstModel);
    }
  };

  const handleModelChange = (modelId: string) => {
    setCurrentModel(modelId);
    onSelect(currentProvider, modelId);
  };

  const getProviderStatus = (provider: string) => {
    const health = providersHealth[provider];
    if (!health) return { status: 'unknown', color: 'default' };
    
    if (health.available) {
      return { status: 'available', color: 'success', icon: <CheckCircleOutlined /> };
    } else {
      return { status: 'unavailable', color: 'error', icon: <CloseCircleOutlined /> };
    }
  };

  if (loading && Object.keys(models).length === 0) {
    return (
      <Card>
        <Space orientation="vertical" align="center" style={{ width: '100%', padding: '20px' }}>
          <Spin size="large" />
          <Text type="secondary">Loading models...</Text>
        </Space>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error loading models"
        description={error}
        type="error"
        showIcon
        action={
          <a onClick={() => fetchModels(true)}>Retry</a>
        }
      />
    );
  }

  const availableModels = models[currentProvider] || [];
  const providerStatus = getProviderStatus(currentProvider);
  const providerHealthInfo = providersHealth[currentProvider];

  return (
    <Space orientation="vertical" style={{ width: '100%' }} size="middle">
      {/* Provider Selector */}
      <div>
        <Text strong style={{ display: 'block', marginBottom: '8px' }}>
          Provider
        </Text>
        <Select
          value={currentProvider}
          onChange={handleProviderChange}
          style={{ width: '100%' }}
          size={size}
          disabled={disabled || loading}
        >
          {providers.map((provider) => {
            const status = getProviderStatus(provider);
            return (
              <Option key={provider} value={provider}>
                <Space>
                  <RobotOutlined />
                  {provider}
                  <Tag color={status.color} icon={status.icon}>
                    {status.status}
                  </Tag>
                </Space>
              </Option>
            );
          })}
        </Select>
      </div>

      {/* Model Selector */}
      <div>
        <Text strong style={{ display: 'block', marginBottom: '8px' }}>
          Model
        </Text>
        <Select
          value={currentModel}
          onChange={handleModelChange}
          style={{ width: '100%' }}
          size={size}
          disabled={disabled || loading || !providerHealthInfo?.available}
          showSearch
          optionFilterProp="children"
          placeholder="Select a model"
          notFoundContent={
            providerHealthInfo?.available ? (
              'No models available'
            ) : (
              <Space orientation="vertical" align="center" style={{ padding: '20px' }}>
                <CloseCircleOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />
                <Text type="secondary">Provider unavailable</Text>
                {providerHealthInfo?.error && (
                  <Text type="danger" style={{ fontSize: '12px' }}>
                    {providerHealthInfo.error}
                  </Text>
                )}
              </Space>
            )
          }
        >
          {availableModels.map((model) => (
            <Option key={model.id} value={model.id}>
              <Space orientation="vertical" size={0}>
                <Text strong>{model.name}</Text>
                {model.description && (
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {model.description.substring(0, 60)}
                    {model.description.length > 60 ? '...' : ''}
                  </Text>
                )}
                <Space size="small">
                  {model.parameters && <Tag color="blue">{model.parameters}</Tag>}
                  {model.quantization && <Tag color="purple">{model.quantization}</Tag>}
                  {model.size && <Tag color="green">{model.size}</Tag>}
                </Space>
              </Space>
            </Option>
          ))}
        </Select>
      </div>

      {/* Model Details */}
      {showDetails && modelInfo && (
        <Card
          size="small"
          style={{
            background: '#f5f5f5',
            border: '1px solid #e8e8e8',
          }}
        >
          <Space orientation="vertical" size="small" style={{ width: '100%' }}>
            <Space>
              <RobotOutlined style={{ color: '#1B4B73' }} />
              <Text strong>{modelInfo.name}</Text>
            </Space>
            
            {modelInfo.description && (
              <Text type="secondary" style={{ fontSize: '13px' }}>
                {modelInfo.description}
              </Text>
            )}

            <Space wrap>
              {modelInfo.parameters && (
                <Tooltip title="Model parameters">
                  <Tag color="blue" icon={<InfoCircleOutlined />}>
                    {modelInfo.parameters}
                  </Tag>
                </Tooltip>
              )}
              {modelInfo.quantization && (
                <Tooltip title="Quantization">
                  <Tag color="purple">{modelInfo.quantization}</Tag>
                </Tooltip>
              )}
              {modelInfo.size && (
                <Tooltip title="Model size">
                  <Tag color="green">{modelInfo.size}</Tag>
                </Tooltip>
              )}
              {modelInfo.context_length && (
                <Tooltip title="Context length">
                  <Tag color="orange">{modelInfo.context_length} tokens</Tag>
                </Tooltip>
              )}
            </Space>

            {modelInfo.capabilities && modelInfo.capabilities.length > 0 && (
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Capabilities:
                </Text>
                <Space size="small" style={{ marginTop: '4px' }}>
                  {modelInfo.capabilities.map((cap) => (
                    <Tag key={cap} style={{ fontSize: '11px' }}>
                      {cap}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}
          </Space>
        </Card>
      )}
    </Space>
  );
}
