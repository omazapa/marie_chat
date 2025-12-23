'use client';

import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, List, Typography, Tag, Spin, Alert } from 'antd';
import { 
  UserOutlined, 
  MessageOutlined, 
  DatabaseOutlined, 
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import apiClient from '@/lib/api';

const { Title, Text } = Typography;

export default function AdminDashboard() {
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
  if (error) return <Alert message="Error" description={error} type="error" showIcon />;

  const indices = stats?.indices || {};
  
  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" className="stats-card">
            <Statistic
              title="Total Users"
              value={indices.marie_users?.docs_count || 0}
              prefix={<UserOutlined style={{ color: '#1B4B73' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" className="stats-card">
            <Statistic
              title="Total Messages"
              value={indices.marie_messages?.docs_count || 0}
              prefix={<MessageOutlined style={{ color: '#17A589' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" className="stats-card">
            <Statistic
              title="Conversations"
              value={indices.marie_conversations?.docs_count || 0}
              prefix={<DatabaseOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" className="stats-card">
            <Statistic
              title="System Health"
              value={stats?.cluster_health?.toUpperCase()}
              valueStyle={{ color: stats?.cluster_health === 'green' ? '#52c41a' : '#faad14' }}
              prefix={stats?.cluster_health === 'green' ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col span={24}>
          <Card title="Index Storage Usage" variant="borderless">
            <List
              itemLayout="horizontal"
              dataSource={Object.entries(indices)}
              renderItem={([name, data]: [string, any]) => (
                <List.Item>
                  <List.Item.Meta
                    title={<Text strong>{name}</Text>}
                    description={`Documents: ${data.docs_count}`}
                  />
                  <div>
                    <Tag color="blue">{(data.store_size_bytes / (1024 * 1024)).toFixed(2)} MB</Tag>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
