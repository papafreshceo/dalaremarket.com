import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import logger from '@/lib/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // category_4별로 option_products를 그룹핑하여 조회
    const { data, error } = await supabase
      .from('option_products')
      .select('id, option_name, seller_supply_price, category_4')
      .not('category_4', 'is', null)
      .order('category_4', { ascending: true })
      .order('option_name', { ascending: true });

    if (error) {
      logger.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json([]);
    }

    // category_4별로 그룹핑
    const groupedData: Record<string, any[]> = {};

    data.forEach((item) => {
      const category = item.category_4 || '미분류';
      if (!groupedData[category]) {
        groupedData[category] = [];
      }
      groupedData[category].push({
        id: item.id,
        option_name: item.option_name,
        seller_supply_price: item.seller_supply_price || 0
      });
    });

    // 결과를 배열로 변환
    const result = Object.entries(groupedData).map(([category_4, option_products]) => ({
      category_4,
      option_products
    }));

    return NextResponse.json(result);
  } catch (error) {
    logger.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category products' },
      { status: 500 }
    );
  }
}
