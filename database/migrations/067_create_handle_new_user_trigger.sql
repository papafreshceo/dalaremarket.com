-- Migration 067: Create trigger to auto-create users and organizations on signup
-- auth.users에 INSERT될 때 자동으로 public.users와 organization 생성

-- Step 1: Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Step 2: Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_approved BOOLEAN;
  v_name TEXT;
  v_phone TEXT;
  v_marketing_consent BOOLEAN;
  v_org_id UUID;
  v_seller_code TEXT;
  v_partner_code TEXT;
BEGIN
  -- Extract metadata from auth.users
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'seller');
  v_approved := COALESCE((NEW.raw_user_meta_data->>'approved')::boolean, true);
  v_name := NEW.raw_user_meta_data->>'name';
  v_phone := NEW.raw_user_meta_data->>'phone';
  v_marketing_consent := COALESCE((NEW.raw_user_meta_data->>'marketing_consent')::boolean, false);

  -- Insert into public.users
  INSERT INTO public.users (
    id,
    email,
    name,
    phone,
    role,
    approved,
    marketing_consent,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_name,
    v_phone,
    v_role::user_role,
    v_approved,
    v_marketing_consent,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- If role is 'seller', create organization
  IF v_role = 'seller' THEN
    -- Generate seller_code and partner_code
    v_seller_code := 'S' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    v_partner_code := 'P' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

    -- Create organization (필수값만, 나머지는 NULL)
    INSERT INTO public.organizations (
      owner_id,
      seller_code,
      partner_code,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      v_seller_code,
      v_partner_code,
      NOW(),
      NOW()
    )
    RETURNING id INTO v_org_id;

    -- Link user to organization
    INSERT INTO public.organization_members (
      organization_id,
      user_id,
      role,
      status,
      created_at,
      updated_at
    )
    VALUES (
      v_org_id,
      NEW.id,
      'owner',
      'active',
      NOW(),
      NOW()
    );

    -- Set primary_organization_id for user
    UPDATE public.users
    SET primary_organization_id = v_org_id,
        updated_at = NOW()
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Step 3: Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.organization_members TO authenticated;

COMMENT ON FUNCTION public.handle_new_user() IS '회원가입 시 public.users와 organization 자동 생성';
