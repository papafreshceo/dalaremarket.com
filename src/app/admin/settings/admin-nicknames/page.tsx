'use client';

import { useState, useEffect } from 'react';

interface AdminNickname {
  id: number;
  nickname: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export default function AdminNicknamesPage() {
  const [nicknames, setNicknames] = useState<AdminNickname[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadNicknames();
  }, []);

  const loadNicknames = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/nicknames');
      const data = await response.json();

      if (data.success) {
        setNicknames(data.nicknames);
      }
    } catch (error) {
      console.error('닉네임 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newNickname.trim()) {
      setMessage('❌ 닉네임을 입력해주세요.');
      return;
    }

    try {
      const response = await fetch('/api/admin/nicknames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: newNickname.trim(),
          description: newDescription.trim() || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✅ 관리자 닉네임이 추가되었습니다.');
        setNewNickname('');
        setNewDescription('');
        setShowAddModal(false);
        await loadNicknames();
      } else {
        setMessage('❌ ' + (data.error || '추가에 실패했습니다.'));
      }
    } catch (error) {
      console.error('닉네임 추가 오류:', error);
      setMessage('❌ 추가 중 오류가 발생했습니다.');
    }

    setTimeout(() => setMessage(''), 3000);
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/nicknames/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive }),
      });

      const data = await response.json();

      if (data.success) {
        await loadNicknames();
      }
    } catch (error) {
      console.error('상태 변경 오류:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/admin/nicknames/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✅ 삭제되었습니다.');
        await loadNicknames();
      } else {
        setMessage('❌ 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      setMessage('❌ 삭제 중 오류가 발생했습니다.');
    }

    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* 헤더 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
            관리자 닉네임 관리
          </h1>
          <p style={{ fontSize: '14px', color: '#6c757d' }}>
            셀러피드에서 사용할 관리자 닉네임을 관리합니다
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '8px 16px',
            background: '#000',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          닉네임 추가
        </button>
      </div>

      {/* 메시지 */}
      {message && (
        <div style={{
          padding: '12px 16px',
          background: message.includes('✅') ? '#d1e7dd' : '#f8d7da',
          color: message.includes('✅') ? '#0f5132' : '#842029',
          borderRadius: '8px',
          marginBottom: '16px',
          fontSize: '14px'
        }}>
          {message}
        </div>
      )}

      {/* 닉네임 리스트 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
          로딩 중...
        </div>
      ) : nicknames.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
          등록된 관리자 닉네임이 없습니다.
        </div>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid #dee2e6'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>닉네임</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>설명</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600' }}>상태</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {nicknames.map((nickname) => (
                <tr key={nickname.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '16px', fontWeight: '500' }}>
                    {nickname.nickname}
                  </td>
                  <td style={{ padding: '16px', color: '#6c757d' }}>
                    {nickname.description || '-'}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleToggleActive(nickname.id, nickname.is_active)}
                      style={{
                        padding: '4px 12px',
                        background: nickname.is_active ? '#d1e7dd' : '#f8d7da',
                        color: nickname.is_active ? '#0f5132' : '#842029',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {nickname.is_active ? '활성' : '비활성'}
                    </button>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleDelete(nickname.id)}
                      style={{
                        padding: '6px 12px',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 추가 모달 */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }} onClick={() => setShowAddModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '500px',
            padding: '24px'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>
              관리자 닉네임 추가
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px'
              }}>닉네임 *</label>
              <input
                type="text"
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                placeholder="관리자 닉네임 입력"
                maxLength={20}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                {newNickname.length}/20자
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px'
              }}>설명</label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="닉네임 용도 (선택)"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#f8f9fa',
                  color: '#495057',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                취소
              </button>
              <button
                onClick={handleAdd}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
