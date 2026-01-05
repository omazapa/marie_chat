"use client";

import { useState, useEffect } from "react";
import { Form, Select, Slider, Card, Button, Input, Radio, App } from "antd";
import { RobotOutlined } from "@ant-design/icons";
import api from "@/lib/api";

const { TextArea } = Input;

export default function AgentPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const { data } = await api.get("/settings");
      setProviders(data.providers || []);
    } catch (error) {
      console.error("Failed to load providers", error);
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
      console.error("Failed to load models", error);
    }
  };

  const loadPreferences = async () => {
    try {
      const { data } = await api.get("/user/preferences");
      const agentPrefs = data.agent_preferences || {};
      form.setFieldsValue({
        default_provider_id: agentPrefs.default_provider_id,
        default_model: agentPrefs.default_model,
        system_prompt: agentPrefs.system_prompt,
        response_mode: agentPrefs.response_mode || "detailed",
        temperature: agentPrefs.parameters?.temperature ?? 0.7,
        max_tokens: agentPrefs.parameters?.max_tokens ?? 2048,
        top_p: agentPrefs.parameters?.top_p ?? 1.0,
        frequency_penalty: agentPrefs.parameters?.frequency_penalty ?? 0.0,
        presence_penalty: agentPrefs.parameters?.presence_penalty ?? 0.0,
      });
      if (agentPrefs.default_provider_id) {
        setSelectedProvider(agentPrefs.default_provider_id);
        loadModels(agentPrefs.default_provider_id);
      }
    } catch (error: any) {
      message.error("Failed to load preferences");
    }
  };

  const handleProviderChange = (providerId: string) => {
    setSelectedProvider(providerId);
    form.setFieldValue("default_model", null);
    loadModels(providerId);
  };

  const handleSave = async (values: any) => {
    setLoading(true);
    try {
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
      await api.put("/user/preferences/agent", payload);
      message.success("Agent preferences saved successfully");
    } catch (error: any) {
      message.error(error.response?.data?.error || "Failed to save preferences");
    } finally {
      setLoading(false);
    }
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

        <Card title="Model Parameters" style={{ marginBottom: 24 }}>
          <Form.Item label="Temperature" name="temperature">
            <Slider min={0} max={2} step={0.1} marks={{ 0: "0", 1: "1", 2: "2" }} />
          </Form.Item>

          <Form.Item label="Max Tokens" name="max_tokens">
            <Slider min={1} max={8192} step={1} marks={{ 1: "1", 2048: "2048", 8192: "8192" }} />
          </Form.Item>

          <Form.Item label="Top P" name="top_p">
            <Slider min={0} max={1} step={0.05} marks={{ 0: "0", 0.5: "0.5", 1: "1" }} />
          </Form.Item>

          <Form.Item label="Frequency Penalty" name="frequency_penalty">
            <Slider min={0} max={2} step={0.1} marks={{ 0: "0", 1: "1", 2: "2" }} />
          </Form.Item>

          <Form.Item label="Presence Penalty" name="presence_penalty">
            <Slider min={0} max={2} step={0.1} marks={{ 0: "0", 1: "1", 2: "2" }} />
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
