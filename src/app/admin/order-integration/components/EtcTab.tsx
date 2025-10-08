'use client';

import { useState, useEffect } from 'react';
import { Calculator, TrendingUp, FileText, Settings, Download, Users, Mail, Package } from 'lucide-react';
import EditableAdminGrid from '@/components/ui/EditableAdminGrid';

type SubTab = 'calculator' | 'customers' | 'templates';

interface RegularCustomer {
  id: number;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  purchase_count: number;
  total_purchase_amount: number;
  last_purchase_date?: string;
  memo?: string;
}

interface MarketTemplate {
  id: number;
  market_name: string;
  template_data: any;
}

export default function EtcTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('calculator');
  const [customers, setCustomers] = useState<RegularCustomer[]>([]);
  const [templates, setTemplates] = useState<MarketTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  const [calculatorData, setCalculatorData] = useState({
    sellerSupplyPrice: 0,
    shippingFee: 0,
    commissionRate: 0,
    quantity: 1,
  });

  // EditableAdminGrid 컬럼 정의
  const customerColumns = [
    { field: 'customer_name', headerName: '고객명', width: 120 },
    { field: 'customer_phone', headerName: '전화번호', width: 130 },
    { field: 'customer_address', headerName: '주소', width: 250 },
    { field: 'purchase_count', headerName: '구매횟수', width: 90, type: 'number' as const },
    { field: 'total_purchase_amount', headerName: '총구매금액', width: 120, type: 'number' as const },
    { field: 'last_purchase_date', headerName: '최근구매일', width: 100, type: 'date' as const },
    { field: 'memo', headerName: '메모', width: 200 },
  ];

  const templateColumns = [
    { field: 'market_name', headerName: '마켓명', width: 150 },
    { field: 'template_data', headerName: '템플릿 데이터', width: 500 },
  ];

  useEffect(() => {
    if (activeSubTab === 'customers') {
      loadCustomers();
    } else if (activeSubTab === 'templates') {
      loadTemplates();
    }
  }, [activeSubTab]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/regular-customers');
      const result = await response.json();

      if (result.success) {
        setCustomers(result.data || []);
      }
    } catch (error) {
      console.error('고객 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/market-templates');
      const result = await response.json();

      if (result.success) {
        setTemplates(result.data || []);
      }
    } catch (error) {
      console.error('템플릿 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCustomers = async (updatedData: any[]) => {
    try {
      const updates = updatedData.filter((row) => row.id);

      if (updates.length === 0) {
        return;
      }

      const response = await fetch('/api/regular-customers/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customers: updates }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`${result.count}개 고객 정보가 수정되었습니다.`);
        loadCustomers();
      } else {
        alert('수정 실패: ' + result.error);
      }
    } catch (error) {
      console.error('저장 오류:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleSaveTemplates = async (updatedData: any[]) => {
    try {
      const updates = updatedData.filter((row) => row.id);

      if (updates.length === 0) {
        return;
      }

      const response = await fetch('/api/market-templates/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templates: updates }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`${result.count}개 템플릿이 수정되었습니다.`);
        loadTemplates();
      } else {
        alert('수정 실패: ' + result.error);
      }
    } catch (error) {
      console.error('저장 오류:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

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

  const subTabs = [
    { id: 'calculator' as SubTab, label: '수익 계산기', icon: Calculator },
    { id: 'customers' as SubTab, label: '단골 고객 관리', icon: Users },
    { id: 'templates' as SubTab, label: '마켓 업로드 템플릿', icon: Package },
  ];

  return (
    <div className="space-y-4">
      {/* 서브 탭 */}
      <div className="flex gap-2 border-b border-gray-200">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors ${
                activeSubTab === tab.id
                  ? 'border-blue-500 text-blue-600 font-semibold'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 수익 계산기 */}
      {activeSubTab === 'calculator' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">수익 계산기</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                셀러공급가 (원)
              </label>
              <input
                type="number"
                value={calculatorData.sellerSupplyPrice}
                onChange={(e) => setCalculatorData({ ...calculatorData, sellerSupplyPrice: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                배송비 (원)
              </label>
              <input
                type="number"
                value={calculatorData.shippingFee}
                onChange={(e) => setCalculatorData({ ...calculatorData, shippingFee: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                수수료율 (%)
              </label>
              <input
                type="number"
                value={calculatorData.commissionRate}
                onChange={(e) => setCalculatorData({ ...calculatorData, commissionRate: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                수량
              </label>
              <input
                type="number"
                value={calculatorData.quantity}
                onChange={(e) => setCalculatorData({ ...calculatorData, quantity: parseInt(e.target.value) || 1 })}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-gray-600 mb-1">총 공급가</div>
                <div className="text-lg font-semibold text-gray-900">{calculated.totalSupplyPrice.toLocaleString()}원</div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">총 배송비</div>
                <div className="text-lg font-semibold text-gray-900">{calculated.totalShippingFee.toLocaleString()}원</div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">수수료</div>
                <div className="text-lg font-semibold text-orange-600">{calculated.commission.toLocaleString()}원</div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">총 비용</div>
                <div className="text-lg font-semibold text-red-600">{calculated.totalCost.toLocaleString()}원</div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">예상 수익</div>
                <div className="text-lg font-semibold text-green-600">{calculated.profit.toLocaleString()}원</div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">수익률</div>
                <div className="text-lg font-semibold text-blue-600">{calculated.profitRate.toFixed(2)}%</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 단골 고객 관리 */}
      {activeSubTab === 'customers' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              단골 고객 목록 ({customers.length}명)
            </h3>
          </div>
          <EditableAdminGrid
            columns={customerColumns}
            data={customers}
            onSave={handleSaveCustomers}
            height="calc(100vh - 400px)"
            enableExport={true}
            enableImport={false}
            pageSize={50}
          />
        </div>
      )}

      {/* 마켓 업로드 템플릿 */}
      {activeSubTab === 'templates' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              마켓 업로드 템플릿 ({templates.length}개)
            </h3>
          </div>
          <EditableAdminGrid
            columns={templateColumns}
            data={templates}
            onSave={handleSaveTemplates}
            height="calc(100vh - 400px)"
            enableExport={true}
            enableImport={false}
            pageSize={50}
          />
        </div>
      )}
    </div>
  );
}
