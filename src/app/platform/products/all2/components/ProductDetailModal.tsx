'use client';

import { X, TrendingUp, MapPin, Truck, Package2, DollarSign, Tag } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

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
  thumbnail_url?: string;
  created_at?: string;
  updated_at?: string;
}

interface ProductDetailModalProps {
  product: OptionProduct;
  onClose: () => void;
  onShowPriceChart: () => void;
}

export default function ProductDetailModal({ product, onClose, onShowPriceChart }: ProductDetailModalProps) {
  const formatPrice = (price?: number) => {
    if (!price) return '-';
    return `${price.toLocaleString()}원`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('ko-KR');
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="상품 상세 정보" size="lg">
      <div className="space-y-6">
        {/* 썸네일 및 기본 정보 */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* 썸네일 */}
          <div className="w-full md:w-64 flex-shrink-0">
            {product.thumbnail_url ? (
              <img
                src={product.thumbnail_url}
                alt={product.option_name}
                className="w-full aspect-square object-cover rounded-lg"
              />
            ) : (
              <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <Package2 className="w-20 h-20 text-gray-400" />
              </div>
            )}
          </div>

          {/* 기본 정보 */}
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {product.option_name}
              </h3>
              {product.option_code && (
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Tag className="w-4 h-4" />
                  {product.option_code}
                </p>
              )}
            </div>

            {/* 가격 정보 카드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-900 font-medium">셀러 공급가</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {formatPrice(product.seller_supply_price)}
                </p>
              </div>

              {product.market_price && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Tag className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600 font-medium">마켓 판매가</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(product.market_price)}
                  </p>
                </div>
              )}
            </div>

            {/* 가격 변동 그래프 버튼 */}
            <button
              onClick={onShowPriceChart}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              가격 변동 그래프 보기
            </button>
          </div>
        </div>

        <hr className="border-gray-200" />

        {/* 배송 정보 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Truck className="w-5 h-5 text-gray-700" />
            <h4 className="font-semibold text-gray-900">배송 정보</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {product.shipping_vendor_id && (
              <div>
                <span className="text-gray-600 font-medium">벤더사:</span>
                <span className="ml-2 text-gray-900">{product.shipping_vendor_id}</span>
              </div>
            )}
            {product.shipping_entity && (
              <div>
                <span className="text-gray-600 font-medium">출고:</span>
                <span className="ml-2 text-gray-900">{product.shipping_entity}</span>
              </div>
            )}
            {product.invoice_entity && (
              <div>
                <span className="text-gray-600 font-medium">송장:</span>
                <span className="ml-2 text-gray-900">{product.invoice_entity}</span>
              </div>
            )}
            {product.shipping_cost && (
              <div>
                <span className="text-gray-600 font-medium">출고비용:</span>
                <span className="ml-2 text-gray-900">{formatPrice(product.shipping_cost)}</span>
              </div>
            )}
          </div>
        </div>

        {/* 발송지 정보 */}
        {(product.shipping_location_name || product.shipping_location_address || product.shipping_location_contact) && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-5 h-5 text-gray-700" />
              <h4 className="font-semibold text-gray-900">발송지 정보</h4>
            </div>
            <div className="space-y-2 text-sm">
              {product.shipping_location_name && (
                <div>
                  <span className="text-gray-600 font-medium">발송지명:</span>
                  <span className="ml-2 text-gray-900">{product.shipping_location_name}</span>
                </div>
              )}
              {product.shipping_location_address && (
                <div>
                  <span className="text-gray-600 font-medium">주소:</span>
                  <span className="ml-2 text-gray-900">{product.shipping_location_address}</span>
                </div>
              )}
              {product.shipping_location_contact && (
                <div>
                  <span className="text-gray-600 font-medium">연락처:</span>
                  <span className="ml-2 text-gray-900">{product.shipping_location_contact}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 등록/수정 정보 */}
        <div className="text-xs text-gray-500 space-y-1">
          {product.created_at && (
            <div>등록일: {formatDateTime(product.created_at)}</div>
          )}
          {product.updated_at && (
            <div>수정일: {formatDateTime(product.updated_at)}</div>
          )}
        </div>
      </div>
    </Modal>
  );
}
