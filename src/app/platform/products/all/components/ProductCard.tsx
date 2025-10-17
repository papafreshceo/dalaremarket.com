'use client';

import { TrendingUp, Calendar, MapPin, Truck, Package2 } from 'lucide-react';

interface OptionProduct {
  id: number;
  option_name: string;
  option_code?: string;
  seller_supply_price?: number;
  market_price?: number;
  season_start?: string;
  season_end?: string;
  출고?: string;
  송장?: string;
  벤더사?: string;
  발송지명?: string;
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
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer border border-gray-200 hover:border-blue-300"
      onClick={() => onProductClick(product)}
    >
      {/* 썸네일 이미지 */}
      <div className="relative aspect-square bg-gray-100">
        {product.thumbnail_url ? (
          <img
            src={product.thumbnail_url}
            alt={product.option_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package2 className="w-16 h-16 text-gray-400" />
          </div>
        )}

        {/* 가격 변동 그래프 버튼 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShowPriceChart(product);
          }}
          className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md hover:bg-white transition-colors"
          title="가격 변동 그래프"
        >
          <TrendingUp className="w-4 h-4 text-blue-600" />
        </button>
      </div>

      {/* 상품 정보 */}
      <div className="p-4">
        {/* 상품명 */}
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 min-h-[3rem]">
          {product.option_name}
        </h3>

        {/* 중분류/품목 */}
        <div className="text-xs text-gray-500 mb-2 space-y-0.5">
          {(product as any).middle_category && (
            <div className="flex items-center gap-1">
              <span className="font-medium">중분류:</span>
              <span>{(product as any).middle_category}</span>
            </div>
          )}
          {(product as any).item_name && (
            <div className="flex items-center gap-1">
              <span className="font-medium">품목:</span>
              <span>{(product as any).item_name}</span>
            </div>
          )}
        </div>

        {/* 규격 정보 */}
        {((product as any).spec1 || (product as any).spec2 || (product as any).spec3) && (
          <div className="text-xs text-gray-600 mb-3 bg-gray-50 px-2 py-1.5 rounded">
            <div className="space-y-0.5">
              {(product as any).spec1 && <div>규격1: {(product as any).spec1}</div>}
              {(product as any).spec2 && <div>규격2: {(product as any).spec2}</div>}
              {(product as any).spec3 && <div>규격3: {(product as any).spec3}</div>}
            </div>
          </div>
        )}

        {/* 가격 정보 */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">셀러 공급가</span>
            <span className="text-sm font-semibold text-blue-600">
              {formatPrice(product.seller_supply_price)}
            </span>
          </div>
          {product.출고비용 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">택배비</span>
              <span className="text-xs text-gray-700">
                {formatPrice(product.출고비용)}
              </span>
            </div>
          )}
        </div>

        {/* 시즌 정보 */}
        {(product.season_start || product.season_end) && (
          <div className="flex items-center gap-1 text-xs text-gray-600 mb-2 bg-green-50 px-2 py-1 rounded">
            <Calendar className="w-3 h-3" />
            <span>
              {formatDate(product.season_start)} ~ {formatDate(product.season_end)}
            </span>
          </div>
        )}

        {/* 발송기한 */}
        {(product as any).shipping_deadline && (
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Truck className="w-3 h-3" />
            <span>발송기한: {(product as any).shipping_deadline}</span>
          </div>
        )}
      </div>
    </div>
  );
}
