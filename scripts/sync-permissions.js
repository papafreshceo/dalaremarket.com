const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// 메뉴에서 모든 페이지 경로 추출
const { menuGroups, menuCategories } = require('../src/config/admin-menu')

function extractAllPages() {
  const pages = []
  const categoryMap = new Map(menuCategories.map(cat => [cat.id, cat.name]))

  menuGroups.forEach(group => {
    if (group.items && Array.isArray(group.items)) {
      group.items.forEach(item => {
        if (item.href && item.name) {
          pages.push({
            name: item.name,
            path: item.href,
            category: categoryMap.get(group.category) || group.category,
            group: group.name,
          })
        }
      })
    }
  })

  return pages
}

async function syncPermissions() {
  console.log('🔄 권한 데이터 동기화 시작...\n')

  const allPages = extractAllPages()
  console.log(`📄 총 ${allPages.length}개 페이지 발견\n`)

  // 역할별 기본 권한 설정
  const roleDefaults = {
    super_admin: {
      can_access: true,
      can_create: true,
      can_read: true,
      can_update: true,
      can_delete: true,
    },
    admin: {
      can_access: true,
      can_create: true,
      can_read: true,
      can_update: true,
      can_delete: false, // 삭제는 제한
    },
    employee: {
      can_access: true,
      can_create: false,
      can_read: true,
      can_update: false,
      can_delete: false,
    },
  }

  const roles = ['super_admin', 'admin', 'employee']

  for (const role of roles) {
    console.log(`\n📋 ${role} 권한 처리 중...`)

    // 기존 권한 조회
    const { data: existing } = await supabase
      .from('permissions')
      .select('page_path')
      .eq('role', role)

    const existingPaths = new Set(existing?.map(p => p.page_path) || [])
    console.log(`   기존 권한: ${existingPaths.size}개`)

    // 새로 추가할 권한
    const newPermissions = []
    allPages.forEach(page => {
      if (!existingPaths.has(page.path)) {
        newPermissions.push({
          role,
          page_path: page.path,
          ...roleDefaults[role],
        })
      }
    })

    if (newPermissions.length > 0) {
      console.log(`   새로 추가: ${newPermissions.length}개`)

      const { error } = await supabase
        .from('permissions')
        .insert(newPermissions)

      if (error) {
        console.error(`   ❌ 오류:`, error.message)
      } else {
        console.log(`   ✅ 완료`)
      }
    } else {
      console.log(`   ✅ 모든 권한이 이미 존재합니다.`)
    }
  }

  // 최종 확인
  console.log('\n📊 최종 권한 현황:')
  for (const role of roles) {
    const { count } = await supabase
      .from('permissions')
      .select('*', { count: 'exact', head: true })
      .eq('role', role)

    console.log(`   ${role}: ${count}개`)
  }

  console.log('\n✅ 권한 동기화 완료!')
}

syncPermissions().catch(console.error)
