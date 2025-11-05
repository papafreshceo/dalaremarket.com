'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface RankingScoreSettings {
  sales_per_point: number;
  orders_per_point: number;
  weekly_consecutive_bonus: number;
  monthly_consecutive_bonus: number;
  post_score: number;
  comment_score: number;
  login_score: number;
}

interface UISettings {
  sales_amount: number;
  sales_points: number;
  orders_count: number;
  orders_points: number;
  weekly_bonus: number;
  monthly_bonus: number;
  post_count: number;
  post_points: number;
  comment_count: number;
  comment_points: number;
  login_count: number;
  login_points: number;
}

export default function RankingScoreSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uiSettings, setUiSettings] = useState<UISettings>({
    sales_amount: 10000,
    sales_points: 1,
    orders_count: 1,
    orders_points: 10,
    weekly_bonus: 50,
    monthly_bonus: 500,
    post_count: 1,
    post_points: 5,
    comment_count: 1,
    comment_points: 2,
    login_count: 1,
    login_points: 3
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/ranking-score-settings');
      const result = await response.json();

      if (result.success) {
        const s = result.settings;
        setUiSettings({
          sales_amount: s.sales_per_point,
          sales_points: 1,
          orders_count: 1,
          orders_points: s.orders_per_point,
          weekly_bonus: s.weekly_consecutive_bonus || 50,
          monthly_bonus: s.monthly_consecutive_bonus || 500,
          post_count: 1,
          post_points: s.post_score,
          comment_count: 1,
          comment_points: s.comment_score,
          login_count: 1,
          login_points: s.login_score
        });
      } else {
        toast.error('설정 조회 실패');
      }
    } catch (error) {
      console.error('설정 조회 오류:', error);
      toast.error('설정 조회 중 오류 발생');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settings: RankingScoreSettings = {
        sales_per_point: Math.round(uiSettings.sales_amount / uiSettings.sales_points),
        orders_per_point: Math.round(uiSettings.orders_points / uiSettings.orders_count),
        weekly_consecutive_bonus: uiSettings.weekly_bonus,
        monthly_consecutive_bonus: uiSettings.monthly_bonus,
        post_score: Math.round(uiSettings.post_points / uiSettings.post_count),
        comment_score: Math.round(uiSettings.comment_points / uiSettings.comment_count),
        login_score: Math.round(uiSettings.login_points / uiSettings.login_count)
      };

      const response = await fetch('/api/admin/ranking-score-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      const result = await response.json();

      if (result.success) {
        toast.success('설정이 저장되었습니다');
      } else {
        toast.error(result.error || '저장 실패');
      }
    } catch (error) {
      console.error('설정 저장 오류:', error);
      toast.error('설정 저장 중 오류 발생');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof UISettings, value: string) => {
    const numValue = parseInt(value) || 0;
    setUiSettings(prev => ({ ...prev, [field]: numValue }));
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin/settings')}
          className="text-blue-600 hover:underline mb-4"
        >
          ← 설정으로 돌아가기
        </button>
        <h1 className="text-3xl font-bold">랭킹 점수 산정 설정</h1>
        <p className="text-gray-600 mt-2">
          셀러 랭킹 시스템의 점수 계산 기준을 설정합니다
        </p>
      </div>

      <div className="space-y-6">
        {/* 발주 점수 설정 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 w-40">발주확정 금액</label>
              <input
                type="number"
                value={uiSettings.sales_amount}
                onChange={(e) => handleChange('sales_amount', e.target.value)}
                className="px-2 py-1 border rounded text-center text-sm"
                style={{ width: '100px' }}
                min="1"
              />
              <span className="text-sm text-gray-600">원당</span>
              <input
                type="number"
                value={uiSettings.sales_points}
                onChange={(e) => handleChange('sales_points', e.target.value)}
                className="px-2 py-1 border rounded text-center text-sm"
                style={{ width: '100px' }}
                min="1"
              />
              <span className="text-sm text-gray-600">점</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 w-40">발주확정 건수</label>
              <input
                type="number"
                value={uiSettings.orders_count}
                onChange={(e) => handleChange('orders_count', e.target.value)}
                className="px-2 py-1 border rounded text-center text-sm"
                style={{ width: '100px' }}
                min="1"
              />
              <span className="text-sm text-gray-600">건당</span>
              <input
                type="number"
                value={uiSettings.orders_points}
                onChange={(e) => handleChange('orders_points', e.target.value)}
                className="px-2 py-1 border rounded text-center text-sm"
                style={{ width: '100px' }}
                min="1"
              />
              <span className="text-sm text-gray-600">점</span>
            </div>
          </div>
        </div>

        {/* 연속 발주 보너스 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 w-40">주간 연속발주</label>
              <input
                type="number"
                value={uiSettings.weekly_bonus}
                onChange={(e) => handleChange('weekly_bonus', e.target.value)}
                className="px-2 py-1 border rounded text-center text-sm"
                style={{ width: '100px' }}
                min="0"
              />
              <span className="text-sm text-gray-600">점</span>
              <span className="text-xs text-gray-500 ml-2">(일요일~금요일 6일 연속 발주 시, 토요일에 가산)</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 w-40">월간 연속발주</label>
              <input
                type="number"
                value={uiSettings.monthly_bonus}
                onChange={(e) => handleChange('monthly_bonus', e.target.value)}
                className="px-2 py-1 border rounded text-center text-sm"
                style={{ width: '100px' }}
                min="0"
              />
              <span className="text-sm text-gray-600">점</span>
              <span className="text-xs text-gray-500 ml-2">(매월 영업일 빠짐없이 발주 시, 월의 마지막 영업일에 가산)</span>
            </div>
          </div>
        </div>

        {/* 활동 점수 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 w-40">게시글 작성</label>
              <input
                type="number"
                value={uiSettings.post_count}
                onChange={(e) => handleChange('post_count', e.target.value)}
                className="px-2 py-1 border rounded text-center text-sm"
                style={{ width: '100px' }}
                min="1"
              />
              <span className="text-sm text-gray-600">개당</span>
              <input
                type="number"
                value={uiSettings.post_points}
                onChange={(e) => handleChange('post_points', e.target.value)}
                className="px-2 py-1 border rounded text-center text-sm"
                style={{ width: '100px' }}
                min="0"
              />
              <span className="text-sm text-gray-600">점</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 w-40">답글 작성</label>
              <input
                type="number"
                value={uiSettings.comment_count}
                onChange={(e) => handleChange('comment_count', e.target.value)}
                className="px-2 py-1 border rounded text-center text-sm"
                style={{ width: '100px' }}
                min="1"
              />
              <span className="text-sm text-gray-600">개당</span>
              <input
                type="number"
                value={uiSettings.comment_points}
                onChange={(e) => handleChange('comment_points', e.target.value)}
                className="px-2 py-1 border rounded text-center text-sm"
                style={{ width: '100px' }}
                min="0"
              />
              <span className="text-sm text-gray-600">점</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 w-40">로그인 (1일 1회)</label>
              <input
                type="number"
                value={uiSettings.login_count}
                onChange={(e) => handleChange('login_count', e.target.value)}
                className="px-2 py-1 border rounded text-center text-sm"
                style={{ width: '100px' }}
                min="1"
              />
              <span className="text-sm text-gray-600">회당</span>
              <input
                type="number"
                value={uiSettings.login_points}
                onChange={(e) => handleChange('login_points', e.target.value)}
                className="px-2 py-1 border rounded text-center text-sm"
                style={{ width: '100px' }}
                min="0"
              />
              <span className="text-sm text-gray-600">점</span>
            </div>
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {saving ? '저장 중...' : '설정 저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
