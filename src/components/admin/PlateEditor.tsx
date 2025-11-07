'use client';

import { usePlateEditor, Plate, PlateContent, ParagraphPlugin } from 'platejs/react';
import {
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  StrikethroughPlugin,
  CodePlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  BlockquotePlugin,
} from '@platejs/basic-nodes/react';
import { useCallback } from 'react';

interface PlateEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function PlateEditor({ value, onChange, placeholder = '내용을 입력하세요...' }: PlateEditorProps) {
  // HTML을 Plate 포맷으로 변환
  const initialValue = value ? htmlToPlateValue(value) : [
    {
      type: 'p',
      children: [{ text: '' }],
    },
  ];

  const editor = usePlateEditor({
    value: initialValue,
    plugins: [
      ParagraphPlugin,
      H1Plugin,
      H2Plugin,
      H3Plugin,
      BlockquotePlugin,
      BoldPlugin,
      ItalicPlugin,
      UnderlinePlugin,
      StrikethroughPlugin,
      CodePlugin,
    ],
  });

  const toggleMark = useCallback((type: string) => {
    if (!editor) return;

    const isActive = editor.marks?.[type] === true;

    if (isActive) {
      editor.removeMark(type);
    } else {
      editor.addMark(type, true);
    }
  }, [editor]);

  const setBlockType = useCallback((type: string) => {
    if (!editor) return;

    editor.tf.toggle.block({
      type,
    });
  }, [editor]);

  return (
    <div style={{
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      overflow: 'hidden',
      background: '#fff'
    }}>
      {/* 툴바 */}
      <div style={{
        borderBottom: '1px solid #e5e7eb',
        padding: '12px',
        background: '#f9fafb',
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
      }}>
        {/* 텍스트 스타일 */}
        <ToolbarButton onClick={() => toggleMark('bold')} title="굵게 (Ctrl+B)">
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton onClick={() => toggleMark('italic')} title="기울임 (Ctrl+I)">
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton onClick={() => toggleMark('underline')} title="밑줄 (Ctrl+U)">
          <u>U</u>
        </ToolbarButton>
        <ToolbarButton onClick={() => toggleMark('strikethrough')} title="취소선">
          <s>S</s>
        </ToolbarButton>
        <ToolbarButton onClick={() => toggleMark('code')} title="코드">
          <code style={{ fontSize: '13px' }}>&lt;/&gt;</code>
        </ToolbarButton>

        <div style={{ width: '1px', background: '#d1d5db', margin: '0 4px' }} />

        {/* 제목 */}
        <ToolbarButton onClick={() => setBlockType('h1')} title="제목 1">
          H1
        </ToolbarButton>
        <ToolbarButton onClick={() => setBlockType('h2')} title="제목 2">
          H2
        </ToolbarButton>
        <ToolbarButton onClick={() => setBlockType('h3')} title="제목 3">
          H3
        </ToolbarButton>

        <div style={{ width: '1px', background: '#d1d5db', margin: '0 4px' }} />

        {/* 블록 */}
        <ToolbarButton onClick={() => setBlockType('blockquote')} title="인용">
          " 인용
        </ToolbarButton>
        <ToolbarButton onClick={() => setBlockType('p')} title="일반 텍스트">
          ¶ 문단
        </ToolbarButton>
      </div>

      <Plate
        editor={editor}
        onChange={({ value }) => {
          const html = plateValueToHtml(value);
          onChange(html);
        }}
      >
        <div
          style={{
            minHeight: '400px',
            padding: '16px',
            fontSize: '14px',
            lineHeight: '1.6',
          }}
        >
          <PlateContent
            placeholder={placeholder}
            style={{
              outline: 'none',
              minHeight: '400px',
            }}
          />
        </div>
      </Plate>
    </div>
  );
}

// 툴바 버튼 컴포넌트
function ToolbarButton({ onClick, title, children }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        padding: '6px 12px',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        background: '#fff',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'all 0.2s',
        minWidth: '38px',
        height: '38px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#f3f4f6';
        e.currentTarget.style.borderColor = '#9ca3af';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#fff';
        e.currentTarget.style.borderColor = '#d1d5db';
      }}
    >
      {children}
    </button>
  );
}

// HTML을 Plate 포맷으로 변환 (간단한 구현)
function htmlToPlateValue(html: string): any[] {
  if (!html || html.trim() === '' || html === '<p><br></p>') {
    return [
      {
        type: 'p',
        children: [{ text: '' }],
      },
    ];
  }

  // 간단한 텍스트 추출
  const text = html.replace(/<[^>]*>/g, '');

  return [
    {
      type: 'p',
      children: [{ text }],
    },
  ];
}

// Plate 포맷을 HTML로 변환
function plateValueToHtml(nodes: any[]): string {
  return nodes
    .map((node) => {
      if (node.text !== undefined) {
        let text = escapeHtml(node.text);
        if (node.bold) text = `<strong>${text}</strong>`;
        if (node.italic) text = `<em>${text}</em>`;
        if (node.underline) text = `<u>${text}</u>`;
        if (node.strikethrough) text = `<s>${text}</s>`;
        if (node.code) text = `<code>${text}</code>`;
        if (node.a) text = `<a href="${node.a}">${text}</a>`;
        return text;
      }

      const children = node.children?.map((child: any) => plateValueToHtml([child])).join('') || '';

      switch (node.type) {
        case 'h1':
          return `<h1>${children}</h1>`;
        case 'h2':
          return `<h2>${children}</h2>`;
        case 'h3':
          return `<h3>${children}</h3>`;
        case 'h4':
          return `<h4>${children}</h4>`;
        case 'h5':
          return `<h5>${children}</h5>`;
        case 'h6':
          return `<h6>${children}</h6>`;
        case 'blockquote':
          return `<blockquote>${children}</blockquote>`;
        case 'a':
          return `<a href="${node.url}">${children}</a>`;
        case 'p':
        default:
          return `<p>${children || '<br>'}</p>`;
      }
    })
    .join('');
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
