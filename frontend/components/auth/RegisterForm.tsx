'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Card, Typography, Space, App, Image } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';
import apiClient, { getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useSettings } from '@/hooks/useSettings';
import type { LoginResponse } from '@/types';

const { Title, Text, Link } = Typography;
const { useApp } = App;

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const { message, notification } = useApp();
  const { whiteLabel, loading: settingsLoading } = useSettings();

  // Redirect if registration is disabled
  if (!settingsLoading && !whiteLabel.registration_enabled) {
    router.replace('/login');
    return null;
  }

  const onFinish = async (values: Record<string, string>) => {
    setLoading(true);
    try {
      const response = await apiClient.post<LoginResponse>('/auth/register', {
        email: values.email,
        password: values.password,
        full_name: values.full_name,
      });

      setAuth(response.data);
      message.success(
        `Registration successful! Welcome to ${(whiteLabel.app_name || 'Marie').replace(/\s*Chat/i, '')}`
      );
      router.push('/chat');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, 'Registration error');

      // Only log if it's not a 409 (User already exists) or other expected auth failure
      if (
        !axios.isAxiosError(error) ||
        (error.response?.status !== 409 && error.response?.status !== 401)
      ) {
        console.error('Register error:', error);
      }

      notification.error({
        title: 'Registration Failed',
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
              name="register"
              onFinish={onFinish}
              layout="vertical"
              requiredMark={false}
              size="middle"
            >
              <Form.Item
                name="full_name"
                label={<Text style={{ fontSize: '13px' }}>Full Name</Text>}
                rules={[{ required: true, message: 'Please enter your name' }]}
                style={{ marginBottom: 12 }}
              >
                <Input
                  prefix={<UserOutlined className="text-gray-400" />}
                  placeholder="Your name"
                />
              </Form.Item>

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
                rules={[
                  { required: true, message: 'Please enter your password' },
                  { min: 8, message: 'Password must be at least 8 characters' },
                ]}
                style={{ marginBottom: 12 }}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder="Minimum 8 characters"
                />
              </Form.Item>

              <Form.Item
                name="confirm"
                label={<Text style={{ fontSize: '13px' }}>Confirm Password</Text>}
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
                style={{ marginBottom: 20 }}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder="Repeat your password"
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 12 }}>
                <Button type="primary" htmlType="submit" block loading={loading} size="large">
                  Sign up
                </Button>
              </Form.Item>
            </Form>

            <div style={{ textAlign: 'center', marginTop: 4 }}>
              <Text type="secondary" style={{ fontSize: '13px' }}>
                Already have an account? <Link href="/login">Sign in</Link>
              </Text>
            </div>
          </Space>
        </Card>
      </div>
    </div>
  );
}
