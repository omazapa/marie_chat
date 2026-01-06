'use client';

import React, { useState } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Modal,
  Form,
  Input,
  Select,
  App,
  Tag,
  Tooltip,
  Empty,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ApiOutlined,
  CloudServerOutlined,
  RobotOutlined,
  GlobalOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

export interface Provider {
  id: string;
  name: string;
  type: 'ollama' | 'openai' | 'huggingface' | 'agent';
  enabled: boolean;
  config: {
    base_url?: string;
    api_key?: string;
    [key: string]: string | number | boolean | undefined;
  };
  status?: {
    available: boolean;
    models_count?: number;
    error?: string;
  };
}

interface ProviderManagerProps {
  providers: Provider[];
  onAdd: (provider: Omit<Provider, 'id'>) => Promise<void>;
  onUpdate: (id: string, provider: Partial<Provider>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onTest: (id: string) => Promise<{ available: boolean; models_count?: number; error?: string }>;
  loading?: boolean;
}

const PROVIDER_TYPES = [
  {
    value: 'ollama',
    label: 'Ollama (Local)',
    icon: <CloudServerOutlined />,
    color: '#52c41a',
    description: 'Local LLM provider running on your machine',
  },
  {
    value: 'openai',
    label: 'OpenAI / Compatible',
    icon: <GlobalOutlined />,
    color: '#1890ff',
    description: 'OpenAI API or compatible endpoints',
  },
  {
    value: 'huggingface',
    label: 'HuggingFace',
    icon: <ApiOutlined />,
    color: '#faad14',
    description: 'HuggingFace Inference API',
  },
  {
    value: 'agent',
    label: 'External Agent',
    icon: <RobotOutlined />,
    color: '#722ed1',
    description: 'Custom remote AI agent',
  },
];

export const ProviderManager: React.FC<ProviderManagerProps> = ({
  providers,
  onAdd,
  onUpdate,
  onDelete,
  onTest,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const { message, modal } = App.useApp();

  const handleAdd = () => {
    form.resetFields();
    setEditingProvider(null);
    setModalVisible(true);
  };

  const handleEdit = (provider: Provider) => {
    setEditingProvider(provider);
    form.setFieldsValue({
      name: provider.name,
      type: provider.type,
      enabled: provider.enabled,
      base_url: provider.config.base_url,
      api_key: provider.config.api_key,
    });
    setModalVisible(true);
  };

  const handleDelete = (provider: Provider) => {
    modal.confirm({
      title: 'Delete Provider',
      content: `Are you sure you want to delete "${provider.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await onDelete(provider.id);
          message.success('Provider deleted successfully');
        } catch {
          message.error('Failed to delete provider');
        }
      },
    });
  };

  const handleTest = async (provider: Provider) => {
    setTestingProvider(provider.id);
    try {
      const result = await onTest(provider.id);
      if (result.available) {
        message.success(`${provider.name} is online! Found ${result.models_count || 0} models.`);
      } else {
        message.error(`${provider.name} connection failed: ${result.error || 'Unknown error'}`);
      }
    } catch {
      message.error(`Failed to test ${provider.name}`);
    } finally {
      setTestingProvider(null);
    }
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      const providerData = {
        name: values.name as string,
        type: values.type as 'ollama' | 'openai' | 'huggingface' | 'agent',
        enabled: (values.enabled ?? true) as boolean,
        config: {
          base_url: values.base_url as string | undefined,
          api_key: values.api_key as string | undefined,
        },
      };

      if (editingProvider) {
        await onUpdate(editingProvider.id, providerData);
        message.success('Provider updated successfully');
      } else {
        await onAdd(providerData);
        message.success('Provider added successfully');
      }

      setModalVisible(false);
      form.resetFields();
    } catch {
      message.error(`Failed to ${editingProvider ? 'update' : 'add'} provider`);
    }
  };

  const groupedProviders = PROVIDER_TYPES.map((type) => ({
    ...type,
    providers: providers.filter((p) => p.type === type.value),
  }));

  const getProviderColor = (type: string) => {
    return PROVIDER_TYPES.find((t) => t.value === type)?.color || '#1890ff';
  };

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Provider Management
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Add, configure, and manage multiple LLM providers
          </Paragraph>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} size="large">
          Add Provider
        </Button>
      </div>

      <Spin spinning={loading}>
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          {groupedProviders.map((group) => (
            <Card
              key={group.value}
              title={
                <Space>
                  <span style={{ color: group.color }}>{group.icon}</span>
                  <span>{group.label}</span>
                  <Tag color={group.color}>{group.providers.length}</Tag>
                </Space>
              }
              extra={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {group.description}
                </Text>
              }
            >
              {group.providers.length === 0 ? (
                <Empty
                  description={`No ${group.label} providers configured`}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
                  {group.providers.map((provider) => (
                    <Card
                      key={provider.id}
                      size="small"
                      style={{
                        background: '#fafafa',
                        borderLeft: `3px solid ${getProviderColor(provider.type)}`,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Space size="large">
                          <div>
                            <Space size="small">
                              <Text strong style={{ fontSize: 15 }}>
                                {provider.name}
                              </Text>
                              {provider.status?.available === true && (
                                <Tooltip title="Online">
                                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                </Tooltip>
                              )}
                              {provider.status?.available === false && (
                                <Tooltip title={provider.status.error || 'Offline'}>
                                  <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                                </Tooltip>
                              )}
                              {!provider.enabled && <Tag>Disabled</Tag>}
                            </Space>
                            <div>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {provider.config.base_url || 'No URL configured'}
                              </Text>
                              {provider.status?.models_count !== undefined && (
                                <Text type="secondary" style={{ fontSize: 12, marginLeft: 16 }}>
                                  {provider.status.models_count} models
                                </Text>
                              )}
                            </div>
                          </div>
                        </Space>

                        <Space>
                          <Tooltip title="Test Connection">
                            <Button
                              type="text"
                              size="small"
                              icon={<ThunderboltOutlined />}
                              onClick={() => handleTest(provider)}
                              loading={testingProvider === provider.id}
                            />
                          </Tooltip>
                          <Tooltip title="Edit">
                            <Button
                              type="text"
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => handleEdit(provider)}
                            />
                          </Tooltip>
                          <Tooltip title="Delete">
                            <Button
                              type="text"
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => handleDelete(provider)}
                            />
                          </Tooltip>
                        </Space>
                      </div>
                    </Card>
                  ))}
                </Space>
              )}
            </Card>
          ))}
        </Space>
      </Spin>

      <Modal
        title={editingProvider ? 'Edit Provider' : 'Add New Provider'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
        okText={editingProvider ? 'Update' : 'Add'}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ enabled: true }}
        >
          <Form.Item
            name="type"
            label="Provider Type"
            rules={[{ required: true, message: 'Please select a provider type' }]}
          >
            <Select
              placeholder="Select provider type"
              disabled={!!editingProvider}
              options={PROVIDER_TYPES.map((type) => ({
                value: type.value,
                label: (
                  <Space>
                    <span style={{ color: type.color }}>{type.icon}</span>
                    {type.label}
                  </Space>
                ),
              }))}
            />
          </Form.Item>

          <Form.Item
            name="name"
            label="Provider Name"
            rules={[{ required: true, message: 'Please enter a provider name' }]}
          >
            <Input placeholder="e.g., My Ollama Server" />
          </Form.Item>

          <Form.Item
            name="base_url"
            label="Base URL"
            rules={[{ required: true, message: 'Please enter the base URL' }]}
          >
            <Input placeholder="e.g., http://localhost:11434" />
          </Form.Item>

          <Form.Item name="api_key" label="API Key (if required)">
            <Input.Password placeholder="Enter API key (optional)" />
          </Form.Item>

          <Form.Item name="enabled" valuePropName="checked" label="Status">
            <Select>
              <Select.Option value={true}>Enabled</Select.Option>
              <Select.Option value={false}>Disabled</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
