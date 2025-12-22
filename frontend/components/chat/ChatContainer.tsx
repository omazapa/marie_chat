'use client';

import { useState, useEffect, useRef, useMemo, memo, useCallback } from 'react';
import { Conversations, Sender, Bubble, Think, Welcome, Prompts } from '@ant-design/x';
import { useChat } from '@/hooks/useChat';
import { useAuthStore } from '@/stores/authStore';
import { Spin, Empty, Button, Space, Typography, Dropdown, Modal, Tag, Tooltip, Layout, Image, Menu, App, Input } from 'antd';
import { 
  SendOutlined, 
  UserOutlined, 
  RobotOutlined, 
  PlusOutlined, 
  MessageOutlined, 
  MoreOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ThunderboltOutlined, 
  SettingOutlined,
  PaperClipOutlined,
  FileOutlined,
  CloseCircleFilled,
  AudioOutlined,
  AudioMutedOutlined,
  LinkOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import type { ConversationsProps } from '@ant-design/x';
import type { Message as WebSocketMessage } from '@/hooks/useWebSocket';
import ModelSelector from './ModelSelector';
import { MarkdownContent } from '../markdown/MarkdownContent';
import { useSpeech } from '@/hooks/useSpeech';

const { Title, Text, Link } = Typography;
const { Sider, Content } = Layout;
const { useApp } = App;

interface Conversation {
  id: string;
  title: string;
  model: string;
  provider: string;
  updated_at: string;
}

const UserAvatar = () => (
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
);

const AssistantAvatar = () => (
  <div style={{
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: '#ffffff',
    border: '1px solid #f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    color: '#1B4B73',
    fontSize: '20px'
  }}>
    <RobotOutlined />
  </div>
);

const MessageItem = memo(({ 
  msg, 
  isStreaming, 
  onEdit, 
  onReference, 
  isReferenced,
  onNavigate
}: { 
  msg: any, 
  isStreaming: boolean, 
  onEdit: (msg: any) => void,
  onReference: (id: string) => void,
  isReferenced: boolean,
  onNavigate: (ref: any) => void
}) => {
  return (
    <div id={`message-${msg.id}`} style={{ marginBottom: '24px', transition: 'background-color 0.5s' }}>
      {/* Show thinking component BEFORE message for assistant streaming */}
      {msg.role === 'assistant' && msg.id === 'streaming' && isStreaming && msg.content.length < 50 && (
        <div style={{ marginBottom: '12px', marginLeft: '52px' }}>
          <Think
            title="Thinking..."
            loading={true}
            defaultExpanded={true}
            blink={true}
          >
            <div style={{ fontSize: '13px', color: '#8c8c8c', lineHeight: '1.8' }}>
              <div>• Processing your query</div>
              <div>• Searching knowledge base</div>
              <div>• Generating contextual response</div>
            </div>
          </Think>
        </div>
      )}
      {(msg.content || msg.id !== 'streaming') && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
          {msg.metadata?.attachments && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '4px' }}>
              {msg.metadata.attachments.map((att: any) => (
                <Tag key={att.file_id} icon={<FileOutlined />} style={{ fontSize: '11px' }}>
                  {att.filename}
                </Tag>
              ))}
            </div>
          )}
          {msg.metadata?.references && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '4px' }}>
              {msg.metadata.references.map((ref: any) => (
                <Tag 
                  key={ref.id} 
                  icon={<LinkOutlined />} 
                  style={{ 
                    fontSize: '11px', 
                    background: '#e6f7ff', 
                    borderColor: '#91d5ff',
                    cursor: 'pointer'
                  }}
                  onClick={() => onNavigate(ref)}
                >
                  {ref.type === 'message' ? 'Mensaje: ' + ref.content : ref.title}
                </Tag>
              ))}
            </div>
          )}
          <Bubble
            content={<MarkdownContent content={msg.content} isStreaming={msg.id === 'streaming'} />}
            avatar={msg.role === 'user' ? <UserAvatar /> : <AssistantAvatar />}
            placement={msg.role === 'user' ? 'end' : 'start'}
            typing={msg.id === 'streaming'}
            header={(
              <div style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: '4px', gap: '8px' }}>
                {msg.role === 'user' && (
                  <Tooltip title="Edit message">
                    <Button 
                      type="text" 
                      size="small" 
                      icon={<EditOutlined style={{ fontSize: '12px', color: '#8c8c8c' }} />} 
                      onClick={() => onEdit(msg)}
                    />
                  </Tooltip>
                )}
                {msg.id !== 'streaming' && (
                  <Tooltip title={isReferenced ? "Remove reference" : "Reference this message"}>
                    <Button 
                      type="text" 
                      size="small" 
                      icon={<LinkOutlined style={{ fontSize: '12px', color: isReferenced ? '#1890ff' : '#8c8c8c' }} />} 
                      onClick={() => onReference(msg.id)}
                    />
                  </Tooltip>
                )}
              </div>
            )}
            styles={{
              content: {
                background: msg.role === 'user' ? '#1B4B73' : '#f5f5f5',
                color: msg.role === 'user' ? '#ffffff' : '#262626',
                padding: '12px 16px',
                borderRadius: '12px',
                fontSize: '15px',
                lineHeight: '1.6',
                maxWidth: '100%',
                width: (msg.content.includes('```html') || msg.content.includes('```svg')) && msg.role === 'assistant' ? '100%' : 'auto',
                overflow: (msg.content.includes('```html') || msg.content.includes('```svg')) ? 'visible' : 'hidden',
                border: isReferenced ? '2px solid #1890ff' : 'none'
              }
            }}
          />
        </div>
      )}
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

interface ChatInputProps {
  value: string;
  onChange: (val: string) => void;
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
  referencedCount: number;
}

const ChatInput = memo(({ 
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
  referencedCount
}: ChatInputProps) => {
  const handleSubmit = (val: string) => {
    onSend(val);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {editingMessageId && (
        <div style={{ 
          marginBottom: '8px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '4px 12px',
          background: '#fff7e6',
          borderRadius: '6px',
          border: '1px solid #ffd591'
        }}>
          <Text type="warning" strong style={{ fontSize: '12px' }}>
            <EditOutlined /> Editing message...
          </Text>
          <Button type="link" size="small" onClick={onCancelEdit} danger>
            Cancel
          </Button>
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
        <Sender
          value={value}
          onChange={onChange}
          placeholder={isRecording ? "Listening..." : isTranscribing ? "Transcribing..." : editingMessageId ? "Edit your message..." : "Type your message here..."}
          onSubmit={handleSubmit}
          onCancel={onStop}
          loading={isStreaming || isTranscribing}
          disabled={!isConnected}
          prefix={
            <Space orientation="horizontal" size={4}>
              <Button 
                type="text"
                icon={<PaperClipOutlined />} 
                onClick={onFileClick}
                loading={isUploading}
                style={{ color: '#1B4B73' }}
              />
              <Button 
                type="text"
                icon={isRecording ? <AudioMutedOutlined style={{ color: '#ff4d4f' }} /> : <AudioOutlined />} 
                onClick={isRecording ? onStopRecording : onStartRecording}
                loading={isTranscribing}
                style={{ color: isRecording ? '#ff4d4f' : '#1B4B73' }}
                className={isRecording ? 'recording-pulse' : ''}
              />
              <Tooltip title="Reference other conversations">
                <Button 
                  type="text"
                  icon={<LinkOutlined />} 
                  onClick={onReferenceClick}
                  style={{ color: referencedCount > 0 ? '#1890ff' : '#1B4B73' }}
                />
              </Tooltip>
            </Space>
          }
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

const MessageList = memo(({ 
  messages, 
  isStreaming, 
  onEdit, 
  onReference,
  referencedMsgIds,
  onNavigate,
  messagesEndRef 
}: { 
  messages: any[], 
  isStreaming: boolean, 
  onEdit: (msg: any) => void, 
  onReference: (id: string) => void,
  referencedMsgIds: string[],
  onNavigate: (ref: any) => void,
  messagesEndRef: any 
}) => {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {messages.map((msg) => (
        <MessageItem 
          key={msg.id} 
          msg={msg} 
          isStreaming={isStreaming} 
          onEdit={onEdit} 
          onReference={onReference}
          isReferenced={referencedMsgIds.includes(msg.id)}
          onNavigate={onNavigate}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
});

MessageList.displayName = 'MessageList';

export default function ChatContainer() {
  const [inputValue, setInputValue] = useState('');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('ollama');
  const [selectedModel, setSelectedModel] = useState('llama3.2');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [referencedConvIds, setReferencedConvIds] = useState<string[]>([]);
  const [referencedMsgIds, setReferencedMsgIds] = useState<string[]>([]);
  const [showReferenceModal, setShowReferenceModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { accessToken, user, logout: authLogout } = useAuthStore();

  const {
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording,
  } = useSpeech({
    accessToken,
    onTranscription: (text) => {
      setInputValue(prev => prev ? `${prev} ${text}` : text);
    },
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { modal } = useApp();
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
    editMessage,
    uploadFile,
    stopGeneration,
  } = useChat(accessToken);

  // Auto-scroll to bottom when messages change or streaming
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (!scrollContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // If we are streaming, only scroll if the user is already near the bottom
    // This allows the user to scroll up to read previous messages without being snapped back
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;

    if (isNearBottom || behavior === 'smooth') {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }
  };

  useEffect(() => {
    // Use 'auto' (instant) scroll during streaming to avoid UI lag
    // Use 'smooth' only for new complete messages
    scrollToBottom(isStreaming ? 'auto' : 'smooth');
  }, [messages, streamingMessage, isStreaming]);

  // Format messages for Ant Design X
  const chatMessages = useMemo(() => [
    ...messages.filter((msg: WebSocketMessage) => msg.role !== 'system').map((msg: WebSocketMessage) => ({
      id: msg.id,
      content: msg.content,
      role: msg.role as 'user' | 'assistant',
      status: 'success' as const,
      metadata: msg.metadata,
    })),
    ...(isStreaming ? [{
      id: 'streaming',
      content: streamingMessage || '',
      role: 'assistant' as const,
      status: 'loading' as const,
    }] : []),
  ], [messages, isStreaming, streamingMessage]);

  const handleNewConversation = async () => {
    const conv = await createConversation('New Conversation', selectedModel, selectedProvider);
    if (conv) {
      await selectConversation(conv);
    }
  };

  const handleOpenModelSelector = () => {
    setShowModelSelector(true);
  };

  const handleCreateWithModel = async () => {
    setShowModelSelector(false);
    const conv = await createConversation('New Conversation', selectedModel, selectedProvider);
    if (conv) {
      await selectConversation(conv);
    }
  };

  const handleChangeModel = async () => {
    if (!currentConversation) return;
    
    setSelectedProvider(currentConversation.provider);
    setSelectedModel(currentConversation.model);
    setShowModelSelector(true);
  };

  const handleUpdateModel = async () => {
    if (!currentConversation) return;
    
    setShowModelSelector(false);
    await updateConversation(currentConversation.id, {
      model: selectedModel,
      provider: selectedProvider,
    });
  };

  const handleDeleteConversation = async (id: string) => {
    modal.confirm({
      title: 'Delete Conversation',
      content: 'Are you sure you want to delete this conversation? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        await deleteConversation(id);
      },
    });
  };

  const handleSelectConversation = async (id: string) => {
    const conv = conversations.find((c: Conversation) => c.id === id);
    if (conv) {
      await selectConversation(conv);
    }
  };

  const handleRenameConversation = async (id: string, title: string) => {
    await updateConversation(id, { title });
  };

  const handleSend = async (content: string) => {
    if (!content.trim() && attachments.length === 0) return;
    
    setInputValue('');
    const currentAttachments = [...attachments];
    const currentReferences = referencedConvIds.map(id => {
      const conv = conversations.find((c: any) => c.id === id);
      return { id, title: conv?.title || 'Chat' };
    });
    const currentMsgRefs = [...referencedMsgIds];
    
    setAttachments([]);
    setReferencedConvIds([]);
    setReferencedMsgIds([]);
    
    if (editingMessageId) {
      await editMessage(editingMessageId, content, currentAttachments, currentReferences, currentMsgRefs);
      setEditingMessageId(null);
      return;
    }
    
    // Create new conversation if none selected
    if (!currentConversation) {
      const conv = await createConversation('New Chat', selectedModel, selectedProvider);
      if (conv) {
        await selectConversation(conv);
        setTimeout(() => sendMessage(content, currentAttachments, currentReferences, currentMsgRefs), 500);
      }
    } else {
      await sendMessage(content, currentAttachments, currentReferences, currentMsgRefs);
    }
  };

  const handleReferenceClick = () => {
    setShowReferenceModal(true);
  };

  const toggleReference = (id: string) => {
    setReferencedConvIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const removeReference = (id: string) => {
    setReferencedConvIds(prev => prev.filter(i => i !== id));
  };

  const toggleMessageReference = (id: string) => {
    setReferencedMsgIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const removeMessageReference = (id: string) => {
    setReferencedMsgIds(prev => prev.filter(i => i !== id));
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const fileData = await uploadFile(files[i]);
        if (fileData) {
          setAttachments(prev => [...prev, fileData]);
        }
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.file_id !== id));
  };

  const handleEdit = useCallback((msg: any) => {
    setEditingMessageId(msg.id);
    setInputValue(msg.content);
    
    // Restore attachments and references
    if (msg.metadata?.attachments) {
      setAttachments(msg.metadata.attachments);
    } else {
      setAttachments([]);
    }
    
    if (msg.metadata?.referenced_conv_ids) {
      setReferencedConvIds(msg.metadata.referenced_conv_ids);
    } else if (msg.metadata?.references) {
      // Fallback to references if referenced_conv_ids is missing
      setReferencedConvIds(msg.metadata.references.map((r: any) => r.id));
    } else {
      setReferencedConvIds([]);
    }

    if (msg.metadata?.referenced_msg_ids) {
      setReferencedMsgIds(msg.metadata.referenced_msg_ids);
    } else {
      setReferencedMsgIds([]);
    }
  }, []);

  const handleNavigate = useCallback(async (ref: any) => {
    const targetConvId = ref.type === 'message' ? ref.conversation_id : ref.id;
    if (!targetConvId) return;

    const scrollToMessage = (id: string) => {
      const element = document.getElementById(`message-${id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add a temporary highlight effect
        const originalBg = element.style.backgroundColor;
        element.style.transition = 'background-color 0.5s';
        element.style.backgroundColor = '#e6f7ff';
        setTimeout(() => {
          element.style.backgroundColor = originalBg || 'transparent';
        }, 2000);
        return true;
      }
      return false;
    };

    // If it's the current conversation, just scroll
    if (currentConversation?.id === targetConvId) {
      if (ref.type === 'message') {
        scrollToMessage(ref.id);
      }
    } else {
      // Switch conversation
      const conv = conversations.find((c: Conversation) => c.id === targetConvId);
      if (conv) {
        await selectConversation(conv);
        
        if (ref.type === 'message') {
          // Wait for messages to load and then scroll
          let attempts = 0;
          const interval = setInterval(() => {
            if (scrollToMessage(ref.id) || attempts > 10) {
              clearInterval(interval);
            }
            attempts++;
          }, 200);
        }
      }
    }
  }, [currentConversation, conversations, selectConversation]);

  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
    setInputValue('');
    setAttachments([]);
    setReferencedConvIds([]);
    setReferencedMsgIds([]);
  }, []);

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <Sider
        width={320}
        theme="light"
        style={{ 
          borderRight: '1px solid #f0f0f0',
          height: '100vh'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <div style={{ 
          padding: '24px 20px',
          background: '#ffffff',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Title level={4} style={{ margin: 0, color: '#1B4B73', fontWeight: 700 }}>
              Marie Chat
            </Title>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%',
              background: isConnected ? '#52c41a' : '#ff4d4f',
            }} />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {isConnected ? 'System Online' : 'System Offline'}
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
              height: '44px',
              fontWeight: 600
            }}
          >
            New Conversation
          </Button>
          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={handleOpenModelSelector}
            block
            style={{ marginTop: 8, color: '#1B4B73' }}
          >
            Configure Model
          </Button>
        </div>

        {/* Conversations List */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {conversations.length > 0 ? (
            <Conversations
              items={conversations.map((conv: Conversation) => ({
                key: conv.id,
                label: conv.title,
                timestamp: new Date(conv.updated_at).getTime(),
              }))}
              activeKey={currentConversation?.id}
              onActiveChange={handleSelectConversation}
              menu={(info: any) => ({
                items: [
                  {
                    key: 'rename',
                    label: 'Rename',
                    icon: <EditOutlined />,
                    onClick: () => {
                      let newTitle = info.label;
                      modal.confirm({
                        title: 'Rename Conversation',
                        content: (
                          <Input 
                            defaultValue={info.label} 
                            onChange={(e) => newTitle = e.target.value}
                            placeholder="Enter new title"
                            style={{ marginTop: 16 }}
                          />
                        ),
                        onOk: async () => {
                          if (newTitle && newTitle.trim()) {
                            await handleRenameConversation(info.key, newTitle);
                          }
                        },
                      });
                    },
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    icon: <DeleteOutlined />,
                    danger: true,
                    onClick: () => handleDeleteConversation(info.key),
                  },
                ],
              })}
              style={{ height: '100%', overflow: 'auto' }}
            />
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

        {/* Sidebar Footer */}
        <div style={{ 
          padding: '16px 20px', 
          borderTop: '1px solid #f0f0f0',
          background: '#fafafa'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <Space orientation="horizontal" size="small">
              <UserAvatar />
              <div style={{ maxWidth: '160px' }}>
                <Text strong style={{ display: 'block', fontSize: '14px' }} ellipsis>
                  {user?.full_name || user?.email || 'User'}
                </Text>
                <Text type="secondary" style={{ fontSize: '12px' }} ellipsis>
                  {user?.email}
                </Text>
              </div>
            </Space>
            <Tooltip title="Logout">
              <Button 
                type="text" 
                icon={<LogoutOutlined />} 
                onClick={() => authLogout()}
                danger
              />
            </Tooltip>
          </div>
          <Space orientation="vertical" size={4} style={{ width: '100%' }}>
            <Text type="secondary" style={{ fontSize: '10px' }}>© 2025 ImpactU</Text>
          </Space>
        </div>
        </div>
      </Sider>

      <Layout style={{ height: '100vh' }}>
        <Content style={{ display: 'flex', flexDirection: 'column', background: '#ffffff', minWidth: 0, height: '100%' }}>
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
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center',
            padding: '40px',
            background: '#ffffff'
          }}>
            <Welcome
              variant="borderless"
              icon={<RobotOutlined style={{ fontSize: '64px', color: '#1B4B73' }} />}
              title="Marie Chat"
              description="Your intelligent research assistant. How can I help you today?"
              extra={
                <Space orientation="vertical" size="large" style={{ width: '100%', marginTop: 24, alignItems: 'center' }}>
                  <Prompts
                    title="Suggested Topics"
                    items={[
                      { key: '1', label: 'What is ImpactU?', icon: <ThunderboltOutlined /> },
                      { key: '2', label: 'How to analyze research data?', icon: <MessageOutlined /> },
                      { key: '3', label: 'Explain RAG technology', icon: <RobotOutlined /> },
                    ]}
                    onItemClick={(info) => handleSend(info.data.label as string)}
                  />
                  <Button
                    type="primary"
                    size="large"
                    icon={<PlusOutlined />}
                    onClick={handleNewConversation}
                    style={{ height: 48, padding: '0 32px' }}
                  >
                    Start New Conversation
                  </Button>
                </Space>
              }
            />
          </div>
        ) : (
          <div key={currentConversation.id} style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, minWidth: 0 }}>
            {/* Chat Header with Model Info */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid #E2E8F0',
              background: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Space orientation="horizontal" size="middle">
                <RobotOutlined style={{ fontSize: '20px', color: '#1B4B73' }} />
                <div>
                  <Text strong style={{ fontSize: '16px', display: 'block' }}>
                    {currentConversation.title}
                  </Text>
                  <Space orientation="horizontal" size="small">
                    <Tag icon={<ThunderboltOutlined />} color="blue">
                      {currentConversation.provider}
                    </Tag>
                    <Tag color="cyan">{currentConversation.model}</Tag>
                  </Space>
                </div>
              </Space>
              <Tooltip title="Change model">
                <Button
                  icon={<SettingOutlined />}
                  onClick={handleChangeModel}
                  size="small"
                  type="text"
                >
                  Change Model
                </Button>
              </Tooltip>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollContainerRef}
              style={{ 
                flex: 1, 
                overflowY: 'auto',
                padding: '24px',
                background: '#ffffff',
                scrollBehavior: isStreaming ? 'auto' : 'smooth'
              }}
            >
              {loading && chatMessages.length === 0 ? (
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%'
                }}>
                  <Spin size="large" />
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
                <MessageList 
                  messages={chatMessages} 
                  isStreaming={isStreaming} 
                  onEdit={handleEdit} 
                  onReference={toggleMessageReference}
                  referencedMsgIds={referencedMsgIds}
                  onNavigate={handleNavigate}
                  messagesEndRef={messagesEndRef} 
                />
              )}
            </div>

            {/* Input Area */}
            <div style={{ 
              borderTop: '1px solid #E2E8F0',
              background: '#ffffff',
              padding: '20px 24px'
            }}>
              <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                {/* Attachments and References List */}
                {(attachments.length > 0 || referencedConvIds.length > 0 || referencedMsgIds.length > 0) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                    {attachments.map(file => (
                      <Tag 
                        key={file.file_id} 
                        closable 
                        onClose={() => removeAttachment(file.file_id)}
                        icon={<FileOutlined />}
                        style={{ padding: '4px 8px', borderRadius: '6px' }}
                      >
                        {file.filename}
                      </Tag>
                    ))}
                    {referencedConvIds.map(id => {
                      const conv = conversations.find(c => c.id === id);
                      return (
                        <Tag 
                          key={id} 
                          closable 
                          onClose={() => removeReference(id)}
                          icon={<LinkOutlined />}
                          color="blue"
                          style={{ padding: '4px 8px', borderRadius: '6px' }}
                        >
                          {conv?.title || 'Conversation'}
                        </Tag>
                      );
                    })}
                    {referencedMsgIds.map(id => {
                      const msg = messages.find(m => m.id === id);
                      return (
                        <Tag 
                          key={id} 
                          closable 
                          onClose={() => removeMessageReference(id)}
                          icon={<LinkOutlined />}
                          color="cyan"
                          style={{ padding: '4px 8px', borderRadius: '6px' }}
                        >
                          Mensaje: {msg?.content?.substring(0, 20)}...
                        </Tag>
                      );
                    })}
                  </div>
                )}

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  onChange={handleFileChange}
                  multiple
                />

                <ChatInput 
                  value={inputValue}
                  onChange={setInputValue}
                  onSend={handleSend}
                  onStop={stopGeneration}
                  isStreaming={isStreaming}
                  isConnected={isConnected}
                  isUploading={isUploading}
                  onFileClick={handleFileClick}
                  editingMessageId={editingMessageId}
                  onCancelEdit={handleCancelEdit}
                  isRecording={isRecording}
                  isTranscribing={isTranscribing}
                  onStartRecording={startRecording}
                  onStopRecording={stopRecording}
                  onReferenceClick={handleReferenceClick}
                  referencedCount={referencedConvIds.length + referencedMsgIds.length}
                />
              </div>
            </div>
          </div>
        )}
        </Content>
      </Layout>

      {/* Reference Conversations Modal */}
      <Modal
        title="Reference Conversations"
        open={showReferenceModal}
        onOk={() => setShowReferenceModal(false)}
        onCancel={() => setShowReferenceModal(false)}
        width={500}
      >
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
            Select conversations to include as context for your next message.
          </Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {conversations
              .filter(c => c.id !== currentConversation?.id)
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
            {conversations.length <= 1 && (
              <Empty description="No other conversations to reference" />
            )}
          </div>
        </div>
      </Modal>

      {/* Model Selector Modal */}
      <Modal
        title={currentConversation ? 'Change Model' : 'Select Model for New Conversation'}
        open={showModelSelector}
        onOk={currentConversation ? handleUpdateModel : handleCreateWithModel}
        onCancel={() => setShowModelSelector(false)}
        width={600}
        okText={currentConversation ? 'Update Model' : 'Create Conversation'}
      >
        <ModelSelector
          token={accessToken}
          selectedProvider={selectedProvider}
          selectedModel={selectedModel}
          onSelect={(provider, model) => {
            setSelectedProvider(provider);
            setSelectedModel(model);
          }}
          showDetails={true}
        />
      </Modal>
    </Layout>
  );
}
