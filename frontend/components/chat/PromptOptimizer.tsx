'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Button, Typography, Space, Card, Tag, Tooltip, Spin } from 'antd';
import { BulbOutlined, CopyOutlined, CheckOutlined, SendOutlined } from '@ant-design/icons';
import { usePrompts } from '@/hooks/usePrompts';
import { useAuthStore } from '@/stores/authStore';
import { useSettings } from '@/hooks/useSettings';

const { Text, Paragraph, Title } = Typography;
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
  initialPrompt = ''
}) => {
  const { whiteLabel } = useSettings();
  const { accessToken } = useAuthStore();
  const { isOptimizing, techniques, templates, fetchTechniques, optimizePrompt } = usePrompts(accessToken);
  
  const [userInput, setUserInput] = useState(initialPrompt);
  const [selectedTechnique, setSelectedTechnique] = useState<string>('cot');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [optimizedResult, setOptimizedResult] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchTechniques();
      setUserInput(initialPrompt);
    }
  }, [visible, fetchTechniques, initialPrompt]);

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
      technique: selectedTechnique
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
        </Button>
      ]}
      width={700}
    >
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <Text strong>Quick Templates</Text>
            <Select
              style={{ width: '100%', marginTop: 8 }}
              value={selectedTemplate}
              onChange={handleTemplateSelect}
              placeholder="Choose a template..."
              allowClear
            >
              {Object.keys(templates).map(key => (
                <Option key={key} value={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</Option>
              ))}
            </Select>
          </div>
          <div style={{ flex: 1 }}>
            <Text strong>Prompting Technique</Text>
            <Select
              style={{ width: '100%', marginTop: 8 }}
              value={selectedTechnique}
              onChange={setSelectedTechnique}
              placeholder="Select a technique"
            >
              {Object.entries(techniques).map(([id, description]) => (
                <Option key={id} value={id}>
                  <Tooltip title={description}>
                    {id.toUpperCase().replace('_', ' ')}
                  </Tooltip>
                </Option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <Text strong>Your Request / Topic</Text>
          <TextArea
            rows={4}
            placeholder="Describe what you want the AI to do..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            style={{ marginTop: 8 }}
          />
        </div>

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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
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
            style={{ background: '#f9f9f9', border: '1px solid #e6e6e6' }}
          >
            <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
              {optimizedResult}
            </Paragraph>
          </Card>
        )}
      </Space>
    </Modal>
  );
};
