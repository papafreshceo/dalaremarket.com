'use client';

import { useState } from 'react';

interface AnimationSettingsProps {
  settings: any;
  onChange: (settings: any) => void;
}

export default function AnimationSettings({ settings, onChange }: AnimationSettingsProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const durations = [
    { key: 'instant', label: 'Instant', value: 0, desc: '즉시' },
    { key: 'fastest', label: 'Fastest', value: 50, desc: '매우 빠름' },
    { key: 'fast', label: 'Fast', value: 100, desc: '빠름' },
    { key: 'normal', label: 'Normal', value: 200, desc: '보통' },
    { key: 'slow', label: 'Slow', value: 300, desc: '느림' },
    { key: 'slower', label: 'Slower', value: 500, desc: '더 느림' },
    { key: 'slowest', label: 'Slowest', value: 1000, desc: '가장 느림' }
  ];

  const timings = [
    { key: 'linear', label: 'Linear', value: 'linear', desc: '일정한 속도' },
    { key: 'ease', label: 'Ease', value: 'ease', desc: '부드럽게' },
    { key: 'ease_in', label: 'Ease In', value: 'ease-in', desc: '느리게 시작' },
    { key: 'ease_out', label: 'Ease Out', value: 'ease-out', desc: '느리게 끝' },
    { key: 'ease_in_out', label: 'Ease In Out', value: 'ease-in-out', desc: '느리게 시작/끝' },
    { key: 'bounce', label: 'Bounce', value: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', desc: '튕기는 효과' }
  ];

  const interactions = [
    { key: 'hover', label: '호버', desc: '마우스 오버 시' },
    { key: 'focus', label: '포커스', desc: '포커스 시' },
    { key: 'modal', label: '모달', desc: '모달 표시 시' },
    { key: 'dropdown', label: '드롭다운', desc: '드롭다운 표시 시' }
  ];

  const updateDuration = (key: string, value: number) => {
    onChange({
      ...settings,
      duration: {
        ...(settings.duration || {}),
        [key]: value
      }
    });
  };

  const updateTiming = (key: string, value: string) => {
    onChange({
      ...settings,
      timing: {
        ...(settings.timing || {}),
        [key]: value
      }
    });
  };

  const updateInteraction = (interaction: string, updates: any) => {
    onChange({
      ...settings,
      by_interaction: {
        ...(settings.by_interaction || {}),
        [interaction]: {
          ...(settings.by_interaction?.[interaction] || {}),
          ...updates
        }
      }
    });
  };

  const testAnimation = (duration: string, timing: string) => {
    setIsAnimating(false);
    setTimeout(() => setIsAnimating(true), 10);
    setTimeout(() => setIsAnimating(false), (settings.duration?.[duration] || 200) + 100);
  };

  return (
    <div className="space-y-2">

      {/* 지속시간 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          지속시간 (Duration)
        </h3>
        <div className="space-y-4">
          {durations.map(({ key, label, value: defaultValue, desc }) => (
            <div key={key} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{label}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="2000"
                    step="50"
                    value={settings.duration?.[key] ?? defaultValue}
                    onChange={(e) => updateDuration(key, parseInt(e.target.value))}
                    className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <span className="text-sm text-gray-500">ms</span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="2000"
                step="50"
                value={settings.duration?.[key] ?? defaultValue}
                onChange={(e) => updateDuration(key, parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 타이밍 함수 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          타이밍 함수 (Timing Function)
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {timings.map(({ key, label, value: defaultValue, desc }) => (
            <div key={key} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{label}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                </div>
                <button
                  onClick={() => testAnimation('normal', key)}
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                  테스트
                </button>
              </div>
              <input
                type="text"
                value={settings.timing?.[key] || defaultValue}
                onChange={(e) => updateTiming(key, e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
              />
              {/* 애니메이션 미리보기 */}
              <div className="mt-3 h-8 bg-white dark:bg-gray-800 rounded overflow-hidden">
                <div
                  className={`h-full bg-blue-600 ${isAnimating ? 'w-full' : 'w-0'}`}
                  style={{
                    transition: `width ${settings.duration?.normal || 200}ms ${settings.timing?.[key] || defaultValue}`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 인터랙션별 설정 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          인터랙션별 애니메이션
        </h3>
        <div className="space-y-4">
          {interactions.map(({ key, label, desc }) => {
            const interactionData = settings.by_interaction?.[key] || {};
            return (
              <div key={key} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{label}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                  </div>
                  <button
                    onClick={() => testAnimation(interactionData.duration || 'normal', interactionData.timing || 'ease_out')}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    테스트
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      지속시간
                    </label>
                    <select
                      value={interactionData.duration || 'normal'}
                      onChange={(e) => updateInteraction(key, { duration: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {durations.map(({ key: dKey, label: dLabel }) => (
                        <option key={dKey} value={dKey}>{dLabel}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      타이밍
                    </label>
                    <select
                      value={interactionData.timing || 'ease_out'}
                      onChange={(e) => updateInteraction(key, { timing: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {timings.map(({ key: tKey, label: tLabel }) => (
                        <option key={tKey} value={tKey}>{tLabel}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 통합 테스트 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          애니메이션 통합 테스트
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-7 gap-2">
            {durations.map(({ key, label }) => (
              <div key={key} className="text-center">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">{label}</div>
                <button
                  onClick={() => testAnimation(key, 'ease_out')}
                  className="w-full aspect-square bg-blue-600 hover:bg-blue-700 rounded transition-all"
                  style={{
                    transitionDuration: `${settings.duration?.[key] || durations.find(d => d.key === key)?.value}ms`
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
