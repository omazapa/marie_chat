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
  BulbOutlined
} from '@ant-design/icons';

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

export const ChatInput = memo(({
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
  referencedCount
}: ChatInputProps) => {
  return (
    <div style={{ position: 'relative' }}>
      {editingMessageId && (
        <div style={{ 
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
          zIndex: 5
        }}>
          <span style={{ fontSize: '13px', color: '#856404' }}>Editing message...</span>
          <Button 
            type="text" 
            size="small" 
            icon={<CloseCircleFilled />} 
            onClick={onCancelEdit}
          />
        </div>
      )}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
        <Sender
          value={value}
          onChange={onChange}
          onSubmit={onSend}
          onCancel={onStop}
          loading={isStreaming || isUploading || isTranscribing}
          disabled={!isConnected}
          placeholder={isRecording ? "Listening..." : isTranscribing ? "Transcribing..." : "Type your message here..."}
          prefix={
            <div style={{ display: 'flex', gap: '4px' }}>
              <Tooltip title="Attach files">
                <Button 
                  type="text" 
                  icon={<PaperClipOutlined />} 
                  onClick={onFileClick}
                  disabled={isStreaming || isUploading}
                />
              </Tooltip>
              <Tooltip title="Reference content">
                <Badge count={referencedCount} size="small" offset={[-2, 2]}>
                  <Button 
                    type="text" 
                    icon={<LinkOutlined />} 
                    onClick={onReferenceClick}
                    disabled={isStreaming}
                  />
                </Badge>
              </Tooltip>
              <Tooltip title="Generate image">
                <Button 
                  type="text" 
                  icon={<PictureOutlined />} 
                  onClick={onImageClick}
                  disabled={isStreaming}
                />
              </Tooltip>
              <Tooltip title="Optimize prompt">
                <Button 
                  type="text" 
                  icon={<BulbOutlined style={{ color: '#1B4B73' }} />} 
                  onClick={onOptimizeClick}
                  disabled={isStreaming}
                />
              </Tooltip>
            </div>
          }
          actions={(info) => (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Tooltip title={isRecording ? "Stop recording" : "Voice input"}>
                <Button
                  type={isRecording ? "primary" : "text"}
                  danger={isRecording}
                  shape="circle"
                  icon={isRecording ? <AudioMutedOutlined /> : <AudioOutlined />}
                  onClick={isRecording ? onStopRecording : onStartRecording}
                  disabled={isStreaming || isTranscribing}
                />
              </Tooltip>
              {info.components.send}
            </div>
          )}
          style={{
            flex: 1,
            boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}
        />
      </div>
    </div>
  );
});

ChatInput.displayName = 'ChatInput';
