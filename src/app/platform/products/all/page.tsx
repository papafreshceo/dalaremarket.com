'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Grid, List, TrendingUp, Calendar, Package, ChevronDown, ChevronUp, Image, FileImage, Eye, Search } from 'lucide-react';
import ProductCard from './components/ProductCard';
import ProductGrid from './components/ProductGrid';
import ProductDetailModal from './components/ProductDetailModal';
import PriceChartModal from './components/PriceChartModal';
import ImageGalleryModal from './components/ImageGalleryModal';
import SeasonBand from './components/SeasonBand';

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

export default function AllProductsPage() {
  const [products, setProducts] = useState<OptionProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'thumbnail'>('grid');
  const [selectedProduct, setSelectedProduct] = useState<OptionProduct | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPriceChart, setShowPriceChart] = useState(false);
  const [priceChartProduct, setPriceChartProduct] = useState<OptionProduct | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory2, setSelectedCategory2] = useState<string>('all'); // 카테고리2 필터
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [supplyStatuses, setSupplyStatuses] = useState<Array<{code: string; name: string; color: string; display_order: number}>>([]);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [selectedImageCategory, setSelectedImageCategory] = useState<{category4: string; category4Id?: number} | null>(null);
  const [categoryImageMap, setCategoryImageMap] = useState<Map<string, string>>(new Map());

  const supabase = createClient();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      // API를 통해 한 번에 조회 (View 사용)
      const response = await fetch('/api/products/all');
      const { success, products: fetchedProducts, supplyStatuses: fetchedStatuses, error } = await response.json();

      if (!success) {
        console.error('상품 조회 오류:', error);
        return;
      }

      // 품목별 대표이미지 맵핑 (카드보기용)
      const newCategoryImageMap = new Map(
        (fetchedProducts || [])
          .filter((p: any) => p.category_4 && p.category_thumbnail_url)
          .map((p: any) => [p.category_4, p.category_thumbnail_url])
      );

      setCategoryImageMap(newCategoryImageMap);
      setProducts(fetchedProducts || []);
      setSupplyStatuses(fetchedStatuses || []);

      console.log('🎯 상품 로딩 완료:', {
        count: fetchedProducts?.length || 0,
        sample: fetchedProducts?.[0]
      });

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

  // 카테고리2 필터링 적용
  const filteredProducts = products.filter(product => {
    // 검색어 필터 (옵션명, 코드, 소분류, 품목명으로 검색)
    const matchesSearch = searchTerm === '' ||
      product.option_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.option_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product as any).category_3?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product as any).category_4?.toLowerCase().includes(searchTerm.toLowerCase());

    // 카테고리2 필터
    const matchesCategory = selectedCategory2 === 'all' ||
      (product as any).category_2 === selectedCategory2;

    return matchesSearch && matchesCategory;
  });

  // 카테고리2 목록 추출 (중복 제거)
  const category2List = Array.from(new Set(
    products
      .map(p => (p as any).category_2)
      .filter(Boolean)
      .sort()
  ));

  const toggleGroup = (itemName: string) => {
    // 같은 카드를 다시 클릭하면 닫기, 다른 카드 클릭하면 그 카드만 열기
    if (expandedGroups.has(itemName)) {
      setExpandedGroups(new Set());
    } else {
      setExpandedGroups(new Set([itemName]));
    }
  };

  const toggleAllGroups = (groupKeys: string[]) => {
    if (expandedGroups.size === groupKeys.length) {
      setExpandedGroups(new Set());
    } else {
      setExpandedGroups(new Set(groupKeys));
    }
  };

  return (
    <div style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        overflow: 'visible'
      }}>
        {/* 메인 그라데이션 - 상단 흰색 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 200px, #f0f9ff 400px, #e0f2fe 600px, #dbeafe 800px, #dbeafe 1000px)',
        zIndex: -3
      }} />

      {/* 왼쪽 연두색 */}
      <div style={{
        position: 'absolute',
        top: '400px',
        left: 0,
        width: '600px',
        height: '400px',
        background: 'radial-gradient(ellipse at 0% 50%, rgba(187, 247, 208, 0.15) 0%, transparent 60%)',
        zIndex: -2
      }} />

      {/* 우측 상단 보라색 - 상단 흰색 */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '1600px',
        height: '1200px',
        background: 'radial-gradient(ellipse at 100% 0%, rgba(255, 255, 255, 0) 0%, rgba(139, 92, 246, 0.08) 20%, rgba(139, 92, 246, 0.15) 40%, transparent 60%)',
        zIndex: -1
      }} />

      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-[35px] md:top-[70px] z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* 카테고리2 필터 */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedCategory2('all')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                selectedCategory2 === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              전체
            </button>
            {category2List.map((category2) => (
              <button
                key={category2}
                onClick={() => setSelectedCategory2(category2)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  selectedCategory2 === category2
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category2}
              </button>
            ))}

            {/* 상태별 통계 배지 */}
            <div className="ml-4 flex items-center gap-2">
              {(() => {
                // 품목별로 중복 제거 후 상태별 개수 계산
                const uniqueCategories = new Map<string, string>();
                filteredProducts.forEach(p => {
                  const category4 = (p as any).category_4;
                  const status = (p as any).category_supply_status;
                  if (category4 && !uniqueCategories.has(category4)) {
                    uniqueCategories.set(category4, status);
                  }
                });

                const statusCounts = new Map<string, number>();
                uniqueCategories.forEach(status => {
                  if (status) {
                    statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
                  }
                });

                return supplyStatuses
                  .filter(status => statusCounts.has(status.name))
                  .map(status => (
                    <span
                      key={status.code}
                      className="px-3 py-1 text-sm font-medium rounded border inline-flex items-center justify-center"
                      style={{
                        borderColor: status.color,
                        color: status.color,
                        minWidth: '40px'
                      }}
                    >
                      {statusCounts.get(status.name)}
                    </span>
                  ));
              })()}
            </div>

            {/* 검색 및 보기 전환 */}
            <div className="ml-auto flex items-center gap-3">
              {/* 검색 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="상품명 검색.."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-64"
                />
              </div>

              {/* 보기 전환 버튼 */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('thumbnail')}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === 'thumbnail'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="썸네일 보기"
                >
                  <Grid className="w-5 h-5" strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="그리드 보기"
                >
                  <List className="w-5 h-5" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="space-y-4">
            {/* 스켈레톤 카드 */}
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="animate-pulse bg-white rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-center gap-4">
                  {/* 썸네일 스켈레톤 */}
                  <div className="w-16 h-16 bg-gray-200 rounded"></div>

                  {/* 정보 스켈레톤 */}
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>

                  {/* 가격 스켈레톤 */}
                  <div className="space-y-2">
                    <div className="h-6 bg-gray-200 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </div>

                  {/* 버튼 스켈레톤 */}
                  <div className="flex gap-2">
                    <div className="w-8 h-8 bg-gray-200 rounded"></div>
                    <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
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
        ) : viewMode === 'thumbnail' ? (
          // 품목별 썸네일 카드 - 상태별 그룹화
          <div className="space-y-8">
            {(() => {
              // 먼저 품목별로 그룹화
              const itemGroups = Object.entries(
                filteredProducts.reduce((groups, product) => {
                  const itemName = product.category_4 || '기타';
                  if (!groups[itemName]) {
                    groups[itemName] = [];
                  }
                  groups[itemName].push(product);
                  return groups;
                }, {} as Record<string, OptionProduct[]>)
              );

              // 상태별로 품목 그룹화
              const statusGroups = itemGroups.reduce((groups, [itemName, products]) => {
                const categoryStatus = (products[0] as any).category_supply_status || '기타';
                if (!groups[categoryStatus]) {
                  groups[categoryStatus] = [];
                }
                groups[categoryStatus].push([itemName, products]);
                return groups;
              }, {} as Record<string, [string, OptionProduct[]][]>);

              // 상태별로 정렬 (display_order 기준)
              const sortedStatusGroups = Object.entries(statusGroups).sort(([statusA], [statusB]) => {
                const statusInfoA = supplyStatuses.find(s => s.name === statusA);
                const statusInfoB = supplyStatuses.find(s => s.name === statusB);
                const orderA = statusInfoA?.display_order ?? 999;
                const orderB = statusInfoB?.display_order ?? 999;
                return orderA - orderB;
              });

              return sortedStatusGroups.map(([statusName, items]) => {
                const statusInfo = supplyStatuses.find(s => s.name === statusName);

                // 각 상태 내에서 품목들을 정렬
                const sortedItems = items.sort(([itemNameA, productsA], [itemNameB, productsB]) => {
                  // 카테고리3 (소분류) 가나다 순
                  const category3A = (productsA[0] as any).category_3 || '';
                  const category3B = (productsB[0] as any).category_3 || '';
                  const category3Diff = category3A.localeCompare(category3B, 'ko');
                  if (category3Diff !== 0) return category3Diff;

                  // 카테고리4 (품목) 가나다 순
                  return itemNameA.localeCompare(itemNameB, 'ko');
                });

                return (
                  <div
                    key={statusName}
                    className="rounded-xl p-6 shadow-md"
                    style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                      border: `2px solid ${statusInfo?.color || '#ccc'}20`
                    }}
                  >
                    {/* 상태 헤더 */}
                    <div
                      className="flex items-center gap-3 mb-5 px-4 py-3 rounded-lg"
                      style={{
                        background: `${statusInfo?.color || '#ccc'}15`,
                        borderLeft: `4px solid ${statusInfo?.color || '#ccc'}`
                      }}
                    >
                      <h2 className="text-lg font-bold" style={{ color: statusInfo?.color || '#333' }}>
                        {statusName}
                      </h2>
                      <span className="text-sm font-medium text-gray-600">
                        {sortedItems.length}개 품목
                      </span>
                    </div>

                    {/* 상태별 품목 그리드 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {(() => {
                        // 4개씩 chunk로 나누기
                        const chunkSize = 4;
                        const chunks: [string, OptionProduct[]][][] = [];
                        for (let i = 0; i < sortedItems.length; i += chunkSize) {
                          chunks.push(sortedItems.slice(i, i + chunkSize));
                        }

                        return chunks.map((chunk, chunkIndex) => (
                          <React.Fragment key={`chunk-${chunkIndex}`}>
                            {/* 먼저 이 chunk의 모든 카드 렌더링 */}
                            {chunk.map(([itemName, groupProducts]) => {
                              const category3 = (groupProducts[0] as any).category_3 || '';
                              const category4 = itemName;
                              const categoryStatus = (groupProducts[0] as any).category_supply_status;
                              const isShipping = categoryStatus === '출하중';
                              const isExpanded = expandedGroups.has(itemName);

                              return (
                                <div key={itemName} className="col-span-1 flex">
                              <div
                                className={`rounded-lg transition-all duration-300 ease-out p-4 flex flex-col gap-3 cursor-pointer hover:shadow-lg w-full ${
                                  isExpanded ? 'scale-105' : ''
                                }`}
                                style={isShipping ? {
                                  background: '#ffffff',
                                  border: isExpanded ? '2px solid #ffc0cb' : '1px solid #ffc0cb',
                                  boxShadow: isExpanded
                                    ? '0 10px 25px rgba(255, 192, 203, 0.5), 8px 8px 0 rgba(16, 185, 129, 0.3)'
                                    : '0 1px 3px rgba(0, 0, 0, 0.1), 8px 8px 0 rgba(16, 185, 129, 0.3)',
                                  transform: isExpanded ? 'translateY(-4px)' : undefined
                                } : {
                                  background: isExpanded ? '#ffffff' : '#f3f4f6',
                                  border: isExpanded ? '2px solid #d1d5db' : '1px solid #d1d5db',
                                  boxShadow: isExpanded
                                    ? '0 10px 25px rgba(209, 213, 219, 0.5)'
                                    : '0 1px 3px rgba(0, 0, 0, 0.1)',
                                  opacity: 1,
                                  transform: isExpanded ? 'translateY(-4px)' : undefined
                                }}
                                onClick={() => toggleGroup(itemName)}
                              >
                                {/* 품목 대표이미지 */}
                                {(() => {
                                  const categoryThumbnail = categoryImageMap.get(itemName);
                                  if (categoryThumbnail) {
                                    return (
                                      <img
                                        src={categoryThumbnail}
                                        alt={itemName}
                                        className="w-full aspect-square object-cover rounded-lg"
                                      />
                                    );
                                  }
                                  return (
                                    <div className="w-full aspect-square rounded-lg bg-gray-200 flex items-center justify-center">
                                      <Package className="w-16 h-16 text-gray-400" />
                                    </div>
                                  );
                                })()}

                                {/* 품목 정보 */}
                                <div className="flex flex-col gap-2">
                                <div>
                                  <h3 className="font-semibold text-gray-900 text-base">
                                    {category3 && (
                                      <span className="text-xs font-normal text-gray-600">{category3}/ </span>
                                    )}
                                    {category4}
                                  </h3>
                                  <p className="text-xs text-gray-500">{groupProducts.length}개 옵션상품</p>
                                </div>

                                {/* 시즌밴드 */}
                                <SeasonBand
                                  seasonStart={(groupProducts[0] as any).season_start_date}
                                  seasonEnd={(groupProducts[0] as any).season_end_date}
                                />

                                {/* 배지들 */}
                                <div className="flex flex-wrap items-center gap-1">
                                  {(groupProducts[0] as any).is_best && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-normal border border-gray-400 text-gray-600 rounded">
                                      BEST
                                    </span>
                                  )}
                                  {(groupProducts[0] as any).is_recommended && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-normal border border-gray-400 text-gray-600 rounded">
                                      추천
                                    </span>
                                  )}

                                  {/* 상태 배지 */}
                                  {(() => {
                                    const statusInfo = supplyStatuses.find(s => s.name === categoryStatus);
                                    if (!statusInfo) return null;
                                    return (
                                      <span
                                        className="px-1.5 py-0.5 text-[10px] font-normal border rounded"
                                        style={{
                                          borderColor: statusInfo.color,
                                          color: statusInfo.color
                                        }}
                                      >
                                        {statusInfo.name}
                                      </span>
                                    );
                                  })()}

                                  {/* 이미지 아이콘들 */}
                                  {(groupProducts[0] as any).has_image && (
                                    <div
                                      className="text-gray-600 cursor-pointer hover:text-gray-800 transition-colors"
                                      title="전체 이미지 보기"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const firstProduct = groupProducts[0] as any;
                                        setSelectedImageCategory({
                                          category4: itemName,
                                          category4Id: firstProduct.category_4_id
                                        });
                                        setShowImageGallery(true);
                                      }}
                                    >
                                      <Image className="w-[26px] h-[26px]" strokeWidth={1} />
                                    </div>
                                  )}
                                  {(groupProducts[0] as any).has_detail_page && (
                                    <div
                                      className="text-blue-600 cursor-pointer hover:text-blue-800 transition-colors"
                                      title="전체 이미지 보기"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const firstProduct = groupProducts[0] as any;
                                        setSelectedImageCategory({
                                          category4: itemName,
                                          category4Id: firstProduct.category_4_id
                                        });
                                        setShowImageGallery(true);
                                      }}
                                    >
                                      <FileImage className="w-[26px] h-[26px]" strokeWidth={1} />
                                    </div>
                                  )}

                                  {/* 펼치기/접기 아이콘 */}
                                  <div className="ml-auto">
                                    {isExpanded ? (
                                      <ChevronUp className="w-5 h-5 text-gray-400" />
                                    ) : (
                                      <ChevronDown className="w-5 h-5 text-gray-400" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            </div>
                              );
                            })}

                            {/* chunk에서 펼쳐진 항목들의 옵션상품 렌더링 */}
                            {chunk.map(([itemName, groupProducts]) => {
                              const isExpanded = expandedGroups.has(itemName);
                              return isExpanded ? (
                                <div key={`${itemName}-options`} className="col-span-full">
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-4 bg-white rounded-lg border border-gray-200">
                                    {groupProducts.map((product) => (
                                      <div
                                        key={product.id}
                                        className="bg-gray-50 rounded-lg border border-gray-200 p-3 hover:shadow-md transition-all cursor-pointer flex flex-col gap-2"
                                        onClick={() => handleProductClick(product)}
                                      >
                                        {/* 옵션상품 썸네일 */}
                                        {product.thumbnail_url ? (
                                          <img
                                            src={product.thumbnail_url}
                                            alt={product.option_name}
                                            className="w-full aspect-square rounded object-cover"
                                          />
                                        ) : (
                                          <div className="w-full aspect-square rounded bg-gray-100 flex items-center justify-center">
                                            <Package className="w-8 h-8 text-gray-400" />
                                          </div>
                                        )}

                                        {/* 옵션상품 정보 */}
                                        <div className="flex flex-col gap-1">
                                          <h4 className="text-xs font-medium text-gray-900 truncate" title={product.option_name}>
                                            {product.option_name}
                                          </h4>
                                          <p className="text-xs font-semibold text-gray-900">
                                            {product.seller_supply_price?.toLocaleString() || '-'}원
                                          </p>
                                          {(product as any).spec_1 && (
                                            <p className="text-[10px] text-gray-500 truncate">
                                              {(product as any).spec_1}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : null;
                            })}
                          </React.Fragment>
                        ));
                      })()}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        ) : (
          // 품목별 그룹화 리스트 뷰 (카드보기와 동일한 형식)
          <div className="space-y-4">
            {(() => {
              const groupedData = Object.entries(
                filteredProducts.reduce((groups, product) => {
                  const itemName = product.category_4 || '기타';
                  if (!groups[itemName]) {
                    groups[itemName] = [];
                  }
                  groups[itemName].push(product);
                  return groups;
                }, {} as Record<string, OptionProduct[]>)
              ).sort(([itemNameA, productsA], [itemNameB, productsB]) => {
                // 1순위: 상태값 순서 (출하중 > 출하임박 > 시즌종료)
                const getOrder = (products: OptionProduct[]) => {
                  const rawMaterialStatus = (products[0] as any).category_supply_status;
                  if (!rawMaterialStatus) return 999;
                  const statusInfo = supplyStatuses.find(s => s.name === rawMaterialStatus);
                  return statusInfo?.display_order ?? 999;
                };
                const orderDiff = getOrder(productsA) - getOrder(productsB);
                if (orderDiff !== 0) return orderDiff;

                // 2순위: 카테고리3 (소분류) 가나다 순
                const category3A = (productsA[0] as any).category_3 || '';
                const category3B = (productsB[0] as any).category_3 || '';
                const category3Diff = category3A.localeCompare(category3B, 'ko');
                if (category3Diff !== 0) return category3Diff;

                // 3순위: 카테고리4 (품목) 가나다 순
                return itemNameA.localeCompare(itemNameB, 'ko');
              });

              const groupKeys = groupedData.map(([key]) => key);

              return (
                <>
                  {/* 전체 펼치기/접기 버튼 */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => toggleAllGroups(groupKeys)}
                      className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2"
                    >
                      {expandedGroups.size === groupKeys.length ? (
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

                  {groupedData.map(([itemName, groupProducts]) => {
                    const category3 = (groupProducts[0] as any).category_3 || '';
                    const category4 = itemName; // category_4 (품목)
                    const isExpanded = expandedGroups.has(itemName);

                    // 출하중 상태 확인
                    const categoryStatus = (groupProducts[0] as any).category_supply_status;
                    const isShipping = categoryStatus === '출하중';

                    return (
                      <div
                        key={itemName}
                        className="rounded-lg transition-all duration-300 ease-out"
                        style={isShipping ? {
                          background: '#ffffff',
                          border: '1px solid #ffc0cb',
                          borderRadius: '0.5rem',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 8px 8px 0 rgba(16, 185, 129, 0.3)',
                          position: 'relative' as const,
                          transform: 'scale(1)'
                        } : {
                          background: '#f3f4f6',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.5rem',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                          transform: 'scale(0.9)',
                          opacity: 0.85
                        }}
                        onMouseEnter={(e) => {
                          if (isShipping) {
                            e.currentTarget.style.transform = 'scale(1.02) translateY(-4px)';
                          } else {
                            e.currentTarget.style.transform = 'scale(0.92) translateY(-4px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (isShipping) {
                            e.currentTarget.style.transform = 'scale(1) translateY(0)';
                          } else {
                            e.currentTarget.style.transform = 'scale(0.9) translateY(0)';
                          }
                        }}
                      >
                        {/* 그룹 헤더 */}
                        <div
                          className={`px-6 py-2 transition-colors cursor-pointer overflow-visible relative ${
                            !isShipping ? 'hover:bg-gray-50' : ''
                          }`}
                          onClick={() => toggleGroup(itemName)}
                        >
                          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
                            {/* 왼쪽: 썸네일 + 품목정보 */}
                            <div className="flex items-center gap-3">
                              {/* 품목 대표이미지 썸네일 */}
                              {(() => {
                                const categoryThumbnail = categoryImageMap.get(itemName);
                                if (categoryThumbnail) {
                                  return (
                                    <img src={categoryThumbnail} alt={itemName} className="w-16 h-16 aspect-square rounded-lg object-cover flex-shrink-0" />
                                  );
                                }
                                return (
                                  <div className="w-16 h-16 aspect-square rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    <Package className="w-8 h-8 text-gray-400" />
                                  </div>
                                );
                              })()}
                              <div className="text-left">
                                <div className="flex items-baseline gap-2">
                                  <h3 className="font-semibold text-gray-900">
                                    {category3 && (
                                      <span style={{ fontSize: '13px', fontWeight: 'normal' }}>{category3}/ </span>
                                    )}
                                    <span style={{ fontSize: '18px' }}>{category4}</span>
                                  </h3>
                                  <p className="text-gray-500" style={{ fontSize: '13px' }}>{groupProducts.length}개 옵션상품</p>
                                </div>
                              </div>
                            </div>

                            {/* 중앙: 시즌밴드 */}
                            <div className="text-left flex items-center gap-6">
                              {/* 시즌밴드 */}
                              <div className="flex-1 max-w-xs">
                                <SeasonBand
                                  seasonStart={(groupProducts[0] as any).season_start_date}
                                  seasonEnd={(groupProducts[0] as any).season_end_date}
                                />
                              </div>
                            </div>

                            {/* 오른쪽: 배지 + 펼치기 버튼 */}
                            <div className="flex items-center gap-1.5">
                            {/* 배지 */}
                            <div className="flex items-center gap-1.5">
                              {(groupProducts[0] as any).is_best && (
                                <span className="px-1.5 py-0.5 text-[11px] font-normal border border-gray-400 text-gray-600 rounded">
                                  BEST
                                </span>
                              )}
                              {(groupProducts[0] as any).is_recommended && (
                                <span className="px-1.5 py-0.5 text-[11px] font-normal border border-gray-400 text-gray-600 rounded">
                                  추천
                                </span>
                              )}
                            </div>

                            {/* 상태별 배지 (품목 마스터 상태 표시) */}
                            {(() => {
                              const categoryStatus = (groupProducts[0] as any).category_supply_status;
                              if (!categoryStatus) return null;

                              const statusInfo = supplyStatuses.find(s => s.name === categoryStatus);
                              if (!statusInfo) return null;

                              return (
                                <span
                                  className="px-1.5 py-0.5 text-[11px] font-normal border rounded"
                                  style={{
                                    borderColor: statusInfo.color,
                                    color: statusInfo.color
                                  }}
                                >
                                  {statusInfo.name}
                                </span>
                              );
                            })()}

                            {/* 이미지 아이콘 */}
                            {(groupProducts[0] as any).has_image && (
                              <div
                                className="text-gray-600 cursor-pointer hover:text-gray-800 transition-colors"
                                title="전체 이미지 보기"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const firstProduct = groupProducts[0] as any;
                                  setSelectedImageCategory({
                                    category4: itemName,
                                    category4Id: firstProduct.category_4_id
                                  });
                                  setShowImageGallery(true);
                                }}
                              >
                                <Image className="w-[26px] h-[26px]" strokeWidth={1} />
                              </div>
                            )}
                            {/* 상세페이지 이미지 아이콘 */}
                            {(groupProducts[0] as any).has_detail_page && (
                              <div
                                className="text-blue-600 cursor-pointer hover:text-blue-800 transition-colors"
                                title="전체 이미지 보기"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const firstProduct = groupProducts[0] as any;
                                  setSelectedImageCategory({
                                    category4: itemName,
                                    category4Id: firstProduct.category_4_id
                                  });
                                  setShowImageGallery(true);
                                }}
                              >
                                <FileImage className="w-[26px] h-[26px]" strokeWidth={1} />
                              </div>
                            )}

                            {/* 펼치기/접기 아이콘 */}
                            <button
                              onClick={() => toggleGroup(itemName)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-gray-400" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                              )}
                            </button>
                            </div>
                          </div>
                        </div>

                        {/* 그룹 컨텐츠 - 테이블 형태 */}
                        {isExpanded && (
                          <div className="border-t border-gray-200 bg-gray-50">
                            <div className="divide-y divide-gray-200">
                              {groupProducts.map((product) => (
                                <div
                                  key={product.id}
                                  className="pl-20 pr-6 py-3 hover:bg-gray-100 transition-colors cursor-pointer flex items-center gap-4"
                                  onClick={() => handleProductClick(product)}
                                >
                                  {/* 썸네일 */}
                                  {product.thumbnail_url ? (
                                    <img
                                      src={product.thumbnail_url}
                                      alt={product.option_name}
                                      className="w-14 h-14 aspect-square rounded object-cover flex-shrink-0"
                                    />
                                  ) : (
                                    <div className="w-14 h-14 aspect-square rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                                      <Package className="w-7 h-7 text-gray-400" />
                                    </div>
                                  )}

                                  {/* 옵션명 */}
                                  <div className="w-48 flex-shrink-0">
                                    <h4 className="text-sm font-medium text-gray-900 truncate">
                                      {product.option_name}
                                    </h4>
                                  </div>

                                  {/* 규격1 */}
                                  <div className="w-24 flex-shrink-0 text-center">
                                    <p className="text-sm text-gray-700">
                                      {(product as any).spec_1 || '-'}
                                    </p>
                                  </div>

                                  {/* 규격2 */}
                                  <div className="w-24 flex-shrink-0 text-center">
                                    <p className="text-sm text-gray-700">
                                      {(product as any).spec_2 || '-'}
                                    </p>
                                  </div>

                                  {/* 규격3 */}
                                  <div className="w-24 flex-shrink-0 text-center">
                                    <p className="text-sm text-gray-700">
                                      {(product as any).spec_3 || '-'}
                                    </p>
                                  </div>

                                  {/* 셀러공급가 */}
                                  <div className="w-28 flex-shrink-0 text-right">
                                    <p className="text-sm font-semibold text-gray-900">
                                      {product.seller_supply_price?.toLocaleString() || '-'}원
                                    </p>
                                  </div>

                                  {/* 배송비 */}
                                  <div className="w-24 flex-shrink-0 text-right">
                                    <p className="text-sm text-gray-700">
                                      {product.shipping_cost != null ? `${product.shipping_cost.toLocaleString()}원` : '-'}
                                    </p>
                                  </div>

                                  {/* 가격차트 버튼 */}
                                  <div className="w-10 flex-shrink-0 flex justify-center">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleShowPriceChart(product);
                                      }}
                                      className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                                      title="가격 차트"
                                    >
                                      <TrendingUp className="w-4 h-4 text-blue-600" />
                                    </button>
                                  </div>

                                  {/* 상태 */}
                                  <div className="w-20 flex-shrink-0 flex justify-center">
                                    {(() => {
                                      const status = (product as any).status;
                                      if (!status) return <span className="text-xs text-gray-400">-</span>;

                                      const statusInfo = supplyStatuses.find(s => s.code === status);
                                      if (!statusInfo) return <span className="text-xs text-gray-400">-</span>;

                                      return (
                                        <span
                                          className="px-2 py-0.5 text-[10px] font-normal rounded-full text-white whitespace-nowrap"
                                          style={{ backgroundColor: statusInfo.color }}
                                        >
                                          {statusInfo.name}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              );
            })()}
          </div>
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

      {/* 이미지 갤러리 모달 */}
      {showImageGallery && selectedImageCategory && (
        <ImageGalleryModal
          isOpen={showImageGallery}
          onClose={() => {
            setShowImageGallery(false);
            setSelectedImageCategory(null);
          }}
          category4={selectedImageCategory.category4}
          category4Id={selectedImageCategory.category4Id}
        />
      )}
    </div>
  );
}
