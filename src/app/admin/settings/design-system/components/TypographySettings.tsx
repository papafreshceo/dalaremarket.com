'use client';

interface TypographySettingsProps {
  settings: any;
  onChange: (settings: any) => void;
}

export default function TypographySettings({ settings, onChange }: TypographySettingsProps) {
  const textSizes = [
    { key: 'h1', label: 'H1 (대제목)', preview: '대제목 스타일' },
    { key: 'h2', label: 'H2 (소제목)', preview: '소제목 스타일' },
    { key: 'h3', label: 'H3 (제목)', preview: '제목 스타일' },
    { key: 'h4', label: 'H4 (소제목)', preview: '소제목 스타일' },
    { key: 'body', label: 'Body (본문)', preview: '본문 텍스트 스타일' },
    { key: 'small', label: 'Small (작은글)', preview: '작은 텍스트 스타일' },
    { key: 'xs', label: 'XS (최소)', preview: '최소 텍스트' }
  ];

  const weights = [
    { value: 100, label: 'Thin' },
    { value: 200, label: 'Extra Light' },
    { value: 300, label: 'Light' },
    { value: 400, label: 'Normal' },
    { value: 500, label: 'Medium' },
    { value: 600, label: 'Semibold' },
    { value: 700, label: 'Bold' },
    { value: 800, label: 'Extra Bold' },
    { value: 900, label: 'Black' }
  ];

  const colorTypes = [
    { key: 'default', label: '기본', desc: '일반 텍스트' },
    { key: 'secondary', label: '보조', desc: '보조 텍스트' },
    { key: 'disabled', label: '비활성', desc: '비활성 텍스트' }
  ];

  const updateSize = (key: string, updates: any) => {
    onChange({
      ...settings,
      sizes: {
        ...settings.sizes,
        [key]: {
          ...(settings.sizes?.[key] || {}),
          ...updates
        }
      }
    });
  };

  const updateColor = (key: string, updates: any) => {
    onChange({
      ...settings,
      color: {
        ...settings.color,
        [key]: {
          ...(settings.color?.[key] || {}),
          ...updates
        }
      }
    });
  };

  return (
    <div className="space-y-2">

      {/* 기본 설정 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          기본 설정
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                기본 크기 (px)
              </label>
              <input
                type="number"
                min="12"
                max="24"
                value={settings.base_size || 16}
                onChange={(e) => onChange({ ...settings, base_size: parseInt(e.target.value) })}
                className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <input
              type="range"
              min="12"
              max="24"
              value={settings.base_size || 16}
              onChange={(e) => onChange({ ...settings, base_size: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              기본 굵기
            </label>
            <select
              value={settings.base_weight || 400}
              onChange={(e) => onChange({ ...settings, base_weight: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {weights.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 텍스트 크기별 설정 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          텍스트 크기별 설정
        </h3>
        <div className="space-y-6">
          {textSizes.map(({ key, label, preview }) => {
            const sizeData = settings.sizes?.[key] || {};
            return (
              <div key={key} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">{label}</h4>
                  <div
                    className="text-gray-900 dark:text-white"
                    style={{
                      fontSize: `${sizeData.size || 16}px`,
                      fontWeight: sizeData.weight || 400,
                      lineHeight: sizeData.line_height || 1.5,
                      letterSpacing: `${sizeData.letter_spacing || 0}px`
                    }}
                  >
                    {preview}
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-gray-600 dark:text-gray-400">
                        크기 (px)
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="48"
                        value={sizeData.size || 16}
                        onChange={(e) => updateSize(key, { size: parseInt(e.target.value) })}
                        className="w-12 px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="48"
                      value={sizeData.size || 16}
                      onChange={(e) => updateSize(key, { size: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      굵기
                    </label>
                    <select
                      value={sizeData.weight || 400}
                      onChange={(e) => updateSize(key, { weight: parseInt(e.target.value) })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {weights.map(({ value, label }) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-gray-600 dark:text-gray-400">
                        행간
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="3"
                        step="0.1"
                        value={sizeData.line_height || 1.5}
                        onChange={(e) => updateSize(key, { line_height: parseFloat(e.target.value) })}
                        className="w-12 px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.1"
                      value={sizeData.line_height || 1.5}
                      onChange={(e) => updateSize(key, { line_height: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-gray-600 dark:text-gray-400">
                        자간 (px)
                      </label>
                      <input
                        type="number"
                        min="-2"
                        max="2"
                        step="0.1"
                        value={sizeData.letter_spacing || 0}
                        onChange={(e) => updateSize(key, { letter_spacing: parseFloat(e.target.value) })}
                        className="w-12 px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <input
                      type="range"
                      min="-2"
                      max="2"
                      step="0.1"
                      value={sizeData.letter_spacing || 0}
                      onChange={(e) => updateSize(key, { letter_spacing: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 텍스트 색상 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          텍스트 색상
        </h3>
        <div className="space-y-4">
          {colorTypes.map(({ key, label, desc }) => {
            const colorData = settings.color?.[key] || {};
            return (
              <div key={key} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{label}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                  </div>
                  <div
                    className="px-4 py-2 rounded"
                    style={{
                      color: colorData.color || '#000000',
                      opacity: (colorData.opacity || 100) / 100
                    }}
                  >
                    샘플 텍스트
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={colorData.color || '#000000'}
                    onChange={(e) => updateColor(key, { color: e.target.value })}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={colorData.color || '#000000'}
                    onChange={(e) => updateColor(key, { color: e.target.value })}
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
                          value={colorData.opacity || 100}
                          onChange={(e) => updateColor(key, { opacity: parseInt(e.target.value) })}
                          className="w-14 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <span className="text-xs text-gray-500">%</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={colorData.opacity || 100}
                      onChange={(e) => updateColor(key, { opacity: parseInt(e.target.value) })}
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
  );
}
