'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChevronUp, ChevronDown, Plus, Edit2, Trash2, GripVertical } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface CSType {
  id: number;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export default function CSTypesPage() {
  const [csTypes, setCSTypes] = useState<CSType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<CSType | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    is_active: true,
    display_order: 0
  });

  useEffect(() => {
    fetchCSTypes();
  }, []);

  const fetchCSTypes = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('cs_types')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCSTypes(data || []);
    } catch (error) {
      console.error('CS 유형 조회 오류:', error);
      toast.error('CS 유형을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (type?: CSType) => {
    if (type) {
      setEditingType(type);
      setFormData({
        code: type.code,
        name: type.name,
        description: type.description || '',
        is_active: type.is_active,
        display_order: type.display_order
      });
    } else {
      setEditingType(null);
      const maxOrder = Math.max(...csTypes.map(t => t.display_order), 0);
      setFormData({
        code: '',
        name: '',
        description: '',
        is_active: true,
        display_order: maxOrder + 1
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingType(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      is_active: true,
      display_order: 0
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.name) {
      toast.error('코드와 이름은 필수입니다.');
      return;
    }

    try {
      const supabase = createClient();

      if (editingType) {
        // 수정
        const { error } = await supabase
          .from('cs_types')
          .update({
            code: formData.code,
            name: formData.name,
            description: formData.description || null,
            is_active: formData.is_active,
            display_order: formData.display_order,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingType.id);

        if (error) throw error;
        toast.success('CS 유형이 수정되었습니다.');
      } else {
        // 추가
        const { error } = await supabase
          .from('cs_types')
          .insert([formData]);

        if (error) throw error;
        toast.success('CS 유형이 추가되었습니다.');
      }

      fetchCSTypes();
      handleCloseModal();
    } catch (error: any) {
      console.error('저장 오류:', error);
      if (error.code === '23505') {
        toast.error('이미 존재하는 코드입니다.');
      } else {
        toast.error('저장에 실패했습니다.');
      }
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`"${name}" CS 유형을 삭제하시겠습니까?`)) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('cs_types')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('CS 유형이 삭제되었습니다.');
      fetchCSTypes();
    } catch (error: any) {
      console.error('삭제 오류:', error);
      if (error.code === '23503') {
        toast.error('사용 중인 CS 유형은 삭제할 수 없습니다.');
      } else {
        toast.error('삭제에 실패했습니다.');
      }
    }
  };

  const handleToggleActive = async (type: CSType) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('cs_types')
        .update({ is_active: !type.is_active })
        .eq('id', type.id);

      if (error) throw error;
      toast.success(type.is_active ? '비활성화되었습니다.' : '활성화되었습니다.');
      fetchCSTypes();
    } catch (error) {
      console.error('활성화 토글 오류:', error);
      toast.error('상태 변경에 실패했습니다.');
    }
  };

  const moveOrder = async (type: CSType, direction: 'up' | 'down') => {
    const currentIndex = csTypes.findIndex(t => t.id === type.id);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === csTypes.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const targetType = csTypes[targetIndex];

    try {
      const supabase = createClient();

      // 순서 교환
      await supabase
        .from('cs_types')
        .update({ display_order: targetType.display_order })
        .eq('id', type.id);

      await supabase
        .from('cs_types')
        .update({ display_order: type.display_order })
        .eq('id', targetType.id);

      fetchCSTypes();
    } catch (error) {
      console.error('순서 변경 오류:', error);
      toast.error('순서 변경에 실패했습니다.');
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />

      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">CS 유형 관리</h1>
            <p className="text-sm text-gray-600 mt-1">고객 서비스 처리 시 사용할 CS 유형을 관리합니다 (환불, 재발송 등).</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            새 CS 유형 추가
          </button>
        </div>

        {/* CS 유형 목록 */}
        <div className="bg-white rounded-lg shadow">
          {csTypes.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              등록된 CS 유형이 없습니다.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {csTypes.map((type, index) => (
                <div
                  key={type.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !type.is_active ? 'bg-gray-50 opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* 순서 조정 버튼 */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveOrder(type, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <GripVertical className="w-4 h-4 text-gray-300" />
                      <button
                        onClick={() => moveOrder(type, 'down')}
                        disabled={index === csTypes.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    {/* CS 유형 정보 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">{type.name}</h3>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded font-mono">
                          {type.code}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            type.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {type.is_active ? '활성' : '비활성'}
                        </span>
                      </div>
                      {type.description && (
                        <p className="text-sm text-gray-600">{type.description}</p>
                      )}
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex items-center gap-3">
                      {/* 토글 스위치 */}
                      <button
                        onClick={() => handleToggleActive(type)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          type.is_active ? 'bg-green-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            type.is_active ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => handleOpenModal(type)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(type.id, type.name)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingType ? 'CS 유형 수정' : '새 CS 유형 추가'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    코드 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="예: custom_cs"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    영문, 숫자, 언더스코어만 사용 가능
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="예: 맞춤 CS"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    설명
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="CS 유형에 대한 설명을 입력하세요"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700">
                    활성화
                  </label>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    {editingType ? '수정' : '추가'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
