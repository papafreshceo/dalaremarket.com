'use client';

import { useState } from 'react';
import { Calculator, TrendingUp, FileText, Settings, Download } from 'lucide-react';

export default function EtcTab() {
  const [calculatorData, setCalculatorData] = useState({
    sellerSupplyPrice: 0,
    shippingFee: 0,
    commissionRate: 0,
    quantity: 1,
  });

  const [statsDateRange, setStatsDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProfit: 0,
    averageOrderValue: 0,
    marketBreakdown: [] as { market: string; count: number; revenue: number }[],
  });

  // 수익 계산
  const calculateProfit = () => {
    const { sellerSupplyPrice, shippingFee, commissionRate, quantity } = calculatorData;

    const totalSupplyPrice = sellerSupplyPrice * quantity;
    const totalShippingFee = shippingFee * quantity;
    const commission = totalSupplyPrice * (commissionRate / 100);
    const totalCost = totalSupplyPrice + totalShippingFee + commission;
    const profit = totalSupplyPrice - commission - totalShippingFee;
    const profitRate = totalSupplyPrice > 0 ? (profit / totalSupplyPrice) * 100 : 0;

    return {
      totalSupplyPrice,
      totalShippingFee,
      commission,
      totalCost,
      profit,
      profitRate,
    };
  };

  const calculated = calculateProfit();

  const handleLoadStats = async () => {
    try {
      // TODO: API 호출하여 통계 조회
      console.log('통계 조회:', statsDateRange);

      await new Promise(resolve => setTimeout(resolve, 1000));

      // 임시 데이터
      setStats({
        totalOrders: 150,
        totalRevenue: 15000000,
        totalProfit: 3000000,
        averageOrderValue: 100000,
        marketBreakdown: [
          { market: '스마트스토어', count: 60, revenue: 6000000 },
          { market: '쿠팡', count: 50, revenue: 5000000 },
          { market: '11번가', count: 30, revenue: 3000000 },
          { market: '토스', count: 10, revenue: 1000000 },
        ],
      });

      alert('통계가 로드되었습니다.');
    } catch (error) {
      console.error('통계 조회 실패:', error);
      alert('통계 조회 중 오류가 발생했습니다.');
    }
  };

  const handleExportStats = () => {
    console.log('통계 엑셀 다운로드');
    // TODO: 통계 엑셀 다운로드
    alert('통계를 엑셀로 다운로드합니다.');
  };

  return (
    <div className="space-y-6">
      {/* 수익 계산기 */}
      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-text">수익 계산기</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              셀러공급가 (원)
            </label>
            <input
              type="number"
              value={calculatorData.sellerSupplyPrice}
              onChange={(e) => setCalculatorData({ ...calculatorData, sellerSupplyPrice: parseFloat(e.target.value) || 0 })}
              placeholder="0"
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              배송비 (원)
            </label>
            <input
              type="number"
              value={calculatorData.shippingFee}
              onChange={(e) => setCalculatorData({ ...calculatorData, shippingFee: parseFloat(e.target.value) || 0 })}
              placeholder="0"
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              수수료율 (%)
            </label>
            <input
              type="number"
              value={calculatorData.commissionRate}
              onChange={(e) => setCalculatorData({ ...calculatorData, commissionRate: parseFloat(e.target.value) || 0 })}
              placeholder="0"
              step="0.1"
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              수량
            </label>
            <input
              type="number"
              value={calculatorData.quantity}
              onChange={(e) => setCalculatorData({ ...calculatorData, quantity: parseInt(e.target.value) || 1 })}
              min="1"
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="bg-surface-secondary border border-border rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-text-secondary mb-1">총 공급가</div>
              <div className="text-lg font-semibold text-text">{calculated.totalSupplyPrice.toLocaleString()}원</div>
            </div>
            <div>
              <div className="text-xs text-text-secondary mb-1">총 배송비</div>
              <div className="text-lg font-semibold text-text">{calculated.totalShippingFee.toLocaleString()}원</div>
            </div>
            <div>
              <div className="text-xs text-text-secondary mb-1">수수료</div>
              <div className="text-lg font-semibold text-orange-600">{calculated.commission.toLocaleString()}원</div>
            </div>
            <div>
              <div className="text-xs text-text-secondary mb-1">총 비용</div>
              <div className="text-lg font-semibold text-red-600">{calculated.totalCost.toLocaleString()}원</div>
            </div>
            <div>
              <div className="text-xs text-text-secondary mb-1">예상 수익</div>
              <div className="text-lg font-semibold text-green-600">{calculated.profit.toLocaleString()}원</div>
            </div>
            <div>
              <div className="text-xs text-text-secondary mb-1">수익률</div>
              <div className="text-lg font-semibold text-primary">{calculated.profitRate.toFixed(2)}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* 통계 */}
      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-text">주문 통계</h2>
        </div>

        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="flex gap-3 flex-1">
            <div className="flex-1">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                시작일
              </label>
              <input
                type="date"
                value={statsDateRange.startDate}
                onChange={(e) => setStatsDateRange({ ...statsDateRange, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                종료일
              </label>
              <input
                type="date"
                value={statsDateRange.endDate}
                onChange={(e) => setStatsDateRange({ ...statsDateRange, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex gap-2 items-end">
            <button
              onClick={handleLoadStats}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap"
            >
              통계 조회
            </button>
            <button
              onClick={handleExportStats}
              disabled={stats.totalOrders === 0}
              className="flex items-center gap-2 px-4 py-2 border border-border bg-surface text-text rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              다운로드
            </button>
          </div>
        </div>

        {stats.totalOrders > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-surface-secondary border border-border rounded-lg">
                <div className="text-sm text-text-secondary mb-1">총 주문 수</div>
                <div className="text-2xl font-semibold text-text">{stats.totalOrders.toLocaleString()}</div>
              </div>
              <div className="p-4 bg-surface-secondary border border-border rounded-lg">
                <div className="text-sm text-text-secondary mb-1">총 매출</div>
                <div className="text-2xl font-semibold text-blue-600">{stats.totalRevenue.toLocaleString()}원</div>
              </div>
              <div className="p-4 bg-surface-secondary border border-border rounded-lg">
                <div className="text-sm text-text-secondary mb-1">총 수익</div>
                <div className="text-2xl font-semibold text-green-600">{stats.totalProfit.toLocaleString()}원</div>
              </div>
              <div className="p-4 bg-surface-secondary border border-border rounded-lg">
                <div className="text-sm text-text-secondary mb-1">평균 주문액</div>
                <div className="text-2xl font-semibold text-primary">{stats.averageOrderValue.toLocaleString()}원</div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-text mb-3">마켓별 현황</h3>
              <div className="space-y-2">
                {stats.marketBreakdown.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-surface-secondary border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 text-xs font-medium rounded bg-primary/10 text-primary">
                        {item.market}
                      </span>
                      <span className="text-sm text-text-secondary">
                        주문 수: <span className="font-semibold text-text">{item.count.toLocaleString()}</span>
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-blue-600">
                      {item.revenue.toLocaleString()}원
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {stats.totalOrders === 0 && (
          <div className="text-center py-12 text-text-secondary">
            <FileText className="w-12 h-12 text-text-muted mx-auto mb-3" />
            <p>날짜를 선택하고 통계 조회 버튼을 클릭하세요.</p>
          </div>
        )}
      </div>

      {/* 설정 */}
      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-text">기타 설정</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div>
              <div className="font-medium text-text">자동 저장</div>
              <div className="text-sm text-text-secondary">주문 통합 시 자동으로 저장합니다</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div>
              <div className="font-medium text-text">알림 설정</div>
              <div className="text-sm text-text-secondary">새로운 CS 건 발생 시 알림을 받습니다</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div>
              <div className="font-medium text-text">배송 자동 업데이트</div>
              <div className="text-sm text-text-secondary">배송 상태를 자동으로 업데이트합니다</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
