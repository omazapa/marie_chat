'use client';

import React, { useEffect, useMemo } from 'react';
import {
  Layout,
  Form,
  Input,
  Switch,
  InputNumber,
  Button,
  Typography,
  Divider,
  Space,
  Spin,
  Alert,
} from 'antd';
import { SettingOutlined, SaveOutlined, ReloadOutlined, CloseOutlined } from '@ant-design/icons';
import { useAgentConfig, type ConfigField } from '@/stores/agentConfigStore';

const { Sider } = Layout;
const { Text } = Typography;

interface AgentConfigPanelProps {
  provider: string;
  modelId: string;
  modelName?: string;
  conversationId?: string;
  visible: boolean;
  onClose: () => void;
}

export const AgentConfigPanel: React.FC<AgentConfigPanelProps> = ({
  provider,
  modelId,
  modelName,
  conversationId,
  visible,
  onClose,
}) => {
  const [form] = Form.useForm();

  const { schemas, configs, loading, error, fetchSchema, loadConfig, saveConfig, clearError } =
    useAgentConfig();

  const schemaKey = `${provider}:${modelId}`;
  const schema = schemas[schemaKey];
  const fields = useMemo(() => schema?.fields || [], [schema]);

  // Load schema and config
  useEffect(() => {
    if (visible && provider && modelId) {
      fetchSchema(provider, modelId);
      loadConfig(provider, modelId, conversationId);
    }
  }, [visible, provider, modelId, conversationId, fetchSchema, loadConfig]);

  // Set form values when fields are available
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
        const defaults: Record<string, unknown> = {};
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
  }, [visible, fields, provider, modelId, conversationId, configs, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await saveConfig(provider, modelId, values, 'conversation', conversationId);
    } catch {
      // Validation errors are shown by form
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
  };

  const renderField = (field: ConfigField) => {
    const commonProps = {
      placeholder: field.description || `Enter ${field.label}`,
      disabled: loading,
    };

    switch (field.type) {
      case 'boolean':
        return <Switch {...commonProps} />;

      case 'integer':
      case 'number':
        return (
          <InputNumber
            {...commonProps}
            style={{ width: '100%' }}
            min={field.min}
            max={field.max}
            step={field.type === 'integer' ? 1 : 0.1}
          />
        );

      default:
        return <Input {...commonProps} />;
    }
  };

  if (!visible) return null;

  return (
    <Sider
      width={350}
      theme="light"
      style={{
        borderLeft: '1px solid #f0f0f0',
        height: '100vh',
        overflow: 'auto',
        position: 'relative',
      }}
    >
      <div style={{ padding: '16px' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <Space>
            <SettingOutlined style={{ fontSize: 18, color: '#1890ff' }} />
            <Text strong style={{ fontSize: 16 }}>
              Agent Configuration
            </Text>
          </Space>
          <Button type="text" size="small" icon={<CloseOutlined />} onClick={onClose} />
        </div>

        {modelName && (
          <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 12 }}>
            {modelName}
          </Text>
        )}

        <Divider style={{ margin: '12px 0' }} />

        {loading && !schema && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">Loading configuration...</Text>
            </div>
          </div>
        )}

        {error && (
          <Alert
            title="Error"
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
            title="No Configuration Available"
            description="This agent does not expose configurable parameters."
            type="info"
            showIcon
          />
        )}

        {/* Form */}
        <Form form={form} layout="vertical" size="small">
          {fields.length > 0 && (
            <>
              {fields.map((field) => (
                <Form.Item
                  key={field.key}
                  name={field.key}
                  label={
                    <Text strong style={{ fontSize: 12 }}>
                      {field.label}
                    </Text>
                  }
                  rules={[
                    {
                      required: field.required,
                      message: `${field.label} is required`,
                    },
                  ]}
                  tooltip={field.description}
                  valuePropName={field.type === 'boolean' ? 'checked' : 'value'}
                  style={{ marginBottom: 12 }}
                >
                  {renderField(field)}
                </Form.Item>
              ))}

              <Divider style={{ margin: '12px 0' }} />

              {/* Actions */}
              <Space orientation="vertical" style={{ width: '100%' }} size="small">
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  loading={loading}
                  block
                  size="small"
                >
                  Save Changes
                </Button>
                <Button icon={<ReloadOutlined />} onClick={handleReset} block size="small">
                  Reset to Defaults
                </Button>
              </Space>
            </>
          )}
        </Form>
      </div>
    </Sider>
  );
};
