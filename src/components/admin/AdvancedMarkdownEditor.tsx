'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
);

interface AdvancedMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
}

export function AdvancedMarkdownEditor({
  value,
  onChange,
  placeholder = '내용을 입력하세요...',
  height = 600
}: AdvancedMarkdownEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      {/* 사용 가이드 */}
      <div style={{
        marginBottom: '12px',
        padding: '16px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
        fontSize: '14px',
        color: '#ffffff',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <div style={{ fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
          ⚡ 에디터 단축키 가이드
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '13px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: '600' }}>Ctrl+B</span>
            <span>굵게</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: '600' }}>Ctrl+I</span>
            <span>기울임</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: '600' }}>Ctrl+K</span>
            <span>링크 삽입</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: '600' }}>Ctrl+H</span>
            <span>제목</span>
          </div>
        </div>
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.3)', fontSize: '13px' }}>
          <strong>💡 팁:</strong> 이미지를 드래그 앤 드롭하여 삽입 | 우측 상단 아이콘으로 전체화면/보기모드 전환
        </div>
      </div>

      {/* 에디터 */}
      <div data-color-mode="light">
        <MDEditor
          value={value}
          onChange={(val) => onChange(val || '')}
          height={height}
          preview="live"
          hideToolbar={false}
          enableScroll={true}
          visibleDragbar={true}
          highlightEnable={true}
          textareaProps={{
            placeholder: placeholder,
          }}
          commandsFilter={(command) => {
            // 각 명령어에 한글 제목 추가
            const koreanTitles: { [key: string]: string } = {
              'bold': '굵게 (Ctrl+B)',
              'italic': '기울임 (Ctrl+I)',
              'strikethrough': '취소선',
              'hr': '구분선',
              'title': '제목',
              'title1': '제목 1',
              'title2': '제목 2',
              'title3': '제목 3',
              'title4': '제목 4',
              'title5': '제목 5',
              'title6': '제목 6',
              'link': '링크 (Ctrl+K)',
              'quote': '인용구',
              'code': '인라인 코드',
              'codeBlock': '코드 블록',
              'comment': '주석',
              'image': '이미지',
              'unorderedListCommand': '목록',
              'orderedListCommand': '번호 목록',
              'checkedListCommand': '체크리스트',
              'table': '표 삽입',
              'help': '도움말',
            };

            if (command.name && koreanTitles[command.name]) {
              return {
                ...command,
                buttonProps: {
                  ...command.buttonProps,
                  title: koreanTitles[command.name],
                  'aria-label': koreanTitles[command.name],
                }
              };
            }
            return command;
          }}
          commands={[
            // 기본 명령어들
            ...require('@uiw/react-md-editor').commands.getCommands(),
          ]}
          extraCommands={[
            {
              ...require('@uiw/react-md-editor').commands.codeEdit,
              buttonProps: { title: '편집 모드', 'aria-label': '편집 모드' }
            },
            {
              ...require('@uiw/react-md-editor').commands.codeLive,
              buttonProps: { title: '라이브 모드 (편집+미리보기)', 'aria-label': '라이브 모드' }
            },
            {
              ...require('@uiw/react-md-editor').commands.codePreview,
              buttonProps: { title: '미리보기 모드', 'aria-label': '미리보기 모드' }
            },
            require('@uiw/react-md-editor').commands.divider,
            {
              ...require('@uiw/react-md-editor').commands.fullscreen,
              buttonProps: { title: '전체화면', 'aria-label': '전체화면' }
            },
          ]}
        />
      </div>

      {/* 추가 가이드 */}
      <details style={{
        marginTop: '12px',
        padding: '12px',
        background: '#fefce8',
        border: '1px solid #fde047',
        borderRadius: '8px',
        fontSize: '13px',
        color: '#713f12',
        cursor: 'pointer'
      }}>
        <summary style={{ fontWeight: '600', marginBottom: '8px' }}>
          📚 마크다운 문법 가이드
        </summary>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px',
          marginTop: '12px'
        }}>
          <div>
            <div style={{ fontWeight: '600', marginBottom: '8px', color: '#854d0e' }}>제목</div>
            <pre style={{
              background: '#fef9c3',
              padding: '8px',
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto'
            }}>{`# 제목 1
## 제목 2
### 제목 3`}</pre>
          </div>

          <div>
            <div style={{ fontWeight: '600', marginBottom: '8px', color: '#854d0e' }}>텍스트 강조</div>
            <pre style={{
              background: '#fef9c3',
              padding: '8px',
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto'
            }}>{`**굵게**
*기울임*
~~취소선~~
\`코드\``}</pre>
          </div>

          <div>
            <div style={{ fontWeight: '600', marginBottom: '8px', color: '#854d0e' }}>링크 & 이미지</div>
            <pre style={{
              background: '#fef9c3',
              padding: '8px',
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto'
            }}>{`[링크텍스트](URL)
![이미지설명](이미지URL)`}</pre>
          </div>

          <div>
            <div style={{ fontWeight: '600', marginBottom: '8px', color: '#854d0e' }}>리스트</div>
            <pre style={{
              background: '#fef9c3',
              padding: '8px',
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto'
            }}>{`- 항목 1
- 항목 2
  - 하위 항목

1. 번호 항목
2. 번호 항목`}</pre>
          </div>

          <div>
            <div style={{ fontWeight: '600', marginBottom: '8px', color: '#854d0e' }}>인용 & 코드블록</div>
            <pre style={{
              background: '#fef9c3',
              padding: '8px',
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto'
            }}>{`> 인용문

\`\`\`javascript
코드 블록
\`\`\``}</pre>
          </div>

          <div>
            <div style={{ fontWeight: '600', marginBottom: '8px', color: '#854d0e' }}>표</div>
            <pre style={{
              background: '#fef9c3',
              padding: '8px',
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto'
            }}>{`| 헤더1 | 헤더2 |
|------|------|
| 내용1 | 내용2 |`}</pre>
          </div>

          <div>
            <div style={{ fontWeight: '600', marginBottom: '8px', color: '#854d0e' }}>체크리스트</div>
            <pre style={{
              background: '#fef9c3',
              padding: '8px',
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto'
            }}>{`- [ ] 할 일 1
- [x] 완료된 일`}</pre>
          </div>

          <div>
            <div style={{ fontWeight: '600', marginBottom: '8px', color: '#854d0e' }}>구분선</div>
            <pre style={{
              background: '#fef9c3',
              padding: '8px',
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto'
            }}>{`---
***
___`}</pre>
          </div>
        </div>
      </details>

      <style jsx global>{`
        .w-md-editor {
          box-shadow: none !important;
          border: 1px solid #d1d5db !important;
          border-radius: 8px !important;
          overflow: hidden !important;
        }

        .w-md-editor-toolbar {
          background: #f9fafb !important;
          border-bottom: 1px solid #e5e7eb !important;
          padding: 12px 8px !important;
          min-height: 56px !important;
        }

        .w-md-editor-toolbar ul {
          display: flex !important;
          align-items: center !important;
          gap: 4px !important;
        }

        .w-md-editor-toolbar > ul > li {
          position: relative !important;
        }

        .w-md-editor-toolbar button {
          color: #374151 !important;
          border-radius: 6px !important;
          width: 38px !important;
          height: 38px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-size: 16px !important;
          transition: all 0.2s ease !important;
        }

        .w-md-editor-toolbar button svg {
          width: 18px !important;
          height: 18px !important;
        }

        .w-md-editor-toolbar button:hover {
          background: #e5e7eb !important;
          color: #111827 !important;
          transform: scale(1.05) !important;
        }

        .w-md-editor-toolbar li.active button {
          background: #dbeafe !important;
          color: #1e40af !important;
          border: 2px solid #3b82f6 !important;
        }

        .w-md-editor-toolbar-divider {
          height: 32px !important;
          margin: 0 4px !important;
        }

        /* 우측 상단 버튼 (편집/라이브/미리보기/전체화면) */
        .w-md-editor-toolbar-right button {
          width: 38px !important;
          height: 38px !important;
        }

        .w-md-editor-toolbar-right button svg {
          width: 18px !important;
          height: 18px !important;
        }

        /* 제목 드롭다운 세로 배치 */
        .w-md-editor-toolbar li ul {
          flex-direction: column !important;
          position: absolute !important;
          top: 100% !important;
          left: 0 !important;
          margin-top: 4px !important;
          background: white !important;
          border: 1px solid #d1d5db !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
          padding: 8px !important;
          z-index: 100 !important;
          min-width: 180px !important;
        }

        .w-md-editor-toolbar li ul li {
          margin: 0 !important;
          width: 100% !important;
        }

        .w-md-editor-toolbar li ul li button {
          width: 100% !important;
          height: 36px !important;
          justify-content: flex-start !important;
          padding: 0 12px !important;
          margin: 2px 0 !important;
          font-size: 14px !important;
          text-align: left !important;
        }

        .w-md-editor-toolbar li ul li button:hover {
          background: #f3f4f6 !important;
        }

        .w-md-editor-text-pre,
        .w-md-editor-text-input {
          font-size: 14px !important;
          line-height: 1.6 !important;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace !important;
        }

        .w-md-editor-preview {
          padding: 16px !important;
          background: #ffffff !important;
        }

        .wmde-markdown {
          font-size: 14px !important;
          line-height: 1.7 !important;
          color: #374151 !important;
        }

        .wmde-markdown h1 {
          font-size: 2em !important;
          font-weight: 700 !important;
          border-bottom: 2px solid #e5e7eb !important;
          padding-bottom: 0.3em !important;
          margin-top: 0 !important;
          margin-bottom: 16px !important;
        }

        .wmde-markdown h2 {
          font-size: 1.5em !important;
          font-weight: 600 !important;
          border-bottom: 1px solid #e5e7eb !important;
          padding-bottom: 0.3em !important;
          margin-top: 24px !important;
          margin-bottom: 16px !important;
        }

        .wmde-markdown h3 {
          font-size: 1.25em !important;
          font-weight: 600 !important;
          margin-top: 24px !important;
          margin-bottom: 16px !important;
        }

        .wmde-markdown code {
          background: #f3f4f6 !important;
          padding: 2px 6px !important;
          border-radius: 4px !important;
          font-size: 0.9em !important;
        }

        .wmde-markdown pre {
          background: #1f2937 !important;
          border-radius: 6px !important;
          padding: 16px !important;
        }

        .wmde-markdown pre code {
          background: transparent !important;
          color: #e5e7eb !important;
          padding: 0 !important;
        }

        .wmde-markdown blockquote {
          border-left: 4px solid #3b82f6 !important;
          padding-left: 16px !important;
          margin-left: 0 !important;
          color: #6b7280 !important;
          font-style: italic !important;
        }

        .wmde-markdown table {
          border-collapse: collapse !important;
          width: 100% !important;
          margin: 16px 0 !important;
        }

        .wmde-markdown table th,
        .wmde-markdown table td {
          border: 1px solid #e5e7eb !important;
          padding: 8px 12px !important;
        }

        .wmde-markdown table th {
          background: #f9fafb !important;
          font-weight: 600 !important;
        }

        .wmde-markdown img {
          max-width: 100% !important;
          border-radius: 8px !important;
          margin: 16px 0 !important;
        }

        .wmde-markdown a {
          color: #2563eb !important;
          text-decoration: underline !important;
        }

        .wmde-markdown ul,
        .wmde-markdown ol {
          padding-left: 2em !important;
          margin: 16px 0 !important;
        }

        .wmde-markdown li {
          margin: 4px 0 !important;
        }

        .w-md-editor-fullscreen {
          z-index: 1000 !important;
        }
      `}</style>
    </div>
  );
}
