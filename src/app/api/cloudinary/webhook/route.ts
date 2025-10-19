import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

/**
 * POST /api/cloudinary/webhook
 * Cloudinary에서 보내는 Webhook 이벤트 수신
 *
 * 이벤트 종류:
 * - delete: 이미지 삭제 시
 * - upload: 이미지 업로드 시
 * - rename: 이미지 이름 변경 시
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-cld-signature');
    const timestamp = request.headers.get('x-cld-timestamp');

    // Webhook 서명 검증 (보안)
    if (process.env.CLOUDINARY_API_SECRET && signature && timestamp) {
      const expectedSignature = crypto
        .createHash('sha1')
        .update(body + process.env.CLOUDINARY_API_SECRET)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature');
        return NextResponse.json(
          { success: false, error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    // JSON 파싱
    const data = JSON.parse(body);
    console.log('Cloudinary Webhook 수신:', data);

    const { notification_type, public_id } = data;

    // 삭제 이벤트 처리
    if (notification_type === 'delete' || notification_type === 'destroy') {
      const supabase = await createClient();

      // public_id로 DB에서 이미지 찾기
      const { data: image, error: findError } = await supabase
        .from('cloudinary_images')
        .select('id, filename')
        .eq('cloudinary_id', public_id)
        .maybeSingle();

      if (findError) {
        console.error('DB 조회 오류:', findError);
        return NextResponse.json(
          { success: false, error: 'Database error' },
          { status: 500 }
        );
      }

      if (image) {
        // DB에서 이미지 레코드 삭제
        const { error: deleteError } = await supabase
          .from('cloudinary_images')
          .delete()
          .eq('id', image.id);

        if (deleteError) {
          console.error('DB 삭제 오류:', deleteError);
          return NextResponse.json(
            { success: false, error: 'Failed to delete from database' },
            { status: 500 }
          );
        }

        console.log(`✅ DB에서 이미지 삭제 완료: ${image.filename} (${public_id})`);
        return NextResponse.json({
          success: true,
          message: 'Image deleted from database',
          deleted: {
            id: image.id,
            filename: image.filename,
            cloudinary_id: public_id
          }
        });
      } else {
        console.log(`⚠️  DB에 해당 이미지 없음: ${public_id}`);
        return NextResponse.json({
          success: true,
          message: 'Image not found in database (already deleted or never stored)',
          cloudinary_id: public_id
        });
      }
    }

    // 기타 이벤트는 로그만 남김
    console.log(`기타 이벤트 수신: ${notification_type}`);
    return NextResponse.json({
      success: true,
      message: 'Event received but not processed',
      notification_type
    });

  } catch (error: any) {
    console.error('Webhook 처리 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cloudinary/webhook
 * Webhook 엔드포인트 테스트용
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Cloudinary Webhook endpoint is ready',
    url: `${request.nextUrl.origin}/api/cloudinary/webhook`
  });
}
