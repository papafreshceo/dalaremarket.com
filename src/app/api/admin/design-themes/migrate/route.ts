import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extended CSS variables with all UI elements
    const themes = [
      {
        name: 'Neobrutalism Default',
        description: '기본 네오브루탈리즘 디자인 시스템',
        css_variables: {
          "--font-sans": "DM Sans, sans-serif",
          "--font-mono": "Space Mono, monospace",
          "--color-primary": "#2563eb",
          "--color-primary-hover": "#1d4ed8",
          "--color-secondary": "#ffffff",
          "--color-accent": "#fef3c7",
          "--color-background": "#ffffff",
          "--color-surface": "#ffffff",
          "--color-surface-hover": "#f9fafb",
          "--color-text": "#111827",
          "--color-text-secondary": "#4b5563",
          "--color-text-tertiary": "#6b7280",
          "--color-border": "#e5e7eb",
          "--color-border-hover": "#d1d5db",
          "--color-success": "#10b981",
          "--color-warning": "#f59e0b",
          "--color-danger": "#dc2626",
          "--border-width": "1px",
          "--shadow-sm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
          "--shadow-md": "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          "--shadow-lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          "--radius": "0.5rem"
        },
        is_active: true
      },
      {
        name: 'Soft Neobrutalism',
        description: '부드러운 네오브루탈리즘 스타일',
        css_variables: {
          "--font-sans": "DM Sans, sans-serif",
          "--font-mono": "Space Mono, monospace",
          "--color-primary": "#6366f1",
          "--color-primary-hover": "#4f46e5",
          "--color-secondary": "#f8fafc",
          "--color-accent": "#dbeafe",
          "--color-background": "#f8fafc",
          "--color-surface": "#ffffff",
          "--color-surface-hover": "#f1f5f9",
          "--color-text": "#1e293b",
          "--color-text-secondary": "#475569",
          "--color-text-tertiary": "#64748b",
          "--color-border": "#cbd5e1",
          "--color-border-hover": "#94a3b8",
          "--color-success": "#22c55e",
          "--color-warning": "#f59e0b",
          "--color-danger": "#ef4444",
          "--border-width": "1px",
          "--shadow-sm": "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          "--shadow-md": "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          "--shadow-lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          "--radius": "0.75rem"
        },
        is_active: false
      },
      {
        name: 'Dark Modern',
        description: '다크 모던 테마',
        css_variables: {
          "--font-sans": "Inter, sans-serif",
          "--font-mono": "Fira Code, monospace",
          "--color-primary": "#3b82f6",
          "--color-primary-hover": "#2563eb",
          "--color-secondary": "#1f2937",
          "--color-accent": "#fbbf24",
          "--color-background": "#111827",
          "--color-surface": "#1f2937",
          "--color-surface-hover": "#374151",
          "--color-text": "#f9fafb",
          "--color-text-secondary": "#d1d5db",
          "--color-text-tertiary": "#9ca3af",
          "--color-border": "#374151",
          "--color-border-hover": "#4b5563",
          "--color-success": "#34d399",
          "--color-warning": "#fbbf24",
          "--color-danger": "#f87171",
          "--border-width": "1px",
          "--shadow-sm": "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
          "--shadow-md": "0 4px 6px -1px rgba(0, 0, 0, 0.4)",
          "--shadow-lg": "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
          "--radius": "0.5rem"
        },
        is_active: false
      }
    ];

    // Update each theme with extended CSS variables
    const results = [];
    for (const theme of themes) {
      const { data: existing } = await supabase
        .from('design_themes')
        .select('id')
        .eq('name', theme.name)
        .single();

      if (existing) {
        // Update existing theme
        const { data, error } = await supabase
          .from('design_themes')
          .update({
            description: theme.description,
            css_variables: theme.css_variables,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        results.push({ action: 'updated', ...data });
      } else {
        // Insert new theme
        const { data, error } = await supabase
          .from('design_themes')
          .insert(theme)
          .select()
          .single();

        if (error) throw error;
        results.push({ action: 'created', ...data });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Themes migrated successfully',
      results
    });

  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
