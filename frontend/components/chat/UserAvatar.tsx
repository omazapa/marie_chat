'use client';

import React from 'react';
import { Avatar } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';

export const UserAvatar: React.FC = () => {
  const { user } = useAuthStore();
  
  if (!user) return <Avatar icon={<UserOutlined />} />;
  
  const initials = user.full_name 
    ? user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)
    : user.email[0].toUpperCase();

  return (
    <Avatar 
      style={{ backgroundColor: '#1B4B73', verticalAlign: 'middle' }} 
      size="large"
    >
      {initials}
    </Avatar>
  );
};

export const AssistantAvatar: React.FC = () => (
  <Avatar 
    style={{ backgroundColor: '#ffffff', color: '#1B4B73', border: '1px solid #f0f0f0' }} 
    size="large"
    icon={<RobotOutlined />}
  />
);
