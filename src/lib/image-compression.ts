/**
 * 클라이언트 사이드 이미지 압축 유틸리티
 * 브라우저에서 이미지를 리사이징하여 파일 크기를 줄입니다.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1 사이의 값
  maxSizeMB?: number; // 최대 파일 크기 (MB)
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.85,
  maxSizeMB: 10,
};

/**
 * 이미지 파일을 압축합니다.
 * @param file 원본 이미지 파일
 * @param options 압축 옵션
 * @returns 압축된 파일
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // 이미지 파일이 아니면 원본 반환
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // 이미 작은 파일이면 압축하지 않음
  const fileSizeMB = file.size / 1024 / 1024;
  if (fileSizeMB <= (opts.maxSizeMB || 10)) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // 리사이징 비율 계산
        let { width, height } = img;
        const maxW = opts.maxWidth || 1920;
        const maxH = opts.maxHeight || 1920;

        if (width > maxW || height > maxH) {
          const ratio = Math.min(maxW / width, maxH / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        // Canvas에 그리기
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context를 가져올 수 없습니다.'));
          return;
        }

        // 이미지 품질 향상 설정
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // 이미지 그리기
        ctx.drawImage(img, 0, 0, width, height);

        // Blob으로 변환 (압축)
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('이미지를 Blob으로 변환할 수 없습니다.'));
              return;
            }

            // File 객체로 변환
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          file.type,
          opts.quality || 0.85
        );
      };

      img.onerror = () => {
        reject(new Error('이미지를 로드할 수 없습니다.'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('파일을 읽을 수 없습니다.'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * 여러 이미지 파일을 병렬로 압축합니다.
 * @param files 원본 이미지 파일 배열
 * @param options 압축 옵션
 * @returns 압축된 파일 배열
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<File[]> {
  return Promise.all(files.map((file) => compressImage(file, options)));
}
