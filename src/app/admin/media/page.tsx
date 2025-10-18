'use client';

import { useState, useEffect, useCallback } from 'react';
import { Upload, Search, Filter, Download, Trash2, Edit2, Eye, EyeOff, Image as ImageIcon, Grid, List, Copy, Check } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

interface CloudinaryImage {
  id: string;
  cloudinary_id: string;
  cloudinary_url: string;
  secure_url: string;
  filename: string;
  format: string;
  width: number;
  height: number;
  file_size: number;
  category: string;
  title: string;
  description: string;
  tags: string[];
  is_public: boolean;
  is_downloadable: boolean;
  view_count: number;
  download_count: number;
  created_at: string;
}

interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
}

export default function MediaManagementPage() {
  const supabase = createClient();
  const [images, setImages] = useState<CloudinaryImage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // 필터 상태
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 업로드 모달
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState<'raw_material' | 'option_product' | 'category_4'>('category_4');
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    category: '기타',
    title: '',
    description: '',
    tags: '',
    is_public: true,
    is_downloadable: true,
    raw_material_id: '',
    option_product_id: '',
    category_4_id: '',
  });
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // 원물/옵션상품/품목 목록
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);
  const [optionProducts, setOptionProducts] = useState<any[]>([]);
  const [productCategories, setProductCategories] = useState<Array<{id: string, category_4: string}>>([]);

  // 수정 모달
  const [editingImage, setEditingImage] = useState<CloudinaryImage | null>(null);

  useEffect(() => {
    fetchImages();
    fetchCategories();
  }, [selectedCategory, searchQuery, currentPage]);

  // 원물/옵션상품/품목 목록은 최초 1회만 로드
  useEffect(() => {
    fetchRawMaterials();
    fetchOptionProducts();
    fetchProductCategories();
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
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

  const fetchRawMaterials = async () => {
    try {
      console.log('원물 목록 조회 시작...');
      const { data, error } = await supabase
        .from('raw_materials')
        .select('id, material_code, material_name')
        .order('material_name');

      if (error) {
        console.error('원물 조회 에러:', error);
        throw error;
      }
      console.log('원물 목록 조회 완료:', data?.length, '개');
      setRawMaterials(data || []);
    } catch (error) {
      console.error('원물 조회 오류:', error);
    }
  };

  const fetchOptionProducts = async () => {
    try {
      console.log('옵션상품 목록 조회 시작...');
      const { data, error } = await supabase
        .from('option_products')
        .select('id, option_code, option_name')
        .order('option_name');

      if (error) {
        console.error('옵션상품 조회 에러:', error);
        throw error;
      }
      console.log('옵션상품 목록 조회 완료:', data?.length, '개');
      setOptionProducts(data || []);
    } catch (error) {
      console.error('옵션상품 조회 오류:', error);
    }
  };

  const fetchProductCategories = async () => {
    try {
      console.log('품목 마스터 조회 시작...');
      const { data, error } = await supabase
        .from('product_categories')
        .select('id, category_4, category_4_code')
        .eq('is_active', true)
        .order('category_4');

      if (error) {
        console.error('품목 마스터 조회 에러:', error);
        throw error;
      }

      console.log('품목 마스터 조회 완료:', data?.length, '개');
      console.log('품목 코드 샘플:', data?.[0]?.category_4_code);
      setProductCategories(data || []);
    } catch (error) {
      console.error('품목 마스터 조회 오류:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadForm({
        ...uploadForm,
        file,
        title: uploadForm.title || file.name,
      });
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file) {
      alert('파일을 선택해주세요.');
      return;
    }

    if (uploadType === 'raw_material' && !uploadForm.raw_material_id) {
      alert('원물을 선택해주세요.');
      return;
    }

    if (uploadType === 'option_product' && !uploadForm.option_product_id) {
      alert('옵션상품을 선택해주세요.');
      return;
    }

    if (uploadType === 'category_4' && !uploadForm.category_4_id) {
      alert('품목을 선택해주세요.');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('category', uploadForm.category);
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);
      formData.append('tags', uploadForm.tags);
      formData.append('is_public', uploadForm.is_public.toString());
      formData.append('is_downloadable', uploadForm.is_downloadable.toString());
      formData.append('upload_type', uploadType);

      if (uploadType === 'raw_material') {
        formData.append('raw_material_id', uploadForm.raw_material_id);
      } else if (uploadType === 'option_product') {
        formData.append('option_product_id', uploadForm.option_product_id);
      } else if (uploadType === 'category_4') {
        formData.append('category_4_id', uploadForm.category_4_id);
      }

      const response = await fetch('/api/cloudinary/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadedImageUrl(result.data.secure_url);
        fetchImages();
      } else {
        alert('업로드 실패: ' + result.error);
      }
    } catch (error) {
      console.error('업로드 오류:', error);
      alert('업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleCopyUrl = async () => {
    if (uploadedImageUrl) {
      await navigator.clipboard.writeText(uploadedImageUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const handleCloseUploadModal = () => {
    setShowUploadModal(false);
    setUploadedImageUrl(null);
    setCopiedUrl(false);
    setUploadForm({
      file: null,
      category: '기타',
      title: '',
      description: '',
      tags: '',
      is_public: true,
      is_downloadable: true,
      raw_material_id: '',
      option_product_id: '',
      category_4_id: '',
    });
  };

  const handleUpdate = async () => {
    if (!editingImage) return;

    try {
      const response = await fetch('/api/cloudinary/images', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingImage),
      });

      const result = await response.json();

      if (result.success) {
        alert('수정 완료!');
        setEditingImage(null);
        fetchImages();
      } else {
        alert('수정 실패: ' + result.error);
      }
    } catch (error) {
      console.error('수정 오류:', error);
      alert('수정 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까? Cloudinary와 DB에서 모두 삭제됩니다.')) {
      return;
    }

    try {
      const response = await fetch(`/api/cloudinary/images?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        alert('삭제 완료!');
        fetchImages();
      } else {
        alert('삭제 실패: ' + result.error);
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">이미지 관리</h1>
          <p className="text-gray-600 text-sm mt-1">Cloudinary 이미지 업로드 및 관리</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Upload size={20} />
          이미지 업로드
        </button>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          {/* 카테고리 필터 */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* 검색 */}
          <div className="flex-1 min-w-[300px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">검색</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="제목 또는 설명 검색..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 보기 모드 */}
          <div className="flex items-end gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`}
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`}
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* 이미지 목록 */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">로딩 중...</p>
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">이미지가 없습니다.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {images.map((image) => (
            <div key={image.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
              <div className="relative aspect-square bg-gray-100">
                <Image
                  src={image.secure_url}
                  alt={image.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 20vw"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  {image.is_public ? (
                    <span className="bg-green-500 text-white px-2 py-1 rounded text-xs">공개</span>
                  ) : (
                    <span className="bg-gray-500 text-white px-2 py-1 rounded text-xs">비공개</span>
                  )}
                </div>
              </div>
              <div className="p-3">
                <p className="font-medium text-sm truncate" title={image.title}>
                  {image.title}
                </p>
                <p className="text-xs text-gray-500 mt-1">{image.category}</p>
                <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                  <span>{formatFileSize(image.file_size)}</span>
                  <span>{image.width} × {image.height}</span>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <span>👁 {image.view_count}</span>
                  <span>⬇ {image.download_count}</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setEditingImage(image)}
                    className="flex-1 px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                  >
                    <Edit2 size={12} className="inline mr-1" />
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(image.id)}
                    className="flex-1 px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200"
                  >
                    <Trash2 size={12} className="inline mr-1" />
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">미리보기</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">제목</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">카테고리</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">크기</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">통계</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {images.map((image) => (
                <tr key={image.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="relative w-16 h-16 bg-gray-100 rounded">
                      <Image
                        src={image.secure_url}
                        alt={image.title}
                        fill
                        className="object-cover rounded"
                        sizes="64px"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-sm">{image.title}</p>
                    <p className="text-xs text-gray-500">{image.filename}</p>
                  </td>
                  <td className="px-4 py-3 text-sm">{image.category}</td>
                  <td className="px-4 py-3 text-sm">
                    <p>{formatFileSize(image.file_size)}</p>
                    <p className="text-xs text-gray-500">{image.width} × {image.height}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {image.is_public ? (
                        <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-xs">공개</span>
                      ) : (
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">비공개</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    <p>👁 {image.view_count}</p>
                    <p>⬇ {image.download_count}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingImage(image)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="수정"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(image.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="삭제"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            이전
          </button>
          <span className="px-4 py-2 bg-white border rounded-lg">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            다음
          </button>
        </div>
      )}

      {/* 업로드 모달 */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-[18px] font-bold mb-4">이미지 업로드</h2>

              {/* 업로드 완료 화면 */}
              {uploadedImageUrl ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-[14px] text-green-800 font-medium mb-2">✓ 업로드 완료!</p>
                    <p className="text-[14px] text-green-700">이미지가 Cloudinary에 성공적으로 업로드되었습니다.</p>
                  </div>

                  {/* URL 표시 및 복사 */}
                  <div>
                    <label className="block text-[14px] font-medium text-gray-700 mb-2">이미지 URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={uploadedImageUrl}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-[14px] whitespace-nowrap overflow-x-auto"
                      />
                      <button
                        onClick={handleCopyUrl}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap text-[14px]"
                      >
                        {copiedUrl ? (
                          <>
                            <Check size={16} />
                            복사됨
                          </>
                        ) : (
                          <>
                            <Copy size={16} />
                            복사
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 미리보기 */}
                  <div>
                    <label className="block text-[14px] font-medium text-gray-700 mb-2">미리보기</label>
                    <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={uploadedImageUrl}
                        alt="업로드된 이미지"
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 672px"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleCloseUploadModal}
                    className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-[14px]"
                  >
                    닫기
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 업로드 타입 선택 */}
                  <div>
                    <label className="block text-[14px] font-medium text-gray-700 mb-2">업로드 타입</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 whitespace-nowrap">
                        <input
                          type="radio"
                          value="category_4"
                          checked={uploadType === 'category_4'}
                          onChange={(e) => setUploadType(e.target.value as 'category_4')}
                          className="w-4 h-4"
                        />
                        <span className="text-[14px]">품목</span>
                      </label>
                      <label className="flex items-center gap-2 whitespace-nowrap">
                        <input
                          type="radio"
                          value="raw_material"
                          checked={uploadType === 'raw_material'}
                          onChange={(e) => setUploadType(e.target.value as 'raw_material')}
                          className="w-4 h-4"
                        />
                        <span className="text-[14px]">원물</span>
                      </label>
                      <label className="flex items-center gap-2 whitespace-nowrap">
                        <input
                          type="radio"
                          value="option_product"
                          checked={uploadType === 'option_product'}
                          onChange={(e) => setUploadType(e.target.value as 'option_product')}
                          className="w-4 h-4"
                        />
                        <span className="text-[14px]">옵션상품</span>
                      </label>
                    </div>
                  </div>

                  {/* 품목/원물/옵션상품 선택 */}
                  {uploadType === 'category_4' ? (
                    <div>
                      <label className="block text-[14px] font-medium text-gray-700 mb-2">품목 선택</label>
                      <select
                        value={uploadForm.category_4_id}
                        onChange={(e) => setUploadForm({ ...uploadForm, category_4_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px]"
                      >
                        <option value="">품목을 선택하세요</option>
                        {productCategories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.category_4}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : uploadType === 'raw_material' ? (
                    <div>
                      <label className="block text-[14px] font-medium text-gray-700 mb-2">원물 선택</label>
                      <select
                        value={uploadForm.raw_material_id}
                        onChange={(e) => setUploadForm({ ...uploadForm, raw_material_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px]"
                      >
                        <option value="">원물을 선택하세요</option>
                        {rawMaterials.map((material) => (
                          <option key={material.id} value={material.id}>
                            {material.material_name} ({material.material_code})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[14px] font-medium text-gray-700 mb-2">옵션상품 선택</label>
                      <select
                        value={uploadForm.option_product_id}
                        onChange={(e) => setUploadForm({ ...uploadForm, option_product_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px]"
                      >
                        <option value="">옵션상품을 선택하세요</option>
                        {optionProducts.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.option_name} ({product.option_code})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* 파일 선택 */}
                  <div>
                    <label className="block text-[14px] font-medium text-gray-700 mb-2">파일</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px]"
                    />
                    {uploadForm.file && (
                      <p className="text-[14px] text-gray-500 mt-2 whitespace-nowrap overflow-hidden text-ellipsis">
                        선택된 파일: {uploadForm.file.name} ({formatFileSize(uploadForm.file.size)})
                      </p>
                    )}
                  </div>

                  {/* 카테고리 */}
                  <div>
                    <label className="block text-[14px] font-medium text-gray-700 mb-2">카테고리</label>
                    <select
                      value={uploadForm.category}
                      onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px]"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 제목 */}
                  <div>
                    <label className="block text-[14px] font-medium text-gray-700 mb-2">제목</label>
                    <input
                      type="text"
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                      placeholder="이미지 제목"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px]"
                    />
                  </div>

                  {/* 설명 */}
                  <div>
                    <label className="block text-[14px] font-medium text-gray-700 mb-2">설명</label>
                    <textarea
                      value={uploadForm.description}
                      onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                      placeholder="이미지 설명"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px]"
                    />
                  </div>

                  {/* 태그 */}
                  <div>
                    <label className="block text-[14px] font-medium text-gray-700 mb-2">
                      태그 <span className="text-[12px] text-gray-500">(콤마로 구분)</span>
                    </label>
                    <input
                      type="text"
                      value={uploadForm.tags}
                      onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                      placeholder="태그1, 태그2, 태그3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px]"
                    />
                  </div>

                  {/* 공개 설정 */}
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={uploadForm.is_public}
                        onChange={(e) => setUploadForm({ ...uploadForm, is_public: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="text-[14px]">공개</span>
                    </label>
                    <label className="flex items-center gap-2 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={uploadForm.is_downloadable}
                        onChange={(e) => setUploadForm({ ...uploadForm, is_downloadable: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="text-[14px]">다운로드 가능</span>
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleUpload}
                      disabled={uploading || !uploadForm.file}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-[14px] whitespace-nowrap"
                    >
                      {uploading ? '업로드 중...' : '업로드'}
                    </button>
                    <button
                      onClick={handleCloseUploadModal}
                      disabled={uploading}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-[14px] whitespace-nowrap"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {editingImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">이미지 수정</h2>

              <div className="space-y-4">
                {/* 미리보기 */}
                <div className="relative w-full h-48 bg-gray-100 rounded">
                  <Image
                    src={editingImage.secure_url}
                    alt={editingImage.title}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 672px"
                  />
                </div>

                {/* 카테고리 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                  <select
                    value={editingImage.category}
                    onChange={(e) => setEditingImage({ ...editingImage, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 제목 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                  <input
                    type="text"
                    value={editingImage.title}
                    onChange={(e) => setEditingImage({ ...editingImage, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                {/* 설명 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                  <textarea
                    value={editingImage.description || ''}
                    onChange={(e) => setEditingImage({ ...editingImage, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                {/* 태그 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">태그</label>
                  <input
                    type="text"
                    value={editingImage.tags?.join(', ') || ''}
                    onChange={(e) => setEditingImage({ ...editingImage, tags: e.target.value.split(',').map(t => t.trim()) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                {/* 공개 설정 */}
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingImage.is_public}
                      onChange={(e) => setEditingImage({ ...editingImage, is_public: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">공개</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingImage.is_downloadable}
                      onChange={(e) => setEditingImage({ ...editingImage, is_downloadable: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">다운로드 가능</span>
                  </label>
                </div>

                {/* 통계 정보 */}
                <div className="bg-gray-50 rounded p-4">
                  <p className="text-sm text-gray-600">
                    조회수: {editingImage.view_count} | 다운로드: {editingImage.download_count}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {editingImage.width} × {editingImage.height} | {formatFileSize(editingImage.file_size)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleUpdate}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  저장
                </button>
                <button
                  onClick={() => setEditingImage(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
