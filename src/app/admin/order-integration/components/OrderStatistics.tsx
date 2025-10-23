'use client';

import { memo } from 'react';

interface OrderStats {
  total: number;
  접수: number;
  결제완료: number;
  상품준비중: number;
  발송완료: number;
  취소요청: number;
  취소완료: number;
  환불완료: number;
}

interface OrderStatisticsProps {
  stats: OrderStats;
  statusFilter: string | null;
  onStatusClick: (status: string | null) => void;
}

// 성능 최적화: StatCard 컴포넌트 메모이제이션
const StatCard = memo(({
  label,
  value,
  color,
  isActive,
  onClick
}: {
  label: string;
  value: number;
  color: string;
  isActive: boolean;
  onClick: () => void;
}) => {
  const colorClasses: Record<string, { border: string; text: string; hover: string }> = {
    gray: { border: 'border-gray-900', text: 'text-gray-900', hover: 'hover:border-gray-400' },
    purple: { border: 'border-purple-600', text: 'text-purple-600', hover: 'hover:border-purple-400' },
    blue: { border: 'border-blue-600', text: 'text-blue-600', hover: 'hover:border-blue-400' },
    yellow: { border: 'border-yellow-600', text: 'text-yellow-600', hover: 'hover:border-yellow-400' },
    green: { border: 'border-green-600', text: 'text-green-600', hover: 'hover:border-green-400' },
    orange: { border: 'border-orange-600', text: 'text-orange-600', hover: 'hover:border-orange-400' },
    red: { border: 'border-red-600', text: 'text-red-600', hover: 'hover:border-red-400' },
  };

  const colors = colorClasses[color] || colorClasses.gray;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg border-2 p-4 cursor-pointer transition-all ${
        isActive
          ? `${colors.border} shadow-md`
          : `border-gray-200 ${colors.hover}`
      }`}
    >
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className={`text-2xl font-semibold ${colors.text}`} suppressHydrationWarning>
        {value.toLocaleString()}
      </div>
    </div>
  );
});

StatCard.displayName = 'StatCard';

export default function OrderStatistics({ stats, statusFilter, onStatusClick }: OrderStatisticsProps) {
  return (
    <div className="grid grid-cols-8 gap-4">
      <StatCard
        label="전체"
        value={stats.total}
        color="gray"
        isActive={statusFilter === null}
        onClick={() => onStatusClick(null)}
      />
      <StatCard
        label="접수"
        value={stats.접수 || 0}
        color="purple"
        isActive={statusFilter === '접수'}
        onClick={() => onStatusClick('접수')}
      />
      <StatCard
        label="결제완료"
        value={stats.결제완료 || 0}
        color="blue"
        isActive={statusFilter === '결제완료'}
        onClick={() => onStatusClick('결제완료')}
      />
      <StatCard
        label="상품준비중"
        value={stats.상품준비중 || 0}
        color="yellow"
        isActive={statusFilter === '상품준비중'}
        onClick={() => onStatusClick('상품준비중')}
      />
      <StatCard
        label="발송완료"
        value={stats.발송완료 || 0}
        color="green"
        isActive={statusFilter === '발송완료'}
        onClick={() => onStatusClick('발송완료')}
      />
      <StatCard
        label="취소요청"
        value={stats.취소요청 || 0}
        color="orange"
        isActive={statusFilter === '취소요청'}
        onClick={() => onStatusClick('취소요청')}
      />
      <StatCard
        label="취소완료"
        value={stats.취소완료 || 0}
        color="gray"
        isActive={statusFilter === '취소완료'}
        onClick={() => onStatusClick('취소완료')}
      />
      <StatCard
        label="환불완료"
        value={stats.환불완료 || 0}
        color="red"
        isActive={statusFilter === '환불완료'}
        onClick={() => onStatusClick('환불완료')}
      />
    </div>
  );
}
