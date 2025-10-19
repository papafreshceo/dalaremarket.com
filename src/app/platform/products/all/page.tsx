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

      // 2. category_settings 조회 (품목명으로 ID 매핑용 + 원물상태 + 소분류 + 셀러공급여부 + 배지정보)
      const { data: categories, error: catError } = await supabase
        .from('category_settings')
        .select('id, category_3, category_4, raw_material_status, seller_supply, is_best, is_recommended, has_image, has_detail_page')
        .eq('is_active', true)
        .eq('seller_supply', true) // 셀러공급 품목만 조회
        .not('category_4', 'is', null); // category_4가 있는 것만

      if (catError) {
        console.error('품목 조회 오류:', catError);
      }

      // 품목명 -> 품목정보 맵핑
      const categoryMap = new Map(
        (categories || []).map(cat => [cat.category_4, {
          id: cat.id,
          category_3: cat.category_3,
          raw_material_status: cat.raw_material_status,
          is_best: cat.is_best,
          is_recommended: cat.is_recommended,
          has_image: cat.has_image,
          has_detail_page: cat.has_detail_page
        }])
      );

      // 3. 대표이미지 조회 (옵션상품 기준 + 품목 기준)
      const { data: representativeImages, error: imgError } = await supabase
        .from('cloudinary_images')
        .select('option_product_id, category_4_id, secure_url')
        .eq('is_representative', true);

      if (imgError) {
        console.error('대표이미지 조회 오류:', imgError);
      }

      // 4. 옵션상품별 대표이미지 맵핑
      const optionImageMap = new Map(
        (representativeImages || [])
          .filter(img => img.option_product_id)
          .map(img => [img.option_product_id, img.secure_url])
      );

      // 5. 품목별 대표이미지 맵핑
      const categoryImageMap = new Map(
        (representativeImages || [])
          .filter(img => img.category_4_id)
          .map(img => [img.category_4_id, img.secure_url])
      );

      // 6. 대표이미지 URL을 thumbnail_url로 매핑 및 셀러공급 필터링
      // 우선순위: 기존 thumbnail_url > 옵션상품 대표이미지 > 품목 대표이미지
      // 필터링 조건: 품목의 seller_supply=true AND 옵션상품의 seller_supply=true
      const productsWithThumbnail = (optionProducts || [])
        .map(product => {
          // 옵션상품의 category_4 필드(품목명)로 품목정보 찾기
          const categoryInfo = categoryMap.get(product.category_4);
          const categoryId = categoryInfo?.id;

          return {
            ...product,
            thumbnail_url:
              product.thumbnail_url ||
              optionImageMap.get(product.id) ||
              (categoryId ? categoryImageMap.get(categoryId) : null) ||
              null,
            // 품목의 원물상태 및 소분류 추가
            category_raw_material_status: categoryInfo?.raw_material_status || null,
            category_3: categoryInfo?.category_3 || null,
            category_seller_supply: !!categoryInfo, // 품목의 셀러공급 여부
            category_4_id: categoryId, // 품목 ID 추가
            // 배지 정보 추가
            is_best: categoryInfo?.is_best || false,
            is_recommended: categoryInfo?.is_recommended || false,
            has_image: categoryInfo?.has_image || false,
            has_detail_page: categoryInfo?.has_detail_page || false
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
      console.log('샘플 상품 thumbnail_url:', productsWithThumbnail[0]?.thumbnail_url);
      console.log('샘플 상품 category_4_id:', productsWithThumbnail[0]?.category_4_id);
      console.log('대표이미지 데이터:', representativeImages?.slice(0, 3));

      // 신비, 신선 상품 디버깅
      const sinbiProducts = productsWithThumbnail.filter(p => p.category_4 === '신비');
      const sinsunProducts = productsWithThumbnail.filter(p => p.category_4 === '신선');
      console.log('신비 품목 상품 수:', sinbiProducts.length, sinbiProducts.map(p => p.option_name));
      console.log('신선 품목 상품 수:', sinsunProducts.length, sinsunProducts.map(p => p.option_name));
      console.log('신비 카테고리 정보:', categoryMap.get('신비'));
      console.log('신선 카테고리 정보:', categoryMap.get('신선'));

      // 반시 관련 상품 확인
      const bansiProducts = productsWithThumbnail.filter(p => p.option_name?.includes('반시'));
      if (bansiProducts.length > 0) {
        console.log('반시 상품들:', bansiProducts.map(p => ({
          name: p.option_name,
          category_4: p.category_4,
          has_category_info: !!categoryMap.get(p.category_4)
        })));
      }

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
                  const rawMaterialStatus = (products[0] as any).category_raw_material_status;
                  if (!rawMaterialStatus) return 999;
                  // name으로 비교 (category_settings에 name으로 저장되어 있음)
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
                    const category3 = (groupProducts[0] as any).category_3 || '';
                    const displayTitle = category3 ? `${category3}/${itemName}` : itemName;
                    const isExpanded = expandedGroups.has(itemName);

                    // 출하중 상태 확인
                    const categoryStatus = (groupProducts[0] as any).category_raw_material_status;
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
                        <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                          <button
                            onClick={() => toggleGroup(itemName)}
                            className="flex items-center gap-3 flex-1"
                          >
                            <div className={`p-2 rounded-lg ${isExpanded ? 'bg-blue-100' : 'bg-gray-100'}`}>
                              <Package className={`w-5 h-5 ${isExpanded ? 'text-blue-600' : 'text-gray-600'}`} />
                            </div>
                            <div className="text-left">
                              <h3 className="text-lg font-semibold text-gray-900">{displayTitle}</h3>
                              <p className="text-sm text-gray-500">{groupProducts.length}개 옵션상품</p>
                            </div>
                          </button>
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
                              const categoryStatus = (groupProducts[0] as any).category_raw_material_status;
                              if (!categoryStatus) return null;

                              // name으로 비교 (category_settings에 name으로 저장되어 있음)
                              const statusInfo = supplyStatuses.find(s => s.name === categoryStatus);
                              if (!statusInfo) return null;

                              return (
                                <span
                                  className="px-2 py-1 text-xs font-medium rounded-full text-white"
                                  style={{ backgroundColor: statusInfo.color }}
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
          // 품목별 그룹화 리스트 뷰
          <div className="space-y-8">
            {Object.entries(
              filteredProducts.reduce((groups, product) => {
                const itemName = (product as any).item_name || '기타';
                if (!groups[itemName]) {
                  groups[itemName] = [];
                }
                groups[itemName].push(product);
                return groups;
              }, {} as Record<string, OptionProduct[]>)
            )
            .sort(([, productsA], [, productsB]) => {
              const getOrder = (products: OptionProduct[]) => {
                const rawMaterialStatus = (products[0] as any).category_raw_material_status;
                if (!rawMaterialStatus) return 999;
                const statusInfo = supplyStatuses.find(s => s.code === rawMaterialStatus);
                return statusInfo?.display_order ?? 999;
              };

              return getOrder(productsA) - getOrder(productsB);
            })
            .map(([itemName, groupProducts]) => {
              // 소분류 정보 가져오기 (그룹의 첫 번째 상품에서)
              const category3 = (groupProducts[0] as any).category_3 || '';
              const displayTitle = category3 ? `${category3}/${itemName}` : itemName;

              return (
              <div key={itemName}>
                {/* 품목명 헤더 */}
                <div className="mb-4 pb-2 border-b-2 border-blue-500 flex items-baseline justify-between">
                  <div className="flex items-baseline gap-3">
                    <h2 className="text-xl font-bold text-gray-800">{displayTitle}</h2>
                    <p className="text-sm text-gray-500">{groupProducts.length}개 옵션상품</p>
                  </div>
                  {/* 상태별 배지 */}
                  <div className="flex gap-2">
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
                </div>

                {/* 리스트 그리드 */}
                <ProductGrid
                  products={groupProducts}
                  onProductClick={handleProductClick}
                  onShowPriceChart={handleShowPriceChart}
                />
              </div>
              );
            })}
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
