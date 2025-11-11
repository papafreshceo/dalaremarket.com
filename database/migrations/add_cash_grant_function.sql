-- 관리자가 회원에게 캐시를 지급하는 함수
CREATE OR REPLACE FUNCTION grant_cash(
  p_user_id UUID,
  p_cash INTEGER,
  p_admin_id UUID,
  p_description TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_current_cash INTEGER;
  v_new_cash INTEGER;
  v_user_email TEXT;
BEGIN
  -- Get user email
  SELECT email INTO v_user_email
  FROM users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '사용자를 찾을 수 없습니다'
    );
  END IF;

  -- Get current cash from user_cash table
  SELECT balance INTO v_current_cash
  FROM user_cash
  WHERE user_id = p_user_id;

  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO user_cash (user_id, balance)
    VALUES (p_user_id, 0);
    v_current_cash := 0;
  END IF;

  -- Calculate new cash
  v_new_cash := COALESCE(v_current_cash, 0) + p_cash;

  -- Update user cash in user_cash table
  UPDATE user_cash
  SET balance = v_new_cash,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Record cash history
  INSERT INTO user_cash_history (
    user_id,
    admin_id,
    amount,
    balance_before,
    balance_after,
    transaction_type,
    description
  ) VALUES (
    p_user_id,
    p_admin_id,
    p_cash,
    COALESCE(v_current_cash, 0),
    v_new_cash,
    'grant',
    p_description
  );

  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'user_email', v_user_email,
    'cash_before', COALESCE(v_current_cash, 0),
    'cash_after', v_new_cash,
    'cash_granted', p_cash
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION grant_cash IS '관리자가 회원에게 캐시를 지급';

-- 관리자가 회원의 캐시를 회수하는 함수
CREATE OR REPLACE FUNCTION revoke_cash(
  p_history_id UUID,
  p_admin_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_amount INTEGER;
  v_current_cash INTEGER;
  v_new_cash INTEGER;
  v_user_email TEXT;
  v_original_description TEXT;
  v_is_revoked BOOLEAN;
BEGIN
  -- Get history record and check if already revoked
  SELECT user_id, amount, description, COALESCE(is_revoked, false)
  INTO v_user_id, v_amount, v_original_description, v_is_revoked
  FROM user_cash_history
  WHERE id = p_history_id AND transaction_type = 'grant';

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '지급 내역을 찾을 수 없습니다'
    );
  END IF;

  -- Check if already revoked
  IF v_is_revoked THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '이미 회수된 내역입니다'
    );
  END IF;

  -- Get user email
  SELECT email INTO v_user_email
  FROM users
  WHERE id = v_user_id;

  -- Get current cash
  SELECT balance INTO v_current_cash
  FROM user_cash
  WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '사용자 캐시 정보를 찾을 수 없습니다'
    );
  END IF;

  -- Calculate new cash (cannot go below 0)
  v_new_cash := GREATEST(COALESCE(v_current_cash, 0) - v_amount, 0);

  -- Mark original grant as revoked
  UPDATE user_cash_history
  SET is_revoked = true
  WHERE id = p_history_id;

  -- Update user cash
  UPDATE user_cash
  SET balance = v_new_cash,
      updated_at = NOW()
  WHERE user_id = v_user_id;

  -- Record revoke history
  INSERT INTO user_cash_history (
    user_id,
    admin_id,
    amount,
    balance_before,
    balance_after,
    transaction_type,
    description
  ) VALUES (
    v_user_id,
    p_admin_id,
    -v_amount,
    COALESCE(v_current_cash, 0),
    v_new_cash,
    'revoke',
    '회수: ' || v_original_description
  );

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'user_email', v_user_email,
    'cash_before', COALESCE(v_current_cash, 0),
    'cash_after', v_new_cash,
    'cash_revoked', v_amount
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION revoke_cash IS '관리자가 회원의 캐시를 회수';
