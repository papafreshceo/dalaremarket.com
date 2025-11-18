'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function CashSettingsPage() {
  const [loginReward, setLoginReward] = useState<number>(50);
  const [activityRewardPerMinute, setActivityRewardPerMinute] = useState<number>(1);
  const [dailyActivityLimit, setDailyActivityLimit] = useState<number>(50);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // 현재 설정 불러오기
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/cash/settings');
        const data = await response.json();

        if (data.success && data.settings) {
          setLoginReward(data.settings.login_reward);
          setActivityRewardPerMinute(data.settings.activity_reward_per_minute);
          setDailyActivityLimit(data.settings.daily_activity_limit);
        }
      } catch (error) {
        console.error('설정 로드 실패:', error);
        toast.error('설정을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // 설정 저장
  const handleSave = async () => {
    // 유효성 검사
    if (loginReward < 0 || activityRewardPerMinute < 0 || dailyActivityLimit < 0) {
      toast.error('모든 값은 0 이상이어야 합니다.');
      return;
    }

    if (dailyActivityLimit < activityRewardPerMinute) {
      toast.error('일일 활동 한도는 분당 보상보다 크거나 같아야 합니다.');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/cash/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login_reward: loginReward,
          activity_reward_per_minute: activityRewardPerMinute,
          daily_activity_limit: dailyActivityLimit
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('설정이 저장되었습니다!');
      } else {
        toast.error(data.error || '설정 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('설정 저장 실패:', error);
      toast.error('설정 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 기본값으로 초기화
  const handleReset = () => {
    if (confirm('기본값(로그인 50캐시, 분당 1캐시, 일일 한도 50캐시)으로 초기화하시겠습니까?')) {
      setLoginReward(50);
      setActivityRewardPerMinute(1);
      setDailyActivityLimit(50);
      toast.success('기본값으로 초기화되었습니다. 저장 버튼을 눌러주세요.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #2563eb',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#6b7280', fontSize: '14px' }}>설정을 불러오는 중...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
          달래캐시 설정
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>
          사용자에게 지급되는 캐시 보상 금액을 설정합니다.
        </p>
      </div>

      {/* 설정 카드 */}
      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        overflow: 'hidden',
        marginBottom: '24px'
      }}>
        {/* 로그인 보상 */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                🎁 일일 로그인 보상
              </h3>
              <p style={{ fontSize: '13px', color: '#6b7280' }}>
                하루 한 번 로그인 시 지급되는 캐시
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="number"
              value={loginReward}
              onChange={(e) => setLoginReward(Math.max(0, parseInt(e.target.value) || 0))}
              min={0}
              style={{
                flex: 1,
                padding: '10px 14px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#111827'
              }}
            />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', whiteSpace: 'nowrap' }}>캐시</span>
          </div>
        </div>

        {/* 활동 보상 */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                ⏱️ 분당 활동 보상
              </h3>
              <p style={{ fontSize: '13px', color: '#6b7280' }}>
                페이지 활성화 상태 1분당 지급되는 캐시
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="number"
              value={activityRewardPerMinute}
              onChange={(e) => setActivityRewardPerMinute(Math.max(0, parseInt(e.target.value) || 0))}
              min={0}
              style={{
                flex: 1,
                padding: '10px 14px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#111827'
              }}
            />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', whiteSpace: 'nowrap' }}>캐시/분</span>
          </div>
        </div>

        {/* 일일 한도 */}
        <div style={{
          padding: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                📊 일일 활동 보상 한도
              </h3>
              <p style={{ fontSize: '13px', color: '#6b7280' }}>
                하루 활동 보상으로 받을 수 있는 최대 캐시 (로그인 보상 제외)
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="number"
              value={dailyActivityLimit}
              onChange={(e) => setDailyActivityLimit(Math.max(0, parseInt(e.target.value) || 0))}
              min={0}
              style={{
                flex: 1,
                padding: '10px 14px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#111827'
              }}
            />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', whiteSpace: 'nowrap' }}>캐시</span>
          </div>
        </div>
      </div>

      {/* 설명 카드 */}
      <div style={{
        background: '#f0f9ff',
        border: '1px solid #bae6fd',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px'
      }}>
        <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#0c4a6e', marginBottom: '12px' }}>
          📌 설정 예시
        </h4>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#075985', lineHeight: '1.8' }}>
          <li>일일 로그인 보상: 50캐시 → 하루 1회 로그인 시 50캐시 지급</li>
          <li>분당 활동 보상: 1캐시 → 1분 활동 시 1캐시 지급</li>
          <li>일일 활동 한도: 50캐시 → 하루 최대 50분까지만 보상 지급</li>
          <li><strong>하루 최대 획득 가능:</strong> 로그인 보상 + 활동 한도 = 50 + 50 = 100캐시</li>
        </ul>
      </div>

      {/* 버튼 영역 */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          onClick={handleReset}
          disabled={saving}
          style={{
            padding: '12px 24px',
            background: 'white',
            color: '#6b7280',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!saving) {
              e.currentTarget.style.background = '#f9fafb';
              e.currentTarget.style.borderColor = '#9ca3af';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.borderColor = '#d1d5db';
          }}
        >
          기본값으로 초기화
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '12px 24px',
            background: saving ? '#9ca3af' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!saving) {
              e.currentTarget.style.background = '#1d4ed8';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = saving ? '#9ca3af' : '#2563eb';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {saving ? '저장 중...' : '💾 저장'}
        </button>
      </div>
    </div>
  );
}
