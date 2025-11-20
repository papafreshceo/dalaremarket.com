'use client';

import { useState } from 'react';

interface ShadowSettingsProps {
  settings: any;
  onChange: (settings: any) => void;
}

export default function ShadowSettings({ settings, onChange }: ShadowSettingsProps) {
  const [selectedLevel, setSelectedLevel] = useState<string>('md');

  const levels = [
    { key: 'none', label: 'None', desc: '그림자 없음' },
    { key: 'xs', label: 'XS', desc: '매우 작은 그림자' },
    { key: 'sm', label: 'SM', desc: '작은 그림자' },
    { key: 'md', label: 'MD', desc: '중간 그림자' },
    { key: 'lg', label: 'LG', desc: '큰 그림자' },
    { key: 'xl', label: 'XL', desc: '매우 큰 그림자' }
  ];

  const components = [
    { key: 'button', label: '버튼', default: 'sm', hover: 'md' },
    { key: 'card', label: '카드', default: 'md', hover: 'lg' },
    { key: 'modal', label: '모달', value: 'xl' },
    { key: 'dropdown', label: '드롭다운', value: 'lg' }
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

  const updateLevel = (level: string, updates: any) => {
    onChange({
      ...settings,
      levels: {
        ...(settings.levels || {}),
        [level]: {
          ...(settings.levels?.[level] || {}),
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

  const getShadowCSS = (shadowData: any) => {
    if (!shadowData || shadowData.enabled === false) return 'none';

    const { x_offset = 0, y_offset = 4, blur = 6, spread = 0, color } = shadowData;
    const shadowColor = color?.color || '#000000';
    const opacity = (color?.opacity || 10) / 100;

    return `${x_offset}px ${y_offset}px ${blur}px ${spread}px rgba(0, 0, 0, ${opacity})`;
  };

  const defaultData = settings.default || {};
  const selectedLevelData = settings.levels?.[selectedLevel] || {};

  return (
    <div className="space-y-2">

      {/* 기본 그림자 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          기본 그림자
        </h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              checked={defaultData.enabled !== false}
              onChange={(e) => updateDefault({ enabled: e.target.checked })}
              className="w-5 h-5 rounded"
            />
            <label className="text-sm text-gray-700 dark:text-gray-300">
              그림자 활성화
            </label>
          </div>

          {defaultData.enabled !== false && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      X 오프셋 (px)
                    </label>
                    <input
                      type="number"
                      min="-50"
                      max="50"
                      value={defaultData.x_offset || 0}
                      onChange={(e) => updateDefault({ x_offset: parseInt(e.target.value) })}
                      className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={defaultData.x_offset || 0}
                    onChange={(e) => updateDefault({ x_offset: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Y 오프셋 (px)
                    </label>
                    <input
                      type="number"
                      min="-50"
                      max="50"
                      value={defaultData.y_offset || 4}
                      onChange={(e) => updateDefault({ y_offset: parseInt(e.target.value) })}
                      className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={defaultData.y_offset || 4}
                    onChange={(e) => updateDefault({ y_offset: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      블러 (px)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={defaultData.blur || 6}
                      onChange={(e) => updateDefault({ blur: parseInt(e.target.value) })}
                      className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={defaultData.blur || 6}
                    onChange={(e) => updateDefault({ blur: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      확산 (px)
                    </label>
                    <input
                      type="number"
                      min="-50"
                      max="50"
                      value={defaultData.spread || 0}
                      onChange={(e) => updateDefault({ spread: parseInt(e.target.value) })}
                      className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={defaultData.spread || 0}
                    onChange={(e) => updateDefault({ spread: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  그림자 색상
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={defaultData.color?.color || '#000000'}
                    onChange={(e) => updateDefault({
                      color: { ...(defaultData.color || {}), color: e.target.value }
                    })}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={defaultData.color?.color || '#000000'}
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
                          value={defaultData.color?.opacity || 10}
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
                      value={defaultData.color?.opacity || 10}
                      onChange={(e) => updateDefault({
                        color: { ...(defaultData.color || {}), opacity: parseInt(e.target.value) }
                      })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* 미리보기 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  미리보기
                </label>
                <div className="h-32 flex items-center justify-center bg-gray-100 dark:bg-gray-700 p-8">
                  <div
                    className="w-32 h-32 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center"
                    style={{ boxShadow: getShadowCSS(defaultData) }}
                  >
                    <span className="text-gray-600 dark:text-gray-300 text-sm">그림자</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 레벨별 그림자 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          레벨별 그림자
        </h3>

        {/* 레벨 선택 */}
        <div className="grid grid-cols-6 gap-3 mb-6">
          {levels.map(({ key, label, desc }) => (
            <button
              key={key}
              onClick={() => setSelectedLevel(key)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedLevel === key
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="font-medium text-gray-900 dark:text-white mb-1">
                {label}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {desc}
              </div>
            </button>
          ))}
        </div>

        {/* 선택된 레벨 설정 */}
        {selectedLevel !== 'none' && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-gray-600 dark:text-gray-400">
                    X (px)
                  </label>
                  <input
                    type="number"
                    min="-50"
                    max="50"
                    value={selectedLevelData.x_offset || 0}
                    onChange={(e) => updateLevel(selectedLevel, { x_offset: parseInt(e.target.value) })}
                    className="w-12 px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={selectedLevelData.x_offset || 0}
                  onChange={(e) => updateLevel(selectedLevel, { x_offset: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-gray-600 dark:text-gray-400">
                    Y (px)
                  </label>
                  <input
                    type="number"
                    min="-50"
                    max="50"
                    value={selectedLevelData.y_offset || 0}
                    onChange={(e) => updateLevel(selectedLevel, { y_offset: parseInt(e.target.value) })}
                    className="w-12 px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={selectedLevelData.y_offset || 0}
                  onChange={(e) => updateLevel(selectedLevel, { y_offset: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-gray-600 dark:text-gray-400">
                    블러 (px)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={selectedLevelData.blur || 0}
                    onChange={(e) => updateLevel(selectedLevel, { blur: parseInt(e.target.value) })}
                    className="w-12 px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedLevelData.blur || 0}
                  onChange={(e) => updateLevel(selectedLevel, { blur: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-gray-600 dark:text-gray-400">
                    확산 (px)
                  </label>
                  <input
                    type="number"
                    min="-50"
                    max="50"
                    value={selectedLevelData.spread || 0}
                    onChange={(e) => updateLevel(selectedLevel, { spread: parseInt(e.target.value) })}
                    className="w-12 px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={selectedLevelData.spread || 0}
                  onChange={(e) => updateLevel(selectedLevel, { spread: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                색상 & 투명도
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={selectedLevelData.color?.color || '#000000'}
                  onChange={(e) => updateLevel(selectedLevel, {
                    color: { ...(selectedLevelData.color || {}), color: e.target.value }
                  })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <div className="w-40">
                  <div className="flex items-center gap-1 mb-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={selectedLevelData.color?.opacity || 10}
                      onChange={(e) => updateLevel(selectedLevel, {
                        color: { ...(selectedLevelData.color || {}), opacity: parseInt(e.target.value) }
                      })}
                      className="w-14 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <span className="text-xs text-gray-500">%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={selectedLevelData.color?.opacity || 10}
                    onChange={(e) => updateLevel(selectedLevel, {
                      color: { ...(selectedLevelData.color || {}), opacity: parseInt(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* 미리보기 */}
            <div className="h-24 flex items-center justify-center bg-gray-100 dark:bg-gray-700 p-6">
              <div
                className="w-24 h-24 bg-white dark:bg-gray-800 rounded-lg"
                style={{ boxShadow: getShadowCSS(selectedLevelData) }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 컴포넌트별 그림자 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          컴포넌트별 그림자 레벨
        </h3>
        <div className="space-y-3">
          {components.map(({ key, label, default: defaultLevel, hover: hoverLevel, value }) => {
            const componentData = settings.by_component?.[key] || {};

            if (value) {
              return (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                  <select
                    value={componentData || value}
                    onChange={(e) => onChange({
                      ...settings,
                      by_component: {
                        ...(settings.by_component || {}),
                        [key]: e.target.value
                      }
                    })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {levels.map(({ key: levelKey, label: levelLabel }) => (
                      <option key={levelKey} value={levelKey}>{levelLabel}</option>
                    ))}
                  </select>
                </div>
              );
            }

            return (
              <div key={key} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">{label}</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      기본
                    </label>
                    <select
                      value={componentData.default || defaultLevel}
                      onChange={(e) => updateComponent(key, { default: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {levels.map(({ key: levelKey, label: levelLabel }) => (
                        <option key={levelKey} value={levelKey}>{levelLabel}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      호버
                    </label>
                    <select
                      value={componentData.hover || hoverLevel}
                      onChange={(e) => updateComponent(key, { hover: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {levels.map(({ key: levelKey, label: levelLabel }) => (
                        <option key={levelKey} value={levelKey}>{levelLabel}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
