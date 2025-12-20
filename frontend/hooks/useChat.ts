'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { apiClient } from '@/lib/api';
import { Message, Conversation } from '@/lib/types';
import { useAuthStore } from '@/stores/authStore';

interface UseChatReturn {
  messages: Message[];
  conversation: Conversation | null;
  isTyping: boolean;
  error: string | null;
  sendMessage: (content: string, conversationId?: string) => void;
  loadConversation: (conversationId: string) => Promise<void>;
  createConversation: () => Promise<string | null>;
}

export function useChat(conversationId?: string): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuthStore();
  const currentMessageRef = useRef<string>('');

  // Load conversation and messages
  const loadConversation = useCallback(async (id: string) => {
    try {
      const [convResponse, messagesResponse] = await Promise.all([
        apiClient.getConversation(id),
        apiClient.getMessages(id),
      ]);

      if (convResponse.data) {
        setConversation(convResponse.data.conversation);
      }

      if (messagesResponse.data) {
        setMessages(messagesResponse.data.messages);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversation');
    }
  }, []);

  // Create new conversation
  const createConversation = useCallback(async () => {
    try {
      const response = await apiClient.createConversation({
        title: 'New Conversation',
        model: 'llama3.2',
        provider: 'ollama',
      });

      if (response.data?.conversation) {
        setConversation(response.data.conversation);
        setMessages([]);
        return response.data.conversation.id;
      }
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create conversation');
      return null;
    }
  }, []);

  // Send message
  const sendMessage = useCallback(
    async (content: string, convId?: string) => {
      if (!isAuthenticated) {
        setError('Not authenticated');
        return;
      }

      const socket = getSocket();
      if (!socket || !socket.connected) {
        setError('Socket not connected');
        return;
      }

      let targetConvId = convId || conversation?.id;
      if (!targetConvId) {
        targetConvId = await createConversation();
        if (!targetConvId) {
          setError('Failed to create conversation');
          return;
        }
      }

      setError(null);
      currentMessageRef.current = '';
      setIsTyping(true);

      // Add user message immediately
      const userMessage: Message = {
        id: `temp_${Date.now()}`,
        conversation_id: targetConvId,
        user_id: '',
        role: 'user',
        content: content,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Send via socket
      socket.emit('send_message', {
        conversation_id: targetConvId,
        content: content,
        model: conversation?.model || 'llama3.2',
        provider: conversation?.provider || 'ollama',
      });
    },
    [isAuthenticated, conversation, createConversation]
  );

  // Setup socket listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = getSocket();
    if (!socket) return;

    const handleMessageChunk = (data: { chunk: string; conversation_id: string }) => {
      setIsTyping(true);
      currentMessageRef.current += data.chunk;

      // Update or create assistant message
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === 'assistant' && lastMsg.id.startsWith('temp_')) {
          return [
            ...prev.slice(0, -1),
            { ...lastMsg, content: currentMessageRef.current },
          ];
        } else {
          const newMessage: Message = {
            id: `temp_${Date.now()}`,
            conversation_id: data.conversation_id,
            user_id: '',
            role: 'assistant',
            content: currentMessageRef.current,
            created_at: new Date().toISOString(),
          };
          return [...prev, newMessage];
        }
      });
    };

    const handleMessageComplete = (data: { message: Message; conversation_id: string }) => {
      setIsTyping(false);
      currentMessageRef.current = '';

      // Replace temp message with actual message
      setMessages((prev) => {
        const filtered = prev.filter((msg) => !msg.id.startsWith('temp_'));
        return [...filtered, data.message];
      });

      if (conversation?.id !== data.conversation_id) {
        loadConversation(data.conversation_id);
      }
    };

    const handleTypingStart = () => {
      setIsTyping(true);
    };

    const handleTypingStop = () => {
      setIsTyping(false);
    };

    const handleError = (data: { message: string }) => {
      setError(data.message);
      setIsTyping(false);
    };

    socket.on('message_chunk', handleMessageChunk);
    socket.on('message_complete', handleMessageComplete);
    socket.on('typing_start', handleTypingStart);
    socket.on('typing_stop', handleTypingStop);
    socket.on('error', handleError);

    return () => {
      socket.off('message_chunk', handleMessageChunk);
      socket.off('message_complete', handleMessageComplete);
      socket.off('typing_start', handleTypingStart);
      socket.off('typing_stop', handleTypingStop);
      socket.off('error', handleError);
    };
  }, [isAuthenticated, conversation, loadConversation]);

  // Load conversation on mount if conversationId provided
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    }
  }, [conversationId, loadConversation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  return {
    messages,
    conversation,
    isTyping,
    error,
    sendMessage,
    loadConversation,
    createConversation,
  };
}

