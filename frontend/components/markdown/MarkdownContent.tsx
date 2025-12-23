'use client';

import { memo, useMemo, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button, Tooltip } from 'antd';
import { CopyOutlined, CheckOutlined } from '@ant-design/icons';
import { HTMLArtifact } from './HTMLArtifact';
import 'katex/dist/katex.min.css';

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

export const MarkdownContent = memo(function MarkdownContent({ content, className, isStreaming }: MarkdownContentProps) {
  const components = useMemo(() => ({
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      const codeContent = String(children).replace(/\n$/, '');

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
    // Custom rendering for math blocks if needed
    div({ node, className, children, ...props }: any) {
      if (className === 'math math-display') {
        return <div className={className} {...props}>{children}</div>;
      }
      return <div className={className} {...props}>{children}</div>;
    }
  }), [isStreaming]);

  return (
    <div className={`markdown-content ${className || ''}`}>
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
