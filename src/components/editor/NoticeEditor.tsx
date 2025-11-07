'use client';

import { usePlateEditor, Plate, PlateContent, ParagraphPlugin } from 'platejs/react';
import {
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  CodePlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  H4Plugin,
  H5Plugin,
  H6Plugin,
  BlockquotePlugin,
} from '@platejs/basic-nodes/react';
import { LinkPlugin } from '@platejs/link/react';
import { FontColorPlugin, FontBackgroundColorPlugin, TextAlignPlugin } from '@platejs/basic-styles/react';
import { ListPlugin } from '@platejs/list/react';
import { useCallback, useRef, useState } from 'react';
import { Transforms, Element as SlateElement } from 'slate';

interface NoticeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function NoticeEditor({ value, onChange, placeholder = '내용을 입력하세요...' }: NoticeEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [imageWidth, setImageWidth] = useState<number>(300);

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
      H4Plugin,
      H5Plugin,
      H6Plugin,
      BlockquotePlugin,
      BoldPlugin,
      ItalicPlugin,
      UnderlinePlugin,
      CodePlugin,
      LinkPlugin,
      FontColorPlugin,
      FontBackgroundColorPlugin,
      ListPlugin,
      TextAlignPlugin,
    ],
  });

  const toggleMark = useCallback((type: string) => {
    if (!editor) return;

    const marks = editor.marks || {};
    const isActive = marks[type] === true;

    if (isActive) {
      editor.removeMark(type);
    } else {
      editor.addMark(type, true);
    }
  }, [editor]);

  const setBlockType = useCallback((type: string) => {
    if (!editor) return;

    const isActive = editor.children.some((node: any) => {
      return SlateElement.isElement(node) && node.type === type;
    });

    Transforms.setNodes(
      editor,
      { type: isActive ? 'p' : type } as Partial<SlateElement>,
      {
        match: (n) => SlateElement.isElement(n) && editor.isBlock(n),
      }
    );
  }, [editor]);

  const setTextAlign = useCallback((align: string) => {
    if (!editor) return;

    Transforms.setNodes(
      editor,
      { align } as any,
      {
        match: (n) => SlateElement.isElement(n) && editor.isBlock(n),
      }
    );
  }, [editor]);

  const applyColor = useCallback((color: string) => {
    if (!editor) return;
    editor.addMark('color', color);
    setShowColorPicker(false);
  }, [editor]);

  const handleImageUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;

      editor.insertNode({
        type: 'img',
        url,
        children: [{ text: '' }],
      });
    };
    reader.readAsDataURL(file);

    e.target.value = '';
  }, [editor]);

  const insertLink = useCallback(() => {
    if (!editor) return;

    const url = prompt('링크 URL을 입력하세요:');
    if (!url) return;

    const text = prompt('링크 텍스트를 입력하세요:', url);
    if (!text) return;

    editor.insertNode({
      type: 'a',
      url,
      children: [{ text }],
    });
  }, [editor]);

  const insertHorizontalRule = useCallback(() => {
    if (!editor) return;

    // hr 노드도 children이 필요함 (Slate 요구사항)
    editor.insertNode({
      type: 'hr',
      children: [{ text: '' }],
    } as any);

    // 구분선 다음에 새로운 단락 추가
    editor.insertNode({
      type: 'p',
      children: [{ text: '' }],
    });
  }, [editor]);

  const insertTable = useCallback(() => {
    if (!editor) return;

    const rows = prompt('행 개수:', '3');
    const cols = prompt('열 개수:', '3');

    if (!rows || !cols) return;

    const rowCount = parseInt(rows);
    const colCount = parseInt(cols);

    editor.insertNode({
      type: 'table',
      children: Array.from({ length: rowCount }, () => ({
        type: 'tr',
        children: Array.from({ length: colCount }, () => ({
          type: 'td',
          children: [{ type: 'p', children: [{ text: '' }] }],
        })),
      })),
    } as any);
  }, [editor]);

  const deleteElement = useCallback((element: any) => {
    if (!editor) return;

    const path = editor.selection?.anchor.path;
    if (path) {
      Transforms.removeNodes(editor, {
        at: path,
        match: (n) => n === element
      });
    }
    setSelectedElement(null);
  }, [editor]);

  // 커스텀 렌더러 - hr과 테이블을 특별하게 처리
  const renderElement = useCallback((props: any) => {
    const { element, children, attributes } = props;
    const isSelected = selectedElement === element;

    if (element.type === 'hr') {
      return (
        <div {...attributes} contentEditable={false} style={{
          margin: '24px 0',
          cursor: 'pointer',
          position: 'relative'
        }}
        onClick={() => setSelectedElement(element)}>
          <hr style={{
            border: 0,
            borderTop: isSelected ? '2px solid #2563eb' : '2px solid #e5e7eb',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxShadow: isSelected ? '0 0 0 2px rgba(37, 99, 235, 0.2)' : 'none'
          }}
          onMouseOver={(e) => {
            if (!isSelected) {
              e.currentTarget.style.borderTopColor = '#2563eb';
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(37, 99, 235, 0.2)';
            }
          }}
          onMouseOut={(e) => {
            if (!isSelected) {
              e.currentTarget.style.borderTopColor = '#e5e7eb';
              e.currentTarget.style.boxShadow = 'none';
            }
          }} />
          {isSelected && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteElement(element);
              }}
              style={{
                position: 'absolute',
                top: '-10px',
                right: '0',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '12px',
                cursor: 'pointer',
                zIndex: 10
              }}
            >
              삭제
            </button>
          )}
        </div>
      );
    }

    if (element.type === 'table') {
      return (
        <div {...attributes} contentEditable={false} style={{
          margin: '16px 0',
          cursor: 'pointer',
          position: 'relative'
        }}
        onClick={() => setSelectedElement(element)}>
          <table style={{
            borderCollapse: 'collapse',
            width: '100%',
            border: '2px solid #374151',
            background: '#fff',
            transition: 'box-shadow 0.2s',
            boxShadow: isSelected ? '0 0 0 2px #2563eb' : 'none'
          }}
          onMouseOver={(e) => {
            if (!isSelected) e.currentTarget.style.boxShadow = '0 0 0 2px #2563eb';
          }}
          onMouseOut={(e) => {
            if (!isSelected) e.currentTarget.style.boxShadow = 'none';
          }}>
            <tbody>{children}</tbody>
          </table>
          {isSelected && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteElement(element);
              }}
              style={{
                position: 'absolute',
                top: '-10px',
                right: '0',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '12px',
                cursor: 'pointer',
                zIndex: 10
              }}
            >
              삭제
            </button>
          )}
        </div>
      );
    }

    if (element.type === 'tr') {
      return (
        <tr {...attributes} style={{
          borderBottom: '1px solid #9ca3af'
        }}>
          {children}
        </tr>
      );
    }

    if (element.type === 'td') {
      return (
        <td {...attributes} style={{
          border: '1px solid #9ca3af',
          padding: '8px',
          minWidth: '50px',
          background: '#fff'
        }}>
          {children}
        </td>
      );
    }

    if (element.type === 'th') {
      return (
        <th {...attributes} style={{
          border: '1px solid #9ca3af',
          padding: '8px',
          background: '#f3f4f6',
          fontWeight: 600,
          minWidth: '50px'
        }}>
          {children}
        </th>
      );
    }

    if (element.type === 'img') {
      const currentWidth = element.width || imageWidth;

      return (
        <div {...attributes} contentEditable={false} style={{
          margin: '8px 0',
          cursor: 'pointer',
          position: 'relative',
          display: 'inline-block',
          width: isSelected ? `${currentWidth}px` : 'auto'
        }}
        onClick={() => setSelectedElement(element)}>
          <img
            src={element.url}
            alt=""
            style={{
              width: isSelected ? `${currentWidth}px` : 'auto',
              maxWidth: '100%',
              height: 'auto',
              display: 'block',
              border: isSelected ? '2px solid #2563eb' : '2px solid transparent',
              borderRadius: '4px',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              boxShadow: isSelected ? '0 0 0 2px rgba(37, 99, 235, 0.2)' : 'none'
            }}
            onMouseOver={(e) => {
              if (!isSelected) {
                e.currentTarget.style.borderColor = '#2563eb';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(37, 99, 235, 0.2)';
              }
            }}
            onMouseOut={(e) => {
              if (!isSelected) {
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          />
          {isSelected && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteElement(element);
                }}
                style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '0',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  zIndex: 10
                }}
              >
                삭제
              </button>
              <div
                style={{
                  position: 'absolute',
                  right: '0',
                  bottom: '0',
                  width: '16px',
                  height: '16px',
                  background: '#2563eb',
                  borderRadius: '0 0 4px 0',
                  cursor: 'nwse-resize',
                  zIndex: 10
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const startX = e.clientX;
                  const startWidth = currentWidth;

                  const handleMouseMove = (moveEvent: MouseEvent) => {
                    const deltaX = moveEvent.clientX - startX;
                    const newWidth = Math.max(100, startWidth + deltaX);
                    setImageWidth(newWidth);
                    element.width = newWidth;
                  };

                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };

                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              />
            </>
          )}
        </div>
      );
    }

    return undefined;
  }, [selectedElement, imageWidth, deleteElement, setSelectedElement, setImageWidth]);

  return (
    <div style={{
      display: 'flex',
      gap: '16px',
      height: '600px'
    }}>
      {/* 에디터 영역 */}
      <div style={{
        flex: 1,
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        overflow: 'hidden',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* 툴바 */}
        <div style={{
          borderBottom: '1px solid #e5e7eb',
          padding: '8px',
          background: '#f9fafb',
          display: 'flex',
          gap: '6px',
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
        <ToolbarButton onClick={() => toggleMark('code')} title="코드">
          <code style={{ fontSize: '13px' }}>&lt;/&gt;</code>
        </ToolbarButton>

        {/* 색상 */}
        <div style={{ position: 'relative' }}>
          <ToolbarButton onClick={() => setShowColorPicker(!showColorPicker)} title="글자 색상">
            <span style={{ color: currentColor }}>A</span>
          </ToolbarButton>
          {showColorPicker && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '4px',
              background: '#fff',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              padding: '8px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              zIndex: 1000,
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '4px'
            }}>
              {['#000000', '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#95a5a6', '#ffffff'].map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    setCurrentColor(color);
                    applyColor(color);
                  }}
                  style={{
                    width: '24px',
                    height: '24px',
                    background: color,
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <Divider />

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
        <ToolbarButton onClick={() => setBlockType('h4')} title="제목 4">
          H4
        </ToolbarButton>
        <ToolbarButton onClick={() => setBlockType('h5')} title="제목 5">
          H5
        </ToolbarButton>
        <ToolbarButton onClick={() => setBlockType('h6')} title="제목 6">
          H6
        </ToolbarButton>
        <ToolbarButton onClick={() => setBlockType('p')} title="본문">
          본문
        </ToolbarButton>

        <Divider />

        {/* 리스트 */}
        <ToolbarButton onClick={() => setBlockType('ul')} title="불릿 목록">
          • 목록
        </ToolbarButton>
        <ToolbarButton onClick={() => setBlockType('ol')} title="번호 목록">
          1. 목록
        </ToolbarButton>

        <Divider />

        {/* 정렬 */}
        <ToolbarButton onClick={() => setTextAlign('left')} title="왼쪽 정렬">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="2" y="3" width="12" height="2" rx="1"/>
            <rect x="2" y="7" width="8" height="2" rx="1"/>
            <rect x="2" y="11" width="10" height="2" rx="1"/>
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => setTextAlign('center')} title="가운데 정렬">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="2" y="3" width="12" height="2" rx="1"/>
            <rect x="4" y="7" width="8" height="2" rx="1"/>
            <rect x="3" y="11" width="10" height="2" rx="1"/>
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => setTextAlign('right')} title="오른쪽 정렬">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="2" y="3" width="12" height="2" rx="1"/>
            <rect x="6" y="7" width="8" height="2" rx="1"/>
            <rect x="4" y="11" width="10" height="2" rx="1"/>
          </svg>
        </ToolbarButton>

        <Divider />

        {/* 블록 */}
        <ToolbarButton onClick={() => setBlockType('blockquote')} title="인용">
          " 인용
        </ToolbarButton>

        <Divider />

        {/* 삽입 */}
        <ToolbarButton onClick={handleImageUpload} title="이미지 삽입">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M14 2H2C1.45 2 1 2.45 1 3v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1zM13 12H3V4h10v8z"/>
            <path d="M5 7.5c.83 0 1.5-.67 1.5-1.5S5.83 4.5 5 4.5 3.5 5.17 3.5 6 4.17 7.5 5 7.5z"/>
            <path d="M12 11H4l2.5-3 1.5 2 2-2.5L12 11z"/>
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={insertLink} title="링크 삽입">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z"/>
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={insertTable} title="테이블 삽입">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M14 2H2c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1zM7 13H3V9h4v4zm0-5H3V4h4v4zm6 5H8V9h5v4zm0-5H8V4h5v4z"/>
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={insertHorizontalRule} title="구분선 삽입">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="2" y="7" width="12" height="2" rx="1"/>
          </svg>
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

        <Plate
          editor={editor}
          onChange={({ value }) => {
            const html = plateValueToHtml(value);
            onChange(html);
          }}
        >
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '16px',
              fontSize: '14px',
              lineHeight: '1.6',
            }}
          >
            <PlateContent
              placeholder={placeholder}
              renderElement={renderElement}
              style={{
                outline: 'none',
                minHeight: '100%',
              }}
            />
          </div>
        </Plate>
      </div>

      {/* 미리보기 영역 */}
      <div style={{
        flex: 1,
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          borderBottom: '1px solid #e5e7eb',
          padding: '8px',
          background: '#f9fafb',
          fontWeight: 600,
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          minHeight: '48px'
        }}>
          미리보기
        </div>
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px',
          fontSize: '14px',
          lineHeight: '1.6',
        }}>
          {value ? (
            <div dangerouslySetInnerHTML={{ __html: value }} />
          ) : (
            <p style={{ color: '#9ca3af' }}>내용을 입력하면 미리보기가 표시됩니다.</p>
          )}
        </div>
      </div>
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
        padding: '4px 8px',
        border: '1px solid #d1d5db',
        borderRadius: '4px',
        background: '#fff',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: '500',
        transition: 'all 0.2s',
        minWidth: '32px',
        height: '32px',
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

// Divider 컴포넌트
function Divider() {
  return <div style={{ width: '1px', background: '#d1d5db', margin: '0 4px' }} />;
}

// HTML을 Plate 포맷으로 변환
function htmlToPlateValue(html: string): any[] {
  if (!html || html.trim() === '' || html === '<p><br></p>') {
    return [
      {
        type: 'p',
        children: [{ text: '' }],
      },
    ];
  }

  if (typeof document === 'undefined') {
    // 서버 사이드에서는 간단한 파싱
    return [
      {
        type: 'p',
        children: [{ text: html.replace(/<[^>]*>/g, '') }],
      },
    ];
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  function parseNode(node: Node): any {
    if (node.nodeType === Node.TEXT_NODE) {
      return { text: node.textContent || '' };
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();
      const children: any[] = [];

      node.childNodes.forEach((child) => {
        const parsed = parseNode(child);
        if (Array.isArray(parsed)) {
          children.push(...parsed);
        } else if (parsed) {
          children.push(parsed);
        }
      });

      // 빈 children 처리
      const safeChildren = children.length > 0 ? children : [{ text: '' }];

      const style = element.getAttribute('style') || '';
      const align = style.includes('text-align: center') ? 'center'
        : style.includes('text-align: right') ? 'right'
        : style.includes('text-align: left') ? 'left' : undefined;

      const baseNode: any = align ? { align } : {};

      switch (tagName) {
        case 'h1':
          return { ...baseNode, type: 'h1', children: safeChildren };
        case 'h2':
          return { ...baseNode, type: 'h2', children: safeChildren };
        case 'h3':
          return { ...baseNode, type: 'h3', children: safeChildren };
        case 'h4':
          return { ...baseNode, type: 'h4', children: safeChildren };
        case 'h5':
          return { ...baseNode, type: 'h5', children: safeChildren };
        case 'h6':
          return { ...baseNode, type: 'h6', children: safeChildren };
        case 'p':
          return { ...baseNode, type: 'p', children: safeChildren };
        case 'blockquote':
          return { ...baseNode, type: 'blockquote', children: safeChildren };
        case 'ul':
          return { type: 'ul', children: safeChildren };
        case 'ol':
          return { type: 'ol', children: safeChildren };
        case 'li':
          return { type: 'li', children: safeChildren };
        case 'table':
          return { type: 'table', children: safeChildren };
        case 'tr':
          return { type: 'tr', children: safeChildren };
        case 'td':
          return { type: 'td', children: safeChildren };
        case 'th':
          return { type: 'th', children: safeChildren };
        case 'hr':
          return { type: 'hr', children: [{ text: '' }] };
        case 'strong':
        case 'b':
          return safeChildren.map((child: any) =>
            typeof child === 'object' && 'text' in child
              ? { ...child, bold: true }
              : child
          );
        case 'em':
        case 'i':
          return safeChildren.map((child: any) =>
            typeof child === 'object' && 'text' in child
              ? { ...child, italic: true }
              : child
          );
        case 'u':
          return safeChildren.map((child: any) =>
            typeof child === 'object' && 'text' in child
              ? { ...child, underline: true }
              : child
          );
        case 'code':
          return safeChildren.map((child: any) =>
            typeof child === 'object' && 'text' in child
              ? { ...child, code: true }
              : child
          );
        case 'a':
          return {
            type: 'a',
            url: element.getAttribute('href') || '',
            children: safeChildren,
          };
        case 'img':
          const imgNode: any = {
            type: 'img',
            url: element.getAttribute('src') || '',
            children: [{ text: '' }],
          };
          // style에서 width 추출
          const imgStyle = element.getAttribute('style') || '';
          const widthMatch = imgStyle.match(/width:\s*(\d+)px/);
          if (widthMatch) {
            imgNode.width = parseInt(widthMatch[1]);
          }
          return imgNode;
        case 'span':
          const color = style.match(/color:\s*([^;]+)/)?.[1];
          const bgColor = style.match(/background-color:\s*([^;]+)/)?.[1];
          return safeChildren.map((child: any) => {
            if (typeof child === 'object' && 'text' in child) {
              const result = { ...child };
              if (color) result.color = color;
              if (bgColor) result.backgroundColor = bgColor;
              return result;
            }
            return child;
          });
        case 'br':
          return { text: '\n' };
        default:
          return safeChildren;
      }
    }

    return null;
  }

  const result: any[] = [];
  doc.body.childNodes.forEach((node) => {
    const parsed = parseNode(node);
    if (Array.isArray(parsed)) {
      result.push(...parsed);
    } else if (parsed && typeof parsed === 'object' && parsed.type) {
      result.push(parsed);
    } else if (parsed && typeof parsed === 'object' && 'text' in parsed) {
      // 텍스트 노드를 p로 감싸기
      result.push({ type: 'p', children: [parsed] });
    }
  });

  return result.length > 0 ? result : [{ type: 'p', children: [{ text: '' }] }];
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
        if (node.code) text = `<code>${text}</code>`;
        if (node.color) text = `<span style="color: ${node.color}">${text}</span>`;
        if (node.backgroundColor) text = `<span style="background-color: ${node.backgroundColor}">${text}</span>`;
        return text;
      }

      const children = node.children?.map((child: any) => plateValueToHtml([child])).join('') || '';
      const alignStyle = node.align ? ` style="text-align: ${node.align}"` : '';

      switch (node.type) {
        case 'h1':
          return `<h1${alignStyle}>${children}</h1>`;
        case 'h2':
          return `<h2${alignStyle}>${children}</h2>`;
        case 'h3':
          return `<h3${alignStyle}>${children}</h3>`;
        case 'h4':
          return `<h4${alignStyle}>${children}</h4>`;
        case 'h5':
          return `<h5${alignStyle}>${children}</h5>`;
        case 'h6':
          return `<h6${alignStyle}>${children}</h6>`;
        case 'blockquote':
          return `<blockquote${alignStyle}>${children}</blockquote>`;
        case 'ul':
          return `<ul>${children}</ul>`;
        case 'ol':
          return `<ol>${children}</ol>`;
        case 'li':
          return `<li>${children}</li>`;
        case 'table':
          return `<table style="border-collapse: collapse; width: 100%; border: 2px solid #374151; background: #fff; margin: 16px 0;">${children}</table>`;
        case 'tr':
          return `<tr style="border-bottom: 1px solid #9ca3af;">${children}</tr>`;
        case 'td':
          return `<td style="border: 1px solid #9ca3af; padding: 8px; background: #fff;">${children}</td>`;
        case 'th':
          return `<th style="border: 1px solid #9ca3af; padding: 8px; background: #f3f4f6; font-weight: 600;">${children}</th>`;
        case 'img':
          const widthStyle = node.width ? `width: ${node.width}px; ` : '';
          return `<img src="${node.url}" alt="" style="${widthStyle}max-width: 100%; height: auto;" />`;
        case 'a':
          return `<a href="${node.url}" target="_blank" rel="noopener noreferrer">${children}</a>`;
        case 'hr':
          return `<hr style="border: 0; border-top: 2px solid #e5e7eb; margin: 24px 0;" />`;
        case 'p':
        default:
          return `<p${alignStyle}>${children || '<br>'}</p>`;
      }
    })
    .join('');
}

function escapeHtml(text: string): string {
  if (typeof document === 'undefined') return text;
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
