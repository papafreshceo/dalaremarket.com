-- cloudinary_images 테이블에 file_hash 컬럼 추가
-- 파일 내용 기반 중복 체크를 위한 SHA-256 해시값 저장

ALTER TABLE cloudinary_images
ADD COLUMN IF NOT EXISTS file_hash TEXT;

-- 해시값 검색을 위한 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_cloudinary_images_file_hash ON cloudinary_images(file_hash);

-- 파일명 검색을 위한 인덱스 추가 (기존에 없었다면)
CREATE INDEX IF NOT EXISTS idx_cloudinary_images_filename ON cloudinary_images(filename);

-- 폴더별 파일명 고유성을 위한 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_cloudinary_images_folder_filename ON cloudinary_images(cloudinary_id);

-- 테이블 주석 업데이트
COMMENT ON COLUMN cloudinary_images.file_hash IS '파일 내용의 SHA-256 해시값 (중복 체크용)';
