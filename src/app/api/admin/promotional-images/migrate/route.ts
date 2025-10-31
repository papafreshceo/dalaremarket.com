import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = await createClient();

    // Check if table already exists
    const { data: existingTable } = await supabase
      .from('promotional_images')
      .select('id')
      .limit(1);

    if (existingTable) {
      return NextResponse.json({
        success: true,
        message: 'Table already exists',
      });
    }

    // Create table using raw SQL via a Supabase function
    // Since we can't run DDL directly, we'll just verify and insert default data

    return NextResponse.json({
      success: true,
      message: 'Please run the migration manually in Supabase SQL Editor',
      sql: `
-- Run this in Supabase SQL Editor:

CREATE TABLE IF NOT EXISTS public.promotional_images (
    id BIGSERIAL PRIMARY KEY,
    image_url TEXT NOT NULL DEFAULT '',
    secure_url TEXT,
    public_id TEXT,
    display_order INTEGER NOT NULL UNIQUE,
    title TEXT,
    link_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_promotional_images_display_order ON public.promotional_images(display_order);
CREATE INDEX IF NOT EXISTS idx_promotional_images_is_active ON public.promotional_images(is_active);

ALTER TABLE public.promotional_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.promotional_images
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.promotional_images
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON public.promotional_images
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON public.promotional_images
    FOR DELETE USING (auth.role() = 'authenticated');

INSERT INTO public.promotional_images (image_url, display_order, title, is_active)
VALUES
    ('', 1, '홍보 이미지 1', true),
    ('', 2, '홍보 이미지 2', true),
    ('', 3, '홍보 이미지 3', true),
    ('', 4, '홍보 이미지 4', true)
ON CONFLICT (display_order) DO NOTHING;
      `,
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
