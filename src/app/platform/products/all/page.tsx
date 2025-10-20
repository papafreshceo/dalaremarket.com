'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Grid, List, TrendingUp, Calendar, Package, ChevronDown, ChevronUp } from 'lucide-react';
import ProductCard from './components/ProductCard';
import ProductGrid from './components/ProductGrid';
import ProductDetailModal from './components/ProductDetailModal';
import PriceChartModal from './components/PriceChartModal';
import ImageGalleryModal from './components/ImageGalleryModal';

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
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [supplyStatuses, setSupplyStatuses] = useState<Array<{code: string; name: string; color: string; display_order: number}>>([]);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [selectedImageCategory, setSelectedImageCategory] = useState<{category4: string; category4Id?: number} | null>(null);
  const [categoryImageMap, setCategoryImageMap] = useState<Map<string, string>>(new Map());

  const supabase = createClient();

  useEffect(() => {
    fetchProducts();
    fetchSupplyStatuses();
  }, []);

  const fetchSupplyStatuses = async () => {
    const { data } = await supabase
      .from('supply_status_settings')
      .select('code, name, color, display_order')
      .eq('status_type', 'raw_material') // 품목의 원물상태 표시
      .eq('is_active', true)
      .order('display_order');

    if (data) {
      setSupplyStatuses(data);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);

      // 1. option_products 조회
      const { data: optionProducts, error: opError } = await supabase
        .from('option_products')
        .select('*')
        .order('option_name', { ascending: true });

      if (opError) {
        console.error('상품 조회 오류:', opError);
        return;
      }

      // 2. products_master 조회 (품목 정보 + 공급상태 + 셀러공급여부 + 배지정보 + 발송기한)
      const { data: productsMaster, error: masterError } = await supabase
        .from('products_master')
        .select('id, category_1, category_2, category_3, supply_status, seller_supply, is_best, is_recommended, has_image, has_detail_page, shipping_deadline')
        .eq('is_active', true)
        .eq('seller_supply', true) // 셀러공급 품목만 조회
        .not('category_3', 'is', null); // category_3(품목)가 있는 것만

      if (masterError) {
        console.error('품목 마스터 조회 오류:', masterError);
      }

      // 품목 마스터 ID -> 품목정보 맵핑 (product_master_id로 매칭)
      const categoryMap = new Map(
        (productsMaster || []).map(pm => [pm.id, {
          id: pm.id,
          category_1: pm.category_1,
          category_2: pm.category_2,
          category_3: pm.category_3,
          supply_status: pm.supply_status,
          is_best: pm.is_best,
          is_recommended: pm.is_recommended,
          has_image: pm.has_image,
          has_detail_page: pm.has_detail_page,
          shipping_deadline: pm.shipping_deadline
        }])
      );

      // 품목 마스터 ID -> 품목명 맵핑 (대표이미지 매핑용)
      const categoryIdToNameMap = new Map(
        (productsMaster || []).map(pm => [pm.id, pm.category_3])
      );

      // 3. 대표이미지 조회 (옵션상품 기준 + 품목 기준)
      const { data: representativeImages, error: imgError } = await supabase
        .from('cloudinary_images')
        .select('option_product_id, category_4_id, secure_url, is_representative')
        .eq('is_representative', true);

      if (imgError) {
        console.error('대표이미지 조회 오류:', imgError);
      }

      // 4. 옵션상품별 대표이미지 맵핑 (option_product_id 기준)
      const optionImageMap = new Map(
        (representativeImages || [])
          .filter(img => img.option_product_id)
          .map(img => [img.option_product_id, img.secure_url])
      );

      // 5. 품목별 대표이미지 맵핑 (category_4_id -> category_4 이름으로 변환)
      const newCategoryImageMap = new Map(
        (representativeImages || [])
          .filter(img => img.category_4_id)
          .map(img => {
            const categoryName = categoryIdToNameMap.get(img.category_4_id);
            return [categoryName, img.secure_url];
          })
          .filter(([categoryName]) => categoryName) // 품목명이 있는 것만
      );

      // 상태로 저장 (카드보기에서 품목 썸네일 표시용)
      setCategoryImageMap(newCategoryImageMap);

      // 6. 대표이미지 URL을 thumbnail_url로 매핑 및 셀러공급 필터링
      // 우선순위: 1) 옵션상품 대표이미지 2) 품목 대표이미지
      // 필터링 조건: 품목의 seller_supply=true AND 옵션상품의 seller_supply=true
      const productsWithThumbnail = (optionProducts || [])
        .map(product => {
          // 옵션상품의 product_master_id로 품목 마스터 정보 찾기
          const categoryInfo = categoryMap.get(product.product_master_id);
          const categoryId = categoryInfo?.id;

          // 썸네일 우선순위: 옵션상품 대표이미지 > 품목 대표이미지
          const thumbnailUrl = optionImageMap.get(product.id) ||
            (categoryId ? newCategoryImageMap.get(categoryId) : null) || null;

          return {
            ...product,
            thumbnail_url: thumbnailUrl,
            // 품목의 공급상태 및 소분류 추가
            category_supply_status: categoryInfo?.supply_status || null,
            category_2: categoryInfo?.category_2 || null,
            category_seller_supply: !!categoryInfo, // 품목의 셀러공급 여부
            category_4_id: categoryId, // 품목 마스터 ID 추가
            // 배지 정보 추가
            is_best: categoryInfo?.is_best || false,
            is_recommended: categoryInfo?.is_recommended || false,
            has_image: categoryInfo?.has_image || false,
            has_detail_page: categoryInfo?.has_detail_page || false,
            // 발송기한 추가 (임시: 데이터 없으면 3일로 설정)
            shipping_deadline: categoryInfo?.shipping_deadline || 3
          };
        })
        .filter(product => {
          // 품목의 seller_supply=true AND 옵션상품의 is_seller_supply=true 인 경우만 표시
          const categorySupply = product.category_seller_supply;
          const optionSupply = product.is_seller_supply !== false; // is_seller_supply가 명시적으로 false가 아닌 경우
          return categorySupply && optionSupply;
        });

      console.log('조회된 상품 수:', productsWithThumbnail.length);
      console.log('옵션상품 대표이미지 수:', optionImageMap.size);
      console.log('품목 대표이미지 수:', categoryImageMap.size);
      console.log('샘플 상품:', {
        option_name: productsWithThumbnail[0]?.option_name,
        category_3: productsWithThumbnail[0]?.category_3,
        product_master_id: productsWithThumbnail[0]?.product_master_id,
        thumbnail_url: productsWithThumbnail[0]?.thumbnail_url,
        shipping_deadline: productsWithThumbnail[0]?.shipping_deadline
      });

      setProducts(productsWithThumbnail);
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

  const toggleGroup = (itemName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(itemName)) {
      newExpanded.delete(itemName);
    } else {
      newExpanded.add(itemName);
    }
    setExpandedGroups(newExpanded);
  };

  const toggleAllGroups = (groupKeys: string[]) => {
    if (expandedGroups.size === groupKeys.length) {
      setExpandedGroups(new Set());
    } else {
      setExpandedGroups(new Set(groupKeys));
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
        ) : viewMode === 'thumbnail' ? (
          // 품목별 그룹화 카드 뷰
          <div className="space-y-4">
            {(() => {
              const groupedData = Object.entries(
                filteredProducts.reduce((groups, product) => {
                  const itemName = product.category_3 || '기타'; // 품목명으로 그룹핑
                  if (!groups[itemName]) {
                    groups[itemName] = [];
                  }
                  groups[itemName].push(product);
                  return groups;
                }, {} as Record<string, OptionProduct[]>)
              ).sort(([, productsA], [, productsB]) => {
                // 첫 번째 정렬: 상태값 순서
                const getOrder = (products: OptionProduct[]) => {
                  const rawMaterialStatus = (products[0] as any).category_supply_status;
                  if (!rawMaterialStatus) return 999;
                  // name으로 비교
                  const statusInfo = supplyStatuses.find(s => s.name === rawMaterialStatus);
                  return statusInfo?.display_order ?? 999;
                };
                const orderDiff = getOrder(productsA) - getOrder(productsB);

                // 상태값이 같으면 두 번째 정렬: 소분류(category_2) 가나다 순
                if (orderDiff === 0) {
                  const category2A = (productsA[0] as any).category_2 || '';
                  const category2B = (productsB[0] as any).category_2 || '';
                  return category2A.localeCompare(category2B, 'ko');
                }

                return orderDiff;
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
                    const category2 = (groupProducts[0] as any).category_2 || '';
                    const displayTitle = category2 ? `${category2}/${itemName}` : itemName;
                    const isExpanded = expandedGroups.has(itemName);

                    // 출하중 상태 확인
                    const categoryStatus = (groupProducts[0] as any).category_supply_status;
                    const isShipping = categoryStatus === '출하중';

                    // 배지 디버깅
                    const firstProduct = groupProducts[0] as any;
                    console.log(`품목 "${itemName}" 배지:`, {
                      is_best: firstProduct.is_best,
                      is_recommended: firstProduct.is_recommended,
                      has_image: firstProduct.has_image,
                      has_detail_page: firstProduct.has_detail_page
                    });

                    return (
                      <div
                        key={itemName}
                        className={`bg-white rounded-lg shadow-sm overflow-hidden ${
                          isShipping ? 'animate-shipping' : 'border border-gray-200'
                        }`}
                      >
                        {/* 그룹 헤더 */}
                        <div className="px-6 py-2 hover:bg-gray-50 transition-colors">
                          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
                            {/* 왼쪽: 썸네일 + 품목정보 */}
                            <button
                              onClick={() => toggleGroup(itemName)}
                              className="flex items-center gap-3"
                            >
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
                                  <h3 className="font-semibold text-gray-900" style={{ fontSize: '18px' }}>{displayTitle}</h3>
                                  <p className="text-gray-500" style={{ fontSize: '13px' }}>{groupProducts.length}개 옵션상품</p>
                                </div>
                              </div>
                            </button>

                            {/* 중앙: 발송기한 */}
                            <div className="text-left">
                              {(() => {
                                const shippingDeadline = (groupProducts[0] as any).shipping_deadline;
                                if (shippingDeadline) {
                                  return (
                                    <div className="text-gray-600" style={{ fontSize: '13px' }}>
                                      발송기한 <span className="font-medium">{shippingDeadline}일</span>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>

                            {/* 오른쪽: 배지 + 펼치기 버튼 */}
                            <div className="flex items-center gap-3">
                            {/* 배지 */}
                            <div className="flex items-center gap-1.5">
                              {(groupProducts[0] as any).is_best && (
                                <span className="px-2 py-0.5 text-xs font-normal border border-gray-400 text-gray-600 rounded">
                                  BEST
                                </span>
                              )}
                              {(groupProducts[0] as any).is_recommended && (
                                <span className="px-2 py-0.5 text-xs font-normal border border-gray-400 text-gray-600 rounded">
                                  추천
                                </span>
                              )}
                              {(groupProducts[0] as any).has_image && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const firstProduct = groupProducts[0] as any;
                                    setSelectedImageCategory({
                                      category4: itemName,
                                      category4Id: firstProduct.category_4_id
                                    });
                                    setShowImageGallery(true);
                                  }}
                                  className="px-2 py-0.5 text-xs font-normal border border-gray-400 text-gray-600 rounded hover:bg-gray-100 transition-colors"
                                >
                                  이미지
                                </button>
                              )}
                              {(groupProducts[0] as any).has_detail_page && (
                                <span className="px-2 py-0.5 text-xs font-normal border border-gray-400 text-gray-600 rounded">
                                  상세페이지
                                </span>
                              )}
                            </div>

                            {/* 상태별 배지 (품목의 원물상태 표시) */}
                            {(() => {
                              const categoryStatus = (groupProducts[0] as any).category_supply_status;
                              if (!categoryStatus) return null;

                              // name으로 비교 (category_settings에 name으로 저장되어 있음)
                              const statusInfo = supplyStatuses.find(s => s.name === categoryStatus);
                              if (!statusInfo) return null;

                              return (
                                <span
                                  className="px-2 py-0.5 font-medium rounded-full text-white"
                                  style={{ backgroundColor: statusInfo.color, fontSize: '13px' }}
                                >
                                  {statusInfo.name}
                                </span>
                              );
                            })()}
                            {/* 기존 옵션상품별 상태 배지 (주석 처리) */}
                            <div className="hidden flex gap-2">
                              {Object.entries(
                                groupProducts.reduce((statusCounts, product) => {
                                  const statusCode = (product as any).status || 'NONE';
                                  statusCounts[statusCode] = (statusCounts[statusCode] || 0) + 1;
                                  return statusCounts;
                                }, {} as Record<string, number>)
                              )
                              .sort(([codeA], [codeB]) => {
                                const statusA = supplyStatuses.find(s => s.code === codeA);
                                const statusB = supplyStatuses.find(s => s.code === codeB);
                                const orderA = statusA?.display_order ?? 999;
                                const orderB = statusB?.display_order ?? 999;
                                return orderA - orderB;
                              })
                              .map(([statusCode, count]) => {
                                const statusInfo = supplyStatuses.find(s => s.code === statusCode);
                                const statusName = statusInfo?.name || statusCode;
                                const bgColor = statusInfo?.color || '#9CA3AF';

                                return (
                                  <span
                                    key={statusCode}
                                    className="px-2 py-1 text-xs font-medium rounded-full text-white"
                                    style={{ backgroundColor: bgColor }}
                                  >
                                    {statusName}
                                  </span>
                                );
                              })}
                            </div>
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

                        {/* 그룹 컨텐츠 */}
                        {isExpanded && (
                          <div className="border-t border-gray-200 bg-gray-50 p-4 pl-12">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                              {groupProducts.map((product) => (
                                <ProductCard
                                  key={product.id}
                                  product={product}
                                  onProductClick={handleProductClick}
                                  onShowPriceChart={handleShowPriceChart}
                                />
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
              ).sort(([, productsA], [, productsB]) => {
                // 첫 번째 정렬: 상태값 순서
                const getOrder = (products: OptionProduct[]) => {
                  const rawMaterialStatus = (products[0] as any).category_supply_status;
                  if (!rawMaterialStatus) return 999;
                  const statusInfo = supplyStatuses.find(s => s.name === rawMaterialStatus);
                  return statusInfo?.display_order ?? 999;
                };
                const orderDiff = getOrder(productsA) - getOrder(productsB);

                // 상태값이 같으면 두 번째 정렬: 소분류 가나다 순
                if (orderDiff === 0) {
                  const category3A = (productsA[0] as any).category_3 || '';
                  const category3B = (productsB[0] as any).category_3 || '';
                  return category3A.localeCompare(category3B, 'ko');
                }

                return orderDiff;
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
                    const category2 = (groupProducts[0] as any).category_2 || '';
                    const displayTitle = category2 ? `${category2}/${itemName}` : itemName;
                    const isExpanded = expandedGroups.has(itemName);

                    // 출하중 상태 확인
                    const categoryStatus = (groupProducts[0] as any).category_supply_status;
                    const isShipping = categoryStatus === '출하중';

                    return (
                      <div
                        key={itemName}
                        className={`bg-white rounded-lg shadow-sm overflow-hidden ${
                          isShipping ? 'animate-shipping' : 'border border-gray-200'
                        }`}
                      >
                        {/* 그룹 헤더 */}
                        <div className="px-6 py-2 hover:bg-gray-50 transition-colors">
                          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
                            {/* 왼쪽: 썸네일 + 품목정보 */}
                            <button
                              onClick={() => toggleGroup(itemName)}
                              className="flex items-center gap-3"
                            >
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
                                  <h3 className="font-semibold text-gray-900" style={{ fontSize: '18px' }}>{displayTitle}</h3>
                                  <p className="text-gray-500" style={{ fontSize: '13px' }}>{groupProducts.length}개 옵션상품</p>
                                </div>
                              </div>
                            </button>

                            {/* 중앙: 발송기한 */}
                            <div className="text-left">
                              {(() => {
                                const shippingDeadline = (groupProducts[0] as any).shipping_deadline;
                                if (shippingDeadline) {
                                  return (
                                    <div className="text-gray-600" style={{ fontSize: '13px' }}>
                                      발송기한 <span className="font-medium">{shippingDeadline}일</span>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>

                            {/* 오른쪽: 배지 + 펼치기 버튼 */}
                            <div className="flex items-center gap-3">
                            {/* 배지 */}
                            <div className="flex items-center gap-1.5">
                              {(groupProducts[0] as any).is_best && (
                                <span className="px-2 py-0.5 text-xs font-normal border border-gray-400 text-gray-600 rounded">
                                  BEST
                                </span>
                              )}
                              {(groupProducts[0] as any).is_recommended && (
                                <span className="px-2 py-0.5 text-xs font-normal border border-gray-400 text-gray-600 rounded">
                                  추천
                                </span>
                              )}
                              {(groupProducts[0] as any).has_image && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const firstProduct = groupProducts[0] as any;
                                    setSelectedImageCategory({
                                      category4: itemName,
                                      category4Id: firstProduct.category_4_id
                                    });
                                    setShowImageGallery(true);
                                  }}
                                  className="px-2 py-0.5 text-xs font-normal border border-gray-400 text-gray-600 rounded hover:bg-gray-100 transition-colors"
                                >
                                  이미지
                                </button>
                              )}
                              {(groupProducts[0] as any).has_detail_page && (
                                <span className="px-2 py-0.5 text-xs font-normal border border-gray-400 text-gray-600 rounded">
                                  상세페이지
                                </span>
                              )}
                            </div>

                            {/* 상태별 배지 (품목의 원물상태 표시) */}
                            {(() => {
                              const categoryStatus = (groupProducts[0] as any).category_supply_status;
                              if (!categoryStatus) return null;

                              const statusInfo = supplyStatuses.find(s => s.name === categoryStatus);
                              if (!statusInfo) return null;

                              return (
                                <span
                                  className="px-2 py-0.5 font-medium rounded-full text-white"
                                  style={{ backgroundColor: statusInfo.color, fontSize: '13px' }}
                                >
                                  {statusInfo.name}
                                </span>
                              );
                            })()}

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
                                      {product.출고비용 !== undefined ? `${product.출고비용.toLocaleString()}원` : '-'}
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
