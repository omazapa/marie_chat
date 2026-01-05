"use client";

import { useState, useEffect } from "react";
import { Form, Select, Switch, Card, Button, message, Radio } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { useInterfaceStore } from "@/stores/interfaceStore";
import { useTranslations } from "@/hooks/useLanguage";

export default function InterfacePage() {
  const t = useTranslations('settings.interfaceSection');
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
      // Check if language changed
      const languageChanged = values.language !== interfaceStore.language;
      
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
      message.success(t('preferencesUpdated'));
      
      // Reload page if language changed to apply new locale
      if (languageChanged) {
        setTimeout(() => window.location.reload(), 500);
      }
    } catch (error: any) {
      // Error already handled in store
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <h1 style={{ marginBottom: 24, fontSize: 24, fontWeight: 600 }}>{t('appearance')}</h1>

      <Form form={form} layout="vertical" onFinish={handleSave} autoComplete="off">
        <Card title={t('appearance')} style={{ marginBottom: 24 }}>
          <Form.Item label={t('theme')} name="theme">
            <Radio.Group size="large">
              <Radio.Button value="light">{t('light')}</Radio.Button>
              <Radio.Button value="dark">{t('dark')}</Radio.Button>
              <Radio.Button value="auto">{t('auto')}</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item label={t('messageDensity')} name="message_density">
            <Radio.Group size="large">
              <Radio.Button value="compact">{t('compact')}</Radio.Button>
              <Radio.Button value="comfortable">{t('comfortable')}</Radio.Button>
              <Radio.Button value="spacious">{t('spacious')}</Radio.Button>
            </Radio.Group>
          </Form.Item>
        </Card>

        <Card title={t('languageVoice')} style={{ marginBottom: 24 }}>
          <Form.Item label={t('language')} name="language">
            <Select
              size="large"
              options={[
                { label: "English", value: "en" },
                { label: "Español", value: "es" },
              ]}
            />
          </Form.Item>

          <Form.Item label={t('ttsVoice')} name="tts_voice">
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

          <Form.Item label={t('sttLanguage')} name="stt_language">
            <Select
              size="large"
              options={[
                { label: "English (US)", value: "en-US" },
                { label: "Spanish (Latin America)", value: "es-LA" },
              ]}
            />
          </Form.Item>
        </Card>

        <Card title={t('displayOptions')} style={{ marginBottom: 24 }}>
          <Form.Item label={t('showTimestamps')} name="show_timestamps" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item label={t('enableMarkdown')} name="enable_markdown" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item
            label={t('enableCodeHighlighting')}
            name="enable_code_highlighting"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Card>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} size="large" icon={<SaveOutlined />}>
            {t('savePreferences')}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
