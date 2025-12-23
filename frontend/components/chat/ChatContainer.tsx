'use client';

import React, { useState, useEffect, useRef, useMemo, memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Conversations, Sender, Bubble, Think, Welcome, Prompts } from '@ant-design/x';
import { useChat } from '@/hooks/useChat';
import { useAuthStore } from '@/stores/authStore';
import { Spin, Empty, Button, Space, Typography, Dropdown, Modal, Tag, Tooltip, Layout, Image, Menu, App, Input, Select } from 'antd';
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
  LogoutOutlined,
  SearchOutlined,
  ReloadOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  PictureOutlined
} from '@ant-design/icons';
import type { ConversationsProps } from '@ant-design/x';
import type { Message as WebSocketMessage } from '@/hooks/useWebSocket';
import { useSpeech } from '@/hooks/useSpeech';
import { useImages } from '@/hooks/useImages';

// Lazy load heavy components
const ModelSelector = dynamic(() => import('./ModelSelector'), {
  loading: () => <Spin size="small" />,
  ssr: false
});

const MarkdownContent = dynamic(() => import('../markdown/MarkdownContent').then(mod => mod.MarkdownContent), {
  loading: () => <div style={{ padding: '8px', color: '#8c8c8c' }}>Loading renderer...</div>,
  ssr: false
});

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

const FileCard = ({ file }: { file: any }) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '8px 12px',
      background: '#ffffff',
      border: '1px solid #e8e8e8',
      borderRadius: '8px',
      marginBottom: '4px',
      width: 'fit-content',
      minWidth: '180px',
      maxWidth: '280px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    }}>
      <div style={{ 
        width: '32px', 
        height: '32px', 
        borderRadius: '6px', 
        background: '#f0f5ff', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <FileOutlined style={{ fontSize: '16px', color: '#1677ff' }} />
      </div>
      <div style={{ overflow: 'hidden', flex: 1 }}>
        <Tooltip title={file.filename}>
          <Text strong style={{ fontSize: '12px', display: 'block' }} ellipsis>
            {file.filename}
          </Text>
        </Tooltip>
        <Text type="secondary" style={{ fontSize: '10px' }}>
          {file.file_type?.toUpperCase() || 'FILE'} • {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Ready'}
        </Text>
      </div>
    </div>
  );
};

const MessageItem = memo(({ 
  msg, 
  isStreaming, 
  onEdit, 
  onReference, 
  isReferenced,
  onNavigate,
  onRegenerate,
  onPlay,
  isPlaying
}: { 
  msg: any, 
  isStreaming: boolean, 
  onEdit: (msg: any) => void,
  onReference: (id: string) => void,
  isReferenced: boolean,
  onNavigate: (ref: any) => void,
  onRegenerate?: () => void,
  onPlay?: (text: string, id: string) => void,
  isPlaying?: boolean
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {msg.metadata.attachments.map((att: any) => (
                <FileCard key={att.file_id} file={att} />
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
                  {ref.type === 'message' ? 'Message: ' + ref.content : ref.title}
                </Tag>
              ))}
            </div>
          )}
          {msg.metadata?.image && (
            <div style={{ marginBottom: '12px', maxWidth: '100%' }}>
              <Image
                src={`http://localhost:5000${msg.metadata.image.url}`}
                alt={msg.metadata.image.prompt}
                style={{ borderRadius: '12px', maxWidth: '100%', border: '1px solid #f0f0f0' }}
                placeholder={
                  <div style={{ width: '300px', height: '300px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Spin />
                  </div>
                }
              />
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
                {msg.role === 'assistant' && onRegenerate && !isStreaming && (
                  <Tooltip title="Regenerate response">
                    <Button 
                      type="text" 
                      size="small" 
                      icon={<ReloadOutlined style={{ fontSize: '12px', color: '#8c8c8c' }} />} 
                      onClick={onRegenerate}
                    />
                  </Tooltip>
                )}
                {msg.role === 'assistant' && !isStreaming && (
                  <Tooltip title={isPlaying ? "Stop audio" : "Play audio"}>
                    <Button 
                      type="text" 
                      size="small" 
                      icon={isPlaying ? <PauseCircleOutlined style={{ fontSize: '12px', color: '#1890ff' }} /> : <PlayCircleOutlined style={{ fontSize: '12px', color: '#8c8c8c' }} />} 
                      onClick={() => onPlay?.(msg.content, msg.id)}
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
  onImageClick: () => void;
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
  onImageClick,
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
              <Tooltip title="Generate image">
                <Button 
                  type="text"
                  icon={<PictureOutlined />} 
                  onClick={onImageClick}
                  style={{ color: '#1B4B73' }}
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

const FollowUpSuggestions = memo(({ 
  suggestions, 
  onSelect 
}: { 
  suggestions: string[], 
  onSelect: (text: string) => void 
}) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div style={{ 
      marginTop: '12px',
      marginBottom: '16px',
      paddingLeft: '48px' // Align with assistant messages
    }}>
      <Prompts
        title="Follow-up questions"
        vertical
        styles={{
          item: {
            whiteSpace: 'normal',
            height: 'auto',
            textAlign: 'left',
            padding: '8px 12px'
          }
        }}
        items={suggestions.map((s, i) => ({
          key: String(i),
          label: s,
          icon: <MessageOutlined style={{ color: '#1890ff' }} />
        }))}
        onItemClick={(info) => onSelect(info.data.label as string)}
      />
    </div>
  );
});

FollowUpSuggestions.displayName = 'FollowUpSuggestions';

const MessageList = memo(({ 
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
}: { 
  messages: any[], 
  isStreaming: boolean, 
  onEdit: (msg: any) => void, 
  onReference: (id: string) => void,
  referencedMsgIds: string[],
  onNavigate: (ref: any) => void,
  onFollowUp: (text: string) => void,
  onRegenerate: () => void,
  onPlay: (text: string, id: string) => void,
  playingMessageId: string | null,
  messagesEndRef: any 
}) => {
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

export default function ChatContainer() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('ollama');
  const [selectedModel, setSelectedModel] = useState('llama3.2');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [referencedConvIds, setReferencedConvIds] = useState<string[]>([]);
  const [referencedMsgIds, setReferencedMsgIds] = useState<string[]>([]);
  const [showReferenceModal, setShowReferenceModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [selectedImageModel, setSelectedImageModel] = useState('stabilityai/stable-diffusion-3.5-large');
  const [isUploading, setIsUploading] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState('es-CO-GonzaloNeural');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { accessToken, user, logout: authLogout } = useAuthStore();

  const onTranscription = useCallback((text: string) => {
    setInputValue(prev => prev ? `${prev} ${text}` : text);
  }, []);

  const chatOptions = useMemo(() => ({
    onTranscription
  }), [onTranscription]);

  const {
    conversations,
    currentConversation,
    messages,
    streamingMessage,
    isStreaming,
    isTranscribing: isChatTranscribing,
    ttsAudio,
    loading,
    error,
    isConnected,
    fetchMessages,
    createConversation,
    deleteConversation,
    updateConversation,
    selectConversation,
    sendMessage,
    editMessage,
    uploadFile,
    stopGeneration,
    regenerateResponse,
    transcribeAudio,
    textToSpeech,
    setTtsAudio,
    search,
    searchResults,
    isSearching,
  } = useChat(accessToken, chatOptions);

  const {
    isGenerating: isGeneratingImage,
    imageModels,
    fetchImageModels,
    generateImage
  } = useImages(accessToken);

  const {
    isRecording,
    isTranscribing: isLocalTranscribing,
    startRecording,
    stopRecording,
  } = useSpeech({
    accessToken,
    onTranscription: (text) => {
      setInputValue(prev => prev ? `${prev} ${text}` : text);
    },
    onTranscribe: (base64) => {
      // Use the language from selected voice as a hint (e.g., "es-CO-GonzaloNeural" -> "es")
      const langCode = selectedVoice.split('-')[0];
      transcribeAudio(base64, langCode);
    }
  });

  // Use either local or chat transcription state
  const isTranscribing = isLocalTranscribing || isChatTranscribing;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { modal } = useApp();

  // Handle backend search for conversations
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery && searchQuery.trim().length > 2) {
        search(searchQuery, 'conversations');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, search]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversations;
    
    // If we have search results from backend, use them
    if (searchResults.conversations.length > 0 && searchQuery.trim().length > 2) {
      return searchResults.conversations;
    }
    
    // Fallback to local filtering for short queries
    return conversations.filter(conv => 
      conv.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery, searchResults.conversations]);

  const handleLogout = useCallback(() => {
    authLogout();
    router.push('/login');
  }, [authLogout, router]);

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

  // Handle TTS audio result
  useEffect(() => {
    let isMounted = true;

    if (ttsAudio && ttsAudio.audio) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      
      const audio = new Audio(ttsAudio.audio);
      audioRef.current = audio;
      
      if (ttsAudio.message_id) {
        setPlayingMessageId(ttsAudio.message_id);
      }
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          // Ignore AbortError as it's expected when we stop/change audio
          if (err.name !== 'AbortError') {
            console.error('Error playing audio:', err);
          }
        });
      }
      
      audio.onended = () => {
        if (isMounted) {
          setPlayingMessageId(null);
          setTtsAudio(null);
        }
      };
    }

    return () => {
      isMounted = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, [ttsAudio, setTtsAudio]);

  const handlePlayMessage = useCallback((text: string, id: string) => {
    if (playingMessageId === id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      setPlayingMessageId(null);
      setTtsAudio(null);
    } else {
      textToSpeech(text, id, selectedVoice);
    }
  }, [playingMessageId, textToSpeech, selectedVoice, setTtsAudio]);

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
        // Use a slightly longer delay and call sendMessage directly with the captured values
        setTimeout(() => {
          sendMessage(content, currentAttachments, currentReferences, currentMsgRefs);
        }, 600);
      }
    } else {
      await sendMessage(content, currentAttachments, currentReferences, currentMsgRefs);
    }
  };

  const handleReferenceClick = () => {
    setShowReferenceModal(true);
  };

  const handleOpenImageModal = useCallback(() => {
    setShowImageModal(true);
    fetchImageModels();
  }, [fetchImageModels]);

  const handleGenerateImage = useCallback(async () => {
    if (!imagePrompt.trim() || !currentConversation) return;
    
    const result = await generateImage({
      prompt: imagePrompt,
      model: selectedImageModel,
      conversation_id: currentConversation.id
    });
    
    if (result) {
      setShowImageModal(false);
      setImagePrompt('');
      // The message is saved in the backend and will be received via WebSocket
      // or we can manually fetch messages
      fetchMessages(currentConversation.id);
    }
  }, [imagePrompt, selectedImageModel, currentConversation, generateImage, fetchMessages]);

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

        {/* Search Conversations */}
        <div style={{ padding: '0 16px 12px 16px' }}>
          <Input
            placeholder="Search conversations..."
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            style={{ borderRadius: '8px' }}
          />
        </div>

        {/* Conversations List */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {filteredConversations.length > 0 ? (
            <Conversations
              items={filteredConversations.map((conv: Conversation) => ({
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
                {searchQuery ? "No conversations match your search" : "No conversations yet"}
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
                onClick={handleLogout}
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
                    vertical
                    styles={{
                      item: {
                        whiteSpace: 'normal',
                        height: 'auto',
                        textAlign: 'left',
                        padding: '8px 12px'
                      }
                    }}
                    items={[
                      { key: '1', label: 'What is ImpactU?', icon: <ThunderboltOutlined /> },
                      { key: '2', label: 'How to analyze research data?', icon: <MessageOutlined /> },
                      { key: '3', label: 'Explain RAG technology', icon: <RobotOutlined /> },
                      { key: '4', label: 'How to use references in Marie Chat?', icon: <LinkOutlined /> },
                      { key: '5', label: 'Tell me about the available LLM models', icon: <SettingOutlined /> },
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Text strong style={{ fontSize: '16px' }}>
                      {currentConversation.title}
                    </Text>
                    <Tooltip title="Rename conversation">
                      <Button 
                        type="text" 
                        size="small" 
                        icon={<EditOutlined style={{ fontSize: '14px', color: '#8c8c8c' }} />} 
                        onClick={() => {
                          let newTitle = currentConversation.title;
                          modal.confirm({
                            title: 'Rename Conversation',
                            content: (
                              <Input 
                                defaultValue={currentConversation.title} 
                                onChange={(e) => newTitle = e.target.value}
                                placeholder="Enter new title"
                                style={{ marginTop: 16 }}
                              />
                            ),
                            onOk: async () => {
                              if (newTitle && newTitle.trim()) {
                                await handleRenameConversation(currentConversation.id, newTitle);
                              }
                            },
                          });
                        }}
                      />
                    </Tooltip>
                  </div>
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
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                  gap: '24px'
                }}>
                  <Empty 
                    description="No messages yet. Start the conversation!"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                  <Prompts
                    title="Suggested Topics"
                    vertical
                    styles={{
                      item: {
                        whiteSpace: 'normal',
                        height: 'auto',
                        textAlign: 'left',
                        padding: '8px 12px'
                      }
                    }}
                    items={[
                      { key: '1', label: 'What is ImpactU?', icon: <ThunderboltOutlined /> },
                      { key: '2', label: 'How to analyze research data?', icon: <MessageOutlined /> },
                      { key: '3', label: 'Explain RAG technology', icon: <RobotOutlined /> },
                      { key: '4', label: 'How to use references in Marie Chat?', icon: <LinkOutlined /> },
                      { key: '5', label: 'Tell me about the available LLM models', icon: <SettingOutlined /> },
                    ]}
                    onItemClick={(info) => handleSend(info.data.label as string)}
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
                  onFollowUp={handleSend}
                  onRegenerate={regenerateResponse}
                  onPlay={handlePlayMessage}
                  playingMessageId={playingMessageId}
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
                  onImageClick={handleOpenImageModal}
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
        title="Reference Content"
        open={showReferenceModal}
        onOk={() => setShowReferenceModal(false)}
        onCancel={() => setShowReferenceModal(false)}
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
            onSearch={(value) => search(value, 'messages')}
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
                      <Text style={{ fontSize: '13px', display: 'block' }} ellipsis={{ rows: 2 }}>
                        {msg.content}
                      </Text>
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
              {conversations.length <= 1 && !isSearching && searchResults.messages.length === 0 && (
                <Empty description="No other conversations to reference" />
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Image Generation Modal */}
      <Modal
        title="Generate Image"
        open={showImageModal}
        onOk={handleGenerateImage}
        onCancel={() => setShowImageModal(false)}
        confirmLoading={isGeneratingImage}
        okText="Generate"
        width={500}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '12px 0' }}>
          <div>
            <Text strong style={{ display: 'block', marginBottom: '8px' }}>Prompt</Text>
            <Input.TextArea 
              placeholder="Describe the image you want to generate..." 
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              rows={4}
              autoSize={{ minRows: 3, maxRows: 6 }}
            />
          </div>
          <div>
            <Text strong style={{ display: 'block', marginBottom: '8px' }}>Model</Text>
            <Select
              style={{ width: '100%' }}
              value={selectedImageModel}
              onChange={setSelectedImageModel}
              options={imageModels.map(m => ({ label: m.name, value: m.id }))}
              placeholder="Select a model"
            />
          </div>
          {error && (
            <Tag color="error" style={{ width: '100%', padding: '8px', whiteSpace: 'normal' }}>
              {error}
            </Tag>
          )}
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
        
        <div style={{ marginTop: '24px', borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
          <Title level={5} style={{ marginBottom: '16px' }}>Voice Settings</Title>
          <Space orientation="vertical" style={{ width: '100%' }}>
            <Text type="secondary">Select the voice for Text-to-Speech:</Text>
            <Select
              style={{ width: '100%' }}
              value={selectedVoice}
              onChange={setSelectedVoice}
              options={[
                { label: 'Gonzalo (Colombia) - Male', value: 'es-CO-GonzaloNeural' },
                { label: 'Salome (Colombia) - Female', value: 'es-CO-SalomeNeural' },
                { label: 'Alvaro (Spain) - Male', value: 'es-ES-AlvaroNeural' },
                { label: 'Elvira (Spain) - Female', value: 'es-ES-ElviraNeural' },
                { label: 'Jorge (Mexico) - Male', value: 'es-MX-JorgeNeural' },
                { label: 'Dalia (Mexico) - Female', value: 'es-MX-DaliaNeural' },
                { label: 'Andrew (USA) - Male', value: 'en-US-AndrewNeural' },
                { label: 'Emma (USA) - Female', value: 'en-US-EmmaNeural' },
              ]}
            />
          </Space>
        </div>
      </Modal>
    </Layout>
  );
}
