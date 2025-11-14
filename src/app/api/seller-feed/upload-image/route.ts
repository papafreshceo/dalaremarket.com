import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary/config';
import { createClientForRouteHandler } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientForRouteHandler();

    // 인증 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: '이미지 파일이 필요합니다.' },
        { status: 400 }
      );
    }

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: '이미지 파일만 업로드 가능합니다.' },
        { status: 400 }
      );
    }

    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: '이미지 파일 크기는 5MB 이하여야 합니다.' },
        { status: 400 }
      );
    }

    // 파일을 Buffer로 변환
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Cloudinary에 업로드 (Promise로 래핑)
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'seller-feed',
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' }, // 최대 크기 제한
            { quality: 'auto' }, // 자동 품질 최적화
            { fetch_format: 'auto' } // 자동 포맷 최적화
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    const result = uploadResult as any;

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
    });

  } catch (error: any) {
    console.error('이미지 업로드 오류:', error);
    return NextResponse.json(
      { success: false, error: '이미지 업로드 중 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}
