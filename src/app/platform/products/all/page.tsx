'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Grid, List, TrendingUp, Calendar, Package, Layers, ChevronDown, ChevronUp } from 'lucide-react';
import ProductCard from './components/ProductCard';
import ProductGrid from './components/ProductGrid';
import ProductDetailModal from './components/ProductDetailModal';
import PriceChartModal from './components/PriceChartModal';

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
  발송지주소?: string;
  발송지연락처?: string;
  출고비용?: number;
  thumbnail_url?: string;
  created_at?: string;
  updated_at?: string;
}

export default function AllProductsPage() {
  const [products, setProducts] = useState<OptionProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'thumbnail'>('thumbnail');
  const [selectedProduct, setSelectedProduct] = useState<OptionProduct | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPriceChart, setShowPriceChart] = useState(false);
  const [priceChartProduct, setPriceChartProduct] = useState<OptionProduct | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupByItem, setGroupByItem] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const supabase = createClient();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('option_products')
        .select('*')
        .order('option_name', { ascending: true });

      if (error) {
        console.error('상품 조회 오류:', error);
        return;
      }

      setProducts(data || []);
    } catch (error) {
      console.error('상품 fetch 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (product: OptionProduct) => {
    setSelectedProduct(product);
    setShowDetailModal(true);
  };

  const handleShowPriceChart = (product: OptionProduct) => {
    setPriceChartProduct(product);
    setShowPriceChart(true);
  };

  const filteredProducts = products.filter(product =>
    product.option_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.option_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 품목별 그룹화
  const groupedProducts = filteredProducts.reduce((groups, product) => {
    const itemName = (product as any).item_name || '기타';
    if (!groups[itemName]) {
      groups[itemName] = [];
    }
    groups[itemName].push(product);
    return groups;
  }, {} as Record<string, OptionProduct[]>);

  const toggleGroup = (itemName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(itemName)) {
      newExpanded.delete(itemName);
    } else {
      newExpanded.add(itemName);
    }
    setExpandedGroups(newExpanded);
  };

  const toggleAllGroups = () => {
    if (expandedGroups.size === Object.keys(groupedProducts).length) {
      setExpandedGroups(new Set());
    } else {
      setExpandedGroups(new Set(Object.keys(groupedProducts)));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">전체 상품</h1>
              <p className="text-sm text-gray-500 mt-1">
                {filteredProducts.length}개의 옵션 상품
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* 검색 */}
              <input
                type="text"
                placeholder="상품명 또는 코드 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-full sm:w-64"
              />

              {/* 그룹화 토글 버튼 */}
              <button
                onClick={() => setGroupByItem(!groupByItem)}
                className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  groupByItem
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="품목별 그룹화"
              >
                <Layers className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">품목별 그룹화</span>
              </button>

              {/* 보기 전환 버튼 */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('thumbnail')}
                  className={`p-1 rounded transition-colors ${
                    viewMode === 'thumbnail'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="썸네일 보기"
                >
                  <Grid className="w-10 h-10" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1 rounded transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="그리드 보기"
                >
                  <List className="w-10 h-10" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">상품을 불러오는 중...</p>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? '검색 결과가 없습니다' : '등록된 상품이 없습니다'}
            </h3>
            <p className="text-gray-500">
              {searchTerm
                ? '다른 검색어로 시도해보세요'
                : '옵션 상품을 등록해주세요'}
            </p>
          </div>
        ) : groupByItem ? (
          // 품목별 그룹화 뷰
          <div className="space-y-4">
            {/* 전체 펼치기/접기 버튼 */}
            <div className="flex justify-end">
              <button
                onClick={toggleAllGroups}
                className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2"
              >
                {expandedGroups.size === Object.keys(groupedProducts).length ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    전체 접기
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    전체 펼치기
                  </>
                )}
              </button>
            </div>

            {Object.entries(groupedProducts).map(([itemName, groupProducts]) => (
              <div key={itemName} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* 그룹 헤더 */}
                <button
                  onClick={() => toggleGroup(itemName)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${expandedGroups.has(itemName) ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <Package className={`w-5 h-5 ${expandedGroups.has(itemName) ? 'text-blue-600' : 'text-gray-600'}`} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-gray-900">{itemName}</h3>
                      <p className="text-sm text-gray-500">{groupProducts.length}개 상품</p>
                    </div>
                  </div>
                  {expandedGroups.has(itemName) ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {/* 그룹 컨텐츠 */}
                {expandedGroups.has(itemName) && (
                  <div className="p-4 bg-gray-50 border-t border-gray-200">
                    {viewMode === 'thumbnail' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {groupProducts.map((product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            onProductClick={handleProductClick}
                            onShowPriceChart={handleShowPriceChart}
                          />
                        ))}
                      </div>
                    ) : (
                      <ProductGrid
                        products={groupProducts}
                        onProductClick={handleProductClick}
                        onShowPriceChart={handleShowPriceChart}
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : viewMode === 'thumbnail' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onProductClick={handleProductClick}
                onShowPriceChart={handleShowPriceChart}
              />
            ))}
          </div>
        ) : (
          <ProductGrid
            products={filteredProducts}
            onProductClick={handleProductClick}
            onShowPriceChart={handleShowPriceChart}
          />
        )}
      </div>

      {/* 상세보기 모달 */}
      {showDetailModal && selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedProduct(null);
          }}
          onShowPriceChart={() => {
            setShowDetailModal(false);
            handleShowPriceChart(selectedProduct);
          }}
        />
      )}

      {/* 가격 변동 그래프 모달 */}
      {showPriceChart && priceChartProduct && (
        <PriceChartModal
          product={priceChartProduct}
          onClose={() => {
            setShowPriceChart(false);
            setPriceChartProduct(null);
          }}
        />
      )}
    </div>
  );
}
