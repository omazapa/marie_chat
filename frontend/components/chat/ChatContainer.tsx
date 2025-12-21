'use client';

import { Conversations, Sender, Bubble } from '@ant-design/x';
import { useChat } from '@/hooks/useChat';
import { useAuthStore } from '@/stores/authStore';
import { Spin, Empty, Button, Space, Typography } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined, PlusOutlined, MessageOutlined } from '@ant-design/icons';
import type { ConversationsProps } from '@ant-design/x';

const { Title, Text } = Typography;

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

export default function ChatContainer() {
  const { token } = useAuthStore();
  const {
    conversations,
    currentConversation,
    messages,
    streamingMessage,
    isStreaming,
    loading,
    error,
    isConnected,
    createConversation,
    deleteConversation,
    updateConversation,
    selectConversation,
    sendMessage,
  } = useChat(token);

  // Format messages for Ant Design X
  const chatMessages = [
    ...messages.map((msg: Message) => ({
      id: msg.id,
      content: msg.content,
      role: msg.role as 'user' | 'assistant',
      status: 'success' as const,
    })),
    ...(isStreaming && streamingMessage ? [{
      id: 'streaming',
      content: streamingMessage,
      role: 'assistant' as const,
      status: 'loading' as const,
    }] : []),
  ];

  const handleNewConversation = async () => {
    const conv = await createConversation();
    if (conv) {
      selectConversation(conv);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    if (confirm('Delete this conversation?')) {
      await deleteConversation(id);
    }
  };

  const handleSelectConversation = async (id: string) => {
    const conv = conversations.find((c: Conversation) => c.id === id);
    if (conv) {
      await selectConversation(conv);
    }
  };

  const handleRenameConversation = async (id: string, title: string) => {
    const newTitle = prompt('New title:', title);
    if (newTitle && newTitle !== title) {
      await updateConversation(id, { title: newTitle });
    }
  };

  const handleSend = async (content: string) => {
    if (!content.trim()) return;
    
    // Create new conversation if none selected
    if (!currentConversation) {
      const conv = await createConversation('New Chat');
      if (conv) {
        await selectConversation(conv);
        setTimeout(() => sendMessage(content), 500);
      }
    } else {
      await sendMessage(content);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F8FAFC' }}>
      {/* Sidebar */}
      <div style={{ 
        width: '320px', 
        background: '#ffffff',
        borderRight: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ 
          padding: '20px',
          background: 'linear-gradient(135deg, #1B4B73 0%, #2D6A9F 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <Title level={3} style={{ margin: 0, color: '#ffffff', fontWeight: 600 }}>
            Marie Chat
          </Title>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%',
              background: isConnected ? '#52c41a' : '#ff4d4f',
              boxShadow: isConnected ? '0 0 8px rgba(82,196,26,0.5)' : '0 0 8px rgba(255,77,79,0.5)'
            }} />
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px' }}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </div>
        </div>

        {/* New Conversation Button */}
        <div style={{ padding: '16px' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleNewConversation}
            disabled={loading}
            block
            size="large"
            style={{
              background: '#17A589',
              borderColor: '#17A589',
              height: '44px',
              fontWeight: 500
            }}
          >
            New Conversation
          </Button>
        </div>

        {/* Conversations List */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {conversations.length > 0 ? (
            <div style={{ height: '100%', overflow: 'auto' }}>
              <Conversations
                items={conversations.map((conv: Conversation) => ({
                  key: conv.id,
                  label: conv.title,
                  timestamp: new Date(conv.updated_at).getTime(),
                }))}
                activeKey={currentConversation?.id}
                onActiveChange={handleSelectConversation}
                menu={(info: any) => [
                  {
                    label: 'Rename',
                    key: 'rename',
                    onClick: () => {
                      const newTitle = prompt('New title:', info.label);
                      if (newTitle) {
                        handleRenameConversation(info.key, newTitle);
                      }
                    },
                  },
                  {
                    label: 'Delete',
                    key: 'delete',
                    danger: true,
                    onClick: () => handleDeleteConversation(info.key),
                  },
                ]}
                style={{ height: '100%' }}
              />
            </div>
          ) : (
            <div style={{ 
              padding: '40px 20px', 
              textAlign: 'center',
              color: '#8c8c8c'
            }}>
              <MessageOutlined style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.3 }} />
              <Text type="secondary" style={{ display: 'block', fontSize: '14px' }}>
                No conversations yet
              </Text>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {error && (
          <div style={{ 
            background: '#fff2f0',
            borderLeft: '4px solid #ff4d4f',
            padding: '16px',
            margin: '16px'
          }}>
            <Text style={{ color: '#cf1322' }}>{error}</Text>
          </div>
        )}

        {!currentConversation ? (
          <div style={{ 
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px'
          }}>
            <Space orientation="vertical" align="center" size="large" style={{ maxWidth: '600px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1B4B73 0%, #17A589 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '40px',
                boxShadow: '0 8px 24px rgba(27,75,115,0.2)'
              }}>
                🤖
              </div>
              <Title level={2} style={{ margin: 0, color: '#1B4B73', fontWeight: 600 }}>
                Welcome to Marie Chat
              </Title>
              <Text type="secondary" style={{ 
                fontSize: '16px', 
                textAlign: 'center',
                display: 'block',
                lineHeight: '1.6'
              }}>
                Your intelligent research assistant powered by AI. Create a new conversation to get started.
              </Text>
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={handleNewConversation}
                style={{
                  height: '48px',
                  padding: '0 32px',
                  fontSize: '16px',
                  background: '#1B4B73',
                  borderColor: '#1B4B73'
                }}
              >
                Start New Chat
              </Button>
            </Space>
          </div>
        ) : (
          <>
            {/* Messages Area */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto',
              padding: '24px',
              background: '#ffffff'
            }}>
              {loading && chatMessages.length === 0 ? (
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%'
                }}>
                  <Spin size="large" tip="Loading messages..." />
                </div>
              ) : chatMessages.length === 0 ? (
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%'
                }}>
                  <Empty 
                    description="No messages yet. Start the conversation!"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                </div>
              ) : (
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                  {chatMessages.map((msg) => (
                    <div key={msg.id} style={{ marginBottom: '24px' }}>
                      <Bubble
                        content={msg.content}
                        avatar={
                          msg.role === 'user' ? (
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: '#1B4B73',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ffffff',
                              fontSize: '16px'
                            }}>
                              <UserOutlined />
                            </div>
                          ) : (
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: '#17A589',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ffffff',
                              fontSize: '16px'
                            }}>
                              <RobotOutlined />
                            </div>
                          )
                        }
                        placement={msg.role === 'user' ? 'end' : 'start'}
                        typing={msg.id === 'streaming'}
                        styles={{
                          content: {
                            background: msg.role === 'user' ? '#1B4B73' : '#f5f5f5',
                            color: msg.role === 'user' ? '#ffffff' : '#262626',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            fontSize: '15px',
                            lineHeight: '1.6'
                          }
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Input Area */}
            <div style={{ 
              borderTop: '1px solid #E2E8F0',
              background: '#ffffff',
              padding: '20px 24px'
            }}>
              <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                <Sender
                  placeholder="Type your message here..."
                  onSubmit={handleSend}
                  loading={isStreaming}
                  disabled={!isConnected || isStreaming}
                  style={{
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    borderRadius: '12px'
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
