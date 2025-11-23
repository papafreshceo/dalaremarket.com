'use client';

import { useState } from 'react';
import {
  RefreshCw,
  Wand2,
  Check,
  Copy,
  Sliders
} from 'lucide-react';
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
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const handleCopy = (color: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const handleGenerate100Palette = () => {
    const palette = generate100ColorPalette();
    onChange({
      ...settings,
      palette_100: palette
    });
  };

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

  const handleToneAdjustment = (key: string, value: number) => {
    const newAdjustments = {
      ...settings.tone_adjustments,
      [key]: value
    };

    const newSettings = { ...settings, tone_adjustments: newAdjustments };

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
    { key: 'primary', label: '기본 색상 (Primary)', desc: '브랜드 메인 색상' },
    { key: 'secondary', label: '보조 색상 (Secondary)', desc: '강조 및 보조 색상' },
    { key: 'success', label: '성공 (Success)', desc: '긍정적 상태 표시' },
    { key: 'warning', label: '경고 (Warning)', desc: '주의 필요 상태' },
    { key: 'error', label: '오류 (Error)', desc: '치명적 상태 표시' },
    { key: 'info', label: '정보 (Info)', desc: '일반 정보 표시' },
    { key: 'neutral', label: '중립 (Neutral)', desc: '텍스트 및 테두리' }
  ];

  const presetTones = [
    { key: 'vibrant', label: '생생한' },
    { key: 'pastel', label: '파스텔' },
    { key: 'dark', label: '다크' },
    { key: 'monochrome', label: '모노' },
    { key: 'warm', label: '따뜻한' },
    { key: 'cool', label: '차가운' }
  ];

  return (
    <div className="space-y-8">
      {/* Main Color Configuration */}
      <div className="grid grid-cols-12 gap-8">
        {/* Left: Color Selection */}
        <div className="col-span-4 space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 px-1">
            색상 역할
          </label>
          <div className="space-y-1">
            {colorTypes.map(({ key, label, desc }) => (
              <button
                key={key}
                onClick={() => setSelectedColorType(key)}
                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all border ${selectedColorType === key
                    ? 'bg-white dark:bg-gray-800 border-blue-500 ring-1 ring-blue-500 shadow-sm'
                    : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
              >
                <div
                  className="w-8 h-8 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 shrink-0"
                  style={{ backgroundColor: settings[key]?.base }}
                />
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Detailed Settings */}
        <div className="col-span-8 space-y-6">
          {selectedColorType && settings[selectedColorType] && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                    {colorTypes.find(t => t.key === selectedColorType)?.label}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    기본 색상 및 생성된 톤 설정
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="color"
                      value={settings[selectedColorType].base}
                      onChange={(e) => handleBaseColorChange(selectedColorType, e.target.value)}
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    />
                    <div
                      className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm flex items-center justify-center text-white"
                      style={{ backgroundColor: settings[selectedColorType].base }}
                    >
                      <Wand2 size={16} />
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={settings[selectedColorType].base}
                      onChange={(e) => handleBaseColorChange(selectedColorType, e.target.value)}
                      className="w-28 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-transparent font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Tones Grid */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    생성된 톤
                  </label>
                  <span className="text-xs text-gray-500">클릭하여 복사</span>
                </div>
                <div className="grid grid-cols-10 gap-2">
                  {Object.entries(settings[selectedColorType].tones || {}).map(([tone, data]: [string, any]) => (
                    <button
                      key={tone}
                      onClick={() => handleCopy(data.color)}
                      className="group relative aspect-square rounded-md transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      style={{ backgroundColor: data.color }}
                      title={`${tone}: ${data.color}`}
                    >
                      {copiedColor === data.color && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-md">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-400 px-1">
                  <span>50</span>
                  <span>500</span>
                  <span>900</span>
                </div>
              </div>
            </div>
          )}

          {/* Global Adjustments */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Sliders size={18} className="text-gray-500" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                전역 조정
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">채도 (Saturation)</label>
                    <span className="text-xs text-gray-500">{settings.tone_adjustments?.saturation || 0}%</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={settings.tone_adjustments?.saturation || 0}
                    onChange={(e) => handleToneAdjustment('saturation', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">밝기 (Lightness)</label>
                    <span className="text-xs text-gray-500">{settings.tone_adjustments?.lightness || 0}%</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={settings.tone_adjustments?.lightness || 0}
                    onChange={(e) => handleToneAdjustment('lightness', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">프리셋 무드</label>
                <div className="grid grid-cols-3 gap-2">
                  {presetTones.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => handlePresetTone(key)}
                      className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${settings.preset_tone === key
                          ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleGenerateSemanticColors}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
            >
              <Wand2 size={16} />
              시멘틱 색상 자동 생성
            </button>
            <button
              onClick={handleGenerate100Palette}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
            >
              <RefreshCw size={16} />
              팔레트 재생성
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
