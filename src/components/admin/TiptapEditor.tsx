'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { Highlight } from '@tiptap/extension-highlight';
import { useCallback } from 'react';

interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function TiptapEditor({ value, onChange, placeholder = '내용을 입력하세요...' }: TiptapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[500px] p-4',
      },
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('링크 URL을 입력하세요:', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;

    const url = window.prompt('이미지 URL을 입력하세요:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="tiptap-editor" style={{ border: '1px solid #d1d5db', borderRadius: '12px', overflow: 'hidden' }}>
      {/* 툴바 */}
      <div style={{
        background: '#f9fafb',
        borderBottom: '1px solid #e5e7eb',
        padding: '12px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        alignItems: 'center'
      }}>
        {/* 텍스트 스타일 */}
        <div style={{ display: 'flex', gap: '4px', borderRight: '1px solid #e5e7eb', paddingRight: '8px' }}>
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'is-active' : ''}
            style={{
              padding: '8px 12px',
              background: editor.isActive('bold') ? '#dbeafe' : '#fff',
              border: editor.isActive('bold') ? '2px solid #3b82f6' : '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
            title="굵게 (Ctrl+B)"
          >
            B
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'is-active' : ''}
            style={{
              padding: '8px 12px',
              background: editor.isActive('italic') ? '#dbeafe' : '#fff',
              border: editor.isActive('italic') ? '2px solid #3b82f6' : '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontStyle: 'italic',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
            title="기울임 (Ctrl+I)"
          >
            I
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive('underline') ? 'is-active' : ''}
            style={{
              padding: '8px 12px',
              background: editor.isActive('underline') ? '#dbeafe' : '#fff',
              border: editor.isActive('underline') ? '2px solid #3b82f6' : '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
            title="밑줄 (Ctrl+U)"
          >
            U
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={!editor.can().chain().focus().toggleStrike().run()}
            className={editor.isActive('strike') ? 'is-active' : ''}
            style={{
              padding: '8px 12px',
              background: editor.isActive('strike') ? '#dbeafe' : '#fff',
              border: editor.isActive('strike') ? '2px solid #3b82f6' : '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              textDecoration: 'line-through',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
            title="취소선"
          >
            S
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={editor.isActive('highlight') ? 'is-active' : ''}
            style={{
              padding: '8px 12px',
              background: editor.isActive('highlight') ? '#fef08a' : '#fff',
              border: editor.isActive('highlight') ? '2px solid #eab308' : '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
            title="형광펜"
          >
            🖍️
          </button>
        </div>

        {/* 제목 */}
        <div style={{ display: 'flex', gap: '4px', borderRight: '1px solid #e5e7eb', paddingRight: '8px' }}>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
            style={{
              padding: '8px 12px',
              background: editor.isActive('heading', { level: 1 }) ? '#dbeafe' : '#fff',
              border: editor.isActive('heading', { level: 1 }) ? '2px solid #3b82f6' : '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
            title="제목 1"
          >
            H1
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
            style={{
              padding: '8px 12px',
              background: editor.isActive('heading', { level: 2 }) ? '#dbeafe' : '#fff',
              border: editor.isActive('heading', { level: 2 }) ? '2px solid #3b82f6' : '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
            title="제목 2"
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
            style={{
              padding: '8px 12px',
              background: editor.isActive('heading', { level: 3 }) ? '#dbeafe' : '#fff',
              border: editor.isActive('heading', { level: 3 }) ? '2px solid #3b82f6' : '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
            title="제목 3"
          >
            H3
          </button>
        </div>

        {/* 리스트 */}
        <div style={{ display: 'flex', gap: '4px', borderRight: '1px solid #e5e7eb', paddingRight: '8px' }}>
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'is-active' : ''}
            style={{
              padding: '8px 12px',
              background: editor.isActive('bulletList') ? '#dbeafe' : '#fff',
              border: editor.isActive('bulletList') ? '2px solid #3b82f6' : '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
            title="목록"
          >
            • 목록
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'is-active' : ''}
            style={{
              padding: '8px 12px',
              background: editor.isActive('orderedList') ? '#dbeafe' : '#fff',
              border: editor.isActive('orderedList') ? '2px solid #3b82f6' : '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
            title="번호 목록"
          >
            1. 번호
          </button>
          <button
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={editor.isActive('taskList') ? 'is-active' : ''}
            style={{
              padding: '8px 12px',
              background: editor.isActive('taskList') ? '#dbeafe' : '#fff',
              border: editor.isActive('taskList') ? '2px solid #3b82f6' : '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
            title="체크리스트"
          >
            ☑ 체크
          </button>
        </div>

        {/* 삽입 */}
        <div style={{ display: 'flex', gap: '4px', borderRight: '1px solid #e5e7eb', paddingRight: '8px' }}>
          <button
            onClick={setLink}
            className={editor.isActive('link') ? 'is-active' : ''}
            style={{
              padding: '8px 12px',
              background: editor.isActive('link') ? '#dbeafe' : '#fff',
              border: editor.isActive('link') ? '2px solid #3b82f6' : '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
            title="링크 (Ctrl+K)"
          >
            🔗 링크
          </button>
          <button
            onClick={addImage}
            style={{
              padding: '8px 12px',
              background: '#fff',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
            title="이미지"
          >
            🖼️ 이미지
          </button>
          <button
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            style={{
              padding: '8px 12px',
              background: '#fff',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
            title="표 삽입"
          >
            📊 표
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive('blockquote') ? 'is-active' : ''}
            style={{
              padding: '8px 12px',
              background: editor.isActive('blockquote') ? '#dbeafe' : '#fff',
              border: editor.isActive('blockquote') ? '2px solid #3b82f6' : '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
            title="인용구"
          >
            ❝ 인용
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={editor.isActive('codeBlock') ? 'is-active' : ''}
            style={{
              padding: '8px 12px',
              background: editor.isActive('codeBlock') ? '#dbeafe' : '#fff',
              border: editor.isActive('codeBlock') ? '2px solid #3b82f6' : '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontFamily: 'monospace',
              transition: 'all 0.2s'
            }}
            title="코드 블록"
          >
            {'</>'}
          </button>
          <button
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            style={{
              padding: '8px 12px',
              background: '#fff',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
            title="구분선"
          >
            ─ 선
          </button>
        </div>

        {/* 정렬 */}
        <div style={{ display: 'flex', gap: '4px', borderRight: '1px solid #e5e7eb', paddingRight: '8px' }}>
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}
            style={{
              padding: '8px 12px',
              background: editor.isActive({ textAlign: 'left' }) ? '#dbeafe' : '#fff',
              border: editor.isActive({ textAlign: 'left' }) ? '2px solid #3b82f6' : '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
            title="왼쪽 정렬"
          >
            ⬅️
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}
            style={{
              padding: '8px 12px',
              background: editor.isActive({ textAlign: 'center' }) ? '#dbeafe' : '#fff',
              border: editor.isActive({ textAlign: 'center' }) ? '2px solid #3b82f6' : '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
            title="가운데 정렬"
          >
            ↔️
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}
            style={{
              padding: '8px 12px',
              background: editor.isActive({ textAlign: 'right' }) ? '#dbeafe' : '#fff',
              border: editor.isActive({ textAlign: 'right' }) ? '2px solid #3b82f6' : '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
            title="오른쪽 정렬"
          >
            ➡️
          </button>
        </div>

        {/* 실행취소 */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            style={{
              padding: '8px 12px',
              background: '#fff',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: editor.can().chain().focus().undo().run() ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              opacity: editor.can().chain().focus().undo().run() ? 1 : 0.5,
              transition: 'all 0.2s'
            }}
            title="실행취소 (Ctrl+Z)"
          >
            ↶ 실행취소
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            style={{
              padding: '8px 12px',
              background: '#fff',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: editor.can().chain().focus().redo().run() ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              opacity: editor.can().chain().focus().redo().run() ? 1 : 0.5,
              transition: 'all 0.2s'
            }}
            title="다시실행 (Ctrl+Y)"
          >
            ↷ 다시실행
          </button>
        </div>
      </div>

      {/* 에디터 */}
      <EditorContent editor={editor} />

      <style jsx global>{`
        .tiptap-editor .ProseMirror {
          min-height: 500px;
          padding: 20px;
          outline: none;
        }

        .tiptap-editor .ProseMirror:focus {
          outline: none;
        }

        .tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
          color: #adb5bd;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }

        .tiptap-editor h1 {
          font-size: 2em;
          font-weight: 700;
          margin-top: 1em;
          margin-bottom: 0.5em;
          line-height: 1.2;
        }

        .tiptap-editor h2 {
          font-size: 1.5em;
          font-weight: 600;
          margin-top: 1em;
          margin-bottom: 0.5em;
          line-height: 1.3;
        }

        .tiptap-editor h3 {
          font-size: 1.25em;
          font-weight: 600;
          margin-top: 1em;
          margin-bottom: 0.5em;
          line-height: 1.4;
        }

        .tiptap-editor p {
          margin-bottom: 1em;
          line-height: 1.7;
        }

        .tiptap-editor ul,
        .tiptap-editor ol {
          padding-left: 1.5em;
          margin-bottom: 1em;
        }

        .tiptap-editor ul[data-type="taskList"] {
          list-style: none;
          padding: 0;
        }

        .tiptap-editor ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 0.5em;
        }

        .tiptap-editor ul[data-type="taskList"] li > label {
          flex: 0 0 auto;
          margin-right: 0.5rem;
          user-select: none;
        }

        .tiptap-editor ul[data-type="taskList"] li > div {
          flex: 1 1 auto;
        }

        .tiptap-editor li {
          margin-bottom: 0.5em;
        }

        .tiptap-editor code {
          background-color: #f3f4f6;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
        }

        .tiptap-editor pre {
          background: #1f2937;
          color: #e5e7eb;
          font-family: 'Courier New', monospace;
          padding: 1em;
          border-radius: 8px;
          overflow-x: auto;
          margin: 1em 0;
        }

        .tiptap-editor pre code {
          background: none;
          color: inherit;
          padding: 0;
        }

        .tiptap-editor blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 1em;
          margin: 1em 0;
          color: #6b7280;
          font-style: italic;
        }

        .tiptap-editor table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          margin: 1em 0;
          overflow: hidden;
        }

        .tiptap-editor table td,
        .tiptap-editor table th {
          min-width: 1em;
          border: 2px solid #e5e7eb;
          padding: 8px 12px;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
        }

        .tiptap-editor table th {
          font-weight: 600;
          text-align: left;
          background-color: #f9fafb;
        }

        .tiptap-editor table .selectedCell {
          background: #dbeafe;
        }

        .tiptap-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1em 0;
        }

        .tiptap-editor a {
          color: #2563eb;
          cursor: pointer;
          text-decoration: underline;
        }

        .tiptap-editor hr {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin: 2em 0;
        }

        .tiptap-editor mark {
          background-color: #fef08a;
          padding: 2px 0;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}
