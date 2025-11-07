'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function MarkdownEditor({ value, onChange, placeholder, minHeight = '400px' }: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);

    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const toolbarButtons = [
    { label: 'H1', icon: 'H1', action: () => insertMarkdown('# ', '\n') },
    { label: 'H2', icon: 'H2', action: () => insertMarkdown('## ', '\n') },
    { label: 'H3', icon: 'H3', action: () => insertMarkdown('### ', '\n') },
    { label: '굵게', icon: 'B', action: () => insertMarkdown('**', '**') },
    { label: '기울임', icon: 'I', action: () => insertMarkdown('*', '*') },
    { label: '링크', icon: '🔗', action: () => insertMarkdown('[', '](url)') },
    { label: '이미지', icon: '🖼️', action: () => insertMarkdown('![alt](', ')') },
    { label: '코드', icon: '<>', action: () => insertMarkdown('`', '`') },
    { label: '인용', icon: '❝', action: () => insertMarkdown('> ', '\n') },
    { label: '리스트', icon: '•', action: () => insertMarkdown('- ', '\n') },
    { label: '번호리스트', icon: '1.', action: () => insertMarkdown('1. ', '\n') },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* 툴바 */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        padding: '12px',
        background: '#f9fafb',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        {toolbarButtons.map((btn) => (
          <button
            key={btn.label}
            type="button"
            onClick={btn.action}
            title={btn.label}
            style={{
              padding: '6px 12px',
              background: '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#374151',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
              e.currentTarget.style.borderColor = '#9ca3af';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
          >
            {btn.icon}
          </button>
        ))}
      </div>

      {/* 탭 (모바일용) */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '2px solid #e5e7eb'
      }} className="lg:hidden">
        <button
          type="button"
          onClick={() => setActiveTab('write')}
          style={{
            padding: '8px 16px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'write' ? '2px solid #2563eb' : '2px solid transparent',
            color: activeTab === 'write' ? '#2563eb' : '#6b7280',
            fontWeight: activeTab === 'write' ? '600' : '400',
            fontSize: '14px',
            cursor: 'pointer',
            marginBottom: '-2px'
          }}
        >
          편집
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          style={{
            padding: '8px 16px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'preview' ? '2px solid #2563eb' : '2px solid transparent',
            color: activeTab === 'preview' ? '#2563eb' : '#6b7280',
            fontWeight: activeTab === 'preview' ? '600' : '400',
            fontSize: '14px',
            cursor: 'pointer',
            marginBottom: '-2px'
          }}
        >
          미리보기
        </button>
      </div>

      {/* 에디터 영역 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '16px'
      }} className="lg:grid-cols-2">
        {/* 입력 영역 */}
        <div style={{
          display: activeTab === 'write' ? 'block' : 'none'
        }} className="lg:block">
          <div style={{
            marginBottom: '8px',
            fontSize: '13px',
            fontWeight: '600',
            color: '#6b7280'
          }}>
            마크다운 편집
          </div>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || '내용을 입력하세요...\n\n# 제목\n\n**굵은 글씨**\n\n- 리스트 항목'}
            style={{
              width: '100%',
              minHeight,
              padding: '16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              lineHeight: '1.6',
              resize: 'vertical',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#2563eb'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
        </div>

        {/* 미리보기 영역 */}
        <div style={{
          display: activeTab === 'preview' ? 'block' : 'none'
        }} className="lg:block">
          <div style={{
            marginBottom: '8px',
            fontSize: '13px',
            fontWeight: '600',
            color: '#6b7280'
          }}>
            미리보기
          </div>
          <div style={{
            minHeight,
            padding: '16px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            background: '#ffffff',
            overflow: 'auto'
          }}>
            {value ? (
              <div className="markdown-preview" style={{
                fontSize: '14px',
                lineHeight: '1.7',
                color: '#374151'
              }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {value}
                </ReactMarkdown>
              </div>
            ) : (
              <div style={{
                color: '#9ca3af',
                fontStyle: 'italic',
                fontSize: '14px'
              }}>
                미리보기가 여기에 표시됩니다
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 마크다운 가이드 */}
      <details style={{
        padding: '12px',
        background: '#f9fafb',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        fontSize: '13px',
        color: '#6b7280'
      }}>
        <summary style={{
          cursor: 'pointer',
          fontWeight: '600',
          color: '#374151'
        }}>
          마크다운 사용 가이드
        </summary>
        <div style={{
          marginTop: '12px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '12px'
        }}>
          <div>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>제목</div>
            <code># H1 제목</code><br />
            <code>## H2 제목</code><br />
            <code>### H3 제목</code>
          </div>
          <div>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>강조</div>
            <code>**굵은 글씨**</code><br />
            <code>*기울임*</code><br />
            <code>`코드`</code>
          </div>
          <div>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>링크</div>
            <code>[링크텍스트](URL)</code><br />
            <code>![이미지](URL)</code>
          </div>
          <div>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>리스트</div>
            <code>- 항목 1</code><br />
            <code>- 항목 2</code><br />
            <code>1. 번호 항목</code>
          </div>
        </div>
      </details>

      <style jsx global>{`
        .markdown-preview h1 {
          font-size: 2em;
          font-weight: 700;
          margin-top: 0.67em;
          margin-bottom: 0.67em;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 0.3em;
        }
        .markdown-preview h2 {
          font-size: 1.5em;
          font-weight: 600;
          margin-top: 0.83em;
          margin-bottom: 0.83em;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 0.3em;
        }
        .markdown-preview h3 {
          font-size: 1.17em;
          font-weight: 600;
          margin-top: 1em;
          margin-bottom: 1em;
        }
        .markdown-preview p {
          margin-top: 0;
          margin-bottom: 1em;
        }
        .markdown-preview ul, .markdown-preview ol {
          padding-left: 2em;
          margin-bottom: 1em;
        }
        .markdown-preview li {
          margin-bottom: 0.5em;
        }
        .markdown-preview code {
          background: #f3f4f6;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: Consolas, Monaco, "Courier New", monospace;
          font-size: 0.9em;
        }
        .markdown-preview pre {
          background: #f3f4f6;
          padding: 12px;
          border-radius: 6px;
          overflow-x: auto;
          margin-bottom: 1em;
        }
        .markdown-preview pre code {
          background: none;
          padding: 0;
        }
        .markdown-preview blockquote {
          border-left: 4px solid #d1d5db;
          padding-left: 1em;
          margin-left: 0;
          margin-bottom: 1em;
          color: #6b7280;
        }
        .markdown-preview a {
          color: #2563eb;
          text-decoration: underline;
        }
        .markdown-preview img {
          max-width: 100%;
          height: auto;
          border-radius: 6px;
        }
        .markdown-preview table {
          border-collapse: collapse;
          width: 100%;
          margin-bottom: 1em;
        }
        .markdown-preview th, .markdown-preview td {
          border: 1px solid #e5e7eb;
          padding: 8px 12px;
          text-align: left;
        }
        .markdown-preview th {
          background: #f9fafb;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
