'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Layout, Menu, Typography, Space, Spin, Button } from 'antd';
import { 
  KeyOutlined, 
  UserOutlined, 
  ArrowLeftOutlined,
  SettingOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSettings } from '@/hooks/useSettings';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const { whiteLabel } = useSettings();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  const menuItems = [
    {
      key: '/settings/keys',
      icon: <KeyOutlined />,
      label: <Link href="/settings/keys">API Keys</Link>,
    },
    {
      key: 'back',
      icon: <ArrowLeftOutlined />,
      label: <Link href="/chat">Back to Chat</Link>,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <Sider 
        width={260} 
        theme="light" 
        style={{ 
          borderRight: '1px solid #e8e8e8',
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100
        }}
      >
        <div style={{ padding: '32px 24px', textAlign: 'center' }}>
          <img 
            src={whiteLabel.app_icon} 
            alt="Logo" 
            style={{ width: '48px', height: '48px', marginBottom: '16px', objectFit: 'contain' }} 
          />
          <Title level={4} style={{ margin: 0, color: whiteLabel.primary_color, fontWeight: 700 }}>
            {whiteLabel.app_name.replace(/\s*Chat/i, '')}
          </Title>
          <Text type="secondary" style={{ fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>
            User Settings
          </Text>
        </div>
        
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          style={{ borderRight: 0 }}
        />
      </Sider>
      
      <Layout style={{ marginLeft: 260 }}>
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px', 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #e8e8e8',
          height: '64px'
        }}>
          <Title level={5} style={{ margin: 0 }}>
            {pathname === '/settings/keys' ? 'Developer API Keys' : 'Settings'}
          </Title>
          
          <Space>
            <Text strong>{user?.full_name || user?.email}</Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>({user?.role})</Text>
          </Space>
        </Header>
        
        <Content style={{ padding: '24px', minHeight: 'calc(100vh - 64px)' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
