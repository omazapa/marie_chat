'use client';

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Tag, Spin, Alert, Divider, Progress, Space } from 'antd';
import { 
  CloudServerOutlined, 
  HddOutlined, 
  GlobalOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import apiClient from '@/lib/api';
import { useSettings } from '@/hooks/useSettings';

const { Title, Text, Paragraph } = Typography;

export default function SystemStats() {
  const { whiteLabel } = useSettings();
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

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card title={<Space><CloudServerOutlined /> Cluster Information</Space>} variant="borderless">
            <Row gutter={24}>
              <Col span={8}>
                <Text type="secondary">Status</Text>
                <div style={{ marginTop: '8px' }}>
                  <Tag color={stats.cluster_health === 'green' ? 'success' : 'warning'} style={{ fontSize: '16px', padding: '4px 12px' }}>
                    {stats.cluster_health?.toUpperCase()}
                  </Tag>
                </div>
              </Col>
              <Col span={8}>
                <Text type="secondary">Nodes</Text>
                <Title level={3} style={{ margin: '8px 0' }}>{stats.nodes_count}</Title>
              </Col>
              <Col span={8}>
                <Text type="secondary">Last Updated</Text>
                <div style={{ marginTop: '8px' }}>
                  <Text>{new Date(stats.timestamp).toLocaleString()}</Text>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col span={24}>
          <Card title={<Space><HddOutlined /> Storage & Indices</Space>} variant="borderless">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {Object.entries(stats.indices || {}).map(([name, data]: [string, any], index, arr) => (
                <div key={name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <Text strong style={{ fontSize: '16px' }}>{name}</Text>
                    <Tag color="blue">{(data.store_size_bytes / (1024 * 1024)).toFixed(2)} MB</Tag>
                  </div>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Text type="secondary">Documents</Text>
                      <Paragraph>{data.docs_count.toLocaleString()}</Paragraph>
                    </Col>
                    <Col span={12}>
                      <Text type="secondary">Storage Efficiency</Text>
                      <Progress percent={100} size="small" showInfo={false} strokeColor={whiteLabel.primary_color} />
                    </Col>
                  </Row>
                  {index < arr.length - 1 && <div style={{ height: '1px', background: '#f0f0f0', marginTop: '24px' }} />}
                </div>
              ))}
            </div>
          </Card>
        </Col>

        <Col span={24}>
          <Card title={<Space><InfoCircleOutlined /> System Environment</Space>} variant="borderless">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <Text strong>Backend Framework:</Text> <Text>Flask 3.x</Text>
              </div>
              <div style={{ height: '1px', background: '#f0f0f0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <Text strong>Database:</Text> <Text>OpenSearch 2.11</Text>
              </div>
              <div style={{ height: '1px', background: '#f0f0f0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <Text strong>Frontend:</Text> <Text>Next.js 16.1 (React 19)</Text>
              </div>
              <div style={{ height: '1px', background: '#f0f0f0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <Text strong>Deployment:</Text> <Text>Docker Compose</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
