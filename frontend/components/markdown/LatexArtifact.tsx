'use client';

import { useState, memo, useMemo } from 'react';
import { Card, Button, Tooltip, Space, Typography, App, Tag } from 'antd';
import { 
  CopyOutlined, 
  CodeOutlined,
  EyeOutlined,
  CheckOutlined
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const { Text } = Typography;

interface LatexArtifactProps {
  latex: string;
  className?: string;
  isStreaming?: boolean;
}

export const LatexArtifact = memo(function LatexArtifact({ latex, className, isStreaming }: LatexArtifactProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  const { message } = App.useApp();

  const handleCopy = () => {
    navigator.clipboard.writeText(latex);
    setCopied(true);
    message.success('LaTeX copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  // Ensure the latex is wrapped in $$ for the preview if it's not already
  const htmlContent = useMemo(() => {
    const trimmed = latex.trim();
    let cleanLatex = trimmed;
    
    // Strip $$ or \[ \] if present for direct KaTeX rendering
    if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
      cleanLatex = trimmed.substring(2, trimmed.length - 2);
    } else if (trimmed.startsWith('\\[') && trimmed.endsWith('\\]')) {
      cleanLatex = trimmed.substring(2, trimmed.length - 2);
    }

    try {
      return katex.renderToString(cleanLatex, {
        displayMode: true,
        throwOnError: false,
        trust: true
      });
    } catch (err) {
      console.error('KaTeX error:', err);
      return `<span class="katex-error">${cleanLatex}</span>`;
    }
  }, [latex]);

  return (
    <Card
      className={`latex-artifact-card ${className || ''}`}
      size="small"
      style={{ 
        margin: '1.5em 0', 
        borderRadius: '12px', 
        overflow: 'hidden',
        border: '1px solid #d9d9d9',
        width: '100%',
        maxWidth: '100%',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
      }}
      styles={{
        header: { background: '#f8f9fa', padding: '8px 16px', borderBottom: '1px solid #f0f0f0' },
        body: { padding: '24px', minHeight: '100px', background: '#ffffff' }
      }}
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space orientation="horizontal" size="small">
            <Text strong style={{ fontSize: '12px', color: '#8c8c8c', textTransform: 'uppercase' }}>
              LaTeX Artifact
            </Text>
            {isStreaming && (
              <Tag color="processing" style={{ border: 'none', background: 'transparent' }}>
                Streaming...
              </Tag>
            )}
          </Space>
          <Space orientation="horizontal" size="small">
            <Tooltip title={viewMode === 'preview' ? 'Show Code' : 'Show Preview'}>
              <Button 
                size="small" 
                type="text" 
                icon={viewMode === 'preview' ? <CodeOutlined /> : <EyeOutlined />} 
                onClick={() => setViewMode(viewMode === 'preview' ? 'code' : 'preview')}
              />
            </Tooltip>
            <Tooltip title="Copy LaTeX">
              <Button 
                size="small" 
                type="text" 
                icon={copied ? <CheckOutlined style={{ color: '#52c41a' }} /> : <CopyOutlined />} 
                onClick={handleCopy}
              />
            </Tooltip>
          </Space>
        </div>
      }
    >
      {viewMode === 'preview' ? (
        <div className="latex-preview" style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          overflowX: 'auto', 
          maxWidth: '100%',
          padding: '10px 0'
        }}>
          <div 
            style={{ minWidth: 'min-content' }}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>
      ) : (
        <pre style={{ 
          margin: 0, 
          padding: '12px', 
          background: '#fafafa', 
          borderRadius: '4px',
          fontSize: '13px',
          overflowX: 'auto',
          maxWidth: '100%',
          whiteSpace: 'pre'
        }}>
          {latex}
        </pre>
      )}
    </Card>
  );
});

LatexArtifact.displayName = 'LatexArtifact';
