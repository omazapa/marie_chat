import { useState, useCallback, useEffect, useRef } from 'react';
import apiClient, { getErrorMessage } from '../lib/api';
import { useWebSocket } from './useWebSocket';
import { Conversation, Message, StreamChunk, Attachment } from '@/types';

export function useChat(
  token: string | null,
  options?: { onTranscription?: (text: string) => void }
) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingMessages, setStreamingMessages] = useState<Record<string, string>>({});
  const [streamingStates, setStreamingStates] = useState<Record<string, boolean>>({});
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [ttsAudio, setTtsAudio] = useState<{ audio: string; message_id?: string } | null>(null);
  const [searchResults, setSearchResults] = useState<{
    conversations: Conversation[];
    messages: Message[];
  }>({ conversations: [], messages: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [imageProgress, setImageProgress] = useState<{
    conversation_id: string;
    progress: number;
    step: number;
    total_steps: number;
    preview?: string;
    image_url?: string;
    message?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use ref to keep track of current conversation for callbacks
  const currentConversationRef = useRef<Conversation | null>(null);

  // Update ref when state changes
  useEffect(() => {
    currentConversationRef.current = currentConversation;
  }, [currentConversation]);

  // WebSocket handlers
  const handleStreamStart = useCallback((data: { conversation_id: string }) => {
    setStreamingStates((prev) => ({ ...prev, [data.conversation_id]: true }));
    setStreamingMessages((prev) => ({ ...prev, [data.conversation_id]: '' }));
  }, []);

  const handleStreamChunk = useCallback((chunk: StreamChunk) => {
    if (chunk.content) {
      setStreamingMessages((prev) => ({
        ...prev,
        [chunk.conversation_id]: (prev[chunk.conversation_id] || '') + chunk.content,
      }));
    }

    // If we get follow-ups in a chunk, we can store them
    if (chunk.follow_ups && chunk.follow_ups.length > 0) {
      console.log('Follow-ups received in chunk:', chunk.follow_ups);
    }
  }, []);

  const handleStreamEnd = useCallback(
    async (data: { conversation_id: string; message?: Message }) => {
      setStreamingStates((prev) => ({ ...prev, [data.conversation_id]: false }));
      setStreamingMessages((prev) => {
        const next = { ...prev };
        delete next[data.conversation_id];
        return next;
      });

      // Add the complete assistant message if provided
      if (data.message && currentConversationRef.current?.id === data.conversation_id) {
        const newMessage = { ...data.message };
        setMessages((prev) => {
          // Check if message already exists
          const exists = prev.some((m) => m.id === newMessage.id);
          if (exists) {
            // Update existing message to ensure metadata (like follow-ups) is included
            return prev.map((m) => (m.id === newMessage.id ? newMessage : m));
          }
          return [...prev, newMessage];
        });
      }
    },
    []
  );

  const handleMessageResponse = useCallback(
    (data: { conversation_id: string; message: Message }) => {
      console.log('📩 Message response received in useChat:', data);
      if (currentConversationRef.current?.id === data.conversation_id) {
        setMessages((prev) => {
          // Check if message already exists
          const exists = prev.some((m) => m.id === data.message.id);
          if (exists) {
            console.log('⚠️ Message already exists, updating:', data.message.id);
            return prev.map((m) => (m.id === data.message.id ? data.message : m));
          }
          console.log('✅ Adding new message to state:', data.message.id);
          return [...prev, data.message];
        });
        // Clear image progress when the final message arrives
        setImageProgress(null);
      } else {
        console.warn(
          `⚠️ Message response for different conversation: ${data.conversation_id}. Current: ${currentConversationRef.current?.id}`
        );
      }
    },
    []
  );

  const handleImageProgress = useCallback(
    (data: {
      conversation_id: string;
      step: number;
      total_steps: number;
      progress: number;
      preview?: string;
      image_url?: string;
      message?: string;
    }) => {
      console.log(
        `🖼️ Image progress: ${data.progress}% for ${data.conversation_id}. Current: ${currentConversationRef.current?.id}`
      );
      if (currentConversationRef.current?.id === data.conversation_id) {
        setImageProgress(data);
      }
    },
    []
  );

  const handleTranscriptionResult = useCallback(
    (data: { text: string }) => {
      setIsTranscribing(false);
      if (data.text && options?.onTranscription) {
        options.onTranscription(data.text);
      }
    },
    [options]
  );

  const handleTTSResult = useCallback((data: { audio: string; message_id?: string }) => {
    setTtsAudio(data);
  }, []);

  const handleImageError = useCallback(
    (data: { conversation_id: string; error: string; message?: string }) => {
      console.error(`❌ Image error for ${data.conversation_id}: ${data.error}`);
      if (currentConversationRef.current?.id === data.conversation_id) {
        setImageProgress(null);
        setError(data.message || data.error);
      }
    },
    []
  );

  // Initialize WebSocket
  const {
    isConnected,
    joinConversation: wsJoinConversation,
    leaveConversation: wsLeaveConversation,
    sendMessage: wsSendMessage,
    setTyping,
    stopGeneration: wsStopGeneration,
    transcribeAudio: wsTranscribeAudio,
    textToSpeech: wsTextToSpeech,
  } = useWebSocket({
    token,
    onStreamStart: handleStreamStart,
    onStreamChunk: handleStreamChunk,
    onStreamEnd: handleStreamEnd,
    onMessageResponse: handleMessageResponse,
    onTranscriptionResult: handleTranscriptionResult,
    onTTSResult: handleTTSResult,
    onImageProgress: handleImageProgress,
    onImageError: handleImageError,
    onError: (err: any) => setError(err?.message || 'WebSocket error'),
  });

  // Stop generation
  const stopGeneration = useCallback(() => {
    const conv = currentConversationRef.current;
    if (conv) {
      wsStopGeneration(conv.id);
      // Clear streaming state for the current conversation
      setStreamingStates((prev) => ({ ...prev, [conv.id]: false }));
      setStreamingMessages((prev) => {
        const next = { ...prev };
        delete next[conv.id];
        return next;
      });
    }
  }, [wsStopGeneration]);

  // Send message
  const sendMessage = useCallback(
    async (
      content: string,
      attachments: Attachment[] = [],
      referenced_convs: { id: string; title: string }[] = [],
      referenced_msg_ids: string[] = [],
      conversationId?: string
    ) => {
      const conv = currentConversationRef.current;
      const targetConvId = conversationId || conv?.id;

      if (!targetConvId || !isConnected) {
        setError('Not connected to chat');
        return;
      }

      const referenced_conv_ids = referenced_convs.map((r) => r.id);

      // Add user message to UI immediately
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        conversation_id: targetConvId,
        user_id: 'current-user',
        role: 'user',
        content,
        metadata: {
          ...(attachments.length > 0 ? { attachments } : {}),
          ...(referenced_convs.length > 0 ? { references: referenced_convs } : {}),
          ...(referenced_conv_ids.length > 0 ? { referenced_conv_ids } : {}),
          ...(referenced_msg_ids.length > 0 ? { referenced_msg_ids } : {}),
        },
        created_at: new Date().toISOString(),
      };

      // Only update messages if we are in the target conversation
      if (targetConvId === conv?.id) {
        setMessages((prev) => [...prev, userMessage]);
      }

      setImageProgress(null);

      // Send via WebSocket
      wsSendMessage(
        targetConvId,
        content,
        true,
        attachments,
        referenced_conv_ids,
        referenced_msg_ids,
        false,
        conv?.settings?.workflow as string
      );
    },
    [isConnected, wsSendMessage]
  );

  // Regenerate response
  const regenerateResponse = useCallback(async () => {
    const conv = currentConversationRef.current;
    if (!conv || !isConnected) {
      setError('Not connected to chat');
      return;
    }

    // Find the last user message
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg) {
      setError('No user message to regenerate from');
      return;
    }

    // Remove the last assistant message from UI
    setMessages((prev) => {
      const newMessages = [...prev];
      if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'assistant') {
        newMessages.pop();
      }
      return newMessages;
    });

    // Send via WebSocket with regenerate flag
    const attachments = (lastUserMsg.metadata?.attachments as Attachment[]) || [];
    const referenced_conv_ids = (lastUserMsg.metadata?.referenced_conv_ids as string[]) || [];
    const referenced_msg_ids = (lastUserMsg.metadata?.referenced_msg_ids as string[]) || [];

    wsSendMessage(
      conv.id,
      lastUserMsg.content,
      true,
      attachments,
      referenced_conv_ids,
      referenced_msg_ids,
      true, // regenerate flag
      conv.settings?.workflow as string
    );
  }, [isConnected, messages, wsSendMessage]);

  // Upload file
  const uploadFile = useCallback(
    async (file: File) => {
      if (!token) return null;

      try {
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post('/files/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 300000, // 5 minutes for file uploads
        });

        return response.data;
      } catch (err: unknown) {
        const errorMsg = getErrorMessage(err, 'Failed to upload file');
        setError(errorMsg);
        console.error('Error uploading file:', errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  // Edit and resend message
  const editMessage = useCallback(
    async (
      messageId: string,
      newContent: string,
      attachments: Attachment[] = [],
      referenced_convs: { id: string; title: string }[] = [],
      referenced_msg_ids: string[] = []
    ) => {
      const conv = currentConversationRef.current;
      if (!conv || !isConnected) {
        setError('Not connected to chat');
        return;
      }

      // Find the message to edit
      const messageToEdit = messages.find((m) => m.id === messageId);
      if (!messageToEdit) return;

      try {
        setLoading(true);
        // Truncate conversation at this message (inclusive)
        await apiClient.post(`/conversations/${conv.id}/messages/truncate`, {
          timestamp: messageToEdit.created_at,
          inclusive: true,
        });

        // Remove messages from state
        setMessages((prev) => {
          const index = prev.findIndex((m) => m.id === messageId);
          if (index === -1) return prev;
          return prev.slice(0, index);
        });

        // Send the new content
        await sendMessage(newContent, attachments, referenced_convs, referenced_msg_ids);
      } catch (err: unknown) {
        const errorMsg = getErrorMessage(err, 'Failed to edit message');
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [isConnected, messages, sendMessage]
  );

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await apiClient.get('/conversations');
      setConversations(response.data.conversations || []);
      setError(null);
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to fetch conversations');
      setError(errorMsg);
      console.error('Error fetching conversations:', errorMsg);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Search conversations and messages
  const search = useCallback(
    async (
      query: string,
      scope: 'conversations' | 'messages' = 'conversations',
      conversationId?: string
    ) => {
      if (!token || !query) {
        setSearchResults({ conversations: [], messages: [] });
        return;
      }

      setIsSearching(true);
      try {
        const response = await apiClient.get('/conversations/search', {
          params: {
            q: query,
            scope,
            conversation_id: conversationId,
            limit: 20,
          },
        });

        if (scope === 'messages') {
          setSearchResults((prev) => ({ ...prev, messages: response.data.results }));
        } else {
          setSearchResults((prev) => ({ ...prev, conversations: response.data.results }));
        }
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to search');
      } finally {
        setIsSearching(false);
      }
    },
    [token]
  );

  // Create conversation
  const createConversation = useCallback(
    async (
      title: string = 'New Conversation',
      model: string = 'llama3.2',
      provider: string = 'ollama',
      systemPrompt?: string,
      settings?: Record<string, unknown>
    ) => {
      if (!token) {
        return null;
      }

      try {
        setLoading(true);
        const response = await apiClient.post('/conversations', {
          title,
          model,
          provider,
          system_prompt: systemPrompt,
          settings,
        });
        const newConversation = response.data;
        setConversations((prev) => [newConversation, ...prev]);
        setError(null);
        return newConversation;
      } catch (err: unknown) {
        const errorMsg = getErrorMessage(err, 'Failed to create conversation');
        setError(errorMsg);
        console.error('Error creating conversation:', errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  // Delete conversation
  const deleteConversation = useCallback(
    async (conversationId: string) => {
      if (!token) return false;

      try {
        await apiClient.delete(`/conversations/${conversationId}`);
        setConversations((prev) => prev.filter((c) => c.id !== conversationId));
        if (currentConversation?.id === conversationId) {
          setCurrentConversation(null);
          setMessages([]);
        }
        setError(null);
        return true;
      } catch (err: unknown) {
        const errorMsg = getErrorMessage(err, 'Failed to delete conversation');
        setError(errorMsg);
        console.error('Error deleting conversation:', errorMsg);
        return false;
      }
    },
    [token, currentConversation]
  );

  // Bulk delete conversations
  const bulkDeleteConversations = useCallback(
    async (conversationIds: string[]) => {
      if (!token || conversationIds.length === 0) return false;

      try {
        setLoading(true);
        await apiClient.post('/conversations/bulk-delete', { conversation_ids: conversationIds });

        setConversations((prev) => prev.filter((c) => !conversationIds.includes(c.id)));

        if (currentConversation && conversationIds.includes(currentConversation.id)) {
          setCurrentConversation(null);
          setMessages([]);
        }

        setError(null);
        return true;
      } catch (err: unknown) {
        const errorMsg = getErrorMessage(err, 'Failed to delete conversations');
        setError(errorMsg);
        console.error('Error bulk deleting conversations:', errorMsg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [token, currentConversation]
  );

  // Update conversation
  const updateConversation = useCallback(
    async (conversationId: string, updates: Partial<Conversation>) => {
      if (!token) return false;

      try {
        await apiClient.patch(`/conversations/${conversationId}`, updates);
        setConversations((prev) =>
          prev.map((c) => (c.id === conversationId ? { ...c, ...updates } : c))
        );
        if (currentConversation?.id === conversationId) {
          setCurrentConversation((prev) => (prev ? { ...prev, ...updates } : null));
        }
        setError(null);
        return true;
      } catch (err: unknown) {
        const errorMsg = getErrorMessage(err, 'Failed to update conversation');
        setError(errorMsg);
        console.error('Error updating conversation:', errorMsg);
        return false;
      }
    },
    [token, currentConversation]
  );

  // Fetch messages for a conversation
  const fetchMessages = useCallback(
    async (conversationId: string) => {
      if (!token) return;

      try {
        setLoading(true);
        const response = await apiClient.get(`/conversations/${conversationId}/messages`);
        setMessages(response.data.messages || []);
        setError(null);
      } catch (err: unknown) {
        const errorMsg = getErrorMessage(err, 'Failed to fetch messages');
        setError(errorMsg);
        console.error('Error fetching messages:', errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  // Select and join a conversation
  const selectConversation = useCallback(
    async (conversationOrId: Conversation | string) => {
      let conversation: Conversation | null = null;

      if (typeof conversationOrId === 'string') {
        // Try to find in existing conversations
        conversation = conversations.find((c) => c.id === conversationOrId) || null;

        // If not found, we might need to fetch it or create a partial one
        if (!conversation) {
          try {
            const response = await apiClient.get(`/conversations/${conversationOrId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            conversation = response.data;
          } catch (err: unknown) {
            console.error('Error fetching conversation by ID:', err);
            // Fallback: create a partial conversation object if we can't fetch it
            conversation = {
              id: conversationOrId,
              title: 'New Conversation',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              message_count: 0,
              model: 'unknown',
              provider: 'unknown',
              user_id: '',
            } as Conversation;
          }
        }
      } else {
        conversation = conversationOrId;
      }

      if (!conversation) return;

      // Leave current conversation
      if (currentConversation) {
        wsLeaveConversation(currentConversation.id);
      }

      // Set new conversation
      setCurrentConversation(conversation);

      // Join new conversation and wait for it to be ready
      await wsJoinConversation(conversation.id);

      // Fetch messages
      await fetchMessages(conversation.id);

      // Refresh conversation list to ensure the new one is there
      fetchConversations();
    },
    [
      currentConversation,
      conversations,
      token,
      wsJoinConversation,
      wsLeaveConversation,
      fetchMessages,
      fetchConversations,
    ]
  );

  // Load conversations on mount
  useEffect(() => {
    if (token) {
      fetchConversations();
    }
  }, [token, fetchConversations]);

  // Transcribe audio
  const transcribeAudio = useCallback(
    (base64Audio: string, language?: string) => {
      setIsTranscribing(true);
      wsTranscribeAudio(base64Audio, language);
    },
    [wsTranscribeAudio]
  );

  return {
    // State
    conversations,
    currentConversation,
    messages,
    streamingMessage: currentConversation ? streamingMessages[currentConversation.id] || '' : '',
    isStreaming: currentConversation ? streamingStates[currentConversation.id] || false : false,
    isTranscribing,
    ttsAudio,
    searchResults,
    isSearching,
    imageProgress,
    setImageProgress,
    loading,
    error,
    isConnected,
    setError,

    // Actions
    fetchConversations,
    fetchMessages,
    createConversation,
    deleteConversation,
    bulkDeleteConversations,
    updateConversation,
    selectConversation,
    sendMessage,
    editMessage,
    uploadFile,
    setTyping,
    stopGeneration,
    regenerateResponse,
    transcribeAudio,
    textToSpeech: wsTextToSpeech,
    setTtsAudio,
    search,
    setMessages,
  };
}
