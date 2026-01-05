'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Typography, Space, Select, Divider, Row, Col, Tag, App } from 'antd';
import { AudioOutlined, RobotOutlined } from '@ant-design/icons';
import { Conversation, Provider } from '@/types';
import apiClient from '@/lib/api';
import { useModels } from '@/hooks/useModels';

const { Title, Text } = Typography;

interface ModelSettingsModalProps {
  open: boolean;
  onOk: () => void;
  onCancel: () => void;
  currentConversation: Conversation | null;
  accessToken: string | null;
  selectedProvider: string;
  selectedModel: string;
  onSelectModel: (provider: string, model: string) => void;
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;
}

export const ModelSettingsModal: React.FC<ModelSettingsModalProps> = ({
  open,
  onOk,
  onCancel,
  currentConversation,
  accessToken,
  selectedProvider,
  selectedModel,
  onSelectModel,
  selectedVoice,
  setSelectedVoice,
}) => {
  const { message } = App.useApp();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerType, setProviderType] = useState<string>(selectedProvider);
  const [providerId, setProviderId] = useState<string | undefined>();
  const [model, setModel] = useState<string>(selectedModel);
  const [loading, setLoading] = useState(false);

  const { models, loading: loadingModels } = useModels(accessToken || '');

  // Load providers
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/settings');
        const providersList = response.data.providers || [];
        setProviders(providersList);

        // Auto-select provider if current conversation has one
        if (currentConversation?.provider) {
          setProviderType(currentConversation.provider);
          // Try to find matching provider by name
          const matchingProvider = providersList.find(
            (p: Provider) =>
              p.type === currentConversation.provider &&
              p.name === currentConversation.provider_name
          );
          if (matchingProvider) {
            setProviderId(matchingProvider.id);
          }
        }
      } catch {
        message.error('Failed to load providers');
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchProviders();
    }
  }, [open, currentConversation, message]);

  // Update parent when selections change
  useEffect(() => {
    if (providerType && model) {
      onSelectModel(providerType, model);
    }
  }, [providerType, model, onSelectModel]);

  const handleOk = () => {
    if (!providerType || !providerId || !model) {
      message.warning('Please select provider type, instance, and model');
      return;
    }
    onOk();
  };

  return (
    <Modal
      title={currentConversation ? 'Conversation Settings' : 'New Conversation Settings'}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      width={700}
      okText={currentConversation ? 'Update Settings' : 'Create Conversation'}
    >
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={5} style={{ marginBottom: '16px' }}>
            <RobotOutlined /> Model Selection
          </Title>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Text type="secondary">Provider Type</Text>
              <Select
                style={{ width: '100%', marginTop: 8 }}
                placeholder="Select provider type"
                value={providerType}
                onChange={(value) => {
                  setProviderType(value);
                  setProviderId(undefined);
                  setModel('');
                }}
                loading={loading}
              >
                {['ollama', 'openai', 'huggingface', 'agent']
                  .filter((type) => providers.some((p) => p.type === type && p.enabled))
                  .map((type) => (
                    <Select.Option key={type} value={type}>
                      {type === 'ollama' && 'Ollama (Local)'}
                      {type === 'openai' && 'OpenAI / Compatible'}
                      {type === 'huggingface' && 'HuggingFace'}
                      {type === 'agent' && 'External Agent'}
                    </Select.Option>
                  ))}
              </Select>
            </Col>
            <Col span={24}>
              <Text type="secondary">Account/Instance</Text>
              <Select
                style={{ width: '100%', marginTop: 8 }}
                placeholder="Select instance"
                value={providerId}
                onChange={(value) => {
                  setProviderId(value);
                  setModel('');
                }}
                disabled={!providerType}
                loading={loading}
              >
                {providers
                  .filter((p) => p.enabled && p.type === providerType)
                  .map((p) => (
                    <Select.Option key={p.id} value={p.id}>
                      {p.name}
                    </Select.Option>
                  ))}
              </Select>
            </Col>
            <Col span={24}>
              <Text type="secondary">Model</Text>
              <Select
                showSearch
                style={{ width: '100%', marginTop: 8 }}
                placeholder="Select a model"
                value={model}
                onChange={setModel}
                disabled={!providerId}
                loading={loadingModels}
                optionLabelProp="label"
              >
                {providerType && models[providerType]
                  ? models[providerType].map((m) => (
                      <Select.Option key={m.id} value={m.id} label={m.name || m.id}>
                        <Space orientation="vertical" size={0}>
                          <Text strong>{m.name || m.id}</Text>
                          <Space size="small" wrap>
                            {m.parameters && (
                              <Tag color="blue" style={{ fontSize: '10px' }}>
                                {m.parameters}
                              </Tag>
                            )}
                            {m.quantization && (
                              <Tag color="purple" style={{ fontSize: '10px' }}>
                                {m.quantization}
                              </Tag>
                            )}
                            {m.size && (
                              <Tag color="green" style={{ fontSize: '10px' }}>
                                {m.size}
                              </Tag>
                            )}
                          </Space>
                        </Space>
                      </Select.Option>
                    ))
                  : []}
              </Select>
            </Col>
          </Row>
        </div>

        <Divider style={{ margin: '12px 0' }} />

        <div>
          <Title level={5} style={{ marginBottom: '16px' }}>
            <AudioOutlined /> Voice Settings
          </Title>
          <Space orientation="vertical" style={{ width: '100%' }}>
            <Text type="secondary">Select the voice for Text-to-Speech:</Text>
            <Select
              style={{ width: '100%' }}
              value={selectedVoice}
              onChange={setSelectedVoice}
              options={[
                { label: 'Gonzalo (Colombia) - Male', value: 'es-CO-GonzaloNeural' },
                { label: 'Salome (Colombia) - Female', value: 'es-CO-SalomeNeural' },
                { label: 'Alvaro (Spain) - Male', value: 'es-ES-AlvaroNeural' },
                { label: 'Elvira (Spain) - Female', value: 'es-ES-ElviraNeural' },
                { label: 'Jorge (Mexico) - Male', value: 'es-MX-JorgeNeural' },
                { label: 'Dalia (Mexico) - Female', value: 'es-MX-DaliaNeural' },
                { label: 'Andrew (USA) - Male', value: 'en-US-AndrewNeural' },
                { label: 'Emma (USA) - Female', value: 'en-US-EmmaNeural' },
              ]}
            />
          </Space>
        </div>
      </Space>
    </Modal>
  );
};
