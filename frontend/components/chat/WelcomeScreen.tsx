'use client';

import React from 'react';
import { Welcome, Prompts } from '@ant-design/x';
import { Space, Button, Image, Typography } from 'antd';
import { 
  RobotOutlined, 
  ThunderboltOutlined, 
  MessageOutlined, 
  LinkOutlined, 
  SettingOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useSettings } from '@/hooks/useSettings';

const { Title, Text, Paragraph } = Typography;

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
      background: '#ffffff',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <Image 
          src={whiteLabel.app_logo} 
          alt="Logo" 
          width={180} 
          preview={false} 
          style={{ marginBottom: '24px' }} 
        />
        <Title level={1} style={{ margin: '0 0 8px 0', fontWeight: 800 }}>
          {whiteLabel.welcome_title}
        </Title>
        <Paragraph type="secondary" style={{ fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
          {whiteLabel.welcome_subtitle}
        </Paragraph>
      </div>

      <div style={{ width: '100%', maxWidth: '600px' }}>
        <Prompts
          title={<Text strong style={{ fontSize: '16px', marginBottom: '16px', display: 'block' }}>Suggested Topics</Text>}
          vertical
          styles={{
            item: {
              whiteSpace: 'normal',
              height: 'auto',
              textAlign: 'left',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid #f0f0f0',
              marginBottom: '8px',
              transition: 'all 0.3s'
            }
          }}
          items={[
            { key: '1', label: 'What is ImpactU?', icon: <ThunderboltOutlined style={{ color: '#faad14' }} /> },
            { key: '2', label: 'How to analyze research data?', icon: <MessageOutlined style={{ color: '#1890ff' }} /> },
            { key: '3', label: 'Explain RAG technology', icon: <RobotOutlined style={{ color: '#52c41a' }} /> },
            { key: '4', label: `How to use references in ${whiteLabel.app_name.replace(/\s*Chat/i, '')}?`, icon: <LinkOutlined style={{ color: '#722ed1' }} /> },
          ]}
          onItemClick={(info) => onSend(info.data.label as string)}
        />
        
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={onNewConversation}
            style={{ 
              height: 54, 
              padding: '0 40px', 
              borderRadius: '27px',
              fontSize: '16px',
              fontWeight: 600,
              boxShadow: `0 4px 14px ${whiteLabel.primary_color}40`
            }}
          >
            Start New Conversation
          </Button>
        </div>
      </div>
    </div>
  );
};
