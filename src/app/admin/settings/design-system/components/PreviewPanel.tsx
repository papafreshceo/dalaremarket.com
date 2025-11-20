'use client';

import { useState } from 'react';

interface PreviewPanelProps {
  settings: any;
}

export default function PreviewPanel({ settings }: PreviewPanelProps) {
  const [previewTheme, setPreviewTheme] = useState<'light' | 'medium' | 'dark'>('light');

  const getBackgroundStyle = () => {
    const bgData = settings.background?.[previewTheme] || {};

    if (bgData.type === 'gradient' && bgData.gradient?.enabled) {
      const colors = bgData.gradient?.colors || [];
      if (colors.length === 0) return bgData.solid?.color || '#ffffff';

      const colorStops = colors
        .map((c: any) => `${c.color} ${c.position}%`)
        .join(', ');

      return `linear-gradient(${bgData.gradient.direction}, ${colorStops})`;
    }

    return bgData.solid?.color || '#ffffff';
  };

  const getPrimaryColor = () => {
    return settings.colors?.primary?.base || '#2563eb';
  };

  const getTextColor = () => {
    // 테마에 따라 자동으로 텍스트 색상 조정
    if (previewTheme === 'dark') {
      return settings.typography?.color?.default?.color || '#f9fafb';
    } else if (previewTheme === 'medium') {
      return settings.typography?.color?.default?.color || '#1f2937';
    }
    return settings.typography?.color?.default?.color || '#1f2937';
  };

  const getSecondaryTextColor = () => {
    // 보조 텍스트 색상도 테마에 따라 조정
    if (previewTheme === 'dark') {
      return settings.typography?.color?.secondary?.color || '#9ca3af';
    } else if (previewTheme === 'medium') {
      return settings.typography?.color?.secondary?.color || '#6b7280';
    }
    return settings.typography?.color?.secondary?.color || '#6b7280';
  };

  const getBorderRadius = () => {
    return settings.border?.default?.radius || 8;
  };

  const getShadow = () => {
    const shadow = settings.shadow?.default;
    if (!shadow || shadow.enabled === false) return 'none';

    const { x_offset = 0, y_offset = 4, blur = 6, spread = 0, color } = shadow;
    const shadowColor = color?.color || '#000000';
    const opacity = (color?.opacity || 10) / 100;

    return `${x_offset}px ${y_offset}px ${blur}px ${spread}px rgba(0, 0, 0, ${opacity})`;
  };

  const getComponentBgColor = () => {
    // 컴포넌트 배경색을 테마에 따라 조정
    if (previewTheme === 'dark') {
      return settings.components?.card?.background?.color || '#1f2937';
    } else if (previewTheme === 'medium') {
      return settings.components?.card?.background?.color || '#f3f4f6';
    }
    return settings.components?.card?.background?.color || '#ffffff';
  };

  const getInputBgColor = () => {
    // 입력 필드 배경색을 테마에 따라 조정
    if (previewTheme === 'dark') {
      return settings.components?.input?.background?.color || '#374151';
    } else if (previewTheme === 'medium') {
      return settings.components?.input?.background?.color || '#f9fafb';
    }
    return settings.components?.input?.background?.color || '#ffffff';
  };

  const getBorderColor = () => {
    // 테두리 색상을 테마에 따라 조정
    if (previewTheme === 'dark') {
      return settings.border?.default?.color?.color || '#4b5563';
    } else if (previewTheme === 'medium') {
      return settings.border?.default?.color?.color || '#d1d5db';
    }
    return settings.border?.default?.color?.color || '#e5e7eb';
  };

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
          실시간 미리보기
        </h3>

        {/* 테마 선택 */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { key: 'light', label: 'Light', emoji: '☀️' },
            { key: 'medium', label: 'Medium', emoji: '🌤️' },
            { key: 'dark', label: 'Dark', emoji: '🌙' }
          ].map(({ key, label, emoji }) => (
            <button
              key={key}
              onClick={() => setPreviewTheme(key as any)}
              className={`p-2 rounded border-2 text-xs ${
                previewTheme === key
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div>{emoji}</div>
              <div className="text-gray-900 dark:text-white">{label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 미리보기 영역 */}
      <div
        className="rounded-lg p-6 space-y-6"
        style={{
          background: getBackgroundStyle(),
          minHeight: '600px'
        }}
      >
        {/* 타이포그래피 */}
        <div className="space-y-2">
          <h1
            style={{
              fontSize: `${settings.typography?.sizes?.h1?.size || 32}px`,
              fontWeight: settings.typography?.sizes?.h1?.weight || 700,
              color: getTextColor()
            }}
          >
            Heading 1
          </h1>
          <h2
            style={{
              fontSize: `${settings.typography?.sizes?.h2?.size || 24}px`,
              fontWeight: settings.typography?.sizes?.h2?.weight || 600,
              color: getTextColor()
            }}
          >
            Heading 2
          </h2>
          <p
            style={{
              fontSize: `${settings.typography?.sizes?.body?.size || 16}px`,
              fontWeight: settings.typography?.sizes?.body?.weight || 400,
              color: getTextColor()
            }}
          >
            Body text example. This is how your text will look with the current typography settings.
          </p>
        </div>

        {/* 버튼 */}
        <div className="space-y-3">
          <div className="text-sm font-medium" style={{ color: getTextColor() }}>Buttons</div>
          <div className="flex flex-wrap gap-3">
            {['sm', 'md', 'lg'].map(size => {
              const buttonData = settings.components?.button || {};
              return (
                <button
                  key={size}
                  className="text-white"
                  style={{
                    height: `${buttonData.height?.[size] || 40}px`,
                    paddingLeft: `${buttonData.padding_x?.[size] || 16}px`,
                    paddingRight: `${buttonData.padding_x?.[size] || 16}px`,
                    fontSize: `${buttonData.font_size?.[size] || 16}px`,
                    backgroundColor: getPrimaryColor(),
                    borderRadius: `${getBorderRadius()}px`,
                    boxShadow: getShadow()
                  }}
                >
                  {size.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>

        {/* 입력 필드 */}
        <div className="space-y-3">
          <div className="text-sm font-medium" style={{ color: getTextColor() }}>Input Fields</div>
          <input
            type="text"
            placeholder="Enter text..."
            className="w-full px-4 py-2"
            style={{
              backgroundColor: getInputBgColor(),
              color: getTextColor(),
              borderRadius: `${getBorderRadius()}px`,
              border: `1px solid ${getBorderColor()}`
            }}
          />
          <textarea
            placeholder="Enter message..."
            className="w-full px-4 py-2 resize-none"
            rows={3}
            style={{
              backgroundColor: getInputBgColor(),
              color: getTextColor(),
              borderRadius: `${getBorderRadius()}px`,
              border: `1px solid ${getBorderColor()}`
            }}
          />
        </div>

        {/* 카드 */}
        <div className="space-y-3">
          <div className="text-sm font-medium" style={{ color: getTextColor() }}>Cards</div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map(i => (
              <div
                key={i}
                style={{
                  backgroundColor: getComponentBgColor(),
                  padding: `${settings.components?.card?.padding || 16}px`,
                  borderRadius: `${getBorderRadius()}px`,
                  boxShadow: getShadow()
                }}
              >
                <div
                  className="font-semibold mb-2"
                  style={{ color: getTextColor() }}
                >
                  Card Title {i}
                </div>
                <div
                  className="text-sm"
                  style={{
                    color: getSecondaryTextColor()
                  }}
                >
                  Card content goes here
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 배지 */}
        <div className="space-y-3">
          <div className="text-sm font-medium" style={{ color: getTextColor() }}>Badges</div>
          <div className="flex flex-wrap gap-2">
            {['Primary', 'Success', 'Warning', 'Error'].map((label, i) => (
              <span
                key={label}
                className="inline-block"
                style={{
                  paddingLeft: `${settings.components?.badge?.padding_x || 8}px`,
                  paddingRight: `${settings.components?.badge?.padding_x || 8}px`,
                  paddingTop: `${settings.components?.badge?.padding_y || 4}px`,
                  paddingBottom: `${settings.components?.badge?.padding_y || 4}px`,
                  fontSize: `${settings.components?.badge?.font_size || 12}px`,
                  backgroundColor: i === 0 ? getPrimaryColor() : ['#22c55e', '#f59e0b', '#ef4444'][i - 1],
                  color: '#ffffff',
                  borderRadius: `${getBorderRadius() / 2}px`
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* 리스트 */}
        <div className="space-y-3">
          <div className="text-sm font-medium" style={{ color: getTextColor() }}>List Items</div>
          <div
            className="space-y-2"
            style={{
              backgroundColor: getComponentBgColor(),
              padding: `${settings.spacing?.component_spacing?.card?.padding || 16}px`,
              borderRadius: `${getBorderRadius()}px`,
              boxShadow: getShadow()
            }}
          >
            {['Item 1', 'Item 2', 'Item 3'].map((item, i) => (
              <div
                key={i}
                className="p-3 rounded cursor-pointer transition-all hover:bg-opacity-80"
                style={{
                  backgroundColor: i === 0 ? `${getPrimaryColor()}15` : 'transparent',
                  borderRadius: `${getBorderRadius() / 2}px`
                }}
              >
                <div style={{ color: getTextColor() }}>{item}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 색상 팔레트 */}
        <div className="space-y-3">
          <div className="text-sm font-medium" style={{ color: getTextColor() }}>Color Palette</div>
          <div className="grid grid-cols-7 gap-2">
            {['primary', 'secondary', 'success', 'warning', 'error', 'info', 'neutral'].map(colorType => {
              const colorData = settings.colors?.[colorType];
              return (
                <div key={colorType} className="space-y-1">
                  <div
                    className="aspect-square rounded"
                    style={{
                      backgroundColor: colorData?.base || '#2563eb',
                      borderRadius: `${getBorderRadius() / 2}px`
                    }}
                  />
                  <div className="text-xs text-center capitalize" style={{ color: getTextColor() }}>
                    {colorType.slice(0, 4)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 간격 예시 */}
        <div className="space-y-3">
          <div className="text-sm font-medium" style={{ color: getTextColor() }}>Spacing</div>
          <div className="flex flex-wrap gap-2">
            {(settings.spacing?.scale || [0, 4, 8, 12, 16]).slice(0, 8).map((space: number, i: number) => (
              <div key={i} className="text-center">
                <div
                  className="bg-blue-200 dark:bg-blue-800"
                  style={{
                    width: `${space}px`,
                    height: `${space}px`,
                    borderRadius: `${getBorderRadius() / 4}px`
                  }}
                />
                <div className="text-xs mt-1" style={{ color: getTextColor() }}>
                  {space}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 툴팁 예시 */}
        <div className="space-y-3">
          <div className="text-sm font-medium" style={{ color: getTextColor() }}>Tooltip</div>
          <div className="inline-block">
            <div
              className="rounded shadow-lg"
              style={{
                paddingLeft: `${settings.components?.tooltip?.padding_x || 12}px`,
                paddingRight: `${settings.components?.tooltip?.padding_x || 12}px`,
                paddingTop: `${settings.components?.tooltip?.padding_y || 8}px`,
                paddingBottom: `${settings.components?.tooltip?.padding_y || 8}px`,
                fontSize: `${settings.components?.tooltip?.font_size || 12}px`,
                backgroundColor: settings.components?.tooltip?.background?.color || '#1f2937',
                color: settings.components?.tooltip?.text?.color || '#ffffff',
                borderRadius: `${getBorderRadius() / 2}px`
              }}
            >
              Tooltip text example
            </div>
          </div>
        </div>

        {/* 레이아웃 미리보기 */}
        <div className="space-y-3">
          <div className="text-sm font-medium" style={{ color: getTextColor() }}>Layout Preview</div>
          <div
            className="relative bg-white dark:bg-gray-800 rounded overflow-hidden"
            style={{
              height: '200px',
              borderRadius: `${getBorderRadius()}px`,
              boxShadow: getShadow()
            }}
          >
            {/* Header */}
            <div
              className="bg-blue-600 text-white flex items-center justify-center text-xs"
              style={{
                height: `${Math.min((settings.layout?.header?.height || 70) / 2, 40)}px`
              }}
            >
              Header
            </div>

            {/* Body */}
            <div className="flex h-full">
              {/* Sidebar */}
              <div
                className="bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs"
                style={{
                  width: `${Math.min((settings.layout?.sidebar?.width || 250) / 5, 60)}px`,
                  color: getTextColor()
                }}
              >
                Side
              </div>

              {/* Content */}
              <div
                className="flex-1 p-4"
                style={{
                  backgroundColor: getComponentBgColor()
                }}
              >
                <div className="text-xs" style={{ color: getTextColor() }}>
                  Content Area
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
