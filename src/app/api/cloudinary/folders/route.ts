import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary/config';
import logger from '@/lib/logger';

/**
 * GET /api/cloudinary/folders
 * Cloudinary 폴더 구조 조회
 */
export async function GET(request: NextRequest) {
  try {
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

    // 루트 폴더들 정의
    const rootFolders = ['dalraemarket', 'papafresh'];
    const folderTrees = [];

    // 각 루트 폴더의 트리 생성
    for (const rootFolder of rootFolders) {
      try {
        const subFolders = await cloudinary.api.sub_folders(rootFolder);

        const children = await Promise.all(
          subFolders.folders.map(async (folder: any) => {
            return buildFolderTree(`${rootFolder}/${folder.name}`, folder.name);
          })
        );

        folderTrees.push({
          name: rootFolder,
          path: rootFolder,
          children: children.length > 0 ? children : undefined,
        });
      } catch (error) {
        // 폴더가 없는 경우 빈 폴더로 추가
        folderTrees.push({
          name: rootFolder,
          path: rootFolder,
          children: undefined,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: folderTrees, // 배열로 반환
    });
  } catch (error: any) {
    logger.error('폴더 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
