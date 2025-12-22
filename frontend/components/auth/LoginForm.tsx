'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Card, Typography, Space, Checkbox, App } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { LoginResponse } from '@/types';

const { Title, Text, Link } = Typography;
const { useApp } = App;

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const { message } = useApp();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', {
        email: values.email,
        password: values.password,
      });

      setAuth(response.data);
      message.success('Welcome back!');
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
      background: 'linear-gradient(135deg, #1B4B73 0%, #17A589 100%)'
    }}>
      <Card style={{ width: 400, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={2} style={{ marginBottom: 8, color: '#1B4B73' }}>
              Marie Chat
            </Title>
            <Text type="secondary">Sign in to your account</Text>
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
