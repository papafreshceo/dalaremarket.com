import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary/config';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/cloudinary/upload
 * Cloudinary에 이미지 업로드 후 DB에 메타데이터 저장
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string || '기타';
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const tags = formData.get('tags') as string; // 콤마로 구분된 태그
    const isPublic = formData.get('is_public') === 'true';
    const isDownloadable = formData.get('is_downloadable') === 'true';

    if (!file) {
      return NextResponse.json(
        { success: false, error: '파일이 필요합니다.' },
        { status: 400 }
      );
    }

    // File을 Buffer로 변환
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Cloudinary에 업로드
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'dalreamarket', // Cloudinary 폴더명
          resource_type: 'auto',
          tags: tags ? tags.split(',').map(t => t.trim()) : [],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    // DB에 메타데이터 저장
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('cloudinary_images')
      .insert({
        cloudinary_id: uploadResult.public_id,
        cloudinary_url: uploadResult.url,
        secure_url: uploadResult.secure_url,
        filename: file.name,
        format: uploadResult.format,
        width: uploadResult.width,
        height: uploadResult.height,
        file_size: uploadResult.bytes,
        category,
        title: title || file.name,
        description,
        tags: tags ? tags.split(',').map(t => t.trim()) : [],
        is_public: isPublic,
        is_downloadable: isDownloadable,
      })
      .select()
      .single();

    if (error) {
      console.error('DB 저장 오류:', error);
      // Cloudinary에서 삭제 (롤백)
      await cloudinary.uploader.destroy(uploadResult.public_id);
      return NextResponse.json(
        { success: false, error: 'DB 저장 실패' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        cloudinary: uploadResult,
      },
    });
  } catch (error: any) {
    console.error('업로드 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
