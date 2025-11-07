'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Announcement {
  id: number;
  title: string;
  category: string;
  is_pinned: boolean;
  published: boolean;
  view_count: number;
  created_at: string;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('id, title, category, is_pinned, published, view_count, created_at')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('삭제되었습니다.');
      fetchAnnouncements();
    } catch (error) {
      console.error('Failed to delete announcement:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const getCategoryBadge = (category: string) => {
    const styles: Record<string, any> = {
      general: { bg: '#e5e7eb', color: '#374151', text: '일반' },
      important: { bg: '#fee2e2', color: '#991b1b', text: '중요' },
      event: { bg: '#dbeafe', color: '#1e40af', text: '이벤트' },
      update: { bg: '#d1fae5', color: '#065f46', text: '업데이트' },
    };

    const style = styles[category] || styles.general;

    return (
      <span style={{
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '600',
        background: style.bg,
        color: style.color
      }}>
        {style.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px'
      }}>
        <div style={{ color: '#6c757d' }}>로딩 중...</div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {/* Header */}
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
          }}>전체 {announcements.length}개</p>
        </div>
        <Link
          href="/admin/announcements/create"
          style={{
            padding: '10px 20px',
            background: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          + 새 공지사항
        </Link>
      </div>

      {/* Table */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={thStyle}>제목</th>
              <th style={{ ...thStyle, width: '100px' }}>카테고리</th>
              <th style={{ ...thStyle, width: '80px' }}>상태</th>
              <th style={{ ...thStyle, width: '80px' }}>조회수</th>
              <th style={{ ...thStyle, width: '120px' }}>작성일</th>
              <th style={{ ...thStyle, width: '150px' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {announcements.length === 0 ? (
              <tr>
                <td colSpan={6} style={{
                  padding: '60px 20px',
                  textAlign: 'center',
                  color: '#9ca3af'
                }}>
                  등록된 공지사항이 없습니다.
                </td>
              </tr>
            ) : (
              announcements.map((announcement) => (
                <tr key={announcement.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {announcement.is_pinned && (
                        <span style={{
                          padding: '2px 6px',
                          background: '#fef3c7',
                          color: '#92400e',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600'
                        }}>
                          고정
                        </span>
                      )}
                      <span>{announcement.title}</span>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    {getCategoryBadge(announcement.category)}
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: announcement.published ? '#d1fae5' : '#fee2e2',
                      color: announcement.published ? '#065f46' : '#991b1b'
                    }}>
                      {announcement.published ? '공개' : '비공개'}
                    </span>
                  </td>
                  <td style={tdStyle}>{announcement.view_count}</td>
                  <td style={tdStyle}>
                    {new Date(announcement.created_at).toLocaleDateString('ko-KR')}
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <Link
                        href={`/admin/announcements/edit/${announcement.id}`}
                        style={{
                          padding: '6px 12px',
                          background: '#f3f4f6',
                          color: '#374151',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontSize: '13px',
                          fontWeight: '500'
                        }}
                      >
                        수정
                      </Link>
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        style={{
                          padding: '6px 12px',
                          background: '#fee2e2',
                          color: '#991b1b',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle = {
  padding: '12px 16px',
  textAlign: 'left' as const,
  fontSize: '13px',
  fontWeight: '600',
  color: '#6b7280'
};

const tdStyle = {
  padding: '16px',
  fontSize: '14px',
  color: '#374151'
};
