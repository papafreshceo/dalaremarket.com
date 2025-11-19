'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';

interface VendorStats {
  shipping_source: string;
  접수_건수: number;
  접수_수량: number;
  결제완료_건수: number;
  결제완료_수량: number;
  상품준비중_건수: number;
  상품준비중_수량: number;
  발송완료_건수: number;
  발송완료_수량: number;
  취소요청_건수: number;
  취소요청_수량: number;
  취소완료_건수: number;
  취소완료_수량: number;
}

interface SellerStats {
  organization_id: string;
  seller_name: string;
  접수_건수: number;
  총금액: number;
  입금확인: boolean;
  결제완료_건수: number;
  상품준비중_건수: number;
  발송완료_건수: number;
  취소요청_건수: number;
  환불예정액: number;
  환불처리일시: string | null;
  취소완료_건수: number;
}

interface VendorSellerStatsProps {
  vendorStats: VendorStats[];
  sellerStats: SellerStats[];
  onVendorExcelDownload: (vendorName: string) => void;
  onPaymentCheckToggle: (organizationId: string) => void;
}

export default function VendorSellerStats({
  vendorStats,
  sellerStats,
  onVendorExcelDownload,
  onPaymentCheckToggle,
}: VendorSellerStatsProps) {
  const [vendorStatsExpanded, setVendorStatsExpanded] = useState(false);
  const [sellerStatsExpanded, setSellerStatsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg">
      <div className="px-4 py-3 flex items-center gap-4">
        <span
          onClick={() => {
            setVendorStatsExpanded(!vendorStatsExpanded);
            if (!vendorStatsExpanded) setSellerStatsExpanded(false);
          }}
          className={`text-lg font-semibold cursor-pointer transition-colors ${
            vendorStatsExpanded
              ? 'text-blue-600'
              : 'text-gray-700 hover:text-gray-900'
          }`}
        >
          벤더사별
        </span>
        <span
          onClick={() => {
            setSellerStatsExpanded(!sellerStatsExpanded);
            if (!sellerStatsExpanded) setVendorStatsExpanded(false);
          }}
          className={`text-lg font-semibold cursor-pointer transition-colors ${
            sellerStatsExpanded
              ? 'text-blue-600'
              : 'text-gray-700 hover:text-gray-900'
          }`}
        >
          셀러별
        </span>
      </div>

      {vendorStatsExpanded && (
        <div className="overflow-x-auto pb-4">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th style={{ fontSize: '16px', padding: '6px 16px', textAlign: 'left', fontWeight: 500, color: '#4B5563' }}>벤더사</th>
                <th style={{ fontSize: '16px', padding: '6px 16px', textAlign: 'center', fontWeight: 500, color: '#4B5563' }}>접수</th>
                <th style={{ fontSize: '16px', padding: '6px 16px', textAlign: 'center', fontWeight: 500, color: '#4B5563' }}>결제완료</th>
                <th style={{ fontSize: '16px', padding: '6px 16px', textAlign: 'center', fontWeight: 500, color: '#4B5563' }}>상품준비중</th>
                <th style={{ fontSize: '16px', padding: '6px 16px', textAlign: 'center', fontWeight: 500, color: '#4B5563' }}>발송완료</th>
                <th style={{ fontSize: '16px', padding: '6px 16px', textAlign: 'center', fontWeight: 500, color: '#4B5563' }}>취소요청</th>
                <th style={{ fontSize: '16px', padding: '6px 16px', textAlign: 'center', fontWeight: 500, color: '#4B5563' }}>취소완료</th>
                <th style={{ fontSize: '16px', padding: '6px 16px', textAlign: 'center', fontWeight: 500, color: '#4B5563' }}>전송파일</th>
              </tr>
            </thead>
            <tbody>
              {vendorStats.map((stat, idx) => (
                <tr key={stat.shipping_source} style={{ borderTop: idx === 0 ? 'none' : '1px solid #E5E7EB' }} className="hover:bg-gray-50">
                  <td style={{ fontSize: '16px', padding: '6px 16px', fontWeight: 500, color: '#111827' }}>{stat.shipping_source}</td>
                  <td style={{ fontSize: '18px', padding: '6px 16px', textAlign: 'center', color: '#7E22CE', fontWeight: 600 }}>{(stat.접수_건수 || 0) > 0 ? stat.접수_건수.toLocaleString() : ''}</td>
                  <td style={{ fontSize: '18px', padding: '6px 16px', textAlign: 'center', color: '#1D4ED8', fontWeight: 600 }}>{(stat.결제완료_건수 || 0) > 0 ? stat.결제완료_건수.toLocaleString() : ''}</td>
                  <td style={{ fontSize: '18px', padding: '6px 16px', textAlign: 'center', color: '#A16207', fontWeight: 600 }}>{(stat.상품준비중_건수 || 0) > 0 ? stat.상품준비중_건수.toLocaleString() : ''}</td>
                  <td style={{ fontSize: '18px', padding: '6px 16px', textAlign: 'center', color: '#15803D', fontWeight: 600 }}>{(stat.발송완료_건수 || 0) > 0 ? stat.발송완료_건수.toLocaleString() : ''}</td>
                  <td style={{ fontSize: '18px', padding: '6px 16px', textAlign: 'center', color: '#C2410C', fontWeight: 600 }}>{(stat.취소요청_건수 || 0) > 0 ? stat.취소요청_건수.toLocaleString() : ''}</td>
                  <td style={{ fontSize: '18px', padding: '6px 16px', textAlign: 'center', color: '#B91C1C', fontWeight: 600 }}>{(stat.취소완료_건수 || 0) > 0 ? stat.취소완료_건수.toLocaleString() : ''}</td>
                  <td style={{ fontSize: '16px', padding: '6px 16px', textAlign: 'center' }}>
                    <button
                      onClick={() => onVendorExcelDownload(stat.shipping_source)}
                      style={{ fontSize: '14px', padding: '4px 12px', backgroundColor: '#16A34A', color: 'white', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px', border: 'none', cursor: 'pointer' }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#15803D'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#16A34A'}
                    >
                      <Download className="w-3 h-3" />
                      엑셀
                    </button>
                  </td>
                </tr>
              ))}
              {vendorStats.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ fontSize: '16px', padding: '24px 16px', textAlign: 'center', color: '#6B7280' }}>
                    데이터가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {sellerStatsExpanded && (
        <div className="overflow-x-auto pb-4">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th rowSpan={2} style={{ fontSize: '16px', padding: '6px 8px', width: '120px', textAlign: 'left', fontWeight: 500, color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>셀러</th>
                <th colSpan={3} style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', fontWeight: 500, color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>발주</th>
                <th rowSpan={2} style={{ fontSize: '16px', padding: '6px 8px', width: '80px', textAlign: 'center', fontWeight: 500, color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>결제완료</th>
                <th rowSpan={2} style={{ fontSize: '16px', padding: '6px 8px', width: '80px', textAlign: 'center', fontWeight: 500, color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>상품준비중</th>
                <th rowSpan={2} style={{ fontSize: '16px', padding: '6px 8px', width: '80px', textAlign: 'center', fontWeight: 500, color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>발송완료</th>
                <th colSpan={3} style={{ fontSize: '16px', padding: '6px 8px', textAlign: 'center', fontWeight: 500, color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>환불</th>
                <th rowSpan={2} style={{ fontSize: '16px', padding: '6px 8px', width: '80px', textAlign: 'center', fontWeight: 500, color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>취소완료</th>
              </tr>
              <tr className="bg-gray-50">
                <th style={{ fontSize: '14px', padding: '4px 8px', width: '80px', textAlign: 'center', fontWeight: 500, color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>접수</th>
                <th style={{ fontSize: '14px', padding: '4px 8px', width: '100px', textAlign: 'center', fontWeight: 500, color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>금액</th>
                <th style={{ fontSize: '14px', padding: '4px 8px', width: '80px', textAlign: 'center', fontWeight: 500, color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>입금확인</th>
                <th style={{ fontSize: '14px', padding: '4px 8px', width: '80px', textAlign: 'center', fontWeight: 500, color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>취소요청</th>
                <th style={{ fontSize: '14px', padding: '4px 8px', width: '100px', textAlign: 'center', fontWeight: 500, color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>환불예정액</th>
                <th style={{ fontSize: '14px', padding: '4px 8px', width: '140px', textAlign: 'center', fontWeight: 500, color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>환불처리</th>
              </tr>
            </thead>
            <tbody>
              {sellerStats.map((stat, idx) => (
                <tr key={stat.organization_id} style={{ borderTop: idx === 0 ? 'none' : '1px solid #E5E7EB' }} className="hover:bg-gray-50">
                  <td style={{ fontSize: '16px', padding: '6px 16px', fontWeight: 500, color: '#111827' }}>{stat.seller_name}</td>
                  <td style={{ fontSize: '18px', padding: '6px 16px', textAlign: 'center', color: '#7E22CE', fontWeight: 600 }}>{(stat.접수_건수 || 0) > 0 ? stat.접수_건수.toLocaleString() : ''}</td>
                  <td style={{ fontSize: '16px', padding: '6px 16px', textAlign: 'right', color: '#047857', fontWeight: 600 }}>{stat.총금액 > 0 ? stat.총금액.toLocaleString() : ''}</td>
                  <td style={{ fontSize: '16px', padding: '6px 16px', textAlign: 'center' }}>
                    <div
                      onClick={() => onPaymentCheckToggle(stat.organization_id)}
                      style={{
                        width: '44px',
                        height: '24px',
                        borderRadius: '12px',
                        backgroundColor: stat.입금확인 ? '#0891B2' : '#D1D5DB',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'background-color 0.3s',
                        display: 'inline-block'
                      }}
                    >
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          backgroundColor: 'white',
                          position: 'absolute',
                          top: '3px',
                          left: stat.입금확인 ? '23px' : '3px',
                          transition: 'left 0.3s',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}
                      />
                    </div>
                  </td>
                  <td style={{ fontSize: '18px', padding: '6px 16px', textAlign: 'center', color: '#1D4ED8', fontWeight: 600 }}>{(stat.결제완료_건수 || 0) > 0 ? stat.결제완료_건수.toLocaleString() : ''}</td>
                  <td style={{ fontSize: '18px', padding: '6px 16px', textAlign: 'center', color: '#A16207', fontWeight: 600 }}>{(stat.상품준비중_건수 || 0) > 0 ? stat.상품준비중_건수.toLocaleString() : ''}</td>
                  <td style={{ fontSize: '18px', padding: '6px 16px', textAlign: 'center', color: '#15803D', fontWeight: 600 }}>{(stat.발송완료_건수 || 0) > 0 ? stat.발송완료_건수.toLocaleString() : ''}</td>
                  <td style={{ fontSize: '18px', padding: '6px 16px', textAlign: 'center', color: '#C2410C', fontWeight: 600 }}>{(stat.취소요청_건수 || 0) > 0 ? stat.취소요청_건수.toLocaleString() : ''}</td>
                  <td style={{ fontSize: '16px', padding: '6px 16px', textAlign: 'right', color: '#DC2626', fontWeight: 600 }}>{stat.환불예정액 > 0 ? stat.환불예정액.toLocaleString() : ''}</td>
                  <td style={{ fontSize: '14px', padding: '6px 16px', textAlign: 'center' }}>
                    {stat.환불처리일시 && (
                      <span style={{ color: '#059669', fontWeight: 500 }}>{stat.환불처리일시}</span>
                    )}
                  </td>
                  <td style={{ fontSize: '18px', padding: '6px 16px', textAlign: 'center', color: '#B91C1C', fontWeight: 600 }}>{(stat.취소완료_건수 || 0) > 0 ? stat.취소완료_건수.toLocaleString() : ''}</td>
                </tr>
              ))}
              {sellerStats.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ fontSize: '16px', padding: '24px 16px', textAlign: 'center', color: '#6B7280' }}>
                    데이터가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
