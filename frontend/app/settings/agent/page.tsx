'use client';

import { useState, useEffect, useCallback } from 'react';
import { Form, Select, Slider, Card, Button, Input, Radio, App, Collapse } from 'antd';
import api from '@/lib/api';
import { useModels } from '@/hooks/useModels';
import { useAuthStore } from '@/stores/authStore';

const { TextArea } = Input;

interface Provider {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
}

interface Model {
  id: string;
  name: string;
}

interface SchemaProperty {
  type: string;
  title?: string;
  description?: string;
  default?: unknown;
  minimum?: number;
  maximum?: number;
  enum?: string[];
}

interface ModelSchema {
  properties: Record<string, SchemaProperty>;
  type: string;
}

export default function AgentPage() {
  const { message } = App.useApp();
  const { accessToken } = useAuthStore();
  const { models: allModels, fetchModels } = useModels(accessToken || '');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProviderType, setSelectedProviderType] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [modelSchema, setModelSchema] = useState<ModelSchema | null>(null);
  const [providersLoaded, setProvidersLoaded] = useState(false);

  const loadProviders = useCallback(async () => {
    try {
      const { data } = await api.get('/settings');
      setProviders(data.providers || []);
      setProvidersLoaded(true);
    } catch {
      message.error('Failed to load providers');
    }
  }, [message]);

  const loadModelSchema = useCallback(
    async (providerId: string, modelId: string) => {
      // Only load schema for agent providers
      const provider = providers.find((p) => p.id === providerId);
      if (!provider || provider.type !== 'agent') {
        setModelSchema(null);
        return;
      }

      try {
        const { data } = await api.get(`/models/${providerId}/${modelId}/config/schema`);
        // Use raw_schema if available, otherwise null
        const schema = data.raw_schema || null;
        setModelSchema(schema);

        // Load saved values for this model
        try {
          const { data: valuesData } = await api.get(
            `/models/${providerId}/${modelId}/config/values`
          );

          if (valuesData && Object.keys(valuesData).length > 0) {
            // Use saved values
            // Set all fields at once to avoid multiple re-renders
            form.setFieldsValue(valuesData);
          } else if (schema?.properties) {
            // No saved values, use defaults from schema
            const defaults: Record<string, unknown> = {};
            Object.keys(schema.properties).forEach((key) => {
              const defaultValue = schema.properties[key].default;
              if (defaultValue !== undefined) {
                defaults[key] = defaultValue;
              }
            });
            // Set all fields at once
            form.setFieldsValue(defaults);
          }
        } catch {
          // If loading values fails, use schema defaults
          if (schema?.properties) {
            const defaults: Record<string, unknown> = {};
            Object.keys(schema.properties).forEach((key) => {
              const defaultValue = schema.properties[key].default;
              if (defaultValue !== undefined) {
                defaults[key] = defaultValue;
              }
            });
            // Set all fields at once
            form.setFieldsValue(defaults);
          }
        }
      } catch {
        message.error('Failed to load model schema');
        setModelSchema(null);
      }
    },
    [form, message, providers]
  );

  const loadPreferences = useCallback(async () => {
    try {
      const { data } = await api.get('/user/preferences');
      const agentPrefs = data.agent_preferences || {};

      // Infer provider_type from provider_id if not provided
      let providerType = agentPrefs.provider_type;
      if (agentPrefs.default_provider_id && !providerType) {
        const provider = providers.find((p) => p.id === agentPrefs.default_provider_id);
        if (provider) {
          providerType = provider.type;
        }
      }

      form.setFieldsValue({
        provider_type: providerType,
        default_provider_id: agentPrefs.default_provider_id,
        default_model: agentPrefs.default_model,
        system_prompt: agentPrefs.system_prompt,
        response_mode: agentPrefs.response_mode || 'detailed',
        temperature: agentPrefs.parameters?.temperature ?? 0.7,
        max_tokens: agentPrefs.parameters?.max_tokens ?? 2048,
        top_p: agentPrefs.parameters?.top_p ?? 1.0,
        frequency_penalty: agentPrefs.parameters?.frequency_penalty ?? 0.0,
        presence_penalty: agentPrefs.parameters?.presence_penalty ?? 0.0,
      });

      if (providerType) {
        setSelectedProviderType(providerType);
      }
      if (agentPrefs.default_provider_id) {
        setSelectedProvider(agentPrefs.default_provider_id);
        if (agentPrefs.default_model) {
          setSelectedModel(agentPrefs.default_model);
          loadModelSchema(agentPrefs.default_provider_id, agentPrefs.default_model);
        }
      }
    } catch {
      message.error('Failed to load preferences');
    }
  }, [form, loadModelSchema, providers, message]);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  useEffect(() => {
    // Refresh models when page loads
    if (accessToken) {
      fetchModels(true);
    }
  }, [accessToken, fetchModels]);

  useEffect(() => {
    if (providersLoaded) {
      loadPreferences();
    }
  }, [providersLoaded, loadPreferences]);

  const handleProviderTypeChange = (providerType: string) => {
    setSelectedProviderType(providerType);
    setSelectedProvider(null);
    setSelectedModel(null);
    setModelSchema(null);
    form.setFieldValue('default_provider_id', null);
    form.setFieldValue('default_model', null);
  };

  const handleProviderChange = (providerId: string) => {
    setSelectedProvider(providerId);
    setSelectedModel(null);
    setModelSchema(null);
    form.setFieldValue('default_model', null);
  };

  const handleModelChange = async (modelId: string) => {
    setSelectedModel(modelId);
    if (selectedProvider) {
      await loadModelSchema(selectedProvider, modelId);
    }
  };

  const handleSave = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      // Save agent preferences
      const payload = {
        provider_type: values.provider_type,
        default_provider_id: values.default_provider_id,
        default_model: values.default_model,
        system_prompt: values.system_prompt,
        response_mode: values.response_mode,
        parameters: {
          temperature: values.temperature,
          max_tokens: values.max_tokens,
          top_p: values.top_p,
          frequency_penalty: values.frequency_penalty,
          presence_penalty: values.presence_penalty,
        },
      };
      await api.put('/user/preferences/agent', payload);

      // Save dynamic model parameters if we have a schema
      if (selectedProvider && selectedModel && modelSchema) {
        const dynamicParamsPayload: Record<string, unknown> = {};
        Object.keys(modelSchema.properties || {}).forEach((key) => {
          if (values[key] !== undefined) {
            dynamicParamsPayload[key] = values[key];
          }
        });

        if (Object.keys(dynamicParamsPayload).length > 0) {
          await api.post(`/models/${selectedProvider}/${selectedModel}/config/values`, {
            config_values: dynamicParamsPayload,
          });
        }
      }

      message.success('Agent preferences saved successfully');
    } catch (error) {
      const errorMessage =
        error instanceof Error && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      message.error(errorMessage || 'Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const renderDynamicField = (key: string, property: SchemaProperty) => {
    const { type, description, minimum, maximum, enum: enumValues } = property;

    if (type === 'boolean') {
      return (
        <Form.Item
          key={key}
          label={
            property.title ||
            key
              .split('_')
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ')
          }
          name={key}
          help={description}
        >
          <Radio.Group>
            <Radio.Button value={true}>Enabled</Radio.Button>
            <Radio.Button value={false}>Disabled</Radio.Button>
          </Radio.Group>
        </Form.Item>
      );
    }

    if (enumValues && Array.isArray(enumValues)) {
      return (
        <Form.Item
          key={key}
          label={
            property.title ||
            key
              .split('_')
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ')
          }
          name={key}
          help={description}
        >
          <Select options={enumValues.map((v: string) => ({ label: v, value: v }))} />
        </Form.Item>
      );
    }

    if (type === 'number' || type === 'integer') {
      const min = minimum ?? 0;
      const max = maximum ?? 100;
      const step = type === 'integer' ? 1 : 0.1;

      return (
        <Form.Item
          key={key}
          label={
            property.title ||
            key
              .split('_')
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ')
          }
          name={key}
          help={description}
        >
          <Slider
            min={min}
            max={max}
            step={step}
            marks={{
              [min]: String(min),
              [Math.floor((min + max) / 2)]: String(Math.floor((min + max) / 2)),
              [max]: String(max),
            }}
          />
        </Form.Item>
      );
    }

    if (type === 'string') {
      return (
        <Form.Item
          key={key}
          label={
            property.title ||
            key
              .split('_')
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ')
          }
          name={key}
          help={description}
        >
          <Input placeholder={description} />
        </Form.Item>
      );
    }

    return null;
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <h1 style={{ marginBottom: 24, fontSize: 24, fontWeight: 600 }}>Agent Preferences</h1>

      <Form form={form} layout="vertical" onFinish={handleSave} autoComplete="off">
        <Card title="Model Selection" style={{ marginBottom: 24 }}>
          <Form.Item label="Provider Type" name="provider_type">
            <Select
              placeholder="Select provider type"
              size="large"
              onChange={handleProviderTypeChange}
              options={['ollama', 'openai', 'huggingface', 'agent']
                .filter((type) => providers.some((p) => p.type === type && p.enabled))
                .map((type) => ({
                  label:
                    type === 'ollama'
                      ? 'Ollama (Local)'
                      : type === 'openai'
                        ? 'OpenAI / Compatible'
                        : type === 'huggingface'
                          ? 'HuggingFace'
                          : 'External Agent',
                  value: type,
                }))}
            />
          </Form.Item>

          <Form.Item label="Account/Instance" name="default_provider_id">
            <Select
              placeholder="Select instance"
              size="large"
              disabled={!selectedProviderType}
              onChange={handleProviderChange}
              options={providers
                .filter((p) => p.enabled && p.type === selectedProviderType)
                .map((p) => ({ label: p.name, value: p.id }))}
            />
          </Form.Item>

          <Form.Item label="Model" name="default_model">
            <Select
              placeholder="Select a model"
              size="large"
              disabled={!selectedProvider}
              onChange={handleModelChange}
              options={
                selectedProvider && allModels[selectedProvider]
                  ? allModels[selectedProvider].map((m) => ({ label: m.name || m.id, value: m.id }))
                  : []
              }
            />
          </Form.Item>

          <Form.Item label="Response Mode" name="response_mode">
            <Radio.Group size="large">
              <Radio.Button value="concise">Concise</Radio.Button>
              <Radio.Button value="detailed">Detailed</Radio.Button>
              <Radio.Button value="academic">Academic</Radio.Button>
              <Radio.Button value="casual">Casual</Radio.Button>
            </Radio.Group>
          </Form.Item>
        </Card>

        {modelSchema &&
          modelSchema.properties &&
          Object.keys(modelSchema.properties).length > 0 && (
            <Collapse
              style={{ marginBottom: 24 }}
              items={[
                {
                  key: 'dynamic_params',
                  label: `${selectedModel} - Dynamic Parameters`,
                  extra: (
                    <span style={{ fontSize: 12, color: '#999' }}>Model-specific settings</span>
                  ),
                  children: (
                    <div>
                      {Object.keys(modelSchema.properties).map((key) =>
                        renderDynamicField(key, modelSchema.properties[key])
                      )}
                    </div>
                  ),
                },
              ]}
            />
          )}

        <Collapse
          style={{ marginBottom: 24 }}
          items={[
            {
              key: 'system_prompt',
              label: 'System Prompt (Advanced)',
              children: (
                <Form.Item
                  name="system_prompt"
                  help="Override the default system prompt for the AI agent"
                >
                  <TextArea
                    rows={6}
                    placeholder="You are a helpful assistant..."
                    maxLength={5000}
                    showCount
                  />
                </Form.Item>
              ),
            },
          ]}
        />

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} size="large">
            Save Preferences
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
