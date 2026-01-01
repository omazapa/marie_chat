'use client';

import React, { memo, useMemo, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { PrismAsync as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button, Tooltip, Table, Typography, Spin } from 'antd';
import { CopyOutlined, CheckOutlined, TableOutlined } from '@ant-design/icons';
import 'katex/dist/katex.min.css';
import { HTMLArtifact } from './HTMLArtifact';

const { Text } = Typography;

interface MarkdownContentProps {
  content: string;
  className?: string;
  isStreaming?: boolean;
}

const CodeBlock = memo(({ language, value }: { language: string; value: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [value]);

  return (
    <div style={{ position: 'relative', marginBottom: '1em' }}>
      <div style={{
        position: 'absolute',
        right: '8px',
        top: '8px',
        zIndex: 10,
      }}>
        <Tooltip title={copied ? 'Copied!' : 'Copy code'}>
          <Button
            size="small"
            type="text"
            icon={copied ? <CheckOutlined style={{ color: '#52c41a' }} /> : <CopyOutlined style={{ color: 'rgba(255,255,255,0.6)' }} />}
            onClick={handleCopy}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
            }}
          />
        </Tooltip>
      </div>
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={language}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderRadius: '8px',
          padding: '16px',
          fontSize: '13px'
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
});

CodeBlock.displayName = 'CodeBlock';

const extractText = (children: any): string => {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(extractText).join('');
  if (children?.props?.children) return extractText(children.props.children);
  return '';
};

const MarkdownTable = memo(({ children }: { children: any }) => {
  try {
    const childrenArray = Array.isArray(children) ? children : [children];
    const thead = childrenArray.find((c: any) => c?.type === 'thead');
    const tbody = childrenArray.find((c: any) => c?.type === 'tbody');
    
    if (!thead || !tbody) return <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1em' }}>{children}</table>;

    const headerRow = thead.props.children;
    const headers = Array.isArray(headerRow.props.children) ? headerRow.props.children : [headerRow.props.children];
    
    const columns = headers.map((th: any, i: number) => {
      const title = extractText(th.props.children);
      return {
        title: <Text strong>{title}</Text>,
        dataIndex: `col${i}`,
        key: `col${i}`,
        sorter: (a: any, b: any) => {
          const valA = a[`col${i}`] || '';
          const valB = b[`col${i}`] || '';
          return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
        },
        ellipsis: true,
      };
    });

    const bodyRows = Array.isArray(tbody.props.children) ? tbody.props.children : [tbody.props.children];
    const dataSource = bodyRows.map((tr: any, i: number) => {
      const tds = Array.isArray(tr.props.children) ? tr.props.children : [tr.props.children];
      const rowData: any = { key: i };
      tds.forEach((td: any, j: number) => {
        rowData[`col${j}`] = extractText(td.props.children);
      });
      return rowData;
    });

    return (
      <div className="markdown-table-container" style={{ marginBottom: '1.5em' }}>
        <Table 
          columns={columns} 
          dataSource={dataSource} 
          size="small" 
          pagination={dataSource.length > 8 ? { pageSize: 8, size: 'small' } : false}
          bordered
          scroll={{ x: 'max-content' }}
          style={{ 
            borderRadius: '8px', 
            overflow: 'hidden',
            border: '1px solid #f0f0f0'
          }}
        />
      </div>
    );
  } catch (e) {
    console.error('Error rendering interactive table:', e);
    return (
      <div style={{ overflowX: 'auto', marginBottom: '1em' }}>
        <table className="simple-markdown-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          {children}
        </table>
      </div>
    );
  }
});

MarkdownTable.displayName = 'MarkdownTable';

export const MarkdownContent = memo(function MarkdownContent({ content, className, isStreaming }: MarkdownContentProps) {
  const components = useMemo(() => ({
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      let language = match ? match[1] : '';
      const codeContent = String(children).replace(/\n$/, '');

      // Fallback detection for HTML/SVG if no language tag is provided
      if (!language && !inline) {
        const lowerContent = codeContent.toLowerCase().trim();
        if (lowerContent.startsWith('<!doctype html>') || 
            lowerContent.startsWith('<html') || 
            lowerContent.startsWith('<body>') ||
            (lowerContent.startsWith('<svg') && lowerContent.includes('</svg>'))) {
          language = lowerContent.startsWith('<svg') ? 'svg' : 'html';
        }
      }

      // Handle HTML artifacts
      if (language === 'html' || language === 'svg') {
        return <HTMLArtifact html={codeContent} isStreaming={isStreaming} />;
      }

      return !inline && match ? (
        <CodeBlock language={language} value={codeContent} />
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    pre({ node, children, ...props }: any) {
      // Check if the child is a code block that we've handled as an artifact
      const isArtifact = React.Children.toArray(children).some((child: any) => {
        if (React.isValidElement(child) && child.props) {
          const childProps = child.props as any;
          const className = childProps.className || '';
          const content = String(childProps.children || '').toLowerCase().trim();
          
          return className.includes('language-html') || 
                 className.includes('language-svg') ||
                 content.startsWith('<!doctype html>') ||
                 content.startsWith('<html') ||
                 content.startsWith('<body>') ||
                 (content.startsWith('<svg') && content.includes('</svg>'));
        }
        return false;
      });

      if (isArtifact) {
        return <>{children}</>;
      }
      return <pre {...props}>{children}</pre>;
    },
    table({ children }: any) {
      return <MarkdownTable>{children}</MarkdownTable>;
    },
    // Custom rendering for math blocks if needed
    div({ node, className, children, ...props }: any) {
      if (className === 'math math-display') {
        return <div className={className} {...props}>{children}</div>;
      }
      return <div className={className} {...props}>{children}</div>;
    }
  }), [isStreaming]);

  return (
    <div className={`markdown-content ${className || ''}`} style={{ width: '100%', maxWidth: '100%', overflowWrap: 'break-word' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});
