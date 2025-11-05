import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = await createClient();

    // 기본 테마 CSS 변수 (현재 사용 중인 값)
    const defaultTheme = {
      name: '기본 테마 (라이트)',
      description: '현재 사용 중인 기본 디자인 테마',
      css_variables: {
        // Primary colors
        '--background': '#ffffff',
        '--foreground': '#111827',

        // Card colors
        '--card': '#ffffff',
        '--card-foreground': '#111827',

        // Popover colors
        '--popover': '#ffffff',
        '--popover-foreground': '#111827',

        // Primary brand colors
        '--primary': '#2563eb',
        '--primary-foreground': '#ffffff',

        // Secondary colors
        '--secondary': '#f3f4f6',
        '--secondary-foreground': '#111827',

        // Muted colors
        '--muted': '#f9fafb',
        '--muted-foreground': '#6b7280',

        // Accent colors
        '--accent': '#f3f4f6',
        '--accent-foreground': '#111827',

        // Destructive colors
        '--destructive': '#dc2626',
        '--destructive-foreground': '#ffffff',

        // Border
        '--border': '#e5e7eb',
        '--input': '#e5e7eb',
        '--ring': '#2563eb',

        // Radius
        '--radius': '0.75rem',

        // Chart colors
        '--chart-1': '#2563eb',
        '--chart-2': '#10b981',
        '--chart-3': '#f59e0b',
        '--chart-4': '#ef4444',
        '--chart-5': '#8b5cf6',

        // Dark mode variants (다크 모드용)
        'dark---background': '#1e1e1e',
        'dark---foreground': '#cccccc',
        'dark---card': '#2d2d30',
        'dark---card-foreground': '#cccccc',
        'dark---popover': '#2d2d30',
        'dark---popover-foreground': '#cccccc',
        'dark---primary': '#3b82f6',
        'dark---primary-foreground': '#ffffff',
        'dark---secondary': '#252526',
        'dark---secondary-foreground': '#cccccc',
        'dark---muted': '#252526',
        'dark---muted-foreground': '#9c9c9c',
        'dark---accent': '#3e3e42',
        'dark---accent-foreground': '#cccccc',
        'dark---destructive': '#ef4444',
        'dark---destructive-foreground': '#ffffff',
        'dark---border': '#3e3e42',
        'dark---input': '#3e3e42',
        'dark---ring': '#3b82f6'
      },
      is_active: true
    };

    // 기존 활성 테마 비활성화
    const { error: deactivateError } = await supabase
      .from('design_themes')
      .update({ is_active: false })
      .eq('is_active', true);

    if (deactivateError) {
      console.error('기존 테마 비활성화 실패:', deactivateError);
    }

    // 새 기본 테마 삽입
    const { data, error } = await supabase
      .from('design_themes')
      .insert([defaultTheme])
      .select();

    if (error) {
      console.error('테마 생성 실패:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '기본 테마가 성공적으로 생성되었습니다.',
      theme: data
    });
  } catch (error) {
    console.error('기본 테마 생성 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
