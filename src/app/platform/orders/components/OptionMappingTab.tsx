'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { OptionMapping } from '../types';
import { Plus, Trash2, Save, Edit2, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface OptionMappingTabProps {
  isMobile: boolean;
}

export default function OptionMappingTab({ isMobile }: OptionMappingTabProps) {
  const [mappings, setMappings] = useState<OptionMapping[]>([]);
  const [siteOptions, setSiteOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableNotExists, setTableNotExists] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editMapping, setEditMapping] = useState({
    user_option_name: '',
    site_option_name: ''
  });
  const [newMapping, setNewMapping] = useState({
    user_option_name: '',
    site_option_name: ''
  });
  const hasShownLoginToast = useRef(false);

  // 사이트 옵션명 목록 가져오기
  useEffect(() => {
    fetchSiteOptions();
    fetchMappings();
  }, []);

  const fetchSiteOptions = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('option_products')
        .select('option_name')
        .order('option_name');

      if (error) throw error;

      const uniqueOptions = [...new Set(data.map(item => item.option_name))];
      setSiteOptions(uniqueOptions);
    } catch (error) {
      console.error('사이트 옵션명 조회 오류:', error);
      toast.error('사이트 옵션명을 불러오는데 실패했습니다.');
    }
  };

  const fetchMappings = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        if (!hasShownLoginToast.current) {
          toast.error('로그인이 필요합니다.');
          hasShownLoginToast.current = true;
        }
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('option_name_mappings')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        // 테이블이 존재하지 않는 경우
        if (error.code === '42P01') {
          console.warn('option_name_mappings 테이블이 아직 생성되지 않았습니다.');
          setTableNotExists(true);
          setMappings([]);
          setLoading(false);
          return;
        }
        throw error;
      }

      setMappings(data || []);
    } catch (error: any) {
      console.error('매핑 조회 오류:', error);
      // 테이블이 없는 경우는 에러 메시지 표시하지 않음
      if (error?.code !== '42P01') {
        toast.error('옵션명 매핑을 불러오는데 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddMapping = async () => {
    if (!newMapping.user_option_name.trim() || !newMapping.site_option_name.trim()) {
      toast.error('판매자 옵션명과 사이트 옵션명을 모두 입력해주세요.');
      return;
    }

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('로그인이 필요합니다.');
        return;
      }

      const { error } = await supabase
        .from('option_name_mappings')
        .insert({
          seller_id: user.id,
          user_option_name: newMapping.user_option_name.trim(),
          site_option_name: newMapping.site_option_name.trim()
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('이미 등록된 판매자 옵션명입니다.');
        } else {
          throw error;
        }
        return;
      }

      toast.success('옵션명 매핑이 추가되었습니다.');
      setNewMapping({ user_option_name: '', site_option_name: '' });
      fetchMappings();
    } catch (error) {
      console.error('매핑 추가 오류:', error);
      toast.error('옵션명 매핑 추가에 실패했습니다.');
    }
  };

  const handleEditMapping = (mapping: OptionMapping) => {
    setEditingId(mapping.id);
    setEditMapping({
      user_option_name: mapping.user_option_name,
      site_option_name: mapping.site_option_name
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditMapping({
      user_option_name: '',
      site_option_name: ''
    });
  };

  const handleSaveEdit = async (id: number) => {
    if (!editMapping.user_option_name.trim() || !editMapping.site_option_name.trim()) {
      toast.error('판매자 옵션명과 사이트 옵션명을 모두 입력해주세요.');
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('option_name_mappings')
        .update({
          user_option_name: editMapping.user_option_name.trim(),
          site_option_name: editMapping.site_option_name.trim()
        })
        .eq('id', id);

      if (error) {
        if (error.code === '23505') {
          toast.error('이미 등록된 판매자 옵션명입니다.');
        } else {
          throw error;
        }
        return;
      }

      toast.success('옵션명 매핑이 수정되었습니다.');
      setEditingId(null);
      fetchMappings();
    } catch (error) {
      console.error('매핑 수정 오류:', error);
      toast.error('옵션명 매핑 수정에 실패했습니다.');
    }
  };

  const handleDeleteMapping = async (id: number) => {
    if (!confirm('이 매핑을 삭제하시겠습니까?')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('option_name_mappings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('옵션명 매핑이 삭제되었습니다.');
      fetchMappings();
    } catch (error) {
      console.error('매핑 삭제 오류:', error);
      toast.error('옵션명 매핑 삭제에 실패했습니다.');
    }
  };

  return (
    <div>
      {/* 헤더 */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: 'var(--color-text)',
          marginBottom: '8px'
        }}>
          옵션명 매핑 설정
        </h2>
        <p style={{
          fontSize: '14px',
          color: 'var(--color-text-secondary)',
          lineHeight: '1.6'
        }}>
          사이트 표준 옵션명을 선택한 후, 판매자님이 사용하시는 옵션명을 입력하여 매핑해두면<br />
          발주서 업로드 시 자동으로 변환되어 편리하게 사용하실 수 있습니다.
        </p>
      </div>

      {/* 테이블 미생성 안내 */}
      {tableNotExists && (
        <div style={{
          marginBottom: '24px',
          padding: '20px',
          background: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '8px',
          color: '#856404'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            ⚠️ 데이터베이스 설정 필요
          </h3>
          <p style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '12px' }}>
            옵션명 매핑 기능을 사용하려면 Supabase에서 데이터베이스 테이블을 생성해야 합니다.
          </p>
          <ol style={{ fontSize: '13px', lineHeight: '1.8', paddingLeft: '20px', marginBottom: '12px' }}>
            <li>Supabase 대시보드 접속</li>
            <li>SQL Editor 메뉴로 이동</li>
            <li>아래 SQL 파일 내용을 복사하여 실행</li>
          </ol>
          <code style={{
            display: 'block',
            padding: '12px',
            background: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#495057',
            fontFamily: 'monospace'
          }}>
            supabase/migrations/20250126000000_create_option_name_mappings.sql
          </code>
        </div>
      )}

      {/* 새 매핑 추가 카드 */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: 'var(--color-text)',
          marginBottom: '16px'
        }}>
          새 옵션명 매핑 추가
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr auto',
          gap: '12px',
          alignItems: 'end'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              color: 'var(--color-text)',
              marginBottom: '6px'
            }}>
              사이트 표준 옵션명
            </label>
            <select
              value={newMapping.site_option_name}
              onChange={(e) => setNewMapping({ ...newMapping, site_option_name: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                fontSize: '14px',
                background: 'var(--color-background)',
                color: 'var(--color-text)'
              }}
            >
              <option value="">옵션명 선택</option>
              {siteOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              color: 'var(--color-text)',
              marginBottom: '6px'
            }}>
              판매자 옵션명
            </label>
            <input
              type="text"
              value={newMapping.user_option_name}
              onChange={(e) => setNewMapping({ ...newMapping, user_option_name: e.target.value })}
              placeholder="예: 딱복 (대과) 4kg"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                fontSize: '14px',
                background: 'var(--color-background)',
                color: 'var(--color-text)'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddMapping();
              }}
            />
          </div>

          <button
            onClick={handleAddMapping}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              height: '38px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Plus size={16} />
            추가
          </button>
        </div>
      </div>

      {/* 매핑 목록 */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-background-secondary)'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--color-text)'
          }}>
            등록된 옵션명 매핑 ({mappings.length}개)
          </h3>
        </div>

        {loading ? (
          <div style={{
            padding: '48px',
            textAlign: 'center',
            color: 'var(--color-text-secondary)'
          }}>
            로딩 중...
          </div>
        ) : mappings.length === 0 ? (
          <div style={{
            padding: '48px',
            textAlign: 'center',
            color: 'var(--color-text-secondary)'
          }}>
            등록된 옵션명 매핑이 없습니다.<br />
            위에서 새 매핑을 추가해주세요.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  background: 'var(--color-background-secondary)',
                  borderBottom: '1px solid var(--color-border)'
                }}>
                  <th style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'var(--color-text)'
                  }}>
                    사이트 표준 옵션명
                  </th>
                  <th style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'var(--color-text)'
                  }}>
                    판매자 옵션명
                  </th>
                  <th style={{
                    padding: '12px 24px',
                    textAlign: 'center',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'var(--color-text)',
                    width: '220px'
                  }}>
                    작업
                  </th>
                </tr>
              </thead>
              <tbody>
                {mappings.map((mapping) => (
                  <tr key={mapping.id} style={{
                    borderBottom: '1px solid var(--color-border)'
                  }}>
                    {editingId === mapping.id ? (
                      <>
                        <td style={{ padding: '16px 24px' }}>
                          <select
                            value={editMapping.site_option_name}
                            onChange={(e) => setEditMapping({ ...editMapping, site_option_name: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              border: '1px solid var(--color-border)',
                              borderRadius: '4px',
                              fontSize: '14px',
                              background: 'var(--color-background)',
                              color: 'var(--color-text)'
                            }}
                          >
                            <option value="">옵션명 선택</option>
                            {siteOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <input
                            type="text"
                            value={editMapping.user_option_name}
                            onChange={(e) => setEditMapping({ ...editMapping, user_option_name: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              border: '1px solid var(--color-border)',
                              borderRadius: '4px',
                              fontSize: '14px',
                              background: 'var(--color-background)',
                              color: 'var(--color-text)'
                            }}
                          />
                        </td>
                        <td style={{
                          padding: '16px 24px',
                          textAlign: 'center'
                        }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleSaveEdit(mapping.id)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 12px',
                                background: 'transparent',
                                color: '#10b981',
                                border: '1px solid #10b981',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#10b981';
                                e.currentTarget.style.color = 'white';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = '#10b981';
                              }}
                            >
                              <Save size={14} />
                              저장
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 12px',
                                background: 'transparent',
                                color: '#6b7280',
                                border: '1px solid #6b7280',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#6b7280';
                                e.currentTarget.style.color = 'white';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = '#6b7280';
                              }}
                            >
                              <X size={14} />
                              취소
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{
                          padding: '16px 24px',
                          fontSize: '14px',
                          color: 'var(--color-primary)',
                          fontWeight: '500'
                        }}>
                          {mapping.site_option_name}
                        </td>
                        <td style={{
                          padding: '16px 24px',
                          fontSize: '14px',
                          color: 'var(--color-text)'
                        }}>
                          {mapping.user_option_name}
                        </td>
                        <td style={{
                          padding: '16px 24px',
                          textAlign: 'center'
                        }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleEditMapping(mapping)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 12px',
                                background: 'transparent',
                                color: '#2563eb',
                                border: '1px solid #2563eb',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#2563eb';
                                e.currentTarget.style.color = 'white';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = '#2563eb';
                              }}
                            >
                              <Edit2 size={14} />
                              수정
                            </button>
                            <button
                              onClick={() => handleDeleteMapping(mapping.id)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 12px',
                                background: 'transparent',
                                color: '#ef4444',
                                border: '1px solid #ef4444',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#ef4444';
                                e.currentTarget.style.color = 'white';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = '#ef4444';
                              }}
                            >
                              <Trash2 size={14} />
                              삭제
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 사용 안내 */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        background: 'var(--color-background-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px'
      }}>
        <h4 style={{
          fontSize: '14px',
          fontWeight: '600',
          color: 'var(--color-text)',
          marginBottom: '8px'
        }}>
          💡 사용 방법
        </h4>
        <ul style={{
          fontSize: '13px',
          color: 'var(--color-text-secondary)',
          lineHeight: '1.8',
          paddingLeft: '20px'
        }}>
          <li>먼저 사이트 표준 옵션명을 선택한 후, 판매자님이 사용하시는 옵션명을 입력합니다.</li>
          <li>발주서 업로드 시 판매자 옵션명이 자동으로 사이트 표준 옵션명으로 변환됩니다.</li>
          <li>한 번 등록해두면 매번 엑셀 파일을 수정하지 않아도 됩니다.</li>
        </ul>
      </div>
    </div>
  );
}
