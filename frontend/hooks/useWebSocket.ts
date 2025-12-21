import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens_used?: number;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface StreamChunk {
  conversation_id: string;
  content: string;
  done: boolean;
}

interface UseWebSocketProps {
  token: string | null;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: any) => void;
  onStreamStart?: (data: { conversation_id: string }) => void;
  onStreamChunk?: (chunk: StreamChunk) => void;
  onStreamEnd?: (data: { conversation_id: string }) => void;
  onMessageResponse?: (data: { conversation_id: string; message: Message }) => void;
}

export function useWebSocket({
  token,
  onConnected,
  onDisconnected,
  onError,
  onStreamStart,
  onStreamChunk,
  onStreamEnd,
  onMessageResponse,
}: UseWebSocketProps) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!token) {
      return;
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    const socket = io(API_URL, {
      auth: { token },
      query: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Connection handlers
    socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
    });

    socket.on('connected', (data) => {
      console.log('✅ Authenticated:', data);
      onConnected?.();
    });

    socket.on('disconnect', () => {
      console.log('👋 WebSocket disconnected');
      setIsConnected(false);
      onDisconnected?.();
    });

    socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      onError?.(error);
    });

    // Message handlers
    socket.on('message_received', (data) => {
      console.log('📨 Message received acknowledgment:', data);
    });

    socket.on('stream_start', (data) => {
      console.log('🚀 Stream started:', data);
      onStreamStart?.(data);
    });

    socket.on('stream_chunk', (chunk: StreamChunk) => {
      onStreamChunk?.(chunk);
    });

    socket.on('stream_end', (data) => {
      console.log('✅ Stream ended:', data);
      onStreamEnd?.(data);
    });

    socket.on('message_response', (data) => {
      console.log('📩 Message response:', data);
      onMessageResponse?.(data);
    });

    // Cleanup
    return () => {
      socket.disconnect();
    };
  }, [token]);

  // Join conversation
  const joinConversation = useCallback((conversationId: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('join_conversation', { conversation_id: conversationId });
      setCurrentConversation(conversationId);
      console.log(`📥 Joined conversation: ${conversationId}`);
    }
  }, []);

  // Leave conversation
  const leaveConversation = useCallback((conversationId: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('leave_conversation', { conversation_id: conversationId });
      if (currentConversation === conversationId) {
        setCurrentConversation(null);
      }
      console.log(`📤 Left conversation: ${conversationId}`);
    }
  }, [currentConversation]);

  // Send message
  const sendMessage = useCallback(
    (conversationId: string, message: string, stream: boolean = true) => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('send_message', {
          conversation_id: conversationId,
          message,
          stream,
        });
        console.log(`💬 Sent message to ${conversationId}:`, message.substring(0, 50));
      } else {
        console.error('❌ Socket not connected');
      }
    },
    []
  );

  // Typing indicator
  const setTyping = useCallback(
    (conversationId: string, isTyping: boolean) => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('typing', {
          conversation_id: conversationId,
          is_typing: isTyping,
        });
      }
    },
    []
  );

  return {
    socket: socketRef.current,
    isConnected,
    currentConversation,
    joinConversation,
    leaveConversation,
    sendMessage,
    setTyping,
  };
}
