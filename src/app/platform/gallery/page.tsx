'use client';

import { useState, useEffect } from 'react';
import { Search, Download, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

interface CloudinaryImage {
  id: string;
  cloudinary_id: string;
  secure_url: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  width: number;
  height: number;
  file_size: number;
  format: string;
  is_downloadable: boolean;
  download_count: number;
  created_at: string;
  category_1?: string;
  category_2?: string;
  category_3?: string;
  category_4?: string;
  category_4_id?: string;
  option_product_id?: string;
  option_name?: string;
}

interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
}

export default function PublicGalleryPage() {
  const [images, setImages] = useState<CloudinaryImage[]>([]);
  const [allProductImages, setAllProductImages] = useState<CloudinaryImage[]>([]); // 품목이미지 전체
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // 필터
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<string>('all'); // 품목 필터
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 라이트박스
  const [selectedImage, setSelectedImage] = useState<CloudinaryImage | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    fetchImages();
    fetchCategories();
  }, [selectedCategory, searchQuery, currentPage]);

  // 품목이미지 카테고리 선택 시 전체 품목 리스트 가져오기
  useEffect(() => {
    if (selectedCategory === '품목이미지') {
      fetchAllProductImages();
    }
  }, [selectedCategory]);

  const fetchAllProductImages = async () => {
    try {
      const params = new URLSearchParams({
        category: '품목이미지',
        is_public: 'true',
        limit: '1000', // 충분히 큰 값
      });

      const response = await fetch(`/api/cloudinary/images?${params}`);
      const result = await response.json();

      if (result.success) {
        setAllProductImages(result.data);
      }
    } catch (error) {
      console.error('전체 품목이미지 조회 오류:', error);
    }
  };

  const fetchImages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '24',
        is_public: 'true',
      });

      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/cloudinary/images?${params}`);
      const result = await response.json();

      if (result.success) {
        setImages(result.data);
        setTotalPages(result.pagination.totalPages);
      }
    } catch (error) {
      console.error('이미지 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/cloudinary/categories');
      const result = await response.json();
      if (result.success) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('카테고리 조회 오류:', error);
    }
  };

  const handleImageClick = (image: CloudinaryImage, index: number) => {
    setSelectedImage(image);
    setLightboxIndex(index);
  };

  const handleDownload = async (image: CloudinaryImage) => {
    if (!image.is_downloadable) {
      alert('이 이미지는 다운로드할 수 없습니다.');
      return;
    }

    try {
      await fetch('/api/cloudinary/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId: image.id }),
      });

      const response = await fetch(image.secure_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = image.title + '.' + image.format;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      setImages((prev) =>
        prev.map((img) =>
          img.id === image.id ? { ...img, download_count: img.download_count + 1 } : img
        )
      );
    } catch (error) {
      console.error('다운로드 오류:', error);
      alert('다운로드 중 오류가 발생했습니다.');
    }
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    // 필터링된 이미지 사용
    const filteredImages = images.filter(img => {
      const categoryMatch = selectedCategory === 'all' || img.category === selectedCategory;

      // 품목 선택 시: 해당 품목의 이미지만 (품목이미지, option_product 제외)
      if (selectedProduct !== 'all' && selectedCategory === '품목이미지') {
        // category_4_id가 있고 option_product_id가 없으며, category_3/category_4가 일치
        return img.category_4_id &&
               !img.option_product_id &&
               `${img.category_3 || ''} / ${img.category_4 || ''}` === selectedProduct;
      }

      return categoryMatch;
    });

    const newIndex = direction === 'prev'
      ? (lightboxIndex - 1 + filteredImages.length) % filteredImages.length
      : (lightboxIndex + 1) % filteredImages.length;

    setLightboxIndex(newIndex);
    setSelectedImage(filteredImages[newIndex]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // 카테고리별 이미지 개수 계산
  const categoryCounts = categories.reduce((acc, cat) => {
    acc[cat.name] = images.filter(img => img.category === cat.name).length;
    return acc;
  }, {} as Record<string, number>);

  // 품목이미지 카테고리의 품목 리스트 추출 (전체 품목이미지 사용)
  const productList = selectedCategory === '품목이미지'
    ? Array.from(new Set(
        allProductImages
          .filter(img => img.category_4)
          .map(img => `${img.category_3 || ''} / ${img.category_4 || ''}`)
      )).sort()
    : [];

  // 필터링된 이미지
  const filteredImages = images.filter(img => {
    const categoryMatch = selectedCategory === 'all' || img.category === selectedCategory;

    // 품목 선택 시: 해당 품목의 이미지만 (품목이미지, option_product 제외)
    if (selectedProduct !== 'all' && selectedCategory === '품목이미지') {
      // category_4_id가 있고 option_product_id가 없으며, category_3/category_4가 일치
      return img.category_4_id &&
             !img.option_product_id &&
             `${img.category_3 || ''} / ${img.category_4 || ''}` === selectedProduct;
    }

    return categoryMatch;
  });

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

      {/* 우측 상단 보라색 */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '1600px',
        height: '1200px',
        background: 'radial-gradient(ellipse at 100% 0%, rgba(255, 255, 255, 0) 0%, rgba(139, 92, 246, 0.08) 20%, rgba(139, 92, 246, 0.15) 40%, transparent 60%)',
        zIndex: -1
      }} />

      {/* Flex 컨테이너: 사이드바 + 품목 사이드바 + 메인 */}
      <div className="flex">
        {/* 왼쪽 사이드바 - 카테고리 */}
        <div className="w-56 bg-gray-50 border-r border-gray-200 sticky top-0 h-screen overflow-y-auto flex-shrink-0">
          <div className="p-3 space-y-6">
            {/* 카테고리 필터 */}
            <div>
              <h3 className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2 px-2">카테고리</h3>
              <div className="space-y-0.5">
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedProduct('all');
                    setCurrentPage(1);
                  }}
                  className={`w-full text-left px-2 py-1.5 text-xs transition-all ${
                    selectedCategory === 'all'
                      ? 'text-gray-900 font-medium bg-white border-l-2 border-gray-900'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50 border-l-2 border-transparent'
                  }`}
                >
                  전체
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.name);
                      setSelectedProduct('all');
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-2 py-1.5 text-xs transition-all ${
                      selectedCategory === cat.name
                        ? 'text-gray-900 font-medium bg-white border-l-2 border-gray-900'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50 border-l-2 border-transparent'
                    }`}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 카테고리별 통계 */}
            <div>
              <h3 className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2 px-2">이미지 통계</h3>
              <div className="space-y-0.5">
                <div className="flex items-center justify-between px-2 py-1.5 hover:bg-white/50 transition-colors">
                  <span className="text-xs text-gray-700">전체</span>
                  <span className="text-xs font-semibold text-gray-900">{images.length}</span>
                </div>
                {categories.map((cat) => {
                  const count = categoryCounts[cat.name] || 0;
                  if (count === 0) return null;
                  return (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between px-2 py-1.5 hover:bg-white/50 transition-colors"
                    >
                      <span className="text-xs text-gray-700">{cat.name}</span>
                      <span className="text-xs font-semibold text-gray-900">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 중간 사이드바 - 품목명 (품목이미지 선택 시만 표시) */}
        {selectedCategory === '품목이미지' && (
          <div className="w-64 bg-white border-r border-gray-200 sticky top-0 h-screen overflow-y-auto flex-shrink-0">
            <div className="p-3">
              <h3 className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2 px-2">품목명</h3>
              <div className="space-y-0.5">
                <button
                  onClick={() => {
                    setSelectedProduct('all');
                    setCurrentPage(1);
                  }}
                  className={`w-full text-left px-2 py-1.5 text-xs transition-all ${
                    selectedProduct === 'all'
                      ? 'text-gray-900 font-medium bg-gray-100 border-l-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-l-2 border-transparent'
                  }`}
                >
                  전체
                </button>
                {productList.map((product, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedProduct(product);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-2 py-1.5 text-xs transition-all ${
                      selectedProduct === product
                        ? 'text-gray-900 font-medium bg-gray-100 border-l-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-l-2 border-transparent'
                    }`}
                    title={product}
                  >
                    <div className="truncate">{product}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 오른쪽 메인 영역 */}
        <div className="flex-1 min-w-0">
          {/* 헤더 */}
          <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
            <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
              {/* 제목 */}
              <div>
                <h1 className="text-xl font-bold text-gray-900">이미지 갤러리</h1>
                <p className="text-sm text-gray-600 mt-0.5">무료로 다운로드하여 사용하실 수 있습니다.</p>
              </div>

              {/* 검색 */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="제목 또는 설명으로 검색..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>

          {/* 이미지 그리드 */}
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">로딩 중...</p>
              </div>
            ) : filteredImages.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <p className="text-gray-600">검색 결과가 없습니다.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                  {filteredImages.map((image, index) => (
                    <div
                      key={image.id}
                      className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow overflow-hidden cursor-pointer group"
                      onClick={() => handleImageClick(image, index)}
                    >
                      <div className="relative aspect-square bg-gray-100">
                        <Image
                          src={image.secure_url}
                          alt={image.title}
                          fill
                          unoptimized
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                        />
                        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none"></div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(image);
                            }}
                            disabled={!image.is_downloadable}
                            className="px-4 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 pointer-events-auto"
                          >
                            <Download size={16} />
                            다운로드
                          </button>
                        </div>
                        <div className="absolute top-2 left-2">
                          <span className="bg-white bg-opacity-90 text-xs px-2 py-1 rounded">
                            {image.category}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium text-sm truncate" title={image.title}>
                          {image.title}
                        </h3>
                        {image.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {image.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
                          <span>{image.width} × {image.height}</span>
                          <span>⬇ {image.download_count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      이전
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={i}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-4 py-2 rounded-lg ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      다음
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 라이트박스 모달 */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <X size={32} />
          </button>

          <button
            onClick={() => navigateLightbox('prev')}
            className="absolute left-4 text-white hover:text-gray-300 z-10"
          >
            <ChevronLeft size={48} />
          </button>

          <button
            onClick={() => navigateLightbox('next')}
            className="absolute right-4 text-white hover:text-gray-300 z-10"
          >
            <ChevronRight size={48} />
          </button>

          <div className="max-w-5xl max-h-[90vh] w-full flex flex-col">
            <div className="relative flex-1 flex items-center justify-center">
              <Image
                src={selectedImage.secure_url}
                alt={selectedImage.title}
                width={selectedImage.width}
                height={selectedImage.height}
                unoptimized
                className="max-w-full max-h-[70vh] object-contain"
                style={{ width: 'auto', height: 'auto' }}
              />
            </div>

            <div className="bg-white rounded-lg mt-4 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900">{selectedImage.title}</h2>
                  {selectedImage.description && (
                    <p className="text-gray-600 mt-2">{selectedImage.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedImage.tags?.map((tag, i) => (
                      <span key={i} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
                    <span>{selectedImage.width} × {selectedImage.height}</span>
                    <span>{formatFileSize(selectedImage.file_size)}</span>
                    <span>⬇ {selectedImage.download_count} 다운로드</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(selectedImage)}
                  disabled={!selectedImage.is_downloadable}
                  className="ml-4 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Download size={20} />
                  다운로드
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
