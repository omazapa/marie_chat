'use client';

import React, { memo, useMemo, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { PrismAsync as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button, Tooltip, Table, Typography, App } from 'antd';
import type { Components } from 'react-markdown';
import { Think } from '@ant-design/x';
import { CopyOutlined, CheckOutlined, DownloadOutlined } from '@ant-design/icons';
import 'katex/dist/katex.min.css';
import { HTMLArtifact } from './HTMLArtifact';
import { LatexArtifact } from './LatexArtifact';
import { useInterfaceStore } from '@/stores/interfaceStore';

const { Text } = Typography;

interface TableColumn {
  title: React.ReactNode;
  dataIndex: string;
  key: string;
  sorter?: (a: TableRow, b: TableRow) => number;
  ellipsis?: boolean;
}

interface TableRow {
  key: string | number;
  [key: string]: string | number | undefined;
}

interface MarkdownContentProps {
  content: string;
  className?: string;
  isStreaming?: boolean;
}

const CodeBlock = memo(({ language, value }: { language: string; value: string }) => {
  const [copied, setCopied] = useState(false);
  const [wrapLines, setWrapLines] = useState(false);
  const { enableCodeHighlighting } = useInterfaceStore();

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [value]);

  const handleDownload = useCallback(() => {
    const extensionMap: { [key: string]: string } = {
      python: 'py',
      javascript: 'js',
      typescript: 'ts',
      html: 'html',
      css: 'css',
      rust: 'rs',
      cpp: 'cpp',
      'c++': 'cpp',
      c: 'c',
      java: 'java',
      go: 'go',
      sql: 'sql',
      bash: 'sh',
      shell: 'sh',
      json: 'json',
      yaml: 'yaml',
      markdown: 'md',
      latex: 'tex',
    };
    const extension = extensionMap[language.toLowerCase()] || 'txt';
    const blob = new Blob([value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `code_snippet.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  }, [value, language]);

  return (
    <div
      className="code-block-container"
      style={{
        margin: '1.5em 0',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        border: '1px solid #30363d',
        background: '#1e1e1e',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 16px',
          background: '#2d2d2d',
          borderBottom: '1px solid #30363d',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Text
            style={{
              color: '#8b949e',
              fontSize: '12px',
              textTransform: 'uppercase',
              fontWeight: 600,
              letterSpacing: '0.5px',
            }}
          >
            {language || 'code'}
          </Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Tooltip title="Toggle line wrap">
            <Button
              size="small"
              type="text"
              onClick={() => setWrapLines(!wrapLines)}
              style={{
                color: wrapLines ? '#58a6ff' : '#8b949e',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              Wrap
            </Button>
          </Tooltip>
          <Tooltip title="Download code">
            <Button
              size="small"
              type="text"
              icon={<DownloadOutlined />}
              onClick={handleDownload}
              style={{ color: '#8b949e' }}
            />
          </Tooltip>
          <Tooltip title={copied ? 'Copied!' : 'Copy code'}>
            <Button
              size="small"
              type="text"
              icon={
                copied ? (
                  <CheckOutlined style={{ color: '#52c41a' }} />
                ) : (
                  <CopyOutlined style={{ color: '#8b949e' }} />
                )
              }
              onClick={handleCopy}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '24px',
                padding: '0 8px',
                fontSize: '12px',
                color: '#8b949e',
              }}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </Tooltip>
        </div>
      </div>
      {enableCodeHighlighting ? (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={language}
          PreTag="div"
          wrapLines={wrapLines}
          lineProps={{ style: { wordBreak: 'break-all', whiteSpace: 'pre-wrap' } }}
          customStyle={{
            margin: 0,
            borderRadius: 0,
            padding: '16px',
            fontSize: '13px',
            width: '100%',
            maxWidth: '100%',
            overflowX: wrapLines ? 'hidden' : 'auto',
            overflowY: 'hidden',
            whiteSpace: wrapLines ? 'pre-wrap' : 'pre',
            background: 'transparent',
          }}
        >
          {value}
        </SyntaxHighlighter>
      ) : (
        <pre
          style={{
            margin: 0,
            padding: '16px',
            fontSize: '13px',
            overflow: 'auto',
            background: '#1e1e1e',
            color: '#d4d4d4',
            whiteSpace: wrapLines ? 'pre-wrap' : 'pre',
          }}
        >
          <code>{value}</code>
        </pre>
      )}
    </div>
  );
});

CodeBlock.displayName = 'CodeBlock';

const extractText = (children: React.ReactNode): string => {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(extractText).join('');
  if (
    React.isValidElement(children) &&
    children.props &&
    typeof children.props === 'object' &&
    'children' in children.props
  ) {
    return extractText((children.props as any).children as React.ReactNode);
  }
  return '';
};

const MarkdownTable = memo(({ children }: { children: React.ReactNode }) => {
  const { message } = App.useApp();

  const handleDownloadCSV = (columns: TableColumn[], dataSource: TableRow[]) => {
    const headers = columns
      .map((col) => {
        // Extract text from the title which might be a React element
        if (React.isValidElement(col.title)) {
          return extractText(col.title);
        }
        return String(col.title);
      })
      .join(',');

    const rows = dataSource
      .map((row) => {
        return columns
          .map((col) => {
            const val = row[col.dataIndex] || '';
            // Escape quotes and wrap in quotes if contains comma
            const escaped = String(val).replace(/"/g, '""');
            return escaped.includes(',') ? `"${escaped}"` : escaped;
          })
          .join(',');
      })
      .join('\n');

    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'table_data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('CSV downloaded successfully');
  };

  const handleCopyMarkdown = (columns: TableColumn[], dataSource: TableRow[]) => {
    const headers = columns
      .map((col) => {
        if (React.isValidElement(col.title)) {
          return extractText(col.title);
        }
        return String(col.title);
      })
      .join(' | ');

    const separator = columns.map(() => '---').join(' | ');

    const rows = dataSource
      .map((row) => {
        return columns
          .map((col) => {
            return String(row[col.dataIndex] || '').replace(/\n/g, ' ');
          })
          .join(' | ');
      })
      .join('\n');

    const markdown = `| ${headers} |\n| ${separator} |\n| ${rows.replace(/\n/g, ' |\n| ')} |`;
    navigator.clipboard.writeText(markdown);
    message.success('Table copied as Markdown');
  };

  const handleCopyJSON = (columns: TableColumn[], dataSource: TableRow[]) => {
    const data = dataSource.map((row) => {
      const obj: Record<string, string | number | undefined> = {};
      columns.forEach((col) => {
        const title = React.isValidElement(col.title) ? extractText(col.title) : String(col.title);
        obj[title] = row[col.dataIndex];
      });
      return obj;
    });
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    message.success('Table copied as JSON');
  };

  const handleCopyCSV = (columns: TableColumn[], dataSource: TableRow[]) => {
    const headers = columns
      .map((col) => {
        if (React.isValidElement(col.title)) {
          return extractText(col.title);
        }
        return String(col.title);
      })
      .join(',');

    const rows = dataSource
      .map((row) => {
        return columns
          .map((col) => {
            const val = String(row[col.dataIndex] || '').replace(/"/g, '""');
            return `"${val}"`;
          })
          .join(',');
      })
      .join('\n');

    const csv = `${headers}\n${rows}`;
    navigator.clipboard.writeText(csv);
    message.success('Table copied as CSV');
  };

  let tableData: { columns: TableColumn[]; dataSource: TableRow[] } | null = null;
  let errorOccurred = false;

  try {
    const childrenArray = React.Children.toArray(children);
    const thead = childrenArray.find(
      (c) => React.isValidElement(c) && typeof c.type === 'string' && c.type === 'thead'
    ) as React.ReactElement | undefined;
    const tbody = childrenArray.find(
      (c) => React.isValidElement(c) && typeof c.type === 'string' && c.type === 'tbody'
    ) as React.ReactElement | undefined;

    if (thead && tbody) {
      const headerRow = (thead.props as any).children as React.ReactElement;
      const headers = React.Children.toArray((headerRow.props as any).children);

      const columns: TableColumn[] = headers.map((th, i: number) => {
        const title = React.isValidElement(th) ? extractText((th.props as any).children) : '';
        return {
          title: <Text strong>{title}</Text>,
          dataIndex: `col${i}`,
          key: `col${i}`,
          sorter: (a: TableRow, b: TableRow) => {
            const valA = String(a[`col${i}`] || '');
            const valB = String(b[`col${i}`] || '');
            return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
          },
          ellipsis: true,
        };
      });

      const bodyRows = React.Children.toArray((tbody.props as any).children);
      const dataSource: TableRow[] = bodyRows.map((tr, i: number) => {
        if (!React.isValidElement(tr)) return { key: i };
        const tds = React.Children.toArray((tr.props as any).children);
        const rowData: TableRow = { key: i };
        tds.forEach((td, j: number) => {
          if (React.isValidElement(td)) {
            rowData[`col${j}`] = extractText((td.props as any).children);
          }
        });
        return rowData;
      });

      tableData = { columns, dataSource };
    }
  } catch (e) {
    console.error('Error processing interactive table data:', e);
    errorOccurred = true;
  }

  if (errorOccurred || !tableData) {
    return (
      <div style={{ overflowX: 'auto', marginBottom: '1em' }}>
        <table
          className="simple-markdown-table"
          style={{ width: '100%', borderCollapse: 'collapse' }}
        >
          {children}
        </table>
      </div>
    );
  }

  const { columns, dataSource } = tableData;

  return (
    <div className="markdown-table-container" style={{ marginBottom: '1.5em' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px', gap: '8px' }}>
        <Tooltip title="Copy as Markdown">
          <Button
            size="small"
            type="text"
            icon={<CopyOutlined />}
            onClick={() => handleCopyMarkdown(columns, dataSource)}
            style={{ color: '#8c8c8c' }}
          >
            Copy Markdown
          </Button>
        </Tooltip>
        <Tooltip title="Copy as CSV">
          <Button
            size="small"
            type="text"
            icon={<CopyOutlined />}
            onClick={() => handleCopyCSV(columns, dataSource)}
            style={{ color: '#8c8c8c' }}
          >
            Copy CSV
          </Button>
        </Tooltip>
        <Tooltip title="Copy as JSON">
          <Button
            size="small"
            type="text"
            icon={<CopyOutlined />}
            onClick={() => handleCopyJSON(columns, dataSource)}
            style={{ color: '#8c8c8c' }}
          >
            Copy JSON
          </Button>
        </Tooltip>
        <Tooltip title="Download as CSV">
          <Button
            size="small"
            type="text"
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadCSV(columns, dataSource)}
            style={{ color: '#8c8c8c' }}
          >
            Download CSV
          </Button>
        </Tooltip>
      </div>
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
          border: '1px solid #f0f0f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}
      />
    </div>
  );
});

MarkdownTable.displayName = 'MarkdownTable';

export const MarkdownContent = memo(function MarkdownContent({
  content,
  className,
  isStreaming,
}: MarkdownContentProps) {
  const { enableMarkdown, enableCodeHighlighting } = useInterfaceStore();

  // Auto-wrap raw HTML blocks in code blocks if they are not already wrapped - MUST be before any conditional returns
  const processedContent = useMemo(() => {
    // Regex to find substantial HTML blocks
    const htmlBlockRegex =
      /(<!doctype html>[\s\S]*?<\/html>|<html[\s\S]*?<\/html>|<body[\s\S]*?<\/body>|<div[\s\S]*?<\/div>|<svg[\s\S]*?<\/svg>|<iframe[\s\S]*?<\/iframe>|<table[\s\S]*?<\/table>|<button[\s\S]*?<\/button>|<form[\s\S]*?<\/form>|<canvas[\s\S]*?<\/canvas>)/gi;
    // Regex to find LaTeX environments and display math blocks
    const latexBlockRegex =
      /(\\begin\{([a-z\*]+)\}[\s\S]*?\\end\{\2\}|\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$|\\\( [\s\S]*? \\\))/gi;
    // Regex to find thought blocks
    const thoughtBlockRegex = /<thought>([\s\S]*?)<\/thought>/gi;

    // Check if the block is already inside a code block
    let lastIndex = 0;
    let result = '';

    // Combine and sort matches by index
    const matches: {
      index: number;
      length: number;
      content: string;
      type: 'html' | 'latex' | 'thought';
    }[] = [];

    let match;
    while ((match = htmlBlockRegex.exec(content)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        content: match[0],
        type: 'html',
      });
    }
    while ((match = latexBlockRegex.exec(content)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        content: match[0],
        type: 'latex',
      });
    }
    while ((match = thoughtBlockRegex.exec(content)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        content: match[1],
        type: 'thought',
      });
    }

    matches.sort((a, b) => a.index - b.index);

    for (const m of matches) {
      if (m.index < lastIndex) continue; // Skip overlapping matches

      const before = content.substring(lastIndex, m.index);
      const fullBefore = content.substring(0, m.index);

      // Count triple backticks to see if we are inside a code block
      const isInsideCode = (fullBefore.match(/```/g) || []).length % 2 !== 0;
      // Count double dollar signs to see if we are inside a math block
      const isInsideMath = (fullBefore.match(/\$\$/g) || []).length % 2 !== 0;

      result += before;
      if (!isInsideCode && !isInsideMath) {
        if (m.type === 'html') {
          result += `\n\n\`\`\`html\n${m.content.trim()}\n\`\`\`\n\n`;
        } else if (m.type === 'latex') {
          result += `\n\n\`\`\`latex\n${m.content.trim()}\n\`\`\`\n\n`;
        } else if (m.type === 'thought') {
          result += `\n\n\`\`\`thought\n${m.content.trim()}\n\`\`\`\n\n`;
        }
      } else {
        result += m.content;
      }
      lastIndex = m.index + m.length;
    }
    result += content.substring(lastIndex);

    return result || content;
  }, [content]);

  // Check if the entire content is a raw HTML document (not in a code block)
  const isRawHTML = useMemo(() => {
    const trimmed = content.trim().toLowerCase();
    // Must start with HTML tags and be substantial or have closing tags
    return (
      (trimmed.startsWith('<!doctype html>') ||
        trimmed.startsWith('<html') ||
        trimmed.startsWith('<body>')) &&
      (trimmed.includes('</html>') || trimmed.includes('</body>') || trimmed.length > 150)
    );
  }, [content]);

  const components: Components = useMemo(
    () => ({
      code({ className, children, ...props }) {
        const inline = !(props as any).node?.position?.start?.line || (props as any).inline;
        const match = /language-(\w+)/.exec(className || '');
        let language = match ? match[1] : '';
        const codeContent = String(children).replace(/\n$/, '');

        // Fallback detection for HTML/SVG if no language tag is provided
        if (!language && !inline) {
          const lowerContent = codeContent.toLowerCase().trim();
          // Aggressive detection for HTML blocks: must start with tag and be substantial or have closing tag
          const looksLikeHTML =
            (lowerContent.startsWith('<!doctype html>') ||
              lowerContent.startsWith('<html') ||
              lowerContent.startsWith('<body>')) &&
            (lowerContent.includes('</html>') ||
              lowerContent.includes('</body>') ||
              lowerContent.length > 100);

          const looksLikeSVG = lowerContent.startsWith('<svg') && lowerContent.includes('</svg>');

          if (looksLikeHTML || looksLikeSVG) {
            language = looksLikeSVG ? 'svg' : 'html';
          }
        }

        // Handle HTML artifacts
        if (language === 'html' || language === 'svg') {
          return <HTMLArtifact html={codeContent} isStreaming={isStreaming} />;
        }

        // Handle LaTeX artifacts
        if (language === 'latex' || language === 'math') {
          return <LatexArtifact latex={codeContent} isStreaming={isStreaming} />;
        }

        // Handle Thought artifacts
        if (language === 'thought') {
          return (
            <div style={{ marginBottom: '16px' }}>
              <Think
                title="Reasoning Process"
                defaultExpanded={false}
                style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}
              >
                <div style={{ fontSize: '13px', color: '#495057', lineHeight: '1.6' }}>
                  <MarkdownContent content={codeContent} isStreaming={isStreaming} />
                </div>
              </Think>
            </div>
          );
        }

        return !inline && match ? (
          <CodeBlock language={language} value={codeContent} />
        ) : (
          <code className={className} {...props}>
            {children}
          </code>
        );
      },
      pre({ children, ...props }) {
        // If the child is an HTMLArtifact or LatexArtifact (returned by the code component), don't wrap in <pre>
        const childrenArray = React.Children.toArray(children);
        const isArtifact = childrenArray.some((child) => {
          if (!React.isValidElement(child)) return false;
          const type = child.type as React.ComponentType & { displayName?: string };
          return (
            type?.displayName === 'HTMLArtifact' ||
            type?.displayName === 'LatexArtifact' ||
            type?.displayName === 'Think'
          );
        });

        if (isArtifact) {
          return <>{children}</>;
        }
        return <pre {...props}>{children}</pre>;
      },
      table({ children }) {
        return <MarkdownTable>{children}</MarkdownTable>;
      },
    }),
    [isStreaming]
  );

  // If markdown is disabled, return plain text (after all hooks)
  if (!enableMarkdown) {
    return (
      <div
        className={`markdown-content ${className || ''}`}
        style={{
          width: '100%',
          maxWidth: '100%',
          overflowWrap: 'break-word',
          minWidth: 0,
          whiteSpace: 'pre-wrap',
        }}
      >
        {content}
      </div>
    );
  }

  if (isRawHTML) {
    return <HTMLArtifact html={content} isStreaming={isStreaming} />;
  }

  return (
    <div
      className={`markdown-content ${className || ''}`}
      style={{ width: '100%', maxWidth: '100%', overflowWrap: 'break-word', minWidth: 0 }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
});
