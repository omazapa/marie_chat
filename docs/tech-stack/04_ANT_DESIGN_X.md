# Ant Design X 2.1 - Complete Reference Guide

> **Last Updated:** January 3, 2026
> **Version:** Ant Design X 2.1.2 | Ant Design 6.1.3
> **MARIE Project Context**

---

## 📖 Table of Contents

1. [Overview](#overview)
2. [RICH Design Paradigm](#rich-design-paradigm)
3. [Core Components](#core-components)
4. [Conversations Component](#conversations-component)
5. [Bubble Component](#bubble-component)
6. [Prompts & Suggestions](#prompts--suggestions)
7. [Attachments & File Handling](#attachments--file-handling)
8. [Streaming & Real-time Updates](#streaming--real-time-updates)
9. [Theming & Customization](#theming--customization)
10. [Best Practices for MARIE](#best-practices-for-marie)

---

## Overview

### What is Ant Design X?

Ant Design X is **the first AI-native UI component library** built on the **RICH design paradigm**:

- **R**ole - Define AI persona and capabilities
- **I**ntention - Clarify user goals and expectations
- **C**onversation - Natural dialogue between human and AI
- **H**ybrid UI - Seamless blend of chat (LUI) and traditional GUI

### Key Philosophy

```
Traditional UI (GUI)          AI UI (LUI)              Hybrid (RICH)
─────────────────────         ────────────             ─────────────
• Click buttons               • Type messages          • Best of both
• Fill forms                  • Natural language       • Context-aware
• Navigate menus              • Conversational         • Task-adaptive
```

### Component Hierarchy

```
Conversations (Container)
├── Bubble (Message Display)
├── Prompts (Input Suggestions)
├── Attachments (File Management)
├── Sender (Input Area)
└── Welcome (Initial Screen)
```

---

## RICH Design Paradigm

### 1. **Role (R)** - Define AI Identity

```typescript
// Define what the AI can do
interface AIRole {
  name: string;
  capabilities: string[];
  personality: string;
  limitations: string[];
}

const marieRole: AIRole = {
  name: "MARIE",
  capabilities: [
    "Answer research questions",
    "Search scientific papers",
    "Generate LaTeX equations",
    "Create visualizations"
  ],
  personality: "Professional, helpful, concise",
  limitations: [
    "Cannot access external databases",
    "Cannot execute code"
  ]
};

// Display in Welcome screen
<Welcome
  icon={<RobotOutlined />}
  title="MARIE"
  description="Machine-Assisted Research Intelligent Environment"
  extra={
    <Space direction="vertical">
      <Text>I can help you with:</Text>
      <ul>
        {marieRole.capabilities.map(cap => (
          <li key={cap}>{cap}</li>
        ))}
      </ul>
    </Space>
  }
/>
```

### 2. **Intention (I)** - Clarify User Goals

```typescript
// Guide users to express clear intentions
<Prompts
  title="What would you like to explore?"
  items={[
    {
      key: 'search',
      description: 'Search for research papers',
      icon: <SearchOutlined />
    },
    {
      key: 'analyze',
      description: 'Analyze data or results',
      icon: <BarChartOutlined />
    },
    {
      key: 'generate',
      description: 'Generate equations or code',
      icon: <CodeOutlined />
    }
  ]}
  onItemClick={(item) => {
    // Pre-fill input with template
    setMessage(`I want to ${item.description}...`);
  }}
/>
```

### 3. **Conversation (C)** - Natural Dialogue

```typescript
// Maintain conversation context
interface ConversationContext {
  history: Message[];
  currentTopic: string;
  referencedDocs: string[];
}

// Show conversation flow
<Conversations
  items={messages.map(msg => ({
    key: msg.id,
    label: msg.content.substring(0, 50),
    timestamp: msg.created_at
  }))}
  activeKey={currentMessageId}
  onActiveChange={(key) => scrollToMessage(key)}
/>
```

### 4. **Hybrid UI (H)** - Blend Chat and GUI

```typescript
// Context-aware UI switching
function AdaptiveInterface({ taskType }: { taskType: string }) {
  // Complex tasks → Show GUI
  if (taskType === 'data-analysis') {
    return (
      <>
        <ChatInterface />
        <Drawer visible>
          <DataVisualizationPanel />
          <FilterControls />
          <ExportOptions />
        </Drawer>
      </>
    );
  }

  // Simple tasks → Pure chat
  return <ChatInterface />;
}
```

---

## Core Components

### Conversations Component

The **Conversations** component manages the chat interface lifecycle.

```typescript
import { Conversations } from '@ant-design/x';

function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([]);

  return (
    <Conversations
      // Message rendering
      items={messages.map(msg => ({
        key: msg.id,
        label: (
          <Bubble
            content={msg.content}
            avatar={msg.role === 'user' ? <UserAvatar /> : <AIAvatar />}
            placement={msg.role === 'user' ? 'end' : 'start'}
            typing={msg.isStreaming}
          />
        ),
        loading: msg.isStreaming,
      }))}

      // Input area
      renderMessagesExtra={() => (
        <Sender
          placeholder="Ask MARIE anything..."
          onSubmit={(message) => sendMessage(message)}
          onCancel={() => stopGeneration()}
          loading={isStreaming}
          // File upload support
          attachmentUpload={{
            beforeUpload: (file) => {
              return file.size < 10 * 1024 * 1024; // 10MB limit
            },
            onChange: (info) => {
              setAttachments(info.fileList);
            }
          }}
        />
      )}

      // Styling
      styles={{
        messages: {
          height: 'calc(100vh - 200px)',
          overflowY: 'auto'
        }
      }}
    />
  );
}
```

### Advanced Conversations Configuration

```typescript
<Conversations
  // Auto-scroll behavior
  scrollConfig={{
    autoScroll: true,
    smooth: true,
    threshold: 100 // Pixels from bottom to auto-scroll
  }}

  // Virtual scrolling for performance (1000+ messages)
  virtual={{
    height: 600,
    itemHeight: 100 // Average message height
  }}

  // Message grouping
  groupBy={(msg) => {
    const date = new Date(msg.created_at);
    return date.toLocaleDateString();
  }}

  // Empty state
  emptyRender={() => (
    <Welcome
      icon={<RobotOutlined />}
      title="Start a conversation"
      description="Ask me anything about your research"
    />
  )}
/>
```

---

## Bubble Component

The **Bubble** component displays individual messages with rich formatting.

### Basic Usage

```typescript
import { Bubble } from '@ant-design/x';

<Bubble
  // Content (supports React nodes)
  content="Hello! How can I help you today?"

  // Avatar
  avatar={<Avatar icon={<RobotOutlined />} />}

  // Placement
  placement="start" // 'start' for AI, 'end' for user

  // Loading/typing indicator
  typing={isStreaming}

  // Timestamp
  footer={<Text type="secondary">{formatTime(msg.created_at)}</Text>}

  // Actions
  actions={[
    {
      key: 'copy',
      icon: <CopyOutlined />,
      onClick: () => copyToClipboard(content)
    },
    {
      key: 'regenerate',
      icon: <ReloadOutlined />,
      onClick: () => regenerateResponse()
    }
  ]}

  // Custom styling
  styles={{
    content: {
      backgroundColor: '#f0f0f0',
      borderRadius: '12px',
      padding: '12px 16px'
    }
  }}
/>
```

### Rich Content in Bubbles

```typescript
// Markdown support
<Bubble
  content={(
    <MarkdownContent>
      {message.content}
    </MarkdownContent>
  )}
/>

// Code blocks with syntax highlighting
<Bubble
  content={(
    <div>
      <Text>Here's the solution:</Text>
      <SyntaxHighlighter language="python">
        {codeSnippet}
      </SyntaxHighlighter>
    </div>
  )}
/>

// Interactive elements
<Bubble
  content={(
    <>
      <Text>{message.content}</Text>
      <Space style={{ marginTop: 12 }}>
        <Button size="small" onClick={handleAccept}>
          Accept
        </Button>
        <Button size="small" onClick={handleModify}>
          Modify
        </Button>
      </Space>
    </>
  )}
/>
```

### Bubble Variants

```typescript
// Success message
<Bubble
  variant="success"
  content="Task completed successfully!"
  icon={<CheckCircleOutlined />}
/>

// Error message
<Bubble
  variant="error"
  content="Failed to generate response"
  icon={<CloseCircleOutlined />}
/>

// System message
<Bubble
  variant="borderless"
  content="Conversation started"
  styles={{
    content: {
      backgroundColor: 'transparent',
      textAlign: 'center',
      color: '#999'
    }
  }}
/>
```

---

## Prompts & Suggestions

### Prompt Suggestions

```typescript
import { Prompts } from '@ant-design/x';

<Prompts
  title="Suggested questions"
  items={[
    {
      key: '1',
      description: 'Explain quantum computing',
      icon: <QuestionCircleOutlined />
    },
    {
      key: '2',
      description: 'Search for recent papers on ML',
      icon: <SearchOutlined />
    },
    {
      key: '3',
      description: 'Generate a LaTeX equation',
      icon: <FunctionOutlined />
    }
  ]}
  onItemClick={(info) => {
    // Auto-fill input
    setInputValue(info.data.description);
    // Or immediately send
    sendMessage(info.data.description);
  }}

  // Styling
  wrap // Wrap to multiple lines if needed
  styles={{
    item: {
      borderRadius: '8px',
      padding: '8px 12px'
    }
  }}
/>
```

### Dynamic Suggestions

```typescript
// Context-aware suggestions
function SmartSuggestions({ conversationContext }: Props) {
  const suggestions = useMemo(() => {
    if (conversationContext.recentTopics.includes('machine-learning')) {
      return [
        'Explain neural networks',
        'Compare CNN vs RNN',
        'What is transfer learning?'
      ];
    }

    if (conversationContext.attachments.length > 0) {
      return [
        'Analyze this data',
        'Summarize the document',
        'Extract key insights'
      ];
    }

    return defaultSuggestions;
  }, [conversationContext]);

  return (
    <Prompts
      items={suggestions.map((s, i) => ({
        key: i,
        description: s
      }))}
      onItemClick={(info) => sendMessage(info.data.description)}
    />
  );
}
```

### Follow-up Suggestions

```typescript
// Show after AI response
{lastMessage.role === 'assistant' && (
  <Prompts
    title="Follow-up questions"
    items={lastMessage.followUps?.map((q, i) => ({
      key: i,
      description: q
    }))}
    size="small"
    wrap
  />
)}
```

---

## Attachments & File Handling

### File Upload

```typescript
import { Attachments } from '@ant-design/x';

<Attachments
  // File list
  items={files.map(file => ({
    uid: file.id,
    name: file.name,
    status: file.status, // 'uploading' | 'done' | 'error'
    percent: file.progress,
    thumbUrl: file.type.startsWith('image/') ? file.url : undefined
  }))}

  // Upload configuration
  beforeUpload={(file) => {
    // Validate file
    const isValid = file.size < 10 * 1024 * 1024; // 10MB
    if (!isValid) {
      message.error('File must be smaller than 10MB');
    }
    return isValid;
  }}

  onChange={(info) => {
    setFiles(info.fileList);

    if (info.file.status === 'done') {
      message.success(`${info.file.name} uploaded successfully`);
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} upload failed`);
    }
  }}

  // Custom upload
  customRequest={async ({ file, onProgress, onSuccess, onError }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        onUploadProgress: (e) => {
          onProgress({ percent: (e.loaded / e.total) * 100 });
        }
      });

      onSuccess(response.data);
    } catch (error) {
      onError(error);
    }
  }}

  // Drag and drop
  draggable
/>
```

### Preview Attachments

```typescript
// Image preview
<Attachments
  items={images}
  previewable
  onPreview={(file) => {
    setPreviewImage(file.url);
    setPreviewVisible(true);
  }}
/>

// Document preview
<Attachments
  items={documents}
  renderItem={(item) => (
    <Card size="small" onClick={() => openDocument(item)}>
      <FileTextOutlined />
      <Text>{item.name}</Text>
      <Text type="secondary">{formatFileSize(item.size)}</Text>
    </Card>
  )}
/>
```

---

## Streaming & Real-time Updates

### Typing Indicator

```typescript
// Show AI is "thinking"
<Bubble
  typing={isStreaming}
  content={streamingContent || "..."}
  avatar={<Avatar icon={<RobotOutlined />} />}
/>

// Custom typing animation
<Bubble
  content={
    isStreaming ? (
      <Space>
        <Spin size="small" />
        <Text type="secondary">Thinking...</Text>
      </Space>
    ) : (
      streamingContent
    )
  }
/>
```

### Smooth Streaming Updates

```typescript
function StreamingMessage({ messageId }: Props) {
  const [content, setContent] = useState('');
  const contentRef = useRef('');

  useEffect(() => {
    socket.on('stream_chunk', (data) => {
      if (data.message_id === messageId) {
        // Accumulate content
        contentRef.current += data.chunk;

        // Throttle updates for smooth animation
        requestAnimationFrame(() => {
          setContent(contentRef.current);
        });
      }
    });

    return () => socket.off('stream_chunk');
  }, [messageId]);

  return (
    <Bubble
      content={content}
      typing={!content.endsWith('[DONE]')}
    />
  );
}
```

### Progress Indicators

```typescript
// For long-running tasks
<Bubble
  content={(
    <>
      <Text>Generating image...</Text>
      <Progress
        percent={progress}
        steps={totalSteps}
        status={status}
      />
      {preview && <Image src={preview} width={200} />}
    </>
  )}
/>
```

---

## Theming & Customization

### Global Theme Configuration

```typescript
// app/layout.tsx
import { ConfigProvider } from 'antd';

const theme = {
  token: {
    // Primary color (MARIE brand)
    colorPrimary: '#1B4B73',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',

    // Radius
    borderRadius: 8,
    borderRadiusLG: 12,

    // Fonts
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: 14,
  },

  // Component-specific tokens
  components: {
    Conversations: {
      messagePadding: '12px 16px',
      bubbleMaxWidth: 600,
    },
    Bubble: {
      contentBg: '#f5f5f5',
      userBg: '#1B4B73',
      userColor: '#fff',
    }
  }
};

export default function RootLayout({ children }) {
  return (
    <ConfigProvider theme={theme}>
      {children}
    </ConfigProvider>
  );
}
```

### Component-Level Customization

```typescript
<Conversations
  styles={{
    // Container
    container: {
      backgroundColor: '#fafafa',
      borderRadius: '12px',
      padding: '16px',
    },

    // Messages area
    messages: {
      height: '600px',
      overflowY: 'auto',
      padding: '16px',
    },

    // Input area
    sender: {
      borderTop: '1px solid #f0f0f0',
      paddingTop: '16px',
    }
  }}

  // Class names for custom CSS
  className="custom-chat-container"
  classNames={{
    messages: 'custom-messages',
    sender: 'custom-sender'
  }}
/>
```

---

## Best Practices for MARIE

### 1. **Message Organization**

```typescript
// Group messages by date
function groupMessagesByDate(messages: Message[]) {
  const groups: Record<string, Message[]> = {};

  messages.forEach(msg => {
    const date = new Date(msg.created_at).toLocaleDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
  });

  return groups;
}

// Render with separators
{Object.entries(groupedMessages).map(([date, msgs]) => (
  <div key={date}>
    <Divider>{date}</Divider>
    {msgs.map(msg => <MessageBubble key={msg.id} {...msg} />)}
  </div>
))}
```

### 2. **Performance Optimization**

```typescript
// Virtual scrolling for 1000+ messages
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualMessageList({ messages }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <MessageBubble message={messages[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 3. **Accessibility**

```typescript
<Conversations
  // ARIA labels
  aria-label="Chat conversation"
  role="log"

  // Keyboard navigation
  onKeyDown={(e) => {
    if (e.key === 'Escape') {
      closeSidebar();
    }
  }}
/>

<Bubble
  // Screen reader support
  aria-live="polite"
  aria-atomic="true"

  // Focus management
  tabIndex={0}
/>
```

### 4. **Error Handling**

```typescript
// Graceful error display
<Bubble
  variant="error"
  content={(
    <Alert
      message="Failed to send message"
      description={error.message}
      type="error"
      action={
        <Button size="small" onClick={retry}>
          Retry
        </Button>
      }
    />
  )}
/>
```

### 5. **Loading States**

```typescript
// Skeleton for initial load
{loading ? (
  <Skeleton avatar paragraph={{ rows: 4 }} active />
) : (
  <Conversations items={messages} />
)}

// Progressive loading
<Conversations
  items={messages}
  loading={loadingMore}
  onScroll={(e) => {
    const { scrollTop } = e.currentTarget;
    if (scrollTop === 0) {
      loadMoreMessages();
    }
  }}
/>
```

---

## Key Takeaways for MARIE

1. **Follow RICH paradigm** - Clear Role, Intention, Conversation, Hybrid UI
2. **Use Conversations component** - Main container for chat interface
3. **Leverage Bubble variants** - Different styles for different message types
4. **Add smart suggestions** - Context-aware prompts
5. **Support attachments** - Files, images, documents
6. **Smooth streaming** - Throttle updates, show progress
7. **Theme consistently** - Use ConfigProvider for global theme
8. **Optimize performance** - Virtual scrolling, lazy loading
9. **Ensure accessibility** - ARIA labels, keyboard navigation
10. **Handle errors gracefully** - Show actionable error messages

---

**Document Version:** 1.0
**Author:** AI Expert (Claude)
