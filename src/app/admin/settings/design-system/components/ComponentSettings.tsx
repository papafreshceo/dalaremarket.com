'use client';

import { useState } from 'react';

interface ComponentSettingsProps {
  settings: any;
  onChange: (settings: any) => void;
}

export default function ComponentSettings({ settings, onChange }: ComponentSettingsProps) {
  const [selectedComponent, setSelectedComponent] = useState<string>('button');

  const components = [
    { key: 'button', label: '버튼', icon: '🔘' },
    { key: 'input', label: '입력', icon: '📝' },
    { key: 'card', label: '카드', icon: '🃏' },
    { key: 'badge', label: '배지', icon: '🏷️' },
    { key: 'modal', label: '모달', icon: '🪟' },
    { key: 'dropdown', label: '드롭다운', icon: '📋' },
    { key: 'tooltip', label: '툴팁', icon: '💬' }
  ];

  const sizes = ['sm', 'md', 'lg'];

  const updateComponent = (component: string, updates: any) => {
    onChange({
      ...settings,
      [component]: {
        ...(settings[component] || {}),
        ...updates
      }
    });
  };

  const updateComponentNested = (component: string, key: string, updates: any) => {
    onChange({
      ...settings,
      [component]: {
        ...(settings[component] || {}),
        [key]: {
          ...(settings[component]?.[key] || {}),
          ...updates
        }
      }
    });
  };

  const currentComponent = settings[selectedComponent] || {};

  return (
    <div className="space-y-2">

      {/* 컴포넌트 선택 */}
      <div className="grid grid-cols-7 gap-3">
        {components.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setSelectedComponent(key)}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedComponent === key
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-xs font-medium text-gray-900 dark:text-white">
              {label}
            </div>
          </button>
        ))}
      </div>

      {/* 버튼 설정 */}
      {selectedComponent === 'button' && (
        <div className="space-y-6">
          {/* 크기별 설정 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              크기별 설정
            </h3>
            <div className="space-y-4">
              {sizes.map(size => (
                <div key={size} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="font-medium text-gray-900 dark:text-white mb-3 capitalize">{size}</div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-gray-600 dark:text-gray-400">높이 (px)</label>
                        <input
                          type="number"
                          min="20"
                          max="80"
                          value={currentComponent.height?.[size] || 40}
                          onChange={(e) => updateComponentNested(selectedComponent, 'height', { [size]: parseInt(e.target.value) })}
                          className="w-12 px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="80"
                        value={currentComponent.height?.[size] || 40}
                        onChange={(e) => updateComponentNested(selectedComponent, 'height', { [size]: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-gray-600 dark:text-gray-400">가로패딩 (px)</label>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={currentComponent.padding_x?.[size] || 16}
                          onChange={(e) => updateComponentNested(selectedComponent, 'padding_x', { [size]: parseInt(e.target.value) })}
                          className="w-12 px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={currentComponent.padding_x?.[size] || 16}
                        onChange={(e) => updateComponentNested(selectedComponent, 'padding_x', { [size]: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-gray-600 dark:text-gray-400">글자크기 (px)</label>
                        <input
                          type="number"
                          min="10"
                          max="24"
                          value={currentComponent.font_size?.[size] || 16}
                          onChange={(e) => updateComponentNested(selectedComponent, 'font_size', { [size]: parseInt(e.target.value) })}
                          className="w-12 px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="24"
                        value={currentComponent.font_size?.[size] || 16}
                        onChange={(e) => updateComponentNested(selectedComponent, 'font_size', { [size]: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 배경 색상 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              배경 색상
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {['primary', 'secondary', 'outline', 'ghost'].map(variant => {
                const bgData = currentComponent.background?.[variant] || {};
                return (
                  <div key={variant} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="font-medium text-gray-900 dark:text-white mb-3 capitalize">{variant}</div>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={bgData.color || '#2563eb'}
                        onChange={(e) => updateComponentNested(selectedComponent, 'background', {
                          [variant]: { ...bgData, color: e.target.value }
                        })}
                        className="w-12 h-10 rounded cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-1 mb-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={bgData.opacity || 100}
                            onChange={(e) => updateComponentNested(selectedComponent, 'background', {
                              [variant]: { ...bgData, opacity: parseInt(e.target.value) }
                            })}
                            className="w-14 px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                          <span className="text-xs text-gray-500">%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={bgData.opacity || 100}
                          onChange={(e) => updateComponentNested(selectedComponent, 'background', {
                            [variant]: { ...bgData, opacity: parseInt(e.target.value) }
                          })}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 입력 설정 */}
      {selectedComponent === 'input' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              크기 설정
            </h3>
            <div className="space-y-4">
              {sizes.map(size => (
                <div key={size} className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-gray-700 dark:text-gray-300 capitalize">{size} 높이</label>
                      <input
                        type="number"
                        min="20"
                        max="80"
                        value={currentComponent.height?.[size] || 40}
                        onChange={(e) => updateComponentNested(selectedComponent, 'height', { [size]: parseInt(e.target.value) })}
                        className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="80"
                      value={currentComponent.height?.[size] || 40}
                      onChange={(e) => updateComponentNested(selectedComponent, 'height', { [size]: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              색상 설정
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">배경 색상</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={currentComponent.background?.color || '#ffffff'}
                    onChange={(e) => updateComponentNested(selectedComponent, 'background', { color: e.target.value })}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1 mb-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={currentComponent.background?.opacity || 100}
                        onChange={(e) => updateComponentNested(selectedComponent, 'background', { opacity: parseInt(e.target.value) })}
                        className="w-14 px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <span className="text-xs text-gray-500">%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={currentComponent.background?.opacity || 100}
                      onChange={(e) => updateComponentNested(selectedComponent, 'background', { opacity: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">플레이스홀더 색상</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={currentComponent.placeholder?.color || '#9ca3af'}
                    onChange={(e) => updateComponentNested(selectedComponent, 'placeholder', { color: e.target.value })}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1 mb-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={currentComponent.placeholder?.opacity || 60}
                        onChange={(e) => updateComponentNested(selectedComponent, 'placeholder', { opacity: parseInt(e.target.value) })}
                        className="w-14 px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <span className="text-xs text-gray-500">%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={currentComponent.placeholder?.opacity || 60}
                      onChange={(e) => updateComponentNested(selectedComponent, 'placeholder', { opacity: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 카드/배지/모달/드롭다운/툴팁 - 간단한 설정 */}
      {['card', 'badge', 'modal', 'dropdown', 'tooltip'].includes(selectedComponent) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            기본 설정
          </h3>
          <div className="space-y-4">
            {selectedComponent === 'card' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-gray-700 dark:text-gray-300">패딩 (px)</label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={currentComponent.padding || 16}
                        onChange={(e) => updateComponent(selectedComponent, { padding: parseInt(e.target.value) })}
                        className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={currentComponent.padding || 16}
                      onChange={(e) => updateComponent(selectedComponent, { padding: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-gray-700 dark:text-gray-300">간격 (px)</label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={currentComponent.gap || 12}
                        onChange={(e) => updateComponent(selectedComponent, { gap: parseInt(e.target.value) })}
                        className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={currentComponent.gap || 12}
                      onChange={(e) => updateComponent(selectedComponent, { gap: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">배경 색상</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={currentComponent.background?.color || '#ffffff'}
                      onChange={(e) => updateComponentNested(selectedComponent, 'background', { color: e.target.value })}
                      className="w-16 h-10 rounded cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-1 mb-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={currentComponent.background?.opacity || 100}
                          onChange={(e) => updateComponentNested(selectedComponent, 'background', { opacity: parseInt(e.target.value) })}
                          className="w-14 px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <span className="text-xs text-gray-500">%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={currentComponent.background?.opacity || 100}
                        onChange={(e) => updateComponentNested(selectedComponent, 'background', { opacity: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {selectedComponent === 'badge' && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-gray-700 dark:text-gray-300">가로 패딩 (px)</label>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={currentComponent.padding_x || 8}
                        onChange={(e) => updateComponent(selectedComponent, { padding_x: parseInt(e.target.value) })}
                        className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={currentComponent.padding_x || 8}
                      onChange={(e) => updateComponent(selectedComponent, { padding_x: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-gray-700 dark:text-gray-300">세로 패딩 (px)</label>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={currentComponent.padding_y || 4}
                        onChange={(e) => updateComponent(selectedComponent, { padding_y: parseInt(e.target.value) })}
                        className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={currentComponent.padding_y || 4}
                      onChange={(e) => updateComponent(selectedComponent, { padding_y: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-gray-700 dark:text-gray-300">글자 크기 (px)</label>
                      <input
                        type="number"
                        min="8"
                        max="20"
                        value={currentComponent.font_size || 12}
                        onChange={(e) => updateComponent(selectedComponent, { font_size: parseInt(e.target.value) })}
                        className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <input
                      type="range"
                      min="8"
                      max="20"
                      value={currentComponent.font_size || 12}
                      onChange={(e) => updateComponent(selectedComponent, { font_size: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
              </>
            )}

            {selectedComponent === 'tooltip' && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-gray-700 dark:text-gray-300">가로 패딩 (px)</label>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={currentComponent.padding_x || 12}
                        onChange={(e) => updateComponent(selectedComponent, { padding_x: parseInt(e.target.value) })}
                        className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={currentComponent.padding_x || 12}
                      onChange={(e) => updateComponent(selectedComponent, { padding_x: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-gray-700 dark:text-gray-300">세로 패딩 (px)</label>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={currentComponent.padding_y || 8}
                        onChange={(e) => updateComponent(selectedComponent, { padding_y: parseInt(e.target.value) })}
                        className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={currentComponent.padding_y || 8}
                      onChange={(e) => updateComponent(selectedComponent, { padding_y: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-gray-700 dark:text-gray-300">글자 크기 (px)</label>
                      <input
                        type="number"
                        min="8"
                        max="20"
                        value={currentComponent.font_size || 12}
                        onChange={(e) => updateComponent(selectedComponent, { font_size: parseInt(e.target.value) })}
                        className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <input
                      type="range"
                      min="8"
                      max="20"
                      value={currentComponent.font_size || 12}
                      onChange={(e) => updateComponent(selectedComponent, { font_size: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">배경 색상</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={currentComponent.background?.color || '#1f2937'}
                        onChange={(e) => updateComponentNested(selectedComponent, 'background', { color: e.target.value })}
                        className="w-16 h-10 rounded cursor-pointer"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={currentComponent.background?.opacity || 90}
                        onChange={(e) => updateComponentNested(selectedComponent, 'background', { opacity: parseInt(e.target.value) })}
                        className="w-20 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">텍스트 색상</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={currentComponent.text?.color || '#ffffff'}
                        onChange={(e) => updateComponentNested(selectedComponent, 'text', { color: e.target.value })}
                        className="w-16 h-10 rounded cursor-pointer"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={currentComponent.text?.opacity || 100}
                        onChange={(e) => updateComponentNested(selectedComponent, 'text', { opacity: parseInt(e.target.value) })}
                        className="w-20 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 미리보기 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          미리보기
        </h3>
        <div className="p-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
          {selectedComponent === 'button' && (
            <div className="flex gap-4">
              {sizes.map(size => (
                <button
                  key={size}
                  className="rounded text-white"
                  style={{
                    height: `${currentComponent.height?.[size] || 40}px`,
                    paddingLeft: `${currentComponent.padding_x?.[size] || 16}px`,
                    paddingRight: `${currentComponent.padding_x?.[size] || 16}px`,
                    fontSize: `${currentComponent.font_size?.[size] || 16}px`,
                    backgroundColor: currentComponent.background?.primary?.color || '#2563eb',
                    opacity: (currentComponent.background?.primary?.opacity || 100) / 100
                  }}
                >
                  {size.toUpperCase()}
                </button>
              ))}
            </div>
          )}

          {selectedComponent === 'input' && (
            <div className="w-full max-w-md space-y-3">
              {sizes.map(size => (
                <input
                  key={size}
                  type="text"
                  placeholder={`${size.toUpperCase()} Input`}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-4"
                  style={{
                    height: `${currentComponent.height?.[size] || 40}px`,
                    backgroundColor: currentComponent.background?.color || '#ffffff'
                  }}
                />
              ))}
            </div>
          )}

          {selectedComponent === 'card' && (
            <div
              className="rounded border border-gray-300 dark:border-gray-600"
              style={{
                padding: `${currentComponent.padding || 16}px`,
                gap: `${currentComponent.gap || 12}px`,
                backgroundColor: currentComponent.background?.color || '#ffffff',
                opacity: (currentComponent.background?.opacity || 100) / 100
              }}
            >
              <div className="font-semibold mb-2">Card Title</div>
              <div className="text-sm text-gray-600">Card content goes here</div>
            </div>
          )}

          {selectedComponent === 'badge' && (
            <span
              className="inline-block rounded"
              style={{
                paddingLeft: `${currentComponent.padding_x || 8}px`,
                paddingRight: `${currentComponent.padding_x || 8}px`,
                paddingTop: `${currentComponent.padding_y || 4}px`,
                paddingBottom: `${currentComponent.padding_y || 4}px`,
                fontSize: `${currentComponent.font_size || 12}px`,
                backgroundColor: currentComponent.background?.color || '#2563eb',
                color: currentComponent.text?.color || '#2563eb'
              }}
            >
              Badge
            </span>
          )}

          {selectedComponent === 'tooltip' && (
            <div
              className="rounded shadow-lg"
              style={{
                paddingLeft: `${currentComponent.padding_x || 12}px`,
                paddingRight: `${currentComponent.padding_x || 12}px`,
                paddingTop: `${currentComponent.padding_y || 8}px`,
                paddingBottom: `${currentComponent.padding_y || 8}px`,
                fontSize: `${currentComponent.font_size || 12}px`,
                backgroundColor: currentComponent.background?.color || '#1f2937',
                color: currentComponent.text?.color || '#ffffff',
                opacity: (currentComponent.background?.opacity || 90) / 100
              }}
            >
              Tooltip text
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
