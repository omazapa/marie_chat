'use client';

import React, { memo } from 'react';
import { Typography, Tag, Tooltip, Button, Space, Image, Avatar } from 'antd';
import { LinkOutlined, RobotOutlined, UserOutlined, EditOutlined, ReloadOutlined, PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';
import { Think, Bubble } from '@ant-design/x';
import { FileCard } from './FileCard';
import { API_URL } from '@/lib/api';
import { MarkdownContent } from '../markdown/MarkdownContent';
import { useSettings } from '@/hooks/useSettings';

const { Text } = Typography;

interface MessageItemProps {
  msg: any;
  isStreaming: boolean;
  onEdit: (msg: any) => void;
  onReference: (id: string) => void;
  isReferenced: boolean;
  onNavigate: (ref: any) => void;
  onRegenerate?: () => void;
  onPlay?: (text: string, id: string) => void;
  isPlaying?: boolean;
}

export const MessageItem = memo(({ 
  msg, 
  isStreaming, 
  onEdit, 
  onReference, 
  isReferenced,
  onNavigate,
  onRegenerate,
  onPlay,
  isPlaying
}: MessageItemProps) => {
  const { whiteLabel } = useSettings();

  return (
    <div id={`message-${msg.id}`} style={{ marginBottom: '24px', transition: 'background-color 0.5s' }}>
      {/* Show thinking component BEFORE message for assistant streaming */}
      {msg.role === 'assistant' && msg.id === 'streaming' && isStreaming && msg.content.length < 50 && (
        <div style={{ marginBottom: '12px', marginLeft: '52px' }}>
          <Think
            title="Thinking..."
            loading={true}
            defaultExpanded={true}
            blink={true}
          >
            <div style={{ fontSize: '13px', color: '#8c8c8c', lineHeight: '1.8' }}>
              <div>• Processing your query</div>
              <div>• Searching knowledge base</div>
              <div>• Generating contextual response</div>
            </div>
          </Think>
        </div>
      )}
      {(msg.content || msg.id !== 'streaming') && (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
          maxWidth: '85%',
          alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start'
        }}>
          {msg.metadata?.attachments && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {msg.metadata.attachments.map((att: any) => (
                <FileCard key={att.file_id} file={att} />
              ))}
            </div>
          )}
          {msg.metadata?.references && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '4px' }}>
              {msg.metadata.references.map((ref: any) => (
                <Tag 
                  key={ref.id} 
                  icon={<LinkOutlined />} 
                  style={{ 
                    fontSize: '11px', 
                    background: '#e6f7ff', 
                    borderColor: '#91d5ff',
                    cursor: 'pointer'
                  }}
                  onClick={() => onNavigate(ref)}
                >
                  {ref.type === 'message' ? 'Message: ' + ref.content : ref.title}
                </Tag>
              ))}
            </div>
          )}
          <Bubble
            avatar={
              <Avatar 
                icon={msg.role === 'assistant' ? (
                  whiteLabel.app_icon ? (
                    <img src={whiteLabel.app_icon} style={{ objectFit: 'contain', width: '100%', height: '100%' }} alt="Assistant" />
                  ) : <RobotOutlined />
                ) : <UserOutlined />}
                size={40}
                style={{ 
                  backgroundColor: msg.role === 'user' ? whiteLabel.primary_color : '#ffffff',
                  border: msg.role === 'assistant' ? '1px solid #f0f0f0' : 'none',
                  padding: msg.role === 'assistant' ? '6px' : 0,
                  boxShadow: msg.role === 'assistant' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
                }}
              />
            }
            content={
              <div style={{ 
                minWidth: 0, 
                maxWidth: '100%', 
                overflowWrap: 'break-word',
                wordBreak: 'break-word'
              }}>
                <MarkdownContent content={msg.content} />
                {msg.metadata?.type === 'image_generation' && msg.metadata?.image?.url && (
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ 
                      borderRadius: '12px', 
                      overflow: 'hidden',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      border: '1px solid #f0f0f0',
                      maxWidth: '400px',
                      background: '#fff'
                    }}>
                      <img 
                        src={`${API_URL}${msg.metadata.image.url}`} 
                        alt={msg.metadata.image.prompt || 'Generated image'}
                        style={{ 
                          width: '100%',
                          display: 'block',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          console.error('❌ Image load error for URL:', `${API_URL}${msg.metadata.image.url}`, e);
                        }}
                      />
                      <div style={{ padding: '12px', borderTop: '1px solid #f0f0f0' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                          <div>
                            <Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Prompt</Text>
                            <div style={{ fontSize: '13px', color: '#262626', lineHeight: '1.4' }}>{msg.metadata.image.prompt}</div>
                          </div>
                          <div style={{ marginTop: '4px' }}>
                            <Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Model</Text>
                            <div>
                              <Tag color="blue" style={{ fontSize: '11px', borderRadius: '4px', margin: 0 }}>
                                {msg.metadata.image.model}
                              </Tag>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            }
            styles={{
              content: {
                backgroundColor: msg.role === 'user' ? '#f0f5ff' : '#ffffff',
                border: msg.role === 'user' ? 'none' : '1px solid #f0f0f0',
                borderRadius: '12px',
                padding: '12px 16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                maxWidth: '100%',
                overflow: 'hidden'
              }
            }}
            footer={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', width: '100%' }}>
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </Text>
                <Space size={4}>
                  {onPlay && msg.content && (
                    <Tooltip title={isPlaying ? "Stop" : "Listen"}>
                      <Button 
                        type="text" 
                        size="small" 
                        icon={isPlaying ? <PauseCircleOutlined style={{ color: '#1890ff' }} /> : <PlayCircleOutlined />} 
                        onClick={() => onPlay(msg.content, msg.id)}
                      />
                    </Tooltip>
                  )}
                  <Tooltip title={isReferenced ? "Referenced" : "Reference this"}>
                    <Button 
                      type="text" 
                      size="small" 
                      icon={<LinkOutlined style={{ color: isReferenced ? '#1890ff' : undefined }} />} 
                      onClick={() => onReference(msg.id)}
                    />
                  </Tooltip>
                  {msg.role === 'user' && (
                    <Tooltip title="Edit message">
                      <Button 
                        type="text" 
                        size="small" 
                        icon={<EditOutlined />} 
                        onClick={() => onEdit(msg)}
                      />
                    </Tooltip>
                  )}
                  {onRegenerate && (
                    <Tooltip title="Regenerate response">
                      <Button 
                        type="text" 
                        size="small" 
                        icon={<ReloadOutlined />} 
                        onClick={onRegenerate}
                      />
                    </Tooltip>
                  )}
                </Space>
              </div>
            }
          />
        </div>
      )}
    </div>
  );
});

MessageItem.displayName = 'MessageItem';
