'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DOMPurify from 'isomorphic-dompurify';

interface Notice {
  id: number;
  title: string;
  content: string;
  category: string;
  is_pinned: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  published: boolean;
}

export default function NoticeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchNotice(params.id as string);
    }
  }, [params.id]);

  const fetchNotice = async (id: string) => {
    try {
      const response = await fetch(`/api/platform-notices?id=${id}`);
      const data = await response.json();
      if (data.notice) {
        setNotice(data.notice);
      }
    } catch (error) {
      console.error('Failed to fetch notice:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      general: '일반',
      shipping: '발송',
      product: '상품',
      update: '업데이트'
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: { bg: string; text: string } } = {
      general: { bg: 'rgba(37, 99, 235, 0.1)', text: '#2563eb' },
      shipping: { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' },
      product: { bg: 'rgba(139, 92, 246, 0.1)', text: '#8b5cf6' },
      update: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981' }
    };
    return colors[category] || { bg: 'rgba(107, 114, 128, 0.1)', text: '#6b7280' };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minutes}`;
  };

  const isNew = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };


  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #eff6ff, #ffffff 25%, #ffffff)',
        paddingTop: '70px',
        position: 'relative'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '72px 20px',
          textAlign: 'center',
          color: '#64748b'
        }}>
          로딩 중...
        </div>
      </div>
    );
  }

  if (!notice) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #eff6ff, #ffffff 25%, #ffffff)',
        paddingTop: '70px',
        position: 'relative'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '72px 20px',
          textAlign: 'center'
        }}>
          <div style={{
            background: '#ffffff',
            border: '1px solid #bfdbfe',
            borderRadius: '22px',
            padding: '60px',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '16px' }}>
              공지사항을 찾을 수 없습니다.
            </p>
            <Link
              href="/platform/notice"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 32px',
                background: 'linear-gradient(90deg, #2563eb, #06b6d4)',
                color: '#ffffff',
                borderRadius: '14px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '800',
                transition: 'all 0.2s'
              }}
            >
              목록으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const categoryColor = getCategoryColor(notice.category);

  return (
    <>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #eff6ff, #ffffff 25%, #ffffff)',
        paddingTop: '70px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* 배경 장식 */}
        <div style={{
          position: 'absolute',
          top: '-120px',
          left: '-140px',
          width: '260px',
          height: '260px',
          background: '#bfdbfe',
          borderRadius: '999px',
          filter: 'blur(60px)',
          opacity: 0.5,
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          right: '-120px',
          bottom: '-140px',
          width: '300px',
          height: '300px',
          background: '#93c5fd',
          borderRadius: '999px',
          filter: 'blur(60px)',
          opacity: 0.5,
          pointerEvents: 'none'
        }} />

        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '72px 20px 70px'
        }}>
          {/* 뒤로가기 버튼 */}
          <Link
            href="/platform/notice"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: '#ffffff',
              border: '1px solid #bfdbfe',
              borderRadius: '12px',
              color: '#1d4ed8',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '24px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f0f9ff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
            }}
          >
            ← 목록으로
          </Link>

          {/* 공지사항 상세 */}
          <div style={{
            background: '#ffffff',
            border: notice.is_pinned ? '2px solid #3b82f6' : '1px solid #bfdbfe',
            borderRadius: '22px',
            padding: '32px',
            position: 'relative'
          }}>
            {notice.is_pinned && (
              <div style={{
                position: 'absolute',
                left: '50%',
                top: '-12px',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: '900',
                padding: '6px 10px',
                borderRadius: '999px'
              }}>
                📌 고정
              </div>
            )}

            {/* 헤더 */}
            <div style={{
              borderBottom: '1px solid #e5e7eb',
              paddingBottom: '24px',
              marginBottom: '32px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
                flexWrap: 'wrap'
              }}>
                <span style={{
                  padding: '6px 12px',
                  background: categoryColor.bg,
                  color: categoryColor.text,
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700'
                }}>
                  {getCategoryLabel(notice.category)}
                </span>
                {isNew(notice.created_at) && (
                  <span style={{
                    padding: '6px 12px',
                    background: 'linear-gradient(90deg, #ef4444, #f87171)',
                    color: '#ffffff',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: '900'
                  }}>
                    NEW
                  </span>
                )}
              </div>

              <h1 style={{
                fontSize: '32px',
                fontWeight: '700',
                marginBottom: '16px',
                color: '#1d4ed8',
                lineHeight: '1.3'
              }}>
                {notice.title}
              </h1>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '14px',
                color: '#64748b',
                flexWrap: 'wrap'
              }}>
                <span>{formatDate(notice.created_at)}</span>
                <span>·</span>
                <span>조회 {notice.view_count}</span>
              </div>
            </div>

            {/* 본문 */}
            <div
              className="notice-content"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(notice.content) }}
            />
          </div>

          {/* 목록 버튼 */}
          <div style={{
            marginTop: '32px',
            textAlign: 'center'
          }}>
            <Link
              href="/platform/notice"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '14px 40px',
                background: 'linear-gradient(90deg, #2563eb, #06b6d4)',
                color: '#ffffff',
                borderRadius: '14px',
                textDecoration: 'none',
                fontSize: '15px',
                fontWeight: '800',
                transition: 'all 0.2s',
                boxShadow: '0 10px 20px rgba(37,99,235,0.25)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'brightness(1.03)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'brightness(1)';
              }}
            >
              목록으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
