'use client';

import React, { useState } from 'react';
import { Layout, Button, Input, Typography, Space, Tooltip, App, Checkbox } from 'antd';
import {
  PlusOutlined,
  SettingOutlined,
  SearchOutlined,
  MessageOutlined,
  EditOutlined,
  DeleteOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
  KeyOutlined,
  CheckSquareOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { Conversations } from '@ant-design/x';
import Link from 'next/link';
import { UserAvatar } from './UserAvatar';
import { useSettings } from '@/hooks/useSettings';
import { Conversation, User } from '@/types';

const { Sider } = Layout;
const { Text } = Typography;

interface ChatSidebarProps {
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredConversations: Conversation[];
  currentConversation: Conversation | null;
  handleNewConversation: () => void;
  handleOpenModelSelector: () => void;
  handleSelectConversation: (id: string) => void;
  handleRenameConversation: (id: string, title: string) => void;
  handleDeleteConversation: (id: string) => void;
  handleBulkDeleteConversations: (ids: string[]) => Promise<boolean>;
  handleLogout: () => void;
  user: User | null;
  isConnected: boolean;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  loading,
  searchQuery,
  setSearchQuery,
  filteredConversations,
  currentConversation,
  handleNewConversation,
  handleOpenModelSelector,
  handleSelectConversation,
  handleRenameConversation,
  handleDeleteConversation,
  handleBulkDeleteConversations,
  handleLogout,
  user,
  isConnected,
}) => {
  const { modal } = App.useApp();
  const { whiteLabel } = useSettings();
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredConversations.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredConversations.map((c) => c.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;

    modal.confirm({
      title: 'Bulk Delete Conversations',
      content: `Are you sure you want to delete ${selectedIds.length} conversations? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        const success = await handleBulkDeleteConversations(selectedIds);
        if (success) {
          setIsSelectionMode(false);
          setSelectedIds([]);
        }
      },
    });
  };

  return (
    <Sider
      width={300}
      theme="light"
      style={{
        borderRight: '1px solid #f0f0f0',
        height: '100vh',
        position: 'relative',
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Sidebar Header */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #f0f0f0' }}>
          <Link href="/chat" style={{ textDecoration: 'none' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
                cursor: 'pointer',
              }}
            >
              <img
                src={whiteLabel.app_icon}
                alt="Logo"
                style={{ width: '32px', height: '32px', objectFit: 'contain' }}
              />
              <Text strong style={{ fontSize: '18px', color: whiteLabel.primary_color }}>
                {(whiteLabel.app_name || 'Marie').replace(/\s*Chat/i, '')}
              </Text>
            </div>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isConnected ? '#52c41a' : '#ff4d4f',
              }}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {isConnected ? 'System Online' : 'System Offline'}
            </Text>
          </div>
        </div>

        {/* New Conversation Button */}
        <div style={{ padding: '16px' }}>
          <Space orientation="vertical" style={{ width: '100%' }} size="small">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleNewConversation}
              disabled={loading || isSelectionMode}
              block
              size="large"
              style={{
                height: '44px',
                fontWeight: 600,
              }}
            >
              New Conversation
            </Button>

            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              {!isSelectionMode ? (
                <Button
                  icon={<CheckSquareOutlined />}
                  onClick={() => setIsSelectionMode(true)}
                  block
                  size="small"
                  style={{ fontSize: '12px' }}
                >
                  Manage History
                </Button>
              ) : (
                <div
                  style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '8px' }}
                >
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={handleBulkDelete}
                      disabled={selectedIds.length === 0}
                      style={{ flex: 1, fontSize: '12px' }}
                      size="small"
                    >
                      Delete ({selectedIds.length})
                    </Button>
                    <Button
                      icon={<CloseOutlined />}
                      onClick={() => {
                        setIsSelectionMode(false);
                        setSelectedIds([]);
                      }}
                      size="small"
                    />
                  </div>
                  <Button size="small" onClick={handleSelectAll} style={{ fontSize: '11px' }}>
                    {selectedIds.length === filteredConversations.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </Button>
                </div>
              )}
            </div>
          </Space>

          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={handleOpenModelSelector}
            block
            disabled={isSelectionMode}
            style={{ marginTop: 8, color: whiteLabel.primary_color }}
          >
            Configure Model
          </Button>
        </div>

        {/* Search Conversations */}
        <div style={{ padding: '0 16px 12px 16px' }}>
          <Input
            placeholder="Search conversations..."
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            style={{ borderRadius: '8px' }}
          />
        </div>

        {/* Conversations List */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {filteredConversations.length > 0 ? (
            <Conversations
              items={filteredConversations.map((conv: Conversation) => ({
                key: conv.id,
                label: (
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}
                  >
                    {isSelectionMode && (
                      <Checkbox
                        checked={selectedIds.includes(conv.id)}
                        onChange={() => toggleSelection(conv.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontWeight: 500,
                        }}
                      >
                        {conv.highlight_title ? (
                          <span dangerouslySetInnerHTML={{ __html: conv.highlight_title }} />
                        ) : (
                          conv.title
                        )}
                      </div>
                      {conv.highlight_message && (
                        <div
                          style={{
                            fontSize: '11px',
                            color: '#8c8c8c',
                            marginTop: '2px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          dangerouslySetInnerHTML={{ __html: `...${conv.highlight_message}...` }}
                        />
                      )}
                    </div>
                  </div>
                ),
                timestamp: new Date(conv.updated_at).getTime(),
              }))}
              activeKey={isSelectionMode ? undefined : currentConversation?.id}
              onActiveChange={(id) => {
                if (isSelectionMode) {
                  toggleSelection(id);
                } else {
                  handleSelectConversation(id);
                }
              }}
              menu={
                isSelectionMode
                  ? undefined
                  : (info: { key: string }) => ({
                      items: [
                        {
                          key: 'rename',
                          label: 'Rename',
                          icon: <EditOutlined />,
                          onClick: () => {
                            const conv = filteredConversations.find(
                              (c: Conversation) => c.id === info.key
                            );
                            let newTitle = conv?.title || '';
                            modal.confirm({
                              title: 'Rename Conversation',
                              content: (
                                <Input
                                  defaultValue={newTitle}
                                  onChange={(e) => (newTitle = e.target.value)}
                                  placeholder="Enter new title"
                                  style={{ marginTop: 16 }}
                                />
                              ),
                              onOk: async () => {
                                if (newTitle && newTitle.trim()) {
                                  handleRenameConversation(info.key, newTitle);
                                }
                              },
                            });
                          },
                        },
                        {
                          key: 'delete',
                          label: 'Delete',
                          icon: <DeleteOutlined />,
                          danger: true,
                          onClick: () => handleDeleteConversation(info.key),
                        },
                      ],
                    })
              }
              style={{ height: '100%', overflowX: 'hidden', overflowY: 'auto' }}
            />
          ) : (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#8c8c8c',
              }}
            >
              <MessageOutlined style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.3 }} />
              <Text type="secondary" style={{ display: 'block', fontSize: '14px' }}>
                {searchQuery ? 'No conversations match your search' : 'No conversations yet'}
              </Text>
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid #f0f0f0',
            background: '#fafafa',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <Space orientation="horizontal" size="small">
              <UserAvatar />
              <div style={{ maxWidth: '160px' }}>
                <Text strong style={{ display: 'block', fontSize: '14px' }} ellipsis>
                  {user?.full_name || user?.email || 'User'}
                </Text>
                <Text type="secondary" style={{ fontSize: '12px' }} ellipsis>
                  {user?.email}
                </Text>
              </div>
            </Space>
            <Tooltip title="Logout">
              <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout} danger />
            </Tooltip>
          </div>

          {user?.role === 'admin' && (
            <Link href="/admin" style={{ width: '100%', display: 'block', marginBottom: '8px' }}>
              <Button
                icon={<SafetyCertificateOutlined />}
                block
                size="small"
                style={{
                  fontSize: '12px',
                  background: '#f0f5ff',
                  color: '#1d39c4',
                  borderColor: '#adc6ff',
                }}
              >
                System Administration
              </Button>
            </Link>
          )}

          <Link
            href="/settings/keys"
            style={{ width: '100%', display: 'block', marginBottom: '8px' }}
          >
            <Button
              icon={<KeyOutlined />}
              block
              size="small"
              style={{
                fontSize: '12px',
              }}
            >
              Developer API Keys
            </Button>
          </Link>

          <Space orientation="vertical" size={4} style={{ width: '100%' }}>
            <Text type="secondary" style={{ fontSize: '10px' }}>
              © 2026 ImpactU
            </Text>
          </Space>
        </div>
      </div>
    </Sider>
  );
};
