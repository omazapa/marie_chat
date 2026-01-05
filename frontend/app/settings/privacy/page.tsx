'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Modal,
  Alert,
  Form,
  InputNumber,
  Switch,
  Space,
  Typography,
  Divider,
  App,
} from 'antd';
import { DeleteOutlined, ExclamationCircleOutlined, SaveOutlined } from '@ant-design/icons';
import api from '@/lib/api';

const { confirm } = Modal;
const { Text, Paragraph } = Typography;

export default function PrivacyPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    loadPrivacyPreferences();
  }, []);

  const loadPrivacyPreferences = async () => {
    try {
      const { data } = await api.get('/user/preferences');
      const privacyPrefs = data.privacy_preferences || {};
      form.setFieldsValue({
        conversation_retention_days: privacyPrefs.conversation_retention_days ?? -1,
        auto_delete_enabled: privacyPrefs.auto_delete_enabled ?? false,
        share_usage_data: privacyPrefs.share_usage_data ?? false,
      });
    } catch (error: any) {
      message.error('Failed to load privacy preferences');
    }
  };

  const handleSavePrivacyPreferences = async (values: any) => {
    setSaveLoading(true);
    try {
      await api.put('/user/preferences/privacy', values);
      message.success('Privacy preferences saved successfully');
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to save preferences');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteAllConversations = () => {
    confirm({
      title: 'Delete All Conversations?',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>
            This will permanently delete <strong>all your conversations and messages</strong>.
          </p>
          <p>This action cannot be undone.</p>
        </div>
      ),
      okText: 'Yes, Delete All',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        setDeleteLoading(true);
        try {
          const { data } = await api.delete('/user/conversations');
          message.success(
            `Successfully deleted ${data.deleted_count} conversation${
              data.deleted_count !== 1 ? 's' : ''
            }`
          );
        } catch (error: any) {
          message.error(error.response?.data?.error || 'Failed to delete conversations');
        } finally {
          setDeleteLoading(false);
        }
      },
    });
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <h1 style={{ marginBottom: 24, fontSize: 24, fontWeight: 600 }}>Privacy & Security</h1>

      <Card title="Privacy Preferences" style={{ marginBottom: 24 }}>
        <Form form={form} layout="vertical" onFinish={handleSavePrivacyPreferences}>
          <Form.Item
            label="Conversation Retention"
            name="conversation_retention_days"
            help="Number of days to keep conversations. Use -1 for unlimited retention."
          >
            <Space.Compact style={{ width: '100%' }}>
              <InputNumber
                min={-1}
                max={3650}
                style={{ width: '100%' }}
                placeholder="-1 (forever)"
              />
              <Button disabled>days</Button>
            </Space.Compact>
          </Form.Item>

          <Paragraph type="secondary" style={{ fontSize: 12, marginTop: -16, marginBottom: 16 }}>
            -1 = Keep forever | 0 = Auto-delete immediately | 1-3650 = Days to keep
          </Paragraph>

          <Form.Item
            label="Auto-Delete Old Conversations"
            name="auto_delete_enabled"
            valuePropName="checked"
            help="Automatically delete conversations older than the retention period"
          >
            <Switch />
          </Form.Item>

          <Divider />

          <Form.Item
            label="Share Usage Data"
            name="share_usage_data"
            valuePropName="checked"
            help="Help improve the system by sharing anonymous usage statistics"
          >
            <Switch />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={saveLoading}
              icon={<SaveOutlined />}
              size="large"
            >
              Save Privacy Preferences
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="Data Management" style={{ marginBottom: 24 }}>
        <Alert
          title="Conversation History"
          description="Delete all your conversation history. This will permanently remove all conversations and messages. This action cannot be undone."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Button
          danger
          icon={<DeleteOutlined />}
          size="large"
          onClick={handleDeleteAllConversations}
          loading={deleteLoading}
        >
          Delete All Conversations
        </Button>
      </Card>

      <Card title="Session Management">
        <Alert
          message="Coming Soon"
          description="Session management features are currently in development. You will soon be able to view and manage all your active sessions across different devices, including the ability to remotely log out from specific sessions."
          type="info"
          showIcon
        />
        <Space orientation="vertical" style={{ width: '100%', marginTop: 16 }}>
          <Text strong>Planned Features:</Text>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li>View all active sessions</li>
            <li>See device information and last activity</li>
            <li>Close specific sessions remotely</li>
            <li>Get notifications for new logins</li>
          </ul>
        </Space>
      </Card>
    </div>
  );
}
