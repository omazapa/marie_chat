// Types for API responses and data structures

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role?: string;
  roles?: string[];
  permissions?: Record<string, boolean>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

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

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens_used?: number;
  metadata?: Record<string, any>;
  file_ids?: string[];
  referenced_conversation_ids?: string[];
  created_at: string;
}

export interface Model {
  id: string;
  name: string;
  provider: 'ollama' | 'huggingface';
  description?: string;
  parameters?: Record<string, any>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}
