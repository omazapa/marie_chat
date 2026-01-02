'use client';

import { useMemo, useEffect } from 'react';
import { Select, Card, Space, Typography, Tag, Spin, Alert, Tooltip, Button } from 'antd';
import {
  RobotOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useModels } from '@/hooks/useModels';

const { Text } = Typography;
const { Option } = Select;

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

  // Auto-refresh models when provider changes to Ollama
  useEffect(() => {
    if (selectedProvider === 'ollama') {
      fetchModels(true);
    }
  }, [selectedProvider, fetchModels]);

  const modelInfo = useMemo(() => {
    if (models[selectedProvider]) {
      return models[selectedProvider].find((m) => m.id === selectedModel) || null;
    }
    return null;
  }, [selectedProvider, selectedModel, models]);

  const handleProviderChange = (provider: string) => {
    // Select first available model from new provider
    if (models[provider] && models[provider].length > 0) {
      const firstModel = models[provider][0].id;
      onSelect(provider, firstModel);
    }
  };

  const handleModelChange = (modelId: string) => {
    onSelect(selectedProvider, modelId);
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
        title="Error loading models"
        description={error}
        type="error"
        showIcon
        action={<a onClick={() => fetchModels(true)}>Retry</a>}
      />
    );
  }

  const availableModels = models[selectedProvider] || [];
  const providerHealthInfo = providersHealth[selectedProvider];

  return (
    <Space orientation="vertical" style={{ width: '100%' }} size="middle">
      {/* Provider Selector */}
      <div>
        <Text strong style={{ display: 'block', marginBottom: '8px' }}>
          Provider
        </Text>
        <Select
          value={selectedProvider}
          onChange={handleProviderChange}
          style={{ width: '100%' }}
          size={size}
          disabled={disabled || loading}
        >
          {providers.map((provider) => {
            const status = getProviderStatus(provider);
            return (
              <Option key={provider} value={provider}>
                <Space orientation="horizontal">
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
        <Space style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <Text strong>Model</Text>
          <Button
            type="link"
            size="small"
            icon={<ReloadOutlined spin={loading} />}
            onClick={() => fetchModels(true)}
            title="Refresh models"
          />
        </Space>
        <Select
          value={selectedModel}
          onChange={handleModelChange}
          style={{ width: '100%' }}
          size={size}
          disabled={disabled || loading || !providerHealthInfo?.available}
          showSearch
          optionFilterProp="label"
          optionLabelProp="label"
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
            <Option key={model.id} value={model.id} label={model.name}>
              <Space orientation="vertical" size={0} style={{ width: '100%' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text strong>{model.name}</Text>
                  {model.size && (
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      {model.size}
                    </Text>
                  )}
                </div>
                {model.description && (
                  <Text
                    type="secondary"
                    style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}
                  >
                    {model.description.substring(0, 60)}
                    {model.description.length > 60 ? '...' : ''}
                  </Text>
                )}
                <Space size={[0, 4]} wrap>
                  {model.parameters && (
                    <Tag color="blue" style={{ fontSize: '10px', margin: 0 }}>
                      {model.parameters}
                    </Tag>
                  )}
                  {model.quantization && (
                    <Tag color="purple" style={{ fontSize: '10px', margin: 0 }}>
                      {model.quantization}
                    </Tag>
                  )}
                  {!!model.metadata?.family && (
                    <Tag style={{ fontSize: '10px', margin: 0 }}>
                      {model.metadata.family as string}
                    </Tag>
                  )}
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
            background: '#f0f5ff',
            border: '1px solid #adc6ff',
            borderRadius: '8px',
          }}
        >
          <Space orientation="vertical" size="small" style={{ width: '100%' }}>
            <Space orientation="horizontal">
              <RobotOutlined style={{ color: '#1B4B73', fontSize: '18px' }} />
              <Text strong style={{ color: '#1B4B73', fontSize: '15px' }}>
                {modelInfo.name}
              </Text>
            </Space>

            {modelInfo.description && (
              <Text type="secondary" style={{ fontSize: '13px' }}>
                {modelInfo.description}
              </Text>
            )}

            <Space orientation="horizontal" wrap>
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
              {!!modelInfo.metadata?.family && (
                <Tooltip title="Family">
                  <Tag color="cyan">{modelInfo.metadata.family as string}</Tag>
                </Tooltip>
              )}
              {!!modelInfo.metadata?.format && (
                <Tooltip title="Format">
                  <Tag color="gold">{modelInfo.metadata.format as string}</Tag>
                </Tooltip>
              )}
            </Space>

            {modelInfo.capabilities && modelInfo.capabilities.length > 0 && (
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Capabilities:
                </Text>
                <Space orientation="horizontal" size="small" style={{ marginTop: '4px' }}>
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
