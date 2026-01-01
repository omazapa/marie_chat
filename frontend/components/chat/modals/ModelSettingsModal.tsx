'use client';

import React from 'react';
import { Modal, Typography, Space, Select } from 'antd';
import ModelSelector from '../ModelSelector';

const { Title, Text } = Typography;

interface ModelSettingsModalProps {
  open: boolean;
  onOk: () => void;
  onCancel: () => void;
  currentConversation: any;
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
      title={currentConversation ? 'Change Model' : 'Select Model for New Conversation'}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      width={600}
      okText={currentConversation ? 'Update Model' : 'Create Conversation'}
    >
      <ModelSelector
        token={accessToken}
        selectedProvider={selectedProvider}
        selectedModel={selectedModel}
        onSelect={onSelectModel}
        showDetails={true}
      />

      <div style={{ marginTop: '24px', borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
        <Title level={5} style={{ marginBottom: '16px' }}>
          Voice Settings
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
    </Modal>
  );
};
