'use client';

import React from 'react';
import { Modal, Input, Typography, Tag, Empty } from 'antd';
import { SearchOutlined, MessageOutlined, LinkOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

interface ReferenceModalProps {
  open: boolean;
  onOk: () => void;
  onCancel: () => void;
  searchQuery: string;
  onSearch: (value: string) => void;
  isSearching: boolean;
  searchResults: {
    messages: any[];
  };
  conversations: any[];
  currentConversationId?: string;
  referencedConvIds: string[];
  referencedMsgIds: string[];
  toggleReference: (id: string) => void;
  toggleMessageReference: (id: string) => void;
}

export const ReferenceModal: React.FC<ReferenceModalProps> = ({
  open,
  onOk,
  onCancel,
  onSearch,
  isSearching,
  searchResults,
  conversations,
  currentConversationId,
  referencedConvIds,
  referencedMsgIds,
  toggleReference,
  toggleMessageReference,
}) => {
  return (
    <Modal
      title="Reference Content"
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      width={600}
      styles={{ body: { padding: '12px 24px 24px 24px' } }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Text type="secondary">
          Search and select conversations or specific messages to include as context.
        </Text>
        
        <Input.Search
          placeholder="Search in history (semantic search)..."
          allowClear
          enterButton={<SearchOutlined />}
          onSearch={(value) => onSearch(value)}
          loading={isSearching}
        />

        <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '4px' }}>
          {/* Search Results (Messages) */}
          {searchResults.messages.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <Title level={5} style={{ fontSize: '14px', marginBottom: '12px' }}>
                Messages Found (Semantic Search)
              </Title>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {searchResults.messages.map((msg: any) => (
                  <div 
                    key={msg.id}
                    onClick={() => toggleMessageReference(msg.id)}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: `1px solid ${referencedMsgIds.includes(msg.id) ? '#13c2c2' : '#f0f0f0'}`,
                      background: referencedMsgIds.includes(msg.id) ? '#e6fffb' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <Tag color={msg.role === 'user' ? 'blue' : 'green'} style={{ fontSize: '10px' }}>
                        {msg.role.toUpperCase()}
                      </Tag>
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        {new Date(msg.created_at).toLocaleDateString()}
                      </Text>
                    </div>
                    {msg.highlight ? (
                      <div 
                        style={{ fontSize: '13px', display: 'block', color: 'rgba(0, 0, 0, 0.85)' }}
                        dangerouslySetInnerHTML={{ __html: msg.highlight }}
                      />
                    ) : (
                      <Text style={{ fontSize: '13px', display: 'block' }} ellipsis={{ rows: 2 }}>
                        {msg.content}
                      </Text>
                    )}
                    {referencedMsgIds.includes(msg.id) && (
                      <div style={{ textAlign: 'right', marginTop: '4px' }}>
                        <Tag color="cyan">Selected</Tag>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conversations List */}
          <Title level={5} style={{ fontSize: '14px', marginBottom: '12px' }}>
            Recent Conversations
          </Title>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {conversations
              .filter(c => c.id !== currentConversationId)
              .map(conv => (
                <div 
                  key={conv.id}
                  onClick={() => toggleReference(conv.id)}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px solid ${referencedConvIds.includes(conv.id) ? '#1890ff' : '#f0f0f0'}`,
                    background: referencedConvIds.includes(conv.id) ? '#e6f7ff' : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.2s'
                  }}
                >
                  <MessageOutlined style={{ color: referencedConvIds.includes(conv.id) ? '#1890ff' : '#8c8c8c' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text strong style={{ display: 'block' }} ellipsis>{conv.title}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {new Date(conv.updated_at).toLocaleDateString()}
                    </Text>
                  </div>
                  {referencedConvIds.includes(conv.id) && (
                    <Tag color="blue">Selected</Tag>
                  )}
                </div>
              ))}
            {conversations.length <= 1 && !isSearching && searchResults.messages.length === 0 && (
              <Empty description="No other conversations to reference" />
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
