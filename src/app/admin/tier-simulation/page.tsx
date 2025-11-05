'use client';

import { useState } from 'react';

interface TierCriteria {
  tier: string;
  minOrderCount: number;
  minTotalSales: number;
}

interface AccumulatedPointCriteria {
  tier: string;
  requiredPoints: number;
}

interface Milestone {
  days: number;
  bonus: number;
  enabled: boolean;
}

interface ConsecutiveBonus {
  days: number;
  bonus: number;
  enabled: boolean;
}

interface MonthlyBonus {
  minDays: number;
  bonus: number;
  enabled: boolean;
}

interface SimulationInput {
  daysPerWeek: number;
  ordersPerDay: number;
  pricePerOrder: number;
  hasConsecutiveStreak: boolean;
}

interface SimulationResult {
  month: number;
  accumulatedDays: number;
  accumulatedPoints: number;
  monthlyOrders: number;
  monthlySales: number;
  currentTier: string;
  upgradedBy: 'existing' | 'points' | null;
  pointsBreakdown?: {
    base: number;
    milestones: number;
    consecutive: number;
    monthly: number;
  };
}

export default function TierSimulationPage() {
  // 기존 시스템 설정
  const [tierCriteria, setTierCriteria] = useState<TierCriteria[]>([
    { tier: 'STANDARD', minOrderCount: 50, minTotalSales: 5000000 },
    { tier: 'ADVANCE', minOrderCount: 150, minTotalSales: 15000000 },
    { tier: 'ELITE', minOrderCount: 300, minTotalSales: 30000000 },
    { tier: 'LEGEND', minOrderCount: 500, minTotalSales: 50000000 },
  ]);

  // 누적점수 시스템 설정
  const [pointsPerDay, setPointsPerDay] = useState(10);

  // 누적 마일스톤 (연속 없이도 달성 가능)
  const [milestones, setMilestones] = useState<Milestone[]>([
    { days: 30, bonus: 100, enabled: true },
    { days: 90, bonus: 300, enabled: true },
    { days: 180, bonus: 600, enabled: true },
    { days: 365, bonus: 1200, enabled: true },
    { days: 730, bonus: 2500, enabled: true },
  ]);

  // 연속성 보너스 (매일 연속 발주 필요)
  const [consecutiveBonuses, setConsecutiveBonuses] = useState<ConsecutiveBonus[]>([
    { days: 7, bonus: 30, enabled: true },
    { days: 30, bonus: 100, enabled: true },
    { days: 90, bonus: 300, enabled: true },
    { days: 180, bonus: 500, enabled: true },
    { days: 365, bonus: 1000, enabled: true },
  ]);

  // 월간 발주일수 보너스
  const [monthlyBonuses, setMonthlyBonuses] = useState<MonthlyBonus[]>([
    { minDays: 10, bonus: 30, enabled: true },
    { minDays: 15, bonus: 60, enabled: true },
    { minDays: 20, bonus: 100, enabled: true },
  ]);

  const [accumulatedPointCriteria, setAccumulatedPointCriteria] = useState<AccumulatedPointCriteria[]>([
    { tier: 'STANDARD', requiredPoints: 1200 },
    { tier: 'ADVANCE', requiredPoints: 3000 },
    { tier: 'ELITE', requiredPoints: 6000 },
    { tier: 'LEGEND', requiredPoints: 12000 },
  ]);

  // 시뮬레이션 입력
  const [simulationInput, setSimulationInput] = useState<SimulationInput>({
    daysPerWeek: 3,
    ordersPerDay: 5,
    pricePerOrder: 15000,
    hasConsecutiveStreak: false,
  });

  const [results, setResults] = useState<SimulationResult[]>([]);
  const [showDetailedSettings, setShowDetailedSettings] = useState(false);

  const calculateAccumulatedPoints = (totalDays: number, totalMonths: number, daysPerMonth: number, hasConsecutive: boolean): { total: number; breakdown: { base: number; milestones: number; consecutive: number; monthly: number } } => {
    let basePoints = totalDays * pointsPerDay;
    let milestonePoints = 0;
    let consecutivePoints = 0;
    let monthlyPoints = 0;

    // 누적 마일스톤 보너스 (연속성 불필요)
    milestones.forEach(milestone => {
      if (milestone.enabled && totalDays >= milestone.days) {
        milestonePoints += milestone.bonus;
      }
    });

    // 연속성 보너스 (매일 연속 발주하는 경우만)
    if (hasConsecutive) {
      consecutiveBonuses.forEach(bonus => {
        if (bonus.enabled && totalDays >= bonus.days) {
          consecutivePoints += bonus.bonus;
        }
      });
    }

    // 월간 발주일수 보너스
    monthlyBonuses.forEach(bonus => {
      if (bonus.enabled && daysPerMonth >= bonus.minDays) {
        monthlyPoints += bonus.bonus * totalMonths;
      }
    });

    return {
      total: basePoints + milestonePoints + consecutivePoints + monthlyPoints,
      breakdown: {
        base: basePoints,
        milestones: milestonePoints,
        consecutive: consecutivePoints,
        monthly: monthlyPoints,
      }
    };
  };

  const checkTierByExisting = (monthlyOrders: number, monthlySales: number): string | null => {
    for (let i = tierCriteria.length - 1; i >= 0; i--) {
      const criteria = tierCriteria[i];
      if (monthlyOrders >= criteria.minOrderCount && monthlySales >= criteria.minTotalSales) {
        return criteria.tier;
      }
    }
    return null;
  };

  const checkTierByPoints = (accumulatedPoints: number): string | null => {
    for (let i = accumulatedPointCriteria.length - 1; i >= 0; i--) {
      const criteria = accumulatedPointCriteria[i];
      if (accumulatedPoints >= criteria.requiredPoints) {
        return criteria.tier;
      }
    }
    return null;
  };

  const runSimulation = () => {
    const { daysPerWeek, ordersPerDay, pricePerOrder, hasConsecutiveStreak } = simulationInput;
    const daysPerMonth = (daysPerWeek * 52) / 12;
    const monthlyOrders = Math.round(daysPerMonth * ordersPerDay);
    const monthlySales = monthlyOrders * pricePerOrder;

    const simulationResults: SimulationResult[] = [];
    let currentTier = 'LIGHT';

    for (let month = 1; month <= 120; month++) {
      const accumulatedDays = Math.round(daysPerMonth * month);
      const pointsData = calculateAccumulatedPoints(accumulatedDays, month, daysPerMonth, hasConsecutiveStreak);

      const tierByExisting = checkTierByExisting(monthlyOrders, monthlySales);
      const tierByPoints = checkTierByPoints(pointsData.total);

      let newTier = currentTier;
      let upgradedBy: 'existing' | 'points' | null = null;

      const tierOrder = ['LIGHT', 'STANDARD', 'ADVANCE', 'ELITE', 'LEGEND'];
      const currentIndex = tierOrder.indexOf(currentTier);

      if (tierByExisting && tierOrder.indexOf(tierByExisting) > currentIndex) {
        newTier = tierByExisting;
        upgradedBy = 'existing';
      }

      if (tierByPoints && tierOrder.indexOf(tierByPoints) > tierOrder.indexOf(newTier)) {
        newTier = tierByPoints;
        upgradedBy = 'points';
      }

      currentTier = newTier;

      simulationResults.push({
        month,
        accumulatedDays,
        accumulatedPoints: pointsData.total,
        monthlyOrders,
        monthlySales,
        currentTier,
        upgradedBy: upgradedBy,
        pointsBreakdown: pointsData.breakdown,
      });

      if (currentTier === 'LEGEND' && month > simulationResults.findIndex(r => r.currentTier === 'LEGEND') + 24) {
        break;
      }
    }

    setResults(simulationResults);
  };

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      'LIGHT': '#94a3b8',
      'STANDARD': '#3b82f6',
      'ADVANCE': '#8b5cf6',
      'ELITE': '#f59e0b',
      'LEGEND': '#ef4444',
    };
    return colors[tier] || '#6b7280';
  };

  const getUpgradeSummary = () => {
    const upgrades = results.filter(r => r.upgradedBy !== null);
    return upgrades.map(r => ({
      tier: r.currentTier,
      month: r.month,
      method: r.upgradedBy,
    }));
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
        등급 승급 시뮬레이션
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '24px' }}>
        발주 패턴과 점수 정책을 조정하여 등급 승급 시기를 시뮬레이션합니다
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* 왼쪽: 시뮬레이션 입력 */}
        <div>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              발주 패턴 입력
            </h2>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                주당 발주일
              </label>
              <input
                type="number"
                value={simulationInput.daysPerWeek}
                onChange={(e) => setSimulationInput({ ...simulationInput, daysPerWeek: parseInt(e.target.value) || 0 })}
                style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                하루 평균 건수
              </label>
              <input
                type="number"
                value={simulationInput.ordersPerDay}
                onChange={(e) => setSimulationInput({ ...simulationInput, ordersPerDay: parseInt(e.target.value) || 0 })}
                style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                건당 평균 금액
              </label>
              <input
                type="number"
                value={simulationInput.pricePerOrder}
                onChange={(e) => setSimulationInput({ ...simulationInput, pricePerOrder: parseInt(e.target.value) || 0 })}
                style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={simulationInput.hasConsecutiveStreak}
                  onChange={(e) => setSimulationInput({ ...simulationInput, hasConsecutiveStreak: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '13px', fontWeight: '600' }}>
                  매일 연속 발주 (연속성 보너스 적용)
                </span>
              </label>
            </div>

            <button
              onClick={runSimulation}
              style={{
                width: '100%',
                padding: '12px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                marginBottom: '12px',
              }}
            >
              시뮬레이션 실행
            </button>

            {results.length > 0 && (
              <div style={{ padding: '12px', background: '#f0f9ff', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#0369a1', marginBottom: '4px' }}>
                  월 평균 실적
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>
                  {results[0].monthlyOrders}건 / {(results[0].monthlySales / 10000).toFixed(0)}만원
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowDetailedSettings(!showDetailedSettings)}
            style={{
              width: '100%',
              padding: '12px',
              background: showDetailedSettings ? '#8b5cf6' : 'white',
              color: showDetailedSettings ? 'white' : '#374151',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {showDetailedSettings ? '세부 설정 닫기' : '세부 설정 열기'} ⚙️
          </button>
        </div>

        {/* 오른쪽: 결과 표시 */}
        <div>
          {/* 승급 요약 */}
          {results.length > 0 && (
            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                승급 요약
              </h2>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {getUpgradeSummary().map((upgrade, index) => (
                  <div key={index} style={{
                    padding: '16px 24px',
                    background: getTierColor(upgrade.tier) + '15',
                    borderRadius: '8px',
                    border: `2px solid ${getTierColor(upgrade.tier)}`,
                  }}>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: getTierColor(upgrade.tier), marginBottom: '4px' }}>
                      {upgrade.tier}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {upgrade.month}개월 ({upgrade.method === 'existing' ? '건수/금액' : '누적점수'})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 결과 테이블 */}
          {results.length > 0 && (
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                    <tr>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600' }}>월</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600' }}>누적일</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600' }}>누적점수</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600' }}>월간실적</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600' }}>등급</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600' }}>승급</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result, index) => (
                      <tr key={index} style={{
                        borderBottom: '1px solid #f3f4f6',
                        background: result.upgradedBy ? '#fef3c7' : 'white'
                      }}>
                        <td style={{ padding: '10px', textAlign: 'center', fontSize: '13px' }}>{result.month}</td>
                        <td style={{ padding: '10px', textAlign: 'center', fontSize: '13px' }}>{result.accumulatedDays}일</td>
                        <td style={{ padding: '10px', textAlign: 'center', fontSize: '13px', fontWeight: '600' }}>
                          {result.accumulatedPoints.toLocaleString()}점
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', fontSize: '12px' }}>
                          {result.monthlyOrders}건<br/>
                          {(result.monthlySales / 10000).toFixed(0)}만원
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 12px',
                            background: getTierColor(result.currentTier),
                            color: 'white',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                          }}>
                            {result.currentTier}
                          </span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', fontSize: '12px', fontWeight: '600' }}>
                          {result.upgradedBy === 'existing' && <span style={{ color: '#3b82f6' }}>건수/금액</span>}
                          {result.upgradedBy === 'points' && <span style={{ color: '#8b5cf6' }}>누적점수</span>}
                          {!result.upgradedBy && <span style={{ color: '#d1d5db' }}>-</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 세부 설정 패널 */}
      {showDetailedSettings && (
        <div style={{ background: '#f9fafb', padding: '24px', borderRadius: '12px', border: '2px solid #8b5cf6' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px', color: '#8b5cf6' }}>
            세부 설정 ⚙️
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
            {/* 기존 시스템 */}
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                기존 시스템 (건수 + 금액)
              </h3>
              {tierCriteria.map((criteria, index) => (
                <div key={criteria.tier} style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '4px', color: getTierColor(criteria.tier) }}>
                    {criteria.tier}
                  </div>
                  <input
                    type="number"
                    value={criteria.minOrderCount}
                    onChange={(e) => {
                      const newCriteria = [...tierCriteria];
                      newCriteria[index].minOrderCount = parseInt(e.target.value) || 0;
                      setTierCriteria(newCriteria);
                    }}
                    placeholder="건수"
                    style={{ width: '100%', padding: '6px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '12px', marginBottom: '4px' }}
                  />
                  <input
                    type="number"
                    value={criteria.minTotalSales}
                    onChange={(e) => {
                      const newCriteria = [...tierCriteria];
                      newCriteria[index].minTotalSales = parseInt(e.target.value) || 0;
                      setTierCriteria(newCriteria);
                    }}
                    placeholder="금액"
                    style={{ width: '100%', padding: '6px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '12px' }}
                  />
                </div>
              ))}
            </div>

            {/* 누적점수 기본 설정 */}
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                누적점수 기본 설정
              </h3>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  발주 1일당 점수
                </label>
                <input
                  type="number"
                  value={pointsPerDay}
                  onChange={(e) => setPointsPerDay(parseInt(e.target.value) || 0)}
                  style={{ width: '100%', padding: '6px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                  등급별 필요 점수
                </label>
                {accumulatedPointCriteria.map((criteria, index) => (
                  <div key={criteria.tier} style={{ display: 'flex', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: getTierColor(criteria.tier), fontWeight: '600', width: '70px' }}>
                      {criteria.tier}
                    </span>
                    <input
                      type="number"
                      value={criteria.requiredPoints}
                      onChange={(e) => {
                        const newCriteria = [...accumulatedPointCriteria];
                        newCriteria[index].requiredPoints = parseInt(e.target.value) || 0;
                        setAccumulatedPointCriteria(newCriteria);
                      }}
                      style={{ flex: 1, padding: '4px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '11px' }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 누적 마일스톤 */}
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                누적 마일스톤 보너스
              </h3>
              <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '12px' }}>
                (연속 불필요, 누적일수만 체크)
              </p>
              {milestones.map((milestone, index) => (
                <div key={index} style={{ marginBottom: '8px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={milestone.enabled}
                    onChange={(e) => {
                      const newMilestones = [...milestones];
                      newMilestones[index].enabled = e.target.checked;
                      setMilestones(newMilestones);
                    }}
                    style={{ width: '14px', height: '14px' }}
                  />
                  <input
                    type="number"
                    value={milestone.days}
                    onChange={(e) => {
                      const newMilestones = [...milestones];
                      newMilestones[index].days = parseInt(e.target.value) || 0;
                      setMilestones(newMilestones);
                    }}
                    style={{ width: '60px', padding: '4px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '11px' }}
                  />
                  <span style={{ fontSize: '11px' }}>일 →</span>
                  <input
                    type="number"
                    value={milestone.bonus}
                    onChange={(e) => {
                      const newMilestones = [...milestones];
                      newMilestones[index].bonus = parseInt(e.target.value) || 0;
                      setMilestones(newMilestones);
                    }}
                    style={{ width: '60px', padding: '4px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '11px' }}
                  />
                  <span style={{ fontSize: '11px' }}>점</span>
                </div>
              ))}
              <button
                onClick={() => setMilestones([...milestones, { days: 0, bonus: 0, enabled: true }])}
                style={{
                  width: '100%',
                  padding: '6px',
                  background: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  marginTop: '8px',
                }}
              >
                + 마일스톤 추가
              </button>
            </div>

            {/* 연속성 & 월간 보너스 */}
            <div>
              {/* 연속성 보너스 */}
              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                  연속성 보너스
                </h3>
                <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '12px' }}>
                  (매일 연속 발주 필요)
                </p>
                {consecutiveBonuses.map((bonus, index) => (
                  <div key={index} style={{ marginBottom: '8px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={bonus.enabled}
                      onChange={(e) => {
                        const newBonuses = [...consecutiveBonuses];
                        newBonuses[index].enabled = e.target.checked;
                        setConsecutiveBonuses(newBonuses);
                      }}
                      style={{ width: '14px', height: '14px' }}
                    />
                    <input
                      type="number"
                      value={bonus.days}
                      onChange={(e) => {
                        const newBonuses = [...consecutiveBonuses];
                        newBonuses[index].days = parseInt(e.target.value) || 0;
                        setConsecutiveBonuses(newBonuses);
                      }}
                      style={{ width: '50px', padding: '4px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '11px' }}
                    />
                    <span style={{ fontSize: '11px' }}>일 →</span>
                    <input
                      type="number"
                      value={bonus.bonus}
                      onChange={(e) => {
                        const newBonuses = [...consecutiveBonuses];
                        newBonuses[index].bonus = parseInt(e.target.value) || 0;
                        setConsecutiveBonuses(newBonuses);
                      }}
                      style={{ width: '50px', padding: '4px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '11px' }}
                    />
                    <span style={{ fontSize: '11px' }}>점</span>
                  </div>
                ))}
              </div>

              {/* 월간 발주일수 보너스 */}
              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                  월간 발주일수 보너스
                </h3>
                <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '12px' }}>
                  (매월 반복 지급)
                </p>
                {monthlyBonuses.map((bonus, index) => (
                  <div key={index} style={{ marginBottom: '8px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={bonus.enabled}
                      onChange={(e) => {
                        const newBonuses = [...monthlyBonuses];
                        newBonuses[index].enabled = e.target.checked;
                        setMonthlyBonuses(newBonuses);
                      }}
                      style={{ width: '14px', height: '14px' }}
                    />
                    <span style={{ fontSize: '11px' }}>월</span>
                    <input
                      type="number"
                      value={bonus.minDays}
                      onChange={(e) => {
                        const newBonuses = [...monthlyBonuses];
                        newBonuses[index].minDays = parseInt(e.target.value) || 0;
                        setMonthlyBonuses(newBonuses);
                      }}
                      style={{ width: '45px', padding: '4px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '11px' }}
                    />
                    <span style={{ fontSize: '11px' }}>일+ →</span>
                    <input
                      type="number"
                      value={bonus.bonus}
                      onChange={(e) => {
                        const newBonuses = [...monthlyBonuses];
                        newBonuses[index].bonus = parseInt(e.target.value) || 0;
                        setMonthlyBonuses(newBonuses);
                      }}
                      style={{ width: '45px', padding: '4px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '11px' }}
                    />
                    <span style={{ fontSize: '11px' }}>점</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
