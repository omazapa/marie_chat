'use client';

import React from 'react';
import { Think } from '@ant-design/x';
import { BulbOutlined } from '@ant-design/icons';

interface ThinkingIndicatorProps {
  title?: React.ReactNode;
  showIcon?: boolean;
}

export const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({
  title = 'Thinking...',
  showIcon = true,
}) => {
  return (
    <Think
      title={title}
      icon={showIcon ? <BulbOutlined style={{ color: '#1890ff' }} /> : undefined}
      loading={true}
      blink={true}
      style={{
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
        border: '1px solid #e0e6ed',
        borderRadius: '12px',
        padding: '12px 16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
      styles={{
        status: {
          fontSize: '14px',
          fontWeight: 500,
        },
        content: {
          marginTop: '8px',
          fontSize: '13px',
          color: '#8c8c8c',
        },
      }}
    >
      <div style={{ fontSize: '13px', color: '#595959', lineHeight: 1.6 }}>
        Processing your request and generating response...
      </div>
    </Think>
  );
};
