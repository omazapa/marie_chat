import { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { useWebSocket, Message, StreamChunk } from './useWebSocket';

const API_BASE = 'http://localhost:5000/api';

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  model: string;
  provider: string;
  system_prompt?: string;
  settings?: Record<string, any>;
  message_count: number;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
}

export function useChat(token: string | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  
  // Use ref to keep track of current conversation for callbacks
  const currentConversationRef = useRef<Conversation | null>(null);
  
  // Update ref when state changes
  useEffect(() => {
    currentConversationRef.current = currentConversation;
  }, [currentConversation]);

  // WebSocket handlers
  const handleStreamStart = useCallback((data: { conversation_id: string }) => {
    if (currentConversationRef.current?.id === data.conversation_id) {
      setIsStreaming(true);
      setStreamingMessage('');
    }
  }, []);

  const handleStreamChunk = useCallback((chunk: StreamChunk) => {
    if (currentConversationRef.current?.id === chunk.conversation_id) {
      setStreamingMessage((prev) => prev + chunk.content);
    }
  }, []);

  const handleStreamEnd = useCallback(
    async (data: { conversation_id: string; message?: Message }) => {
      setIsStreaming(false);
      
      // Add the complete assistant message if provided
      if (data.message && currentConversationRef.current?.id === data.conversation_id) {
        const newMessage = { ...data.message };
        setMessages((prev) => {
          // Check if message already exists
          const exists = prev.some(m => m.id === newMessage.id);
          if (exists) {
            return prev;
          }
          return [...prev, newMessage];
        });
        setStreamingMessage('');
      } else if (currentConversationRef.current?.id === data.conversation_id) {
        // Fallback: if no message object but we have streaming content, 
        // we should probably keep it or convert it to a message
        console.warn('Stream ended without message object, keeping streaming content as fallback');
        // We don't clear streamingMessage here so it stays visible in the UI
        // until a real message replaces it or the user refreshes
      } else {
        setStreamingMessage('');
      }
    },
    []
  );

  const handleMessageResponse = useCallback(
    (data: { conversation_id: string; message: Message }) => {
      if (currentConversationRef.current?.id === data.conversation_id) {
        setMessages((prev) => [...prev, data.message]);
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
  } = useWebSocket({
    token,
    onStreamStart: handleStreamStart,
    onStreamChunk: handleStreamChunk,
    onStreamEnd: handleStreamEnd,
    onMessageResponse: handleMessageResponse,
    onError: (err) => setError(err.message),
  });

  // Stop generation
  const stopGeneration = useCallback(() => {
    const conv = currentConversationRef.current;
    if (conv) {
      wsStopGeneration(conv.id);
      setIsStreaming(false);
    }
  }, [wsStopGeneration]);

  // Send message
  const sendMessage = useCallback(
    async (content: string, attachments: any[] = []) => {
      const conv = currentConversationRef.current;
      if (!conv || !isConnected) {
        setError('Not connected to chat');
        return;
      }

      // Add user message to UI immediately
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        conversation_id: conv.id,
        user_id: 'current-user',
        role: 'user',
        content,
        metadata: attachments.length > 0 ? { attachments } : undefined,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Send via WebSocket
      wsSendMessage(conv.id, content, true, attachments);
    },
    [isConnected, wsSendMessage]
  );

  // Upload file
  const uploadFile = useCallback(
    async (file: File) => {
      if (!token) return null;

      try {
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(`${API_BASE}/files/upload`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });

        return response.data;
      } catch (err: any) {
        const errorMsg = err.response?.data?.error || 'Failed to upload file';
        setError(errorMsg);
        console.error('Error uploading file:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  // Edit and resend message
  const editMessage = useCallback(
    async (messageId: string, newContent: string) => {
      const conv = currentConversationRef.current;
      if (!conv || !isConnected) {
        setError('Not connected to chat');
        return;
      }

      // Find the message to edit
      const messageToEdit = messages.find(m => m.id === messageId);
      if (!messageToEdit) return;

      try {
        setLoading(true);
        // Truncate conversation at this message (inclusive)
        await axios.post(`${API_BASE}/conversations/${conv.id}/messages/truncate`, {
          timestamp: messageToEdit.created_at,
          inclusive: true
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Remove messages from state
        setMessages(prev => {
          const index = prev.findIndex(m => m.id === messageId);
          if (index === -1) return prev;
          return prev.slice(0, index);
        });

        // Send the new content
        await sendMessage(newContent);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to edit message');
      } finally {
        setLoading(false);
      }
    },
    [isConnected, messages, token, sendMessage]
  );

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations(response.data.conversations || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch conversations');
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Create conversation
  const createConversation = useCallback(
    async (title: string = 'New Conversation', model: string = 'llama3.2', provider: string = 'ollama') => {
      if (!token) {
        return null;
      }

      try {
        setLoading(true);
        const response = await axios.post(
          `${API_BASE}/conversations`,
          { title, model, provider },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const newConversation = response.data;
        setConversations((prev) => [newConversation, ...prev]);
        setError(null);
        return newConversation;
      } catch (err: any) {
        const errorMsg = err.response?.data?.error || 'Failed to create conversation';
        setError(errorMsg);
        console.error('Error creating conversation:', err);
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
        await axios.delete(`${API_BASE}/conversations/${conversationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setConversations((prev) => prev.filter((c) => c.id !== conversationId));
        if (currentConversation?.id === conversationId) {
          setCurrentConversation(null);
          setMessages([]);
        }
        setError(null);
        return true;
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to delete conversation');
        console.error('Error deleting conversation:', err);
        return false;
      }
    },
    [token, currentConversation]
  );

  // Update conversation
  const updateConversation = useCallback(
    async (conversationId: string, updates: Partial<Conversation>) => {
      if (!token) return false;

      try {
        await axios.patch(`${API_BASE}/conversations/${conversationId}`, updates, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setConversations((prev) =>
          prev.map((c) => (c.id === conversationId ? { ...c, ...updates } : c))
        );
        if (currentConversation?.id === conversationId) {
          setCurrentConversation((prev) => (prev ? { ...prev, ...updates } : null));
        }
        setError(null);
        return true;
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to update conversation');
        console.error('Error updating conversation:', err);
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
        const response = await axios.get(
          `${API_BASE}/conversations/${conversationId}/messages`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessages(response.data.messages || []);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch messages');
        console.error('Error fetching messages:', err);
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  // Select and join a conversation
  const selectConversation = useCallback(
    async (conversation: Conversation) => {
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
    },
    [currentConversation, wsJoinConversation, wsLeaveConversation, fetchMessages]
  );

  // Load conversations on mount
  useEffect(() => {
    if (token) {
      fetchConversations();
    }
  }, [token, fetchConversations]);

  return {
    // State
    conversations,
    currentConversation,
    messages,
    streamingMessage,
    isStreaming,
    loading,
    error,
    isConnected,

    // Actions
    fetchConversations,
    createConversation,
    deleteConversation,
    updateConversation,
    selectConversation,
    sendMessage,
    editMessage,
    uploadFile,
    setTyping,
    stopGeneration,
  };
}
