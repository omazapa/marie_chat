'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Typography,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  App,
  Empty,
  Tooltip,
  Alert,
  Divider,
} from 'antd';
import { PlusOutlined, DeleteOutlined, CopyOutlined, InfoCircleOutlined } from '@ant-design/icons';
import apiClient, { getErrorMessage } from '@/lib/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;

interface APIKey {
  id: string;
  name: string;
  key_prefix: string;
  api_key?: string; // Only present when just created
  created_at: string;
  expires_at: string;
  last_used_at: string | null;
  is_active: boolean;
}

export default function APIKeysPage() {
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newKeyData, setNewKeyData] = useState<APIKey | null>(null);
  const [form] = Form.useForm();
  const { message, modal } = App.useApp();

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api-keys');
      setKeys(response.data.keys);
    } catch (err: unknown) {
      message.error(getErrorMessage(err, 'Failed to fetch API keys'));
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreateKey = async (values: { name: string; expires_in_days?: number }) => {
    try {
      const response = await apiClient.post('/api-keys', values);
      setNewKeyData(response.data);
      setIsModalVisible(false);
      form.resetFields();
      fetchKeys();
    } catch (err: unknown) {
      message.error(getErrorMessage(err, 'Failed to create API key'));
    }
  };

  const handleRevokeKey = (id: string, name: string) => {
    modal.confirm({
      title: 'Revoke API Key',
      content: `Are you sure you want to revoke the key "${name}"? This action cannot be undone and any application using this key will stop working.`,
      okText: 'Revoke',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await apiClient.delete(`/api-keys/${id}`);
          message.success('API key revoked');
          fetchKeys();
        } catch (err: unknown) {
          message.error(getErrorMessage(err, 'Failed to revoke API key'));
        }
      },
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('Copied to clipboard');
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Key Prefix',
      dataIndex: 'key_prefix',
      key: 'key_prefix',
      render: (text: string) => <Tag color="blue">{text}...</Tag>,
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('MMM D, YYYY'),
    },
    {
      title: 'Expires',
      dataIndex: 'expires_at',
      key: 'expires_at',
      render: (date: string) => dayjs(date).format('MMM D, YYYY'),
    },
    {
      title: 'Last Used',
      dataIndex: 'last_used_at',
      key: 'last_used_at',
      render: (date: string | null) =>
        date ? dayjs(date).fromNow() : <Text type="secondary">Never</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'error'}>{active ? 'Active' : 'Inactive'}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: APIKey) => (
        <Tooltip title="Revoke Key">
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleRevokeKey(record.id, record.name)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <Card>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}
        >
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Your API Keys
            </Title>
            <Text type="secondary">Manage keys to access MARIE via REST API</Text>
          </div>
          <Space>
            <Button
              icon={<InfoCircleOutlined />}
              href="http://localhost:5000/api/v1/docs"
              target="_blank"
            >
              API Documentation
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
              Create New Key
            </Button>
          </Space>
        </div>

        <Alert
          title="Security Tip"
          description="Your API keys carry as much power as your password. Never share them or commit them to version control."
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />

        <Table
          dataSource={keys}
          columns={columns}
          rowKey="id"
          loading={loading}
          locale={{ emptyText: <Empty description="No API keys found" /> }}
        />

        <Divider />

        <Title level={5}>Quick Start Example</Title>
        <Paragraph>
          You can use your API key to interact with MARIE from any application. Here is a simple{' '}
          <Text code>curl</Text> example:
        </Paragraph>
        <div
          style={{
            background: '#001529',
            padding: '16px',
            borderRadius: '8px',
            position: 'relative',
          }}
        >
          <pre style={{ color: '#fff', margin: 0, overflowX: 'auto' }}>
            {`curl -X POST http://localhost:5000/api/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "messages": [{"role": "user", "content": "Hello MARIE!"}],
    "model": "llama3.2"
  }'`}
          </pre>
          <Button
            size="small"
            icon={<CopyOutlined />}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: 'none',
            }}
            onClick={() =>
              copyToClipboard(`curl -X POST http://localhost:5000/api/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "messages": [{"role": "user", "content": "Hello MARIE!"}],
    "model": "llama3.2"
  }'`)
            }
          />
        </div>
      </Card>

      {/* Create Key Modal */}
      <Modal
        title="Create New API Key"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateKey}
          initialValues={{ expires_in_days: 365 }}
        >
          <Form.Item
            name="name"
            label="Key Name"
            rules={[{ required: true, message: 'Please enter a name for this key' }]}
          >
            <Input placeholder="e.g. My Research App" />
          </Form.Item>

          <Form.Item name="expires_in_days" label="Expiration (days)" rules={[{ required: true }]}>
            <InputNumber min={1} max={3650} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                Create Key
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Success Modal (Show the actual key) */}
      <Modal
        title="API Key Created Successfully"
        open={!!newKeyData}
        onCancel={() => setNewKeyData(null)}
        footer={[
          <Button key="close" type="primary" onClick={() => setNewKeyData(null)}>
            I have saved this key
          </Button>,
        ]}
        closable={false}
        maskClosable={false}
      >
        <Alert
          title="Copy your key now"
          description="For security reasons, we cannot show this key again. Please copy it and store it in a safe place."
          type="warning"
          showIcon
          style={{ marginBottom: '16px' }}
        />

        <div
          style={{
            background: '#f5f5f5',
            padding: '16px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid #d9d9d9',
          }}
        >
          <Text code style={{ fontSize: '16px', wordBreak: 'break-all' }}>
            {newKeyData?.api_key}
          </Text>
          <Button
            type="text"
            icon={<CopyOutlined />}
            onClick={() => copyToClipboard(newKeyData?.api_key || '')}
          />
        </div>
      </Modal>
    </div>
  );
}
