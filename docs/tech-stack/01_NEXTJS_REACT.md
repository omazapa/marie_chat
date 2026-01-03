# Next.js 16 + React 19 - Complete Reference Guide

> **Last Updated:** January 3, 2026
> **Versions:** Next.js 16.1.x | React 19.2.x
> **MARIE Project Context**

---

## 📖 Table of Contents

1. [Overview](#overview)
2. [React 19 New Features](#react-19-new-features)
3. [Next.js 16 App Router](#nextjs-16-app-router)
4. [Server Components](#server-components)
5. [Client Components](#client-components)
6. [Data Fetching](#data-fetching)
7. [Caching Strategies](#caching-strategies)
8. [Performance Optimization](#performance-optimization)
9. [Best Practices for MARIE](#best-practices-for-marie)
10. [Common Patterns](#common-patterns)

---

## Overview

### What's New in React 19?

React 19 introduces several groundbreaking features that change how we build applications:

#### 1. **React Compiler (Automatic Optimization)**
```typescript
// Before React 19: Manual memoization required
const MemoizedComponent = memo(MyComponent);
const memoizedValue = useMemo(() => computeExpensive(), [deps]);
const memoizedCallback = useCallback(() => handleClick(), [deps]);

// React 19: Compiler handles it automatically
// No need for manual memo, useMemo, or useCallback in most cases
function MyComponent({ data }) {
  // Automatically optimized by the compiler
  const processed = expensiveComputation(data);
  return <div>{processed}</div>;
}
```

**Key Benefits:**
- Automatic memoization of components and values
- Better performance without boilerplate
- Only re-renders what truly needs updating

**When to Still Use Manual Optimization:**
- Very expensive computations
- Deep object comparisons
- Third-party library integrations

#### 2. **Actions (Server Actions & Form Actions)**
```typescript
// Server-side form handling without API routes
'use server';

async function createConversation(formData: FormData) {
  const title = formData.get('title') as string;
  const model = formData.get('model') as string;

  // Direct database access - runs on server only
  await db.conversations.create({
    title,
    model,
    user_id: await getCurrentUserId(),
  });

  revalidatePath('/chat');
  redirect('/chat');
}

// Client component using the action
'use client';

export function NewConversationForm() {
  return (
    <form action={createConversation}>
      <input name="title" required />
      <select name="model">
        <option value="llama3.2">Llama 3.2</option>
        <option value="gpt-4">GPT-4</option>
      </select>
      <button type="submit">Create</button>
    </form>
  );
}
```

**Benefits for MARIE:**
- No need for separate API routes for simple CRUD
- Built-in loading states with `useFormStatus`
- Automatic error handling
- Progressive enhancement (works without JS)

#### 3. **useOptimistic Hook**
```typescript
'use client';

import { useOptimistic } from 'react';

function MessageList({ messages, sendMessage }) {
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, newMessage) => [...state, { ...newMessage, pending: true }]
  );

  async function sendMessageAction(formData) {
    const content = formData.get('content');

    // Show optimistically immediately
    addOptimisticMessage({ content, role: 'user', id: 'temp' });

    // Actually send to server
    await sendMessage(content);
  }

  return (
    <>
      {optimisticMessages.map(msg => (
        <Message key={msg.id} {...msg} />
      ))}
      <form action={sendMessageAction}>
        <input name="content" />
        <button>Send</button>
      </form>
    </>
  );
}
```

**Use Cases in MARIE:**
- Instant message sending feedback
- Optimistic conversation creation
- Real-time UI updates before server confirmation

#### 4. **use() Hook (Suspense for Data)**
```typescript
import { use } from 'react';

// Can be used in conditions and loops!
function ConversationMessages({ conversationPromise }) {
  const conversation = use(conversationPromise);

  if (conversation.archived) {
    const archivedData = use(fetchArchivedMessages(conversation.id));
    return <ArchivedView data={archivedData} />;
  }

  return <ActiveView messages={conversation.messages} />;
}

// Parent component
export default function Page({ params }) {
  const conversationPromise = fetch(`/api/conversations/${params.id}`);

  return (
    <Suspense fallback={<Skeleton />}>
      <ConversationMessages conversationPromise={conversationPromise} />
    </Suspense>
  );
}
```

**Key Difference from Hooks:**
- Can be used conditionally
- Can be used in loops
- Works with Promises directly
- Integrates with Suspense

#### 5. **Document Metadata (Built-in SEO)**
```typescript
// app/chat/[id]/page.tsx
import type { Metadata } from 'next';

export async function generateMetadata({ params }): Promise<Metadata> {
  const conversation = await fetchConversation(params.id);

  return {
    title: `${conversation.title} | MARIE Chat`,
    description: `Conversation with ${conversation.model}`,
    openGraph: {
      title: conversation.title,
      description: conversation.preview,
      images: ['/og-image.png'],
    },
  };
}

export default function Page({ params }) {
  return <ConversationView id={params.id} />;
}
```

---

## Next.js 16 App Router

### File-Based Routing Structure

```
app/
├── layout.tsx          # Root layout (wraps all pages)
├── page.tsx            # Home page (/)
├── loading.tsx         # Loading UI (shown while page loads)
├── error.tsx           # Error boundary
├── not-found.tsx       # 404 page
│
├── chat/
│   ├── layout.tsx      # Chat section layout
│   ├── page.tsx        # /chat
│   ├── loading.tsx     # Loading state for /chat
│   │
│   └── [id]/
│       ├── page.tsx    # /chat/[id] - Dynamic route
│       └── loading.tsx # Loading state for specific chat
│
├── api/                # API routes (Route Handlers)
│   └── chat/
│       └── route.ts    # /api/chat endpoint
│
└── (auth)/             # Route group (doesn't affect URL)
    ├── login/
    │   └── page.tsx    # /login
    └── register/
        └── page.tsx    # /register
```

### Special Files

#### **layout.tsx** - Shared UI across routes
```typescript
// app/chat/layout.tsx
export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="chat-container">
      <Sidebar />
      <main>{children}</main>
    </div>
  );
}
```

#### **loading.tsx** - Automatic loading states
```typescript
// app/chat/loading.tsx
export default function Loading() {
  return <Skeleton />;
}
```

#### **error.tsx** - Error boundaries
```typescript
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

---

## Server Components

### What are Server Components?

Server Components run **only on the server**. They:
- Have direct access to backend resources (databases, APIs)
- Don't add JavaScript to the client bundle
- Can't use browser APIs or event handlers
- Can be async functions

### Example: Server Component in MARIE

```typescript
// app/chat/[id]/page.tsx
import { db } from '@/lib/db';

// This is a Server Component by default
export default async function ConversationPage({
  params
}: {
  params: { id: string }
}) {
  // Direct database access - runs on server
  const conversation = await db.conversations.findUnique({
    where: { id: params.id },
    include: {
      messages: {
        orderBy: { created_at: 'asc' },
        take: 50,
      },
    },
  });

  if (!conversation) {
    notFound();
  }

  // Pass data to client component
  return (
    <ChatContainer
      initialMessages={conversation.messages}
      conversationId={conversation.id}
    />
  );
}
```

### Benefits for MARIE:

1. **Smaller Bundle Size**
   - Markdown parsing libraries stay on server
   - Syntax highlighting libraries don't ship to client
   - Heavy AI processing logic remains server-side

2. **Direct Data Access**
   ```typescript
   // No API route needed!
   async function getConversations() {
     return await opensearch.search({
       index: 'marie_conversations',
       body: {
         query: { match_all: {} },
       },
     });
   }
   ```

3. **Automatic Code Splitting**
   - Each route automatically code-splits
   - Only loads JavaScript needed for that page

---

## Client Components

### When to Use Client Components

Mark with `'use client'` directive when you need:

1. **Interactivity** (event handlers)
2. **Browser APIs** (localStorage, window, document)
3. **State** (useState, useReducer)
4. **Effects** (useEffect)
5. **Custom Hooks**
6. **Context** (useContext)

### Example: Client Component in MARIE

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

export function ChatInput({ conversationId }: { conversationId: string }) {
  const [message, setMessage] = useState('');
  const { sendMessage, isConnected } = useWebSocket();

  useEffect(() => {
    // Client-side effect
    const saved = localStorage.getItem('draft');
    if (saved) setMessage(saved);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(conversationId, message);
    setMessage('');
    localStorage.removeItem('draft');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          localStorage.setItem('draft', e.target.value);
        }}
        disabled={!isConnected}
      />
      <button type="submit">Send</button>
    </form>
  );
}
```

### Composition Pattern

**Best Practice:** Use Server Components as much as possible, add `'use client'` only where needed.

```typescript
// app/chat/page.tsx (Server Component)
import { ChatSidebar } from './ChatSidebar'; // Client Component
import { MessageList } from './MessageList'; // Server Component

export default async function ChatPage() {
  const conversations = await getConversations(); // Server-side

  return (
    <div className="flex">
      {/* Client component for interactivity */}
      <ChatSidebar conversations={conversations} />

      {/* Server component for rendering */}
      <MessageList />
    </div>
  );
}
```

---

## Data Fetching

### 1. Server-Side Fetching (Recommended)

```typescript
// app/chat/[id]/page.tsx
export default async function Page({ params }: { params: { id: string } }) {
  // Automatically cached by Next.js
  const data = await fetch(`https://api.example.com/chat/${params.id}`, {
    // Control caching behavior
    next: {
      revalidate: 3600, // Revalidate every hour
      tags: ['conversations'], // For on-demand revalidation
    },
  });

  const conversation = await data.json();
  return <ConversationView data={conversation} />;
}
```

### 2. Streaming with Suspense

```typescript
// app/chat/[id]/page.tsx
import { Suspense } from 'react';

export default function Page({ params }) {
  return (
    <div>
      {/* Show immediately */}
      <ConversationHeader id={params.id} />

      {/* Stream in as ready */}
      <Suspense fallback={<MessageSkeleton />}>
        <Messages id={params.id} />
      </Suspense>

      <Suspense fallback={<SidebarSkeleton />}>
        <RelatedChats id={params.id} />
      </Suspense>
    </div>
  );
}

// This component streams its data
async function Messages({ id }) {
  const messages = await fetchMessages(id); // Async!
  return <MessageList messages={messages} />;
}
```

### 3. Parallel Data Fetching

```typescript
// Fetch in parallel for better performance
export default async function Page({ params }) {
  // These run in parallel, not sequentially!
  const [conversation, messages, user] = await Promise.all([
    fetchConversation(params.id),
    fetchMessages(params.id),
    fetchUser(),
  ]);

  return (
    <ChatView
      conversation={conversation}
      messages={messages}
      user={user}
    />
  );
}
```

---

## Caching Strategies

Next.js 16 has sophisticated caching layers:

### 1. **Request Memoization** (Automatic)
```typescript
// These two calls are deduped automatically
const data1 = await fetch('https://api.example.com/data');
const data2 = await fetch('https://api.example.com/data'); // Uses cached result
```

### 2. **Data Cache** (Persistent)
```typescript
// Cached until manually revalidated
fetch('https://api.example.com/data', {
  cache: 'force-cache', // Default
});

// Never cached
fetch('https://api.example.com/data', {
  cache: 'no-store',
});

// Revalidate periodically
fetch('https://api.example.com/data', {
  next: { revalidate: 60 }, // Every 60 seconds
});
```

### 3. **Full Route Cache**
```typescript
// Static page (generated at build time)
export default async function Page() {
  const data = await fetch('https://api.example.com/static');
  return <div>{data.title}</div>;
}

// Dynamic page (generated per request)
export const dynamic = 'force-dynamic';

export default async function Page() {
  const data = await fetch('https://api.example.com/dynamic');
  return <div>{data.title}</div>;
}
```

### 4. **Router Cache** (Client-side)
- Next.js prefetches visible links
- Caches page segments in browser
- Automatic for 30 seconds (dynamic) or 5 minutes (static)

### Cache Control in MARIE

```typescript
// For frequently changing data (messages)
export const revalidate = 0; // Don't cache

// For static data (model list)
export const revalidate = 3600; // 1 hour

// For user-specific data
export const dynamic = 'force-dynamic';
```

---

## Performance Optimization

### 1. **Code Splitting & Lazy Loading**

```typescript
import dynamic from 'next/dynamic';

// Lazy load heavy components
const MarkdownEditor = dynamic(
  () => import('@/components/MarkdownEditor'),
  {
    loading: () => <Skeleton />,
    ssr: false, // Don't render on server
  }
);

// For libraries that don't support SSR
const PlotlyChart = dynamic(
  () => import('@/components/PlotlyChart'),
  { ssr: false }
);
```

### 2. **Image Optimization**

```typescript
import Image from 'next/image';

export function UserAvatar({ src, name }) {
  return (
    <Image
      src={src}
      alt={name}
      width={40}
      height={40}
      // Automatically optimizes format (WebP, AVIF)
      priority={false} // Set true for above-the-fold images
      placeholder="blur"
      blurDataURL="data:image/..." // Or import image directly
      loading="lazy"
    />
  );
}
```

### 3. **Font Optimization**

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google';

// Automatically self-hosts and optimizes
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
```

### 4. **Streaming & Partial Rendering**

```typescript
// Show UI progressively as data arrives
export default async function Page() {
  return (
    <>
      {/* Show instantly */}
      <Header />

      {/* Stream in parallel */}
      <Suspense fallback={<Skeleton />}>
        <Sidebar />
      </Suspense>

      <Suspense fallback={<Skeleton />}>
        <MainContent />
      </Suspense>

      {/* Show instantly */}
      <Footer />
    </>
  );
}
```

---

## Best Practices for MARIE

### 1. **Component Organization**

```typescript
// ❌ Bad: Everything in one file
'use client';
export function ChatPage() {
  // Mix of server and client logic
}

// ✅ Good: Clear separation
// page.tsx (Server Component)
export default async function ChatPage() {
  const data = await fetchServerData();
  return <ChatContainer data={data} />;
}

// ChatContainer.tsx (Client Component)
'use client';
export function ChatContainer({ data }) {
  const [state, setState] = useState(data);
  return <ChatUI state={state} />;
}
```

### 2. **State Management**

```typescript
// ✅ Use Zustand for global client state
'use client';

import { create } from 'zustand';

interface ChatStore {
  messages: Message[];
  addMessage: (msg: Message) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  addMessage: (msg) => set((state) => ({
    messages: [...state.messages, msg]
  })),
}));
```

### 3. **Error Handling**

```typescript
// error.tsx at any level
'use client';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log to error reporting service
    console.error(error);
  }, [error]);

  return (
    <div>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### 4. **Loading States**

```typescript
// loading.tsx for automatic loading UI
export default function Loading() {
  return (
    <div className="animate-pulse">
      <Skeleton />
    </div>
  );
}

// Or use Suspense for granular control
<Suspense fallback={<MessageSkeleton />}>
  <MessageList />
</Suspense>
```

---

## Common Patterns

### Pattern 1: Server Component → Client Component → Server Component

```typescript
// app/page.tsx (Server)
export default async function Page() {
  const data = await fetchData();
  return <ClientWrapper data={data} />;
}

// ClientWrapper.tsx (Client)
'use client';
export function ClientWrapper({ data, children }) {
  const [selected, setSelected] = useState(null);
  return (
    <div onClick={() => setSelected(data)}>
      {children} {/* Can contain Server Components! */}
    </div>
  );
}
```

### Pattern 2: Optimistic Updates with Actions

```typescript
'use client';

export function MessageForm({ conversationId }) {
  const [messages, setMessages] = useState([]);
  const [optimisticMessages, addOptimistic] = useOptimistic(
    messages,
    (state, newMsg) => [...state, newMsg]
  );

  async function sendMessage(formData) {
    const content = formData.get('content');

    // Show immediately
    addOptimistic({ id: 'temp', content, role: 'user' });

    // Send to server
    const result = await fetch('/api/messages', {
      method: 'POST',
      body: JSON.stringify({ conversationId, content }),
    });

    // Update with real message
    const saved = await result.json();
    setMessages(prev => [...prev, saved]);
  }

  return (
    <>
      {optimisticMessages.map(msg => (
        <Message key={msg.id} {...msg} />
      ))}
      <form action={sendMessage}>
        <input name="content" />
        <button>Send</button>
      </form>
    </>
  );
}
```

### Pattern 3: Streaming Server Component Data

```typescript
// Use React Server Components with Suspense for streaming
export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <DataComponent />
    </Suspense>
  );
}

async function DataComponent() {
  // This streams to the client as it resolves
  const data = await slowFetch();
  return <Display data={data} />;
}
```

---

## Key Takeaways for MARIE

1. **Use Server Components by default** - Only add `'use client'` when needed
2. **Leverage streaming** - Show UI progressively with Suspense
3. **Optimize images** - Use Next.js Image component everywhere
4. **Smart caching** - Configure revalidation based on data freshness needs
5. **Actions for mutations** - Replace API routes with Server Actions where appropriate
6. **Parallel fetching** - Use Promise.all for independent data
7. **Error boundaries** - Add error.tsx at critical levels
8. **Loading states** - Use loading.tsx or Suspense

---

**Document Version:** 1.0
**Author:** AI Expert (Claude)
