'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Card, Typography, Space, Checkbox, App, Image } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useSettings } from '@/hooks/useSettings';
import type { LoginResponse } from '@/types';

const { Title, Text, Link } = Typography;
const { useApp } = App;

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const { message } = useApp();
  const { whiteLabel } = useSettings();

  // Prefetch chat page to improve perceived performance
  useState(() => {
    router.prefetch('/chat');
  });

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', {
        email: values.email,
        password: values.password,
      });

      setAuth(response.data);
      message.success(`Welcome back to ${whiteLabel.app_name}!`);
      router.push('/chat');
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.error || 'Login error';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: '#f5f7f9',
      backgroundImage: `radial-gradient(${whiteLabel.primary_color} 0.5px, transparent 0.5px)`,
      backgroundSize: '20px 20px'
    }}>
      <Card style={{ width: 450, padding: '24px 12px' }}>
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Image 
              src={whiteLabel.app_logo} 
              alt="Logo" 
              width={180} 
              preview={false}
              style={{ marginBottom: '16px', objectFit: 'contain' }} 
            />
            <Title level={3} style={{ margin: 0, color: whiteLabel.primary_color }}>
              {whiteLabel.app_name}
            </Title>
            <Text type="secondary">{whiteLabel.welcome_subtitle}</Text>
          </div>

          <Form
            name="login"
            onFinish={onFinish}
            layout="vertical"
            requiredMark={false}
          >
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' }
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="your@email.com"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Your password"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Checkbox>Remember me</Checkbox>
                <Link href="#">Forgot password?</Link>
              </div>
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
              >
                Sign in
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">
              Don&apos;t have an account?{' '}
              <Link href="/register">Sign up</Link>
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
}
