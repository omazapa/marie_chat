'use client';

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, List, Tag, Spin, Alert, Divider, Progress, Space } from 'antd';
import { 
  CloudServerOutlined, 
  HddOutlined, 
  GlobalOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import apiClient from '@/lib/api';

const { Title, Text, Paragraph } = Typography;

export default function SystemStats() {
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
            <List
              itemLayout="vertical"
              dataSource={Object.entries(stats.indices || {})}
              renderItem={([name, data]: [string, any]) => (
                <List.Item>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
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
                      <Progress percent={100} size="small" showInfo={false} strokeColor="#1B4B73" />
                    </Col>
                  </Row>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col span={24}>
          <Card title={<Space><InfoCircleOutlined /> System Environment</Space>} variant="borderless">
            <List size="small">
              <List.Item>
                <Text strong>Backend Framework:</Text> <Text>Flask 3.x</Text>
              </List.Item>
              <List.Item>
                <Text strong>Database:</Text> <Text>OpenSearch 2.11</Text>
              </List.Item>
              <List.Item>
                <Text strong>Frontend:</Text> <Text>Next.js 15.1 (React 19)</Text>
              </List.Item>
              <List.Item>
                <Text strong>Deployment:</Text> <Text>Docker Compose</Text>
              </List.Item>
            </List>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
