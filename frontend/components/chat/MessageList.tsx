'use client';

import { useEffect, useRef } from 'react';
import { Message } from '@/lib/types';
import { Card, Typography, Space } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
}

export default function MessageList({ messages, isTyping }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

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
    <div style={{ width: '100%', height: '100%' }}>
      {messages.map((message) => (
        <div
          key={message.id}
          style={{
            display: 'flex',
            justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: '16px',
          }}
        >
          <Card
            style={{
              maxWidth: '70%',
              backgroundColor: message.role === 'user' ? '#1890ff' : '#f0f0f0',
            }}
            styles={{
              body: {
                padding: '12px 16px',
              },
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
        </div>
      ))}
      {isTyping && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-start',
            marginBottom: '16px',
          }}
        >
          <Card
            style={{
              maxWidth: '70%',
              backgroundColor: '#f0f0f0',
            }}
          >
            <Space>
              <RobotOutlined />
              <Text>Typing...</Text>
            </Space>
          </Card>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}


