'use client';

import { useState } from 'react';

interface BorderSettingsProps {
  settings: any;
  onChange: (settings: any) => void;
}

export default function BorderSettings({ settings, onChange }: BorderSettingsProps) {
  const [selectedComponent, setSelectedComponent] = useState<string>('button');

  const borderStyles = ['solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset'];

  const states = [
    { key: 'default', label: '기본' },
    { key: 'hover', label: '호버' },
    { key: 'focus', label: '포커스' },
    { key: 'active', label: '활성' },
    { key: 'disabled', label: '비활성' },
    { key: 'error', label: '오류' }
  ];

  const components = [
    { key: 'button', label: '버튼', emoji: '🔘' },
    { key: 'input', label: '입력', emoji: '📝' },
    { key: 'card', label: '카드', emoji: '🃏' },
    { key: 'badge', label: '배지', emoji: '🏷️' }
  ];

  const updateDefault = (updates: any) => {
    onChange({
      ...settings,
      default: {
        ...(settings.default || {}),
        ...updates
      }
    });
  };

  const updateState = (state: string, updates: any) => {
    onChange({
      ...settings,
      states: {
        ...(settings.states || {}),
        [state]: {
          ...(settings.states?.[state] || {}),
          ...updates
        }
      }
    });
  };

  const updateComponent = (component: string, updates: any) => {
    onChange({
      ...settings,
      by_component: {
        ...(settings.by_component || {}),
        [component]: {
          ...(settings.by_component?.[component] || {}),
          ...updates
        }
      }
    });
  };

  const updateComponentState = (component: string, state: string, updates: any) => {
    const componentData = settings.by_component?.[component] || {};
    onChange({
      ...settings,
      by_component: {
        ...(settings.by_component || {}),
        [component]: {
          ...componentData,
          states: {
            ...(componentData.states || {}),
            [state]: {
              ...(componentData.states?.[state] || {}),
              ...updates
            }
          }
        }
      }
    });
  };

  const defaultData = settings.default || {};
  const currentComponent = settings.by_component?.[selectedComponent] || {};

  return (
    <div className="space-y-2">

      {/* 기본 테두리 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          기본 테두리
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  두께 (px)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={defaultData.width || 1}
                  onChange={(e) => updateDefault({ width: parseInt(e.target.value) })}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={defaultData.width || 1}
                onChange={(e) => updateDefault({ width: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                스타일
              </label>
              <select
                value={defaultData.style || 'solid'}
                onChange={(e) => updateDefault({ style: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {borderStyles.map(style => (
                  <option key={style} value={style}>{style}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              색상
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={defaultData.color?.color || '#e5e7eb'}
                onChange={(e) => updateDefault({
                  color: { ...(defaultData.color || {}), color: e.target.value }
                })}
                className="w-16 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={defaultData.color?.color || '#e5e7eb'}
                onChange={(e) => updateDefault({
                  color: { ...(defaultData.color || {}), color: e.target.value }
                })}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <div className="w-40">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm text-gray-700 dark:text-gray-300">투명도</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={defaultData.color?.opacity || 100}
                      onChange={(e) => updateDefault({
                        color: { ...(defaultData.color || {}), opacity: parseInt(e.target.value) }
                      })}
                      className="w-14 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <span className="text-xs text-gray-500">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={defaultData.color?.opacity || 100}
                  onChange={(e) => updateDefault({
                    color: { ...(defaultData.color || {}), opacity: parseInt(e.target.value) }
                  })}
                  className="w-full"
                />
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                모서리 둥글기 (px)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={defaultData.radius || 8}
                onChange={(e) => updateDefault({ radius: parseInt(e.target.value) })}
                className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={defaultData.radius || 8}
              onChange={(e) => updateDefault({ radius: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
          {/* 미리보기 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              미리보기
            </label>
            <div
              className="h-24 flex items-center justify-center bg-gray-50 dark:bg-gray-700"
              style={{
                border: `${defaultData.width || 1}px ${defaultData.style || 'solid'} ${defaultData.color?.color || '#e5e7eb'}`,
                borderRadius: `${defaultData.radius || 8}px`,
                opacity: (defaultData.color?.opacity || 100) / 100
              }}
            >
              <span className="text-gray-600 dark:text-gray-300">테두리 미리보기</span>
            </div>
          </div>
        </div>
      </div>

      {/* 상태별 테두리 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          상태별 테두리
        </h3>
        <div className="space-y-4">
          {states.map(({ key, label }) => {
            const stateData = settings.states?.[key] || {};
            return (
              <div key={key} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">{label}</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      색상
                    </label>
                    <input
                      type="color"
                      value={stateData.color || '#e5e7eb'}
                      onChange={(e) => updateState(key, { color: e.target.value })}
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-gray-600 dark:text-gray-400">
                        투명도 (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={stateData.opacity || 100}
                        onChange={(e) => updateState(key, { opacity: parseInt(e.target.value) })}
                        className="w-12 px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={stateData.opacity || 100}
                      onChange={(e) => updateState(key, { opacity: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-gray-600 dark:text-gray-400">
                        두께 (px)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={stateData.width || 1}
                        onChange={(e) => updateState(key, { width: parseInt(e.target.value) })}
                        className="w-12 px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={stateData.width || 1}
                      onChange={(e) => updateState(key, { width: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 컴포넌트별 테두리 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          컴포넌트별 테두리
        </h3>

        {/* 컴포넌트 선택 */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {components.map(({ key, label, emoji }) => (
            <button
              key={key}
              onClick={() => setSelectedComponent(key)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedComponent === key
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="text-2xl mb-1">{emoji}</div>
              <div className="text-xs font-medium text-gray-900 dark:text-white">
                {label}
              </div>
            </button>
          ))}
        </div>

        {/* 선택된 컴포넌트 설정 */}
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  두께 (px)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={currentComponent.width || 1}
                  onChange={(e) => updateComponent(selectedComponent, { width: parseInt(e.target.value) })}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={currentComponent.width || 1}
                onChange={(e) => updateComponent(selectedComponent, { width: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                스타일
              </label>
              <select
                value={currentComponent.style || 'solid'}
                onChange={(e) => updateComponent(selectedComponent, { style: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {borderStyles.map(style => (
                  <option key={style} value={style}>{style}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  모서리 둥글기 (px)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={currentComponent.radius || 8}
                  onChange={(e) => updateComponent(selectedComponent, { radius: parseInt(e.target.value) })}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={currentComponent.radius || 8}
                onChange={(e) => updateComponent(selectedComponent, { radius: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>

          {/* 컴포넌트 상태별 색상 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              상태별 색상
            </label>
            <div className="space-y-3">
              {Object.keys(currentComponent.states || {}).map((state) => {
                const stateData = currentComponent.states[state] || {};
                return (
                  <div key={state} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <div className="w-20 text-sm text-gray-700 dark:text-gray-300 capitalize">
                      {state}
                    </div>
                    <input
                      type="color"
                      value={stateData.color || '#e5e7eb'}
                      onChange={(e) => updateComponentState(selectedComponent, state, { color: e.target.value })}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={stateData.color || '#e5e7eb'}
                      onChange={(e) => updateComponentState(selectedComponent, state, { color: e.target.value })}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <div className="w-32">
                      <div className="flex items-center gap-1 mb-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={stateData.opacity || 100}
                          onChange={(e) => updateComponentState(selectedComponent, state, { opacity: parseInt(e.target.value) })}
                          className="w-14 px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <span className="text-xs text-gray-500">%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={stateData.opacity || 100}
                        onChange={(e) => updateComponentState(selectedComponent, state, { opacity: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
