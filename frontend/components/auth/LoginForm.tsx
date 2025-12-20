'use client';

import { useState, FormEvent } from 'react';
import { Button, Form, Input, Card, Typography, message } from 'antd';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

const { Title } = Typography;

export default function LoginForm() {
  const router = useRouter();
  const { login, isLoading, error } = useAuthStore();
  const [form] = Form.useForm();

  const handleSubmit = async (values: { email: string; password: string }) => {
    try {
      await login(values.email, values.password);
      message.success('Login successful');
      router.push('/');
    } catch (err) {
      message.error(error || 'Login failed');
    }
  };

  return (
    <Card style={{ maxWidth: 400, margin: '100px auto' }} styles={{ body: { padding: '24px' } }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: '24px' }}>
        Login
      </Title>

      {error && (
        <div style={{ color: 'red', marginBottom: '16px' }}>{error}</div>
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
      >
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Please input your email' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input placeholder="your@email.com" />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: 'Please input your password' }]}
        >
          <Input.Password placeholder="Password" />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={isLoading}
            size="large"
          >
            Login
          </Button>
        </Form.Item>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          Don't have an account?{' '}
          <a href="/register">Register here</a>
        </div>
      </Form>
    </Card>
  );
}

