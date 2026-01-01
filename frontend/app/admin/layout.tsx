'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Layout, Menu, Typography, Space, Spin } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  SettingOutlined,
  ArrowLeftOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSettings } from '@/hooks/useSettings';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const { whiteLabel } = useSettings();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (user?.role !== 'admin') {
      router.push('/chat');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
      >
        <Space orientation="vertical" align="center">
          <Spin size="large" />
          <Text type="secondary">Verifying admin access...</Text>
        </Space>
      </div>
    );
  }

  const menuItems = [
    {
      key: '/admin',
      icon: <DashboardOutlined />,
      label: <Link href="/admin">Dashboard</Link>,
    },
    {
      key: '/admin/users',
      icon: <UserOutlined />,
      label: <Link href="/admin/users">User Management</Link>,
    },
    {
      key: '/admin/system',
      icon: <BarChartOutlined />,
      label: <Link href="/admin/system">System Stats</Link>,
    },
    {
      key: '/admin/settings',
      icon: <SettingOutlined />,
      label: <Link href="/admin/settings">System Settings</Link>,
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
          zIndex: 100,
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
          <Text
            type="secondary"
            style={{ fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}
          >
            Admin Console
          </Text>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          style={{ borderRight: 0, padding: '0 12px' }}
        />

        <div
          style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
            padding: '24px',
            borderTop: '1px solid #f0f0f0',
          }}
        >
          <Space align="center">
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: whiteLabel.primary_color,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#fff',
                fontWeight: 'bold',
              }}
            >
              {user?.full_name?.[0] || 'A'}
            </div>
            <div
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '150px',
              }}
            >
              <Text strong style={{ fontSize: '13px', display: 'block' }}>
                {user?.full_name}
              </Text>
              <Text type="secondary" style={{ fontSize: '11px' }}>
                {user?.role}
              </Text>
            </div>
          </Space>
        </div>
      </Sider>
      <Layout style={{ marginLeft: 260 }}>
        <Header
          style={{
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(8px)',
            padding: '0 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #e8e8e8',
            position: 'sticky',
            top: 0,
            zIndex: 99,
            height: '64px',
          }}
        >
          <Title level={5} style={{ margin: 0 }}>
            {menuItems.find((item) => item.key === pathname)?.label || 'Administration'}
          </Title>
          <Space size="middle">
            <Text type="secondary" style={{ fontSize: '12px' }}>
              v1.0.0-alpha
            </Text>
          </Space>
        </Header>
        <Content style={{ padding: '32px', minHeight: 280 }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>{children}</div>
        </Content>
      </Layout>
    </Layout>
  );
}
