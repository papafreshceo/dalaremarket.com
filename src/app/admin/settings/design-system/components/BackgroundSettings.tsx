'use client';

import { useState } from 'react';
import { Layers, Plus, Trash2, GripVertical } from 'lucide-react';

interface BackgroundSettingsProps {
  settings: any;
  onChange: (settings: any) => void;
}

export default function BackgroundSettings({ settings, onChange }: BackgroundSettingsProps) {
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'medium' | 'dark'>('light');

  const themes = [
    { key: 'light', label: '라이트', emoji: '☀️', desc: '표준 라이트 모드' },
    { key: 'medium', label: '미디움', emoji: '🌤️', desc: '부드러운 라이트 모드' },
    { key: 'dark', label: '다크', emoji: '🌙', desc: '표준 다크 모드' }
  ];

  const gradientDirections = [
    { value: 'to bottom', label: '위에서 아래로' },
    { value: 'to top', label: '아래에서 위로' },
    { value: 'to right', label: '왼쪽에서 오른쪽으로' },
    { value: 'to left', label: '오른쪽에서 왼쪽으로' },
    { value: 'to bottom right', label: '대각선 ↘' },
    { value: 'to bottom left', label: '대각선 ↙' },
    { value: 'to top right', label: '대각선 ↗' },
    { value: 'to top left', label: '대각선 ↖' }
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
    <div className="space-y-8">
      {/* Theme Selection */}
      <div className="grid grid-cols-3 gap-4">
        {themes.map(({ key, label, emoji, desc }) => (
          <button
            key={key}
            onClick={() => setSelectedTheme(key as any)}
            className={`p-4 rounded-xl border transition-all text-left ${selectedTheme === key
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
              }`}
          >
            <div className="text-2xl mb-2">{emoji}</div>
            <div className="font-medium text-gray-900 dark:text-white">
              {label}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {desc}
            </div>
          </button>
        ))}
      </div>

      {/* Background Type */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Layers size={18} className="text-gray-500" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            배경 타입
          </h3>
        </div>

        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg w-fit">
          <button
            onClick={() => updateTheme({ type: 'solid' })}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${currentTheme.type === 'solid'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
          >
            단색 (Solid)
          </button>
          <button
            onClick={() => updateTheme({
              type: 'gradient',
              gradient: { ...currentTheme.gradient, enabled: true }
            })}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${currentTheme.type === 'gradient'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
          >
            그라디언트 (Gradient)
          </button>
        </div>
      </div>

      {/* Solid Settings */}
      {currentTheme.type === 'solid' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-6">
            단색 설정
          </h3>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  색상
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={currentTheme.solid?.color || '#ffffff'}
                    onChange={(e) => updateTheme({
                      solid: { ...currentTheme.solid, color: e.target.value }
                    })}
                    className="w-12 h-12 rounded-lg cursor-pointer border border-gray-200 dark:border-gray-600"
                  />
                  <input
                    type="text"
                    value={currentTheme.solid?.color || '#ffffff'}
                    onChange={(e) => updateTheme({
                      solid: { ...currentTheme.solid, color: e.target.value }
                    })}
                    className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-transparent font-mono uppercase"
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">투명도</label>
                  <span className="text-xs text-gray-500">{currentTheme.solid?.opacity || 100}%</span>
                </div>
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                미리보기
              </label>
              <div
                className="h-full min-h-[120px] rounded-lg border border-gray-200 dark:border-gray-600 shadow-inner"
                style={{
                  backgroundColor: currentTheme.solid?.color,
                  opacity: (currentTheme.solid?.opacity || 100) / 100
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Gradient Settings */}
      {currentTheme.type === 'gradient' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              그라디언트 설정
            </h3>
            <button
              onClick={addGradientColor}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              색상 추가
            </button>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  방향
                </label>
                <select
                  value={currentTheme.gradient?.direction || 'to bottom'}
                  onChange={(e) => updateTheme({
                    gradient: { ...currentTheme.gradient, direction: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-transparent"
                >
                  {gradientDirections.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  색상 지점 (Stops)
                </label>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {(currentTheme.gradient?.colors || []).map((colorData: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700">
                      <div className="mt-1 cursor-move text-gray-400">
                        <GripVertical size={16} />
                      </div>
                      <input
                        type="color"
                        value={colorData.color}
                        onChange={(e) => updateGradientColor(idx, { color: e.target.value })}
                        className="w-8 h-8 rounded cursor-pointer border border-gray-200 dark:border-gray-600"
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={colorData.position}
                            onChange={(e) => updateGradientColor(idx, { position: parseInt(e.target.value) })}
                            className="flex-1"
                          />
                          <span className="text-xs w-8 text-right">{colorData.position}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={colorData.opacity}
                            onChange={(e) => updateGradientColor(idx, { opacity: parseInt(e.target.value) })}
                            className="flex-1"
                          />
                          <span className="text-xs w-8 text-right opacity-50">{colorData.opacity}%</span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeGradientColor(idx)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                미리보기
              </label>
              <div
                className="h-full min-h-[200px] rounded-lg border border-gray-200 dark:border-gray-600 shadow-inner"
                style={{ background: getGradientPreview() }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
