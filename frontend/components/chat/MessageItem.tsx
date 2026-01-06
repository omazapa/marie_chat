'use client';

import React, { memo } from 'react';
import { Typography, Tag, Tooltip, Button, Space, Avatar } from 'antd';
import {
  LinkOutlined,
  RobotOutlined,
  UserOutlined,
  EditOutlined,
  ReloadOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CopyOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { Bubble } from '@ant-design/x';
import { FileCard } from './FileCard';
import { ThinkingIndicator } from './ThinkingIndicator';
import { API_URL } from '@/lib/api';
import { MarkdownContent } from '../markdown/MarkdownContent';
import { useSettings } from '@/hooks/useSettings';
import { useInterfaceStore } from '@/stores/interfaceStore';
import { Message, Attachment } from '@/types';

const { Text } = Typography;

interface MessageItemProps {
  msg: Message & { status?: 'loading' | 'success' | 'error' };
  isStreaming: boolean;
  onEdit: (msg: Message) => void;
  onReference: (id: string) => void;
  isReferenced: boolean;
  onNavigate: (ref: { type?: string; id: string; conversation_id?: string }) => void;
  onRegenerate?: () => void;
  onPlay?: (text: string, id: string) => void;
  isPlaying?: boolean;
}

export const MessageItem = memo(
  ({
    msg,
    isStreaming,
    onEdit,
    onReference,
    isReferenced,
    onNavigate,
    onRegenerate,
    onPlay,
    isPlaying,
  }: MessageItemProps) => {
    const { whiteLabel } = useSettings();
    const { messageDensity, showTimestamps } = useInterfaceStore();
    const [copied, setCopied] = React.useState(false);

    // Density styles
    const densityStyles = {
      compact: {
        padding: '8px 12px',
        fontSize: '13px',
        lineHeight: '1.4',
        gap: '6px',
        avatarSize: 32,
      },
      comfortable: {
        padding: '12px 16px',
        fontSize: '14px',
        lineHeight: '1.6',
        gap: '8px',
        avatarSize: 40,
      },
      spacious: {
        padding: '16px 20px',
        fontSize: '15px',
        lineHeight: '1.8',
        gap: '12px',
        avatarSize: 48,
      },
    };

    const currentDensity = densityStyles[messageDensity] || densityStyles.comfortable;

    // Format timestamp
    const formatTimestamp = (timestamp: string | number) => {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleCopyAll = () => {
      navigator.clipboard.writeText(msg.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div
        id={`message-${msg.id}`}
        style={{
          marginBottom:
            currentDensity.gap === '6px' ? '16px' : currentDensity.gap === '8px' ? '24px' : '32px',
          transition: 'background-color 0.5s',
        }}
      >
        {(msg.content || msg.role === 'assistant') && (
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '95%',
                minWidth: 0,
              }}
            >
              {Array.isArray(msg.metadata?.attachments) && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    marginBottom: '8px',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  {(msg.metadata!.attachments as Attachment[]).map((att: Attachment) => (
                    <FileCard key={att.file_id} file={att} />
                  ))}
                </div>
              )}
              {Array.isArray(msg.metadata?.references) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '4px' }}>
                  {(
                    msg.metadata!.references as Array<{
                      id: string;
                      type?: string;
                      content?: string;
                      title?: string;
                    }>
                  ).map((ref: { id: string; type?: string; content?: string; title?: string }) => (
                    <Tag
                      key={ref.id}
                      icon={<LinkOutlined />}
                      style={{
                        fontSize: '11px',
                        background: 'var(--ant-color-primary-bg, #e6f7ff)',
                        borderColor: '#91d5ff',
                        cursor: 'pointer',
                      }}
                      onClick={() => onNavigate(ref)}
                    >
                      {ref.type === 'message' ? 'Message: ' + ref.content : ref.title}
                    </Tag>
                  ))}
                </div>
              )}
              <Bubble
                placement={msg.role === 'user' ? 'end' : 'start'}
                streaming={msg.status === 'loading'}
                typing={
                  msg.status === 'loading' ? { effect: 'typing', step: 1, interval: 0 } : false
                }
                avatar={
                  <Avatar
                    icon={
                      msg.role === 'assistant' ? (
                        whiteLabel.app_icon ? (
                          <img
                            src={whiteLabel.app_icon}
                            style={{ objectFit: 'contain', width: '100%', height: '100%' }}
                            alt="Assistant"
                          />
                        ) : (
                          <RobotOutlined />
                        )
                      ) : (
                        <UserOutlined />
                      )
                    }
                    size={currentDensity.avatarSize}
                    style={{
                      backgroundColor:
                        msg.role === 'user'
                          ? whiteLabel.primary_color
                          : 'var(--ant-color-bg-container, #ffffff)',
                      border:
                        msg.role === 'assistant'
                          ? '1px solid var(--ant-color-border, #f0f0f0)'
                          : 'none',
                      padding: msg.role === 'assistant' ? '6px' : 0,
                      boxShadow: msg.role === 'assistant' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                    }}
                  />
                }
                content={
                  <div
                    style={{
                      minWidth: 0,
                      maxWidth: '100%',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.status === 'loading' && (
                      <ThinkingIndicator title="Generating response..." />
                    )}
                    {msg.content && (
                      <div style={{ marginTop: msg.status === 'loading' ? '12px' : 0 }}>
                        <MarkdownContent
                          content={msg.content}
                          isStreaming={isStreaming && msg.id === 'streaming'}
                        />
                      </div>
                    )}
                    {msg.metadata?.type === 'image_generation' &&
                      (msg.metadata?.image as { url?: string })?.url && (
                        <div
                          style={{
                            marginTop: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                          }}
                        >
                          <div
                            style={{
                              borderRadius: '12px',
                              overflow: 'hidden',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                              border: '1px solid #f0f0f0',
                              maxWidth: '400px',
                              background: '#fff',
                            }}
                          >
                            <img
                              src={`${API_URL}${(msg.metadata.image as { url: string }).url}`}
                              alt={
                                (msg.metadata.image as { prompt?: string }).prompt ||
                                'Generated image'
                              }
                              style={{
                                width: '100%',
                                display: 'block',
                                objectFit: 'cover',
                              }}
                              onError={(e) => {
                                console.error(
                                  '❌ Image load error for URL:',
                                  `${API_URL}${(msg.metadata?.image as { url: string })?.url}`,
                                  e
                                );
                              }}
                            />
                            <div style={{ padding: '12px', borderTop: '1px solid #f0f0f0' }}>
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '8px',
                                  width: '100%',
                                }}
                              >
                                <div>
                                  <Text
                                    type="secondary"
                                    style={{
                                      fontSize: '11px',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.5px',
                                    }}
                                  >
                                    Prompt
                                  </Text>
                                  <div
                                    style={{
                                      fontSize: '13px',
                                      color: '#262626',
                                      lineHeight: '1.4',
                                    }}
                                  >
                                    {
                                      (msg.metadata as { image?: { prompt?: string } })?.image
                                        ?.prompt
                                    }
                                  </div>
                                </div>
                                <div style={{ marginTop: '4px' }}>
                                  <Text
                                    type="secondary"
                                    style={{
                                      fontSize: '11px',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.5px',
                                    }}
                                  >
                                    Model
                                  </Text>
                                  <div>
                                    <Tag
                                      color="blue"
                                      style={{ fontSize: '11px', borderRadius: '4px', margin: 0 }}
                                    >
                                      {
                                        (msg.metadata as { image?: { model?: string } })?.image
                                          ?.model
                                      }
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
                    backgroundColor:
                      msg.role === 'user'
                        ? 'var(--ant-color-primary-bg, #f0f5ff)'
                        : 'var(--ant-color-bg-container, #ffffff)',
                    border:
                      msg.role === 'user' ? 'none' : '1px solid var(--ant-color-border, #f0f0f0)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    maxWidth: '100%',
                    width: 'auto',
                    minWidth: 0,
                    overflow: 'visible',
                  },
                }}
                footer={
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '4px',
                      width: '100%',
                    }}
                  >
                    {showTimestamps && (
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        {msg.created_at ? formatTimestamp(msg.created_at) : ''}
                      </Text>
                    )}
                    <Space size={4} style={{ marginLeft: 'auto' }}>
                      <Tooltip title={copied ? 'Copied!' : 'Copy message'}>
                        <Button
                          type="text"
                          size="small"
                          icon={
                            copied ? (
                              <CheckOutlined style={{ color: '#52c41a' }} />
                            ) : (
                              <CopyOutlined />
                            )
                          }
                          onClick={handleCopyAll}
                        />
                      </Tooltip>
                      {onPlay && msg.content && (
                        <Tooltip title={isPlaying ? 'Stop' : 'Listen'}>
                          <Button
                            type="text"
                            size="small"
                            icon={
                              isPlaying ? (
                                <PauseCircleOutlined style={{ color: '#1890ff' }} />
                              ) : (
                                <PlayCircleOutlined />
                              )
                            }
                            onClick={() => onPlay(msg.content, msg.id)}
                          />
                        </Tooltip>
                      )}
                      <Tooltip title={isReferenced ? 'Referenced' : 'Reference this'}>
                        <Button
                          type="text"
                          size="small"
                          icon={
                            <LinkOutlined style={{ color: isReferenced ? '#1890ff' : undefined }} />
                          }
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
          </div>
        )}
      </div>
    );
  }
);

MessageItem.displayName = 'MessageItem';
