'use client';

import React, { memo } from 'react';
import { MessageItem } from './MessageItem';
import { FollowUpSuggestions } from './FollowUpSuggestions';

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
  messagesEndRef 
}: MessageListProps) => {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
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
      <div ref={messagesEndRef} />
    </div>
  );
});

MessageList.displayName = 'MessageList';
