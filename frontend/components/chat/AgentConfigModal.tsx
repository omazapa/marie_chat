/**
 * Agent Configuration Modal
 * Dynamic form for configuring agent runtime parameters
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Button,
  Space,
  Alert,
  Spin,
  Divider,
  Radio,
  Typography,
  Tooltip,
  Tag,
} from 'antd';
import {
  InfoCircleOutlined,
  SaveOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useAgentConfig, ConfigField } from '@/stores/agentConfigStore';
import { message } from 'antd';

const { Text, Title } = Typography;
const { Option } = Select;

interface AgentConfigModalProps {
  visible: boolean;
  onClose: () => void;
  provider: string;
  modelId: string;
  modelName?: string;
  conversationId?: string;
}

export default function AgentConfigModal({
  visible,
  onClose,
  provider,
  modelId,
  modelName,
  conversationId,
}: AgentConfigModalProps) {
  const [form] = Form.useForm();
  const [scope, setScope] = useState<'global' | 'conversation'>(
    conversationId ? 'conversation' : 'global'
  );
  const [hasChanges, setHasChanges] = useState(false);

  const {
    schemas,
    configs,
    loading,
    error,
    fetchSchema,
    loadConfig,
    saveConfig,
    deleteConfig,
    clearError,
  } = useAgentConfig();

  const schemaKey = `${provider}:${modelId}`;
  const schema = schemas[schemaKey];
  const fields = schema?.fields || [];

  // Load schema and config when modal opens
  useEffect(() => {
    if (visible) {
      fetchSchema(provider, modelId);
      loadConfig(provider, modelId, conversationId);
    } else {
      // Reset on close
      form.resetFields();
      setHasChanges(false);
      clearError();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, provider, modelId, conversationId]);

  // Set form values only when fields are available (Form is rendered)
  useEffect(() => {
    if (visible && fields.length > 0) {
      const configKey = conversationId
        ? `${provider}:${modelId}:${conversationId}`
        : `${provider}:${modelId}`;
      const currentConfig = configs[configKey];

      if (currentConfig && Object.keys(currentConfig).length > 0) {
        form.setFieldsValue(currentConfig);
      } else {
        // Set default values from schema
        const defaults: Record<string, any> = {};
        fields.forEach((field) => {
          if (field.default !== undefined && field.default !== null) {
            defaults[field.key] = field.default;
          }
        });
        if (Object.keys(defaults).length > 0) {
          form.setFieldsValue(defaults);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, fields.length]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      await saveConfig(provider, modelId, values, scope, conversationId);

      message.success('Configuration saved successfully');
      setHasChanges(false);
      onClose();
    } catch (error: any) {
      if (error.errorFields) {
        message.error('Please check the form for errors');
      } else {
        message.error(error.message || 'Failed to save configuration');
      }
    }
  };

  const handleDelete = async () => {
    try {
      await deleteConfig(provider, modelId, scope, conversationId);
      message.success('Configuration deleted successfully');
      form.resetFields();
      setHasChanges(false);
      onClose();
    } catch (error: any) {
      message.error(error.message || 'Failed to delete configuration');
    }
  };

  const handleReset = () => {
    const defaults: Record<string, unknown> = {};
    fields.forEach((field) => {
      if (field.default !== undefined && field.default !== null) {
        defaults[field.key] = field.default;
      }
    });
    form.setFieldsValue(defaults);
    setHasChanges(true);
  };

  const renderField = (field: ConfigField) => {
    const commonProps = {
      placeholder: field.description || `Enter ${field.label}`,
    };

    switch (field.type) {
      case 'boolean':
        return <Switch />;

      case 'enum':
        return (
          <Select {...commonProps} allowClear>
            {field.enumValues?.map((value) => (
              <Option key={value} value={value}>
                {value}
              </Option>
            ))}
          </Select>
        );

      case 'number':
      case 'integer':
        return (
          <InputNumber
            {...commonProps}
            min={field.min}
            max={field.max}
            step={field.type === 'integer' ? 1 : 0.1}
            style={{ width: '100%' }}
          />
        );

      case 'array':
        return (
          <Select mode="multiple" {...commonProps} allowClear>
            {field.enumValues?.map((value) => (
              <Option key={value} value={value}>
                {value}
              </Option>
            ))}
          </Select>
        );

      default:
        return <Input {...commonProps} />;
    }
  };

  const modalTitle = (
    <Space direction="vertical" size={0}>
      <Title level={4} style={{ margin: 0 }}>
        Configure Agent Parameters
      </Title>
      <Text type="secondary">{modelName || modelId}</Text>
    </Space>
  );

  return (
    <Modal
      title={modalTitle}
      open={visible}
      onCancel={onClose}
      width={700}
      destroyOnHidden
      footer={[
        <Button key="delete" danger icon={<DeleteOutlined />} onClick={handleDelete}>
          Delete Config
        </Button>,
        <Button key="reset" icon={<ReloadOutlined />} onClick={handleReset}>
          Reset to Defaults
        </Button>,
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="save"
          type="primary"
          icon={<SaveOutlined />}
          loading={loading}
          onClick={handleSave}
        >
          Save Configuration
        </Button>,
      ]}
    >
      {loading && !schema && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">Loading configuration schema...</Text>
          </div>
        </div>
      )}

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          closable
          onClose={clearError}
          style={{ marginBottom: 16 }}
        />
      )}

      {!loading && fields.length === 0 && (
        <Alert
          message="No Configuration Available"
          description="This agent does not expose any configurable parameters."
          type="info"
          showIcon
        />
      )}

      {/* Always render Form to keep form instance connected */}
      <Form form={form} layout="vertical" onValuesChange={() => setHasChanges(true)}>
        {fields.length > 0 && (
          <>
            {/* Scope Selection */}
            <div style={{ marginBottom: 24 }}>
              <Text strong>Configuration Scope:</Text>
              <Radio.Group
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                style={{ marginLeft: 16 }}
              >
                <Radio value="global">
                  All Conversations
                  <Tooltip title="Apply this configuration to all conversations using this agent">
                    <InfoCircleOutlined style={{ marginLeft: 4, color: '#8c8c8c' }} />
                  </Tooltip>
                </Radio>
                <Radio value="conversation" disabled={!conversationId}>
                  This Conversation Only
                  {!conversationId && (
                    <Tooltip title="Start a conversation to enable conversation-specific configuration">
                      <InfoCircleOutlined style={{ marginLeft: 4, color: '#8c8c8c' }} />
                    </Tooltip>
                  )}
                </Radio>
              </Radio.Group>
            </div>

            <Divider />

            {/* Dynamic Form Fields */}
            {fields.map((field) => (
              <Form.Item
                key={field.key}
                name={field.key}
                label={
                  <Space>
                    {field.label}
                    {field.required && <Tag color="red">Required</Tag>}
                    {field.description && (
                      <Tooltip title={field.description}>
                        <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                      </Tooltip>
                    )}
                  </Space>
                }
                rules={[
                  {
                    required: field.required,
                    message: `${field.label} is required`,
                  },
                ]}
                tooltip={field.description}
                valuePropName={field.type === 'boolean' ? 'checked' : 'value'}
              >
                {renderField(field)}
              </Form.Item>
            ))}

            {hasChanges && (
              <Alert
                message="Unsaved Changes"
                description="You have unsaved changes. Click 'Save Configuration' to apply them."
                type="warning"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}
          </>
        )}
      </Form>
    </Modal>
  );
}
