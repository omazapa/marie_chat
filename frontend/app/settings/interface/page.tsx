"use client";

import { useState, useEffect } from "react";
import { Form, Select, Switch, Card, Button, message, Radio } from "antd";
import api from "@/lib/api";

export default function InterfacePage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data } = await api.get("/user/preferences");
      const interfacePrefs = data.interface_preferences || {};
      form.setFieldsValue({
        theme: interfacePrefs.theme || "dark",
        language: interfacePrefs.language || "en",
        tts_voice: interfacePrefs.tts_voice || "en-US-EmmaNeural",
        stt_language: interfacePrefs.stt_language || "en-US",
        message_density: interfacePrefs.message_density || "comfortable",
        show_timestamps: interfacePrefs.show_timestamps ?? true,
        enable_markdown: interfacePrefs.enable_markdown ?? true,
        enable_code_highlighting: interfacePrefs.enable_code_highlighting ?? true,
      });
    } catch (error: any) {
      message.error("Failed to load preferences");
    }
  };

  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      await api.put("/user/preferences/interface", values);
      message.success("Interface preferences saved successfully");
    } catch (error: any) {
      message.error(error.response?.data?.error || "Failed to save preferences");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <h1 style={{ marginBottom: 24, fontSize: 24, fontWeight: 600 }}>Interface Preferences</h1>

      <Form form={form} layout="vertical" onFinish={handleSave} autoComplete="off">
        <Card title="Appearance" style={{ marginBottom: 24 }}>
          <Form.Item label="Theme" name="theme">
            <Radio.Group size="large">
              <Radio.Button value="light">Light</Radio.Button>
              <Radio.Button value="dark">Dark</Radio.Button>
              <Radio.Button value="auto">Auto</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item label="Message Density" name="message_density">
            <Radio.Group size="large">
              <Radio.Button value="compact">Compact</Radio.Button>
              <Radio.Button value="comfortable">Comfortable</Radio.Button>
              <Radio.Button value="spacious">Spacious</Radio.Button>
            </Radio.Group>
          </Form.Item>
        </Card>

        <Card title="Language & Voice" style={{ marginBottom: 24 }}>
          <Form.Item label="Language" name="language">
            <Select
              size="large"
              options={[
                { label: "English", value: "en" },
                { label: "Español", value: "es" },
              ]}
            />
          </Form.Item>

          <Form.Item label="Text-to-Speech Voice" name="tts_voice">
            <Select
              size="large"
              options={[
                { label: "Emma (US English)", value: "en-US-EmmaNeural" },
                { label: "Andrew (US English)", value: "en-US-AndrewNeural" },
                { label: "Salome (Colombian Spanish)", value: "es-CO-SalomeNeural" },
                { label: "Gonzalo (Colombian Spanish)", value: "es-CO-GonzaloNeural" },
              ]}
            />
          </Form.Item>

          <Form.Item label="Speech-to-Text Language" name="stt_language">
            <Select
              size="large"
              options={[
                { label: "English (US)", value: "en-US" },
                { label: "Spanish (Latin America)", value: "es-LA" },
              ]}
            />
          </Form.Item>
        </Card>

        <Card title="Display Options" style={{ marginBottom: 24 }}>
          <Form.Item label="Show Timestamps" name="show_timestamps" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item label="Enable Markdown Rendering" name="enable_markdown" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item
            label="Enable Code Syntax Highlighting"
            name="enable_code_highlighting"
            valuePropName="checked"
          >
            <Switch />
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
