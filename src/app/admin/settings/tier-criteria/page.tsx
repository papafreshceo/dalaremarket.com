'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { TierRow } from '@/components/TierBadge';

interface TierCriteria {
  id: number;
  tier: string;
  min_order_count: number;
  min_total_sales: number;
  discount_rate: number;
  consecutive_months_for_bonus: number | null;
  bonus_tier_duration_months: number;
  description: string;
  is_active: boolean;
}

interface SimulationInput {
  daysPerWeek: number;
  ordersPerDay: number;
  pricePerOrder: number;
  hasConsecutiveStreak: boolean;
}

interface SimulationCriteria {
  tier: string;
  minOrderCount: number;
  minTotalSales: number;
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

interface NoLoginPenalty {
  days: number;
  penalty: number;
  enabled: boolean;
}

interface AccumulatedPointCriteria {
  tier: string;
  requiredPoints: number;
}

interface SimulationResult {
  month: number;
  accumulatedDays: number;
  accumulatedPoints: number;
  oneMonthOrders: number; // 월간 누적 실적
  oneMonthSales: number;
  threeMonthOrders: number; // 3개월 누적 실적
  threeMonthSales: number;
  monthlyOrders: number; // 전체 누적 실적
  monthlySales: number;
  currentTier: string;
  upgradedBy: 'existing' | 'points' | null;
  pointsBreakdown?: {
    base: number;
    milestones: number;
    consecutive: number;
    monthly: number;
    penalty: number;
  };
}

export default function TierCriteriaPage() {
  const [criteria, setCriteria] = useState<TierCriteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPointSettings, setSavingPointSettings] = useState(false);
  const [showSimulator, setShowSimulator] = useState(true); // 항상 표시

  // 시뮬레이션 상태
  const [simulationInput, setSimulationInput] = useState<SimulationInput>({
    daysPerWeek: 5,
    ordersPerDay: 5,
    pricePerOrder: 15000,
    hasConsecutiveStreak: false,
  });

  const [simulationCriteria, setSimulationCriteria] = useState<SimulationCriteria[]>([]);
  const [loginPointsPerDay, setLoginPointsPerDay] = useState(1);
  const [pointsPerDay, setPointsPerDay] = useState(10);
  const [milestones, setMilestones] = useState<Milestone[]>([
    { days: 30, bonus: 100, enabled: true },
    { days: 90, bonus: 300, enabled: true },
    { days: 180, bonus: 600, enabled: true },
    { days: 365, bonus: 1200, enabled: true },
    { days: 730, bonus: 2500, enabled: true },
  ]);
  const [consecutiveBonuses, setConsecutiveBonuses] = useState<ConsecutiveBonus[]>([
    { days: 5, bonus: 30, enabled: true },
    { days: 21, bonus: 100, enabled: true },
    { days: 65, bonus: 300, enabled: true },
    { days: 130, bonus: 500, enabled: true },
    { days: 260, bonus: 1000, enabled: true },
  ]);
  const [monthlyBonuses, setMonthlyBonuses] = useState<MonthlyBonus[]>([
    { minDays: 10, bonus: 30, enabled: true },
    { minDays: 15, bonus: 60, enabled: true },
    { minDays: 20, bonus: 100, enabled: true },
  ]);
  const [noLoginPenalties, setNoLoginPenalties] = useState<NoLoginPenalty[]>([
    { days: 7, penalty: 50, enabled: true },
    { days: 14, penalty: 100, enabled: true },
    { days: 30, penalty: 200, enabled: true },
  ]);
  const [accumulatedPointCriteria, setAccumulatedPointCriteria] = useState<AccumulatedPointCriteria[]>([
    { tier: 'LIGHT', requiredPoints: 1200 },
    { tier: 'STANDARD', requiredPoints: 3000 },
    { tier: 'ADVANCE', requiredPoints: 6000 },
    { tier: 'ELITE', requiredPoints: 9000 },
    { tier: 'LEGEND', requiredPoints: 12000 },
  ]);

  const [results, setResults] = useState<SimulationResult[]>([]);

  useEffect(() => {
    loadCriteria();
    loadPointSettings();
  }, []);

  useEffect(() => {
    // DB에서 불러온 기준을 시뮬레이션 초기값으로 설정
    if (criteria.length > 0) {
      setSimulationCriteria(
        criteria
          .filter(c => c.tier !== 'light') // 'light'(신규)만 제외
          .map(c => {
            // tier 이름 정규화 (bronze -> LIGHT, silver -> STANDARD 등)
            let normalizedTier = c.tier.toUpperCase();
            if (c.tier === 'bronze' || c.tier === 'BRONZE') normalizedTier = 'LIGHT';
            if (c.tier === 'silver' || c.tier === 'SILVER') normalizedTier = 'STANDARD';
            if (c.tier === 'gold' || c.tier === 'GOLD') normalizedTier = 'ADVANCE';
            if (c.tier === 'platinum' || c.tier === 'PLATINUM') normalizedTier = 'ELITE';
            if (c.tier === 'diamond' || c.tier === 'DIAMOND') normalizedTier = 'LEGEND';

            return {
              tier: normalizedTier,
              minOrderCount: c.min_order_count,
              minTotalSales: c.min_total_sales,
            };
          })
      );
    }
  }, [criteria]);

  const loadCriteria = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/tier-criteria');
      const data = await response.json();

      if (data.success) {
        setCriteria(data.criteria);
      }
    } catch (error) {
      console.error('티어 기준 로드 오류:', error);
      toast.error('티어 기준을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadPointSettings = async () => {
    try {
      console.log('📥 누적점수 설정 불러오는 중...');
      const response = await fetch('/api/admin/tier-point-settings');
      const data = await response.json();

      if (data.success && data.settings) {
        const { settings } = data;
        console.log('📥 받은 데이터:', settings);

        if (settings.login_points_per_day !== undefined) setLoginPointsPerDay(settings.login_points_per_day);
        if (settings.points_per_day) setPointsPerDay(settings.points_per_day);
        if (settings.milestones) setMilestones(settings.milestones);
        if (settings.consecutive_bonuses) setConsecutiveBonuses(settings.consecutive_bonuses);
        if (settings.monthly_bonuses) setMonthlyBonuses(settings.monthly_bonuses);
        if (settings.no_login_penalties) setNoLoginPenalties(settings.no_login_penalties);
        if (settings.accumulated_point_criteria) setAccumulatedPointCriteria(settings.accumulated_point_criteria);

        console.log('✅ 누적점수 설정 불러오기 완료');
        console.log('- 로그인 점수:', settings.login_points_per_day);
        console.log('- 발주 점수:', settings.points_per_day);
        console.log('- 등급별 필요 점수:', settings.accumulated_point_criteria);
      } else {
        console.error('❌ 누적점수 설정 불러오기 실패:', data);
        toast.error('누적점수 설정을 불러올 수 없습니다.');
      }
    } catch (error) {
      console.error('❌ 누적점수 설정 로드 오류:', error);
      toast.error('누적점수 설정 로드 중 오류가 발생했습니다.');
    }
  };

  const savePointSettings = async () => {
    try {
      setSavingPointSettings(true);

      const payload = {
        loginPointsPerDay,
        pointsPerDay,
        milestones,
        consecutiveBonuses,
        monthlyBonuses,
        noLoginPenalties,
        accumulatedPointCriteria,
      };

      console.log('💾 누적점수 설정 저장 중...', payload);

      const response = await fetch('/api/admin/tier-point-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('💾 서버 응답:', data);

      if (data.success) {
        toast.success('✅ 누적점수 설정이 저장되었습니다.', {
          duration: 3000,
        });
        // 저장 후 다시 불러와서 확인
        await loadPointSettings();
        console.log('✅ 누적점수 설정 저장 완료 및 재확인 완료');
      } else {
        toast.error(data.error || '❌ 설정 저장에 실패했습니다.');
        console.error('❌ 저장 실패:', data);
      }
    } catch (error) {
      console.error('❌ 누적점수 설정 저장 오류:', error);
      toast.error('❌ 설정 저장 중 오류가 발생했습니다.');
    } finally {
      setSavingPointSettings(false);
    }
  };

  const handleChange = (tier: string, field: keyof TierCriteria, value: any) => {
    setCriteria(prev =>
      prev.map(c => {
        if (c.tier === tier) {
          const updated = { ...c, [field]: value };

          if (field === 'min_order_count' || field === 'min_total_sales' || field === 'discount_rate') {
            updated.description = generateDescription(
              field === 'min_order_count' ? value : updated.min_order_count,
              field === 'min_total_sales' ? value : updated.min_total_sales,
              field === 'discount_rate' ? value : updated.discount_rate
            );
          }

          return updated;
        }
        return c;
      })
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const response = await fetch('/api/admin/tier-criteria', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ criteria }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('티어 기준이 저장되었습니다.');
        await loadCriteria();
      } else {
        toast.error(data.error || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('저장 오류:', error);
      toast.error('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 시뮬레이션 로직
  const calculateAccumulatedPoints = (totalDays: number, totalMonths: number, daysPerMonth: number, hasConsecutive: boolean): { total: number; breakdown: { base: number; milestones: number; consecutive: number; monthly: number; penalty: number } } => {
    // 영업일 기준 계산 (토/일/공휴일 제외)
    const businessDaysPerMonth = (5 * 52) / 12;
    const totalBusinessDays = Math.round(totalMonths * businessDaysPerMonth);

    // 로그인 기본 점수: 모든 영업일에 로그인 시 점수 (설정값 사용)
    const loginPoints = Math.round(totalBusinessDays * loginPointsPerDay);

    // 발주 추가 점수: 발주일에만 추가 점수
    const orderBonusPerDay = pointsPerDay - loginPointsPerDay; // 로그인 점수 제외한 발주 보너스
    const orderBonusPoints = Math.round(totalDays * orderBonusPerDay);

    // 기본 점수 = 로그인 점수 + 발주 보너스
    let basePoints = loginPoints + orderBonusPoints;

    let milestonePoints = 0;
    let consecutivePoints = 0;
    let monthlyPoints = 0;

    milestones.forEach(milestone => {
      if (milestone.enabled && totalDays >= milestone.days) {
        milestonePoints += milestone.bonus;
      }
    });

    if (hasConsecutive) {
      consecutiveBonuses.forEach(bonus => {
        if (bonus.enabled && totalDays >= bonus.days) {
          consecutivePoints += bonus.bonus;
        }
      });
    }

    monthlyBonuses.forEach(bonus => {
      if (bonus.enabled && daysPerMonth >= bonus.minDays) {
        monthlyPoints += Math.round(bonus.bonus * totalMonths);
      }
    });

    return {
      total: Math.round(basePoints + milestonePoints + consecutivePoints + monthlyPoints),
      breakdown: {
        base: Math.round(basePoints),
        milestones: milestonePoints,
        consecutive: consecutivePoints,
        monthly: monthlyPoints,
        penalty: 0, // 패널티 제거
      }
    };
  };

  const checkTierByExisting = (threeMonthOrders: number, threeMonthSales: number): string | null => {
    const tierOrder = ['LEGEND', 'ELITE', 'ADVANCE', 'STANDARD', 'LIGHT'];
    for (const tierName of tierOrder) {
      const criteria = simulationCriteria.find(c => c.tier === tierName);
      if (criteria && threeMonthOrders >= criteria.minOrderCount && threeMonthSales >= criteria.minTotalSales) {
        return tierName;
      }
    }
    return null;
  };

  const checkTierByPoints = (accumulatedPoints: number): string | null => {
    const tierOrder = ['LEGEND', 'ELITE', 'ADVANCE', 'STANDARD', 'LIGHT'];
    for (const tierName of tierOrder) {
      const pointCriteria = accumulatedPointCriteria.find(c => c.tier === tierName);
      if (pointCriteria && accumulatedPoints >= pointCriteria.requiredPoints) {
        return tierName;
      }
    }
    return null;
  };

  const runSimulation = () => {
    const { daysPerWeek, ordersPerDay, pricePerOrder, hasConsecutiveStreak } = simulationInput;
    const daysPerMonth = (daysPerWeek * 52) / 12;
    const monthlyOrders = Math.round(daysPerMonth * ordersPerDay);
    const monthlySales = monthlyOrders * pricePerOrder;

    console.log('=== 시뮬레이션 시작 ===');
    console.log('📊 입력값:', { daysPerWeek, ordersPerDay, pricePerOrder });
    console.log('📊 계산값:', { daysPerMonth: daysPerMonth.toFixed(2), monthlyOrders, monthlySales });
    console.log('📊 시뮬레이션 기준:', simulationCriteria);

    const lightCriteria = simulationCriteria.find(c => c.tier === 'LIGHT');
    console.log('🎯 LIGHT 기준:', lightCriteria);

    // LIGHT 즉시 승급 일수 계산
    let lightUpgradeDays = 0;
    if (lightCriteria) {
      const daysForOrders = Math.ceil(lightCriteria.minOrderCount / ordersPerDay);
      const daysForSales = Math.ceil(lightCriteria.minTotalSales / (ordersPerDay * pricePerOrder));
      lightUpgradeDays = Math.max(daysForOrders, daysForSales);

      console.log(`✅ LIGHT 즉시 승급 조건: ${lightCriteria.minOrderCount}건 이상 + ${lightCriteria.minTotalSales.toLocaleString()}원 이상`);
      console.log(`📈 하루 발주: ${ordersPerDay}건 + ${(ordersPerDay * pricePerOrder).toLocaleString()}원`);
      console.log(`🎯 LIGHT 승급까지 필요 일수: ${lightUpgradeDays}일`);
    } else {
      console.log('❌ LIGHT 기준을 찾을 수 없습니다!');
    }

    const simulationResults: SimulationResult[] = [];
    let currentTier = 'light';
    let lightUpgraded = false;
    const today = new Date(); // 시작 날짜

    // 1단계: LIGHT 승급까지 일 단위로 시뮬레이션
    if (lightCriteria && currentTier === 'light') {
      for (let day = 1; day <= lightUpgradeDays && !lightUpgraded; day++) {
        const currentTotalOrders = ordersPerDay * day;
        const currentTotalSales = currentTotalOrders * pricePerOrder;
        const monthEquivalent = day / daysPerMonth;
        const pointsData = calculateAccumulatedPoints(day, monthEquivalent, daysPerMonth, hasConsecutiveStreak);

        if (currentTotalOrders >= lightCriteria.minOrderCount && currentTotalSales >= lightCriteria.minTotalSales) {
          currentTier = 'LIGHT';
          lightUpgraded = true;

          // 현재 날짜 계산
          const lightUpgradeDate = new Date(today);
          lightUpgradeDate.setDate(lightUpgradeDate.getDate() + day);

          // 월간 실적 (현재 날짜 기준 최근 30일)
          const oneMonthAgo = new Date(lightUpgradeDate);
          oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
          const oneMonthDiffTime = lightUpgradeDate.getTime() - Math.max(oneMonthAgo.getTime(), today.getTime());
          const oneMonthCalendarDays = Math.ceil(oneMonthDiffTime / (1000 * 60 * 60 * 24));
          const oneMonthOrders = Math.round((oneMonthCalendarDays / 7) * daysPerWeek * ordersPerDay);
          const oneMonthSales = oneMonthOrders * pricePerOrder;

          // 3개월 실적 (현재 날짜 기준 최근 3개월, LIGHT는 전체와 동일)
          const threeMonthOrders = currentTotalOrders;
          const threeMonthSales = currentTotalSales;

          simulationResults.push({
            month: monthEquivalent,
            accumulatedDays: day,
            accumulatedPoints: pointsData.total,
            oneMonthOrders,
            oneMonthSales,
            threeMonthOrders,
            threeMonthSales,
            monthlyOrders: currentTotalOrders,
            monthlySales: currentTotalSales,
            currentTier: 'LIGHT',
            upgradedBy: 'existing',
            pointsBreakdown: pointsData.breakdown,
          });

          console.log(`\n🎉 [${day}일차] ✅ LIGHT 즉시 승급! (실적방식 - 누적 ${currentTotalOrders}건 / ${currentTotalSales.toLocaleString()}원)`);
          break;
        }
      }
    }

    // 2단계: LIGHT 승급 후 일별 시뮬레이션
    let currentDay = lightUpgraded ? lightUpgradeDays : 0;
    const maxDays = 3650; // 최대 10년
    const tierOrder = ['light', 'LIGHT', 'STANDARD', 'ADVANCE', 'ELITE', 'LEGEND'];

    while (currentDay < maxDays && currentTier !== 'LEGEND') {
      currentDay++;

      // 현재 날짜 계산
      const currentDate = new Date(today);
      currentDate.setDate(currentDate.getDate() + currentDay);

      // 누적 영업일 및 실적 계산
      const currentTotalDays = Math.round((currentDay / 7) * daysPerWeek);
      const currentTotalOrders = currentTotalDays * ordersPerDay;
      const currentTotalSales = currentTotalOrders * pricePerOrder;

      // 누적 점수 계산 (매일)
      const monthEquivalent = currentDay / daysPerMonth;
      const pointsData = calculateAccumulatedPoints(currentTotalDays, monthEquivalent, daysPerMonth, hasConsecutiveStreak);

      let newTier = currentTier;
      let upgradedBy: 'existing' | 'points' | null = null;

      // 활동점수방식: 매일 체크
      const tierByPoints = checkTierByPoints(pointsData.total);
      if (tierByPoints && tierOrder.indexOf(tierByPoints) > tierOrder.indexOf(currentTier)) {
        newTier = tierByPoints;
        upgradedBy = 'points';
      }

      // 실적방식: 매월 1일에만 체크
      if (currentDate.getDate() === 1) {
        // 3개월 전 1일 계산
        const threeMonthsAgo = new Date(currentDate);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const threeMonthDiffTime = Math.max(currentDate.getTime() - Math.max(threeMonthsAgo.getTime(), today.getTime()), 0);
        const threeMonthDays = Math.ceil(threeMonthDiffTime / (1000 * 60 * 60 * 24));

        // 3개월 실적 계산
        const threeMonthOrders = Math.round((threeMonthDays / 7) * daysPerWeek * ordersPerDay);
        const threeMonthSales = threeMonthOrders * pricePerOrder;

        const tierByExisting = checkTierByExisting(threeMonthOrders, threeMonthSales);
        if (tierByExisting && tierOrder.indexOf(tierByExisting) > tierOrder.indexOf(newTier)) {
          newTier = tierByExisting;
          upgradedBy = 'existing';
        }

        // 3개월 실적 로그 (매월 1일마다)
        console.log(`\n📅 [${currentDate.toISOString().split('T')[0]}] 매월 1일 실적 체크`);
        console.log(`  3개월 실적: ${threeMonthOrders}건 / ${threeMonthSales.toLocaleString()}원`);
      }

      // 등급 변경 시에만 결과 추가
      if (newTier !== currentTier) {
        const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

        // 3개월 실적 재계산 (표시용, 시작일 이후만)
        const threeMonthsAgo = new Date(currentDate);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const threeMonthDiffTime = currentDate.getTime() - Math.max(threeMonthsAgo.getTime(), today.getTime());
        const threeMonthDays = Math.ceil(threeMonthDiffTime / (1000 * 60 * 60 * 24));
        const threeMonthOrders = Math.round((threeMonthDays / 7) * daysPerWeek * ordersPerDay);
        const threeMonthSales = threeMonthOrders * pricePerOrder;

        // 월간 실적 계산 (현재 날짜 기준 최근 30일, 시작일 이후만)
        const oneMonthAgo = new Date(currentDate);
        oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
        const oneMonthDiffTime = currentDate.getTime() - Math.max(oneMonthAgo.getTime(), today.getTime());
        const oneMonthCalendarDays = Math.ceil(oneMonthDiffTime / (1000 * 60 * 60 * 24));
        const oneMonthOrders = Math.round((oneMonthCalendarDays / 7) * daysPerWeek * ordersPerDay);
        const oneMonthSales = oneMonthOrders * pricePerOrder;

        console.log(`\n🎉 [${dateString}] ${currentTier} → ${newTier} 승급! (${upgradedBy === 'existing' ? '실적방식' : '활동점수방식'})`);
        console.log(`  누적 점수: ${pointsData.total}점`);
        console.log(`  월간 실적: ${oneMonthOrders}건 / ${oneMonthSales.toLocaleString()}원`);
        console.log(`  3개월 실적: ${threeMonthOrders}건 / ${threeMonthSales.toLocaleString()}원`);

        currentTier = newTier;

        simulationResults.push({
          month: Math.ceil(currentDay / 30),
          accumulatedDays: currentDay,
          accumulatedPoints: pointsData.total,
          oneMonthOrders,
          oneMonthSales,
          threeMonthOrders,
          threeMonthSales,
          monthlyOrders: currentTotalOrders,
          monthlySales: currentTotalSales,
          currentTier,
          upgradedBy: upgradedBy,
          pointsBreakdown: pointsData.breakdown,
          judgeDate: currentDate.getTime(),
        });
      }
    }

    setResults(simulationResults);
  };

  const getTierName = (tier: string) => {
    const names: Record<string, string> = {
      light: 'LIGHT',
      LIGHT: 'LIGHT',
      STANDARD: 'STANDARD',
      ADVANCE: 'ADVANCE',
      ELITE: 'ELITE',
      LEGEND: 'LEGEND',
      // 하위 호환성
      bronze: 'LIGHT',
      silver: 'STANDARD',
      gold: 'ADVANCE',
      platinum: 'ELITE',
      diamond: 'LEGEND'
    };
    return names[tier] || tier.toUpperCase();
  };

  const getTierColor = (tier: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      light: { bg: '#f1f5f9', text: '#64748b', border: '#94a3b8' },
      LIGHT: { bg: '#fed7aa', text: '#9a3412', border: '#9a3412' },
      STANDARD: { bg: '#f1f5f9', text: '#334155', border: '#334155' },
      ADVANCE: { bg: '#fef3c7', text: '#92400e', border: '#92400e' },
      ELITE: { bg: '#f3e8ff', text: '#581c87', border: '#581c87' },
      LEGEND: { bg: '#e0f2fe', text: '#0c4a6e', border: '#0c4a6e' },
      // 하위 호환성
      bronze: { bg: '#fed7aa', text: '#9a3412', border: '#9a3412' },
      silver: { bg: '#f1f5f9', text: '#334155', border: '#334155' },
      gold: { bg: '#fef3c7', text: '#92400e', border: '#92400e' },
      platinum: { bg: '#f3e8ff', text: '#581c87', border: '#581c87' },
      diamond: { bg: '#e0f2fe', text: '#0c4a6e', border: '#0c4a6e' }
    };
    return colors[tier] || colors.LIGHT;
  };

  const formatNumber = (num: number) => {
    if (num >= 100000000) {
      return `${(num / 100000000).toFixed(1)}억`;
    } else if (num >= 10000) {
      return `${(num / 10000).toFixed(0)}만`;
    }
    return num.toLocaleString();
  };

  const formatNumberWithComma = (value: number) => {
    return value.toLocaleString('ko-KR');
  };

  const parseNumberFromInput = (value: string) => {
    return parseInt(value.replace(/,/g, '')) || 0;
  };

  const generateDescription = (orderCount: number, sales: number, discountRate: number) => {
    const salesFormatted = formatNumber(sales);
    if (discountRate > 0) {
      // 소숫점이 있으면 2자리까지 표시, 없으면 정수로 표시
      const discountFormatted = discountRate % 1 === 0 ? discountRate.toString() : discountRate.toFixed(2);
      return `월 ${orderCount}건 이상 + ${salesFormatted} 이상 (${discountFormatted}% 할인)`;
    } else {
      return `월 ${orderCount}건 이상 (할인 없음)`;
    }
  };

  const getUpgradeSummary = () => {
    const seenTiers = new Set<string>();
    const upgrades: Array<{ tier: string; days: number; month: number; method: 'existing' | 'points' }> = [];

    for (let i = 0; i < results.length; i++) {
      const current = results[i];
      const previous = i > 0 ? results[i - 1] : null;

      // 이전과 등급이 다른 경우만 승급으로 간주
      if (previous && current.currentTier !== previous.currentTier && !seenTiers.has(current.currentTier)) {
        seenTiers.add(current.currentTier);
        upgrades.push({
          tier: current.currentTier,
          days: current.accumulatedDays,
          month: current.month,
          method: current.upgradedBy || 'existing',
        });
      }
      // 첫 번째 결과가 light가 아닌 경우 (즉시 승급)
      else if (i === 0 && current.currentTier !== 'light' && !seenTiers.has(current.currentTier)) {
        seenTiers.add(current.currentTier);
        upgrades.push({
          tier: current.currentTier,
          days: current.accumulatedDays,
          month: current.month,
          method: current.upgradedBy || 'existing',
        });
      }
    }

    return upgrades;
  };

  return (
    <div style={{ padding: '24px', width: '100%' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
          티어 등급 설정 & 시뮬레이션
        </h1>
        <p style={{ fontSize: '13px', color: '#6b7280' }}>
          실적방식(건수/금액)과 활동점수방식(누적 발주일수) 기반 등급 판정 시스템
        </p>
      </div>

      {/* 티어 배지 */}
      <div style={{ marginBottom: '24px' }}>
        <TierRow />
      </div>

      {/* 2단 레이아웃: 좌측(설정) + 우측(시뮬레이터) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 800px', gap: '24px', alignItems: 'start' }}>
        {/* 좌측: 티어 기준 & 누적점수 설정 */}
        <div>
          {/* 실적방식 설정 저장 버튼 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>
              실적방식 설정
            </h2>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '8px 16px',
                background: saving
                  ? '#adb5bd'
                  : 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {saving ? '저장 중...' : '실적방식 설정 저장'}
            </button>
          </div>

          {/* 실적방식 설정 테이블 */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#6c757d' }}>
              로딩 중...
            </div>
          ) : (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              overflow: 'hidden',
              border: '1px solid #dee2e6',
              marginBottom: '32px'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '600', width: '10%' }}>등급</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '600', width: '12%' }}>3개월 발주건수</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '600', width: '18%' }}>3개월 발주금액</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '600', width: '8%' }}>할인율</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '600', width: '10%' }}>연속 유지 기준</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '600', width: '10%' }}>보너스 지속</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '600', width: '22%' }}>설명</th>
                  </tr>
                </thead>
                <tbody>
                  {criteria.map((item) => {
                    const tierColor = getTierColor(item.tier);
                    return (
                      <tr key={item.tier} style={{ borderBottom: '1px solid #dee2e6' }}>
                        <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        background: tierColor.bg,
                        color: tierColor.text,
                        border: `2px solid ${tierColor.border}`,
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '700',
                        letterSpacing: '0.05em'
                      }}>
                        {getTierName(item.tier)}
                      </span>
                    </td>
                    <td style={{ padding: '6px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <input
                          type="number"
                          value={item.min_order_count}
                          onChange={(e) => handleChange(item.tier, 'min_order_count', parseInt(e.target.value) || 0)}
                          style={{
                            width: '60px',
                            padding: '6px 10px',
                            border: '1px solid #dee2e6',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            textAlign: 'right'
                          }}
                        />
                        <span style={{ fontSize: '14px', color: '#6c757d' }}>건 이상</span>
                      </div>
                    </td>
                    <td style={{ padding: '6px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <input
                          type="text"
                          value={formatNumberWithComma(item.min_total_sales)}
                          onChange={(e) => handleChange(item.tier, 'min_total_sales', parseNumberFromInput(e.target.value))}
                          style={{
                            width: '150px',
                            padding: '6px 10px',
                            border: '1px solid #dee2e6',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            textAlign: 'right'
                          }}
                        />
                        <span style={{ fontSize: '14px', color: '#6c757d' }}>원</span>
                      </div>
                    </td>
                    <td style={{ padding: '6px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={item.discount_rate}
                          onChange={(e) => handleChange(item.tier, 'discount_rate', parseFloat(e.target.value) || 0)}
                          style={{
                            width: '60px',
                            padding: '6px 10px',
                            border: '1px solid #dee2e6',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            textAlign: 'right'
                          }}
                        />
                        <span style={{ fontSize: '14px', color: '#6c757d' }}>%</span>
                      </div>
                    </td>
                    <td style={{ padding: '6px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <input
                          type="number"
                          value={item.consecutive_months_for_bonus || ''}
                          onChange={(e) => handleChange(item.tier, 'consecutive_months_for_bonus', e.target.value ? parseInt(e.target.value) : null)}
                          placeholder="미사용"
                          style={{
                            width: '40px',
                            padding: '6px 10px',
                            border: '1px solid #dee2e6',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            textAlign: 'right'
                          }}
                        />
                        <span style={{ fontSize: '14px', color: '#6c757d' }}>개월</span>
                      </div>
                    </td>
                    <td style={{ padding: '6px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <input
                          type="number"
                          value={item.bonus_tier_duration_months}
                          onChange={(e) => handleChange(item.tier, 'bonus_tier_duration_months', parseInt(e.target.value) || 1)}
                          style={{
                            width: '40px',
                            padding: '6px 10px',
                            border: '1px solid #dee2e6',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            textAlign: 'right'
                          }}
                        />
                        <span style={{ fontSize: '14px', color: '#6c757d' }}>개월</span>
                      </div>
                    </td>
                    <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                      <input
                        type="text"
                        value={item.description || ''}
                        onChange={(e) => handleChange(item.tier, 'description', e.target.value)}
                        placeholder="자동 생성됨"
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          border: '1px solid #dee2e6',
                          borderRadius: '8px',
                          fontSize: '13px',
                          background: '#f8f9fa',
                          color: '#495057'
                        }}
                        readOnly
                      />
                    </td>
                  </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}

          {/* 활동점수방식 설정 저장 버튼 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', marginTop: '32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>
              활동점수방식 설정
            </h2>
            <button
              onClick={savePointSettings}
              disabled={savingPointSettings}
              style={{
                padding: '8px 16px',
                background: savingPointSettings
                  ? '#adb5bd'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: savingPointSettings ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {savingPointSettings ? '저장 중...' : '활동점수방식 설정 저장'}
            </button>
          </div>

          {/* 활동점수방식 설정 */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #dee2e6' }}>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px' }}>
              {/* 칼럼 1: 기본 설정 */}
              <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>
              기본 설정
            </h3>
            <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                로그인 1일당 점수
              </label>
              <input
                type="text"
                value={loginPointsPerDay.toLocaleString()}
                onChange={(e) => setLoginPointsPerDay(parseInt(e.target.value.replace(/,/g, '')) || 0)}
                style={{ width: '80px', padding: '6px 10px', border: '1px solid #dee2e6', borderRadius: '8px', fontSize: '13px', textAlign: 'center' }}
              />
              <span style={{ fontSize: '12px', color: '#6b7280' }}>점</span>
            </div>
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                발주 1일당 점수
              </label>
              <input
                type="text"
                value={pointsPerDay.toLocaleString()}
                onChange={(e) => setPointsPerDay(parseInt(e.target.value.replace(/,/g, '')) || 0)}
                style={{ width: '80px', padding: '6px 10px', border: '1px solid #dee2e6', borderRadius: '8px', fontSize: '13px', textAlign: 'center' }}
              />
              <span style={{ fontSize: '12px', color: '#6b7280' }}>점</span>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                등급별 필요 점수
              </label>
              {accumulatedPointCriteria.map((apc, index) => (
                <div key={apc.tier} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: getTierColor(apc.tier).text, minWidth: '70px' }}>
                    {getTierName(apc.tier)}
                  </div>
                  <input
                    type="text"
                    value={apc.requiredPoints.toLocaleString()}
                    onChange={(e) => {
                      const newCriteria = [...accumulatedPointCriteria];
                      newCriteria[index].requiredPoints = parseInt(e.target.value.replace(/,/g, '')) || 0;
                      setAccumulatedPointCriteria(newCriteria);
                    }}
                    style={{ flex: 1, padding: '6px 10px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', textAlign: 'center' }}
                  />
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>점</span>
                </div>
              ))}
            </div>
          </div>

          {/* 칼럼 2: 마일스톤 보너스 */}
          <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>
              마일스톤 보너스
            </h3>
            {milestones.map((ms, index) => (
              <div key={index} style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="checkbox"
                  checked={ms.enabled}
                  onChange={(e) => {
                    const newMilestones = [...milestones];
                    newMilestones[index].enabled = e.target.checked;
                    setMilestones(newMilestones);
                  }}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={ms.days.toLocaleString()}
                  onChange={(e) => {
                    const newMilestones = [...milestones];
                    newMilestones[index].days = parseInt(e.target.value.replace(/,/g, '')) || 0;
                    setMilestones(newMilestones);
                  }}
                  style={{ width: '42px', padding: '6px 8px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', textAlign: 'center' }}
                />
                <span style={{ fontSize: '12px', color: '#6b7280' }}>일 →</span>
                <input
                  type="text"
                  value={ms.bonus.toLocaleString()}
                  onChange={(e) => {
                    const newMilestones = [...milestones];
                    newMilestones[index].bonus = parseInt(e.target.value.replace(/,/g, '')) || 0;
                    setMilestones(newMilestones);
                  }}
                  style={{ flex: 1, padding: '6px 8px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', textAlign: 'center' }}
                />
                <span style={{ fontSize: '12px', color: '#6b7280' }}>점</span>
              </div>
            ))}
          </div>

          {/* 칼럼 3: 연속성 보너스 */}
          <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>
              연속성 보너스
            </h3>
            {consecutiveBonuses.map((cb, index) => (
              <div key={index} style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="checkbox"
                  checked={cb.enabled}
                  onChange={(e) => {
                    const newBonuses = [...consecutiveBonuses];
                    newBonuses[index].enabled = e.target.checked;
                    setConsecutiveBonuses(newBonuses);
                  }}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={cb.days.toLocaleString()}
                  onChange={(e) => {
                    const newBonuses = [...consecutiveBonuses];
                    newBonuses[index].days = parseInt(e.target.value.replace(/,/g, '')) || 0;
                    setConsecutiveBonuses(newBonuses);
                  }}
                  style={{ width: '42px', padding: '6px 8px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', textAlign: 'center' }}
                />
                <span style={{ fontSize: '12px', color: '#6b7280' }}>일 →</span>
                <input
                  type="text"
                  value={cb.bonus.toLocaleString()}
                  onChange={(e) => {
                    const newBonuses = [...consecutiveBonuses];
                    newBonuses[index].bonus = parseInt(e.target.value.replace(/,/g, '')) || 0;
                    setConsecutiveBonuses(newBonuses);
                  }}
                  style={{ flex: 1, padding: '6px 8px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', textAlign: 'center' }}
                />
                <span style={{ fontSize: '12px', color: '#6b7280' }}>점</span>
              </div>
            ))}
          </div>

          {/* 칼럼 4: 월간 보너스 */}
          <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>
              월간 보너스
            </h3>
            {monthlyBonuses.map((mb, index) => (
              <div key={index} style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="checkbox"
                  checked={mb.enabled}
                  onChange={(e) => {
                    const newBonuses = [...monthlyBonuses];
                    newBonuses[index].enabled = e.target.checked;
                    setMonthlyBonuses(newBonuses);
                  }}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={mb.minDays.toLocaleString()}
                  onChange={(e) => {
                    const newBonuses = [...monthlyBonuses];
                    newBonuses[index].minDays = parseInt(e.target.value.replace(/,/g, '')) || 0;
                    setMonthlyBonuses(newBonuses);
                  }}
                  style={{ width: '42px', padding: '6px 8px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', textAlign: 'center' }}
                />
                <span style={{ fontSize: '12px', color: '#6b7280' }}>일 이상 →</span>
                <input
                  type="text"
                  value={mb.bonus.toLocaleString()}
                  onChange={(e) => {
                    const newBonuses = [...monthlyBonuses];
                    newBonuses[index].bonus = parseInt(e.target.value.replace(/,/g, '')) || 0;
                    setMonthlyBonuses(newBonuses);
                  }}
                  style={{ flex: 1, padding: '6px 8px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', textAlign: 'center' }}
                />
                <span style={{ fontSize: '12px', color: '#6b7280' }}>점(월간)</span>
              </div>
            ))}
              </div>

          {/* 칼럼 5: 미로그인 감점 */}
          <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>
              미로그인 감점
            </h3>
            {noLoginPenalties.map((nlp, index) => (
              <div key={index} style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="checkbox"
                  checked={nlp.enabled}
                  onChange={(e) => {
                    const newPenalties = [...noLoginPenalties];
                    newPenalties[index].enabled = e.target.checked;
                    setNoLoginPenalties(newPenalties);
                  }}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={nlp.days.toLocaleString()}
                  onChange={(e) => {
                    const newPenalties = [...noLoginPenalties];
                    newPenalties[index].days = parseInt(e.target.value.replace(/,/g, '')) || 0;
                    setNoLoginPenalties(newPenalties);
                  }}
                  style={{ width: '42px', padding: '6px 8px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', textAlign: 'center' }}
                />
                <span style={{ fontSize: '12px', color: '#6b7280' }}>일 →</span>
                <input
                  type="text"
                  value={nlp.penalty.toLocaleString()}
                  onChange={(e) => {
                    const newPenalties = [...noLoginPenalties];
                    newPenalties[index].penalty = parseInt(e.target.value.replace(/,/g, '')) || 0;
                    setNoLoginPenalties(newPenalties);
                  }}
                  style={{ flex: 1, padding: '6px 8px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', textAlign: 'center' }}
                />
                <span style={{ fontSize: '12px', color: '#6b7280' }}>점 감점</span>
              </div>
            ))}
          </div>
            </div>
          </div>
        </div>

        {/* 우측: 시뮬레이터 */}
        <div style={{ position: 'sticky', top: '24px' }}>
          <div style={{ padding: '24px', background: '#f8f9fa', borderRadius: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>
              등급 승급 시뮬레이터
            </h2>

            {/* 발주 패턴 입력 */}
            <div>
              <div style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                  발주 패턴 입력
                </h3>

                <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap', minWidth: '120px' }}>
                    주당 발주일 (영업일)
                  </label>
                  <input
                    type="number"
                    value={simulationInput.daysPerWeek}
                    onChange={(e) => setSimulationInput({ ...simulationInput, daysPerWeek: parseInt(e.target.value) || 0 })}
                    style={{ flex: 1, padding: '6px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' }}
                  />
                </div>

                <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap', minWidth: '120px' }}>
                    하루 평균 건수
                  </label>
                  <input
                    type="number"
                    value={simulationInput.ordersPerDay}
                    onChange={(e) => setSimulationInput({ ...simulationInput, ordersPerDay: parseInt(e.target.value) || 0 })}
                    style={{ flex: 1, padding: '6px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' }}
                  />
                </div>

                <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap', minWidth: '120px' }}>
                    건당 평균 금액
                  </label>
                  <input
                    type="number"
                    value={simulationInput.pricePerOrder}
                    onChange={(e) => setSimulationInput({ ...simulationInput, pricePerOrder: parseInt(e.target.value) || 0 })}
                    style={{ flex: 1, padding: '6px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' }}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={simulationInput.hasConsecutiveStreak}
                      onChange={(e) => setSimulationInput({ ...simulationInput, hasConsecutiveStreak: e.target.checked })}
                      style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: '600' }}>
                      연속성 보너스 적용
                    </span>
                  </label>
                </div>

                <button
                  onClick={runSimulation}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '13px',
                    marginBottom: '10px',
                  }}
                >
                  시뮬레이션 실행
                </button>

                {results.length > 0 && (
                  <div style={{ padding: '10px', background: '#f0f9ff', borderRadius: '8px', marginBottom: '10px' }}>
                    <div style={{ fontSize: '11px', color: '#0369a1', marginBottom: '2px' }}>
                      월 평균 실적 (발주 패턴 기준)
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>
                      {(() => {
                        const monthlyOrders = Math.round((simulationInput.daysPerWeek / 7) * 30 * simulationInput.ordersPerDay);
                        const monthlySales = monthlyOrders * simulationInput.pricePerOrder;
                        return `${monthlyOrders}건 / ${(monthlySales / 10000).toFixed(0)}만원`;
                      })()}
                    </div>
                    <div style={{ fontSize: '11px', color: '#0369a1', marginTop: '4px' }}>
                      연간 예상: {(() => {
                        const monthlyOrders = Math.round((simulationInput.daysPerWeek / 7) * 30 * simulationInput.ordersPerDay);
                        const monthlySales = monthlyOrders * simulationInput.pricePerOrder;
                        return `${(monthlyOrders * 12).toLocaleString()}건 / ${((monthlySales * 12) / 10000).toFixed(0)}만원`;
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 결과 */}
            {results.length > 0 && (
              <div>
                {/* 승급 요약 */}
                <div style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                    승급 요약
                  </h3>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {getUpgradeSummary().map((upgrade, index) => {
                      const tierColor = getTierColor(upgrade.tier);
                      // LIGHT는 일 단위, 이후는 월 단위로 표시
                      const displayTime = upgrade.tier === 'LIGHT'
                        ? `${upgrade.days}일차`
                        : `${upgrade.month}개월차 (매월 1일)`;
                      return (
                        <div key={index} style={{
                          padding: '12px 16px',
                          background: tierColor.bg,
                          borderRadius: '8px',
                          border: `2px solid ${tierColor.border}`,
                        }}>
                          <div style={{ fontSize: '16px', fontWeight: '700', color: tierColor.text, marginBottom: '2px' }}>
                            {getTierName(upgrade.tier)}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {displayTime}<br/>({upgrade.method === 'existing' ? '실적방식' : '활동점수방식'})
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 결과 테이블 */}
                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                  <div style={{ maxHeight: 'calc(100vh - 320px)', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ position: 'sticky', top: 0, background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                        <tr>
                          <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600' }}>날짜</th>
                          <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600' }}>누적일</th>
                          <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600' }}>누적점수</th>
                          <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600' }}>월간 누적 실적</th>
                          <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600' }}>3개월 누적 실적</th>
                          <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600' }}>전체 누적 실적</th>
                          <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600' }}>등급</th>
                          <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600' }}>승급 방식</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results
                          .filter((result, index) => {
                            // 등급이 변경된 행만 표시
                            if (index === 0) return true; // 첫 번째 행은 항상 표시
                            return result.currentTier !== results[index - 1].currentTier;
                          })
                          .map((result, index) => {
                            const tierColor = getTierColor(result.currentTier);
                            // 날짜 계산
                            const targetDate = new Date();

                            // LIGHT 승급은 실제 날짜 표시
                            if (result.currentTier === 'LIGHT' && index === 0) {
                              targetDate.setDate(targetDate.getDate() + result.accumulatedDays);
                            } else {
                              // LIGHT 이후는 judgeDate 사용 (실제 판정일)
                              const judgeDate = new Date(result.judgeDate);
                              targetDate.setTime(judgeDate.getTime());
                            }

                            const dateString = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;

                            return (
                              <tr key={index} style={{
                                borderBottom: '1px solid #f3f4f6',
                                background: '#fef3c7'
                              }}>
                                <td style={{ padding: '8px', textAlign: 'center', fontSize: '11px', color: '#374151', fontWeight: '600' }}>
                                  {dateString}
                                </td>
                                <td style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                                  {result.accumulatedDays}일
                                </td>
                                <td style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600' }}>
                                  {result.accumulatedPoints.toLocaleString()}점
                                </td>
                                {/* 월간 누적 실적 (최근 30일) */}
                                <td style={{ padding: '8px', textAlign: 'center', fontSize: '11px' }}>
                                  {result.oneMonthOrders}건<br/>
                                  {(result.oneMonthSales / 10000).toFixed(0)}만원
                                </td>
                                {/* 3개월 누적 실적 */}
                                <td style={{ padding: '8px', textAlign: 'center', fontSize: '11px' }}>
                                  {result.threeMonthOrders}건<br/>
                                  {(result.threeMonthSales / 10000).toFixed(0)}만원
                                </td>
                                {/* 전체 누적 실적 */}
                                <td style={{ padding: '8px', textAlign: 'center', fontSize: '11px' }}>
                                  {result.monthlyOrders}건<br/>
                                  {(result.monthlySales / 10000).toFixed(0)}만원
                                </td>
                                <td style={{ padding: '8px', textAlign: 'center' }}>
                                  <span style={{
                                    padding: '4px 10px',
                                    background: tierColor.bg,
                                    color: tierColor.text,
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                  }}>
                                    {getTierName(result.currentTier)}
                                  </span>
                                </td>
                                <td style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600' }}>
                                  {result.upgradedBy === 'existing' && <span style={{ color: '#3b82f6' }}>실적방식</span>}
                                  {result.upgradedBy === 'points' && <span style={{ color: '#8b5cf6' }}>활동점수방식</span>}
                                  {!result.upgradedBy && <span style={{ color: '#d1d5db' }}>-</span>}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
