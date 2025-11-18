'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { createClient } from '@/lib/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';

interface OptionProduct {
  id: number;
  option_name: string;
  option_code?: string;
  seller_supply_price?: number;
}

interface PriceHistory {
  date: string;
  price: number;
  change_reason?: string;
}

interface PriceChartModalProps {
  product: OptionProduct;
  onClose: () => void;
}

export default function PriceChartModal({ product, onClose }: PriceChartModalProps) {
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('3M');
  const [isReady, setIsReady] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchPriceHistory();
  }, [product.id, selectedPeriod]);

  // 초기 로딩이 완료되면 모달 표시
  useEffect(() => {
    if (!loading && !isReady) {
      // 약간의 딜레이를 주어 차트가 렌더링된 후 모달 애니메이션 시작
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [loading, isReady]);

  const fetchPriceHistory = async () => {
    try {
      setLoading(true);

      // 기간 계산
      const now = new Date();
      let startDate = new Date();

      switch (selectedPeriod) {
        case '1M':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case '3M':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case '6M':
          startDate.setMonth(now.getMonth() - 6);
          break;
        case '1Y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        case 'ALL':
          startDate = new Date('2000-01-01');
          break;
      }

      // 가격 이력 조회 (option_product_price_history 테이블이 있다고 가정)
      const { data, error } = await supabase
        .from('option_product_price_history')
        .select('*')
        .eq('option_product_id', product.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        console.error('가격 이력 조회 오류:', error);
        // 테이블이 없으면 현재 가격만 표시
        setPriceHistory([
          {
            date: new Date().toISOString().split('T')[0],
            price: product.seller_supply_price || 0,
          },
        ]);
        return;
      }

      // 데이터 포맷팅
      const formattedData = (data || []).map((item: any) => ({
        date: new Date(item.created_at).toLocaleDateString('ko-KR', {
          month: 'short',
          day: 'numeric',
        }),
        price: item.price || 0,
        change_reason: item.change_reason,
      }));

      // 데이터가 없으면 현재 가격 표시
      if (formattedData.length === 0) {
        setPriceHistory([
          {
            date: new Date().toLocaleDateString('ko-KR', {
              month: 'short',
              day: 'numeric',
            }),
            price: product.seller_supply_price || 0,
          },
        ]);
      } else {
        setPriceHistory(formattedData);
      }
    } catch (error) {
      console.error('가격 이력 fetch 오류:', error);
      setPriceHistory([
        {
          date: new Date().toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric',
          }),
          price: product.seller_supply_price || 0,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 가격 변동 통계 계산
  const calculateStats = () => {
    if (priceHistory.length < 2) {
      return {
        minPrice: product.seller_supply_price || 0,
        maxPrice: product.seller_supply_price || 0,
        avgPrice: product.seller_supply_price || 0,
        currentPrice: product.seller_supply_price || 0,
        priceChange: 0,
        priceChangePercent: 0,
      };
    }

    const prices = priceHistory.map((h) => h.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const currentPrice = prices[prices.length - 1];
    const firstPrice = prices[0];
    const priceChange = currentPrice - firstPrice;
    const priceChangePercent = firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0;

    return {
      minPrice,
      maxPrice,
      avgPrice,
      currentPrice,
      priceChange,
      priceChangePercent,
    };
  };

  const stats = calculateStats();

  // 로딩 중일 때는 투명한 오버레이만 표시
  if (!isReady) {
    return (
      <div className="fixed inset-0 bg-black/10 z-[9998] flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 shadow-xl">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600">차트 로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Modal isOpen={isReady} onClose={onClose} title="셀러 공급가 변동 그래프" size="xl">
      <div className="space-y-6">
        {/* 상품 정보 헤더 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-1">{product.option_name}</h3>
          {product.option_code && (
            <p className="text-sm text-gray-500">{product.option_code}</p>
          )}
        </div>

        {/* 기간 선택 버튼 */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600 mr-2">기간:</span>
          {(['1M', '3M', '6M', '1Y', 'ALL'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                selectedPeriod === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {period}
            </button>
          ))}
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-xs text-blue-600 mb-1">현재가</div>
            <div className="text-lg font-bold text-blue-900">
              {stats.currentPrice.toLocaleString()}원
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">평균가</div>
            <div className="text-lg font-bold text-gray-900">
              {Math.round(stats.avgPrice).toLocaleString()}원
            </div>
          </div>

          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-xs text-green-600 mb-1">최고가</div>
            <div className="text-lg font-bold text-green-900">
              {stats.maxPrice.toLocaleString()}원
            </div>
          </div>

          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="text-xs text-orange-600 mb-1">최저가</div>
            <div className="text-lg font-bold text-orange-900">
              {stats.minPrice.toLocaleString()}원
            </div>
          </div>
        </div>

        {/* 가격 변동률 */}
        {priceHistory.length >= 2 && (
          <div
            className={`p-4 rounded-lg flex items-center gap-3 ${
              stats.priceChange >= 0 ? 'bg-red-50' : 'bg-blue-50'
            }`}
          >
            {stats.priceChange >= 0 ? (
              <TrendingUp className="w-6 h-6 text-red-600" />
            ) : (
              <TrendingDown className="w-6 h-6 text-blue-600" />
            )}
            <div>
              <div className="text-sm text-gray-600">선택 기간 내 가격 변동</div>
              <div
                className={`text-xl font-bold ${
                  stats.priceChange >= 0 ? 'text-red-600' : 'text-blue-600'
                }`}
              >
                {stats.priceChange >= 0 ? '+' : ''}
                {stats.priceChange.toLocaleString()}원 ({stats.priceChange >= 0 ? '+' : ''}
                {stats.priceChangePercent.toFixed(1)}%)
              </div>
            </div>
          </div>
        )}

        {/* 차트 */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={priceHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value: any) => [`${value.toLocaleString()}원`, '가격']}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ fill: '#2563eb', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="셀러 공급가"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 안내 메시지 */}
        {priceHistory.length === 1 && (
          <div className="text-center text-sm text-gray-500 py-4">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p>아직 가격 변동 이력이 없습니다.</p>
            <p className="text-xs mt-1">현재 가격만 표시됩니다.</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
