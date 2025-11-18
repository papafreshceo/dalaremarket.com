const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// admin-menu.tsx에서 수동으로 추출한 67개 페이지
const ALL_PAGES = [
  '/admin/dashboard',
  '/admin/order-platform',
  '/admin/order-integration',
  '/admin/order-schedule',
  '/admin/purchase',
  '/admin/purchase/saiup',
  '/admin/farms',
  '/admin/farms/list',
  '/admin/products/raw-materials',
  '/admin/products/products',
  '/admin/products/option-products',
  '/admin/products/all',
  '/admin/products/all2',
  '/admin/customers',
  '/admin/partners',
  '/admin/members',
  '/admin/workers',
  '/admin/expense',
  '/admin/planning',
  '/admin/documents',
  '/admin/documents/contracts',
  '/admin/documents/invoices',
  '/admin/documents/delivery-notes',
  '/admin/documents/business-registration',
  '/admin/design-themes',
  '/admin/promotional-content',
  '/admin/send-email',
  '/admin/send-email/templates',
  '/admin/send-email/history',
  '/admin/settings',
  '/admin/settings/site',
  '/admin/settings/payment',
  '/admin/settings/delivery',
  '/admin/settings/business',
  '/admin/settings/notifications',
  '/admin/settings/email',
  '/admin/settings/sms',
  '/admin/settings/marketing',
  '/admin/settings/theme',
  '/admin/settings/permissions',
  '/admin/settings/roles',
  '/admin/settings/shipping-invoice',
  '/admin/settings/shipping-companies',
  '/admin/settings/order-cancel-reasons',
  '/admin/settings/return-reasons',
  '/admin/settings/exchange-reasons',
  '/admin/settings/refund-types',
  '/admin/settings/shipping-types',
  '/admin/settings/order-status',
  '/admin/settings/payment-methods',
  '/admin/settings/cash',
  '/admin/maintenance',
  '/admin/logs',
  '/admin/backup',
  '/admin/database',
  '/admin/cache',
  '/admin/queue',
  '/admin/analytics',
  '/admin/audit-logs',
]

// 역할별 기본 권한
const DEFAULT_PERMISSIONS = {
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
    can_delete: false,
  },
  employee: {
    can_access: true,
    can_create: false,
    can_read: true,
    can_update: false,
    can_delete: false,
  },
}

async function initPermissions() {
  console.log('🚀 권한 데이터 초기화 시작...\n')

  const roles = ['super_admin', 'admin', 'employee']

  for (const role of roles) {
    console.log(`\n📋 ${role} 처리 중...`)

    // 기존 권한 조회
    const { data: existing } = await supabase
      .from('permissions')
      .select('page_path')
      .eq('role', role)

    const existingPaths = new Set(existing?.map(p => p.page_path) || [])
    console.log(`   기존: ${existingPaths.size}개`)

    // 새로 추가할 권한
    const newPermissions = []
    ALL_PAGES.forEach(path => {
      if (!existingPaths.has(path)) {
        newPermissions.push({
          role,
          page_path: path,
          ...DEFAULT_PERMISSIONS[role],
        })
      }
    })

    if (newPermissions.length > 0) {
      console.log(`   추가: ${newPermissions.length}개`)

      const { error } = await supabase
        .from('permissions')
        .insert(newPermissions)

      if (error) {
        console.error(`   ❌ 오류:`, error.message)
      } else {
        console.log(`   ✅ 완료`)
      }
    } else {
      console.log(`   ✅ 이미 최신 상태`)
    }
  }

  // 최종 확인
  console.log('\n\n📊 최종 권한 현황:')
  for (const role of roles) {
    const { count } = await supabase
      .from('permissions')
      .select('*', { count: 'exact', head: true })
      .eq('role', role)

    console.log(`   ${role}: ${count}개`)
  }

  console.log('\n✅ 권한 초기화 완료!')
}

initPermissions().catch(console.error)
