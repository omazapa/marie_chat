'use client';

import React from 'react';
import { Welcome, Prompts } from '@ant-design/x';
import { Space, Button } from 'antd';
import { 
  RobotOutlined, 
  ThunderboltOutlined, 
  MessageOutlined, 
  LinkOutlined, 
  SettingOutlined,
  PlusOutlined
} from '@ant-design/icons';

interface WelcomeScreenProps {
  onSend: (content: string) => void;
  onNewConversation: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSend, onNewConversation }) => {
  return (
    <div style={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center',
      padding: '40px',
      background: '#ffffff'
    }}>
      <Welcome
        variant="borderless"
        icon={<RobotOutlined style={{ fontSize: '64px', color: '#1B4B73' }} />}
        title="Marie Chat"
        description="Your intelligent research assistant. How can I help you today?"
        extra={
          <Space orientation="vertical" size="large" style={{ width: '100%', marginTop: 24, alignItems: 'center' }}>
            <Prompts
              title="Suggested Topics"
              vertical
              styles={{
                item: {
                  whiteSpace: 'normal',
                  height: 'auto',
                  textAlign: 'left',
                  padding: '8px 12px'
                }
              }}
              items={[
                { key: '1', label: 'What is ImpactU?', icon: <ThunderboltOutlined /> },
                { key: '2', label: 'How to analyze research data?', icon: <MessageOutlined /> },
                { key: '3', label: 'Explain RAG technology', icon: <RobotOutlined /> },
                { key: '4', label: 'How to use references in Marie Chat?', icon: <LinkOutlined /> },
                { key: '5', label: 'Tell me about the available LLM models', icon: <SettingOutlined /> },
              ]}
              onItemClick={(info) => onSend(info.data.label as string)}
            />
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={onNewConversation}
              style={{ height: 48, padding: '0 32px' }}
            >
              Start New Conversation
            </Button>
          </Space>
        }
      />
    </div>
  );
};
