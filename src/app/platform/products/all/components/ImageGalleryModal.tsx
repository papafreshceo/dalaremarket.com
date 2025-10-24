'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Modal } from '@/components/ui/Modal';

interface ImageGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category4: string;
  category4Id?: number;
}

interface CloudinaryImage {
  id: string;
  secure_url: string;
  cloudinary_id: string;
  filename?: string;
  width: number;
  height: number;
  format: string;
  image_type?: string;
  created_at: string;
}

export default function ImageGalleryModal({ isOpen, onClose, category4, category4Id }: ImageGalleryModalProps) {
  const [images, setImages] = useState<CloudinaryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<'all' | 'general' | 'detail_page'>('all');
  const supabase = createClient();

  useEffect(() => {
    if (isOpen && category4Id) {
      fetchImages();
    }
  }, [isOpen, category4Id]);

  const fetchImages = async () => {
    try {
      setLoading(true);

      console.log('이미지 조회 시작 - category4Id:', category4Id);

      const { data, error } = await supabase
        .from('cloudinary_images')
        .select('*')
        .eq('category_4_id', category4Id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('이미지 조회 오류:', error);
        return;
      }

      console.log('조회된 이미지 개수:', data?.length);
      console.log('조회된 이미지 데이터:', data);
      if (data && data.length > 0) {
        console.log('첫 번째 이미지 상세:', {
          secure_url: data[0].secure_url,
          cloudinary_id: data[0].cloudinary_id,
          filename: data[0].filename,
          image_type: data[0].image_type,
          width: data[0].width,
          height: data[0].height
        });
      }
      setImages(data || []);
    } catch (error) {
      console.error('이미지 조회 중 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${category4} - 이미지 갤러리`}
      size="full"
    >
      <div style={{ width: '1400px', height: '1200px' }}>
        {/* 이미지 타입 필터 탭 */}
        <div className="flex gap-2 mb-4 border-b pb-2">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-4 py-2 text-sm rounded-t-lg transition-colors ${
              selectedType === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            전체 ({images.length})
          </button>
          <button
            onClick={() => setSelectedType('general')}
            className={`px-4 py-2 text-sm rounded-t-lg transition-colors ${
              selectedType === 'general'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            일반 이미지 ({images.filter(img => img.image_type === 'general' || !img.image_type).length})
          </button>
          <button
            onClick={() => setSelectedType('detail_page')}
            className={`px-4 py-2 text-sm rounded-t-lg transition-colors ${
              selectedType === 'detail_page'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            상세페이지 ({images.filter(img => img.image_type === 'detail_page').length})
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">이미지 로딩 중...</p>
            </div>
          </div>
        ) : images.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500 text-lg">등록된 이미지가 없습니다.</p>
            </div>
          </div>
        ) : (
          (() => {
            const filteredImages = images.filter(image => {
              if (selectedType === 'all') return true;
              if (selectedType === 'general') return image.image_type === 'general' || !image.image_type;
              return image.image_type === selectedType;
            });

            if (filteredImages.length === 0) {
              return (
                <div className="flex items-center justify-center" style={{ height: '1100px' }}>
                  <div className="text-center">
                    <p className="text-gray-500 text-lg">
                      {selectedType === 'all' ? '등록된 이미지가 없습니다.' :
                       selectedType === 'general' ? '일반 이미지가 없습니다.' :
                       '상세페이지 이미지가 없습니다.'}
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-4 gap-4 overflow-y-auto p-4" style={{ maxHeight: '1100px' }}>
                {filteredImages.map((image) => (
                  <div
                    key={image.id}
                    className="relative bg-white rounded-lg overflow-hidden border border-gray-200"
                    style={{ width: '100%', height: '250px' }}
                  >
                    <img
                      src={image.secure_url}
                      alt={image.filename || image.cloudinary_id}
                      className="w-full h-full object-cover"
                      onLoad={(e) => {
                        console.log('✅ 이미지 로드 성공:', image.secure_url);
                      }}
                      onError={(e) => {
                        console.error('❌ 이미지 로드 실패:', {
                          url: image.secure_url,
                          cloudinary_id: image.cloudinary_id,
                          filename: image.filename
                        });
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext fill="%23ef4444" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="14"%3E이미지 로드 실패%3C/text%3E%3C/svg%3E';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/50 transition-all duration-200 flex items-center justify-center pointer-events-none">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white text-center px-2 pointer-events-auto">
                        <p className="text-xs truncate">{image.filename || (image.cloudinary_id ? image.cloudinary_id.split('/').pop() : '이미지')}</p>
                        <p className="text-xs mt-1">{image.width} x {image.height}</p>
                        {image.image_type === 'detail_page' && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-[10px] bg-blue-500 text-white rounded">상세페이지</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()
        )}
      </div>
    </Modal>
  );
}
