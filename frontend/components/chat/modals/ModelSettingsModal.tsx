'use client';

import React from 'react';
import { Modal, Typography, Space, Select, Divider } from 'antd';
import { AudioOutlined, RobotOutlined } from '@ant-design/icons';
import ModelSelector from '../ModelSelector';
import { Conversation } from '@/types';

const { Title, Text } = Typography;

interface ModelSettingsModalProps {
  open: boolean;
  onOk: () => void;
  onCancel: () => void;
  currentConversation: Conversation | null;
  accessToken: string | null;
  selectedProvider: string;
  selectedModel: string;
  onSelectModel: (provider: string, model: string) => void;
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;
}

export const ModelSettingsModal: React.FC<ModelSettingsModalProps> = ({
  open,
  onOk,
  onCancel,
  currentConversation,
  accessToken,
  selectedProvider,
  selectedModel,
  onSelectModel,
  selectedVoice,
  setSelectedVoice,
}) => {
  return (
    <Modal
      title={currentConversation ? 'Conversation Settings' : 'New Conversation Settings'}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      width={650}
      okText={currentConversation ? 'Update Settings' : 'Create Conversation'}
    >
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={5} style={{ marginBottom: '16px' }}>
            <RobotOutlined /> Model Selection
          </Title>
          <ModelSelector
            token={accessToken}
            selectedProvider={selectedProvider}
            selectedModel={selectedModel}
            onSelect={onSelectModel}
            showDetails={true}
          />
        </div>

        <Divider style={{ margin: '12px 0' }} />

        <div>
          <Title level={5} style={{ marginBottom: '16px' }}>
            <AudioOutlined /> Voice Settings
          </Title>
          <Space orientation="vertical" style={{ width: '100%' }}>
            <Text type="secondary">Select the voice for Text-to-Speech:</Text>
            <Select
              style={{ width: '100%' }}
              value={selectedVoice}
              onChange={setSelectedVoice}
              options={[
                { label: 'Gonzalo (Colombia) - Male', value: 'es-CO-GonzaloNeural' },
                { label: 'Salome (Colombia) - Female', value: 'es-CO-SalomeNeural' },
                { label: 'Alvaro (Spain) - Male', value: 'es-ES-AlvaroNeural' },
                { label: 'Elvira (Spain) - Female', value: 'es-ES-ElviraNeural' },
                { label: 'Jorge (Mexico) - Male', value: 'es-MX-JorgeNeural' },
                { label: 'Dalia (Mexico) - Female', value: 'es-MX-DaliaNeural' },
                { label: 'Andrew (USA) - Male', value: 'en-US-AndrewNeural' },
                { label: 'Emma (USA) - Female', value: 'en-US-EmmaNeural' },
              ]}
            />
          </Space>
        </div>
      </Space>
    </Modal>
  );
};
