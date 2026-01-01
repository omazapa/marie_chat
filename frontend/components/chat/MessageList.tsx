'use client';

import React, { memo } from 'react';
import { Progress, Card, Space, Typography, Image } from 'antd';
import { PictureOutlined } from '@ant-design/icons';
import { MessageItem } from './MessageItem';
import { FollowUpSuggestions } from './FollowUpSuggestions';
import { API_URL } from '@/lib/api';
import { useSettings } from '@/hooks/useSettings';

const { Text } = Typography;

interface MessageListProps {
  messages: any[];
  isStreaming: boolean;
  onEdit: (msg: any) => void;
  onReference: (id: string) => void;
  referencedMsgIds: string[];
  onNavigate: (ref: any) => void;
  onFollowUp: (text: string) => void;
  onRegenerate: () => void;
  onPlay: (text: string, id: string) => void;
  playingMessageId: string | null;
  imageProgress?: { progress: number; step: number; total_steps: number; preview?: string } | null;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export const MessageList = memo(({ 
  messages, 
  isStreaming, 
  onEdit, 
  onReference,
  referencedMsgIds,
  onNavigate,
  onFollowUp,
  onRegenerate,
  onPlay,
  playingMessageId,
  imageProgress,
  messagesEndRef 
}: MessageListProps) => {
  const { whiteLabel } = useSettings();

  return (
    <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '0 16px 24px 16px', boxSizing: 'border-box', minWidth: 0 }}>
      {messages.map((msg, index) => (
        <div key={msg.id}>
          <MessageItem 
            msg={msg} 
            isStreaming={isStreaming} 
            onEdit={onEdit} 
            onReference={onReference}
            isReferenced={referencedMsgIds.includes(msg.id)}
            onNavigate={onNavigate}
            onRegenerate={index === messages.length - 1 && msg.role === 'assistant' ? onRegenerate : undefined}
            onPlay={onPlay}
            isPlaying={playingMessageId === msg.id}
          />
          {/* Show follow-ups only for the last assistant message and when not streaming */}
          {msg.role === 'assistant' && 
           msg.metadata?.follow_ups && 
           index === messages.length - 1 && 
           !isStreaming && (
            <FollowUpSuggestions 
              suggestions={msg.metadata.follow_ups} 
              onSelect={onFollowUp} 
            />
          )}
        </div>
      ))}

      {imageProgress && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-start', 
          marginBottom: '24px',
          marginTop: '16px',
          padding: '0 16px'
        }}>
          <Card 
            size="small" 
            style={{ 
              width: '300px', 
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              border: '1px solid #f0f0f0'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PictureOutlined style={{ color: whiteLabel.primary_color }} />
                <Text strong style={{ fontSize: '14px' }}>Generating Image...</Text>
              </div>
              
              {imageProgress.preview && (
                <img 
                  src={imageProgress.preview} 
                  alt="Preview" 
                  style={{ 
                    width: '100%', 
                    borderRadius: '8px', 
                    filter: 'blur(2px)'
                  }} 
                />
              )}

              {imageProgress.progress === 100 && (imageProgress as any).image_url && (
                <img 
                  src={`${API_URL}${(imageProgress as any).image_url}`} 
                  alt="Generated" 
                  style={{ 
                    width: '100%', 
                    borderRadius: '8px'
                  }} 
                  onError={(e) => {
                    console.error('❌ Progress image load error:', `${API_URL}${(imageProgress as any).image_url}`);
                  }}
                />
              )}
              
              <div style={{ width: '100%' }}>
                <Progress 
                  percent={imageProgress.progress} 
                  size="small" 
                  status="active"
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                />
                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
                  Step {imageProgress.step} of {imageProgress.total_steps}
                </Text>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div ref={messagesEndRef} style={{ height: '20px' }} />
    </div>
  );
});

MessageList.displayName = 'MessageList';
