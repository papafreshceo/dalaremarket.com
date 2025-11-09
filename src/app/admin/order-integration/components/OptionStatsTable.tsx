'use client';

interface OptionStats {
  option_name: string;
  접수_건수: number;
  접수_수량: number;
  결제완료_건수: number;
  결제완료_수량: number;
  상품준비중_건수: number;
  상품준비중_수량: number;
  발송완료_건수: number;
  발송완료_수량: number;
  취소요청_건수: number;
  취소요청_수량: number;
  취소완료_건수: number;
  취소완료_수량: number;
}

interface OptionStatsTableProps {
  optionStats: OptionStats[];
}

export default function OptionStatsTable({ optionStats }: OptionStatsTableProps) {
  if (optionStats.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-4 py-3 flex items-center gap-4">
        <span className="text-lg font-semibold text-gray-700">
          옵션별 집계
        </span>
      </div>

      <div className="overflow-x-auto pb-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th rowSpan={2} style={{ fontSize: '16px', padding: '6px 16px', textAlign: 'left', fontWeight: 500, color: '#4B5563', verticalAlign: 'middle', borderRight: '1px solid #E5E7EB' }}>옵션상품</th>
              <th colSpan={2} style={{ fontSize: '16px', padding: '6px 16px', textAlign: 'center', fontWeight: 500, color: '#9333EA', borderRight: '1px solid #E5E7EB' }}>접수</th>
              <th colSpan={2} style={{ fontSize: '16px', padding: '6px 16px', textAlign: 'center', fontWeight: 500, color: '#2563EB', borderRight: '1px solid #E5E7EB' }}>결제완료</th>
              <th colSpan={2} style={{ fontSize: '16px', padding: '6px 16px', textAlign: 'center', fontWeight: 500, color: '#CA8A04', borderRight: '1px solid #E5E7EB' }}>상품준비중</th>
              <th colSpan={2} style={{ fontSize: '16px', padding: '6px 16px', textAlign: 'center', fontWeight: 500, color: '#16A34A', borderRight: '1px solid #E5E7EB' }}>발송완료</th>
              <th colSpan={2} style={{ fontSize: '16px', padding: '6px 16px', textAlign: 'center', fontWeight: 500, color: '#EA580C', borderRight: '1px solid #E5E7EB' }}>취소요청</th>
              <th colSpan={2} style={{ fontSize: '16px', padding: '6px 16px', textAlign: 'center', fontWeight: 500, color: '#DC2626' }}>취소완료</th>
            </tr>
            <tr className="bg-gray-50">
              <th style={{ fontSize: '14px', padding: '4px 8px', textAlign: 'center', fontWeight: 400, color: '#6B7280' }}>건수</th>
              <th style={{ fontSize: '14px', padding: '4px 8px', textAlign: 'center', fontWeight: 400, color: '#6B7280', borderRight: '1px solid #E5E7EB' }}>수량</th>
              <th style={{ fontSize: '14px', padding: '4px 8px', textAlign: 'center', fontWeight: 400, color: '#6B7280' }}>건수</th>
              <th style={{ fontSize: '14px', padding: '4px 8px', textAlign: 'center', fontWeight: 400, color: '#6B7280', borderRight: '1px solid #E5E7EB' }}>수량</th>
              <th style={{ fontSize: '14px', padding: '4px 8px', textAlign: 'center', fontWeight: 400, color: '#6B7280' }}>건수</th>
              <th style={{ fontSize: '14px', padding: '4px 8px', textAlign: 'center', fontWeight: 400, color: '#6B7280', borderRight: '1px solid #E5E7EB' }}>수량</th>
              <th style={{ fontSize: '14px', padding: '4px 8px', textAlign: 'center', fontWeight: 400, color: '#6B7280' }}>건수</th>
              <th style={{ fontSize: '14px', padding: '4px 8px', textAlign: 'center', fontWeight: 400, color: '#6B7280', borderRight: '1px solid #E5E7EB' }}>수량</th>
              <th style={{ fontSize: '14px', padding: '4px 8px', textAlign: 'center', fontWeight: 400, color: '#6B7280' }}>건수</th>
              <th style={{ fontSize: '14px', padding: '4px 8px', textAlign: 'center', fontWeight: 400, color: '#6B7280', borderRight: '1px solid #E5E7EB' }}>수량</th>
              <th style={{ fontSize: '14px', padding: '4px 8px', textAlign: 'center', fontWeight: 400, color: '#6B7280' }}>건수</th>
              <th style={{ fontSize: '14px', padding: '4px 8px', textAlign: 'center', fontWeight: 400, color: '#6B7280' }}>수량</th>
            </tr>
          </thead>
          <tbody>
            {optionStats.map((stat, idx) => (
              <tr key={stat.option_name} style={{ borderTop: idx === 0 ? 'none' : '1px solid #E5E7EB' }} className="hover:bg-gray-50">
                <td style={{ fontSize: '16px', padding: '6px 16px', fontWeight: 500, color: '#111827', borderRight: '1px solid #E5E7EB' }}>{stat.option_name}</td>
                <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#7C3AED', fontWeight: 600 }}>{(stat.접수_건수 || 0) > 0 ? stat.접수_건수.toLocaleString() : ''}</td>
                <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#7C3AED', fontWeight: 500, borderRight: '1px solid #E5E7EB' }}>{(stat.접수_수량 || 0) > 0 ? stat.접수_수량.toLocaleString() : ''}</td>
                <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#1D4ED8', fontWeight: 600 }}>{(stat.결제완료_건수 || 0) > 0 ? stat.결제완료_건수.toLocaleString() : ''}</td>
                <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#1D4ED8', fontWeight: 500, borderRight: '1px solid #E5E7EB' }}>{(stat.결제완료_수량 || 0) > 0 ? stat.결제완료_수량.toLocaleString() : ''}</td>
                <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#A16207', fontWeight: 600 }}>{(stat.상품준비중_건수 || 0) > 0 ? stat.상품준비중_건수.toLocaleString() : ''}</td>
                <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#A16207', fontWeight: 500, borderRight: '1px solid #E5E7EB' }}>{(stat.상품준비중_수량 || 0) > 0 ? stat.상품준비중_수량.toLocaleString() : ''}</td>
                <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#15803D', fontWeight: 600 }}>{(stat.발송완료_건수 || 0) > 0 ? stat.발송완료_건수.toLocaleString() : ''}</td>
                <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#15803D', fontWeight: 500, borderRight: '1px solid #E5E7EB' }}>{(stat.발송완료_수량 || 0) > 0 ? stat.발송완료_수량.toLocaleString() : ''}</td>
                <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#C2410C', fontWeight: 600 }}>{(stat.취소요청_건수 || 0) > 0 ? stat.취소요청_건수.toLocaleString() : ''}</td>
                <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#C2410C', fontWeight: 500, borderRight: '1px solid #E5E7EB' }}>{(stat.취소요청_수량 || 0) > 0 ? stat.취소요청_수량.toLocaleString() : ''}</td>
                <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#B91C1C', fontWeight: 600 }}>{(stat.취소완료_건수 || 0) > 0 ? stat.취소완료_건수.toLocaleString() : ''}</td>
                <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#B91C1C', fontWeight: 500 }}>{(stat.취소완료_수량 || 0) > 0 ? stat.취소완료_수량.toLocaleString() : ''}</td>
              </tr>
            ))}
            {/* 합계 행 */}
            <tr style={{ borderTop: '2px solid #374151', backgroundColor: '#F9FAFB' }}>
              <td style={{ fontSize: '16px', padding: '6px 16px', fontWeight: 700, color: '#111827', borderRight: '1px solid #E5E7EB' }}>합계</td>
              <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#7C3AED', fontWeight: 700 }}>
                {optionStats.reduce((sum, stat) => sum + (stat.접수_건수 || 0), 0).toLocaleString()}
              </td>
              <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#7C3AED', fontWeight: 600, borderRight: '1px solid #E5E7EB' }}>
                {optionStats.reduce((sum, stat) => sum + (stat.접수_수량 || 0), 0).toLocaleString()}
              </td>
              <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#1D4ED8', fontWeight: 700 }}>
                {optionStats.reduce((sum, stat) => sum + (stat.결제완료_건수 || 0), 0).toLocaleString()}
              </td>
              <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#1D4ED8', fontWeight: 600, borderRight: '1px solid #E5E7EB' }}>
                {optionStats.reduce((sum, stat) => sum + (stat.결제완료_수량 || 0), 0).toLocaleString()}
              </td>
              <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#A16207', fontWeight: 700 }}>
                {optionStats.reduce((sum, stat) => sum + (stat.상품준비중_건수 || 0), 0).toLocaleString()}
              </td>
              <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#A16207', fontWeight: 600, borderRight: '1px solid #E5E7EB' }}>
                {optionStats.reduce((sum, stat) => sum + (stat.상품준비중_수량 || 0), 0).toLocaleString()}
              </td>
              <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#15803D', fontWeight: 700 }}>
                {optionStats.reduce((sum, stat) => sum + (stat.발송완료_건수 || 0), 0).toLocaleString()}
              </td>
              <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#15803D', fontWeight: 600, borderRight: '1px solid #E5E7EB' }}>
                {optionStats.reduce((sum, stat) => sum + (stat.발송완료_수량 || 0), 0).toLocaleString()}
              </td>
              <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#C2410C', fontWeight: 700 }}>
                {optionStats.reduce((sum, stat) => sum + (stat.취소요청_건수 || 0), 0).toLocaleString()}
              </td>
              <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#C2410C', fontWeight: 600, borderRight: '1px solid #E5E7EB' }}>
                {optionStats.reduce((sum, stat) => sum + (stat.취소요청_수량 || 0), 0).toLocaleString()}
              </td>
              <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#B91C1C', fontWeight: 700 }}>
                {optionStats.reduce((sum, stat) => sum + (stat.취소완료_건수 || 0), 0).toLocaleString()}
              </td>
              <td style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', color: '#B91C1C', fontWeight: 600 }}>
                {optionStats.reduce((sum, stat) => sum + (stat.취소완료_수량 || 0), 0).toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
