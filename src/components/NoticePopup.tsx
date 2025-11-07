'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import DOMPurify from 'isomorphic-dompurify';

interface Notice {
  id: number;
  title: string;
  content: string;
  category: string;
  created_at: string;
}

export function NoticePopup() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowToday, setDontShowToday] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadPopupNotices();
  }, []);

  const loadPopupNotices = async () => {
    try {
      // 고정되고 공개된 공지사항만 조회 (platform_notices 테이블 사용)
      const { data, error } = await supabase
        .from('platform_notices')
        .select('id, title, content, category, created_at')
        .eq('is_pinned', true)  // is_popup 대신 is_pinned 사용
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      if (data && data.length > 0) {
        // 오늘 하루 보지 않기로 설정한 공지사항 필터링
        const hiddenNoticesStr = localStorage.getItem('hiddenNotices');
        const hiddenNotices = hiddenNoticesStr ? JSON.parse(hiddenNoticesStr) : {};
        const today = new Date().toDateString();

        const visibleNotices = data.filter(notice => {
          const hiddenDate = hiddenNotices[notice.id];
          return !hiddenDate || hiddenDate !== today;
        });

        if (visibleNotices.length > 0) {
          setNotices(visibleNotices);
          setIsOpen(true);
        }
      }
    } catch (error) {
      console.error('Failed to load popup notices:', error);
    }
  };

  const handleClose = () => {
    if (dontShowToday && notices[currentIndex]) {
      // 오늘 하루 보지 않기 설정 저장
      const hiddenNoticesStr = localStorage.getItem('hiddenNotices');
      const hiddenNotices = hiddenNoticesStr ? JSON.parse(hiddenNoticesStr) : {};
      const today = new Date().toDateString();

      hiddenNotices[notices[currentIndex].id] = today;
      localStorage.setItem('hiddenNotices', JSON.stringify(hiddenNotices));
    }

    // 다음 공지사항이 있으면 표시
    if (currentIndex < notices.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setDontShowToday(false);
    } else {
      setIsOpen(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setDontShowToday(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < notices.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setDontShowToday(false);
    }
  };

  if (!isOpen || notices.length === 0) return null;

  const currentNotice = notices[currentIndex];

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
        }}
        onClick={handleClose}
      />

      {/* 팝업 모달 */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '80vh',
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ flex: 1 }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#111827',
              margin: 0,
            }}>
              {currentNotice.title}
            </h2>
            <p style={{
              fontSize: '12px',
              color: '#6b7280',
              marginTop: '4px',
              marginBottom: 0,
            }}>
              {new Date(currentNotice.created_at).toLocaleDateString('ko-KR')}
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '28px',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
              e.currentTarget.style.color = '#374151';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = '#9ca3af';
            }}
          >
            ×
          </button>
        </div>

        {/* 내용 */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '24px',
          }}
        >
          <div
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentNotice.content) }}
            style={{
              fontSize: '14px',
              lineHeight: '1.6',
              color: '#374151',
            }}
          />
        </div>

        {/* 푸터 */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              color: '#6b7280',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={dontShowToday}
              onChange={(e) => setDontShowToday(e.target.checked)}
              style={{
                width: '16px',
                height: '16px',
                cursor: 'pointer',
              }}
            />
            오늘 하루 보지 않기
          </label>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* 페이지 표시 */}
            {notices.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  style={{
                    padding: '6px 12px',
                    background: currentIndex === 0 ? '#f3f4f6' : '#ffffff',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: currentIndex === 0 ? '#9ca3af' : '#374151',
                    cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  이전
                </button>
                <span style={{
                  fontSize: '14px',
                  color: '#6b7280',
                }}>
                  {currentIndex + 1} / {notices.length}
                </span>
                <button
                  onClick={handleNext}
                  disabled={currentIndex === notices.length - 1}
                  style={{
                    padding: '6px 12px',
                    background: currentIndex === notices.length - 1 ? '#f3f4f6' : '#ffffff',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: currentIndex === notices.length - 1 ? '#9ca3af' : '#374151',
                    cursor: currentIndex === notices.length - 1 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  다음
                </button>
              </>
            )}

            <button
              onClick={handleClose}
              style={{
                padding: '8px 16px',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1d4ed8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#2563eb';
              }}
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
