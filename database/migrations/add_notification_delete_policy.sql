-- =====================================================
-- 알림 삭제 정책 추가
-- =====================================================
-- 작성일: 2025-01-16
-- 설명: 사용자가 자신의 알림을 삭제할 수 있도록 RLS 정책 추가
-- =====================================================

-- 사용자는 자신의 알림만 삭제 가능
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON POLICY "Users can delete own notifications" ON notifications IS '사용자는 자신의 알림만 삭제 가능';
