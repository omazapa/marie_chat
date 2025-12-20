'use client';

import { Message } from '@/lib/types';
import { Card, Typography, Space } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
}

export default function MessageList({ messages, isTyping }: MessageListProps) {
  if (messages.length === 0 && !isTyping) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          color: '#999',
        }}
      >
        No messages yet. Start a conversation!
      </div>
    );
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {messages.map((message) => (
        <Card
          key={message.id}
          style={{
            alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '70%',
            backgroundColor: message.role === 'user' ? '#1890ff' : '#f0f0f0',
          }}
          bodyStyle={{
            padding: '12px 16px',
          }}
        >
          <Space>
            {message.role === 'user' ? (
              <UserOutlined style={{ color: 'white' }} />
            ) : (
              <RobotOutlined />
            )}
            <Text
              style={{
                color: message.role === 'user' ? 'white' : 'inherit',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {message.content}
            </Text>
          </Space>
        </Card>
      ))}
      {isTyping && (
        <Card
          style={{
            alignSelf: 'flex-start',
            maxWidth: '70%',
            backgroundColor: '#f0f0f0',
          }}
        >
          <Space>
            <RobotOutlined />
            <Text>Typing...</Text>
          </Space>
        </Card>
      )}
    </Space>
  );
}

