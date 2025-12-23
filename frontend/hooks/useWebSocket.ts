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
  follow_ups?: string[];
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
  onTranscriptionResult?: (data: { text: string }) => void;
  onTTSResult?: (data: { audio: string; message_id?: string }) => void;
  onUserTyping?: (data: { conversation_id: string; user_id: string; is_typing: boolean }) => void;
  onImageProgress?: (data: { 
    conversation_id: string; 
    step: number; 
    total_steps: number; 
    progress: number; 
    preview?: string;
    image_url?: string;
    message?: string;
  }) => void;
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
  onTranscriptionResult,
  onTTSResult,
  onUserTyping,
  onImageProgress,
}: UseWebSocketProps) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const currentConversationRef = useRef<string | null>(null);

  // Use refs for handlers to avoid closure problems and unnecessary re-connections
  const handlersRef = useRef({
    onConnected,
    onDisconnected,
    onError,
    onStreamStart,
    onStreamChunk,
    onStreamEnd,
    onMessageResponse,
    onTranscriptionResult,
    onTTSResult,
    onUserTyping,
    onImageProgress,
  });

  // Update handlers ref when they change
  useEffect(() => {
    handlersRef.current = {
      onConnected,
      onDisconnected,
      onError,
      onStreamStart,
      onStreamChunk,
      onStreamEnd,
      onMessageResponse,
      onTranscriptionResult,
      onTTSResult,
      onUserTyping,
      onImageProgress,
    };
  }, [
    onConnected,
    onDisconnected,
    onError,
    onStreamStart,
    onStreamChunk,
    onStreamEnd,
    onMessageResponse,
    onTranscriptionResult,
    onTTSResult,
    onUserTyping,
    onImageProgress,
  ]);

  // Keep ref in sync with state
  useEffect(() => {
    currentConversationRef.current = currentConversation;
  }, [currentConversation]);

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

    // Register ALL event handlers IMMEDIATELY after socket creation
    // This ensures they're ready before any events arrive
    
    // Message handlers - REGISTER FIRST before connection handlers
    socket.on('stream_start', (data) => {
      console.log('🚀 Stream started:', data);
      handlersRef.current.onStreamStart?.(data);
    });

    socket.on('stream_chunk', (chunk: StreamChunk) => {
      console.log('📦 Stream chunk received:', chunk);
      handlersRef.current.onStreamChunk?.(chunk);
    });

    socket.on('stream_end', (data) => {
      console.log('✅ Stream ended:', data);
      handlersRef.current.onStreamEnd?.(data);
    });

    socket.on('message_response', (data) => {
      console.log('📩 Message response:', data);
      handlersRef.current.onMessageResponse?.(data);
    });

    socket.on('message_received', (data) => {
      console.log('📨 Message received acknowledgment:', data);
    });

    socket.on('transcription_result', (data) => {
      console.log('🎙️ Transcription result:', data);
      handlersRef.current.onTranscriptionResult?.(data);
    });

    socket.on('tts_result', (data) => {
      console.log('🔊 TTS result received');
      handlersRef.current.onTTSResult?.(data);
    });

    socket.on('user_typing', (data) => {
      handlersRef.current.onUserTyping?.(data);
    });

    socket.on('image_progress', (data) => {
      console.log('🖼️ Socket event: image_progress', data);
      handlersRef.current.onImageProgress?.(data);
    });

    // Connection handlers - AFTER message handlers
    socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
      
      // Re-join current conversation on reconnect
      if (currentConversationRef.current) {
        console.log(`🔄 Re-joining conversation: ${currentConversationRef.current}`);
        socket.emit('join_conversation', { conversation_id: currentConversationRef.current });
      }
    });

    socket.on('connected', (data) => {
      console.log('✅ Authenticated:', data);
      handlersRef.current.onConnected?.();
    });

    socket.on('disconnect', () => {
      console.log('👋 WebSocket disconnected');
      setIsConnected(false);
      handlersRef.current.onDisconnected?.();
    });

    socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      handlersRef.current.onError?.(error);
    });

    // Set socket ref AFTER all handlers are registered
    socketRef.current = socket;
    
    // Expose socket for debugging
    if (typeof window !== 'undefined') {
      (window as any).socket = socket;
    }

    // Cleanup
    return () => {
      socket.disconnect();
      if (typeof window !== 'undefined') {
        delete (window as any).socket;
      }
    };
  }, [token]);

  // Join conversation
  const joinConversation = useCallback(async (conversationId: string) => {
    setCurrentConversation(conversationId);
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('join_conversation', { conversation_id: conversationId });
      console.log(`📥 Joined conversation: ${conversationId}`);
      
      // Wait a moment to ensure backend processes the join before allowing messages
      await new Promise(resolve => setTimeout(resolve, 200));
      console.log(`✓ Ready to send messages in: ${conversationId}`);
    } else {
      console.log(`⏳ Queued join for conversation: ${conversationId} (waiting for connection)`);
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
    (
      conversationId: string, 
      message: string, 
      stream: boolean = true, 
      attachments: any[] = [],
      referenced_conv_ids: string[] = [],
      referenced_msg_ids: string[] = [],
      regenerate: boolean = false
    ) => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('send_message', {
          conversation_id: conversationId,
          message,
          stream,
          attachments,
          referenced_conv_ids,
          referenced_msg_ids,
          regenerate
        });
        console.log(`💬 Sent message to ${conversationId}:`, message.substring(0, 50));
        if (attachments.length > 0) {
          console.log(`📎 With ${attachments.length} attachments`);
        }
        if (referenced_conv_ids.length > 0) {
          console.log(`🔗 Referencing ${referenced_conv_ids.length} conversations`);
        }
        if (referenced_msg_ids.length > 0) {
          console.log(`📍 Referencing ${referenced_msg_ids.length} specific messages`);
        }
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

  // Stop generation
  const stopGeneration = useCallback(
    (conversationId: string) => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('stop_generation', {
          conversation_id: conversationId,
        });
        console.log(`🛑 Stop generation requested for ${conversationId}`);
      }
    },
    []
  );

  // Transcribe audio
  const transcribeAudio = useCallback(
    (base64Audio: string, language?: string) => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('transcribe_audio', {
          audio: base64Audio,
          language,
        });
      }
    },
    []
  );

  // Text to speech
  const textToSpeech = useCallback(
    (text: string, messageId?: string, voice?: string) => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('text_to_speech', {
          text,
          message_id: messageId,
          voice,
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
    stopGeneration,
    transcribeAudio,
    textToSpeech,
  };
}
