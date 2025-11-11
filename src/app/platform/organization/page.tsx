import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserOrganizationContext } from '@/lib/organization-utils'
import OrganizationMembers from '@/components/organization/OrganizationMembers'
import InviteMember from '@/components/organization/InviteMember'
import InvitationsList from '@/components/organization/InvitationsList'
import CreateOrganization from '@/components/organization/CreateOrganization'

export const metadata = {
  title: '셀러계정 관리 | 달래마켓',
  description: '셀러계정 멤버 및 설정 관리 - 회원사의 다수 담당자를 지원하는 멀티유저 시스템',
}

export default async function OrganizationPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // 사용자의 조직 컨텍스트 가져오기
  const context = await getUserOrganizationContext(user.id)

  if (!context) {
    return <CreateOrganization />
  }

  const { organization, member, can_manage_members } = context

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* 셀러계정 정보 헤더 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-2">{organization.name}</h1>
            <div className="text-sm text-gray-600 space-y-1">
              {organization.business_number && (
                <p>사업자번호: {organization.business_number}</p>
              )}
              {organization.representative_name && (
                <p>대표자: {organization.representative_name}</p>
              )}
              {organization.address && <p>주소: {organization.address}</p>}
              {organization.phone && <p>전화: {organization.phone}</p>}
            </div>
          </div>
          {context.is_owner && (
            <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
              계정 설정
            </button>
          )}
        </div>
      </div>

      {/* 내 정보 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <p className="text-sm text-gray-600">내 역할</p>
            <p className="font-semibold">
              {member.role === 'owner'
                ? '소유자'
                : member.role === 'admin'
                ? '관리자'
                : '일반 멤버'}
            </p>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600">가입일</p>
            <p className="font-semibold">
              {member.joined_at
                ? new Date(member.joined_at).toLocaleDateString('ko-KR')
                : '-'}
            </p>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600">권한</p>
            <div className="text-xs space-y-1">
              {member.can_manage_orders && (
                <span className="inline-block bg-green-100 text-green-800 px-2 py-0.5 rounded mr-1">
                  주문관리
                </span>
              )}
              {member.can_manage_products && (
                <span className="inline-block bg-green-100 text-green-800 px-2 py-0.5 rounded mr-1">
                  상품관리
                </span>
              )}
              {member.can_manage_members && (
                <span className="inline-block bg-purple-100 text-purple-800 px-2 py-0.5 rounded mr-1">
                  멤버관리
                </span>
              )}
              {member.can_view_financials && (
                <span className="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                  재무조회
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 멤버 초대 */}
      {can_manage_members && (
        <div className="mb-6">
          <InviteMember organizationId={organization.id} />
        </div>
      )}

      {/* 셀러계정 멤버 목록 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <OrganizationMembers
          organizationId={organization.id}
          currentUserId={user.id}
          canManageMembers={can_manage_members}
        />
      </div>

      {/* 발송된 초대 목록 */}
      {can_manage_members && (
        <div className="bg-white rounded-lg shadow p-6">
          <InvitationsList organizationId={organization.id} />
        </div>
      )}

      {/* 안내 */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold mb-2">셀러계정 시스템 안내</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• 같은 셀러계정의 모든 멤버는 주문, 발주서 등의 데이터를 공유합니다</li>
          <li>• 소유자와 관리자는 멤버를 초대하고 관리할 수 있습니다</li>
          <li>• 각 멤버별로 세부 권한을 설정할 수 있습니다</li>
          <li>• 캐시와 크레딧은 셀러계정 단위로 관리됩니다</li>
          <li>
            • 멤버가 등록한 주문은 자동으로 셀러계정에 연결되어 모든 멤버가 조회 가능합니다
          </li>
        </ul>
      </div>
    </div>
  )
}
