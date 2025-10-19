import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary/config';

/**
 * GET /api/cloudinary/folders
 * Cloudinary 폴더 구조 조회
 */
export async function GET(request: NextRequest) {
  try {
    // Cloudinary의 모든 폴더 조회
    const result = await cloudinary.api.root_folders();

    // dalreamarket 폴더의 하위 폴더들 조회
    const dalreamarketFolders = await cloudinary.api.sub_folders('dalreamarket');

    // 각 하위 폴더의 구조를 재귀적으로 가져오기
    const buildFolderTree = async (path: string, name: string): Promise<any> => {
      try {
        const subFolders = await cloudinary.api.sub_folders(path);

        const children = await Promise.all(
          subFolders.folders.map(async (folder: any) => {
            return buildFolderTree(`${path}/${folder.name}`, folder.name);
          })
        );

        return {
          name,
          path,
          children: children.length > 0 ? children : undefined,
        };
      } catch (error) {
        // 하위 폴더가 없는 경우
        return {
          name,
          path,
        };
      }
    };

    // dalreamarket의 모든 하위 폴더 트리 생성
    const folderTree = await Promise.all(
      dalreamarketFolders.folders.map(async (folder: any) => {
        return buildFolderTree(`dalreamarket/${folder.name}`, folder.name);
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        name: 'dalreamarket',
        path: 'dalreamarket',
        children: folderTree,
      },
    });
  } catch (error: any) {
    console.error('폴더 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
