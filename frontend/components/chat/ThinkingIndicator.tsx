'use client';

import React from 'react';
import { Think } from '@ant-design/x';

interface ThinkingIndicatorProps {
  title?: React.ReactNode;
}

export const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({ title = 'Thinking...' }) => {
  return (
    <Think
      title={title}
      loading={true}
      blink={true}
      defaultExpanded={false}
      style={{
        marginBottom: '16px',
      }}
    >
      <div style={{ color: '#64748b', fontSize: '13px' }}>
        Analyzing your request and generating a response...
      </div>
    </Think>
  );
};
