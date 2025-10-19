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
  public_id: string;
  width: number;
  height: number;
  format: string;
  created_at: string;
}

export default function ImageGalleryModal({ isOpen, onClose, category4, category4Id }: ImageGalleryModalProps) {
  const [images, setImages] = useState<CloudinaryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (isOpen && category4Id) {
      fetchImages();
    }
  }, [isOpen, category4Id]);

  const fetchImages = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('cloudinary_images')
        .select('*')
        .eq('category_4_id', category4Id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('이미지 조회 오류:', error);
        return;
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
          <div className="grid grid-cols-4 gap-4 overflow-y-auto" style={{ maxHeight: '1200px' }}>
            {images.map((image) => (
              <div
                key={image.id}
                className="relative group bg-gray-100 rounded-lg overflow-hidden aspect-square"
              >
                <img
                  src={image.secure_url}
                  alt={image.public_id}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white text-center px-2">
                    <p className="text-xs truncate">{image.public_id.split('/').pop()}</p>
                    <p className="text-xs mt-1">{image.width} x {image.height}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
