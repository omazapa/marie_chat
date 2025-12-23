'use client';

import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography, Tag, Spin, Alert, Space } from 'antd';
import { 
  UserOutlined, 
  MessageOutlined, 
  DatabaseOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  RocketOutlined,
  SettingOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import apiClient from '@/lib/api';
import { useSettings } from '@/hooks/useSettings';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';

const { Title, Text, Paragraph } = Typography;

export default function AdminDashboard() {
  const { whiteLabel } = useSettings();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.get('/admin/stats');
        setStats(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch system statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (error) return <Alert title="Error" description={error} type="error" showIcon />;

  const indices = stats?.indices || {};
  
  return (
    <div style={{ padding: '4px' }}>
      <div style={{ marginBottom: '32px' }}>
        <Title level={2} style={{ marginBottom: '8px' }}>
          Welcome back, {user?.full_name?.split(' ')[0] || 'Admin'}!
        </Title>
        <Paragraph type="secondary">
          Here is what's happening with your {whiteLabel.app_name} instance today.
        </Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            variant="borderless" 
            style={{ 
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              borderRadius: '12px',
              borderLeft: `4px solid ${whiteLabel.primary_color}`
            }}
          >
            <Statistic
              title={<Text type="secondary">Total Users</Text>}
              value={indices.marie_users?.docs_count || 0}
              prefix={<UserOutlined style={{ color: whiteLabel.primary_color, marginRight: '8px' }} />}
              styles={{ content: { fontWeight: 700 } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            variant="borderless" 
            style={{ 
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              borderRadius: '12px',
              borderLeft: '4px solid #17A589'
            }}
          >
            <Statistic
              title={<Text type="secondary">Total Messages</Text>}
              value={indices.marie_messages?.docs_count || 0}
              prefix={<MessageOutlined style={{ color: '#17A589', marginRight: '8px' }} />}
              styles={{ content: { fontWeight: 700 } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            variant="borderless" 
            style={{ 
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              borderRadius: '12px',
              borderLeft: '4px solid #faad14'
            }}
          >
            <Statistic
              title={<Text type="secondary">Conversations</Text>}
              value={indices.marie_conversations?.docs_count || 0}
              prefix={<DatabaseOutlined style={{ color: '#faad14', marginRight: '8px' }} />}
              styles={{ content: { fontWeight: 700 } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            variant="borderless" 
            style={{ 
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              borderRadius: '12px',
              borderLeft: `4px solid ${stats?.cluster_health === 'green' ? '#52c41a' : '#faad14'}`
            }}
          >
            <Statistic
              title={<Text type="secondary">System Health</Text>}
              value={stats?.cluster_health?.toUpperCase()}
              styles={{ content: { color: stats?.cluster_health === 'green' ? '#52c41a' : '#faad14', fontWeight: 700 } }}
              prefix={stats?.cluster_health === 'green' ? <CheckCircleOutlined style={{ marginRight: '8px' }} /> : <ExclamationCircleOutlined style={{ marginRight: '8px' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        <Col xs={24} lg={16}>
          <Card 
            title={<Space><DatabaseOutlined /><span>Index Storage Usage</span></Space>} 
            variant="borderless"
            style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: '12px', height: '100%' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {Object.entries(indices).map(([name, data]: [string, any], index, arr) => (
                <React.Fragment key={name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Text strong style={{ display: 'block' }}>{name}</Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Documents: {data.docs_count.toLocaleString()}
                      </Text>
                    </div>
                    <Tag color="blue" style={{ borderRadius: '4px' }}>
                      {(data.store_size_bytes / (1024 * 1024)).toFixed(2)} MB
                    </Tag>
                  </div>
                  {index < arr.length - 1 && <div style={{ height: '1px', background: '#f0f0f0' }} />}
                </React.Fragment>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card 
            title={<Space><RocketOutlined /><span>Quick Actions</span></Space>} 
            variant="borderless"
            style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: '12px', height: '100%' }}
          >
            <Space orientation="vertical" style={{ width: '100%' }} size="middle">
              <Link href="/admin/users" style={{ width: '100%' }}>
                <Card hoverable size="small" style={{ borderRadius: '8px', border: '1px solid #f0f0f0' }}>
                  <Space>
                    <div style={{ background: '#e6f7ff', padding: '8px', borderRadius: '8px', color: '#1890ff' }}>
                      <UserOutlined />
                    </div>
                    <div>
                      <Text strong style={{ display: 'block' }}>Manage Users</Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>View and edit user roles</Text>
                    </div>
                  </Space>
                </Card>
              </Link>
              
              <Link href="/admin/settings" style={{ width: '100%' }}>
                <Card hoverable size="small" style={{ borderRadius: '8px', border: '1px solid #f0f0f0' }}>
                  <Space>
                    <div style={{ background: '#f6ffed', padding: '8px', borderRadius: '8px', color: '#52c41a' }}>
                      <SettingOutlined />
                    </div>
                    <div>
                      <Text strong style={{ display: 'block' }}>System Settings</Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>Configure LLMs and Branding</Text>
                    </div>
                  </Space>
                </Card>
              </Link>

              <Link href="/admin/system" style={{ width: '100%' }}>
                <Card hoverable size="small" style={{ borderRadius: '8px', border: '1px solid #f0f0f0' }}>
                  <Space>
                    <div style={{ background: '#fff7e6', padding: '8px', borderRadius: '8px', color: '#faad14' }}>
                      <SafetyOutlined />
                    </div>
                    <div>
                      <Text strong style={{ display: 'block' }}>System Health</Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>Detailed infrastructure stats</Text>
                    </div>
                  </Space>
                </Card>
              </Link>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
