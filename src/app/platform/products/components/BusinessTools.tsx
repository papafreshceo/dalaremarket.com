'use client'

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toolIcons } from '@/components/tools/ToolIcons';

interface BusinessToolsProps {
  isMobile?: boolean;
  onToolClick?: (toolId: string) => void;
}

interface Tool {
  id: string;
  name: string;
  icon_gradient?: string;
}

export default function BusinessTools({ isMobile = false, onToolClick }: BusinessToolsProps) {
  const router = useRouter();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);

  useEffect(() => {
    const fetchTools = async () => {
      try {
        const response = await fetch('/api/tools');
        const data = await response.json();

        if (data.success && data.tools) {
          // 최대 8개까지만 표시
          setTools(data.tools.slice(0, 8));
        }
      } catch (error) {
        console.error('도구 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTools();
  }, []);

  if (loading || tools.length === 0) {
    return null;
  }

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.5)',
      border: '1px solid rgba(222, 226, 230, 0.3)',
      borderRadius: '16px',
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      backdropFilter: 'blur(10px)'
    }}>
      {tools.map((tool, idx) => (
        <div
          key={tool.id}
          onClick={() => {
            if (onToolClick) {
              onToolClick(tool.id);
            } else {
              router.push('/platform/tools');
            }
          }}
          onMouseEnter={() => setHoveredTool(tool.id)}
          onMouseLeave={() => setHoveredTool(null)}
          style={{
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '12px',
            transition: 'all 0.2s',
            background: hoveredTool === tool.id ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
            transform: hoveredTool === tool.id ? 'scale(1.05)' : 'scale(1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            background: tool.icon_gradient || `linear-gradient(135deg, hsl(${idx * 45}, 70%, 50%) 0%, hsl(${idx * 45 + 30}, 70%, 60%) 100%)`,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {toolIcons[tool.id] || (
              <div style={{
                width: '20px',
                height: '20px',
                background: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '6px'
              }} />
            )}
          </div>

          {/* 툴팁 - 아이콘 왼쪽에 표시 */}
          {hoveredTool === tool.id && (
            <div style={{
              position: 'absolute',
              right: 'calc(100% + 12px)',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(31, 41, 55, 0.5)',
              color: '#ffffff',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(10px)',
              zIndex: 10000,
              pointerEvents: 'none'
            }}>
              {tool.name}
              {/* 화살표 */}
              <div style={{
                position: 'absolute',
                right: '-6px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: 0,
                height: 0,
                borderTop: '6px solid transparent',
                borderBottom: '6px solid transparent',
                borderLeft: '6px solid rgba(31, 41, 55, 0.5)'
              }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
