'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Transaction {
  id: string;
  type: 'login' | 'activity' | 'usage' | 'admin_adjustment';
  amount: number;
  balance_after: number;
  description: string;
  metadata: any;
  created_at: string;
}

interface CashHistoryTabProps {
  userId: string;
}

const transactionTypeConfig: Record<Transaction['type'], { label: string; color: string; icon: string }> = {
  login: { label: '로그인 보상', color: '#10b981', icon: '🎁' },
  activity: { label: '활동 보상', color: '#3b82f6', icon: '⏱️' },
  usage: { label: '사용', color: '#ef4444', icon: '💳' },
  admin_adjustment: { label: '관리자 조정', color: '#8b5cf6', icon: '⚙️' }
};

export default function CashHistoryTab({ userId }: CashHistoryTabProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cashBalance, setCashBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [total, setTotal] = useState<number>(0);
  const [limit] = useState<number>(50);
  const [offset, setOffset] = useState<number>(0);

  // 캐시 잔액 조회
  useEffect(() => {
    const fetchCashBalance = async () => {
      try {
        const response = await fetch('/api/cash');
        const data = await response.json();

        if (data.success) {
          setCashBalance(data.balance);
        }
      } catch (error) {
        console.error('캐시 잔액 조회 실패:', error);
      }
    };

    fetchCashBalance();
  }, []);

  // 거래 이력 조회
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/cash/transactions?limit=${limit}&offset=${offset}`);
        const data = await response.json();

        if (data.success) {
          setTransactions(data.transactions);
          setTotal(data.total);
        } else {
          toast.error('거래 이력 조회에 실패했습니다.');
        }
      } catch (error) {
        console.error('거래 이력 조회 실패:', error);
        toast.error('거래 이력 조회 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [offset, limit]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* 캐시 잔액 카드 */}
      <div style={{
        padding: '24px',
        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        border: '2px solid #fbbf24',
        borderRadius: '12px',
        marginBottom: '24px',
        boxShadow: '0 4px 12px rgba(251, 191, 36, 0.15)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#92400e', marginBottom: '8px' }}>
              💰 보유 캐시
            </h2>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#78350f' }}>
              {cashBalance.toLocaleString()} <span style={{ fontSize: '20px', fontWeight: '600' }}>캐시</span>
            </div>
          </div>
          <div style={{
            padding: '12px',
            background: 'white',
            borderRadius: '50%',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <text x="12" y="16" textAnchor="middle" fontSize="12" fill="#f59e0b" fontWeight="bold">₩</text>
            </svg>
          </div>
        </div>
      </div>

      {/* 거래 이력 */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-background)'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-text)', margin: 0 }}>
            거래 이력
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px', marginBottom: 0 }}>
            총 {total.toLocaleString()}건의 거래
          </p>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid var(--color-border)',
              borderTop: '3px solid var(--color-primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            로딩 중...
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <div style={{ fontSize: '15px', fontWeight: '500' }}>거래 이력이 없습니다</div>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--color-background)' }}>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'var(--color-text-secondary)',
                      borderBottom: '1px solid var(--color-border)'
                    }}>일시</th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'var(--color-text-secondary)',
                      borderBottom: '1px solid var(--color-border)'
                    }}>구분</th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'var(--color-text-secondary)',
                      borderBottom: '1px solid var(--color-border)'
                    }}>내용</th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'var(--color-text-secondary)',
                      borderBottom: '1px solid var(--color-border)'
                    }}>금액</th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'var(--color-text-secondary)',
                      borderBottom: '1px solid var(--color-border)'
                    }}>잔액</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction, index) => {
                    const config = transactionTypeConfig[transaction.type];
                    const isPositive = transaction.amount > 0;

                    return (
                      <tr
                        key={transaction.id}
                        style={{
                          borderBottom: index < transactions.length - 1 ? '1px solid var(--color-border)' : 'none',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '16px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                          {formatDate(transaction.created_at)}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 10px',
                            background: `${config.color}15`,
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: config.color
                          }}>
                            <span>{config.icon}</span>
                            <span>{config.label}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px', fontSize: '13px', color: 'var(--color-text)' }}>
                          {transaction.description}
                        </td>
                        <td style={{
                          padding: '16px',
                          textAlign: 'right',
                          fontSize: '14px',
                          fontWeight: '700',
                          color: isPositive ? '#10b981' : '#ef4444'
                        }}>
                          {isPositive ? '+' : ''}{transaction.amount.toLocaleString()}
                        </td>
                        <td style={{
                          padding: '16px',
                          textAlign: 'right',
                          fontSize: '13px',
                          fontWeight: '600',
                          color: 'var(--color-text-secondary)'
                        }}>
                          {transaction.balance_after.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                padding: '20px',
                borderTop: '1px solid var(--color-border)'
              }}>
                <button
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '8px 16px',
                    background: currentPage === 1 ? 'var(--color-border)' : 'var(--color-primary)',
                    color: currentPage === 1 ? 'var(--color-text-secondary)' : 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  이전
                </button>

                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>
                  {currentPage} / {totalPages}
                </span>

                <button
                  onClick={() => setOffset(offset + limit)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '8px 16px',
                    background: currentPage === totalPages ? 'var(--color-border)' : 'var(--color-primary)',
                    color: currentPage === totalPages ? 'var(--color-text-secondary)' : 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
