-- =====================================================
-- 랭킹/등급 시스템을 조직(Organization) 단위로 전환
-- =====================================================
-- 작성일: 2025-11-12
-- 설명: 개인 단위 랭킹/등급을 조직 단위로 통합
--       - 조직의 모든 멤버 활동이 조직 성과로 집계
--       - 등급/랭킹은 조직 단위로 부여
-- =====================================================

-- 1. seller_performance_daily에 organization_id 추가
ALTER TABLE seller_performance_daily
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_seller_performance_organization_id
  ON seller_performance_daily(organization_id);

COMMENT ON COLUMN seller_performance_daily.organization_id IS '셀러가 속한 조직';

-- 2. seller_rankings에 organization_id 추가
ALTER TABLE seller_rankings
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_seller_rankings_organization_id
  ON seller_rankings(organization_id);

COMMENT ON COLUMN seller_rankings.organization_id IS '랭킹이 속한 조직';

-- 3. seller_badges에 organization_id 추가
ALTER TABLE seller_badges
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_seller_badges_organization_id
  ON seller_badges(organization_id);

COMMENT ON COLUMN seller_badges.organization_id IS '배지를 획득한 조직';

-- 4. 기존 데이터에 organization_id 설정
UPDATE seller_performance_daily spd
SET organization_id = (
  SELECT primary_organization_id
  FROM users
  WHERE id = spd.seller_id
)
WHERE organization_id IS NULL;

UPDATE seller_rankings sr
SET organization_id = (
  SELECT primary_organization_id
  FROM users
  WHERE id = sr.seller_id
)
WHERE organization_id IS NULL;

UPDATE seller_badges sb
SET organization_id = (
  SELECT primary_organization_id
  FROM users
  WHERE id = sb.seller_id
)
WHERE organization_id IS NULL;

-- 5. 같은 조직의 중복 일별 성과 레코드 통합
DO $$
DECLARE
  v_org_id UUID;
  v_date DATE;
  v_owner_id UUID;
  v_owner_perf_id INTEGER;
BEGIN
  -- 각 조직별, 날짜별로 처리
  FOR v_org_id, v_date IN
    SELECT DISTINCT organization_id, date
    FROM seller_performance_daily
    WHERE organization_id IS NOT NULL
  LOOP
    -- 해당 조직의 owner ID 찾기
    SELECT owner_id INTO v_owner_id
    FROM organizations
    WHERE id = v_org_id;

    -- owner의 성과 레코드 ID 찾기
    SELECT id INTO v_owner_perf_id
    FROM seller_performance_daily
    WHERE organization_id = v_org_id
      AND date = v_date
      AND seller_id = v_owner_id
    LIMIT 1;

    -- owner 성과가 없으면 첫 번째 레코드를 owner 것으로 간주
    IF v_owner_perf_id IS NULL THEN
      SELECT id INTO v_owner_perf_id
      FROM seller_performance_daily
      WHERE organization_id = v_org_id
        AND date = v_date
      LIMIT 1;
    END IF;

    -- 조직의 해당 날짜 전체 성과 합산
    UPDATE seller_performance_daily
    SET
      total_sales = (
        SELECT COALESCE(SUM(total_sales), 0)
        FROM seller_performance_daily
        WHERE organization_id = v_org_id AND date = v_date
      ),
      order_count = (
        SELECT COALESCE(SUM(order_count), 0)
        FROM seller_performance_daily
        WHERE organization_id = v_org_id AND date = v_date
      ),
      same_day_confirm_count = (
        SELECT COALESCE(SUM(same_day_confirm_count), 0)
        FROM seller_performance_daily
        WHERE organization_id = v_org_id AND date = v_date
      ),
      cancel_count = (
        SELECT COALESCE(SUM(cancel_count), 0)
        FROM seller_performance_daily
        WHERE organization_id = v_org_id AND date = v_date
      ),
      upload_count = (
        SELECT COALESCE(SUM(upload_count), 0)
        FROM seller_performance_daily
        WHERE organization_id = v_org_id AND date = v_date
      ),
      error_count = (
        SELECT COALESCE(SUM(error_count), 0)
        FROM seller_performance_daily
        WHERE organization_id = v_org_id AND date = v_date
      ),
      total_confirm_hours = (
        SELECT COALESCE(SUM(total_confirm_hours), 0)
        FROM seller_performance_daily
        WHERE organization_id = v_org_id AND date = v_date
      )
    WHERE id = v_owner_perf_id;

    -- 비율 재계산
    UPDATE seller_performance_daily
    SET
      cancel_rate = CASE
        WHEN order_count > 0 THEN (cancel_count::NUMERIC / order_count * 100)
        ELSE 0
      END,
      error_rate = CASE
        WHEN upload_count > 0 THEN (error_count::NUMERIC / upload_count * 100)
        ELSE 0
      END,
      avg_confirm_hours = CASE
        WHEN order_count > 0 THEN (total_confirm_hours / order_count)
        ELSE NULL
      END
    WHERE id = v_owner_perf_id;

    -- owner 레코드를 제외한 나머지 삭제
    DELETE FROM seller_performance_daily
    WHERE organization_id = v_org_id
      AND date = v_date
      AND id != v_owner_perf_id;
  END LOOP;
END $$;

-- 6. 같은 조직의 중복 랭킹 레코드 통합
DO $$
DECLARE
  v_org_id UUID;
  v_period_type TEXT;
  v_period_start DATE;
  v_owner_id UUID;
  v_owner_rank_id INTEGER;
BEGIN
  -- 각 조직별, 기간별로 처리
  FOR v_org_id, v_period_type, v_period_start IN
    SELECT DISTINCT organization_id, period_type, period_start
    FROM seller_rankings
    WHERE organization_id IS NOT NULL
  LOOP
    -- 해당 조직의 owner ID 찾기
    SELECT owner_id INTO v_owner_id
    FROM organizations
    WHERE id = v_org_id;

    -- owner의 랭킹 레코드 ID 찾기
    SELECT id INTO v_owner_rank_id
    FROM seller_rankings
    WHERE organization_id = v_org_id
      AND period_type = v_period_type
      AND period_start = v_period_start
      AND seller_id = v_owner_id
    LIMIT 1;

    -- owner 랭킹이 없으면 첫 번째 레코드를 owner 것으로 간주
    IF v_owner_rank_id IS NULL THEN
      SELECT id INTO v_owner_rank_id
      FROM seller_rankings
      WHERE organization_id = v_org_id
        AND period_type = v_period_type
        AND period_start = v_period_start
      LIMIT 1;
    END IF;

    -- 조직의 해당 기간 전체 성과 합산
    UPDATE seller_rankings
    SET
      total_sales = (
        SELECT COALESCE(SUM(total_sales), 0)
        FROM seller_rankings
        WHERE organization_id = v_org_id
          AND period_type = v_period_type
          AND period_start = v_period_start
      ),
      order_count = (
        SELECT COALESCE(SUM(order_count), 0)
        FROM seller_rankings
        WHERE organization_id = v_org_id
          AND period_type = v_period_type
          AND period_start = v_period_start
      )
    WHERE id = v_owner_rank_id;

    -- owner 레코드를 제외한 나머지 삭제
    DELETE FROM seller_rankings
    WHERE organization_id = v_org_id
      AND period_type = v_period_type
      AND period_start = v_period_start
      AND id != v_owner_rank_id;
  END LOOP;
END $$;

-- 7. 같은 조직의 배지 중복 제거 (owner에게만 유지)
DO $$
DECLARE
  v_org_id UUID;
  v_badge_id TEXT;
  v_owner_id UUID;
  v_earliest_earned_at TIMESTAMPTZ;
BEGIN
  -- 각 조직별, 배지별로 처리
  FOR v_org_id, v_badge_id IN
    SELECT DISTINCT organization_id, badge_id
    FROM seller_badges
    WHERE organization_id IS NOT NULL
  LOOP
    -- 해당 조직의 owner ID 찾기
    SELECT owner_id INTO v_owner_id
    FROM organizations
    WHERE id = v_org_id;

    -- 가장 빠른 획득 시간 찾기
    SELECT MIN(earned_at) INTO v_earliest_earned_at
    FROM seller_badges
    WHERE organization_id = v_org_id
      AND badge_id = v_badge_id;

    -- owner가 해당 배지를 가지고 있는지 확인
    IF NOT EXISTS (
      SELECT 1 FROM seller_badges
      WHERE organization_id = v_org_id
        AND badge_id = v_badge_id
        AND seller_id = v_owner_id
    ) THEN
      -- owner가 없으면 가장 빠른 획득자를 owner 것으로 변경
      UPDATE seller_badges
      SET seller_id = v_owner_id
      WHERE organization_id = v_org_id
        AND badge_id = v_badge_id
        AND earned_at = v_earliest_earned_at;
    END IF;

    -- owner의 배지를 제외한 나머지 삭제
    DELETE FROM seller_badges
    WHERE organization_id = v_org_id
      AND badge_id = v_badge_id
      AND seller_id != v_owner_id;
  END LOOP;
END $$;

-- 8. RLS 정책 업데이트 (조직 기반)
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Sellers can view their own performance" ON seller_performance_daily;
DROP POLICY IF EXISTS "Sellers can view their own rankings" ON seller_rankings;
DROP POLICY IF EXISTS "Sellers can view their own badges" ON seller_badges;

-- 새로운 정책: 조직 멤버는 조직 성과/랭킹 조회 가능
CREATE POLICY "Organization members can view organization performance"
  ON seller_performance_daily FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Organization members can view organization rankings"
  ON seller_rankings FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Organization members can view organization badges"
  ON seller_badges FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
DECLARE
  v_perf_count INTEGER;
  v_rank_count INTEGER;
  v_badge_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_perf_count FROM seller_performance_daily WHERE organization_id IS NOT NULL;
  SELECT COUNT(*) INTO v_rank_count FROM seller_rankings WHERE organization_id IS NOT NULL;
  SELECT COUNT(*) INTO v_badge_count FROM seller_badges WHERE organization_id IS NOT NULL;

  RAISE NOTICE '=================================================';
  RAISE NOTICE '랭킹/등급 조직 단위 전환 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '조직 성과 레코드: %', v_perf_count;
  RAISE NOTICE '조직 랭킹 레코드: %', v_rank_count;
  RAISE NOTICE '조직 배지 레코드: %', v_badge_count;
  RAISE NOTICE '=================================================';
  RAISE NOTICE '변경사항:';
  RAISE NOTICE '- 같은 조직 멤버들의 성과 통합 완료';
  RAISE NOTICE '- 랭킹/등급이 조직 단위로 변경';
  RAISE NOTICE '- RLS 정책을 조직 기반으로 변경';
  RAISE NOTICE '=================================================';
END $$;
