'use client';

import { useState, useEffect, memo } from 'react';
import { Card, Button, Tooltip, Space, Typography, App, Tag, Spin } from 'antd';
import {
  CopyOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  ExportOutlined,
  CodeOutlined,
  EyeOutlined,
  LoadingOutlined,
  ReloadOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const { Text } = Typography;

interface HTMLArtifactProps {
  html: string;
  className?: string;
  isStreaming?: boolean;
}

export const HTMLArtifact = memo(function HTMLArtifact({
  html,
  className,
  isStreaming,
}: HTMLArtifactProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [displayHtml, setDisplayHtml] = useState(html);
  const [isUpdating, setIsUpdating] = useState(false);
  const { message } = App.useApp();

  // Debounce HTML updates during streaming to reduce flickering and CPU load
  useEffect(() => {
    if (!isStreaming) {
      // Use setTimeout to avoid synchronous setState in effect warning
      const timer = setTimeout(() => {
        setIsUpdating(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    // Use setTimeout to avoid synchronous setState in effect warning
    const startTimer = setTimeout(() => {
      setIsUpdating(true);
    }, 0);

    const timer = setTimeout(() => {
      setDisplayHtml(html);
      setIsUpdating(false);
    }, 400);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(timer);
    };
  }, [html, isStreaming]);

  const handleCopy = () => {
    navigator.clipboard.writeText(html);
    message.success('Code copied to clipboard');
  };

  const handleOpenNewTab = () => {
    const newTab = window.open();
    if (newTab) {
      newTab.document.write(fullHtml);
      newTab.document.close();
    }
  };

  const handleRefresh = () => {
    setDisplayHtml('');
    setTimeout(() => setDisplayHtml(html), 50);
  };

  const handleDownload = () => {
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'artifact.html';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Calculate the full HTML for the iframe
  const contentToRender = isStreaming ? displayHtml : html;
  const lowerContent = contentToRender.toLowerCase();

  const fullHtml =
    lowerContent.includes('<html') ||
    lowerContent.includes('<body') ||
    lowerContent.includes('<!doctype')
      ? contentToRender
      : `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              margin: 0;
              padding: 16px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.5;
              color: #262626;
              background-color: var(--ant-color-bg-container);
              overflow-x: hidden;
            }
            * { box-sizing: border-box; }
            img { max-width: 100%; height: auto; }
            pre {
              max-width: 100%;
              overflow-x: auto;
              overflow-y: hidden;
              white-space: pre;
              word-break: normal;
            }
            /* Custom scrollbar for better UX */
            ::-webkit-scrollbar {
              width: 8px;
              height: 8px;
            }
            ::-webkit-scrollbar-track {
              background: var(--ant-color-fill-secondary);
            }
            ::-webkit-scrollbar-thumb {
              background: #ccc;
              border-radius: 4px;
            }
            ::-webkit-scrollbar-thumb:hover {
              background: #999;
            }
            /* Hide scrollbars during streaming to prevent layout shifts */
            ${isStreaming ? 'body { overflow: hidden; }' : ''}
          </style>
        </head>
        <body>
          ${contentToRender}
        </body>
      </html>
    `;

  return (
    <Card
      className={`html-artifact-card ${className || ''}`}
      size="small"
      style={{
        margin: '12px 0',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #e8e8e8',
        width: '100%',
        maxWidth: '100%',
        boxShadow: isStreaming ? '0 0 15px rgba(27, 75, 115, 0.1)' : '0 2px 8px rgba(0,0,0,0.05)',
      }}
      styles={{
        header: {
          background: 'var(--ant-color-fill-quaternary, #fafafa)',
          padding: '8px 12px',
          borderBottom: '1px solid var(--ant-color-border, #f0f0f0)',
        },
        body: {
          padding: 0,
          height: isExpanded ? '80vh' : '450px',
          position: 'relative',
          background: 'var(--ant-color-bg-container)',
        },
      }}
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space orientation="horizontal" size="small">
            <Text strong style={{ fontSize: '12px', color: '#8c8c8c', textTransform: 'uppercase' }}>
              HTML Artifact
            </Text>
            {isStreaming && (
              <Tag
                color="processing"
                icon={<LoadingOutlined spin />}
                style={{ border: 'none', background: 'transparent' }}
              >
                Streaming...
              </Tag>
            )}
          </Space>
          <Space orientation="horizontal" size="small">
            <Tooltip title="Refresh Preview">
              <Button size="small" type="text" icon={<ReloadOutlined />} onClick={handleRefresh} />
            </Tooltip>
            <Tooltip title={viewMode === 'preview' ? 'Show Code' : 'Show Preview'}>
              <Button
                size="small"
                type="text"
                icon={viewMode === 'preview' ? <CodeOutlined /> : <EyeOutlined />}
                onClick={() => setViewMode(viewMode === 'preview' ? 'code' : 'preview')}
              />
            </Tooltip>
            <Tooltip title="Copy Code">
              <Button size="small" type="text" icon={<CopyOutlined />} onClick={handleCopy} />
            </Tooltip>
            <Tooltip title="Download HTML">
              <Button
                size="small"
                type="text"
                icon={<DownloadOutlined />}
                onClick={handleDownload}
              />
            </Tooltip>
            <Tooltip title={isExpanded ? 'Shrink' : 'Expand'}>
              <Button
                size="small"
                type="text"
                icon={isExpanded ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                onClick={() => setIsExpanded(!isExpanded)}
              />
            </Tooltip>
            <Tooltip title="Open in New Tab">
              <Button
                size="small"
                type="text"
                icon={<ExportOutlined />}
                onClick={handleOpenNewTab}
              />
            </Tooltip>
          </Space>
        </div>
      }
    >
      {viewMode === 'preview' ? (
        <>
          {isUpdating && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(255, 255, 255, 0.6)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 10,
                backdropFilter: 'blur(1px)',
              }}
            >
              <Space orientation="vertical" align="center">
                <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Updating preview...
                </Text>
              </Space>
            </div>
          )}
          <iframe
            srcDoc={fullHtml}
            title="HTML Artifact Preview"
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: 'var(--ant-color-bg-container, #ffffff)',
              pointerEvents: isStreaming ? 'none' : 'auto',
            }}
            sandbox="allow-scripts allow-forms allow-popups allow-modals"
          />
        </>
      ) : (
        <div style={{ height: '100%', overflow: 'hidden' }}>
          <SyntaxHighlighter
            language="html"
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              borderRadius: 0,
              height: '100%',
              overflowX: 'auto',
              overflowY: 'hidden',
            }}
          >
            {html}
          </SyntaxHighlighter>
        </div>
      )}
    </Card>
  );
});

HTMLArtifact.displayName = 'HTMLArtifact';
