'use client';

import { useState } from 'react';
import {
  generateColorTones,
  generateSemanticColors,
  applyToneAdjustments,
  generate100ColorPalette,
  applyPresetTone
} from '../utils/colorGenerator';

interface ColorSettingsProps {
  settings: any;
  onChange: (settings: any) => void;
}

export default function ColorSettings({ settings, onChange }: ColorSettingsProps) {
  const [selectedColorType, setSelectedColorType] = useState<string>('primary');

  // 100개 팔레트 생성
  const handleGenerate100Palette = () => {
    const palette = generate100ColorPalette();
    onChange({
      ...settings,
      palette_100: palette
    });
  };

  // 시멘틱 색상 자동 생성
  const handleGenerateSemanticColors = () => {
    const semantic = generateSemanticColors(settings.primary.base);
    const newSettings = { ...settings };

    Object.entries(semantic).forEach(([key, color]) => {
      if (newSettings[key]) {
        newSettings[key] = {
          base: color,
          opacity: 100,
          tones: generateColorTones(color as string)
        };
      }
    });

    onChange(newSettings);
  };

  // 기본 색상 변경 + 톤 자동 생성
  const handleBaseColorChange = (type: string, color: string) => {
    const tones = generateColorTones(color);
    onChange({
      ...settings,
      [type]: {
        base: color,
        opacity: settings[type]?.opacity || 100,
        tones
      }
    });
  };

  // 톤 조절 적용
  const handleToneAdjustment = (key: string, value: number) => {
    const newAdjustments = {
      ...settings.tone_adjustments,
      [key]: value
    };

    const newSettings = { ...settings, tone_adjustments: newAdjustments };

    // 모든 색상에 톤 조절 적용
    ['primary', 'secondary', 'success', 'warning', 'error', 'info', 'neutral'].forEach(colorType => {
      const adjusted = applyToneAdjustments(
        settings[colorType].base,
        newAdjustments.saturation,
        newAdjustments.lightness,
        newAdjustments.temperature
      );
      newSettings[colorType] = {
        ...settings[colorType],
        base: adjusted,
        tones: generateColorTones(adjusted)
      };
    });

    onChange(newSettings);
  };

  // 프리셋 톤 적용
  const handlePresetTone = (preset: string) => {
    const newSettings = { ...settings, preset_tone: preset };

    ['primary', 'secondary', 'success', 'warning', 'error', 'info', 'neutral'].forEach(colorType => {
      const adjusted = applyPresetTone(settings[colorType].base, preset);
      newSettings[colorType] = {
        ...settings[colorType],
        base: adjusted,
        tones: generateColorTones(adjusted)
      };
    });

    onChange(newSettings);
  };

  const colorTypes = [
    { key: 'primary', label: 'Primary', emoji: '🔵' },
    { key: 'secondary', label: 'Secondary', emoji: '🟢' },
    { key: 'success', label: 'Success', emoji: '✅' },
    { key: 'warning', label: 'Warning', emoji: '⚠️' },
    { key: 'error', label: 'Error', emoji: '❌' },
    { key: 'info', label: 'Info', emoji: 'ℹ️' },
    { key: 'neutral', label: 'Neutral', emoji: '⚪' }
  ];

  const presetTones = [
    { key: 'vibrant', label: 'Vibrant', desc: '선명하고 강렬한 색상' },
    { key: 'pastel', label: 'Pastel', desc: '부드럽고 연한 색상' },
    { key: 'dark', label: 'Dark', desc: '어둡고 깊은 색상' },
    { key: 'monochrome', label: 'Monochrome', desc: '흑백 색상' },
    { key: 'warm', label: 'Warm', desc: '따뜻한 색온도' },
    { key: 'cool', label: 'Cool', desc: '차가운 색온도' }
  ];

  return (
    <div className="space-y-2">

      {/* 100개 팔레트 */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              100개 색상 팔레트
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Tailwind 스타일 100개 색상
            </p>
          </div>
          <button
            onClick={handleGenerate100Palette}
            className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
          >
            자동 생성
          </button>
        </div>

        <div className="grid grid-cols-20 gap-1">
          {(settings.palette_100 || []).map((color: string, idx: number) => (
            <div
              key={idx}
              className="aspect-square rounded cursor-pointer hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* 시멘틱 색상 */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              시멘틱 색상
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Primary 색상 기반 자동 생성
            </p>
          </div>
          <button
            onClick={handleGenerateSemanticColors}
            className="px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700"
          >
            자동 생성
          </button>
        </div>

        {/* 색상 타입 선택 */}
        <div className="grid grid-cols-7 gap-1.5 mb-3">
          {colorTypes.map(({ key, label, emoji }) => (
            <button
              key={key}
              onClick={() => setSelectedColorType(key)}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedColorType === key
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

        {/* 선택된 색상 편집 */}
        {selectedColorType && settings[selectedColorType] && (
          <div className="space-y-4">
            {/* 기본 색상 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                기본 색상
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings[selectedColorType].base}
                  onChange={(e) => handleBaseColorChange(selectedColorType, e.target.value)}
                  className="w-20 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={settings[selectedColorType].base}
                  onChange={(e) => handleBaseColorChange(selectedColorType, e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700 dark:text-gray-300">투명도</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings[selectedColorType].opacity}
                    onChange={(e) => onChange({
                      ...settings,
                      [selectedColorType]: {
                        ...settings[selectedColorType],
                        opacity: parseInt(e.target.value)
                      }
                    })}
                    className="w-16 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>
            </div>

            {/* 50-900 톤 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                색상 톤 (50-900)
              </label>
              <div className="grid grid-cols-10 gap-2">
                {Object.entries(settings[selectedColorType].tones || {}).map(([tone, data]: [string, any]) => (
                  <div key={tone} className="space-y-1">
                    <div
                      className="aspect-square rounded-lg border border-gray-300 dark:border-gray-600"
                      style={{ backgroundColor: data.color }}
                    />
                    <div className="text-xs text-center text-gray-600 dark:text-gray-400">
                      {tone}
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={data.opacity}
                      onChange={(e) => {
                        const newTones = { ...settings[selectedColorType].tones };
                        newTones[tone] = { ...newTones[tone], opacity: parseInt(e.target.value) };
                        onChange({
                          ...settings,
                          [selectedColorType]: {
                            ...settings[selectedColorType],
                            tones: newTones
                          }
                        });
                      }}
                      className="w-full px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 톤 조절 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          전체 톤 조절
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              채도 ({settings.tone_adjustments?.saturation || 0})
            </label>
            <input
              type="range"
              min="-100"
              max="100"
              value={settings.tone_adjustments?.saturation || 0}
              onChange={(e) => handleToneAdjustment('saturation', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              밝기 ({settings.tone_adjustments?.lightness || 0})
            </label>
            <input
              type="range"
              min="-100"
              max="100"
              value={settings.tone_adjustments?.lightness || 0}
              onChange={(e) => handleToneAdjustment('lightness', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              색온도 ({settings.tone_adjustments?.temperature || 0})
            </label>
            <input
              type="range"
              min="-100"
              max="100"
              value={settings.tone_adjustments?.temperature || 0}
              onChange={(e) => handleToneAdjustment('temperature', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* 프리셋 톤 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          프리셋 톤
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {presetTones.map(({ key, label, desc }) => (
            <button
              key={key}
              onClick={() => handlePresetTone(key)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                settings.preset_tone === key
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
      </div>
    </div>
  );
}
