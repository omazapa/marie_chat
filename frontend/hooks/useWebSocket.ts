import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Message, StreamChunk, Attachment } from '@/types';

interface UseWebSocketProps {
  token: string | null;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: unknown) => void;
  onStreamStart?: (data: { conversation_id: string }) => void;
  onStreamChunk?: (chunk: StreamChunk) => void;
  onStreamEnd?: (data: { conversation_id: string; message?: Message }) => void;
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
  onImageError?: (data: { conversation_id: string; error: string; message?: string }) => void;
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
  onImageError,
}: UseWebSocketProps) {
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
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
    onImageError,
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
      onImageError,
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
    onImageError,
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
      transports: ['polling'],
      upgrade: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Message handlers - REGISTER FIRST before connection handlers
    socket.on('stream_start', (data) => {
      handlersRef.current.onStreamStart?.(data);
    });

    socket.on('stream_chunk', (chunk: StreamChunk) => {
      handlersRef.current.onStreamChunk?.(chunk);
    });

    socket.on('stream_end', (data) => {
      handlersRef.current.onStreamEnd?.(data);
    });

    socket.on('message_response', (data) => {
      handlersRef.current.onMessageResponse?.(data);
    });

    socket.on('message_received', (data) => {
      // Message acknowledged
    });

    socket.on('transcription_result', (data) => {
      handlersRef.current.onTranscriptionResult?.(data);
    });

    socket.on('tts_result', (data) => {
      handlersRef.current.onTTSResult?.(data);
    });

    socket.on('user_typing', (data) => {
      handlersRef.current.onUserTyping?.(data);
    });

    socket.on('image_progress', (data) => {
      handlersRef.current.onImageProgress?.(data);
    });

    socket.on('image_error', (data) => {
      console.error('❌ Socket event: image_error', data);
      handlersRef.current.onImageError?.(data);
    });

    // Connection handlers - AFTER message handlers
    socket.on('connect', () => {
      setIsConnected(true);
      setSocket(socket);

      // Re-join current conversation on reconnect
      if (currentConversationRef.current) {
        socket.emit('join_conversation', { conversation_id: currentConversationRef.current });
      }
    });

    socket.on('connected', (data) => {
      handlersRef.current.onConnected?.();
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      handlersRef.current.onDisconnected?.();
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message, error);
      handlersRef.current.onError?.(error);
    });

    socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      // If error is an empty object, it might be a non-serializable Error object
      if (error && typeof error === 'object' && Object.keys(error).length === 0) {
        console.error(
          '   Note: Error object appears empty. This often happens with connection rejections or CORS issues.'
        );
      }
      handlersRef.current.onError?.(error);
    });

    // Set socket ref AFTER all handlers are registered
    socketRef.current = socket;

    // Expose socket for debugging
    if (typeof window !== 'undefined') {
      (window as unknown as { socket: Socket }).socket = socket;
    }

    // Cleanup
    return () => {
      socket.disconnect();
      if (typeof window !== 'undefined') {
        delete (window as unknown as { socket?: Socket }).socket;
      }
    };
  }, [token]);

  // Join conversation
  const joinConversation = useCallback(async (conversationId: string) => {
    setCurrentConversation(conversationId);
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('join_conversation', { conversation_id: conversationId });
      // Joined conversation

      // Wait a moment to ensure backend processes the join before allowing messages
      await new Promise((resolve) => setTimeout(resolve, 200));
      // Ready to send messages
    } else {
      // Queued join for conversation (waiting for connection)
    }
  }, []);

  // Leave conversation
  const leaveConversation = useCallback(
    (conversationId: string) => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('leave_conversation', { conversation_id: conversationId });
        if (currentConversation === conversationId) {
          setCurrentConversation(null);
        }
        // Left conversation
      }
    },
    [currentConversation]
  );

  // Send message
  const sendMessage = useCallback(
    (
      conversationId: string,
      message: string,
      stream: boolean = true,
      attachments: Attachment[] = [],
      referenced_conv_ids: string[] = [],
      referenced_msg_ids: string[] = [],
      regenerate: boolean = false,
      workflow?: string
    ) => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('send_message', {
          conversation_id: conversationId,
          message,
          stream,
          attachments,
          referenced_conv_ids,
          referenced_msg_ids,
          regenerate,
          workflow,
        });
      } else {
        console.error('❌ Socket not connected');
      }
    },
    []
  );

  // Typing indicator
  const setTyping = useCallback((conversationId: string, isTyping: boolean) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('typing', {
        conversation_id: conversationId,
        is_typing: isTyping,
      });
    }
  }, []);

  // Stop generation
  const stopGeneration = useCallback((conversationId: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('stop_generation', {
        conversation_id: conversationId,
      });
    }
  }, []);

  // Transcribe audio
  const transcribeAudio = useCallback((base64Audio: string, language?: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('transcribe_audio', {
        audio: base64Audio,
        language,
      });
    }
  }, []);

  // Text to speech
  const textToSpeech = useCallback((text: string, messageId?: string, voice?: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('text_to_speech', {
        text,
        message_id: messageId,
        voice,
      });
    }
  }, []);

  return {
    socket,
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
