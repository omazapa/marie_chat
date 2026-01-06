'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Button, Typography, Space, Card, Tooltip, Collapse } from 'antd';
import {
  BulbOutlined,
  CopyOutlined,
  CheckOutlined,
  SendOutlined,
  AudioOutlined,
  AudioMutedOutlined,
} from '@ant-design/icons';
import { usePrompts } from '@/hooks/usePrompts';
import { useAuthStore } from '@/stores/authStore';
import { useSettings } from '@/hooks/useSettings';
import { useSpeech } from '@/hooks/useSpeech';

const { Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface PromptOptimizerProps {
  visible: boolean;
  onClose: () => void;
  onApply: (optimizedPrompt: string) => void;
  initialPrompt?: string;
}

export const PromptOptimizer: React.FC<PromptOptimizerProps> = ({
  visible,
  onClose,
  onApply,
  initialPrompt = '',
}) => {
  const { whiteLabel } = useSettings();
  const { accessToken } = useAuthStore();
  const { isOptimizing, techniques, templates, profiles, fetchTechniques, optimizePrompt } =
    usePrompts(accessToken);

  const [userInput, setUserInput] = useState(initialPrompt);
  const [context, setContext] = useState<string>('');
  const [selectedTechnique, setSelectedTechnique] = useState<string>('cot');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [optimizedResult, setOptimizedResult] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const { isRecording, isTranscribing, startRecording, stopRecording } = useSpeech({
    accessToken,
    onTranscription: (text) => {
      setUserInput((prev) => (prev ? `${prev} ${text}` : text));
    },
  });

  useEffect(() => {
    if (visible) {
      fetchTechniques();
      // Use setTimeout to avoid synchronous setState in effect warning
      const timer = setTimeout(() => {
        setUserInput(initialPrompt);
      }, 0);
      return () => clearTimeout(timer);
    } else {
      // Stop recording if modal is closed
      if (isRecording) {
        stopRecording();
      }
    }
  }, [visible, fetchTechniques, initialPrompt, isRecording, stopRecording]);

  const handleTemplateSelect = (val: string) => {
    setSelectedTemplate(val);
    if (val && templates[val]) {
      // If there's a placeholder like {topic}, we can keep it or clear it
      setUserInput(templates[val].replace('{topic}', userInput || '...'));
    }
  };

  const handleOptimize = async () => {
    if (!userInput.trim()) return;

    const result = await optimizePrompt({
      prompt: userInput,
      technique: selectedTechnique,
      profile: selectedProfile,
      context: context,
    });

    if (result) {
      setOptimizedResult(result);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(optimizedResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      title={
        <Space>
          <BulbOutlined style={{ color: whiteLabel.primary_color }} />
          <span>Prompt Engineering Assistant</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="apply"
          type="primary"
          disabled={!optimizedResult}
          onClick={() => {
            onApply(optimizedResult);
            onClose();
          }}
          icon={<SendOutlined />}
        >
          Apply to Chat
        </Button>,
      ]}
      width={700}
    >
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        <Collapse
          ghost
          size="small"
          expandIconPlacement="end"
          items={[
            {
              key: 'templates',
              label: <Text strong>Quick Templates</Text>,
              children: (
                <Select
                  style={{ width: '100%' }}
                  value={selectedTemplate}
                  onChange={handleTemplateSelect}
                  placeholder="Choose a template..."
                  allowClear
                >
                  {Object.keys(templates).map((key) => (
                    <Option key={key} value={key}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </Option>
                  ))}
                </Select>
              ),
            },
          ]}
        />

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <Text strong>User Profile</Text>
            <Select
              style={{ width: '100%', marginTop: 8 }}
              value={selectedProfile}
              onChange={setSelectedProfile}
              placeholder="Who are you?"
              allowClear
            >
              {Object.entries(profiles).map(([id, description]) => (
                <Option key={id} value={id}>
                  <Tooltip title={description}>
                    {id.charAt(0).toUpperCase() + id.slice(1).replace('_', ' ')}
                  </Tooltip>
                </Option>
              ))}
            </Select>
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <Text strong>Prompting Technique</Text>
            <Select
              style={{ width: '100%', marginTop: 8 }}
              value={selectedTechnique}
              onChange={setSelectedTechnique}
              placeholder="Select a technique"
            >
              {Object.entries(techniques).map(([id, description]) => (
                <Option key={id} value={id}>
                  <Tooltip title={description}>{id.toUpperCase().replace('_', ' ')}</Tooltip>
                </Option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text strong>Your Request / Topic</Text>
            <Space>
              <Button
                type="text"
                size="small"
                onClick={() => setUserInput('')}
                disabled={!userInput || isOptimizing}
              >
                Clear
              </Button>
              <Tooltip title={isRecording ? 'Stop recording' : 'Voice input'}>
                <Button
                  type={isRecording ? 'primary' : 'text'}
                  danger={isRecording}
                  shape="circle"
                  size="small"
                  icon={isRecording ? <AudioMutedOutlined /> : <AudioOutlined />}
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isOptimizing || isTranscribing}
                />
              </Tooltip>
            </Space>
          </div>
          <TextArea
            rows={4}
            placeholder={
              isRecording
                ? 'Listening...'
                : isTranscribing
                  ? 'Transcribing...'
                  : 'Describe what you want the AI to do...'
            }
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            style={{ marginTop: 8 }}
          />
        </div>

        <Collapse
          ghost
          size="small"
          expandIconPlacement="end"
          items={[
            {
              key: 'context',
              label: <Text strong>Additional Context (Optional)</Text>,
              children: (
                <TextArea
                  rows={2}
                  placeholder="Provide background info, specific data, or examples..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  style={{ marginTop: 8 }}
                />
              ),
            },
          ]}
        />

        <div style={{ marginTop: -8 }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <BulbOutlined /> {techniques[selectedTechnique]}
          </Text>
        </div>

        <Button
          type="primary"
          onClick={handleOptimize}
          loading={isOptimizing}
          icon={<BulbOutlined />}
          block
          size="large"
        >
          Optimize with AI
        </Button>

        {optimizedResult && (
          <Card
            title={
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <Space>
                  <BulbOutlined style={{ color: '#faad14' }} />
                  <span>Optimized Prompt</span>
                </Space>
                <Button
                  type="text"
                  size="small"
                  icon={copied ? <CheckOutlined style={{ color: '#52c41a' }} /> : <CopyOutlined />}
                  onClick={handleCopy}
                >
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            }
            style={{
              background: 'var(--ant-color-fill-quaternary, #f9f9f9)',
              border: '1px solid var(--ant-color-border, #e6e6e6)',
            }}
          >
            <TextArea
              rows={6}
              value={optimizedResult}
              onChange={(e) => setOptimizedResult(e.target.value)}
              style={{ whiteSpace: 'pre-wrap' }}
            />
          </Card>
        )}
      </Space>
    </Modal>
  );
};
