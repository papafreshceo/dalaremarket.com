'use client';

interface LayoutSettingsProps {
  settings: any;
  onChange: (settings: any) => void;
}

export default function LayoutSettings({ settings, onChange }: LayoutSettingsProps) {
  const layoutSections = [
    {
      key: 'container',
      label: '컨테이너',
      icon: '📦',
      fields: [
        { key: 'max_width', label: '최대 너비', unit: 'px', min: 1000, max: 2000, step: 100 },
        { key: 'padding_x', label: '좌우 패딩', unit: 'px', min: 0, max: 100, step: 4 }
      ]
    },
    {
      key: 'sidebar',
      label: '사이드바',
      icon: '📋',
      fields: [
        { key: 'width', label: '너비', unit: 'px', min: 200, max: 400, step: 10 },
        { key: 'collapsed_width', label: '접힌 너비', unit: 'px', min: 40, max: 100, step: 10 }
      ]
    },
    {
      key: 'header',
      label: '헤더',
      icon: '🎯',
      fields: [
        { key: 'height', label: '높이', unit: 'px', min: 50, max: 120, step: 10 },
        { key: 'mobile_height', label: '모바일 높이', unit: 'px', min: 40, max: 100, step: 10 }
      ]
    },
    {
      key: 'footer',
      label: '푸터',
      icon: '📌',
      fields: [
        { key: 'height', label: '높이', unit: 'px', min: 100, max: 400, step: 20 }
      ]
    }
  ];

  const updateSection = (section: string, field: string, value: number) => {
    onChange({
      ...settings,
      [section]: {
        ...(settings[section] || {}),
        [field]: value
      }
    });
  };

  return (
    <div className="space-y-2">

      {/* 섹션별 설정 */}
      {layoutSections.map(({ key, label, icon, fields }) => {
        const sectionData = settings[key] || {};

        return (
          <div key={key} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{icon}</span>
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                {label}
              </h3>
            </div>

            <div className="space-y-6">
              {fields.map(({ key: fieldKey, label: fieldLabel, unit, min, max, step }) => {
                const value = sectionData[fieldKey] || 0;

                return (
                  <div key={fieldKey}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {fieldLabel}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={min}
                          max={max}
                          step={step}
                          value={value}
                          onChange={(e) => updateSection(key, fieldKey, parseInt(e.target.value))}
                          className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <span className="text-sm text-gray-500">{unit}</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={step}
                      value={value}
                      onChange={(e) => updateSection(key, fieldKey, parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                );
              })}
            </div>

            {/* 미리보기 */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                미리보기
              </label>
              <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg overflow-hidden">
                {key === 'container' && (
                  <div
                    className="bg-white dark:bg-gray-800 border-2 border-dashed border-blue-400 dark:border-blue-600 rounded mx-auto"
                    style={{
                      maxWidth: `${sectionData.max_width || 1400}px`,
                      paddingLeft: `${sectionData.padding_x || 24}px`,
                      paddingRight: `${sectionData.padding_x || 24}px`,
                      height: '80px'
                    }}
                  >
                    <div className="h-full flex items-center justify-center text-gray-600 dark:text-gray-400 text-sm">
                      Container ({sectionData.max_width || 1400}px)
                    </div>
                  </div>
                )}

                {key === 'sidebar' && (
                  <div className="flex gap-4">
                    <div
                      className="bg-blue-600 text-white rounded flex items-center justify-center text-sm font-medium"
                      style={{
                        width: `${sectionData.width || 250}px`,
                        height: '100px'
                      }}
                    >
                      Sidebar<br />{sectionData.width || 250}px
                    </div>
                    <div
                      className="bg-gray-400 text-white rounded flex items-center justify-center text-sm"
                      style={{
                        width: `${sectionData.collapsed_width || 60}px`,
                        height: '100px'
                      }}
                    >
                      {sectionData.collapsed_width || 60}px
                    </div>
                  </div>
                )}

                {key === 'header' && (
                  <div className="space-y-3">
                    <div
                      className="bg-blue-600 text-white rounded flex items-center justify-center text-sm font-medium"
                      style={{ height: `${sectionData.height || 70}px` }}
                    >
                      Desktop Header ({sectionData.height || 70}px)
                    </div>
                    <div
                      className="bg-blue-500 text-white rounded flex items-center justify-center text-sm"
                      style={{ height: `${sectionData.mobile_height || 60}px` }}
                    >
                      Mobile Header ({sectionData.mobile_height || 60}px)
                    </div>
                  </div>
                )}

                {key === 'footer' && (
                  <div
                    className="bg-gray-800 text-white rounded flex items-center justify-center text-sm font-medium"
                    style={{ height: `${sectionData.height || 200}px` }}
                  >
                    Footer ({sectionData.height || 200}px)
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* 전체 레이아웃 미리보기 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          전체 레이아웃 미리보기
        </h3>
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
          <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg" style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Header */}
            <div
              className="bg-blue-600 text-white flex items-center justify-center text-xs font-medium"
              style={{ height: `${Math.min((settings.header?.height || 70) / 2, 50)}px` }}
            >
              Header
            </div>

            {/* Body with Sidebar */}
            <div className="flex">
              {/* Sidebar */}
              <div
                className="bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs"
                style={{
                  width: `${Math.min((settings.sidebar?.width || 250) / 3, 100)}px`,
                  height: '150px'
                }}
              >
                Sidebar
              </div>

              {/* Content */}
              <div
                className="flex-1 bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs"
                style={{
                  padding: `${Math.min((settings.container?.padding_x || 24) / 2, 20)}px`
                }}
              >
                <div className="text-center text-gray-600 dark:text-gray-400">
                  Content Area<br />
                  <span className="text-xs">Max width: {settings.container?.max_width || 1400}px</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              className="bg-gray-800 text-white flex items-center justify-center text-xs font-medium"
              style={{ height: `${Math.min((settings.footer?.height || 200) / 3, 60)}px` }}
            >
              Footer
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
