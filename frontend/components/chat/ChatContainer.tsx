'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useChat } from '@/hooks/useChat';
import { useAuthStore } from '@/stores/authStore';
import apiClient from '@/lib/api';
import { Message, Conversation, Attachment } from '@/types';
import { Button, Typography, Tag, Tooltip, Layout, App, Input, Alert, Space } from 'antd';
import {
  RobotOutlined,
  EditOutlined,
  ThunderboltOutlined,
  SettingOutlined,
  FileOutlined,
  LinkOutlined,
  PlusOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import type { Message as WebSocketMessage } from '@/types';
import { useSpeech } from '@/hooks/useSpeech';
import { useImages } from '@/hooks/useImages';
import { ChatSidebar } from './ChatSidebar';
import { MessageArea } from './MessageArea';
import { ChatInput } from './ChatInput';
import { WelcomeScreen } from './WelcomeScreen';
import { ImageGenerationModal } from './modals/ImageGenerationModal';
import { ReferenceModal } from './modals/ReferenceModal';
import { ModelSettingsModal } from './modals/ModelSettingsModal';
import { PromptOptimizer } from './PromptOptimizer';
import AgentConfigModal from './AgentConfigModal';
import { AgentConfigPanel } from './AgentConfigPanel';

const { Text } = Typography;
const { Content } = Layout;
const { useApp } = App;

export default function ChatContainer() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('ollama');
  const [selectedModel, setSelectedModel] = useState<string>('llama3.2');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [referencedConvIds, setReferencedConvIds] = useState<string[]>([]);
  const [referencedMsgIds, setReferencedMsgIds] = useState<string[]>([]);
  const [showReferenceModal, setShowReferenceModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [selectedImageModel, setSelectedImageModel] = useState(
    'stabilityai/stable-diffusion-3.5-large'
  );
  const [showPromptOptimizer, setShowPromptOptimizer] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState('es-CO-GonzaloNeural');
  const [showAgentConfigModal, setShowAgentConfigModal] = useState(false);
  const [showAgentConfigPanel, setShowAgentConfigPanel] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { accessToken, user, logout: authLogout } = useAuthStore();

  const onTranscription = useCallback((text: string) => {
    setInputValue((prev) => (prev ? `${prev} ${text}` : text));
  }, []);

  const chatOptions = useMemo(
    () => ({
      onTranscription,
    }),
    [onTranscription]
  );

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
    createConversation,
    deleteConversation,
    bulkDeleteConversations,
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
    imageProgress,
    setImageProgress,
    setMessages,
    setError,
  } = useChat(accessToken, chatOptions);

  const {
    isGenerating: isGeneratingImage,
    imageModels,
    fetchImageModels,
    generateImage,
  } = useImages(accessToken);

  const {
    isRecording,
    isTranscribing: isLocalTranscribing,
    startRecording,
    stopRecording,
  } = useSpeech({
    accessToken,
    onTranscription: (text) => {
      setInputValue((prev) => (prev ? `${prev} ${text}` : text));
    },
    onTranscribe: (base64) => {
      // Use the language from selected voice as a hint (e.g., "es-CO-GonzaloNeural" -> "es")
      const langCode = selectedVoice.split('-')[0];
      transcribeAudio(base64, langCode);
    },
  });

  // Use either local or chat transcription state
  const isTranscribing = isLocalTranscribing || isChatTranscribing;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { modal } = useApp();

  // Load default provider and model from backend settings
  useEffect(() => {
    const loadDefaults = async () => {
      try {
        const response = await apiClient.get('/settings');
        const llmConfig = response.data.llm || {};
        if (llmConfig.default_provider) {
          setSelectedProvider(llmConfig.default_provider);
        }
        if (llmConfig.default_model) {
          setSelectedModel(llmConfig.default_model);
        }
      } catch (err) {
        console.error('Failed to load default LLM settings:', err);
      }
    };
    loadDefaults();
  }, []);

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
    return conversations.filter((conv) =>
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
        audioRef.current.src = '';
      }

      const audio = new Audio(ttsAudio.audio);
      audioRef.current = audio;

      if (ttsAudio.message_id) {
        setPlayingMessageId(ttsAudio.message_id);
      }

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
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
        audioRef.current.src = '';
      }
    };
  }, [ttsAudio, setTtsAudio]);

  const handlePlayMessage = useCallback(
    (text: string, id: string) => {
      if (playingMessageId === id) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
        }
        setPlayingMessageId(null);
        setTtsAudio(null);
      } else {
        textToSpeech(text, id, selectedVoice);
      }
    },
    [playingMessageId, textToSpeech, selectedVoice, setTtsAudio]
  );

  // Format messages for Ant Design X
  const chatMessages = useMemo(() => {
    return [
      ...messages
        .filter((msg: WebSocketMessage) => msg.role !== 'system')
        .map((msg: WebSocketMessage) => ({
          id: msg.id,
          conversation_id: msg.conversation_id,
          user_id: msg.user_id,
          content: msg.content,
          role: msg.role as 'user' | 'assistant',
          status: 'success' as const,
          metadata: msg.metadata,
          created_at: msg.created_at,
        })),
      ...(isStreaming
        ? [
            {
              id: 'streaming',
              conversation_id: currentConversation?.id || '',
              user_id: user?.id || '',
              content: streamingMessage || '',
              role: 'assistant' as const,
              status: 'loading' as const,
              created_at: new Date().toISOString(),
            },
          ]
        : []),
    ];
  }, [messages, isStreaming, streamingMessage, currentConversation?.id, user?.id]);

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
      settings: {
        ...currentConversation.settings,
      },
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
      setSelectedProvider(conv.provider);
      setSelectedModel(conv.model);
    }
  };

  const handleRenameConversation = async (id: string, title: string) => {
    await updateConversation(id, { title });
  };

  const handleSend = async (content: string) => {
    if (!content || (!content.trim() && attachments.length === 0)) return;

    setInputValue('');
    const currentAttachments = [...attachments];
    const currentReferences = referencedConvIds.map((id) => {
      const conv = conversations.find((c: Conversation) => c.id === id);
      return { id, title: conv?.title || 'Chat' };
    });
    const currentMsgRefs = [...referencedMsgIds];

    setAttachments([]);
    setReferencedConvIds([]);
    setReferencedMsgIds([]);

    if (editingMessageId) {
      await editMessage(
        editingMessageId,
        content,
        currentAttachments,
        currentReferences,
        currentMsgRefs
      );
      setEditingMessageId(null);
      return;
    }

    // Create new conversation if none selected
    if (!currentConversation) {
      const conv = await createConversation('New Chat', selectedModel, selectedProvider);
      if (conv) {
        await selectConversation(conv);
        // Call sendMessage directly with the new conversation ID
        await sendMessage(content, currentAttachments, currentReferences, currentMsgRefs, conv.id);
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
    if (!imagePrompt.trim()) return;

    let convId = currentConversation?.id;

    if (!convId) {
      const conv = await createConversation('Image Generation', selectedModel, selectedProvider);
      if (conv) {
        await selectConversation(conv);
        convId = conv.id;
      } else {
        return;
      }
    }

    const prompt = imagePrompt;
    const model = selectedImageModel;

    setShowImageModal(false);
    setImagePrompt('');

    const result = await generateImage({
      prompt,
      model,
      conversation_id: convId,
      text_model: selectedModel,
      text_provider: selectedProvider,
    });

    if (result && result.conversation_id) {
      // Image generation started

      // Only update progress for the current conversation
      if (convId === result.conversation_id) {
        setImageProgress({
          conversation_id: result.conversation_id,
          progress: 0,
          step: 0,
          total_steps: 15,
          message: 'Starting generation...',
        });

        // Optimistically add the user message
        const modelParts = model.split('/');
        const displayModel = modelParts[modelParts.length - 1] || model || 'default';
        const userMessage: Message = {
          id: `temp-${Date.now()}`,
          conversation_id: result.conversation_id,
          user_id: user?.id || 'user',
          role: 'user',
          content: `Generate an image using ${displayModel}: ${prompt}`,
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => {
          if (prev.some((m) => m.content === userMessage.content)) return prev;
          return [...prev, userMessage];
        });
      }
    }
  }, [
    imagePrompt,
    selectedImageModel,
    selectedModel,
    selectedProvider,
    currentConversation,
    createConversation,
    selectConversation,
    generateImage,
    user,
    setMessages,
    setImageProgress,
  ]);

  const toggleReference = (id: string) => {
    setReferencedConvIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const removeReference = (id: string) => {
    setReferencedConvIds((prev) => prev.filter((i) => i !== id));
  };

  const toggleMessageReference = (id: string) => {
    setReferencedMsgIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const removeMessageReference = (id: string) => {
    setReferencedMsgIds((prev) => prev.filter((i) => i !== id));
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
          setAttachments((prev) => [...prev, fileData]);
        }
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.file_id !== id));
  };

  const handleEdit = useCallback((msg: Message) => {
    setEditingMessageId(msg.id);
    setInputValue(msg.content);

    // Restore attachments and references
    if (msg.metadata?.attachments) {
      setAttachments(msg.metadata.attachments as Attachment[]);
    } else {
      setAttachments([]);
    }

    if (msg.metadata?.referenced_conv_ids) {
      setReferencedConvIds(msg.metadata.referenced_conv_ids as string[]);
    } else if (msg.metadata?.references) {
      // Fallback to references if referenced_conv_ids is missing
      const references = msg.metadata.references as Array<{ id: string }>;
      setReferencedConvIds(references.map((r) => r.id));
    } else {
      setReferencedConvIds([]);
    }

    if (msg.metadata?.referenced_msg_ids) {
      setReferencedMsgIds(msg.metadata.referenced_msg_ids as string[]);
    } else {
      setReferencedMsgIds([]);
    }
  }, []);

  const handleNavigate = useCallback(
    async (ref: { type?: string; id: string; conversation_id?: string }) => {
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
    },
    [currentConversation, conversations, selectConversation]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
    setInputValue('');
    setAttachments([]);
    setReferencedConvIds([]);
    setReferencedMsgIds([]);
  }, []);

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <ChatSidebar
        loading={loading}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredConversations={filteredConversations}
        currentConversation={currentConversation}
        handleNewConversation={handleNewConversation}
        handleOpenModelSelector={handleOpenModelSelector}
        handleSelectConversation={handleSelectConversation}
        handleRenameConversation={handleRenameConversation}
        handleDeleteConversation={handleDeleteConversation}
        handleBulkDeleteConversations={bulkDeleteConversations}
        handleLogout={handleLogout}
        user={user}
        isConnected={isConnected}
        collapsed={sidebarCollapsed}
      />

      <Layout style={{ height: '100vh' }}>
        <Content
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: '#ffffff',
            minWidth: 0,
            height: '100%',
          }}
        >
          {error && (
            <div style={{ padding: '16px 16px 0 16px' }}>
              <Alert
                title="Error"
                description={error}
                type="error"
                showIcon
                closable
                onClose={() => setError(null)}
              />
            </div>
          )}

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
            }}
          >
            {!currentConversation ? (
              <>
                {/* Header for Welcome Screen */}
                <div
                  style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid #E2E8F0',
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Tooltip title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}>
                    <Button
                      type="text"
                      size="small"
                      icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                      onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    />
                  </Tooltip>
                </div>
                <WelcomeScreen onSend={handleSend} onNewConversation={handleNewConversation} />
              </>
            ) : (
              <div
                key={currentConversation.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                }}
              >
                {/* Chat Header with Model Info */}
                <div
                  style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid #E2E8F0',
                    background: '#ffffff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Tooltip title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}>
                      <Button
                        type="text"
                        size="small"
                        icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                      />
                    </Tooltip>
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
                                    onChange={(e) => (newTitle = e.target.value)}
                                    placeholder="Enter new title"
                                    style={{ marginTop: 16 }}
                                  />
                                ),
                                onOk: async () => {
                                  if (newTitle && newTitle.trim()) {
                                    await handleRenameConversation(
                                      currentConversation.id,
                                      newTitle
                                    );
                                  }
                                },
                              });
                            }}
                          />
                        </Tooltip>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginTop: '4px',
                        }}
                      >
                        <Tag icon={<ThunderboltOutlined />} color="blue">
                          {currentConversation.provider}
                        </Tag>
                        {currentConversation.provider_name && (
                          <Tag color="purple">{currentConversation.provider_name}</Tag>
                        )}
                        <Tag color="cyan">{currentConversation.model}</Tag>
                      </div>
                    </div>
                  </div>
                  <Space orientation="horizontal" size="small">
                    <Tooltip title="New Chat">
                      <Button
                        icon={<PlusOutlined />}
                        onClick={handleNewConversation}
                        size="small"
                        type="text"
                      >
                        New Chat
                      </Button>
                    </Tooltip>
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
                    {currentConversation.provider === 'agent' && (
                      <Tooltip title="Configure Agent Parameters">
                        <Button
                          icon={<SettingOutlined />}
                          onClick={() => setShowAgentConfigPanel(!showAgentConfigPanel)}
                          size="small"
                          type={showAgentConfigPanel ? 'primary' : 'default'}
                        >
                          Agent Config
                        </Button>
                      </Tooltip>
                    )}
                  </Space>
                </div>

                {/* Messages Area */}
                <MessageArea
                  currentConversation={currentConversation}
                  scrollContainerRef={scrollContainerRef}
                  isStreaming={isStreaming}
                  streamingMessage={streamingMessage}
                  loading={loading}
                  chatMessages={chatMessages}
                  handleEdit={handleEdit}
                  toggleMessageReference={toggleMessageReference}
                  referencedMsgIds={referencedMsgIds}
                  handleNavigate={handleNavigate}
                  handleSend={handleSend}
                  regenerateResponse={regenerateResponse}
                  handlePlayMessage={handlePlayMessage}
                  playingMessageId={playingMessageId}
                  imageProgress={
                    imageProgress?.conversation_id === currentConversation?.id
                      ? imageProgress
                      : null
                  }
                  messagesEndRef={messagesEndRef}
                />
              </div>
            )}

            {/* Common Input Area */}
            <div
              style={{
                borderTop: '1px solid #E2E8F0',
                background: '#ffffff',
                padding: '16px 24px',
                width: '100%',
                boxSizing: 'border-box',
                flexShrink: 0,
              }}
            >
              <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
                {/* Attachments and References List */}
                {(attachments.length > 0 ||
                  referencedConvIds.length > 0 ||
                  referencedMsgIds.length > 0) && (
                  <div
                    style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}
                  >
                    {attachments.map((file) => (
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
                    {referencedConvIds.map((id) => {
                      const conv = conversations.find((c: Conversation) => c.id === id);
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
                    {referencedMsgIds.map((id) => {
                      const msg = messages.find((m) => m.id === id);
                      return (
                        <Tag
                          key={id}
                          closable
                          onClose={() => removeMessageReference(id)}
                          icon={<LinkOutlined />}
                          color="cyan"
                          style={{ padding: '4px 8px', borderRadius: '6px' }}
                        >
                          Message: {msg?.content?.substring(0, 20)}...
                        </Tag>
                      );
                    })}
                    <Button
                      type="text"
                      size="small"
                      danger
                      onClick={() => {
                        setAttachments([]);
                        setReferencedConvIds([]);
                        setReferencedMsgIds([]);
                      }}
                      style={{ fontSize: '12px' }}
                    >
                      Clear All
                    </Button>
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
                  onOptimizeClick={() => setShowPromptOptimizer(true)}
                  referencedCount={referencedConvIds.length + referencedMsgIds.length}
                />
              </div>
            </div>
          </div>
        </Content>

        {/* Agent Configuration Panel */}
        {currentConversation && currentConversation.provider === 'agent' && (
          <AgentConfigPanel
            visible={showAgentConfigPanel}
            onClose={() => setShowAgentConfigPanel(false)}
            provider={currentConversation.provider}
            modelId={currentConversation.model}
            modelName={currentConversation.model}
            conversationId={currentConversation.id}
          />
        )}
      </Layout>

      {/* Reference Conversations Modal */}
      {showReferenceModal && (
        <ReferenceModal
          open={showReferenceModal}
          onOk={() => setShowReferenceModal(false)}
          onCancel={() => setShowReferenceModal(false)}
          searchQuery={searchQuery}
          onSearch={(value) => search(value, 'messages')}
          isSearching={isSearching}
          searchResults={searchResults}
          conversations={conversations}
          currentConversationId={currentConversation?.id}
          referencedConvIds={referencedConvIds}
          referencedMsgIds={referencedMsgIds}
          toggleReference={toggleReference}
          toggleMessageReference={toggleMessageReference}
        />
      )}

      {/* Image Generation Modal */}
      {showImageModal && (
        <ImageGenerationModal
          open={showImageModal}
          onOk={handleGenerateImage}
          onCancel={() => setShowImageModal(false)}
          confirmLoading={isGeneratingImage}
          imagePrompt={imagePrompt}
          setImagePrompt={setImagePrompt}
          selectedImageModel={selectedImageModel}
          setSelectedImageModel={setSelectedImageModel}
          imageModels={imageModels}
          error={error}
        />
      )}

      {/* Model Selector Modal */}
      {showModelSelector && (
        <ModelSettingsModal
          open={showModelSelector}
          onOk={currentConversation ? handleUpdateModel : handleCreateWithModel}
          onCancel={() => setShowModelSelector(false)}
          currentConversation={currentConversation}
          accessToken={accessToken}
          selectedProvider={selectedProvider}
          selectedModel={selectedModel}
          onSelectModel={(provider, model) => {
            setSelectedProvider(provider);
            setSelectedModel(model);
          }}
          selectedVoice={selectedVoice}
          setSelectedVoice={setSelectedVoice}
        />
      )}

      {/* Prompt Optimizer Modal */}
      <PromptOptimizer
        visible={showPromptOptimizer}
        onClose={() => setShowPromptOptimizer(false)}
        onApply={(optimized) => setInputValue(optimized)}
        initialPrompt={inputValue}
      />

      {/* Agent Configuration Modal */}
      <AgentConfigModal
        visible={showAgentConfigModal}
        onClose={() => setShowAgentConfigModal(false)}
        provider={selectedProvider}
        modelId={selectedModel}
        conversationId={currentConversation?.id}
      />
    </Layout>
  );
}
