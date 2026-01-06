'use client';

import React from 'react';
import { Typography, Tooltip } from 'antd';
import { FileOutlined } from '@ant-design/icons';
import { Attachment } from '@/types';

const { Text } = Typography;

export const FileCard = ({ file }: { file: Attachment }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 12px',
        border: '1px solid var(--ant-color-border, #e8e8e8)',
        borderRadius: '8px',
        marginBottom: '4px',
        width: 'fit-content',
        minWidth: '180px',
        maxWidth: '280px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      }}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '6px',
          background: 'var(--ant-color-primary-bg-hover, #f0f5ff)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <FileOutlined style={{ fontSize: '16px', color: '#1677ff' }} />
      </div>
      <div style={{ overflow: 'hidden', flex: 1 }}>
        <Tooltip title={file.filename}>
          <Text strong style={{ fontSize: '12px', display: 'block' }} ellipsis>
            {file.filename}
          </Text>
        </Tooltip>
        <Text type="secondary" style={{ fontSize: '10px' }}>
          {file.content_type?.split('/')[1]?.toUpperCase() || 'FILE'} •{' '}
          {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Ready'}
        </Text>
      </div>
    </div>
  );
};
