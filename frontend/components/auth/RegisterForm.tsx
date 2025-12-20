'use client';

import { useState, FormEvent } from 'react';
import { Button, Form, Input, Card, Typography, message } from 'antd';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

const { Title } = Typography;

export default function RegisterForm() {
  const router = useRouter();
  const { register, isLoading, error } = useAuthStore();
  const [form] = Form.useForm();

  const handleSubmit = async (values: {
    email: string;
    password: string;
    full_name?: string;
  }) => {
    try {
      await register(values.email, values.password, values.full_name);
      message.success('Registration successful');
      router.push('/');
    } catch (err) {
      message.error(error || 'Registration failed');
    }
  };

  return (
    <Card style={{ maxWidth: 400, margin: '100px auto', padding: '24px' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: '24px' }}>
        Register
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
          label="Full Name"
          name="full_name"
        >
          <Input placeholder="John Doe" />
        </Form.Item>

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
          rules={[
            { required: true, message: 'Please input your password' },
            { min: 6, message: 'Password must be at least 6 characters' },
          ]}
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
            Register
          </Button>
        </Form.Item>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          Already have an account?{' '}
          <a href="/login">Login here</a>
        </div>
      </Form>
    </Card>
  );
}

