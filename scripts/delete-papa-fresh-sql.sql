-- papa_fresh@naver.com 완전 삭제

-- 1. 트리거 비활성화
ALTER TABLE auth.users DISABLE TRIGGER ALL;

-- 2. public.users에서 사용자 ID 조회 및 삭제
DO $$
DECLARE
  user_uuid UUID;
BEGIN
  -- 사용자 ID 조회
  SELECT id INTO user_uuid FROM public.users WHERE email = 'papa_fresh@naver.com';

  IF user_uuid IS NOT NULL THEN
    RAISE NOTICE '사용자 ID: %', user_uuid;

    -- auth.users에서 삭제
    DELETE FROM auth.users WHERE id = user_uuid;
    RAISE NOTICE 'auth.users 삭제 완료';

    -- public.users에서 삭제
    DELETE FROM public.users WHERE id = user_uuid;
    RAISE NOTICE 'public.users 삭제 완료';

  ELSE
    RAISE NOTICE '해당 이메일의 사용자가 없습니다.';
  END IF;
END $$;

-- 3. 트리거 재활성화
ALTER TABLE auth.users ENABLE TRIGGER ALL;

-- 확인
SELECT id, email, is_deleted FROM public.users WHERE email = 'papa_fresh@naver.com';
