'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';

interface QuickReply {
  label: string;
  message: string;
}

interface FAQ {
  question: string;
  keywords: string[];
  answer: string;
}

interface ChatbotSettings {
  id?: string;
  is_enabled: boolean;
  position: 'bottom-right' | 'bottom-left';
  theme_color: string;
  welcome_message: string;
  quick_replies: QuickReply[];
  ai_enabled: boolean;
  gemini_api_key: string;
  ai_model: string;
  max_tokens: number;
  daily_ai_limit: number;
  keyword_match_priority: number;
  data_query_priority: number;
  ai_query_priority: number;
  faqs: FAQ[];
  company_name: string;
  company_phone: string;
  business_hours: string;
  offline_message: string;
  error_message: string;
}

const defaultSettings: ChatbotSettings = {
  is_enabled: true,
  position: 'bottom-right',
  theme_color: '#16a34a',
  welcome_message: '안녕하세요. 달래마켓 B2B입니다.\n\n상품 문의, 시즌 정보, 배송 등 무엇이든 물어보세요.',
  quick_replies: [
    { label: '가격 문의', message: '가격 알려주세요' },
    { label: '배송 안내', message: '배송 정보 알려주세요' }
  ],
  ai_enabled: true,
  gemini_api_key: '',
  ai_model: 'gemini-2.0-flash-lite',
  max_tokens: 500,
  daily_ai_limit: 1500,
  keyword_match_priority: 70,
  data_query_priority: 20,
  ai_query_priority: 10,
  faqs: [
    {
      question: '배송은 언제 되나요?',
      keywords: ['배송', '택배', '도착', '언제'],
      answer: '주문 확인 후 1-2일 내 출하됩니다.\n\n- 수도권: 익일 도착\n- 지방: 2-3일 소요\n- 제주/도서: 3-4일 소요\n\n문의: 010-2688-1388'
    }
  ],
  company_name: '달래마켓',
  company_phone: '010-2688-1388',
  business_hours: '평일 09:00 - 18:00',
  offline_message: '현재 상담 시간이 아닙니다. 평일 09:00 - 18:00에 문의해주세요.',
  error_message: '죄송합니다. 일시적인 오류가 발생했습니다.'
};

export default function ChatbotSettingsPage() {
  const [settings, setSettings] = useState<ChatbotSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('chatbot_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          ...defaultSettings,
          ...data,
          quick_replies: data.quick_replies || defaultSettings.quick_replies,
          faqs: data.faqs || defaultSettings.faqs,
          welcome_message: data.welcome_message || defaultSettings.welcome_message,
          offline_message: data.offline_message || defaultSettings.offline_message,
          error_message: data.error_message || defaultSettings.error_message,
          company_name: data.company_name || defaultSettings.company_name,
          company_phone: data.company_phone || defaultSettings.company_phone,
          business_hours: data.business_hours || defaultSettings.business_hours,
          gemini_api_key: data.gemini_api_key || ''
        });
      }
    } catch (error) {
      console.error('설정 불러오기 실패:', error);
      showToast('설정을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('chatbot_settings')
        .select('id')
        .limit(1)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('chatbot_settings')
          .update(settings)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('chatbot_settings')
          .insert([settings]);

        if (error) throw error;
      }

      showToast('챗봇 설정이 저장되었습니다.', 'success');
      await loadSettings();
    } catch (error) {
      console.error('설정 저장 실패:', error);
      showToast('설정 저장에 실패했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const addQuickReply = () => {
    setSettings({
      ...settings,
      quick_replies: [...settings.quick_replies, { label: '', message: '' }]
    });
  };

  const removeQuickReply = (index: number) => {
    setSettings({
      ...settings,
      quick_replies: settings.quick_replies.filter((_, i) => i !== index)
    });
  };

  const addFAQ = () => {
    setSettings({
      ...settings,
      faqs: [...settings.faqs, { question: '', keywords: [], answer: '' }]
    });
  };

  const removeFAQ = (index: number) => {
    setSettings({
      ...settings,
      faqs: settings.faqs.filter((_, i) => i !== index)
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[13px] text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>챗봇 설정</h1>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>사이트 챗봇의 모든 설정을 관리합니다</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 좌측 컬럼: 기본 설정 + 회사 정보 + 메시지 설정 */}
        <div className="space-y-6">
          {/* 기본 설정 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-[16px] font-semibold text-gray-900 mb-4">기본 설정</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-[13px] font-medium text-gray-700">챗봇 활성화</label>
                  <p className="text-[12px] text-gray-500">사이트에 챗봇을 표시합니다</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.is_enabled}
                    onChange={(e) => setSettings({ ...settings, is_enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-2">위치</label>
                <select
                  value={settings.position}
                  onChange={(e) => setSettings({ ...settings, position: e.target.value as 'bottom-right' | 'bottom-left' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px]"
                >
                  <option value="bottom-right">우측 하단</option>
                  <option value="bottom-left">좌측 하단</option>
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-2">테마 색상</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.theme_color}
                    onChange={(e) => setSettings({ ...settings, theme_color: e.target.value })}
                    className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.theme_color}
                    onChange={(e) => setSettings({ ...settings, theme_color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-[13px]"
                    placeholder="#16a34a"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-2">환영 메시지</label>
                <textarea
                  value={settings.welcome_message || ''}
                  onChange={(e) => setSettings({ ...settings, welcome_message: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px]"
                  placeholder="안녕하세요..."
                />
              </div>
            </div>
          </div>

          {/* 회사 정보 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-[16px] font-semibold text-gray-900 mb-4">회사 정보</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-2">회사명</label>
                <input
                  type="text"
                  value={settings.company_name || ''}
                  onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-2">전화번호</label>
                <input
                  type="text"
                  value={settings.company_phone || ''}
                  onChange={(e) => setSettings({ ...settings, company_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-2">영업시간</label>
                <input
                  type="text"
                  value={settings.business_hours || ''}
                  onChange={(e) => setSettings({ ...settings, business_hours: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px]"
                />
              </div>
            </div>
          </div>

          {/* 메시지 설정 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-[16px] font-semibold text-gray-900 mb-4">메시지 설정</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-2">영업 시간 외 메시지</label>
                <textarea
                  value={settings.offline_message || ''}
                  onChange={(e) => setSettings({ ...settings, offline_message: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-2">오류 메시지</label>
                <textarea
                  value={settings.error_message || ''}
                  onChange={(e) => setSettings({ ...settings, error_message: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 중간 컬럼: AI 설정 + 빠른 답변 */}
        <div className="space-y-6">
          {/* AI 설정 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-[16px] font-semibold text-gray-900 mb-4">AI 설정</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-[13px] font-medium text-gray-700">AI 응답 활성화</label>
                  <p className="text-[12px] text-gray-500">Gemini AI를 사용한 스마트 응답</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.ai_enabled}
                    onChange={(e) => setSettings({ ...settings, ai_enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-2">Gemini API Key</label>
                <input
                  type="password"
                  value={settings.gemini_api_key || ''}
                  onChange={(e) => setSettings({ ...settings, gemini_api_key: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px]"
                  placeholder="AIza..."
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-2">AI 모델</label>
                <select
                  value={settings.ai_model || 'gemini-2.0-flash-lite'}
                  onChange={(e) => setSettings({ ...settings, ai_model: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px]"
                >
                  <option value="gemini-2.0-flash-lite">gemini-2.0-flash-lite</option>
                  <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                  <option value="gemini-pro">gemini-pro</option>
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-2">최대 토큰 수</label>
                <input
                  type="number"
                  value={settings.max_tokens}
                  onChange={(e) => setSettings({ ...settings, max_tokens: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-2">일일 AI 호출 한도</label>
                <input
                  type="number"
                  value={settings.daily_ai_limit}
                  onChange={(e) => setSettings({ ...settings, daily_ai_limit: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px]"
                />
                <p className="text-[12px] text-gray-500 mt-1">Gemini 무료 플랜: 1,500회/일</p>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-2">응답 라우팅 비율</label>
                <div className="space-y-2">
                  <div>
                    <label className="block text-[12px] text-gray-500 mb-1">키워드 매칭 (%)</label>
                    <input
                      type="number"
                      value={settings.keyword_match_priority}
                      onChange={(e) => setSettings({ ...settings, keyword_match_priority: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] text-gray-500 mb-1">데이터 조회 (%)</label>
                    <input
                      type="number"
                      value={settings.data_query_priority}
                      onChange={(e) => setSettings({ ...settings, data_query_priority: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] text-gray-500 mb-1">AI 응답 (%)</label>
                    <input
                      type="number"
                      value={settings.ai_query_priority}
                      onChange={(e) => setSettings({ ...settings, ai_query_priority: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px]"
                    />
                  </div>
                </div>
                <p className="text-[12px] text-gray-500 mt-1">권장: 70:20:10 (키워드:데이터:AI)</p>
              </div>
            </div>
          </div>

          {/* 빠른 답변 버튼 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-semibold text-gray-900">빠른 답변 버튼</h2>
              <button
                onClick={addQuickReply}
                className="px-3 py-1.5 bg-blue-600 text-white text-[13px] rounded-lg hover:bg-blue-700"
              >
                + 추가
              </button>
            </div>

            <div className="space-y-3">
              {settings.quick_replies.map((reply, index) => (
                <div key={index} className="space-y-2">
                  <input
                    type="text"
                    value={reply.label}
                    onChange={(e) => {
                      const newReplies = [...settings.quick_replies];
                      newReplies[index].label = e.target.value;
                      setSettings({ ...settings, quick_replies: newReplies });
                    }}
                    placeholder="버튼 라벨"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px]"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={reply.message}
                      onChange={(e) => {
                        const newReplies = [...settings.quick_replies];
                        newReplies[index].message = e.target.value;
                        setSettings({ ...settings, quick_replies: newReplies });
                      }}
                      placeholder="전송할 메시지"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-[13px]"
                    />
                    <button
                      onClick={() => removeQuickReply(index)}
                      className="px-3 py-2 bg-red-50 text-red-600 text-[13px] rounded-lg hover:bg-red-100 whitespace-nowrap"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 우측 컬럼: FAQ */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-semibold text-gray-900">자주 묻는 질문 (FAQ)</h2>
              <button
                onClick={addFAQ}
                className="px-3 py-1.5 bg-blue-600 text-white text-[13px] rounded-lg hover:bg-blue-700"
              >
                + 추가
              </button>
            </div>

            <div className="space-y-4">
              {settings.faqs.map((faq, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-[13px] font-medium text-gray-700">FAQ {index + 1}</h3>
                    <button
                      onClick={() => removeFAQ(index)}
                      className="text-red-600 text-[13px] hover:text-red-700"
                    >
                      삭제
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[12px] text-gray-500 mb-1">질문</label>
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => {
                          const newFaqs = [...settings.faqs];
                          newFaqs[index].question = e.target.value;
                          setSettings({ ...settings, faqs: newFaqs });
                        }}
                        placeholder="질문 내용"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px]"
                      />
                    </div>

                    <div>
                      <label className="block text-[12px] text-gray-500 mb-1">키워드 (쉼표로 구분)</label>
                      <input
                        type="text"
                        value={faq.keywords.join(', ')}
                        onChange={(e) => {
                          const newFaqs = [...settings.faqs];
                          newFaqs[index].keywords = e.target.value.split(',').map(k => k.trim());
                          setSettings({ ...settings, faqs: newFaqs });
                        }}
                        placeholder="배송, 택배, 도착"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px]"
                      />
                    </div>

                    <div>
                      <label className="block text-[12px] text-gray-500 mb-1">답변</label>
                      <textarea
                        value={faq.answer}
                        onChange={(e) => {
                          const newFaqs = [...settings.faqs];
                          newFaqs[index].answer = e.target.value;
                          setSettings({ ...settings, faqs: newFaqs });
                        }}
                        rows={3}
                        placeholder="답변 내용"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={() => loadSettings()}
          className="px-6 py-2.5 border border-gray-300 text-gray-700 text-[13px] rounded-lg hover:bg-gray-50"
        >
          취소
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-blue-600 text-white text-[13px] rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  );
}
