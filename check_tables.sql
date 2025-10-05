-- 현재 테이블 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%partner%' OR table_name LIKE '%supplier%'
ORDER BY table_name;
