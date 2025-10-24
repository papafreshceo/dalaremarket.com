import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary/config';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

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

    // 업로드 타입별 ID 정보
    const uploadType = formData.get('upload_type') as string;
    const rootFolder = (formData.get('root_folder') as string) || 'dalraemarket'; // 기본값: dalraemarket
    const rawMaterialId = formData.get('raw_material_id') as string;
    const optionProductId = formData.get('option_product_id') as string;
    const category4Id = formData.get('category_4_id') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: '파일이 필요합니다.' },
        { status: 400 }
      );
    }

    // File을 Buffer로 변환
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 파일 해시 계산 (SHA-256)
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

    // Supabase 클라이언트 생성 (폴더 경로 조회용)
    const supabase = await createClient();

    // 1. 해시 기반 중복 체크
    const { data: hashDuplicate } = await supabase
      .from('cloudinary_images')
      .select('id, filename, secure_url, cloudinary_id')
      .eq('file_hash', fileHash)
      .maybeSingle();

    if (hashDuplicate) {
      return NextResponse.json(
        {
          success: false,
          error: '동일한 파일이 이미 존재합니다.',
          duplicate: {
            type: 'hash',
            message: `같은 내용의 파일이 이미 업로드되어 있습니다: ${hashDuplicate.filename}`,
            existingFile: hashDuplicate
          }
        },
        { status: 409 }
      );
    }

    // Cloudinary 폴더 경로 결정
    let folderPath = rootFolder; // 루트 폴더를 기본값으로 사용

    // personal 타입이 아닐 경우에만 하위 폴더 구조 생성
    if (uploadType !== 'personal') {
      if (uploadType === 'category_4' && category4Id) {
        // 품목 단위: {rootFolder}/{품목코드}/
        const { data: category } = await supabase
          .from('products_master')
          .select('category_4_code')
          .eq('id', category4Id)
          .single();

        if (category?.category_4_code) {
          folderPath = `${rootFolder}/${category.category_4_code}`;
        }
      } else if (uploadType === 'option_product' && optionProductId) {
        // 옵션상품 단위: {rootFolder}/{품목코드}/{옵션상품코드}/
        const { data: optionProduct } = await supabase
          .from('option_products')
          .select('option_code, product_master_id')
          .eq('id', optionProductId)
          .single();

        if (optionProduct?.product_master_id) {
          // 옵션상품의 품목 마스터로 품목코드 조회
          const { data: category } = await supabase
            .from('products_master')
            .select('category_4_code')
            .eq('id', optionProduct.product_master_id)
            .single();

          if (category?.category_4_code && optionProduct.option_code) {
            folderPath = `${rootFolder}/${category.category_4_code}/${optionProduct.option_code}`;
          }
        }
      } else if (uploadType === 'raw_material' && rawMaterialId) {
        // 원물 단위: {rootFolder}/raw_materials/{원물코드}/
        const { data: rawMaterial } = await supabase
          .from('raw_materials')
          .select('material_code')
          .eq('id', rawMaterialId)
          .single();

        if (rawMaterial?.material_code) {
          folderPath = `${rootFolder}/raw_materials/${rawMaterial.material_code}`;
        }
      }
    }

    // 2. 파일명 기반 중복 체크 (같은 폴더 내)
    const expectedCloudinaryId = `${folderPath}/${file.name.replace(/\.[^/.]+$/, '')}`; // 확장자 제외한 경로
    const { data: filenameDuplicate } = await supabase
      .from('cloudinary_images')
      .select('id, filename, secure_url, cloudinary_id')
      .eq('filename', file.name)
      .ilike('cloudinary_id', `${folderPath}/%`)
      .maybeSingle();

    if (filenameDuplicate) {
      return NextResponse.json(
        {
          success: false,
          error: '같은 이름의 파일이 이미 존재합니다.',
          duplicate: {
            type: 'filename',
            message: `같은 폴더에 동일한 파일명이 이미 존재합니다: ${filenameDuplicate.filename}`,
            existingFile: filenameDuplicate
          }
        },
        { status: 409 }
      );
    }

    // Cloudinary에 업로드 (이미지 최적화 옵션 포함)
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folderPath, // 동적 폴더 경로
          resource_type: 'auto',
          tags: tags ? tags.split(',').map(t => t.trim()) : [],
          // 이미지 최적화 옵션
          quality: 'auto:good', // 자동 품질 최적화 (auto:best, auto:good, auto:eco, auto:low)
          fetch_format: 'auto', // 브라우저별 최적 포맷 자동 선택 (WebP, AVIF 등)
          flags: 'lossy', // 손실 압축 활성화
          // HD 절반 수준 (960x540) 최적화 - 용량 대폭 감소
          transformation: [
            {
              width: 960,
              height: 960,
              crop: 'limit', // 비율 유지하며 최대 크기 제한 (작은 이미지는 확대 안함)
            }
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    // 저장할 데이터 객체 생성
    const insertData: any = {
      cloudinary_id: uploadResult.public_id,
      cloudinary_url: uploadResult.url,
      secure_url: uploadResult.secure_url,
      filename: file.name,
      format: uploadResult.format,
      width: uploadResult.width,
      height: uploadResult.height,
      file_size: uploadResult.bytes,
      file_hash: fileHash, // 파일 해시 저장
      category,
      title: title || file.name,
      description,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      is_public: isPublic,
      is_downloadable: isDownloadable,
    };

    console.log('=== 이미지 업로드 - 대표이미지 설정 ===');
    console.log('uploadType:', uploadType);
    console.log('외래 키:', { rawMaterialId, optionProductId, category4Id });

    // 업로드 타입에 따라 관련 ID 추가 및 기존 대표이미지 해제
    // ⚠️ 중요: 외래 키가 실제로 존재할 때만 대표이미지로 설정
    if (uploadType === 'raw_material' && rawMaterialId) {
      insertData.raw_material_id = rawMaterialId;
      insertData.is_representative = true; // 자동으로 대표이미지로 설정
      console.log('원물 대표이미지로 설정:', rawMaterialId);

      // 기존 대표이미지 해제
      await supabase
        .from('cloudinary_images')
        .update({ is_representative: false })
        .eq('raw_material_id', rawMaterialId);

    } else if (uploadType === 'option_product' && optionProductId) {
      insertData.option_product_id = optionProductId;
      insertData.is_representative = true; // 자동으로 대표이미지로 설정
      console.log('옵션상품 대표이미지로 설정:', optionProductId);

      // 기존 대표이미지 해제
      await supabase
        .from('cloudinary_images')
        .update({ is_representative: false })
        .eq('option_product_id', optionProductId);

    } else if (uploadType === 'category_4' && category4Id) {
      insertData.category_4_id = category4Id;
      insertData.is_representative = true; // 자동으로 대표이미지로 설정
      console.log('품목 대표이미지로 설정:', category4Id);

      // 기존 대표이미지 해제
      await supabase
        .from('cloudinary_images')
        .update({ is_representative: false })
        .eq('category_4_id', category4Id);
    } else {
      // 외래 키가 없으면 대표이미지로 설정하지 않음
      insertData.is_representative = false;
      console.log('외래 키 없음 - 대표이미지 아님');
    }

    const { data, error } = await supabase
      .from('cloudinary_images')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('DB 저장 오류:', error);
      console.error('에러 상세:', JSON.stringify(error, null, 2));
      console.error('저장하려던 데이터:', JSON.stringify(insertData, null, 2));
      // Cloudinary에서 삭제 (롤백)
      await cloudinary.uploader.destroy(uploadResult.public_id);
      return NextResponse.json(
        { success: false, error: `DB 저장 실패: ${error.message || error.code || 'Unknown error'}`, details: error },
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
