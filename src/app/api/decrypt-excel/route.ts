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

    // 임시 디렉토리 생성 (OS의 임시 디렉토리 사용)
    const os = await import('os');
    const tempDir = os.tmpdir();

    // 또는 프로젝트 내 temp 디렉토리 사용
    // const tempDir = path.join(process.cwd(), 'temp');
    // await fs.mkdir(tempDir, { recursive: true });

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


    // Python 스크립트 실행
    try {
      // 비밀번호를 파일로 저장하여 전달 (특수문자 이스케이핑 문제 방지)
      const passwordFilePath = path.join(tempDir, `password_${uniqueId}.txt`);
      await fs.writeFile(passwordFilePath, password, 'utf-8');

      const command = `python "${scriptPath}" "${inputFilePath}" "${outputFilePath}" "${passwordFilePath}"`;

      const { stdout, stderr } = await execAsync(command);

      // 비밀번호 파일 삭제
      await fs.unlink(passwordFilePath).catch(() => {});

      // 복호화된 파일이 생성되었는지 확인
      try {
        await fs.access(outputFilePath);
      } catch (accessError) {
        throw new Error('복호화된 파일이 생성되지 않았습니다.');
      }

      // 복호화된 파일 읽기
      const decryptedBuffer = await fs.readFile(outputFilePath);

      // 임시 파일 삭제
      await fs.unlink(inputFilePath).catch(() => {});
      await fs.unlink(outputFilePath).catch(() => {});


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
      // 임시 파일 삭제
      if (inputFilePath) await fs.unlink(inputFilePath).catch(() => {});
      if (outputFilePath) await fs.unlink(outputFilePath).catch(() => {});

      const errorMessage = decryptError.message || decryptError.stderr || '';
      const fullError = `${errorMessage} ${decryptError.stdout || ''}`;

      if (
        fullError.includes('password') ||
        fullError.includes('Password') ||
        fullError.includes('incorrect') ||
        fullError.includes('decrypt') ||
        fullError.includes('Invalid')
      ) {
        return NextResponse.json(
          { error: '비밀번호가 올바르지 않습니다.' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        {
          error: '파일 복호화에 실패했습니다.',
          details: errorMessage,
          stdout: decryptError.stdout,
          stderr: decryptError.stderr
        },
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
