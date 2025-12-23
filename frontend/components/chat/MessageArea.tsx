'use client';

import React, { memo } from 'react';
import { Spin, Empty, Typography } from 'antd';
import { RobotOutlined, ThunderboltOutlined, MessageOutlined, LinkOutlined, SettingOutlined } from '@ant-design/icons';
import { Welcome, Prompts } from '@ant-design/x';
import { MessageList } from './MessageList'; // I'll extract this too

const { Text } = Typography;

interface MessageAreaProps {
  currentConversation: any;
  loading: boolean;
  chatMessages: any[];
  isStreaming: boolean;
  streamingMessage: string;
  handleSend: (text: string) => void;
  handleEdit: (msg: any) => void;
  toggleMessageReference: (id: string) => void;
  referencedMsgIds: string[];
  handleNavigate: (ref: any) => void;
  regenerateResponse: () => void;
  handlePlayMessage: (text: string, id: string) => void;
  playingMessageId: string | null;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
}

export const MessageArea: React.FC<MessageAreaProps> = ({
  currentConversation,
  loading,
  chatMessages,
  isStreaming,
  streamingMessage,
  handleSend,
  handleEdit,
  toggleMessageReference,
  referencedMsgIds,
  handleNavigate,
  regenerateResponse,
  handlePlayMessage,
  playingMessageId,
  messagesEndRef,
  scrollContainerRef,
}) => {
  if (!currentConversation) {
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
                onItemClick={(info) => handleSend(info.data.label as string)}
              />
            </Space>
          }
        />
      </div>
    );
  }

  return (
    <div key={currentConversation.id} style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, minWidth: 0 }}>
      {/* Messages Area */}
      <div 
        ref={scrollContainerRef}
        style={{ 
          flex: 1, 
          overflowY: 'auto',
          padding: '24px',
          background: '#ffffff',
          scrollBehavior: isStreaming ? 'auto' : 'smooth'
        }}
      >
        {loading && chatMessages.length === 0 ? (
          <div style={{ 
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%'
          }}>
            <Spin size="large" />
          </div>
        ) : chatMessages.length === 0 ? (
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center',
            height: '100%',
            gap: '24px'
          }}>
            <Empty 
              description="No messages yet. Start the conversation!"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
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
              onItemClick={(info) => handleSend(info.data.label as string)}
            />
          </div>
        ) : (
          <MessageList 
            messages={chatMessages} 
            isStreaming={isStreaming} 
            onEdit={handleEdit} 
            onReference={toggleMessageReference}
            referencedMsgIds={referencedMsgIds}
            onNavigate={handleNavigate}
            onFollowUp={handleSend}
            onRegenerate={regenerateResponse}
            onPlay={handlePlayMessage}
            playingMessageId={playingMessageId}
            messagesEndRef={messagesEndRef} 
          />
        )}
      </div>
    </div>
  );
};
