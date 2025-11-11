import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-security'
import { autoCreateOrganizationFromUser } from '@/lib/auto-create-organization'

/**
 * POST /api/organizations/auto-create
 * 사용자 정보를 기반으로 조직 자동 생성
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth.authorized) return auth.error

    // 사용자 정보 기반 조직 자동 생성
    const result = await autoCreateOrganizationFromUser(auth.user.id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || '조직 생성에 실패했습니다' },
        { status: 500 }
      )
    }

    if (result.already_exists) {
      return NextResponse.json({
        success: true,
        message: '이미 조직이 존재합니다',
        organization_id: result.organization_id,
      })
    }

    return NextResponse.json({
      success: true,
      message: '조직이 생성되었습니다',
      organization_id: result.organization_id,
      organization_name: result.organization_name,
    })
  } catch (error) {
    console.error('조직 자동 생성 오류:', error)
    return NextResponse.json(
      { error: '조직 생성 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
