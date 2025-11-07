'use client';

import React, { useMemo, useRef } from 'react';
import { createPlateEditor, Plate, PlateContent } from '@udecode/plate-common';
import { createParagraphPlugin } from '@udecode/plate-basic-nodes';
import { createHeadingPlugin } from '@udecode/plate-heading';
import {
  createBoldPlugin,
  createItalicPlugin,
  createUnderlinePlugin,
  createStrikethroughPlugin,
  createCodePlugin,
} from '@udecode/plate-basic-marks';
import { createLinkPlugin } from '@udecode/plate-link';
import {
  createListPlugin,
  createTodoListPlugin,
} from '@udecode/plate-list';
import { createImagePlugin } from '@udecode/plate-media';
import { createTablePlugin } from '@udecode/plate-table';
import { createHorizontalRulePlugin } from '@udecode/plate-horizontal-rule';
import { createAlignPlugin } from '@udecode/plate-alignment';
import { createIndentPlugin } from '@udecode/plate-indent';
import { createAutoformatPlugin } from '@udecode/plate-autoformat';

interface AnnouncementEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export function AnnouncementEditor({
  value,
  onChange,
  placeholder = '공지사항 내용을 입력하세요...'
}: AnnouncementEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useMemo(() => {
    const initialValue = value ? JSON.parse(value) : [
      {
        type: 'p',
        children: [{ text: '' }],
      },
    ];

    return createPlateEditor({
      plugins: [
        createParagraphPlugin(),
        createHeadingPlugin(),
        createBoldPlugin(),
        createItalicPlugin(),
        createUnderlinePlugin(),
        createStrikethroughPlugin(),
        createCodePlugin(),
        createLinkPlugin(),
        createListPlugin(),
        createTodoListPlugin(),
        createImagePlugin(),
        createTablePlugin(),
        createHorizontalRulePlugin(),
        createAlignPlugin(),
        createIndentPlugin(),
        createAutoformatPlugin(),
      ],
      value: initialValue,
    });
  }, [value]);

  const handleChange = (newValue: any) => {
    if (onChange) {
      onChange(JSON.stringify(newValue));
    }
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;

      // Insert image node
      editor.insertNode({
        type: 'img',
        url,
        children: [{ text: '' }],
      } as any);
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = '';
  };

  const insertLink = () => {
    const url = prompt('링크 URL을 입력하세요:');
    if (!url) return;

    const text = prompt('링크 텍스트를 입력하세요:', url);
    if (!text) return;

    editor.insertNode({
      type: 'a',
      url,
      children: [{ text }],
    } as any);
  };

  const toggleMark = (mark: string) => {
    editor.tf.toggle.mark({ key: mark });
  };

  const setBlockType = (type: string) => {
    editor.tf.toggle.block({ type });
  };

  const insertHorizontalRule = () => {
    editor.insertNode({
      type: 'hr',
      children: [{ text: '' }],
    } as any);
  };

  const setAlignment = (align: string) => {
    editor.tf.toggle.block({ type: 'p' });
    // Set alignment on current block
  };

  return (
    <div style={{
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      overflow: 'hidden',
      background: '#fff'
    }}>
      {/* Toolbar */}
      <div style={{
        borderBottom: '1px solid #e5e7eb',
        padding: '12px',
        background: '#f9fafb',
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
      }}>
        {/* Text Marks */}
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

        <Divider />

        {/* Headings */}
        <ToolbarButton onClick={() => setBlockType('h1')} title="제목 1">
          H1
        </ToolbarButton>
        <ToolbarButton onClick={() => setBlockType('h2')} title="제목 2">
          H2
        </ToolbarButton>
        <ToolbarButton onClick={() => setBlockType('h3')} title="제목 3">
          H3
        </ToolbarButton>

        <Divider />

        {/* Lists */}
        <ToolbarButton onClick={() => setBlockType('ul')} title="불릿 목록">
          • 목록
        </ToolbarButton>
        <ToolbarButton onClick={() => setBlockType('ol')} title="번호 목록">
          1. 목록
        </ToolbarButton>

        <Divider />

        {/* Alignment */}
        <ToolbarButton onClick={() => setAlignment('left')} title="왼쪽 정렬">
          ⬅ 왼쪽
        </ToolbarButton>
        <ToolbarButton onClick={() => setAlignment('center')} title="가운데 정렬">
          ⬌ 가운데
        </ToolbarButton>
        <ToolbarButton onClick={() => setAlignment('right')} title="오른쪽 정렬">
          ➡ 오른쪽
        </ToolbarButton>

        <Divider />

        {/* Insert */}
        <ToolbarButton onClick={handleImageUpload} title="이미지 삽입">
          🖼 이미지
        </ToolbarButton>
        <ToolbarButton onClick={insertLink} title="링크 삽입">
          🔗 링크
        </ToolbarButton>
        <ToolbarButton onClick={insertHorizontalRule} title="구분선 삽입">
          ━ 구분선
        </ToolbarButton>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Editor */}
      <Plate editor={editor} onChange={handleChange}>
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

// Toolbar Button Component
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

// Divider Component
function Divider() {
  return <div style={{ width: '1px', background: '#d1d5db', margin: '0 4px' }} />;
}
