'use client';

import { useState, useEffect } from 'react';
import ColorSettings from './components/ColorSettings';
import BackgroundSettings from './components/BackgroundSettings';
import TypographySettings from './components/TypographySettings';
import BorderSettings from './components/BorderSettings';
import ShadowSettings from './components/ShadowSettings';
import SpacingSettings from './components/SpacingSettings';
import AnimationSettings from './components/AnimationSettings';
import LayoutSettings from './components/LayoutSettings';
import ComponentSettings from './components/ComponentSettings';
import PreviewPanel from './components/PreviewPanel';
import { createClient } from '@/lib/supabase/client';

export default function DesignSystemPage() {
  const [activeTab, setActiveTab] = useState('colors');
  const [presets, setPresets] = useState<any[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<any>(null);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 기본 설정 구조
  const [settings, setSettings] = useState<any>({
    colors: {
      palette_100: [],
      primary: { base: '#2563eb', opacity: 100, tones: {} },
      secondary: { base: '#10b981', opacity: 100, tones: {} },
      success: { base: '#22c55e', opacity: 100, tones: {} },
      warning: { base: '#f59e0b', opacity: 100, tones: {} },
      error: { base: '#ef4444', opacity: 100, tones: {} },
      info: { base: '#3b82f6', opacity: 100, tones: {} },
      neutral: { base: '#6b7280', opacity: 100, tones: {} },
      tone_adjustments: { saturation: 0, lightness: 0, temperature: 0 },
      preset_tone: 'vibrant'
    },
    background: {
      light: { type: 'solid', solid: { color: '#ffffff', opacity: 100 }, gradient: { enabled: false, colors: [], direction: 'to bottom', angle: 180 } },
      medium: { type: 'solid', solid: { color: '#f3f4f6', opacity: 100 }, gradient: { enabled: false, colors: [], direction: 'to bottom', angle: 180 } },
      dark: { type: 'solid', solid: { color: '#1f2937', opacity: 100 }, gradient: { enabled: false, colors: [], direction: 'to bottom', angle: 180 } }
    },
    typography: {
      base_size: 16,
      base_weight: 400,
      sizes: {},
      weights: {},
      color: {}
    },
    border: {},
    shadow: {},
    spacing: {},
    animation: {},
    layout: {},
    components: {},
    icon: {},
    overlay: {},
    interactions: {}
  });

  const supabase = createClient();

  // 프리셋 목록 불러오기
  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    const { data, error } = await supabase
      .from('platform_design_presets')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (data) {
      setPresets(data);
    }
  };

  // 프리셋 선택
  const handleSelectPreset = (preset: any) => {
    setSelectedPreset(preset);
    setSettings(preset.settings);
    setPresetName(preset.name);
    setPresetDescription(preset.description || '');
  };

  // 프리셋 저장
  const handleSavePreset = async () => {
    if (!presetName) {
      alert('프리셋 이름을 입력하세요.');
      return;
    }

    setIsSaving(true);

    try {
      if (selectedPreset) {
        // 업데이트
        const { error } = await supabase
          .from('platform_design_presets')
          .update({
            name: presetName,
            description: presetDescription,
            settings: settings
          })
          .eq('id', selectedPreset.id);

        if (error) throw error;
        alert('프리셋이 업데이트되었습니다!');
      } else {
        // 새로 생성
        const { error } = await supabase
          .from('platform_design_presets')
          .insert({
            name: presetName,
            description: presetDescription,
            settings: settings,
            is_active: true
          });

        if (error) throw error;
        alert('프리셋이 생성되었습니다!');
      }

      loadPresets();
    } catch (error) {
      console.error('Error saving preset:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 새 프리셋 시작
  const handleNewPreset = () => {
    setSelectedPreset(null);
    setPresetName('');
    setPresetDescription('');
    setSettings({
      colors: {
        palette_100: [],
        primary: { base: '#2563eb', opacity: 100, tones: {} },
        secondary: { base: '#10b981', opacity: 100, tones: {} },
        success: { base: '#22c55e', opacity: 100, tones: {} },
        warning: { base: '#f59e0b', opacity: 100, tones: {} },
        error: { base: '#ef4444', opacity: 100, tones: {} },
        info: { base: '#3b82f6', opacity: 100, tones: {} },
        neutral: { base: '#6b7280', opacity: 100, tones: {} },
        tone_adjustments: { saturation: 0, lightness: 0, temperature: 0 },
        preset_tone: 'vibrant'
      },
      background: {},
      typography: {},
      border: {},
      shadow: {},
      spacing: {},
      animation: {},
      layout: {},
      components: {},
      icon: {},
      overlay: {},
      interactions: {}
    });
  };

  const menuGroups = [
    {
      group: '기본 스타일',
      items: [
        { id: 'colors', name: '색상', icon: '🎨' },
        { id: 'background', name: '배경', icon: '🖼️' },
        { id: 'typography', name: '타이포그래피', icon: '📝' }
      ]
    },
    {
      group: '테두리 & 그림자',
      items: [
        { id: 'border', name: '테두리', icon: '⬜' },
        { id: 'shadow', name: '그림자', icon: '☁️' }
      ]
    },
    {
      group: '레이아웃',
      items: [
        { id: 'spacing', name: '간격/여백', icon: '📏' },
        { id: 'layout', name: '레이아웃', icon: '📐' }
      ]
    },
    {
      group: '인터랙션',
      items: [
        { id: 'animation', name: '애니메이션', icon: '⚡' }
      ]
    },
    {
      group: '컴포넌트',
      items: [
        { id: 'components', name: '컴포넌트', icon: '🧩' }
      ]
    }
  ];

  return (
    <div className="h-screen flex overflow-hidden">
      {/* 사이드바 */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* 프리셋 관리 */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            디자인 시스템
          </h1>
          <select
            value={selectedPreset?.id || ''}
            onChange={(e) => {
              const preset = presets.find(p => p.id === e.target.value);
              if (preset) handleSelectPreset(preset);
            }}
            className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-2"
          >
            <option value="">프리셋 선택</option>
            {presets.map(preset => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="프리셋 이름"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-2"
          />
          <input
            type="text"
            placeholder="설명"
            value={presetDescription}
            onChange={(e) => setPresetDescription(e.target.value)}
            className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-2"
          />
          <div className="flex gap-2">
            <button
              onClick={handleNewPreset}
              className="flex-1 px-2 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              새 프리셋
            </button>
            <button
              onClick={handleSavePreset}
              disabled={isSaving}
              className="flex-1 px-2 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? '저장중' : '저장'}
            </button>
          </div>
        </div>

        {/* 메뉴 */}
        <div className="flex-1 overflow-y-auto p-2">
          {menuGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="mb-4">
              <div className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                {group.group}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded transition-colors ${
                      activeTab === item.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          {activeTab === 'colors' && (
            <ColorSettings
              settings={settings.colors}
              onChange={(colors) => setSettings({ ...settings, colors })}
            />
          )}
          {activeTab === 'background' && (
            <BackgroundSettings
              settings={settings.background}
              onChange={(background) => setSettings({ ...settings, background })}
            />
          )}
          {activeTab === 'typography' && (
            <TypographySettings
              settings={settings.typography}
              onChange={(typography) => setSettings({ ...settings, typography })}
            />
          )}
          {activeTab === 'border' && (
            <BorderSettings
              settings={settings.border}
              onChange={(border) => setSettings({ ...settings, border })}
            />
          )}
          {activeTab === 'shadow' && (
            <ShadowSettings
              settings={settings.shadow}
              onChange={(shadow) => setSettings({ ...settings, shadow })}
            />
          )}
          {activeTab === 'spacing' && (
            <SpacingSettings
              settings={settings.spacing}
              onChange={(spacing) => setSettings({ ...settings, spacing })}
            />
          )}
          {activeTab === 'animation' && (
            <AnimationSettings
              settings={settings.animation}
              onChange={(animation) => setSettings({ ...settings, animation })}
            />
          )}
          {activeTab === 'layout' && (
            <LayoutSettings
              settings={settings.layout}
              onChange={(layout) => setSettings({ ...settings, layout })}
            />
          )}
          {activeTab === 'components' && (
            <ComponentSettings
              settings={settings.components}
              onChange={(components) => setSettings({ ...settings, components })}
            />
          )}
        </div>
      </div>

      {/* 우측 미리보기 */}
      <div className="w-[800px] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
        <PreviewPanel settings={settings} />
      </div>
    </div>
  );
}
