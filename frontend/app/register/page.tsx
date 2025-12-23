'use client';

import dynamic from 'next/dynamic';
import { Spin } from 'antd';

const RegisterForm = dynamic(() => import('@/components/auth/RegisterForm').then(mod => mod.RegisterForm), {
  loading: () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Spin size="large" />
    </div>
  ),
  ssr: false
});

export default function RegisterPage() {
  return <RegisterForm />;
}
