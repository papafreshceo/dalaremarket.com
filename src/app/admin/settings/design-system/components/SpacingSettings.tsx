'use client';

interface SpacingSettingsProps {
  settings: any;
  onChange: (settings: any) => void;
}

export default function SpacingSettings({ settings, onChange }: SpacingSettingsProps) {
  const components = [
    { key: 'button', label: '버튼', icon: '🔘' },
    { key: 'input', label: '입력', icon: '📝' },
    { key: 'card', label: '카드', icon: '🃏' },
    { key: 'section', label: '섹션', icon: '📦' }
  ];

  const updateScale = (index: number, value: number) => {
    const newScale = [...(settings.scale || [])];
    newScale[index] = value;
    onChange({ ...settings, scale: newScale });
  };

  const addToScale = () => {
    const scale = settings.scale || [];
    const lastValue = scale[scale.length - 1] || 0;
    onChange({ ...settings, scale: [...scale, lastValue + 8] });
  };

  const removeFromScale = (index: number) => {
    const newScale = [...(settings.scale || [])];
    newScale.splice(index, 1);
    onChange({ ...settings, scale: newScale });
  };

  const updateComponent = (component: string, updates: any) => {
    onChange({
      ...settings,
      component_spacing: {
        ...(settings.component_spacing || {}),
        [component]: {
          ...(settings.component_spacing?.[component] || {}),
          ...updates
        }
      }
    });
  };

  return (
    <div className="space-y-2">

      {/* 기본 단위 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          기본 단위
        </h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            간격 단위 (px)
          </label>
          <input
            type="number"
            min="1"
            max="16"
            value={settings.unit || 4}
            onChange={(e) => onChange({ ...settings, unit: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            모든 간격은 이 단위의 배수로 설정됩니다 (권장: 4px)
          </p>
        </div>
      </div>

      {/* 간격 스케일 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              간격 스케일
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              사용할 수 있는 간격 값들을 정의합니다
            </p>
          </div>
          <button
            onClick={addToScale}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            + 추가
          </button>
        </div>

        <div className="grid grid-cols-8 gap-3">
          {(settings.scale || []).map((value: number, index: number) => (
            <div key={index} className="relative">
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-full aspect-square bg-blue-100 dark:bg-blue-900/30 rounded border border-blue-300 dark:border-blue-700 flex items-center justify-center"
                  style={{ height: `${Math.min(value, 64)}px` }}
                >
                  <span className="text-xs text-blue-600 dark:text-blue-400">{value}</span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={value}
                  onChange={(e) => updateScale(index, parseInt(e.target.value))}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                />
                {index > 0 && (
                  <button
                    onClick={() => removeFromScale(index)}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    삭제
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 컴포넌트별 간격 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          컴포넌트별 간격
        </h3>
        <div className="space-y-6">
          {components.map(({ key, label, icon }) => {
            const componentData = settings.component_spacing?.[key] || {};

            return (
              <div key={key} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">{icon}</span>
                  <h4 className="font-medium text-gray-900 dark:text-white">{label}</h4>
                </div>

                {key === 'button' && (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        가로 패딩 (px)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={componentData.padding_x || 16}
                        onChange={(e) => updateComponent(key, { padding_x: parseInt(e.target.value) })}
                        className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        세로 패딩 (px)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={componentData.padding_y || 8}
                        onChange={(e) => updateComponent(key, { padding_y: parseInt(e.target.value) })}
                        className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        내부 간격 (px)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={componentData.gap || 8}
                        onChange={(e) => updateComponent(key, { gap: parseInt(e.target.value) })}
                        className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                {key === 'input' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        가로 패딩 (px)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={componentData.padding_x || 12}
                        onChange={(e) => updateComponent(key, { padding_x: parseInt(e.target.value) })}
                        className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        세로 패딩 (px)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={componentData.padding_y || 8}
                        onChange={(e) => updateComponent(key, { padding_y: parseInt(e.target.value) })}
                        className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                {key === 'card' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        패딩 (px)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={componentData.padding || 16}
                        onChange={(e) => updateComponent(key, { padding: parseInt(e.target.value) })}
                        className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        내부 간격 (px)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={componentData.gap || 12}
                        onChange={(e) => updateComponent(key, { gap: parseInt(e.target.value) })}
                        className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                {key === 'section' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        패딩 (px)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={componentData.padding || 24}
                        onChange={(e) => updateComponent(key, { padding: parseInt(e.target.value) })}
                        className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        내부 간격 (px)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={componentData.gap || 16}
                        onChange={(e) => updateComponent(key, { gap: parseInt(e.target.value) })}
                        className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                {/* 미리보기 */}
                <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">미리보기</div>
                  {key === 'button' && (
                    <button
                      className="bg-blue-600 text-white rounded"
                      style={{
                        paddingLeft: `${componentData.padding_x || 16}px`,
                        paddingRight: `${componentData.padding_x || 16}px`,
                        paddingTop: `${componentData.padding_y || 8}px`,
                        paddingBottom: `${componentData.padding_y || 8}px`
                      }}
                    >
                      버튼
                    </button>
                  )}
                  {key === 'input' && (
                    <input
                      type="text"
                      placeholder="입력 필드"
                      className="border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      style={{
                        paddingLeft: `${componentData.padding_x || 12}px`,
                        paddingRight: `${componentData.padding_x || 12}px`,
                        paddingTop: `${componentData.padding_y || 8}px`,
                        paddingBottom: `${componentData.padding_y || 8}px`
                      }}
                    />
                  )}
                  {key === 'card' && (
                    <div
                      className="border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                      style={{
                        padding: `${componentData.padding || 16}px`,
                        gap: `${componentData.gap || 12}px`
                      }}
                    >
                      <div className="text-gray-900 dark:text-white">카드 제목</div>
                      <div className="text-gray-600 dark:text-gray-400 text-sm">카드 내용</div>
                    </div>
                  )}
                  {key === 'section' && (
                    <div
                      className="bg-gray-100 dark:bg-gray-700 rounded"
                      style={{
                        padding: `${componentData.padding || 24}px`
                      }}
                    >
                      <div className="text-gray-900 dark:text-white">섹션 영역</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
