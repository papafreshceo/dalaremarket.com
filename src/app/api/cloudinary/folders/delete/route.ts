import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import cloudinary from '@/lib/cloudinary/config';

/**
 * DELETE /api/cloudinary/folders/delete
 * Cloudinary 폴더 및 폴더 내 모든 이미지 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folderPath = searchParams.get('folder_path');

    if (!folderPath) {
      return NextResponse.json(
        { success: false, error: '폴더 경로가 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. DB에서 해당 폴더의 모든 이미지 조회
    const { data: images, error: fetchError } = await supabase
      .from('cloudinary_images')
      .select('id, cloudinary_id, filename')
      .ilike('cloudinary_id', `${folderPath}/%`);

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    // 이미지가 없어도 계속 진행 (빈 폴더 삭제 허용)
    const imageCount = images?.length || 0;

    // 2. Cloudinary에서 폴더 삭제 (폴더 내 모든 리소스 삭제)
    try {
      // Cloudinary API를 사용하여 폴더 삭제
      await cloudinary.api.delete_resources_by_prefix(folderPath);

      // 폴더 자체도 삭제
      await cloudinary.api.delete_folder(folderPath);
    } catch (cloudinaryError: any) {
      console.error('Cloudinary 폴더 삭제 오류:', cloudinaryError);
      // Cloudinary 오류는 계속 진행 (DB는 정리)
    }

    // 3. DB에서 해당 폴더의 모든 이미지 삭제
    const { error: deleteError } = await supabase
      .from('cloudinary_images')
      .delete()
      .ilike('cloudinary_id', `${folderPath}/%`);

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `폴더가 삭제되었습니다.`,
      deleted: {
        folderPath,
        imageCount,
        images: images ? images.map(img => ({
          id: img.id,
          filename: img.filename,
          cloudinary_id: img.cloudinary_id
        })) : []
      }
    });

  } catch (error: any) {
    console.error('폴더 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
