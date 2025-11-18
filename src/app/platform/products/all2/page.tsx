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
  const [cardOffsetTop, setCardOffsetTop] = useState(0);

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
    // 검색어 필터 (옵션상품, 코드, 소분류, 품목명으로 검색)
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
      setCardOffsetTop(0);
    } else {
      // 현재 스크롤 위치 저장
      const currentScrollY = window.scrollY;

      setExpandedGroups(new Set([itemName]));

      // 클릭한 카드의 위치 계산
      setTimeout(() => {
        const cardElement = document.getElementById(`product-card-${itemName}`);
        if (cardElement) {
          const cardHeight = cardElement.offsetHeight;
          const cardTop = cardElement.offsetTop;
          const containerElement = cardElement.parentElement;

          let offset = 0;

          if (containerElement) {
            // 옵션상품 개수 파악
            const groupedData = Object.entries(
              filteredProducts.reduce((groups, product) => {
                const itemName = product.category_4 || '기타';
                if (!groups[itemName]) groups[itemName] = [];
                groups[itemName].push(product);
                return groups;
              }, {} as Record<string, OptionProduct[]>)
            );

            const selectedGroup = groupedData.find(([name]) => name === itemName);
            const optionCount = selectedGroup ? selectedGroup[1].length : 0;

            // 옵션상품 전체 높이 계산
            const estimatedOptionHeight = 60 + (optionCount * 35) + 32;

            // 조건3: 선택한 품목카드 위치에서 카드 2개 높이만큼 위로
            let desiredOffset = cardTop - (cardHeight * 2);

            // 조건2: 갈색 컨테이너가 아래로 확장되지 않도록 최대 하단 위치 설정
            const viewportHeight = window.innerHeight;
            const headerHeight = window.innerWidth >= 768 ? 140 : 105;
            const maxBottomPosition = viewportHeight - headerHeight;

            // 조건1: 모든 옵션상품이 스크롤 없이 보이려면
            // (offset + 옵션상품높이) <= 최대하단위치
            // offset <= 최대하단위치 - 옵션상품높이
            const maxAllowedOffset = maxBottomPosition - estimatedOptionHeight;

            // 최종 offset: 품목카드 위치를 원하지만, 컨테이너가 아래로 확장되지 않도록 제한
            offset = Math.min(desiredOffset, maxAllowedOffset);
          }

          setCardOffsetTop(Math.max(0, offset));

          // 스크롤 위치 복원 (레이아웃 시프트 방지)
          requestAnimationFrame(() => {
            window.scrollTo(0, currentScrollY);
          });
        }
      }, 10);
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

      {/* Flex 컨테이너: 사이드바 + 메인 */}
      <div className="flex" style={{ border: '3px solid red' }}>
        {/* 왼쪽 사이드바 */}
        <div className="w-64 bg-white border-r border-gray-200 sticky top-[35px] md:top-[70px] h-[calc(100vh-35px)] md:h-[calc(100vh-70px)] overflow-y-auto flex-shrink-0" style={{ border: '3px solid blue' }}>
          <div className="p-4 space-y-6">
            {/* 카테고리2 필터 */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">카테고리</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory2('all')}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                    selectedCategory2 === 'all'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  전체
                </button>
                {category2List.map((category2) => (
                  <button
                    key={category2}
                    onClick={() => setSelectedCategory2(category2)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                      selectedCategory2 === category2
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {category2}
                  </button>
                ))}
              </div>
            </div>

            {/* 상태별 통계 */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">상태별 품목 수</h3>
              <div className="space-y-2">
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
                      <div
                        key={status.code}
                        className="flex items-center justify-between px-3 py-2 rounded-lg border"
                        style={{
                          borderColor: status.color,
                          backgroundColor: `${status.color}10`
                        }}
                      >
                        <span className="text-sm font-medium" style={{ color: status.color }}>
                          {status.name}
                        </span>
                        <span
                          className="px-2 py-0.5 text-sm font-bold rounded"
                          style={{
                            color: status.color,
                            backgroundColor: 'white'
                          }}
                        >
                          {statusCounts.get(status.name)}
                        </span>
                      </div>
                    ));
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽 메인 영역 */}
        <div className="flex-1 min-w-0" style={{ border: '3px solid green' }}>
          {/* 헤더 */}
          <div className="bg-white border-b border-gray-200 sticky top-[35px] md:top-[70px] z-50 shadow-sm" style={{ border: '3px solid orange' }}>
            <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
              {/* 검색 */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="상품명 검색.."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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

          {/* 컨텐츠 */}
          <div className="px-4 sm:px-6 lg:px-8 py-6" style={{ border: '3px solid purple' }}>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
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
                                className="rounded-lg transition-all duration-300 ease-out p-3 flex flex-col gap-2 cursor-pointer w-full"
                                style={{
                                  background: isExpanded ? '#ffffff' : (isShipping ? '#ffffff' : '#f3f4f6'),
                                  border: `1px solid ${isShipping ? '#ffc0cb' : '#d1d5db'}`
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
                                <div className="flex flex-col gap-1">
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
                                        className="bg-gray-50 rounded-lg border border-gray-200 p-3 transition-all cursor-pointer flex flex-col gap-2"
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
          <div className="flex gap-6">
            {/* 칼럼1: 품목 카드 */}
            <div className="flex-[8] space-y-0" style={{ border: '3px solid magenta' }}>
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
                        id={`product-card-${itemName}`}
                        className="transition-all duration-300 ease-out scroll-mt-[110px] md:scroll-mt-[145px]"
                        style={{
                          background: isShipping ? '#ffffff' : '#f3f4f6',
                          border: `1px solid ${isShipping ? '#ffc0cb' : '#d1d5db'}`
                        }}
                      >
                        {/* 그룹 헤더 */}
                        <div
                          className={`px-3 py-1.5 transition-colors cursor-pointer overflow-hidden relative ${
                            !isShipping ? 'hover:bg-gray-50' : ''
                          }`}
                          onClick={() => toggleGroup(itemName)}
                        >
                          <div className="grid items-center gap-1.5 min-w-0" style={{ gridTemplateColumns: 'minmax(40px, 48px) minmax(60px, 80px) minmax(80px, 120px) minmax(60px, 90px) minmax(100px, 220px) 1fr' }}>
                            {/* 썸네일 */}
                            {(() => {
                              const categoryThumbnail = categoryImageMap.get(itemName);
                              if (categoryThumbnail) {
                                return (
                                  <img src={categoryThumbnail} alt={itemName} className="w-full aspect-square rounded-lg object-cover" style={{ maxWidth: '48px' }} />
                                );
                              }
                              return (
                                <div className="w-full aspect-square rounded-lg bg-gray-100 flex items-center justify-center" style={{ maxWidth: '48px' }}>
                                  <Package className="w-5 h-5 text-gray-400" />
                                </div>
                              );
                            })()}

                            {/* 카테고리3 */}
                            <div className="text-[10px] text-gray-600 truncate min-w-0">
                              {category3 || '-'}
                            </div>

                            {/* 카테고리4 (품목) */}
                            <h3 className="font-semibold text-gray-900 text-xs truncate min-w-0">
                              {category4}
                            </h3>

                            {/* 옵션상품 개수 */}
                            <p className="text-[10px] text-gray-500 whitespace-nowrap">
                              {groupProducts.length}개 옵션
                            </p>

                            {/* 시즌밴드 */}
                            <div className="min-w-0 overflow-hidden w-full">
                              <SeasonBand
                                seasonStart={(groupProducts[0] as any).season_start_date}
                                seasonEnd={(groupProducts[0] as any).season_end_date}
                              />
                            </div>

                            {/* 배지 + 펼치기 버튼 */}
                            <div className="flex items-center gap-1 justify-end overflow-hidden min-w-0">
                            {/* 배지 */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {(groupProducts[0] as any).is_best && (
                                <span className="px-1.5 py-0.5 text-[9px] font-normal border border-gray-400 text-gray-600 rounded whitespace-nowrap">
                                  BEST
                                </span>
                              )}
                              {(groupProducts[0] as any).is_recommended && (
                                <span className="px-1.5 py-0.5 text-[9px] font-normal border border-gray-400 text-gray-600 rounded whitespace-nowrap">
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
                                  className="px-1.5 py-0.5 text-[9px] font-normal border rounded whitespace-nowrap flex-shrink-0"
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
                      </div>
                    );
                  })}
                </>
              );
            })()}
            </div>

            {/* 칼럼2: 선택된 품목의 옵션상품 표시 */}
            <div
              className="flex-[7] self-start"
              style={{
                border: '3px solid yellow',
                backgroundColor: 'rgba(255, 255, 0, 0.05)',
                paddingTop: `${cardOffsetTop}px`
              }}
            >
              <div
                key={Array.from(expandedGroups)[0] || 'empty'}
                className="overflow-visible"
                style={{
                  animation: 'slideInFromLeft 0.4s ease-out'
                }}
              >
                <style jsx>{`
                  @keyframes slideInFromLeft {
                    from {
                      opacity: 0;
                      transform: translateX(-30px);
                    }
                    to {
                      opacity: 1;
                      transform: translateX(0);
                    }
                  }
                `}</style>
              {(() => {
                // 선택된 품목 찾기
                const expandedItem = Array.from(expandedGroups)[0];
                if (!expandedItem) {
                  return (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <div className="text-center">
                        <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-sm">품목 카드를 클릭하여 옵션상품을 확인하세요</p>
                      </div>
                    </div>
                  );
                }

                // groupedData에서 해당 품목의 옵션상품 찾기
                const groupedData = Object.entries(
                  filteredProducts.reduce((groups, product) => {
                    const itemName = product.category_4 || '기타';
                    if (!groups[itemName]) {
                      groups[itemName] = [];
                    }
                    groups[itemName].push(product);
                    return groups;
                  }, {} as Record<string, OptionProduct[]>)
                );

                const selectedGroup = groupedData.find(([itemName]) => itemName === expandedItem);
                if (!selectedGroup) return null;

                const [itemName, groupProducts] = selectedGroup;

                return (
                  <div className="p-4">
                    {/* 헤더 */}
                    <div className="mb-3 pb-2 border-b border-gray-200 flex items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-900 truncate">{itemName}</h3>
                      <span className="text-xs text-gray-500 whitespace-nowrap">{groupProducts.length}개 옵션상품</span>
                    </div>

                    {/* 옵션상품 그리드 테이블 */}
                    <div className="space-y-0">
                      {groupProducts.map((product) => (
                        <div
                          key={product.id}
                          className="bg-white border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer overflow-hidden"
                          onClick={() => handleProductClick(product)}
                        >
                          <div className="grid items-center gap-1.5 px-2 py-1" style={{ gridTemplateColumns: 'minmax(35px, 40px) minmax(100px, 1fr) minmax(45px, 60px) minmax(45px, 60px) minmax(45px, 60px) minmax(60px, 80px) minmax(45px, 60px) minmax(70px, 90px)' }}>
                            {/* 썸네일 */}
                            {product.thumbnail_url ? (
                              <img
                                src={product.thumbnail_url}
                                alt={product.option_name}
                                className="w-full aspect-square rounded object-cover"
                                style={{ maxWidth: '40px' }}
                              />
                            ) : (
                              <div className="w-full aspect-square rounded bg-gray-100 flex items-center justify-center" style={{ maxWidth: '40px' }}>
                                <Package className="w-4 h-4 text-gray-400" />
                              </div>
                            )}

                            {/* 옵션명 */}
                            <div className="text-xs font-medium text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap min-w-0">
                              {product.option_name}
                            </div>

                            {/* 규격1 */}
                            <div className="text-[10px] text-gray-600 text-center truncate min-w-0">
                              {(product as any).spec_1 || '-'}
                            </div>

                            {/* 규격2 */}
                            <div className="text-[10px] text-gray-600 text-center truncate min-w-0">
                              {(product as any).spec_2 || '-'}
                            </div>

                            {/* 규격3 */}
                            <div className="text-[10px] text-gray-600 text-center truncate min-w-0">
                              {(product as any).spec_3 || '-'}
                            </div>

                            {/* 공급가 */}
                            <div className="text-xs font-semibold text-gray-900 text-right truncate min-w-0">
                              {product.seller_supply_price?.toLocaleString() || '-'}원
                            </div>

                            {/* 배송비 */}
                            <div className="text-[10px] text-gray-600 text-right truncate min-w-0">
                              {product.shipping_cost != null ? `${product.shipping_cost.toLocaleString()}원` : '-'}
                            </div>

                            {/* 상태 & 버튼 */}
                            <div className="flex items-center justify-end gap-1 flex-shrink-0">
                              {(() => {
                                const status = (product as any).status;
                                const statusInfo = supplyStatuses.find(s => s.code === status);
                                return statusInfo ? (
                                  <span
                                    className="px-1.5 py-0.5 text-[9px] font-medium rounded-full text-white whitespace-nowrap"
                                    style={{ backgroundColor: statusInfo.color }}
                                  >
                                    {statusInfo.name}
                                  </span>
                                ) : null;
                              })()}

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShowPriceChart(product);
                                }}
                                className="p-0.5 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                                title="가격 차트"
                              >
                                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
              </div>
            </div>

            {/* 칼럼3: 새로운 칼럼 */}
            <div className="flex-[5] sticky top-[105px] md:top-[140px] h-[calc(100vh-105px)] md:h-[calc(100vh-140px)] overflow-y-auto self-start" style={{ border: '3px solid lime', backgroundColor: 'rgba(0, 255, 0, 0.05)' }}>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">칼럼 3</h3>
                <p className="text-sm text-gray-500">여기에 원하는 컨텐츠를 추가하세요</p>
              </div>
            </div>
          </div>
        )}
          </div>
        </div>
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
