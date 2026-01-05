'use client';

import { useState, useEffect } from 'react';
import { Form, Select, Slider, Card, Button, Input, Radio, App } from 'antd';
import api from '@/lib/api';

const { TextArea } = Input;

export default function AgentPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [modelSchema, setModelSchema] = useState<any>(null);
  const [dynamicParams, setDynamicParams] = useState<any>({});
  const [providersLoaded, setProvidersLoaded] = useState(false);

  useEffect(() => {
    loadProviders();
  }, []);

  useEffect(() => {
    if (providersLoaded) {
      loadPreferences();
    }
  }, [providersLoaded]);

  const loadProviders = async () => {
    try {
      const { data } = await api.get('/settings');
      setProviders(data.providers || []);
      setProvidersLoaded(true);
    } catch (error) {
      console.error('Failed to load providers', error);
    }
  };

  const loadModels = async (providerId: string) => {
    try {
      const provider = providers.find((p) => p.id === providerId);
      if (provider) {
        const { data } = await api.get(`/models/${provider.type}?provider_id=${providerId}`);
        setModels(data.models || []);
      }
    } catch (error) {
      console.error('Failed to load models', error);
    }
  };

  const loadPreferences = async () => {
    try {
      const { data } = await api.get('/user/preferences');
      const agentPrefs = data.agent_preferences || {};
      form.setFieldsValue({
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
      if (agentPrefs.default_provider_id) {
        setSelectedProvider(agentPrefs.default_provider_id);
        loadModels(agentPrefs.default_provider_id);
        if (agentPrefs.default_model) {
          setSelectedModel(agentPrefs.default_model);
          const provider = providers.find((p) => p.id === agentPrefs.default_provider_id);
          if (provider) {
            loadModelSchema(provider.type, agentPrefs.default_model);
          }
        }
      }
    } catch (error: any) {
      message.error('Failed to load preferences');
    }
  };

  const handleProviderChange = (providerId: string) => {
    setSelectedProvider(providerId);
    setSelectedModel(null);
    setModelSchema(null);
    form.setFieldValue('default_model', null);
    loadModels(providerId);
  };

  const handleModelChange = async (modelId: string) => {
    setSelectedModel(modelId);
    if (selectedProvider) {
      const provider = providers.find((p) => p.id === selectedProvider);
      if (provider) {
        await loadModelSchema(provider.type, modelId);
      }
    }
  };

  const loadModelSchema = async (providerType: string, modelId: string) => {
    // Only load schema for agent providers
    if (providerType !== 'agent') {
      setModelSchema(null);
      setDynamicParams({});
      return;
    }

    try {
      const { data } = await api.get(`/models/${providerType}/${modelId}/config/schema`);
      setModelSchema(data.schema || null);

      // Load saved values for this model
      const { data: valuesData } = await api.get(
        `/models/${providerType}/${modelId}/config/values`
      );
      if (valuesData.parameters) {
        setDynamicParams(valuesData.parameters);
        // Update form with dynamic parameters
        Object.keys(valuesData.parameters).forEach((key) => {
          form.setFieldValue(key, valuesData.parameters[key]);
        });
      }
    } catch (error) {
      console.error('Failed to load model schema', error);
      setModelSchema(null);
    }
  };

  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      // Save agent preferences
      const payload = {
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
        const provider = providers.find((p) => p.id === selectedProvider);
        if (provider) {
          const dynamicParamsPayload: any = {};
          Object.keys(modelSchema.properties || {}).forEach((key) => {
            if (values[key] !== undefined) {
              dynamicParamsPayload[key] = values[key];
            }
          });

          if (Object.keys(dynamicParamsPayload).length > 0) {
            await api.post(`/models/${provider.type}/${selectedModel}/config/values`, {
              parameters: dynamicParamsPayload,
            });
          }
        }
      }

      message.success('Agent preferences saved successfully');
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const renderDynamicField = (key: string, property: any) => {
    const {
      type,
      description,
      default: defaultValue,
      minimum,
      maximum,
      enum: enumValues,
    } = property;

    if (type === 'boolean') {
      return (
        <Form.Item
          key={key}
          label={key
            .split('_')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ')}
          name={key}
          help={description}
          valuePropName="checked"
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
          label={key
            .split('_')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ')}
          name={key}
          help={description}
        >
          <Select options={enumValues.map((v: any) => ({ label: v, value: v }))} />
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
          label={key
            .split('_')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ')}
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
          label={key
            .split('_')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ')}
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
          <Form.Item label="Default Provider" name="default_provider_id">
            <Select
              placeholder="Select a provider"
              size="large"
              onChange={handleProviderChange}
              options={providers.map((p) => ({ label: p.name, value: p.id }))}
            />
          </Form.Item>

          <Form.Item label="Default Model" name="default_model">
            <Select
              placeholder="Select a model"
              size="large"
              disabled={!selectedProvider}
              onChange={handleModelChange}
              options={models.map((m) => ({ label: m.id, value: m.id }))}
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

        <Card title="System Prompt" style={{ marginBottom: 24 }}>
          <Form.Item
            label="Custom System Prompt"
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
        </Card>

        {modelSchema &&
          modelSchema.properties &&
          Object.keys(modelSchema.properties).length > 0 && (
            <Card
              title={`${selectedModel} - Dynamic Parameters`}
              style={{ marginBottom: 24 }}
              extra={<span style={{ fontSize: 12, color: '#999' }}>Model-specific settings</span>}
            >
              {Object.keys(modelSchema.properties).map((key) =>
                renderDynamicField(key, modelSchema.properties[key])
              )}
            </Card>
          )}

        <Card title="Model Parameters" style={{ marginBottom: 24 }}>
          <Form.Item label="Temperature" name="temperature">
            <Slider min={0} max={2} step={0.1} marks={{ 0: '0', 1: '1', 2: '2' }} />
          </Form.Item>

          <Form.Item label="Max Tokens" name="max_tokens">
            <Slider min={1} max={8192} step={1} marks={{ 1: '1', 2048: '2048', 8192: '8192' }} />
          </Form.Item>

          <Form.Item label="Top P" name="top_p">
            <Slider min={0} max={1} step={0.05} marks={{ 0: '0', 0.5: '0.5', 1: '1' }} />
          </Form.Item>

          <Form.Item label="Frequency Penalty" name="frequency_penalty">
            <Slider min={0} max={2} step={0.1} marks={{ 0: '0', 1: '1', 2: '2' }} />
          </Form.Item>

          <Form.Item label="Presence Penalty" name="presence_penalty">
            <Slider min={0} max={2} step={0.1} marks={{ 0: '0', 1: '1', 2: '2' }} />
          </Form.Item>
        </Card>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} size="large">
            Save Preferences
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
