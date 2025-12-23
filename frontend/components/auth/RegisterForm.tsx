'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Card, Typography, Space, App, Image } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useSettings } from '@/hooks/useSettings';
import type { LoginResponse } from '@/types';

const { Title, Text, Link } = Typography;
const { useApp } = App;

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const { message } = useApp();
  const { whiteLabel, loading: settingsLoading } = useSettings();

  // Redirect if registration is disabled
  if (!settingsLoading && !whiteLabel.registration_enabled) {
    router.replace('/login');
    return null;
  }

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const response = await apiClient.post<LoginResponse>('/auth/register', {
        email: values.email,
        password: values.password,
        full_name: values.full_name,
      });

      setAuth(response.data);
      message.success(`Registration successful! Welcome to ${whiteLabel.app_name.replace(/\s*Chat/i, '')}`);
      router.push('/chat');
    } catch (error: any) {
      console.error('Register error:', error);
      const errorMessage = error.response?.data?.error || 'Registration error';
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
              width={240} 
              preview={false}
              style={{ marginBottom: '16px', objectFit: 'contain' }} 
            />
            <Title level={3} style={{ margin: 0, color: whiteLabel.primary_color }}>
              {whiteLabel.app_name.replace(/\s*Chat/i, '')}
            </Title>
            <Text type="secondary">{whiteLabel.welcome_subtitle}</Text>
          </div>

          <Form
            name="register"
            onFinish={onFinish}
            layout="vertical"
            requiredMark={false}
          >
            <Form.Item
              name="full_name"
              label="Full Name"
              rules={[{ required: true, message: 'Please enter your name' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Your name"
                size="large"
              />
            </Form.Item>

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
              rules={[
                { required: true, message: 'Please enter your password' },
                { min: 8, message: 'Password must be at least 8 characters' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Minimum 8 characters"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="confirm"
              label="Confirm Password"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm your password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Repeat your password"
                size="large"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
              >
                Sign up
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">
              Already have an account?{' '}
              <Link href="/login">Sign in</Link>
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
}
