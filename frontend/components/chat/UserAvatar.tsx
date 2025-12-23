'use client';

import React from 'react';
import { Avatar } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { useSettings } from '@/hooks/useSettings';

export const UserAvatar: React.FC = () => {
  const { whiteLabel } = useSettings();
  const { user } = useAuthStore();
  
  if (!user) return <Avatar icon={<UserOutlined />} />;
  
  const initials = user.full_name 
    ? user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)
    : user.email[0].toUpperCase();

  return (
    <Avatar 
      style={{ backgroundColor: whiteLabel.primary_color, verticalAlign: 'middle' }} 
      size="large"
    >
      {initials}
    </Avatar>
  );
};

export const AssistantAvatar: React.FC = () => {
  const { whiteLabel } = useSettings();
  return (
    <Avatar 
      src={whiteLabel.app_icon}
      style={{ 
        backgroundColor: '#ffffff', 
        color: whiteLabel.primary_color, 
        border: '1px solid #f0f0f0',
        padding: '6px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }} 
      size={40}
      icon={!whiteLabel.app_icon ? <RobotOutlined /> : undefined}
      imgProps={{
        style: { objectFit: 'contain' }
      }}
    />
  );
};
