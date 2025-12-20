'use client';

import { useState } from 'react';
import { Layout, Input, Button, Typography, Space } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { useChat } from '@/hooks/useChat';
import MessageList from './MessageList';
import ModelSelector from '@/components/sidebar/ModelSelector';

const { Content, Sider } = Layout;
const { TextArea } = Input;
const { Title } = Typography;

interface ChatContainerProps {
  conversationId?: string;
}

export default function ChatContainer({ conversationId }: ChatContainerProps) {
  const [inputValue, setInputValue] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('ollama');
  const [selectedModel, setSelectedModel] = useState('llama3.2');
  const { messages, isTyping, error, sendMessage } = useChat(conversationId);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    sendMessage(inputValue.trim(), conversationId, selectedProvider, selectedModel);
    setInputValue('');
  };

  const handleModelChange = (provider: string, model: string) => {
    setSelectedProvider(provider);
    setSelectedModel(model);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider width={250} style={{ background: '#fff', padding: '16px' }}>
        <Title level={4} style={{ marginBottom: '16px' }}>
          Configuration
        </Title>
        <ModelSelector
          onModelChange={handleModelChange}
          defaultProvider={selectedProvider}
          defaultModel={selectedModel}
        />
      </Sider>
      <Content
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          overflow: 'hidden',
        }}
      >
        <Title level={2} style={{ marginBottom: '24px' }}>
          Marie Chat
        </Title>

        {error && (
          <div style={{ color: 'red', marginBottom: '16px', padding: '12px', background: '#fff2f0', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        <div style={{ flex: 1, overflow: 'auto', marginBottom: '16px' }}>
          <MessageList messages={messages} isTyping={isTyping} />
        </div>

        <Space.Compact style={{ width: '100%' }}>
          <TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
            autoSize={{ minRows: 2, maxRows: 6 }}
            style={{ flex: 1 }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            loading={isTyping}
            size="large"
          >
            Send
          </Button>
        </Space.Compact>
      </Content>
    </Layout>
  );
}

