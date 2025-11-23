import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/products/categories
 *
 * 품목마스터에서 카테고리 트리 구조 조회
 * - RLS 우회를 위해 Admin Client 사용
 */
export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('products_master')
      .select('category_1, category_2')
      .eq('is_active', true);

    if (error) {
      console.error('[products/categories] 카테고리 조회 오류:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // 트리 구조 생성
    const tree: Record<string, string[]> = {};

    data?.forEach((item) => {
      if (item.category_1 && item.category_2) {
        if (!tree[item.category_1]) {
          tree[item.category_1] = [];
        }
        if (!tree[item.category_1].includes(item.category_2)) {
          tree[item.category_1].push(item.category_2);
        }
      }
    });

    // category_2 정렬
    Object.keys(tree).forEach((cat1) => {
      tree[cat1].sort();
    });

    return NextResponse.json({
      success: true,
      data: tree
    });

  } catch (error: any) {
    console.error('[products/categories] API 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
