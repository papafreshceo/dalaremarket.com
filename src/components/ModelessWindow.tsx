'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { X, Minus, Maximize2, Minimize2 } from 'lucide-react';

interface ModelessWindowProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  defaultWidth?: number;
  defaultHeight?: number;
  defaultX?: number;
  defaultY?: number;
}

export default function ModelessWindow({
  title,
  isOpen,
  onClose,
  children,
  defaultWidth = 1000,
  defaultHeight = 700,
  defaultX = 100,
  defaultY = 50,
}: ModelessWindowProps) {
  const [position, setPosition] = useState({ x: defaultX, y: defaultY });
  const [size, setSize] = useState({ width: defaultWidth, height: defaultHeight });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const windowRef = useRef<HTMLDivElement>(null);

  // 드래그 시작
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMaximized) return;

    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  // 드래그 중
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      // 화면 경계 계산
      const windowWidth = windowRef.current?.offsetWidth || size.width;
      const windowHeight = windowRef.current?.offsetHeight || size.height;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // 새 위치 계산
      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;

      // 화면 밖으로 나가지 않도록 제한
      // 최소 50px은 화면 안에 보이도록
      const minVisibleWidth = Math.min(50, windowWidth);
      const minVisibleHeight = 40; // 헤더 높이

      newX = Math.max(-windowWidth + minVisibleWidth, Math.min(newX, viewportWidth - minVisibleWidth));
      newY = Math.max(0, Math.min(newY, viewportHeight - minVisibleHeight));

      setPosition({
        x: newX,
        y: newY,
      });
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
  }, [isDragging, dragOffset, size]);

  // 최대화/복원
  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  // 최소화
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  if (!isOpen) return null;

  const windowStyle = isMaximized
    ? {
        left: 0,
        top: 0,
        width: '100vw',
        height: '100vh',
      }
    : isMinimized
    ? {
        left: position.x,
        top: position.y,
        width: size.width,
        height: 'auto',
      }
    : {
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
      };

  return (
    <div
      ref={windowRef}
      className="fixed bg-white rounded-lg shadow-2xl border border-gray-300 flex flex-col"
      style={{
        ...windowStyle,
        zIndex: 1000,
        cursor: isDragging ? 'move' : 'default',
      }}
    >
      {/* 헤더 (드래그 가능) */}
      <div
        onMouseDown={handleMouseDown}
        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-t-lg flex items-center justify-between cursor-move select-none"
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMinimize}
            className="p-1 hover:bg-blue-500 rounded transition-colors"
            title="최소화"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={toggleMaximize}
            className="p-1 hover:bg-blue-500 rounded transition-colors"
            title={isMaximized ? '복원' : '최대화'}
          >
            {isMaximized ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-red-500 rounded transition-colors"
            title="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 본문 */}
      {!isMinimized && (
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      )}
    </div>
  );
}
