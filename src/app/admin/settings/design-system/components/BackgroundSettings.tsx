'use client';

import { useState } from 'react';

interface BackgroundSettingsProps {
  settings: any;
  onChange: (settings: any) => void;
}

export default function BackgroundSettings({ settings, onChange }: BackgroundSettingsProps) {
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'medium' | 'dark'>('light');

  const themes = [
    { key: 'light', label: '라이트', emoji: '☀️', desc: '밝은 배경' },
    { key: 'medium', label: '미디움', emoji: '🌤️', desc: '중간 밝기' },
    { key: 'dark', label: '다크', emoji: '🌙', desc: '어두운 배경' }
  ];

  const gradientDirections = [
    { value: 'to bottom', label: '위→아래' },
    { value: 'to top', label: '아래→위' },
    { value: 'to right', label: '왼→오른' },
    { value: 'to left', label: '오른→왼' },
    { value: 'to bottom right', label: '↘' },
    { value: 'to bottom left', label: '↙' },
    { value: 'to top right', label: '↗' },
    { value: 'to top left', label: '↖' }
  ];

  const currentTheme = settings[selectedTheme] || {
    type: 'solid',
    solid: { color: '#ffffff', opacity: 100 },
    gradient: { enabled: false, colors: [], direction: 'to bottom', angle: 180 }
  };

  const updateTheme = (updates: any) => {
    onChange({
      ...settings,
      [selectedTheme]: {
        ...currentTheme,
        ...updates
      }
    });
  };

  const addGradientColor = () => {
    const colors = currentTheme.gradient?.colors || [];
    updateTheme({
      gradient: {
        ...currentTheme.gradient,
        colors: [
          ...colors,
          { color: '#000000', opacity: 100, position: colors.length * 20 }
        ]
      }
    });
  };

  const removeGradientColor = (index: number) => {
    const colors = [...(currentTheme.gradient?.colors || [])];
    colors.splice(index, 1);
    updateTheme({
      gradient: {
        ...currentTheme.gradient,
        colors
      }
    });
  };

  const updateGradientColor = (index: number, updates: any) => {
    const colors = [...(currentTheme.gradient?.colors || [])];
    colors[index] = { ...colors[index], ...updates };
    updateTheme({
      gradient: {
        ...currentTheme.gradient,
        colors
      }
    });
  };

  const getGradientPreview = () => {
    if (!currentTheme.gradient?.enabled || !currentTheme.gradient?.colors?.length) {
      return currentTheme.solid?.color || '#ffffff';
    }

    const colorStops = currentTheme.gradient.colors
      .map((c: any) => `${c.color} ${c.position}%`)
      .join(', ');

    return `linear-gradient(${currentTheme.gradient.direction}, ${colorStops})`;
  };

  return (
    <div className="space-y-2">

      {/* 테마 선택 */}
      <div className="grid grid-cols-3 gap-4">
        {themes.map(({ key, label, emoji, desc }) => (
          <button
            key={key}
            onClick={() => setSelectedTheme(key as any)}
            className={`p-6 rounded-lg border-2 transition-all ${
              selectedTheme === key
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="text-4xl mb-2">{emoji}</div>
            <div className="font-medium text-gray-900 dark:text-white mb-1">
              {label}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {desc}
            </div>
          </button>
        ))}
      </div>

      {/* 배경 타입 선택 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          배경 타입
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => updateTheme({ type: 'solid' })}
            className={`p-4 rounded-lg border-2 ${
              currentTheme.type === 'solid'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="font-medium text-gray-900 dark:text-white">
              단색
            </div>
          </button>
          <button
            onClick={() => updateTheme({
              type: 'gradient',
              gradient: { ...currentTheme.gradient, enabled: true }
            })}
            className={`p-4 rounded-lg border-2 ${
              currentTheme.type === 'gradient'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="font-medium text-gray-900 dark:text-white">
              그라디언트
            </div>
          </button>
        </div>
      </div>

      {/* 단색 설정 */}
      {currentTheme.type === 'solid' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            단색 배경
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                배경 색상
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={currentTheme.solid?.color || '#ffffff'}
                  onChange={(e) => updateTheme({
                    solid: { ...currentTheme.solid, color: e.target.value }
                  })}
                  className="w-20 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={currentTheme.solid?.color || '#ffffff'}
                  onChange={(e) => updateTheme({
                    solid: { ...currentTheme.solid, color: e.target.value }
                  })}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                투명도 ({currentTheme.solid?.opacity || 100}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={currentTheme.solid?.opacity || 100}
                onChange={(e) => updateTheme({
                  solid: { ...currentTheme.solid, opacity: parseInt(e.target.value) }
                })}
                className="w-full"
              />
            </div>
            {/* 미리보기 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                미리보기
              </label>
              <div
                className="h-32 rounded-lg border border-gray-300 dark:border-gray-600"
                style={{
                  backgroundColor: currentTheme.solid?.color,
                  opacity: (currentTheme.solid?.opacity || 100) / 100
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 그라디언트 설정 */}
      {currentTheme.type === 'gradient' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            그라디언트 배경
          </h3>

          <div className="space-y-4">
            {/* 방향 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                방향
              </label>
              <select
                value={currentTheme.gradient?.direction || 'to bottom'}
                onChange={(e) => updateTheme({
                  gradient: { ...currentTheme.gradient, direction: e.target.value }
                })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {gradientDirections.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* 각도 조절 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                각도 ({currentTheme.gradient?.angle || 180}°)
              </label>
              <input
                type="range"
                min="0"
                max="360"
                value={currentTheme.gradient?.angle || 180}
                onChange={(e) => updateTheme({
                  gradient: { ...currentTheme.gradient, angle: parseInt(e.target.value) }
                })}
                className="w-full"
              />
            </div>

            {/* 색상 목록 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  그라디언트 색상
                </label>
                <button
                  onClick={addGradientColor}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  + 색상 추가
                </button>
              </div>

              <div className="space-y-3">
                {(currentTheme.gradient?.colors || []).map((colorData: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <input
                      type="color"
                      value={colorData.color}
                      onChange={(e) => updateGradientColor(idx, { color: e.target.value })}
                      className="w-12 h-12 rounded cursor-pointer"
                    />
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={colorData.color}
                        onChange={(e) => updateGradientColor(idx, { color: e.target.value })}
                        className="w-full px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-600 dark:text-gray-400">위치:</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={colorData.position}
                          onChange={(e) => updateGradientColor(idx, { position: parseInt(e.target.value) })}
                          className="flex-1"
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-400 w-12">
                          {colorData.position}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-600 dark:text-gray-400">투명도:</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={colorData.opacity}
                          onChange={(e) => updateGradientColor(idx, { opacity: parseInt(e.target.value) })}
                          className="flex-1"
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-400 w-12">
                          {colorData.opacity}%
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeGradientColor(idx)}
                      className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 미리보기 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                미리보기
              </label>
              <div
                className="h-32 rounded-lg border border-gray-300 dark:border-gray-600"
                style={{ background: getGradientPreview() }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
