'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Palette,
  Layout,
  Type,
  BoxSelect,
  Layers,
  MousePointerClick,
  Save,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';

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

export default function DesignSystemPage() {
  const [activeTab, setActiveTab] = useState('colors');
  const [presets, setPresets] = useState<any[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<any>(null);
  const [presetName, setPresetName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Resizable Sidebar State
  const [sidebarWidth, setSidebarWidth] = useState(440);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    loadPresets();
  }, []);

  // Resizing Logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      // Calculate new width based on mouse position
      // We need to subtract the width of the first sidebar (256px)
      const newWidth = e.clientX - 256;

      // Set min and max constraints
      if (newWidth >= 300 && newWidth <= 800) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none'; // Prevent text selection while resizing
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const loadPresets = async () => {
    try {
      const res = await fetch('/api/admin/design-presets');
      const result = await res.json();
      if (result.success && result.data) {
        setPresets(result.data);
      }
    } catch (error) {
      console.error('프리셋 로드 실패:', error);
    }
  };

  const handleSelectPreset = (preset: any) => {
    setSelectedPreset(preset);
    setSettings(preset.settings);
    setPresetName(preset.name);
  };

  const handleSavePreset = async () => {
    if (!presetName) {
      alert('프리셋 이름을 입력하세요.');
      return;
    }

    setIsSaving(true);

    try {
      const method = selectedPreset ? 'PUT' : 'POST';
      const body = selectedPreset
        ? { id: selectedPreset.id, name: presetName, settings }
        : { name: presetName, settings };

      const res = await fetch('/api/admin/design-presets', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || '저장 실패');
      }

      await loadPresets();
      alert('저장되었습니다.');
    } catch (error: any) {
      console.error('Error saving preset:', error);
      alert('저장 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const menuGroups = [
    {
      group: '기본 설정',
      items: [
        { id: 'colors', name: '색상', icon: Palette, desc: '기본, 보조, 시멘틱 색상 관리' },
        { id: 'typography', name: '타이포그래피', icon: Type, desc: '폰트, 크기, 굵기 설정' },
        { id: 'background', name: '배경', icon: Layers, desc: '페이지 및 컴포넌트 배경' },
        { id: 'shadow', name: '그림자', icon: Layers, desc: '깊이감 및 입체감 설정' },
        { id: 'border', name: '테두리', icon: BoxSelect, desc: '둥글기, 두께, 색상' },
      ]
    },
    {
      group: '레이아웃 & 간격',
      items: [
        { id: 'spacing', name: '간격', icon: Layout, desc: '패딩, 마진, 스케일' },
        { id: 'layout', name: '레이아웃', icon: Layout, desc: '그리드, 컨테이너, 반응형' },
      ]
    },
    {
      group: '컴포넌트',
      items: [
        { id: 'components', name: '컴포넌트', icon: MousePointerClick, desc: '버튼, 입력창, 카드 등' },
        { id: 'animation', name: '애니메이션', icon: MousePointerClick, desc: '전환 효과, 키프레임' },
      ]
    }
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden font-sans">
      {/* Top Bar */}
      <header className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <h1 className="font-bold text-lg text-gray-900 dark:text-white tracking-tight">디자인 시스템</h1>
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-2" />

          <div className="flex items-center gap-2">
            <select
              value={selectedPreset?.id || ''}
              onChange={(e) => {
                const preset = presets.find(p => p.id === e.target.value);
                if (preset) handleSelectPreset(preset);
              }}
              className="text-sm border-none bg-transparent font-medium text-gray-700 dark:text-gray-200 focus:ring-0 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <option value="">프리셋 선택...</option>
              {presets.map(preset => (
                <option key={preset.id} value={preset.id}>{preset.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mr-4">
            <button
              onClick={() => setPreviewDevice('desktop')}
              className={`p-1.5 rounded-md transition-all ${previewDevice === 'desktop' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
              title="데스크탑"
            >
              <Monitor size={16} />
            </button>
            <button
              onClick={() => setPreviewDevice('tablet')}
              className={`p-1.5 rounded-md transition-all ${previewDevice === 'tablet' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
              title="태블릿"
            >
              <Tablet size={16} />
            </button>
            <button
              onClick={() => setPreviewDevice('mobile')}
              className={`p-1.5 rounded-md transition-all ${previewDevice === 'mobile' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
              title="모바일"
            >
              <Smartphone size={16} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="프리셋 이름"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-transparent focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all w-40"
            />
            <button
              onClick={handleSavePreset}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-md text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save size={16} />
              )}
              저장
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-y-auto shrink-0">
          <div className="p-4 space-y-6">
            {menuGroups.map((group, idx) => (
              <div key={idx}>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
                  {group.group}
                </h3>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group ${activeTab === item.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                    >
                      <item.icon size={18} className={activeTab === item.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'} />
                      <div className="text-left">
                        <div>{item.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 flex overflow-hidden relative">
          {/* Settings Panel (Left/Center) - Resizable */}
          <div
            ref={sidebarRef}
            className="overflow-y-auto p-6 border-r border-gray-200 dark:border-gray-700 shrink-0 bg-white dark:bg-gray-800 z-10"
            style={{ width: sidebarWidth }}
          >
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                {menuGroups.flatMap(g => g.items).find(i => i.id === activeTab)?.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {menuGroups.flatMap(g => g.items).find(i => i.id === activeTab)?.desc}
              </p>
            </div>

            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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

          {/* Resizer Handle */}
          <div
            className={`w-1 hover:w-1.5 bg-transparent hover:bg-blue-500 cursor-col-resize z-20 transition-all duration-150 flex items-center justify-center group -ml-0.5 ${isResizing ? 'bg-blue-500 w-1.5' : ''}`}
            onMouseDown={startResizing}
          >
            <div className={`h-8 w-1 rounded-full bg-gray-300 dark:bg-gray-600 group-hover:bg-white transition-colors ${isResizing ? 'bg-white' : ''}`} />
          </div>

          {/* Preview Panel (Right) - Flexible Width */}
          <div className="flex-1 bg-gray-100/50 dark:bg-gray-900/50 flex flex-col min-w-0 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur flex justify-between items-center shrink-0">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">실시간 미리보기</span>
              <div className="flex gap-2">
                {/* Additional preview controls can go here */}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-gray-100 dark:bg-black/20">
              <div
                className={`transition-all duration-300 ease-in-out origin-top shadow-2xl ${previewDevice === 'mobile' ? 'w-[375px] min-h-[667px]' :
                  previewDevice === 'tablet' ? 'w-[768px] min-h-[1024px]' : 'w-full h-full'
                  }`}
                style={{
                  transform: previewDevice === 'tablet' ? 'scale(0.85)' : 'none'
                }}
              >
                <PreviewPanel settings={settings} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
