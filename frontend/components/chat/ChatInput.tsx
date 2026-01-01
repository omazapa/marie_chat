'use client';

import React, { memo } from 'react';
import { Button, Badge, Tooltip } from 'antd';
import { Sender } from '@ant-design/x';
import {
  PaperClipOutlined,
  AudioOutlined,
  AudioMutedOutlined,
  LinkOutlined,
  PictureOutlined,
  CloseCircleFilled,
  BulbOutlined,
} from '@ant-design/icons';
import { useSettings } from '@/hooks/useSettings';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (content: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  isConnected: boolean;
  isUploading: boolean;
  onFileClick: () => void;
  editingMessageId: string | null;
  onCancelEdit: () => void;
  isRecording: boolean;
  isTranscribing: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onReferenceClick: () => void;
  onImageClick: () => void;
  onOptimizeClick: () => void;
  referencedCount: number;
}

export const ChatInput = memo(
  ({
    value,
    onChange,
    onSend,
    onStop,
    isStreaming,
    isConnected,
    isUploading,
    onFileClick,
    editingMessageId,
    onCancelEdit,
    isRecording,
    isTranscribing,
    onStartRecording,
    onStopRecording,
    onReferenceClick,
    onImageClick,
    onOptimizeClick,
    referencedCount,
  }: ChatInputProps) => {
    const { whiteLabel } = useSettings();

    return (
      <div style={{ position: 'relative' }}>
        {editingMessageId && (
          <div
            style={{
              position: 'absolute',
              top: '-40px',
              left: 0,
              right: 0,
              background: '#fffbe6',
              padding: '8px 16px',
              border: '1px solid #ffe58f',
              borderRadius: '8px 8px 0 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 5,
            }}
          >
            <span style={{ fontSize: '13px', color: '#856404' }}>Editing message...</span>
            <Button type="text" size="small" icon={<CloseCircleFilled />} onClick={onCancelEdit} />
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch', width: '100%' }}>
          <Sender
            value={value}
            onChange={onChange}
            onSubmit={onSend}
            onCancel={onStop}
            loading={isStreaming || isUploading || isTranscribing}
            disabled={!isConnected}
            placeholder={
              isRecording
                ? 'Listening...'
                : isTranscribing
                  ? 'Transcribing...'
                  : 'Type your message here...'
            }
            prefix={
              <div style={{ display: 'flex', gap: '0px', alignItems: 'center' }}>
                <Tooltip title="Attach">
                  <Button
                    type="text"
                    size="small"
                    icon={<PaperClipOutlined />}
                    onClick={onFileClick}
                    disabled={isStreaming || isUploading}
                    style={{ padding: '4px' }}
                  />
                </Tooltip>
                <Tooltip title="Reference">
                  <Badge count={referencedCount} size="small" offset={[-2, 2]}>
                    <Button
                      type="text"
                      size="small"
                      icon={<LinkOutlined />}
                      onClick={onReferenceClick}
                      disabled={isStreaming}
                      style={{ padding: '4px' }}
                    />
                  </Badge>
                </Tooltip>
                <Tooltip title="Image">
                  <Button
                    type="text"
                    size="small"
                    icon={<PictureOutlined />}
                    onClick={onImageClick}
                    disabled={isStreaming}
                    style={{ padding: '4px' }}
                  />
                </Tooltip>
                <Tooltip title="Optimize">
                  <Button
                    type="text"
                    size="small"
                    icon={<BulbOutlined style={{ color: whiteLabel.primary_color }} />}
                    onClick={onOptimizeClick}
                    disabled={isStreaming}
                    style={{ padding: '4px' }}
                  />
                </Tooltip>
              </div>
            }
            style={{
              flex: 1,
              boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              minWidth: '0',
            }}
            styles={{
              input: {
                maxHeight: '200px',
                minHeight: '54px',
                lineHeight: '1.5',
                padding: '12px',
                resize: 'none',
                overflowX: 'hidden',
                overflowY: 'auto',
                wordBreak: 'break-all',
              },
            }}
          />
          <Tooltip title={isRecording ? 'Stop' : 'Voice'}>
            <Button
              type={isRecording ? 'primary' : 'default'}
              danger={isRecording}
              shape="circle"
              size="large"
              icon={isRecording ? <AudioMutedOutlined /> : <AudioOutlined />}
              onClick={isRecording ? onStopRecording : onStartRecording}
              disabled={isStreaming || isTranscribing}
              style={{
                minWidth: '54px',
                height: '54px',
                flexShrink: 0,
              }}
            />
          </Tooltip>
        </div>
      </div>
    );
  }
);

ChatInput.displayName = 'ChatInput';
