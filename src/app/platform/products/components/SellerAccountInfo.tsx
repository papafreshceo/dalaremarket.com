'use client'

import TierBadge from '@/components/TierBadge';

interface OrganizationInfo {
  name: string;
  seller_code?: string;
  grade?: string;
  member_count?: number;
}

interface SellerAccountInfoProps {
  organizationInfo: OrganizationInfo | null;
  isMobile?: boolean;
}

export default function SellerAccountInfo({ organizationInfo, isMobile = false }: SellerAccountInfoProps) {
  if (!organizationInfo) {
    return null;
  }

  const validTiers = ['light', 'standard', 'advance', 'elite', 'legend'];
  const tier = organizationInfo.grade && validTiers.includes(organizationInfo.grade)
    ? organizationInfo.grade as 'light' | 'standard' | 'advance' | 'elite' | 'legend'
    : null;

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '12px',
      padding: isMobile ? '16px' : '24px',
      marginBottom: '16px'
    }}>
      <h2 style={{
        fontSize: isMobile ? '16px' : '18px',
        fontWeight: '600',
        marginBottom: '16px',
        color: '#212529'
      }}>셀러계정 정보</h2>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {/* 셀러계정명 & 티어 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#212529'
          }}>
            {organizationInfo.name}
          </div>
          {tier && <TierBadge tier={tier} iconOnly glow={0} />}
        </div>

        {/* 셀러코드 */}
        {organizationInfo.seller_code && (
          <div style={{
            fontSize: '13px',
            color: '#6c757d'
          }}>
            코드: {organizationInfo.seller_code}
          </div>
        )}

        {/* 멤버 수 */}
        {organizationInfo.member_count !== undefined && (
          <div style={{
            fontSize: '13px',
            color: '#6c757d'
          }}>
            멤버: {organizationInfo.member_count}명
          </div>
        )}
      </div>
    </div>
  );
}
