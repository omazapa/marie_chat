'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Card, Typography, message, Space } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { LoginResponse } from '@/types';

const { Title, Text, Link } = Typography;

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const response = await apiClient.post<LoginResponse>('/auth/register', {
        email: values.email,
        password: values.password,
        full_name: values.full_name,
      });

      setAuth(response.data);
      message.success('¡Registro exitoso! Bienvenido a Marie Chat');
      router.push('/chat');
    } catch (error: any) {
      console.error('Register error:', error);
      const errorMessage = error.response?.data?.error || 'Error al registrarse';
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
            <Text type="secondary">Crea tu cuenta</Text>
          </div>

          <Form
            name="register"
            onFinish={onFinish}
            layout="vertical"
            requiredMark={false}
          >
            <Form.Item
              name="full_name"
              label="Nombre completo"
              rules={[{ required: true, message: 'Por favor ingresa tu nombre' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Tu nombre"
                size="large"
              />
            </Form.Item>

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
              rules={[
                { required: true, message: 'Por favor ingresa tu contraseña' },
                { min: 8, message: 'La contraseña debe tener al menos 8 caracteres' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Mínimo 8 caracteres"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="confirm"
              label="Confirmar contraseña"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Por favor confirma tu contraseña' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Las contraseñas no coinciden'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Repite tu contraseña"
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
                Registrarse
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login">Inicia sesión</Link>
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
}
