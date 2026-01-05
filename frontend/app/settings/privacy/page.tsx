"use client";

import { useState } from "react";
import { Card, Button, Modal, message, Alert } from "antd";
import { DeleteOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import api from "@/lib/api";

const { confirm } = Modal;

export default function PrivacyPage() {
  const [loading, setLoading] = useState(false);

  const handleDeleteAllConversations = () => {
    confirm({
      title: "Delete All Conversations?",
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>
            This will permanently delete <strong>all your conversations and messages</strong>.
          </p>
          <p>This action cannot be undone.</p>
        </div>
      ),
      okText: "Yes, Delete All",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        setLoading(true);
        try {
          const { data } = await api.delete("/user/conversations");
          message.success(
            `Successfully deleted ${data.deleted_count} conversation${
              data.deleted_count !== 1 ? "s" : ""
            }`
          );
        } catch (error: any) {
          message.error(error.response?.data?.error || "Failed to delete conversations");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <h1 style={{ marginBottom: 24, fontSize: 24, fontWeight: 600 }}>Privacy & Security</h1>

      <Card title="Data Management" style={{ marginBottom: 24 }}>
        <Alert
          message="Conversation History"
          description="You can delete all your conversation history. This will permanently remove all conversations and cannot be recovered."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Button
          danger
          icon={<DeleteOutlined />}
          size="large"
          onClick={handleDeleteAllConversations}
          loading={loading}
        >
          Delete All Conversations
        </Button>
      </Card>

      <Card title="Active Sessions" style={{ marginBottom: 24 }}>
        <Alert
          message="Session Management"
          description="Session management is currently in development. You will soon be able to view and manage all your active sessions across different devices."
          type="warning"
          showIcon
        />
      </Card>

      <Card title="Privacy Settings">
        <Alert
          message="Data Retention"
          description="Advanced privacy settings including automatic data deletion and usage data sharing preferences are coming soon."
          type="info"
          showIcon
        />
      </Card>
    </div>
  );
}
