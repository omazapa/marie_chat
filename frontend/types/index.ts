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
  provider_id?: string;
  provider_name?: string;
  system_prompt?: string;
  settings?: Record<string, unknown>;
  message_count: number;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
  highlight_title?: string;
  highlight_message?: string;
}

export interface Attachment {
  file_id: string;
  filename: string;
  content_type: string;
  size: number;
  url?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens_used?: number;
  metadata?: Record<string, unknown>;
  file_ids?: string[];
  referenced_conversation_ids?: string[];
  created_at: string;
  highlight?: string;
}

export interface StreamChunk {
  conversation_id: string;
  content: string;
  done: boolean;
  follow_ups?: string[];
}

export interface Model {
  id: string;
  name: string;
  provider: string;
  description?: string;
  context_length?: number;
  max_tokens?: number;
  parameters?: string;
  quantization?: string;
  size?: string;
  capabilities?: string[];
  metadata?: Record<string, unknown>;
}

export interface ModelsResponse {
  models: Record<string, Model[]>;
  total: number;
}

export interface ProviderHealth {
  provider: string;
  status: string;
  available: boolean;
  models_count?: number;
  supports_streaming?: boolean;
  supports_embeddings?: boolean;
  default_model?: string;
  error?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface Provider {
  id: string;
  name: string;
  type: 'ollama' | 'openai' | 'huggingface' | 'agent';
  enabled: boolean;
  config: {
    base_url?: string;
    api_key?: string;
    [key: string]: string | number | boolean | undefined;
  };
  status?: {
    available: boolean;
    models_count?: number;
    error?: string;
  };
}

export interface ProviderConfig {
  api_key?: string;
  base_url?: string;
}

export interface SystemSettings {
  llm: {
    default_provider: string;
    default_provider_type?: string;
    default_provider_id?: string;
    default_model: string;
    default_system_prompt?: string;
  };
  image: {
    default_model: string;
    use_local: boolean;
  };
  stt: {
    model_size: string;
  };
  tts: {
    default_voices: Record<string, string>;
  };
  white_label: {
    app_name: string;
    primary_color: string;
    registration_enabled: boolean;
    app_logo: string;
    app_icon: string;
    welcome_title: string;
    welcome_subtitle: string;
    suggested_prompts: string[];
  };
  providers: Provider[];
}

export interface ProviderStatus {
  available: boolean;
  models_count?: number;
  error?: string;
  [key: string]: unknown;
}
