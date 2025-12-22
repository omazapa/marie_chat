'use client';

import { useState, useEffect, memo, useMemo } from 'react';
import { Card, Button, Tooltip, Space, Typography, App, Spin, Tag } from 'antd';
import { 
  CopyOutlined, 
  FullscreenOutlined, 
  FullscreenExitOutlined, 
  ExportOutlined,
  CodeOutlined,
  EyeOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const { Text } = Typography;

interface HTMLArtifactProps {
  html: string;
  className?: string;
  isStreaming?: boolean;
}

export const HTMLArtifact = memo(function HTMLArtifact({ html, className, isStreaming }: HTMLArtifactProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [displayHtml, setDisplayHtml] = useState(html);
  const [isUpdating, setIsUpdating] = useState(false);
  const { message } = App.useApp();

  // Debounce HTML updates during streaming to reduce flickering and CPU load
  useEffect(() => {
    if (!isStreaming) {
      setDisplayHtml(html);
      setIsUpdating(false);
      return;
    }

    setIsUpdating(true);
    const timer = setTimeout(() => {
      setDisplayHtml(html);
      setIsUpdating(false);
    }, 800);

    return () => clearTimeout(timer);
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

  // Use useMemo for the full HTML to avoid recalculating on every render
  const fullHtml = useMemo(() => {
    const contentToRender = isStreaming ? displayHtml : html;
    if (contentToRender.includes('<html') || contentToRender.includes('<body')) {
      return contentToRender;
    }
    return `
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
              background-color: #ffffff;
              overflow-x: hidden;
            }
            * { box-sizing: border-box; }
            img { max-width: 100%; height: auto; }
            /* Hide scrollbars during streaming to prevent layout shifts */
            ${isStreaming ? 'body { overflow: hidden; }' : ''}
          </style>
        </head>
        <body>
          ${contentToRender}
        </body>
      </html>
    `;
  }, [displayHtml, html, isStreaming]);

  return (
    <Card
      className={`html-artifact-card ${className || ''}`}
      size="small"
      style={{ 
        margin: '16px 0', 
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #d9d9d9',
        width: '100%',
        maxWidth: '100%',
        boxShadow: isStreaming ? '0 0 15px rgba(27, 75, 115, 0.1)' : 'none'
      }}
      styles={{
        header: { background: '#f5f5f5', padding: '8px 12px' },
        body: { padding: 0, height: isExpanded ? '70vh' : '400px', position: 'relative' }
      }}
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size="small">
            <Text strong style={{ fontSize: '12px', color: '#8c8c8c', textTransform: 'uppercase' }}>
              HTML Artifact
            </Text>
            {isStreaming && (
              <Tag color="processing" icon={<LoadingOutlined spin />} style={{ border: 'none', background: 'transparent' }}>
                Streaming...
              </Tag>
            )}
          </Space>
          <Space size="small">
            <Tooltip title={viewMode === 'preview' ? "Show Code" : "Show Preview"}>
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
            <Tooltip title={isExpanded ? "Shrink" : "Expand"}>
              <Button 
                size="small" 
                type="text" 
                icon={isExpanded ? <FullscreenExitOutlined /> : <FullscreenOutlined />} 
                onClick={() => setIsExpanded(!isExpanded)} 
              />
            </Tooltip>
            <Tooltip title="Open in New Tab">
              <Button size="small" type="text" icon={<ExportOutlined />} onClick={handleOpenNewTab} />
            </Tooltip>
          </Space>
        </div>
      }
    >
      {viewMode === 'preview' ? (
        <>
          {isUpdating && (
            <div style={{
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
              backdropFilter: 'blur(1px)'
            }}>
              <Space direction="vertical" align="center">
                <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                <Text type="secondary" style={{ fontSize: '12px' }}>Updating preview...</Text>
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
              background: '#ffffff',
              pointerEvents: isStreaming ? 'none' : 'auto'
            }}
            sandbox="allow-scripts allow-forms allow-popups allow-modals"
          />
        </>
      ) : (
        <div style={{ height: '100%', overflow: 'auto' }}>
          <SyntaxHighlighter
            language="html"
            style={vscDarkPlus}
            customStyle={{ margin: 0, borderRadius: 0, height: '100%' }}
          >
            {html}
          </SyntaxHighlighter>
        </div>
      )}
    </Card>
  );
});


