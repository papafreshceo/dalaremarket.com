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

interface RewardSetting {
  rank: number;
  reward_cash: number;
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

  const [weeklyRewards, setWeeklyRewards] = useState<RewardSetting[]>([
    { rank: 1, reward_cash: 100000 },
    { rank: 2, reward_cash: 50000 },
    { rank: 3, reward_cash: 30000 },
    { rank: 4, reward_cash: 20000 },
    { rank: 5, reward_cash: 10000 }
  ]);

  const [monthlyRewards, setMonthlyRewards] = useState<RewardSetting[]>([
    { rank: 1, reward_cash: 500000 },
    { rank: 2, reward_cash: 300000 },
    { rank: 3, reward_cash: 200000 },
    { rank: 4, reward_cash: 150000 },
    { rank: 5, reward_cash: 100000 },
    { rank: 6, reward_cash: 80000 },
    { rank: 7, reward_cash: 60000 },
    { rank: 8, reward_cash: 50000 },
    { rank: 9, reward_cash: 40000 },
    { rank: 10, reward_cash: 30000 }
  ]);

  useEffect(() => {
    fetchSettings();
    // fetchRewards(); // TODO: Supabase schema cache 갱신 후 활성화
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/ranking-score-settings');
      const result = await response.json();

      if (result.success) {
        const s = result.settings;
        setUiSettings({
          sales_amount: s.sales_amount || s.sales_per_point,
          sales_points: s.sales_points || 1,
          orders_count: s.orders_count || 1,
          orders_points: s.orders_points_input || s.orders_per_point,
          weekly_bonus: s.weekly_consecutive_bonus || 50,
          monthly_bonus: s.monthly_consecutive_bonus || 500,
          post_count: s.post_count || 1,
          post_points: s.post_points_input || s.post_score,
          comment_count: s.comment_count || 1,
          comment_points: s.comment_points_input || s.comment_score,
          login_count: s.login_count || 1,
          login_points: s.login_points_input || s.login_score
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

  const fetchRewards = async () => {
    try {
      const response = await fetch('/api/admin/ranking-rewards');
      const result = await response.json();

      if (result.success && result.rewards) {
        const weekly = result.rewards.filter((r: any) => r.period_type === 'weekly')
          .sort((a: any, b: any) => a.rank - b.rank);
        const monthly = result.rewards.filter((r: any) => r.period_type === 'monthly')
          .sort((a: any, b: any) => a.rank - b.rank);

        if (weekly.length > 0) {
          setWeeklyRewards(weekly.map((r: any) => ({ rank: r.rank, reward_cash: r.reward_cash })));
        }
        if (monthly.length > 0) {
          setMonthlyRewards(monthly.map((r: any) => ({ rank: r.rank, reward_cash: r.reward_cash })));
        }
      }
    } catch (error) {
      console.error('보상 설정 조회 오류:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settings: any = {
        // 계산값 (실제 점수 계산에 사용)
        sales_per_point: Math.round(uiSettings.sales_amount / uiSettings.sales_points),
        orders_per_point: Math.round(uiSettings.orders_points / uiSettings.orders_count),
        weekly_consecutive_bonus: uiSettings.weekly_bonus,
        monthly_consecutive_bonus: uiSettings.monthly_bonus,
        post_score: Math.round(uiSettings.post_points / uiSettings.post_count),
        comment_score: Math.round(uiSettings.comment_points / uiSettings.comment_count),
        login_score: Math.round(uiSettings.login_points / uiSettings.login_count),
        // UI 표시용 값들 (입력한 값 그대로 저장)
        sales_amount: uiSettings.sales_amount,
        sales_points: uiSettings.sales_points,
        orders_count: uiSettings.orders_count,
        orders_points_input: uiSettings.orders_points,
        post_count: uiSettings.post_count,
        post_points_input: uiSettings.post_points,
        comment_count: uiSettings.comment_count,
        comment_points_input: uiSettings.comment_points,
        login_count: uiSettings.login_count,
        login_points_input: uiSettings.login_points
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

  const handleRewardChange = (type: 'weekly' | 'monthly', rank: number, value: string) => {
    const numValue = parseInt(value.replace(/,/g, '')) || 0;
    if (type === 'weekly') {
      setWeeklyRewards(prev =>
        prev.map(r => r.rank === rank ? { ...r, reward_cash: numValue } : r)
      );
    } else {
      setMonthlyRewards(prev =>
        prev.map(r => r.rank === rank ? { ...r, reward_cash: numValue } : r)
      );
    }
  };

  const addRewardRank = (type: 'weekly' | 'monthly') => {
    if (type === 'weekly') {
      const maxRank = Math.max(...weeklyRewards.map(r => r.rank), 0);
      setWeeklyRewards([...weeklyRewards, { rank: maxRank + 1, reward_cash: 0 }]);
    } else {
      const maxRank = Math.max(...monthlyRewards.map(r => r.rank), 0);
      setMonthlyRewards([...monthlyRewards, { rank: maxRank + 1, reward_cash: 0 }]);
    }
  };

  const removeRewardRank = (type: 'weekly' | 'monthly', rank: number) => {
    if (type === 'weekly') {
      setWeeklyRewards(prev => prev.filter(r => r.rank !== rank));
    } else {
      setMonthlyRewards(prev => prev.filter(r => r.rank !== rank));
    }
  };

  const handleSaveRewards = async () => {
    setSaving(true);
    try {
      const allRewards = [
        ...weeklyRewards.map(r => ({ period_type: 'weekly', rank: r.rank, reward_cash: r.reward_cash })),
        ...monthlyRewards.map(r => ({ period_type: 'monthly', rank: r.rank, reward_cash: r.reward_cash }))
      ];

      const response = await fetch('/api/admin/ranking-rewards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewards: allRewards })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('보상 설정이 저장되었습니다');
      } else {
        toast.error(result.error || '보상 설정 저장 실패');
      }
    } catch (error) {
      console.error('보상 설정 저장 오류:', error);
      toast.error('보상 설정 저장 중 오류 발생');
    } finally {
      setSaving(false);
    }
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
              <span className="text-xs text-gray-500 ml-2">(1일~마지막일 토요일 제외한 모든 날 발주 시, 다음달 1일에 가산)</span>
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

        {/* 랭킹 보상 설정 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">랭킹 보상 캐시 설정</h2>
          <p className="text-sm text-gray-600 mb-6">
            주간 랭킹은 토요일에, 월간 랭킹은 다음달 1일에 확정 및 보상 지급됩니다.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 주간 랭킹 보상 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">주간 랭킹 (토요일 확정)</h3>
                <button
                  onClick={() => addRewardRank('weekly')}
                  className="text-sm px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  + 순위 추가
                </button>
              </div>
              <table className="w-full border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-3 py-2 text-sm">순위</th>
                    <th className="border px-3 py-2 text-sm">보상 금액</th>
                    <th className="border px-3 py-2 text-sm w-16">삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyRewards.map((reward) => (
                    <tr key={reward.rank}>
                      <td className="border px-3 py-2 text-center font-medium">{reward.rank}위</td>
                      <td className="border px-3 py-2">
                        <input
                          type="text"
                          value={formatNumber(reward.reward_cash)}
                          onChange={(e) => handleRewardChange('weekly', reward.rank, e.target.value)}
                          className="w-full px-2 py-1 border rounded text-right"
                        />
                      </td>
                      <td className="border px-3 py-2 text-center">
                        <button
                          onClick={() => removeRewardRank('weekly', reward.rank)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="border px-3 py-2 font-bold">합계</td>
                    <td className="border px-3 py-2 text-right font-bold">
                      {formatNumber(weeklyRewards.reduce((sum, r) => sum + r.reward_cash, 0))}원
                    </td>
                    <td className="border"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 월간 랭킹 보상 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">월간 랭킹 (다음달 1일 확정)</h3>
                <button
                  onClick={() => addRewardRank('monthly')}
                  className="text-sm px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  + 순위 추가
                </button>
              </div>
              <table className="w-full border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-3 py-2 text-sm">순위</th>
                    <th className="border px-3 py-2 text-sm">보상 금액</th>
                    <th className="border px-3 py-2 text-sm w-16">삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyRewards.map((reward) => (
                    <tr key={reward.rank}>
                      <td className="border px-3 py-2 text-center font-medium">{reward.rank}위</td>
                      <td className="border px-3 py-2">
                        <input
                          type="text"
                          value={formatNumber(reward.reward_cash)}
                          onChange={(e) => handleRewardChange('monthly', reward.rank, e.target.value)}
                          className="w-full px-2 py-1 border rounded text-right"
                        />
                      </td>
                      <td className="border px-3 py-2 text-center">
                        <button
                          onClick={() => removeRewardRank('monthly', reward.rank)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="border px-3 py-2 font-bold">합계</td>
                    <td className="border px-3 py-2 text-right font-bold">
                      {formatNumber(monthlyRewards.reduce((sum, r) => sum + r.reward_cash, 0))}원
                    </td>
                    <td className="border"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="flex justify-end gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {saving ? '저장 중...' : '점수 설정 저장'}
          </button>
          <button
            onClick={handleSaveRewards}
            disabled={saving}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
          >
            {saving ? '저장 중...' : '보상 설정 저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
