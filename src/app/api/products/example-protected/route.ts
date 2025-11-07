import { NextRequest, NextResponse } from 'next/server'
import { withPermission } from '@/lib/auth-middleware'

/**
 * ⚠️ 보안이 적용된 API 예시
 *
 * 이 API는 다음을 체크합니다:
 * 1. 사용자가 로그인했는지
 * 2. 상품관리 페이지 접근 권한이 있는지
 * 3. 생성(CREATE) 권한이 있는지
 */

// GET: 상품 조회 (read 권한 필요)
export const GET = withPermission(
  async (request: NextRequest, { user, userData }) => {
    // 권한 체크 통과! 안전하게 데이터 반환

    // 실제 비즈니스 로직
    const products = [
      { id: 1, name: '상품 A', price: 10000 },
      { id: 2, name: '상품 B', price: 20000 },
    ]

    return NextResponse.json({
      success: true,
      data: products,
      user: userData.name, // 누가 조회했는지 로그용
    })
  },
  {
    requireAuth: true,
    requirePermission: {
      path: '/admin/products',
      action: 'read',
    },
  }
)

// POST: 상품 생성 (create 권한 필요)
export const POST = withPermission(
  async (request: NextRequest, { user, userData }) => {
    const body = await request.json()

    // 권한 체크 통과! 안전하게 데이터 생성

    // 실제 비즈니스 로직
    const newProduct = {
      id: Date.now(),
      ...body,
      created_by: user.id,
      created_at: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      data: newProduct,
    })
  },
  {
    requireAuth: true,
    requirePermission: {
      path: '/admin/products',
      action: 'create',
    },
  }
)

// DELETE: 상품 삭제 (delete 권한 필요)
export const DELETE = withPermission(
  async (request: NextRequest, { user, userData }) => {
    const searchParams = request.nextUrl.searchParams
    const productId = searchParams.get('id')

    // 권한 체크 통과! 안전하게 데이터 삭제

    // 실제 비즈니스 로직
    // await supabase.from('products').delete().eq('id', productId)

    return NextResponse.json({
      success: true,
      message: '상품이 삭제되었습니다.',
      deleted_by: userData.name,
    })
  },
  {
    requireAuth: true,
    requirePermission: {
      path: '/admin/products',
      action: 'delete',
    },
  }
)

/**
 * 권한이 없는 사용자가 이 API를 호출하면?
 *
 * ❌ DELETE 권한이 없는 직원이 호출:
 * {
 *   "success": false,
 *   "error": "delete 권한이 없습니다.",
 *   "path": "/admin/products",
 *   "action": "delete"
 * }
 *
 * ❌ 로그인하지 않은 사용자가 호출:
 * {
 *   "success": false,
 *   "error": "인증이 필요합니다."
 * }
 */
