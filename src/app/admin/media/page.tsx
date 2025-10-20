'use client';

import { useState, useEffect, useCallback } from 'react';
import { Upload, Search, Filter, Download, Trash2, Edit2, Eye, EyeOff, Image as ImageIcon, Grid, List, Copy, Check, Folder, ChevronRight, ChevronDown, Code, ArrowUp, ArrowDown, X, Plus } from 'lucide-react';
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
  is_representative?: boolean;
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

interface FolderNode {
  name: string;
  path: string;
  children?: FolderNode[];
}

export default function MediaManagementPage() {
  const supabase = createClient();
  const [images, setImages] = useState<CloudinaryImage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // 폴더 트리 상태
  const [folderTree, setFolderTree] = useState<FolderNode[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['dalraemarket', 'papafresh']));

  // 필터 상태
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 업로드 모달
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState<'raw_material' | 'option_product' | 'category_4' | 'personal'>('category_4');
  const [rootFolder, setRootFolder] = useState<'dalraemarket' | 'papafresh'>('dalraemarket');
  const [uploadForm, setUploadForm] = useState({
    files: [] as File[],
    category: '기타',
    title: '',
    description: '',
    tags: '',
    is_public: true, // 공개 여부 (플랫폼 사용자에게 보임)
    is_downloadable: true, // 다운로드 가능 여부 (플랫폼 사용자가 다운로드 가능)
    raw_material_id: '',
    option_product_id: '',
    category_4_id: '',
  });
  const [uploadProgress, setUploadProgress] = useState<{current: number, total: number}>({current: 0, total: 0});
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // 원물/옵션상품/품목 목록
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);
  const [optionProducts, setOptionProducts] = useState<any[]>([]);
  const [productCategories, setProductCategories] = useState<Array<{id: string, category_4: string}>>([]);

  // 수정 모달
  const [editingImage, setEditingImage] = useState<CloudinaryImage | null>(null);

  // 이미지 선택 상태 (대량 삭제용)
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

  // 대표이미지 설정용 단일 선택
  const [selectedForRepresentative, setSelectedForRepresentative] = useState<string | null>(null);


  useEffect(() => {
    fetchImages();
    fetchCategories();
  }, [selectedCategory, searchQuery, currentPage, selectedFolder]);

  // 원물/옵션상품/품목 목록 및 폴더 트리는 최초 1회만 로드
  useEffect(() => {
    fetchRawMaterials();
    fetchOptionProducts();
    fetchProductCategories();
    fetchFolderTree();
  }, []);

  const fetchFolderTree = async () => {
    try {
      const response = await fetch('/api/cloudinary/folders');
      const result = await response.json();
      if (result.success) {
        setFolderTree(result.data);
      }
    } catch (error) {
      console.error('폴더 트리 조회 오류:', error);
    }
  };

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
      if (selectedFolder) {
        params.append('folder_path', selectedFolder);
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
        .from('category_settings')
        .select('id, category_4, category_4_code, expense_type')
        .eq('is_active', true)
        .eq('expense_type', '사입')
        .not('category_4', 'is', null)
        .order('category_4');

      if (error) {
        console.error('품목 마스터 조회 에러:', error);
        throw error;
      }

      // 동일한 품목(category_4) 중복 제거
      const uniqueCategories = data?.reduce((acc: any[], current) => {
        const exists = acc.find(item => item.category_4 === current.category_4);
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []) || [];

      console.log('품목 마스터 조회 완료 (사입 품목만):', data?.length, '개');
      console.log('중복 제거 후:', uniqueCategories.length, '개');
      console.log('품목 코드 샘플:', uniqueCategories[0]?.category_4_code);
      setProductCategories(uniqueCategories);
    } catch (error) {
      console.error('품목 마스터 조회 오류:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setUploadForm({
        ...uploadForm,
        files: filesArray,
        title: uploadForm.title || (filesArray.length === 1 ? filesArray[0].name : `${filesArray.length}개 파일`),
      });
    }
  };

  const handleUpload = async () => {
    if (uploadForm.files.length === 0) {
      alert('파일을 선택해주세요.');
      return;
    }

    // dalraemarket 폴더 선택 시에만 품목/원물/옵션상품 검증
    if (rootFolder === 'dalraemarket') {
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
    }

    try {
      setUploading(true);
      setUploadProgress({ current: 0, total: uploadForm.files.length });

      const uploadedUrls: string[] = [];

      // 여러 파일을 순차적으로 업로드
      for (let i = 0; i < uploadForm.files.length; i++) {
        const file = uploadForm.files[i];
        setUploadProgress({ current: i + 1, total: uploadForm.files.length });

        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', uploadForm.category);
        // 파일이 여러개일 경우 각 파일명을 제목으로 사용
        formData.append('title', uploadForm.files.length === 1 ? uploadForm.title : file.name);
        formData.append('description', uploadForm.description);
        formData.append('tags', uploadForm.tags);
        formData.append('is_public', uploadForm.is_public.toString());
        formData.append('is_downloadable', uploadForm.is_downloadable.toString());
        formData.append('upload_type', uploadType);
        formData.append('root_folder', rootFolder); // 루트 폴더 추가

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
          uploadedUrls.push(result.data.secure_url);
        } else {
          // 중복 오류 처리
          if (result.duplicate) {
            const dupType = result.duplicate.type === 'hash' ? '동일한 내용의 파일' : '같은 이름의 파일';
            const existingFile = result.duplicate.existingFile;
            const message = `파일 "${file.name}":\n\n${dupType}이 이미 존재합니다.\n\n기존 파일: ${existingFile.filename}\n경로: ${existingFile.cloudinary_id}\n\n계속 업로드하시겠습니까?`;

            if (!confirm(message)) {
              // 업로드 중단
              break;
            }
          } else {
            alert(`파일 "${file.name}" 업로드 실패: ` + result.error);
          }
        }
      }

      if (uploadedUrls.length > 0) {
        // 마지막 업로드된 이미지 URL 표시 (단일 파일일 경우)
        if (uploadedUrls.length === 1) {
          setUploadedImageUrl(uploadedUrls[0]);
        } else {
          alert(`${uploadedUrls.length}개 파일 업로드 완료!`);
          handleCloseUploadModal();
        }
        fetchImages();
      }
    } catch (error) {
      console.error('업로드 오류:', error);
      alert('업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
      setUploadProgress({ current: 0, total: 0 });
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
    setUploadProgress({ current: 0, total: 0 });
    setUploadForm({
      files: [],
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

    console.log('=== 프론트엔드: 이미지 수정 시작 ===');
    console.log('수정할 이미지:', editingImage);
    console.log('외래 키:', {
      category_4_id: (editingImage as any).category_4_id,
      raw_material_id: (editingImage as any).raw_material_id,
      option_product_id: (editingImage as any).option_product_id,
    });

    try {
      const response = await fetch('/api/cloudinary/images', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingImage),
      });

      const result = await response.json();
      console.log('API 응답:', result);

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

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const handleDeleteFolder = async (folderPath: string, folderName: string) => {
    if (!confirm(`"${folderName}" 폴더와 폴더 내 모든 이미지를 삭제하시겠습니까?\n\nCloudinary와 DB에서 모두 삭제됩니다.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/cloudinary/folders/delete?folder_path=${encodeURIComponent(folderPath)}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        alert(`폴더 삭제 완료!\n\n삭제된 이미지: ${result.deleted.imageCount}개`);
        // 폴더 트리 새로고침
        fetchFolderTree();
        // 이미지 목록 새로고침
        if (selectedFolder === folderPath || selectedFolder.startsWith(folderPath + '/')) {
          setSelectedFolder('');
        }
        fetchImages();
      } else {
        alert('폴더 삭제 실패: ' + result.error);
      }
    } catch (error) {
      console.error('폴더 삭제 오류:', error);
      alert('폴더 삭제 중 오류가 발생했습니다.');
    }
  };

  const renderFolderTree = (node: FolderNode, level: number = 0): React.ReactNode => {
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedFolder === node.path;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.path}>
        <div
          className={`flex items-center gap-1 px-2 py-1.5 group hover:bg-gray-100 rounded ${
            isSelected ? 'bg-blue-50 text-blue-600' : ''
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(node.path);
              }}
              className="hover:bg-gray-200 rounded p-0.5"
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          )}
          {!hasChildren && <span className="w-5" />}
          <Folder size={16} className={isSelected ? 'text-blue-600' : 'text-gray-600'} />
          <span
            className="text-sm flex-1 cursor-pointer"
            onClick={() => {
              setSelectedFolder(node.path);
              setCurrentPage(1);
            }}
          >
            {node.name}
          </span>
          {/* 삭제 버튼 (호버 시 표시) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteFolder(node.path, node.name);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-red-600"
            title="폴더 삭제"
          >
            <Trash2 size={14} />
          </button>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map((child) => renderFolderTree(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // 이미지 선택 관련 함수
  const toggleImageSelection = (imageId: string) => {
    const newSelection = new Set(selectedImages);
    if (newSelection.has(imageId)) {
      newSelection.delete(imageId);
    } else {
      newSelection.add(imageId);
    }
    setSelectedImages(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedImages.size === images.length) {
      // 전체 선택 해제
      setSelectedImages(new Set());
    } else {
      // 전체 선택
      setSelectedImages(new Set(images.map(img => img.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedImages.size === 0) {
      alert('선택된 이미지가 없습니다.');
      return;
    }

    if (!confirm(`${selectedImages.size}개의 이미지를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const deletePromises = Array.from(selectedImages).map(id =>
        fetch(`/api/cloudinary/images?id=${id}`, { method: 'DELETE' })
      );

      await Promise.all(deletePromises);
      alert('선택한 이미지가 삭제되었습니다.');
      setSelectedImages(new Set());
      fetchImages();
    } catch (error) {
      console.error('일괄 삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // HTML 빌더 함수들
  const addImageToBuilder = (image: CloudinaryImage) => {
    // 플로팅 HTML 생성기로 이미지 추가 이벤트 발송
    const event = new CustomEvent('addToHtmlBuilder', {
      detail: {
        id: image.id,
        secure_url: image.secure_url,
        title: image.title,
        filename: image.filename,
      }
    });
    window.dispatchEvent(event);
    alert('HTML 생성기에 추가되었습니다!');
  };

  const handleSetRepresentativeImage = async () => {
    if (!selectedForRepresentative) {
      alert('대표이미지로 설정할 이미지를 선택해주세요.');
      return;
    }

    const selectedImage = images.find(img => img.id === selectedForRepresentative);
    if (!selectedImage) {
      alert('선택한 이미지를 찾을 수 없습니다.');
      return;
    }

    try {
      const response = await fetch('/api/cloudinary/images/representative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageId: selectedForRepresentative,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('대표이미지로 설정되었습니다!');
        setSelectedForRepresentative(null); // 선택 해제
        fetchImages(); // 목록 새로고침
      } else {
        alert('대표이미지 설정 실패: ' + result.error);
      }
    } catch (error) {
      console.error('대표이미지 설정 오류:', error);
      alert('대표이미지 설정 중 오류가 발생했습니다.');
    }
  };


  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">이미지 관리</h1>
          <p className="text-gray-600 text-sm mt-1">Cloudinary 이미지 업로드 및 관리</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Upload size={20} />
            이미지 업로드
          </button>
        </div>
      </div>

      {/* 2단 레이아웃: 왼쪽 폴더 트리 + 오른쪽 컨텐츠 */}
      <div className="flex gap-6">
        {/* 왼쪽: 폴더 트리 */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-sm mb-3">폴더 구조</h3>
            <div className="space-y-0.5">
              {/* 전체 보기 옵션 */}
              <div
                className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-gray-100 rounded ${
                  selectedFolder === '' ? 'bg-blue-50 text-blue-600' : ''
                }`}
                onClick={() => {
                  setSelectedFolder('');
                  setCurrentPage(1);
                }}
              >
                <Folder size={16} className={selectedFolder === '' ? 'text-blue-600' : 'text-gray-600'} />
                <span className="text-sm font-medium">전체</span>
              </div>
              {/* 폴더 트리 */}
              {folderTree.map(tree => renderFolderTree(tree))}
            </div>
          </div>
        </div>

        {/* 오른쪽: 필터 및 이미지 목록 */}
        <div className="flex-1">
          {/* 필터 및 검색 */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          {/* 이미지 유형 필터 */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">이미지 유형</label>
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
                  {cat.name}
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
            {/* 대표이미지 설정 버튼 */}
            {viewMode === 'list' && (
              <button
                onClick={handleSetRepresentativeImage}
                disabled={!selectedForRepresentative}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
              >
                대표이미지 설정
              </button>
            )}
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
        <div className="space-y-4">
          {/* 선택 도구 모음 */}
          {selectedImages.size > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
              <span className="text-blue-800 font-medium">{selectedImages.size}개 선택됨</span>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  <Trash2 size={16} className="inline mr-1" />
                  선택 삭제
                </button>
                <button
                  onClick={() => setSelectedImages(new Set())}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                >
                  선택 해제
                </button>
              </div>
            </div>
          )}

          {/* 전체 선택 버튼 */}
          <div className="flex justify-end">
            <button
              onClick={toggleSelectAll}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
            >
              {selectedImages.size === images.length ? '전체 선택 해제' : '전체 선택'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className={`bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden ${
                  selectedImages.has(image.id) ? 'ring-4 ring-blue-500' : ''
                }`}
              >
                <div className="relative aspect-square bg-gray-100">
                  <Image
                    src={image.secure_url}
                    alt={image.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 20vw"
                  />
                  {/* 체크박스 */}
                  <div className="absolute top-1 left-3">
                    <input
                      type="checkbox"
                      checked={selectedImages.has(image.id)}
                      onChange={() => toggleImageSelection(image.id)}
                      className="w-10 h-10 cursor-pointer accent-blue-600 scale-150"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
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

                {/* URL 표시 및 복사 */}
                <div className="mt-2">
                  <div className="flex items-center gap-1 bg-gray-50 rounded px-2 py-1">
                    <span className="text-xs text-gray-600 truncate flex-1" title={image.secure_url}>
                      {image.secure_url}
                    </span>
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(image.secure_url);
                        alert('URL이 복사되었습니다!');
                      }}
                      className="p-1 hover:bg-gray-200 rounded flex-shrink-0"
                      title="URL 복사"
                    >
                      <Copy size={14} className="text-gray-600" />
                    </button>
                  </div>
                </div>

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
                    onClick={() => addImageToBuilder(image)}
                    className="flex-1 px-2 py-1 text-xs bg-green-100 text-green-600 rounded hover:bg-green-200"
                    title="상세페이지에 추가"
                  >
                    <Plus size={12} className="inline mr-1" />
                    추가
                  </button>
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
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase w-12">선택</th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase w-20">미리보기</th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase w-32">파일명</th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase">URL</th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24">유형</th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24">크기</th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase w-20">상태</th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24">통계</th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase w-20">작업</th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24">대표이미지</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {images.map((image) => (
                <tr key={image.id} className="hover:bg-gray-50">
                  {/* 선택 라디오 버튼 */}
                  <td className="px-2 py-3">
                    <div className="flex justify-center">
                      <input
                        type="radio"
                        name="representativeImage"
                        checked={selectedForRepresentative === image.id}
                        onChange={() => setSelectedForRepresentative(image.id)}
                        className="w-4 h-4 cursor-pointer accent-blue-600"
                      />
                    </div>
                  </td>
                  {/* 미리보기 이미지 */}
                  <td className="px-2 py-3">
                    <div className="flex justify-center">
                      <div className="relative w-16 h-16 bg-gray-100 rounded">
                        <Image
                          src={image.secure_url}
                          alt={image.title}
                          fill
                          className="object-cover rounded"
                          sizes="64px"
                        />
                      </div>
                    </div>
                  </td>
                  {/* 파일명 */}
                  <td className="px-2 py-3 text-center">
                    <p className="font-medium text-sm truncate">{image.filename}</p>
                    {image.title !== image.filename && (
                      <p className="text-xs text-gray-500 mt-1 truncate">{image.title}</p>
                    )}
                  </td>
                  {/* URL */}
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={image.secure_url}
                        readOnly
                        className="w-full px-2 py-1 text-xs bg-gray-50 border border-gray-200 rounded font-mono"
                      />
                      <button
                        onClick={async () => {
                          await navigator.clipboard.writeText(image.secure_url);
                          // 임시로 복사됨 표시
                          const btn = document.activeElement as HTMLButtonElement;
                          const originalText = btn.innerHTML;
                          btn.innerHTML = '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>';
                          setTimeout(() => {
                            btn.innerHTML = originalText;
                          }, 1000);
                        }}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded flex-shrink-0"
                        title="URL 복사"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </td>
                  {/* 유형 */}
                  <td className="px-2 py-3 text-xs text-center">{image.category}</td>
                  {/* 크기 */}
                  <td className="px-2 py-3 text-xs text-center">
                    <p>{formatFileSize(image.file_size)}</p>
                    <p className="text-xs text-gray-500">{image.width} × {image.height}</p>
                  </td>
                  {/* 상태 */}
                  <td className="px-2 py-3">
                    <div className="flex gap-1 justify-center">
                      {image.is_public ? (
                        <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-xs">공개</span>
                      ) : (
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">비공개</span>
                      )}
                    </div>
                  </td>
                  {/* 통계 */}
                  <td className="px-2 py-3 text-xs text-gray-500 text-center">
                    <p>👁 {image.view_count}</p>
                    <p>⬇ {image.download_count}</p>
                  </td>
                  {/* 작업 */}
                  <td className="px-2 py-3">
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={() => setEditingImage(image)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        title="수정"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(image.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        title="삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                  {/* 대표이미지 */}
                  <td className="px-2 py-3 text-center">
                    {image.is_representative && (
                      <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs font-medium">
                        대표이미지
                      </span>
                    )}
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
        </div>
        {/* 오른쪽 컨텐츠 영역 끝 */}
      </div>
      {/* 2단 레이아웃 끝 */}

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
                  {/* 루트 폴더 선택 */}
                  <div>
                    <label className="block text-[14px] font-medium text-gray-700 mb-2">저장 위치</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 whitespace-nowrap">
                        <input
                          type="radio"
                          value="dalraemarket"
                          checked={rootFolder === 'dalraemarket'}
                          onChange={(e) => {
                            setRootFolder(e.target.value as 'dalraemarket');
                            // dalraemarket은 공개, 다운로드 가능으로 설정
                            setUploadForm({
                              ...uploadForm,
                              is_public: true,
                              is_downloadable: true
                            });
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-[14px]">공개용 (dalraemarket) - 플랫폼 사용자 다운로드 가능</span>
                      </label>
                      <label className="flex items-center gap-2 whitespace-nowrap">
                        <input
                          type="radio"
                          value="papafresh"
                          checked={rootFolder === 'papafresh'}
                          onChange={(e) => {
                            setRootFolder(e.target.value as 'papafresh');
                            setUploadType('personal');
                            // papafresh는 비공개, 다운로드 불가로 설정
                            setUploadForm({
                              ...uploadForm,
                              is_public: false,
                              is_downloadable: false
                            });
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-[14px]">전용 (papafresh) - 상세페이지 관리용</span>
                      </label>
                    </div>
                  </div>

                  {/* 업로드 타입 선택 (dalraemarket 선택 시만 표시) */}
                  {rootFolder === 'dalraemarket' && (
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
                  )}

                  {/* 품목/원물/옵션상품 선택 (dalraemarket 선택 시만 표시) */}
                  {rootFolder === 'dalraemarket' && (
                    <>
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
                      ) : uploadType === 'option_product' && (
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
                    </>
                  )}

                  {/* 파일 선택 */}
                  <div>
                    <label className="block text-[14px] font-medium text-gray-700 mb-2">파일 (여러 개 선택 가능)</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px]"
                    />
                    {uploadForm.files.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-[14px] text-gray-700 font-medium">
                          선택된 파일: {uploadForm.files.length}개
                        </p>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {uploadForm.files.map((file, index) => (
                            <p key={index} className="text-[12px] text-gray-500 truncate">
                              {file.name} ({formatFileSize(file.size)})
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* 업로드 진행 상태 */}
                    {uploading && uploadProgress.total > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="flex justify-between text-[12px] text-gray-600">
                          <span>업로드 중...</span>
                          <span>{uploadProgress.current} / {uploadProgress.total}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 이미지 유형 */}
                  <div>
                    <label className="block text-[14px] font-medium text-gray-700 mb-2">이미지 유형</label>
                    <select
                      value={uploadForm.category}
                      onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px]"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
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

                  {/* 공개 설정 - dalraemarket만 수정 가능 */}
                  <div>
                    <label className="block text-[14px] font-medium text-gray-700 mb-2">
                      접근 권한
                      {rootFolder === 'papafresh' && (
                        <span className="ml-2 text-[12px] text-gray-500">(전용 폴더는 자동으로 비공개/다운로드 불가)</span>
                      )}
                    </label>
                    <div className="flex gap-4">
                      <label className={`flex items-center gap-2 whitespace-nowrap ${rootFolder === 'papafresh' ? 'opacity-50' : ''}`}>
                        <input
                          type="checkbox"
                          checked={uploadForm.is_public}
                          onChange={(e) => setUploadForm({ ...uploadForm, is_public: e.target.checked })}
                          disabled={rootFolder === 'papafresh'}
                          className="w-4 h-4"
                        />
                        <span className="text-[14px]">
                          공개 (플랫폼 사용자에게 보임)
                        </span>
                      </label>
                      <label className={`flex items-center gap-2 whitespace-nowrap ${rootFolder === 'papafresh' ? 'opacity-50' : ''}`}>
                        <input
                          type="checkbox"
                          checked={uploadForm.is_downloadable}
                          onChange={(e) => setUploadForm({ ...uploadForm, is_downloadable: e.target.checked })}
                          disabled={rootFolder === 'papafresh'}
                          className="w-4 h-4"
                        />
                        <span className="text-[14px]">
                          다운로드 가능 (플랫폼 사용자가 다운로드 가능)
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleUpload}
                      disabled={uploading || uploadForm.files.length === 0}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-[14px] whitespace-nowrap"
                    >
                      {uploading ?
                        (uploadProgress.total > 1 ? `업로드 중... (${uploadProgress.current}/${uploadProgress.total})` : '업로드 중...')
                        : '업로드'}
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

                {/* 연결 정보 섹션 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-900 mb-3">상품/품목 연결 정보</h3>

                  {/* 품목 선택 */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">품목 (Category 4)</label>
                    <select
                      value={(editingImage as any).category_4_id || ''}
                      onChange={(e) => setEditingImage({
                        ...editingImage,
                        category_4_id: e.target.value || null,
                        // 다른 외래 키 초기화
                        raw_material_id: null,
                        option_product_id: null
                      } as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">선택 안 함</option>
                      {productCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.category_4}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 원물 선택 */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">원물</label>
                    <select
                      value={(editingImage as any).raw_material_id || ''}
                      onChange={(e) => setEditingImage({
                        ...editingImage,
                        raw_material_id: e.target.value || null,
                        // 다른 외래 키 초기화
                        category_4_id: null,
                        option_product_id: null
                      } as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">선택 안 함</option>
                      {rawMaterials.map((material) => (
                        <option key={material.id} value={material.id}>
                          {material.material_name} ({material.material_code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 옵션상품 선택 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">옵션상품</label>
                    <select
                      value={(editingImage as any).option_product_id || ''}
                      onChange={(e) => setEditingImage({
                        ...editingImage,
                        option_product_id: e.target.value || null,
                        // 다른 외래 키 초기화
                        category_4_id: null,
                        raw_material_id: null
                      } as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">선택 안 함</option>
                      {optionProducts.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.option_name} ({product.option_code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <p className="text-xs text-blue-700 mt-3">
                    💡 하나만 선택 가능합니다. 선택 시 다른 항목은 자동으로 해제됩니다.
                  </p>
                </div>

                {/* 이미지 유형 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이미지 유형</label>
                  <select
                    value={editingImage.category}
                    onChange={(e) => setEditingImage({ ...editingImage, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
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
