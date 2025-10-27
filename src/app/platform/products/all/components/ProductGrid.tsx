'use client';

import { TrendingUp, Package2 } from 'lucide-react';

interface OptionProduct {
  id: number;
  option_name: string;
  option_code?: string;
  seller_supply_price?: number;
  market_price?: number;
  shipping_entity?: string;
  invoice_entity?: string;
  shipping_vendor_id?: string;
  shipping_location_name?: string;
  shipping_location_address?: string;
  shipping_location_contact?: string;
  shipping_cost?: number;
}

interface ProductGridProps {
  products: OptionProduct[];
  onProductClick: (product: OptionProduct) => void;
  onShowPriceChart: (product: OptionProduct) => void;
}

export default function ProductGrid({ products, onProductClick, onShowPriceChart }: ProductGridProps) {
  const formatPrice = (price?: number) => {
    if (!price) return '-';
    return `${price.toLocaleString()}원`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                썸네일
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                중분류
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                품목
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                옵션명
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                규격1
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                규격2
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                규격3
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                셀러공급가
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                택배비
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                발송기한
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                가격차트
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                이미지/상세
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((product) => (
              <tr
                key={product.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-3 py-2">
                  <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                    {product.thumbnail_url ? (
                      <img
                        src={product.thumbnail_url}
                        alt={product.option_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package2 className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                </td>
                <td className="px-3 py-3 text-sm text-gray-900">
                  {(product as any).middle_category || '-'}
                </td>
                <td className="px-3 py-3 text-sm text-gray-900">
                  {(product as any).item_name || '-'}
                </td>
                <td className="px-3 py-3 text-sm font-medium text-gray-900">
                  {product.option_name}
                </td>
                <td className="px-3 py-3 text-sm text-gray-600">
                  {(product as any).spec1 || '-'}
                </td>
                <td className="px-3 py-3 text-sm text-gray-600">
                  {(product as any).spec2 || '-'}
                </td>
                <td className="px-3 py-3 text-sm text-gray-600">
                  {(product as any).spec3 || '-'}
                </td>
                <td className="px-3 py-3 text-sm text-right font-semibold text-blue-600">
                  {formatPrice(product.seller_supply_price)}
                </td>
                <td className="px-3 py-3 text-sm text-right text-gray-700">
                  {formatPrice(product.shipping_cost)}
                </td>
                <td className="px-3 py-3 text-sm text-center text-gray-600">
                  {(product as any).shipping_deadline || '-'}
                </td>
                <td className="px-3 py-3 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onShowPriceChart(product);
                    }}
                    className="inline-flex items-center justify-center p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="가격 변동 그래프"
                  >
                    <TrendingUp className="w-4 h-4" />
                  </button>
                </td>
                <td className="px-3 py-3 text-center">
                  <button
                    onClick={() => onProductClick(product)}
                    className="inline-flex items-center justify-center px-3 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors border border-blue-300"
                  >
                    상세보기
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
