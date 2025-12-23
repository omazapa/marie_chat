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
import { useSettings } from '@/hooks/useSettings';

interface WelcomeScreenProps {
  onSend: (content: string) => void;
  onNewConversation: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSend, onNewConversation }) => {
  const { whiteLabel } = useSettings();

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
        icon={<img src={whiteLabel.app_logo} alt="Logo" style={{ width: '120px', marginBottom: '16px' }} />}
        title={whiteLabel.welcome_title}
        description={whiteLabel.welcome_subtitle}
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
                { key: '4', label: `How to use references in ${whiteLabel.app_name}?`, icon: <LinkOutlined /> },
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
