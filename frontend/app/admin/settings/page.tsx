'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Select, 
  Switch, 
  Typography, 
  Divider, 
  Space, 
  App, 
  Spin,
  Row,
  Col,
  Tabs
} from 'antd';
import { 
  SaveOutlined, 
  SettingOutlined, 
  MessageOutlined, 
  PictureOutlined, 
  AudioOutlined,
  GlobalOutlined,
  BgColorsOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import apiClient from '@/lib/api';
import { useModels } from '@/hooks/useModels';
import { useAuthStore } from '@/stores/authStore';

const { Title, Text, Paragraph } = Typography;

export default function SystemSettings() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { message } = App.useApp();
  
  const { accessToken } = useAuthStore();
  const { models, loading: loadingModels, fetchModels } = useModels(accessToken);

  // Watch provider to update model list
  const selectedProvider = Form.useWatch(['llm', 'default_provider'], form);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await apiClient.get('/admin/settings');
        form.setFieldsValue(response.data);
      } catch (err) {
        message.error('Failed to fetch system settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [form, message]);

  const onFinish = async (values: any) => {
    setSaving(true);
    try {
      await apiClient.put('/admin/settings', values);
      message.success('Settings updated successfully');
    } catch (err) {
      message.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <Spin spinning={loading} tip="Loading settings...">
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3} style={{ margin: 0 }}>
            <SettingOutlined /> System Configuration
          </Title>
          <Button 
            type="primary" 
            icon={<SaveOutlined />} 
            onClick={() => form.submit()} 
            loading={saving}
            size="large"
            disabled={loading}
          >
            Save All Settings
          </Button>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
        >
          <Tabs 
            defaultActiveKey="llm" 
            type="card"
            items={[
              {
                key: 'llm',
                label: <span><MessageOutlined /> Chat (LLM)</span>,
                children: (
                  <Card variant="borderless">
                    <Title level={4}>Default LLM Configuration</Title>
                    <Paragraph type="secondary">
                      These settings define the default model and provider used for new conversations.
                    </Paragraph>
                    <Row gutter={24}>
                      <Col span={12}>
                        <Form.Item 
                          name={['llm', 'default_provider']} 
                          label={
                            <Space>
                              Default Provider
                              <Button 
                                type="link" 
                                size="small" 
                                icon={<ReloadOutlined spin={loadingModels} />} 
                                onClick={() => fetchModels(true)}
                                title="Refresh models"
                              />
                            </Space>
                          }
                          rules={[{ required: true }]}
                        >
                          <Select options={[
                            { value: 'ollama', label: 'Ollama (Local)' },
                            { value: 'huggingface', label: 'HuggingFace (Cloud)' },
                          ]} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item 
                          name={['llm', 'default_model']} 
                          label="Default Model"
                          rules={[{ required: true }]}
                        >
                          <Select 
                            showSearch
                            allowClear
                            placeholder="Select a model"
                            loading={loadingModels}
                            options={
                              selectedProvider && models[selectedProvider]
                                ? models[selectedProvider].map(m => ({
                                    value: m.id,
                                    label: m.name || m.id
                                  }))
                                : []
                            }
                            notFoundContent={
                              loadingModels ? <Spin size="small" /> : "No models found for this provider"
                            }
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                )
              },
              {
                key: 'image',
                label: <span><PictureOutlined /> Image Generation</span>,
                children: (
                  <Card variant="borderless">
                    <Title level={4}>Diffusion Model Settings</Title>
                    <Paragraph type="secondary">
                      Configure the default model for image generation.
                    </Paragraph>
                    <Form.Item 
                      name={['image', 'default_model']} 
                      label="HuggingFace Model ID"
                      rules={[{ required: true }]}
                    >
                      <Select options={[
                        { label: 'Stable Diffusion 3.5 Large', value: 'stabilityai/stable-diffusion-3.5-large' },
                        { label: 'Stable Diffusion XL 1.0', value: 'stabilityai/stable-diffusion-xl-base-1.0' },
                        { label: 'Stable Diffusion v1.5', value: 'runwayml/stable-diffusion-v1-5' },
                        { label: 'FLUX.1 [dev]', value: 'black-forest-labs/FLUX.1-dev' },
                        { label: 'FLUX.1 [schnell]', value: 'black-forest-labs/FLUX.1-schnell' },
                      ]} />
                    </Form.Item>
                    <Form.Item 
                      name={['image', 'use_local']} 
                      label="Use Local Model (Tiny-SD)" 
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </Card>
                )
              },
              {
                key: 'speech',
                label: <span><AudioOutlined /> Speech (STT/TTS)</span>,
                children: (
                  <Card variant="borderless">
                    <Title level={4}>Speech-to-Text (Whisper)</Title>
                    <Form.Item 
                      name={['stt', 'model_size']} 
                      label="Whisper Model Size"
                      rules={[{ required: true }]}
                    >
                      <Select options={[
                        { value: 'tiny', label: 'Tiny (Fastest)' },
                        { value: 'base', label: 'Base' },
                        { value: 'small', label: 'Small' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'large-v3', label: 'Large V3 (Most Accurate)' },
                      ]} />
                    </Form.Item>

                    <Divider />

                    <Title level={4}>Text-to-Speech (Edge TTS)</Title>
                    <Paragraph type="secondary">Default voices for each language.</Paragraph>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item name={['tts', 'default_voices', 'es']} label="Spanish (ES)">
                          <Select options={[
                            { label: 'Gonzalo (Colombia) - Male', value: 'es-CO-GonzaloNeural' },
                            { label: 'Salome (Colombia) - Female', value: 'es-CO-SalomeNeural' },
                            { label: 'Alvaro (Spain) - Male', value: 'es-ES-AlvaroNeural' },
                            { label: 'Elvira (Spain) - Female', value: 'es-ES-ElviraNeural' },
                            { label: 'Jorge (Mexico) - Male', value: 'es-MX-JorgeNeural' },
                            { label: 'Dalia (Mexico) - Female', value: 'es-MX-DaliaNeural' },
                          ]} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name={['tts', 'default_voices', 'en']} label="English (EN)">
                          <Select options={[
                            { label: 'Andrew (USA) - Male', value: 'en-US-AndrewNeural' },
                            { label: 'Emma (USA) - Female', value: 'en-US-EmmaNeural' },
                          ]} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                )
              },
              {
                key: 'white_label',
                label: <span><BgColorsOutlined /> White Label</span>,
                children: (
                  <Card variant="borderless">
                    <Title level={4}>Branding & Appearance</Title>
                    <Paragraph type="secondary">
                      Customize the application name, logos, and welcome messages.
                    </Paragraph>
                    
                    <Row gutter={24}>
                      <Col span={12}>
                        <Form.Item 
                          name={['white_label', 'app_name']} 
                          label="Application Name"
                          rules={[{ required: true }]}
                        >
                          <Input placeholder="e.g. Marie" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item 
                          name={['white_label', 'primary_color']} 
                          label="Primary Color"
                          rules={[{ required: true }]}
                        >
                          <Input type="color" style={{ height: '40px' }} />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item 
                      name={['white_label', 'registration_enabled']} 
                      label="Enable Public Registration" 
                      valuePropName="checked"
                      extra="If disabled, the 'Sign up' link will be hidden from the login page."
                    >
                      <Switch />
                    </Form.Item>

                    <Row gutter={24}>
                      <Col span={12}>
                        <Form.Item 
                          name={['white_label', 'app_logo']} 
                          label="Main Logo Path"
                          rules={[{ required: true }]}
                        >
                          <Select options={[
                            { label: 'Marie Logo (New Default)', value: '/imgs/marie_logo.png' },
                            { label: 'Marie Logo (Old)', value: '/imgs/marie_logo_old.png' },
                            { label: 'Marie Icon (Square)', value: '/imgs/marie_icon.png' },
                            { label: 'ImpactU Logo', value: '/imgs/impactu_logo.png' },
                          ]} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item 
                          name={['white_label', 'app_icon']} 
                          label="App Icon Path"
                          rules={[{ required: true }]}
                        >
                          <Select options={[
                            { label: 'Marie Icon (New Default)', value: '/imgs/marie_icon.png' },
                            { label: 'Marie Logo', value: '/imgs/marie_logo.png' },
                            { label: 'ImpactU Logo (Icon)', value: '/imgs/impactu_logo.png' },
                          ]} />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Divider />

                    <Title level={4}>Welcome Screen</Title>
                    <Form.Item 
                      name={['white_label', 'welcome_title']} 
                      label="Welcome Title"
                      rules={[{ required: true }]}
                    >
                      <Input placeholder="e.g. Welcome to Marie" />
                    </Form.Item>
                    <Form.Item 
                      name={['white_label', 'welcome_subtitle']} 
                      label="Welcome Subtitle"
                      rules={[{ required: true }]}
                    >
                      <Input.TextArea rows={2} placeholder="e.g. Machine-Assisted Research Intelligent Environment" />
                    </Form.Item>
                  </Card>
                )
              }
            ]}
          />
        </Form>
      </Spin>
    </div>
  );
}
