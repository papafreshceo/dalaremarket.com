'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
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

export default function AdminNoticesPage() {
  const router = useRouter();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('platform_notices')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotices(data || []);
    } catch (error) {
      console.error('Failed to fetch notices:', error);
      alert('공지사항을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    setDeleting(id);
    try {
      const response = await fetch(`/api/platform-notices?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      alert('삭제되었습니다.');
      fetchNotices();
    } catch (error) {
      console.error('Failed to delete notice:', error);
      alert('삭제에 실패했습니다.');
    } finally {
      setDeleting(null);
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
    const colors: { [key: string]: string } = {
      important: '#ef4444',
      general: '#2563eb',
      update: '#10b981',
      event: '#8b5cf6'
    };
    return colors[category] || '#6b7280';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // 한국 시간대로 명시적 변환
    return date.toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(/\. /g, '.').replace(/\.$/, '');
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
    <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', padding: '0 24px' }}>
        {/* 헤더 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              marginBottom: '8px',
              color: '#212529'
            }}>공지사항 관리</h1>
            <p style={{
              fontSize: '14px',
              color: '#6c757d'
            }}>플랫폼 공지사항을 관리합니다</p>
          </div>
          <Link
            href="/admin/notices/create"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: '#000',
              color: '#ffffff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'background 0.2s'
            }}
          >
            새 공지사항
          </Link>
        </div>

        {/* 공지사항 목록 */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          {loading ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#6c757d'
            }}>
              로딩 중...
            </div>
          ) : notices.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#6c757d'
            }}>
              공지사항이 없습니다.
            </div>
          ) : (
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  borderBottom: '2px solid #e5e7eb'
                }}>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    width: '80px'
                  }}>상태</th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    width: '100px'
                  }}>카테고리</th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>제목</th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'center',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    width: '80px'
                  }}>조회수</th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'center',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    width: '160px'
                  }}>작성일</th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'center',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    width: '150px'
                  }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {notices.map((notice) => (
                  <tr key={notice.id} style={{
                    borderBottom: '1px solid #f3f4f6'
                  }}>
                    <td style={{
                      padding: '16px 12px',
                      fontSize: '14px'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {notice.is_pinned && (
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 6px',
                            background: '#fef3c7',
                            color: '#f59e0b',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600'
                          }}>
                            고정
                          </span>
                        )}
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 6px',
                          background: notice.published ? '#d1fae5' : '#fee2e2',
                          color: notice.published ? '#10b981' : '#ef4444',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600'
                        }}>
                          {notice.published ? '공개' : '비공개'}
                        </span>
                      </div>
                    </td>
                    <td style={{
                      padding: '16px 12px',
                      fontSize: '14px'
                    }}>
                      <span style={{
                        padding: '4px 8px',
                        background: `${getCategoryColor(notice.category)}15`,
                        color: getCategoryColor(notice.category),
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {getCategoryLabel(notice.category)}
                      </span>
                    </td>
                    <td style={{
                      padding: '16px 12px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#212529'
                    }}>
                      {notice.title}
                    </td>
                    <td style={{
                      padding: '16px 12px',
                      fontSize: '14px',
                      textAlign: 'center',
                      color: '#6c757d'
                    }}>
                      {notice.view_count}
                    </td>
                    <td style={{
                      padding: '16px 12px',
                      fontSize: '14px',
                      textAlign: 'center',
                      color: '#6c757d'
                    }}>
                      {formatDate(notice.created_at)}
                    </td>
                    <td style={{
                      padding: '16px 12px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        justifyContent: 'center'
                      }}>
                        <Link
                          href={`/admin/notices/edit/${notice.id}`}
                          style={{
                            padding: '6px 12px',
                            background: '#f3f4f6',
                            color: '#374151',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            fontSize: '13px',
                            fontWeight: '500',
                            transition: 'background 0.2s'
                          }}
                        >
                          수정
                        </Link>
                        <button
                          onClick={() => handleDelete(notice.id)}
                          disabled={deleting === notice.id}
                          style={{
                            padding: '6px 12px',
                            background: deleting === notice.id ? '#d1d5db' : '#fee2e2',
                            color: deleting === notice.id ? '#9ca3af' : '#ef4444',
                            borderRadius: '6px',
                            border: 'none',
                            fontSize: '13px',
                            fontWeight: '500',
                            cursor: deleting === notice.id ? 'not-allowed' : 'pointer',
                            transition: 'background 0.2s'
                          }}
                        >
                          {deleting === notice.id ? '삭제중...' : '삭제'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
