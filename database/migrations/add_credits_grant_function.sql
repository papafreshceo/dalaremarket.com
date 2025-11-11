-- 관리자가 회원에게 크레딧을 지급하는 함수
CREATE OR REPLACE FUNCTION grant_credits(
  p_user_id UUID,
  p_credits INTEGER,
  p_admin_id UUID,
  p_description TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_current_credits INTEGER;
  v_new_credits INTEGER;
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

  -- Get current credits from user_credits table
  SELECT balance INTO v_current_credits
  FROM user_credits
  WHERE user_id = p_user_id;

  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO user_credits (user_id, balance)
    VALUES (p_user_id, 0);
    v_current_credits := 0;
  END IF;

  -- Calculate new credits
  v_new_credits := COALESCE(v_current_credits, 0) + p_credits;

  -- Update user credits
  UPDATE user_credits
  SET balance = v_new_credits,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Record credits history
  INSERT INTO user_credits_history (
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
    p_credits,
    COALESCE(v_current_credits, 0),
    v_new_credits,
    'grant',
    p_description
  );

  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'user_email', v_user_email,
    'credits_before', COALESCE(v_current_credits, 0),
    'credits_after', v_new_credits,
    'credits_granted', p_credits
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION grant_credits IS '관리자가 회원에게 크레딧을 지급';

-- 관리자가 회원의 크레딧을 회수하는 함수
CREATE OR REPLACE FUNCTION revoke_credits(
  p_history_id UUID,
  p_admin_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_amount INTEGER;
  v_current_credits INTEGER;
  v_new_credits INTEGER;
  v_user_email TEXT;
  v_original_description TEXT;
  v_is_revoked BOOLEAN;
BEGIN
  -- Get history record and check if already revoked
  SELECT user_id, amount, description, COALESCE(is_revoked, false)
  INTO v_user_id, v_amount, v_original_description, v_is_revoked
  FROM user_credits_history
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

  -- Get current credits from user_credits table
  SELECT balance INTO v_current_credits
  FROM user_credits
  WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '사용자 크레딧 정보를 찾을 수 없습니다'
    );
  END IF;

  -- Calculate new credits (cannot go below 0)
  v_new_credits := GREATEST(COALESCE(v_current_credits, 0) - v_amount, 0);

  -- Mark original grant as revoked
  UPDATE user_credits_history
  SET is_revoked = true
  WHERE id = p_history_id;

  -- Update user credits
  UPDATE user_credits
  SET balance = v_new_credits,
      updated_at = NOW()
  WHERE user_id = v_user_id;

  -- Record revoke history
  INSERT INTO user_credits_history (
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
    COALESCE(v_current_credits, 0),
    v_new_credits,
    'revoke',
    '회수: ' || v_original_description
  );

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'user_email', v_user_email,
    'credits_before', COALESCE(v_current_credits, 0),
    'credits_after', v_new_credits,
    'credits_revoked', v_amount
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION revoke_credits IS '관리자가 회원의 크레딧을 회수';
