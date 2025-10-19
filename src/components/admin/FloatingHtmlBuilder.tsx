'use client';

import { useState, useEffect, useRef } from 'react';
import { Code, X, Minimize2, Maximize2, Copy, ArrowUp, ArrowDown, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';

interface CloudinaryImage {
  id: string;
  secure_url: string;
  title: string;
  filename: string;
}

interface FloatingHtmlBuilderProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FloatingHtmlBuilder({ isOpen, onClose }: FloatingHtmlBuilderProps) {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [size, setSize] = useState({ width: 600, height: 600 });

  const [builderImages, setBuilderImages] = useState<CloudinaryImage[]>([]);
  const [youtubeUrls, setYoutubeUrls] = useState<string[]>([]);
  const [newYoutubeUrl, setNewYoutubeUrl] = useState('');
  const [generatedHtml, setGeneratedHtml] = useState('');

  const windowRef = useRef<HTMLDivElement>(null);

  // 로컬 스토리지에서 데이터 불러오기
  useEffect(() => {
    const savedImages = localStorage.getItem('htmlBuilderImages');
    const savedYoutubeUrls = localStorage.getItem('htmlBuilderYoutubeUrls');

    if (savedImages) {
      try {
        setBuilderImages(JSON.parse(savedImages));
      } catch (e) {
        console.error('이미지 데이터 로드 실패:', e);
      }
    }

    if (savedYoutubeUrls) {
      try {
        setYoutubeUrls(JSON.parse(savedYoutubeUrls));
      } catch (e) {
        console.error('YouTube URL 데이터 로드 실패:', e);
      }
    }
  }, []);

  // 데이터 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    localStorage.setItem('htmlBuilderImages', JSON.stringify(builderImages));
  }, [builderImages]);

  useEffect(() => {
    localStorage.setItem('htmlBuilderYoutubeUrls', JSON.stringify(youtubeUrls));
  }, [youtubeUrls]);

  // 전역 이벤트 리스너 (다른 페이지에서 이미지/영상 추가)
  useEffect(() => {
    const handleAddImage = (e: CustomEvent) => {
      const image = e.detail;
      if (!builderImages.find(img => img.id === image.id)) {
        setBuilderImages([...builderImages, image]);
      }
    };

    const handleAddYoutube = (e: CustomEvent) => {
      const url = e.detail;
      if (!youtubeUrls.includes(url)) {
        setYoutubeUrls([...youtubeUrls, url]);
      }
    };

    window.addEventListener('addToHtmlBuilder' as any, handleAddImage);
    window.addEventListener('addYoutubeToBuilder' as any, handleAddYoutube);

    return () => {
      window.removeEventListener('addToHtmlBuilder' as any, handleAddImage);
      window.removeEventListener('addYoutubeToBuilder' as any, handleAddYoutube);
    };
  }, [builderImages, youtubeUrls]);

  // 드래그 이벤트 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.no-drag')) return;

    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const extractYoutubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  const addYoutubeUrl = () => {
    if (!newYoutubeUrl.trim()) {
      alert('YouTube URL을 입력해주세요.');
      return;
    }

    const videoId = extractYoutubeVideoId(newYoutubeUrl);
    if (!videoId) {
      alert('올바른 YouTube URL이 아닙니다.');
      return;
    }

    setYoutubeUrls([...youtubeUrls, newYoutubeUrl]);
    setNewYoutubeUrl('');
  };

  const removeYoutubeUrl = (index: number) => {
    setYoutubeUrls(youtubeUrls.filter((_, i) => i !== index));
  };

  const moveYoutubeUp = (index: number) => {
    if (index === 0) return;
    const newUrls = [...youtubeUrls];
    [newUrls[index - 1], newUrls[index]] = [newUrls[index], newUrls[index - 1]];
    setYoutubeUrls(newUrls);
  };

  const moveYoutubeDown = (index: number) => {
    if (index === youtubeUrls.length - 1) return;
    const newUrls = [...youtubeUrls];
    [newUrls[index], newUrls[index + 1]] = [newUrls[index + 1], newUrls[index]];
    setYoutubeUrls(newUrls);
  };

  const removeImageFromBuilder = (imageId: string) => {
    setBuilderImages(builderImages.filter(img => img.id !== imageId));
  };

  const moveImageUp = (index: number) => {
    if (index === 0) return;
    const newImages = [...builderImages];
    [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    setBuilderImages(newImages);
  };

  const moveImageDown = (index: number) => {
    if (index === builderImages.length - 1) return;
    const newImages = [...builderImages];
    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    setBuilderImages(newImages);
  };

  const generateHtml = () => {
    let html = '<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="UTF-8">\n  <style>\n    body { margin: 0; padding: 0; font-family: Arial, sans-serif; }\n    .product-detail { max-width: 1000px; margin: 0 auto; }\n    .video-container { position: relative; width: 100%; padding-bottom: 56.25%; margin-bottom: 20px; }\n    .video-container iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }\n    .product-image { width: 100%; display: block; margin-bottom: 0; }\n  </style>\n</head>\n<body>\n  <div class="product-detail">\n';

    // YouTube 동영상들 추가
    youtubeUrls.forEach((url) => {
      const videoId = extractYoutubeVideoId(url);
      if (videoId) {
        html += `    <div class="video-container">\n      <iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>\n    </div>\n`;
      }
    });

    // 이미지들 추가
    builderImages.forEach((image) => {
      html += `    <img src="${image.secure_url}" alt="${image.title}" class="product-image" />\n`;
    });

    html += '  </div>\n</body>\n</html>';
    setGeneratedHtml(html);
  };

  const copyHtmlToClipboard = async () => {
    if (!generatedHtml) {
      alert('먼저 HTML을 생성해주세요.');
      return;
    }
    await navigator.clipboard.writeText(generatedHtml);
    alert('HTML 코드가 복사되었습니다!');
  };

  const clearAll = () => {
    if (confirm('모든 이미지와 YouTube URL을 삭제하시겠습니까?')) {
      setBuilderImages([]);
      setYoutubeUrls([]);
      setGeneratedHtml('');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={windowRef}
      className="fixed bg-white rounded-lg shadow-2xl border-2 border-purple-200 overflow-hidden z-[9999]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isMinimized ? '300px' : `${size.width}px`,
        height: isMinimized ? 'auto' : `${size.height}px`,
        cursor: isDragging ? 'grabbing' : 'default',
      }}
    >
      {/* 헤더 (드래그 가능) */}
      <div
        className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-4 py-3 flex items-center justify-between cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <Code size={20} />
          <h3 className="font-semibold text-sm">HTML 생성기</h3>
          {(youtubeUrls.length > 0 || builderImages.length > 0) && (
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
              {youtubeUrls.length + builderImages.length}개
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 no-drag">
          <button
            onClick={clearAll}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
            title="모두 삭제"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
            title={isMinimized ? '확대' : '최소화'}
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
            title="닫기"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* 내용 */}
      {!isMinimized && (
        <div className="overflow-y-auto no-drag" style={{ height: `${size.height - 52}px` }}>
          <div className="p-4 space-y-4">
            {/* YouTube URL 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                YouTube 동영상 ({youtubeUrls.length}개)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newYoutubeUrl}
                  onChange={(e) => setNewYoutubeUrl(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addYoutubeUrl();
                    }
                  }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  onClick={addYoutubeUrl}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm whitespace-nowrap"
                >
                  <Plus size={14} className="inline mr-1" />
                  추가
                </button>
              </div>

              {/* YouTube URL 리스트 */}
              {youtubeUrls.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {youtubeUrls.map((url, index) => {
                    const videoId = extractYoutubeVideoId(url);
                    return (
                      <div key={index} className="flex items-center gap-2 p-2 bg-red-50 rounded text-xs">
                        <span className="flex-shrink-0 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-semibold">
                          {index + 1}
                        </span>
                        {videoId && (
                          <div className="relative w-16 h-12 bg-gray-100 rounded flex-shrink-0">
                            <Image
                              src={`https://img.youtube.com/vi/${videoId}/default.jpg`}
                              alt="YouTube thumbnail"
                              fill
                              className="object-cover rounded"
                              sizes="64px"
                            />
                          </div>
                        )}
                        <span className="flex-1 truncate text-gray-700">{url}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => moveYoutubeUp(index)}
                            disabled={index === 0}
                            className="p-1 hover:bg-red-100 rounded disabled:opacity-30"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            onClick={() => moveYoutubeDown(index)}
                            disabled={index === youtubeUrls.length - 1}
                            className="p-1 hover:bg-red-100 rounded disabled:opacity-30"
                          >
                            <ArrowDown size={12} />
                          </button>
                          <button
                            onClick={() => removeYoutubeUrl(index)}
                            className="p-1 hover:bg-red-200 rounded text-red-600"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 이미지 리스트 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이미지 ({builderImages.length}개)
              </label>
              {builderImages.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-sm text-gray-500">
                  이미지 관리 페이지에서 이미지를 추가하세요
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {builderImages.map((image, index) => (
                    <div key={image.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
                      <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-semibold">
                        {index + 1}
                      </span>
                      <div className="relative w-12 h-12 bg-gray-100 rounded flex-shrink-0">
                        <Image
                          src={image.secure_url}
                          alt={image.title}
                          fill
                          className="object-cover rounded"
                          sizes="48px"
                        />
                      </div>
                      <span className="flex-1 truncate">{image.title}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => moveImageUp(index)}
                          disabled={index === 0}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          onClick={() => moveImageDown(index)}
                          disabled={index === builderImages.length - 1}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                        >
                          <ArrowDown size={12} />
                        </button>
                        <button
                          onClick={() => removeImageFromBuilder(image.id)}
                          className="p-1 hover:bg-red-100 rounded text-red-600"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 버튼 */}
            <div className="flex gap-2">
              <button
                onClick={generateHtml}
                disabled={builderImages.length === 0 && youtubeUrls.length === 0}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                <Code size={14} className="inline mr-1" />
                HTML 생성
              </button>
              {generatedHtml && (
                <button
                  onClick={copyHtmlToClipboard}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                >
                  <Copy size={14} className="inline mr-1" />
                  복사
                </button>
              )}
            </div>

            {/* 생성된 HTML */}
            {generatedHtml && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">생성된 HTML</label>
                <pre className="bg-gray-900 text-green-400 p-3 rounded-lg overflow-x-auto text-xs max-h-48">
                  <code>{generatedHtml}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
