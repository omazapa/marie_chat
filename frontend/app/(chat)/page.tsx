import ChatContainer from '@/components/chat/ChatContainer';
import AuthGuard from '@/components/auth/AuthGuard';

export default function ChatPage() {
  return (
    <AuthGuard>
      <ChatContainer />
    </AuthGuard>
  );
}

