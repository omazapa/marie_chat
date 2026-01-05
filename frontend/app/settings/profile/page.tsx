"use client";

import { useState, useEffect } from "react";
import { Form, Input, Button, Card, Space, message, Divider } from "antd";
import { UserOutlined, MailOutlined, LockOutlined } from "@ant-design/icons";
import api from "@/lib/api";

export default function ProfilePage() {
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data } = await api.get("/user/profile");
      profileForm.setFieldsValue({
        full_name: data.full_name,
        email: data.email,
      });
    } catch (error: any) {
      message.error(error.response?.data?.error || "Failed to load profile");
    }
  };

  const handleProfileUpdate = async (values: any) => {
    setLoading(true);
    try {
      await api.put("/user/profile", values);
      message.success("Profile updated successfully");
    } catch (error: any) {
      message.error(error.response?.data?.error || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (values: any) => {
    setPasswordLoading(true);
    try {
      await api.put("/user/password", values);
      message.success("Password changed successfully");
      passwordForm.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.error || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <h1 style={{ marginBottom: 24, fontSize: 24, fontWeight: 600 }}>Profile Settings</h1>

      <Card title="Personal Information" style={{ marginBottom: 24 }}>
        <Form
          form={profileForm}
          layout="vertical"
          onFinish={handleProfileUpdate}
          autoComplete="off"
        >
          <Form.Item
            label="Full Name"
            name="full_name"
            rules={[{ required: true, message: "Please enter your full name" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="John Doe" size="large" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="john@example.com" size="large" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} size="large">
              Save Changes
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="Change Password">
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordChange}
          autoComplete="off"
        >
          <Form.Item
            label="Current Password"
            name="current_password"
            rules={[{ required: true, message: "Please enter your current password" }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter current password"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="New Password"
            name="new_password"
            rules={[
              { required: true, message: "Please enter a new password" },
              { min: 8, message: "Password must be at least 8 characters" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter new password"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Confirm New Password"
            name="confirm_password"
            dependencies={["new_password"]}
            rules={[
              { required: true, message: "Please confirm your new password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("new_password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm new password"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={passwordLoading} size="large">
              Change Password
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
