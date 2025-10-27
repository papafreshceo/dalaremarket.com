'use client';

import { TrendingUp, Calendar, MapPin, Truck, Package2 } from 'lucide-react';

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
  shipping_cost?: number;
  thumbnail_url?: string;
}

interface ProductCardProps {
  product: OptionProduct;
  onProductClick: (product: OptionProduct) => void;
  onShowPriceChart: (product: OptionProduct) => void;
}

export default function ProductCard({ product, onProductClick, onShowPriceChart }: ProductCardProps) {
  const formatPrice = (price?: number) => {
    if (!price) return '-';
    return `${price.toLocaleString()}원`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className="bg-white rounded shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer border border-gray-200 hover:border-blue-300"
      onClick={() => onProductClick(product)}
    >
      {/* 썸네일 이미지 */}
      {product.thumbnail_url ? (
        <div className="relative">
          <img
            src={product.thumbnail_url}
            alt={product.option_name}
            className="w-full aspect-square object-cover"
          />
          {/* 가격 변동 그래프 버튼 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowPriceChart(product);
            }}
            className="absolute top-1.5 right-1.5 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-md hover:bg-white transition-colors"
            title="가격 변동 그래프"
          >
            <TrendingUp className="w-3 h-3 text-blue-600" />
          </button>
        </div>
      ) : (
        <div className="w-full aspect-square flex items-center justify-center bg-gray-100">
          <Package2 className="w-12 h-12 text-gray-400" />
        </div>
      )}

      {/* 상품 정보 */}
      <div className="p-3">
        {/* 상품명 */}
        <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2 min-h-[2.5rem]">
          {product.option_name}
        </h3>

        {/* 중분류/품목 - 제거 (품목별로 그룹화되어 있으므로 불필요) */}

        {/* 규격 정보 */}
        {((product as any).spec1 || (product as any).spec2 || (product as any).spec3) && (
          <div className="text-xs text-gray-600 mb-2 bg-gray-50 px-1.5 py-1 rounded">
            <div className="space-y-0.5">
              {(product as any).spec1 && <div className="truncate">{(product as any).spec1}</div>}
              {(product as any).spec2 && <div className="truncate">{(product as any).spec2}</div>}
              {(product as any).spec3 && <div className="truncate">{(product as any).spec3}</div>}
            </div>
          </div>
        )}

        {/* 가격 정보 */}
        <div className="space-y-1 mb-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">공급가</span>
            <span className="text-xs font-semibold text-blue-600">
              {formatPrice(product.seller_supply_price)}
            </span>
          </div>
          {product.shipping_cost && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">택배비</span>
              <span className="text-xs text-gray-700">
                {formatPrice(product.shipping_cost)}
              </span>
            </div>
          )}
        </div>

        {/* 시즌 정보 */}
        {(product.season_start || product.season_end) && (
          <div className="flex items-center gap-0.5 text-xs text-gray-600 mb-1 bg-green-50 px-1.5 py-0.5 rounded">
            <Calendar className="w-2.5 h-2.5" />
            <span className="truncate">
              {formatDate(product.season_start)} ~ {formatDate(product.season_end)}
            </span>
          </div>
        )}

        {/* 발송기한 */}
        {(product as any).shipping_deadline && (
          <div className="flex items-center gap-0.5 text-xs text-gray-600">
            <Truck className="w-2.5 h-2.5" />
            <span className="truncate">발송: {(product as any).shipping_deadline}</span>
          </div>
        )}
      </div>
    </div>
  );
}
