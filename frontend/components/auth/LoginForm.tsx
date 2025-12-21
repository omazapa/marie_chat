'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Card, Typography, message, Space, Checkbox } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { LoginResponse } from '@/types';

const { Title, Text, Link } = Typography;

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', {
        email: values.email,
        password: values.password,
      });

      setAuth(response.data);
      message.success('¡Bienvenido de vuelta!');
      router.push('/chat');
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.error || 'Error al iniciar sesión';
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
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={2} style={{ marginBottom: 8, color: '#1B4B73' }}>
              Marie Chat
            </Title>
            <Text type="secondary">Inicia sesión en tu cuenta</Text>
          </div>

          <Form
            name="login"
            onFinish={onFinish}
            layout="vertical"
            requiredMark={false}
          >
            <Form.Item
              name="email"
              label="Correo electrónico"
              rules={[
                { required: true, message: 'Por favor ingresa tu correo' },
                { type: 'email', message: 'Ingresa un correo válido' }
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="tu@email.com"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Contraseña"
              rules={[{ required: true, message: 'Por favor ingresa tu contraseña' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Tu contraseña"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Checkbox>Recordarme</Checkbox>
                <Link href="#">¿Olvidaste tu contraseña?</Link>
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
                Iniciar sesión
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">
              ¿No tienes cuenta?{' '}
              <Link href="/register">Regístrate</Link>
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
}
