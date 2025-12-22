'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Tooltip, Space, Typography, App } from 'antd';
import { 
  CopyOutlined, 
  FullscreenOutlined, 
  FullscreenExitOutlined, 
  ExportOutlined,
  CodeOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const { Text } = Typography;

interface HTMLArtifactProps {
  html: string;
  className?: string;
  isStreaming?: boolean;
}

export function HTMLArtifact({ html, className, isStreaming }: HTMLArtifactProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [displayHtml, setDisplayHtml] = useState(html);
  const { message } = App.useApp();

  // Debounce HTML updates during streaming to reduce flickering
  useEffect(() => {
    if (!isStreaming) {
      setDisplayHtml(html);
      return;
    }

    const timer = setTimeout(() => {
      setDisplayHtml(html);
    }, 500); // Update every 500ms during streaming

    return () => clearTimeout(timer);
  }, [html, isStreaming]);

  const handleCopy = () => {
    navigator.clipboard.writeText(html);
    message.success('Code copied to clipboard');
  };

  const handleOpenNewTab = () => {
    const win = window.open();
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  // Wrap HTML in basic boilerplate if it doesn't have it
  const getFullHtml = (content: string) => {
    if (content.includes('<html') || content.includes('<body')) {
      return content;
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
            }
            * { box-sizing: border-box; }
            img { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `;
  };

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
        maxWidth: '100%'
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
            {isStreaming && <Text type="secondary" style={{ fontSize: '11px' }}>(Rendering...)</Text>}
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
        <iframe
          srcDoc={getFullHtml(displayHtml)}
          title="HTML Artifact Preview"
          style={{ 
            width: '100%', 
            height: '100%', 
            border: 'none',
            background: '#ffffff'
          }}
          sandbox="allow-scripts allow-forms allow-popups allow-modals"
        />
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
}

