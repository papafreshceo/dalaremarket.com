const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('Syncing email verification status...');

  // email_verifications에서 verified=true인 이메일 조회 (중복 제거)
  const { data: allVerified } = await supabase
    .from('email_verifications')
    .select('email, created_at')
    .eq('verified', true)
    .order('created_at', { ascending: false });

  // 이메일별로 가장 최근 인증 기록만 사용
  const verifiedEmailsMap = new Map();
  allVerified?.forEach(v => {
    if (!verifiedEmailsMap.has(v.email)) {
      verifiedEmailsMap.set(v.email, v.created_at);
    }
  });

  const verifiedEmails = Array.from(verifiedEmailsMap.entries());
  console.log(`Found ${verifiedEmails.length} verified emails`);

  for (const [email, verifiedAt] of verifiedEmails) {
    // users 테이블 업데이트
    const { error } = await supabase
      .from('users')
      .update({
        email_verified: true,
        email_verified_at: verifiedAt
      })
      .eq('email', email);

    if (!error) {
      console.log(`✅ Updated: ${email}`);
    } else {
      console.log(`❌ Failed: ${email}`, error.message);
    }
  }

  console.log('\n✅ Sync complete!');
})();
