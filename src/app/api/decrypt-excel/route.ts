import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  let inputFilePath: string | null = null;
  let outputFilePath: string | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const password = formData.get('password') as string;

    if (!file) {
      return NextResponse.json(
        { error: '파일이 제공되지 않았습니다.' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: '비밀번호가 제공되지 않았습니다.' },
        { status: 400 }
      );
    }

    // 임시 디렉토리 생성
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.mkdir(tempDir, { recursive: true });

    // 고유한 파일명 생성
    const uniqueId = uuidv4();
    inputFilePath = path.join(tempDir, `input_${uniqueId}.xlsx`);
    outputFilePath = path.join(tempDir, `output_${uniqueId}.xlsx`);

    // 업로드된 파일을 임시 파일로 저장
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(inputFilePath, buffer);

    // Python 스크립트 경로
    const scriptPath = path.join(process.cwd(), 'scripts', 'decrypt_excel.py');

    console.log('=== 복호화 시작 ===');
    console.log('스크립트 경로:', scriptPath);
    console.log('입력 파일:', inputFilePath);
    console.log('출력 파일:', outputFilePath);

    // Python 스크립트 실행
    try {
      const command = `python "${scriptPath}" "${inputFilePath}" "${outputFilePath}" "${password}"`;
      console.log('실행 명령:', command);

      const { stdout, stderr } = await execAsync(command);

      console.log('Python stdout:', stdout);
      if (stderr) {
        console.error('Python stderr:', stderr);
      }

      // 복호화된 파일이 생성되었는지 확인
      try {
        await fs.access(outputFilePath);
      } catch {
        throw new Error('복호화된 파일이 생성되지 않았습니다.');
      }

      // 복호화된 파일 읽기
      const decryptedBuffer = await fs.readFile(outputFilePath);

      // 임시 파일 삭제
      await fs.unlink(inputFilePath).catch(() => {});
      await fs.unlink(outputFilePath).catch(() => {});

      console.log('복호화 성공! 파일 크기:', decryptedBuffer.length, 'bytes');

      // 파일명을 URL 인코딩 (한글 파일명 처리)
      const encodedFileName = encodeURIComponent(file.name);

      // 복호화된 파일을 클라이언트에 반환
      return new NextResponse(decryptedBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename*=UTF-8''${encodedFileName}`,
        },
      });
    } catch (decryptError: any) {
      console.error('복호화 오류:', decryptError);

      // 임시 파일 삭제
      if (inputFilePath) await fs.unlink(inputFilePath).catch(() => {});
      if (outputFilePath) await fs.unlink(outputFilePath).catch(() => {});

      const errorMessage = decryptError.message || decryptError.stderr || '';

      if (
        errorMessage.includes('password') ||
        errorMessage.includes('Password') ||
        errorMessage.includes('incorrect') ||
        errorMessage.includes('decrypt') ||
        errorMessage.includes('Invalid')
      ) {
        return NextResponse.json(
          { error: '비밀번호가 올바르지 않습니다.' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: '파일 복호화에 실패했습니다: ' + errorMessage },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('API 오류:', error);

    // 임시 파일 삭제
    if (inputFilePath) await fs.unlink(inputFilePath).catch(() => {});
    if (outputFilePath) await fs.unlink(outputFilePath).catch(() => {});

    return NextResponse.json(
      { error: error.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
