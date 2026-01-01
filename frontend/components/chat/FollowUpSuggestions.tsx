'use client';

import React, { memo } from 'react';
import { Prompts } from '@ant-design/x';
import { MessageOutlined } from '@ant-design/icons';

interface FollowUpSuggestionsProps {
  suggestions: string[];
  onSelect: (text: string) => void;
}

export const FollowUpSuggestions = memo(({ suggestions, onSelect }: FollowUpSuggestionsProps) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div
      style={{
        marginTop: '12px',
        marginBottom: '16px',
        paddingLeft: '48px', // Align with assistant messages
      }}
    >
      <Prompts
        title="Follow-up questions"
        vertical
        styles={{
          item: {
            whiteSpace: 'normal',
            height: 'auto',
            textAlign: 'left',
            padding: '8px 12px',
          },
        }}
        items={suggestions.map((s, i) => ({
          key: String(i),
          label: s,
          icon: <MessageOutlined style={{ color: '#1890ff' }} />,
        }))}
        onItemClick={(info) => onSelect(info.data.label as string)}
      />
    </div>
  );
});

FollowUpSuggestions.displayName = 'FollowUpSuggestions';
