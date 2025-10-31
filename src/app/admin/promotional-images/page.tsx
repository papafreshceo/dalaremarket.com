'use client';

import { useState, useEffect } from 'react';
import { Upload, Trash2, Save, Eye, EyeOff, Link as LinkIcon } from 'lucide-react';
import Image from 'next/image';

interface PromotionalImage {
  id: number;
  image_url: string;
  secure_url?: string;
  public_id?: string;
  display_order: number;
  title?: string;
  link_url?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function PromotionalImagesPage() {
  const [images, setImages] = useState<PromotionalImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<number | null>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await fetch('/api/admin/promotional-images');
      const result = await response.json();

      if (result.success) {
        setImages(result.data || []);
      }
    } catch (error) {
      console.error('이미지 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (displayOrder: number, file: File) => {
    try {
      setUploading(displayOrder);

      // Cloudinary 업로드
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'dalreamarket_preset');
      formData.append('folder', 'promotional');

      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const cloudinaryData = await cloudinaryResponse.json();

      if (!cloudinaryData.secure_url) {
        throw new Error('이미지 업로드 실패');
      }

      // DB 업데이트
      const existingImage = images.find((img) => img.display_order === displayOrder);

      if (existingImage) {
        // 기존 이미지 수정
        const response = await fetch('/api/admin/promotional-images', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: existingImage.id,
            image_url: cloudinaryData.secure_url,
            secure_url: cloudinaryData.secure_url,
            public_id: cloudinaryData.public_id,
          }),
        });

        const result = await response.json();

        if (result.success) {
          alert('이미지가 업데이트되었습니다.');
          fetchImages();
        }
      } else {
        // 새 이미지 생성
        const response = await fetch('/api/admin/promotional-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url: cloudinaryData.secure_url,
            secure_url: cloudinaryData.secure_url,
            public_id: cloudinaryData.public_id,
            display_order: displayOrder,
            title: `홍보 이미지 ${displayOrder}`,
            is_active: true,
          }),
        });

        const result = await response.json();

        if (result.success) {
          alert('이미지가 추가되었습니다.');
          fetchImages();
        }
      }
    } catch (error) {
      console.error('업로드 오류:', error);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(null);
    }
  };

  const handleTitleUpdate = async (id: number, title: string) => {
    try {
      const response = await fetch('/api/admin/promotional-images', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title }),
      });

      const result = await response.json();

      if (result.success) {
        fetchImages();
      }
    } catch (error) {
      console.error('제목 수정 오류:', error);
    }
  };

  const handleLinkUpdate = async (id: number, link_url: string) => {
    try {
      const response = await fetch('/api/admin/promotional-images', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, link_url }),
      });

      const result = await response.json();

      if (result.success) {
        fetchImages();
      }
    } catch (error) {
      console.error('링크 수정 오류:', error);
    }
  };

  const toggleActive = async (id: number, is_active: boolean) => {
    try {
      const response = await fetch('/api/admin/promotional-images', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !is_active }),
      });

      const result = await response.json();

      if (result.success) {
        fetchImages();
      }
    } catch (error) {
      console.error('활성화 토글 오류:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/admin/promotional-images?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        alert('삭제되었습니다.');
        fetchImages();
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">홍보 이미지 관리</h1>
        <p className="text-gray-600">메인 페이지에 표시될 홍보 이미지를 관리합니다 (4개)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((order) => {
          const image = images.find((img) => img.display_order === order);
          const isUploading = uploading === order;

          return (
            <div
              key={order}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">이미지 {order}</h3>
                {image && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleActive(image.id, image.is_active)}
                      className={`p-2 rounded ${
                        image.is_active
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={image.is_active ? '활성화됨' : '비활성화됨'}
                    >
                      {image.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    <button
                      onClick={() => handleDelete(image.id)}
                      className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                      title="삭제"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>

              {/* 이미지 미리보기 */}
              <div className="mb-4">
                <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                  {image && image.image_url ? (
                    <Image
                      src={image.image_url}
                      alt={image.title || `홍보 이미지 ${order}`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <p className="text-gray-400">이미지 없음</p>
                  )}
                </div>
              </div>

              {/* 파일 업로드 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이미지 업로드
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageUpload(order, file);
                    }
                  }}
                  disabled={isUploading}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                />
                {isUploading && <p className="text-sm text-blue-600 mt-2">업로드 중...</p>}
              </div>

              {/* 제목 입력 */}
              {image && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      제목
                    </label>
                    <input
                      type="text"
                      value={image.title || ''}
                      onChange={(e) => {
                        const newImages = images.map((img) =>
                          img.id === image.id ? { ...img, title: e.target.value } : img
                        );
                        setImages(newImages);
                      }}
                      onBlur={(e) => handleTitleUpdate(image.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="이미지 제목"
                    />
                  </div>

                  {/* 링크 URL 입력 */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <LinkIcon size={16} className="inline mr-1" />
                      클릭 시 이동할 URL (선택사항)
                    </label>
                    <input
                      type="url"
                      value={image.link_url || ''}
                      onChange={(e) => {
                        const newImages = images.map((img) =>
                          img.id === image.id ? { ...img, link_url: e.target.value } : img
                        );
                        setImages(newImages);
                      }}
                      onBlur={(e) => handleLinkUpdate(image.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com"
                    />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
