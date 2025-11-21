'use client';

import { useState, useEffect } from 'react';
import { Search, Download, X, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
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
}

interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
}

export default function PublicGalleryPage() {
  const [images, setImages] = useState<CloudinaryImage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // 필터
  const [selectedCategory, setSelectedCategory] = useState('all');
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

  const fetchImages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '24',
        is_public: 'true', // 공개된 이미지만
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
      // 다운로드 카운트 증가
      await fetch('/api/cloudinary/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId: image.id }),
      });

      // 이미지 다운로드
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

      // 다운로드 카운트 업데이트
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
    const newIndex = direction === 'prev'
      ? (lightboxIndex - 1 + images.length) % images.length
      : (lightboxIndex + 1) % images.length;

    setLightboxIndex(newIndex);
    setSelectedImage(images[newIndex]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">이미지 갤러리</h1>
          <p className="text-gray-600 mt-2">무료로 다운로드하여 사용하실 수 있습니다.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 필터 및 검색 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 카테고리 필터 */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="inline mr-1" size={16} />
                카테고리
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  전체
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === cat.name
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 검색 */}
            <div className="flex-1 max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="inline mr-1" size={16} />
                검색
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="제목 또는 설명으로 검색..."
                  className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* 이미지 그리드 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-600">검색 결과가 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {images.map((image, index) => (
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
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(image);
                          }}
                          disabled={!image.is_downloadable}
                          className="px-4 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <Download size={16} />
                          다운로드
                        </button>
                      </div>
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
