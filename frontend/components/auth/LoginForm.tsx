'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Card, Typography, Space, Checkbox, App, Image } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import axios from 'axios';
import apiClient, { getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useSettings } from '@/hooks/useSettings';
import type { LoginResponse } from '@/types';

const { Title, Text, Link } = Typography;
const { useApp } = App;

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const { message, notification } = useApp();
  const { whiteLabel } = useSettings();

  // Prefetch chat page to improve perceived performance
  useState(() => {
    router.prefetch('/chat');
  });

  const onFinish = async (values: Record<string, string>) => {
    setLoading(true);
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', {
        email: values.email,
        password: values.password,
      });

      setAuth(response.data);
      message.success(
        `Welcome back to ${(whiteLabel.app_name || 'Marie').replace(/\s*Chat/i, '')}!`
      );
      router.push('/chat');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, 'Invalid email or password');

      // Only log if it's not a 401 (expected auth failure)
      if (!axios.isAxiosError(error) || error.response?.status !== 401) {
        console.error('Login error:', error);
      }

      notification.error({
        title: 'Login Failed',
        description: errorMessage,
        placement: 'top',
        duration: 5,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        width: '100%',
        background: '#f5f7f9',
        backgroundImage: `radial-gradient(${whiteLabel.primary_color} 0.5px, transparent 0.5px)`,
        backgroundSize: '20px 20px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '20px',
          width: '100%',
          maxWidth: 420,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <Card
          style={{
            width: '100%',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
          }}
          styles={{ body: { padding: '24px' } }}
        >
          <Space orientation="vertical" size={0} style={{ width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ maxWidth: 160, margin: '0 auto 8px' }}>
                <Image
                  src={whiteLabel.app_logo}
                  alt="Logo"
                  preview={false}
                  style={{ width: '100%', height: 'auto', maxHeight: '80px', objectFit: 'contain' }}
                />
              </div>
              <Title level={4} style={{ margin: '0 0 2px', color: whiteLabel.primary_color }}>
                {(whiteLabel.app_name || 'Marie').replace(/\s*Chat/i, '')}
              </Title>
              <Text type="secondary" style={{ fontSize: '13px' }}>
                {whiteLabel.welcome_subtitle}
              </Text>
            </div>

            <Form
              name="login"
              onFinish={onFinish}
              layout="vertical"
              requiredMark={false}
              size="middle"
            >
              <Form.Item
                name="email"
                label={<Text style={{ fontSize: '13px' }}>Email</Text>}
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Please enter a valid email' },
                ]}
                style={{ marginBottom: 12 }}
              >
                <Input
                  prefix={<MailOutlined className="text-gray-400" />}
                  placeholder="your@email.com"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label={<Text style={{ fontSize: '13px' }}>Password</Text>}
                rules={[{ required: true, message: 'Please enter your password' }]}
                style={{ marginBottom: 8 }}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder="Your password"
                />
              </Form.Item>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 20,
                }}
              >
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox style={{ fontSize: '12px' }}>Remember me</Checkbox>
                </Form.Item>
                <Link href="#" style={{ fontSize: '12px' }}>
                  Forgot password?
                </Link>
              </div>

              <Form.Item style={{ marginBottom: 12 }}>
                <Button type="primary" htmlType="submit" block loading={loading} size="large">
                  Sign in
                </Button>
              </Form.Item>
            </Form>

            {whiteLabel.registration_enabled && (
              <div style={{ textAlign: 'center', marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: '13px' }}>
                  Don&apos;t have an account? <Link href="/register">Sign up</Link>
                </Text>
              </div>
            )}
          </Space>
        </Card>
      </div>
    </div>
  );
}
