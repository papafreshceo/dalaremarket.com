'use client';

import { Type, AlignLeft, MoveVertical } from 'lucide-react';

interface TypographySettingsProps {
  settings: any;
  onChange: (settings: any) => void;
}

export default function TypographySettings({ settings, onChange }: TypographySettingsProps) {
  const handleChange = (key: string, value: any) => {
    onChange({
      ...settings,
      [key]: value
    });
  };

  const handleSizeChange = (key: string, field: string, value: any) => {
    const newSizes = { ...settings.sizes };
    if (!newSizes[key]) newSizes[key] = {};
    newSizes[key][field] = value;
    handleChange('sizes', newSizes);
  };

  const typographyLevels = [
    { key: 'h1', label: '제목 1 (Heading 1)', defaultSize: 32, defaultWeight: 700 },
    { key: 'h2', label: '제목 2 (Heading 2)', defaultSize: 24, defaultWeight: 600 },
    { key: 'h3', label: '제목 3 (Heading 3)', defaultSize: 20, defaultWeight: 600 },
    { key: 'body', label: '본문 (Body Text)', defaultSize: 16, defaultWeight: 400 },
    { key: 'small', label: '작은 텍스트 (Small)', defaultSize: 14, defaultWeight: 400 },
  ];

  return (
    <div className="space-y-8">
      {/* Global Font Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Type size={18} className="text-gray-500" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            글꼴 설정
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              폰트 패밀리
            </label>
            <input
              type="text"
              value={settings.font_family || ''}
              onChange={(e) => handleChange('font_family', e.target.value)}
              placeholder="Inter, sans-serif"
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-transparent text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              폰트 스택 입력 (예: "Inter, system-ui, sans-serif")
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              기본 크기 (px)
            </label>
            <input
              type="number"
              value={settings.base_size || 16}
              onChange={(e) => handleChange('base_size', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-transparent text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Typography Scale */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <MoveVertical size={18} className="text-gray-500" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            타이포그래피 스케일
          </h3>
        </div>

        <div className="space-y-4">
          {typographyLevels.map((level) => (
            <div
              key={level.key}
              className="flex items-center gap-4 p-4 rounded-lg border border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50"
            >
              <div className="w-32 shrink-0">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {level.label}
                </span>
                <div className="text-xs text-gray-500">{level.key}</div>
              </div>

              <div className="flex-1 grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">크기 (px)</label>
                  <input
                    type="number"
                    value={settings.sizes?.[level.key]?.size || level.defaultSize}
                    onChange={(e) => handleSizeChange(level.key, 'size', parseInt(e.target.value))}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">굵기</label>
                  <select
                    value={settings.sizes?.[level.key]?.weight || level.defaultWeight}
                    onChange={(e) => handleSizeChange(level.key, 'weight', parseInt(e.target.value))}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                  >
                    <option value="300">Light (300)</option>
                    <option value="400">Regular (400)</option>
                    <option value="500">Medium (500)</option>
                    <option value="600">SemiBold (600)</option>
                    <option value="700">Bold (700)</option>
                    <option value="800">ExtraBold (800)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">줄 높이</label>
                  <input
                    type="number"
                    step="0.1"
                    value={settings.sizes?.[level.key]?.lineHeight || 1.5}
                    onChange={(e) => handleSizeChange(level.key, 'lineHeight', parseFloat(e.target.value))}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                  />
                </div>
              </div>

              <div className="w-32 shrink-0 text-right">
                <div
                  style={{
                    fontSize: `${settings.sizes?.[level.key]?.size || level.defaultSize}px`,
                    fontWeight: settings.sizes?.[level.key]?.weight || level.defaultWeight,
                  }}
                  className="truncate"
                >
                  Aa
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
