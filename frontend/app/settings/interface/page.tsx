"use client";

import { useState, useEffect } from "react";
import { Form, Select, Switch, Card, Button, message, Radio } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { useInterfaceStore } from "@/stores/interfaceStore";

export default function InterfacePage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const interfaceStore = useInterfaceStore();

  useEffect(() => {
    // Load current preferences into form
    form.setFieldsValue({
      theme: interfaceStore.theme,
      language: interfaceStore.language,
      tts_voice: interfaceStore.ttsVoice,
      stt_language: interfaceStore.sttLanguage,
      message_density: interfaceStore.messageDensity,
      show_timestamps: interfaceStore.showTimestamps,
      enable_markdown: interfaceStore.enableMarkdown,
      enable_code_highlighting: interfaceStore.enableCodeHighlighting,
    });
  }, [interfaceStore, form]);

  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      await interfaceStore.updateAllPreferences({
        theme: values.theme,
        language: values.language,
        ttsVoice: values.tts_voice,
        sttLanguage: values.stt_language,
        messageDensity: values.message_density,
        showTimestamps: values.show_timestamps,
        enableMarkdown: values.enable_markdown,
        enableCodeHighlighting: values.enable_code_highlighting,
      });
      message.success("Interface preferences saved successfully");
    } catch (error: any) {
      // Error already handled in store
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
