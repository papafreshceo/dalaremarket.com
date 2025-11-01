'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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

export default function NoticePage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const response = await fetch('/api/platform-notices');
      const data = await response.json();
      if (data.notices) {
        setNotices(data.notices);
      }
    } catch (error) {
      console.error('Failed to fetch notices:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      important: '중요',
      general: '일반',
      update: '업데이트',
      event: '이벤트'
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: { bg: string; text: string } } = {
      important: { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' },
      general: { bg: 'rgba(37, 99, 235, 0.1)', text: '#2563eb' },
      update: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981' },
      event: { bg: 'rgba(139, 92, 246, 0.1)', text: '#8b5cf6' }
    };
    return colors[category] || { bg: 'rgba(107, 114, 128, 0.1)', text: '#6b7280' };
  };

  const filteredNotices = selectedCategory === 'all'
    ? notices
    : notices.filter(notice => notice.category === selectedCategory);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  const isNew = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

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

        {/* 히어로 섹션 */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '72px 20px 24px',
          textAlign: 'center',
          position: 'relative'
        }}>
          <h1 style={{
            fontSize: '38px',
            lineHeight: '1.15',
            margin: 0,
            color: '#1d4ed8',
            fontWeight: '700'
          }}>
            공지사항
          </h1>
          <p style={{
            margin: '12px auto 0',
            color: '#475569',
            maxWidth: '720px',
            fontSize: '16px'
          }}>
            달래마켓의 최신 소식과 중요한 안내사항을 확인하세요
          </p>

          {/* 카테고리 필터 탭 */}
          <div style={{
            margin: '22px auto 0',
            display: 'inline-flex',
            background: '#ffffff',
            border: '1px solid #bfdbfe',
            borderRadius: '18px',
            boxShadow: '0 8px 24px rgba(2,6,23,0.06)',
            flexWrap: 'wrap',
            padding: '4px'
          }}>
            <button
              onClick={() => setSelectedCategory('all')}
              style={{
                border: 0,
                background: selectedCategory === 'all' ? '#2563eb' : 'transparent',
                padding: '10px 16px',
                borderRadius: '14px',
                fontWeight: '800',
                color: selectedCategory === 'all' ? '#ffffff' : '#1d4ed8',
                cursor: 'pointer',
                boxShadow: selectedCategory === 'all' ? '0 10px 20px rgba(37,99,235,0.25)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              전체
            </button>
            <button
              onClick={() => setSelectedCategory('important')}
              style={{
                border: 0,
                background: selectedCategory === 'important' ? '#ef4444' : 'transparent',
                padding: '10px 16px',
                borderRadius: '14px',
                fontWeight: '800',
                color: selectedCategory === 'important' ? '#ffffff' : '#1d4ed8',
                cursor: 'pointer',
                boxShadow: selectedCategory === 'important' ? '0 10px 20px rgba(239,68,68,0.25)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              중요
            </button>
            <button
              onClick={() => setSelectedCategory('general')}
              style={{
                border: 0,
                background: selectedCategory === 'general' ? '#2563eb' : 'transparent',
                padding: '10px 16px',
                borderRadius: '14px',
                fontWeight: '800',
                color: selectedCategory === 'general' ? '#ffffff' : '#1d4ed8',
                cursor: 'pointer',
                boxShadow: selectedCategory === 'general' ? '0 10px 20px rgba(37,99,235,0.25)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              일반
            </button>
            <button
              onClick={() => setSelectedCategory('update')}
              style={{
                border: 0,
                background: selectedCategory === 'update' ? '#10b981' : 'transparent',
                padding: '10px 16px',
                borderRadius: '14px',
                fontWeight: '800',
                color: selectedCategory === 'update' ? '#ffffff' : '#1d4ed8',
                cursor: 'pointer',
                boxShadow: selectedCategory === 'update' ? '0 10px 20px rgba(16,185,129,0.25)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              업데이트
            </button>
            <button
              onClick={() => setSelectedCategory('event')}
              style={{
                border: 0,
                background: selectedCategory === 'event' ? '#8b5cf6' : 'transparent',
                padding: '10px 16px',
                borderRadius: '14px',
                fontWeight: '800',
                color: selectedCategory === 'event' ? '#ffffff' : '#1d4ed8',
                cursor: 'pointer',
                boxShadow: selectedCategory === 'event' ? '0 10px 20px rgba(139,92,246,0.25)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              이벤트
            </button>
          </div>
        </div>

        {/* 공지사항 목록 */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px 70px'
        }}>
          {loading ? (
            <div style={{
              background: '#ffffff',
              border: '1px solid #bfdbfe',
              borderRadius: '22px',
              padding: '60px',
              textAlign: 'center',
              color: '#64748b'
            }}>
              로딩 중...
            </div>
          ) : filteredNotices.length === 0 ? (
            <div style={{
              background: '#ffffff',
              border: '1px solid #bfdbfe',
              borderRadius: '22px',
              padding: '60px',
              textAlign: 'center',
              color: '#64748b'
            }}>
              공지사항이 없습니다.
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gap: '16px'
            }}>
              {filteredNotices.map((notice) => {
                const categoryColor = getCategoryColor(notice.category);
                return (
                  <Link
                    key={notice.id}
                    href={`/platform/notice/${notice.id}`}
                    style={{
                      display: 'block',
                      textDecoration: 'none',
                      color: 'inherit'
                    }}
                  >
                    <div
                      style={{
                        background: '#ffffff',
                        border: notice.is_pinned ? '2px solid #3b82f6' : '1px solid #bfdbfe',
                        borderRadius: '22px',
                        padding: '22px',
                        cursor: 'pointer',
                        transition: 'box-shadow 0.25s, transform 0.25s',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.boxShadow = '0 18px 44px rgba(2,6,23,0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
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

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '12px',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{
                          padding: '6px 12px',
                          background: categoryColor.bg,
                          color: categoryColor.text,
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '700',
                          flexShrink: 0
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
                            fontWeight: '900',
                            flexShrink: 0
                          }}>
                            NEW
                          </span>
                        )}
                        <span style={{
                          fontSize: '13px',
                          color: '#94a3b8',
                          marginLeft: 'auto'
                        }}>
                          {formatDate(notice.created_at)}
                        </span>
                      </div>

                      <h3 style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        marginBottom: '8px',
                        color: '#1d4ed8',
                        lineHeight: '1.4'
                      }}>
                        {notice.title}
                      </h3>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '13px',
                        color: '#64748b'
                      }}>
                        <span>조회 {notice.view_count}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* 하단 안내 */}
          <div style={{
            marginTop: '32px',
            padding: '24px',
            background: '#f0f9ff',
            borderRadius: '16px',
            fontSize: '14px',
            color: '#1e40af',
            textAlign: 'center',
            fontWeight: '500'
          }}>
            문의사항이 있으시면 고객센터로 연락해 주세요.
          </div>
        </div>
      </div>
    </>
  );
}
