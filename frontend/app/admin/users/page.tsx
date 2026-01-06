'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Tag,
  Space,
  Button,
  Typography,
  Card,
  App,
  Switch,
  Select,
  Tooltip,
  Modal,
  Form,
  Input,
} from 'antd';
import {
  UserOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import apiClient, { getErrorMessage } from '@/lib/api';
import type { User } from '@/types';

const { Title, Text } = Typography;

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const { message, modal } = App.useApp();
  const [form] = Form.useForm();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/admin/users');
      setUsers(response.data.users);
    } catch (err: unknown) {
      message.error(getErrorMessage(err, 'Failed to fetch users'));
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleStatusChange = async (userId: string, isActive: boolean) => {
    try {
      await apiClient.put(`/admin/users/${userId}/status`, { is_active: isActive });
      message.success(`User ${isActive ? 'enabled' : 'disabled'} successfully`);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_active: isActive } : u)));
    } catch (err: unknown) {
      message.error(getErrorMessage(err, 'Failed to update user status'));
    }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      await apiClient.put(`/admin/users/${userId}/role`, { role });
      message.success(`User role updated to ${role}`);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    } catch (err: unknown) {
      message.error(getErrorMessage(err, 'Failed to update user role'));
    }
  };

  const handleDeleteUser = (userId: string, email: string) => {
    modal.confirm({
      title: 'Are you sure you want to delete this user?',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: `This will permanently delete the user ${email} and all their associated data (conversations, messages, etc.). This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await apiClient.delete(`/admin/users/${userId}`);
          message.success('User deleted successfully');
          setUsers((prev) => prev.filter((u) => u.id !== userId));
        } catch (err: unknown) {
          message.error(getErrorMessage(err, 'Failed to delete user'));
        }
      },
    });
  };

  const handleCreateUser = async (values: Record<string, unknown>) => {
    setCreatingUser(true);
    try {
      const response = await apiClient.post('/admin/users', values);
      message.success('User created successfully');
      setUsers((prev) => [...prev, response.data.user]);
      setCreateModalVisible(false);
      form.resetFields();
    } catch (err: unknown) {
      message.error(getErrorMessage(err, 'Failed to create user'));
    } finally {
      setCreatingUser(false);
    }
  };

  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (record: User) => (
        <Space>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--ant-color-fill-quaternary, #f0f2f5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UserOutlined />
          </div>
          <div>
            <Text strong style={{ display: 'block' }}>
              {record.full_name || 'No Name'}
            </Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string, record: User) => (
        <Select
          defaultValue={role || 'user'}
          style={{ width: 120 }}
          onChange={(value) => handleRoleChange(record.id, value)}
          options={[
            { value: 'user', label: 'User' },
            { value: 'admin', label: 'Admin' },
          ]}
        />
      ),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean, record: User) => (
        <Space>
          <Switch
            checked={isActive}
            onChange={(checked) => handleStatusChange(record.id, checked)}
            size="small"
          />
          <Tag color={isActive ? 'success' : 'error'}>{isActive ? 'Active' : 'Inactive'}</Tag>
        </Space>
      ),
    },
    {
      title: 'Joined',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: User) => (
        <Tooltip title="Delete User">
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteUser(record.id, record.email)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <Card variant="borderless">
      <div
        style={{
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          User Management
        </Title>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            Create User
          </Button>
          <Button onClick={fetchUsers} loading={loading}>
            Refresh
          </Button>
        </Space>
      </div>
      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* Create User Modal */}
      <Modal
        title="Create New User"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={creatingUser}
        okText="Create User"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateUser}
          initialValues={{ role: 'user' }}
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input placeholder="user@example.com" />
          </Form.Item>

          <Form.Item
            name="full_name"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter full name' }]}
          >
            <Input placeholder="John Doe" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: 'Please enter password' },
              { min: 6, message: 'Password must be at least 6 characters' },
            ]}
          >
            <Input.Password placeholder="Enter password" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select role' }]}
          >
            <Select>
              <Select.Option value="user">User</Select.Option>
              <Select.Option value="admin">Admin</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
