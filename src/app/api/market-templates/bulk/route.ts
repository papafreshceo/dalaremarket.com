import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(request: NextRequest) {
  try {
    const { templates } = await request.json();

    if (!templates || !Array.isArray(templates)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Update each template
    const updatePromises = templates.map((template: any) => {
      const { id, ...updateData } = template;

      return supabase
        .from('market_upload_templates')
        .update(updateData)
        .eq('id', id);
    });

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      count: templates.length,
    });
  } catch (error: any) {
    console.error('마켓 템플릿 수정 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
