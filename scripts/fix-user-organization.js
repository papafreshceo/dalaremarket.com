/**
 * 사용자 개인 셀러계정 생성 스크립트
 *
 * 사용법: node scripts/fix-user-organization.js <email>
 * 예: node scripts/fix-user-organization.js test2@test.com
 */

const { supabase } = require('./supabase-config')

async function fixUserOrganization(userEmail) {
  try {
    console.log(`🔍 ${userEmail} 계정 조회 중...`)

    // 사용자 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .single()

    if (userError || !user) {
      console.error('❌ 사용자를 찾을 수 없습니다:', userError)
      return
    }

    console.log('✅ 사용자 발견:', {
      id: user.id,
      email: user.email,
      name: user.name,
      primary_organization_id: user.primary_organization_id,
      role: user.role
    })

    // 이미 primary_organization_id가 있는지 확인
    if (user.primary_organization_id) {
      console.log('⚠️  이미 primary_organization_id가 설정되어 있습니다:', user.primary_organization_id)

      // 해당 조직이 실제로 존재하는지 확인
      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', user.primary_organization_id)
        .single()

      if (org) {
        console.log('✅ 조직이 존재합니다:', org.business_name)
        return
      } else {
        console.log('⚠️  조직이 존재하지 않습니다. 새로 생성합니다...')
      }
    }

    // 기존 active 멤버십 확인
    const { data: activeMemberships } = await supabase
      .from('organization_members')
      .select('*, organizations(*)')
      .eq('user_id', user.id)
      .eq('status', 'active')

    console.log('📋 기존 active 멤버십:', activeMemberships?.length || 0)
    if (activeMemberships && activeMemberships.length > 0) {
      console.log('멤버십 목록:', activeMemberships.map(m => ({
        org_id: m.organization_id,
        org_name: m.organizations?.business_name,
        role: m.role
      })))
    }

    // 개인 셀러계정명
    const orgName = `${user.name || user.email} 셀러계정`

    console.log('🏢 개인 셀러계정 생성 중:', orgName)

    // 새 조직 생성
    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert({
        owner_id: user.id,
        business_name: orgName,
        is_active: true,
        tier: 'light',
      })
      .select()
      .single()

    if (orgError) {
      console.error('❌ 조직 생성 실패:', orgError)
      return
    }

    console.log('✅ 조직 생성 완료:', newOrg.id, newOrg.business_name)

    // 멤버로 추가
    const { data: newMember, error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: newOrg.id,
        user_id: user.id,
        role: 'owner',
        status: 'active',
        joined_at: new Date().toISOString(),
        can_manage_members: true,
        can_manage_products: true,
        can_manage_orders: true,
        can_view_financials: true,
      })
      .select()
      .single()

    if (memberError) {
      console.error('❌ 멤버 추가 실패:', memberError)
      // 롤백: 조직 삭제
      await supabase.from('organizations').delete().eq('id', newOrg.id)
      return
    }

    console.log('✅ 멤버 추가 완료:', newMember.id)

    // primary_organization_id 업데이트
    const { error: updateError } = await supabase
      .from('users')
      .update({ primary_organization_id: newOrg.id })
      .eq('id', user.id)

    if (updateError) {
      console.error('❌ primary_organization_id 업데이트 실패:', updateError)
      return
    }

    console.log('✅ primary_organization_id 업데이트 완료')

    console.log('\n🎉 계정 복구 완료!')
    console.log('='.repeat(50))
    console.log('새 조직 정보:')
    console.log('  - ID:', newOrg.id)
    console.log('  - 이름:', newOrg.business_name)
    console.log('  - 티어:', newOrg.tier)
    console.log('='.repeat(50))
  } catch (error) {
    console.error('❌ 오류 발생:', error)
  }
}

// 명령줄 인자 확인
const userEmail = process.argv[2]

if (!userEmail) {
  console.error('❌ 사용법: node scripts/fix-user-organization.js <email>')
  console.error('예: node scripts/fix-user-organization.js test2@test.com')
  process.exit(1)
}

fixUserOrganization(userEmail)
