'use client'

import { useState, useEffect, useMemo } from 'react';

interface Order {
  id: string;
  optionName?: string;
  option_name?: string;
  supplyPrice?: number;
  [key: string]: any;
}

interface ProductTop10ChartProps {
  orders: Order[];
  isMobile?: boolean;
  onProductClick?: (productName: string) => void; // 선택적 콜백
}

interface ProductItem {
  name: string;
  category3: string;
  amount: number;
  percent: number;
}

export default function ProductTop10Chart({ orders, isMobile = false, onProductClick }: ProductTop10ChartProps) {
  const [productTop10, setProductTop10] = useState<ProductItem[]>([]);
  const [allProducts, setAllProducts] = useState<ProductItem[]>([]);

  useEffect(() => {
    const fetchProductTop10 = async () => {
      // 1) 옵션상품별 금액 집계
      const optionMap: Record<string, number> = {};
      orders.forEach(order => {
        const optionName = order.optionName || order.option_name || '미지정';
        if (!optionMap[optionName]) {
          optionMap[optionName] = 0;
        }
        optionMap[optionName] += order.supplyPrice || 0;
      });

      // 2) option_products에서 category 조회
      const uniqueOptions = Object.keys(optionMap).filter(opt => opt !== '미지정');

      if (uniqueOptions.length === 0) {
        setProductTop10([]);
        setAllProducts([]);
        return;
      }

      try {
        // API를 통해 조회
        const response = await fetch(`/api/option-products?option_names=${encodeURIComponent(uniqueOptions.join(','))}`);
        const result = await response.json();

        if (!result.success || !result.data) {
          console.error('품목 조회 실패:', result.error);
          setProductTop10([]);
          setAllProducts([]);
          return;
        }

        const optionProducts = result.data;

        // 3) category별 재집계
        const categoryMap: Record<string, { category3: string; category4: string; amount: number }> = {};

        optionProducts?.forEach((product: any) => {
          const category3 = product.category_3 || '';
          const category4 = product.category_4 || '미지정';
          const key = `${category3}|${category4}`;
          const amount = optionMap[product.option_name] || 0;

          if (!categoryMap[key]) {
            categoryMap[key] = { category3, category4, amount: 0 };
          }
          categoryMap[key].amount += amount;
        });

        // 미지정 옵션 포함
        if (optionMap['미지정']) {
          const key = '|미지정';
          if (!categoryMap[key]) {
            categoryMap[key] = { category3: '', category4: '미지정', amount: 0 };
          }
          categoryMap[key].amount += optionMap['미지정'];
        }

        const sorted = Object.values(categoryMap).sort((a, b) => b.amount - a.amount);
        const totalAmount = sorted.reduce((sum, item) => sum + item.amount, 0);

        const allResult = sorted.map(item => ({
          name: item.category4,
          category3: item.category3,
          amount: item.amount,
          percent: totalAmount ? (item.amount / totalAmount) * 100 : 0
        }));

        const top10Items = sorted.slice(0, 10);
        const othersItems = sorted.slice(10);

        let chartResult = top10Items.map(item => ({
          name: item.category4,
          category3: item.category3,
          amount: item.amount,
          percent: totalAmount ? (item.amount / totalAmount) * 100 : 0
        }));

        if (othersItems.length > 0) {
          const othersAmount = othersItems.reduce((sum, item) => sum + item.amount, 0);
          chartResult.push({
            name: '기타',
            category3: '',
            amount: othersAmount,
            percent: totalAmount ? (othersAmount / totalAmount) * 100 : 0
          });
        }

        setProductTop10(chartResult);
        setAllProducts(allResult);
      } catch (error) {
        console.error('품목 TOP 10 로드 실패:', error);
        setProductTop10([]);
        setAllProducts([]);
      }
    };

    fetchProductTop10();
  }, [orders]);

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(222, 226, 230, 0.1)',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        height: '480px',
        maxHeight: '480px',
        fontSize: '14px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)'
      }}
    >
      <h3
        style={{
          fontSize: '1em',
          fontWeight: '600',
          marginBottom: '16px'
        }}
      >
        발주 TOP 10
      </h3>
      {productTop10.length > 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '24px',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1
          }}
        >
          {/* 원형 그래프 */}
          <div
            style={{
              width: isMobile ? '300px' : 'min(240px, 40%)',
              height: isMobile ? '300px' : 'auto',
              aspectRatio: '1',
              position: 'relative',
              flexShrink: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg
              viewBox="0 0 200 200"
              style={{
                width: '100%',
                height: '100%',
                transform: 'rotate(-90deg)',
                filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.15))'
              }}
            >
              {/* 외곽 테두리 원 */}
              <circle cx="100" cy="100" r="92" fill="none" stroke="#f3f4f6" strokeWidth="2" />

              {(() => {
                let cumulativePercent = 0;
                const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#f97316', '#14b8a6', '#a855f7'];
                const radius = 62;
                const circumference = 2 * Math.PI * radius;
                const totalAmount = productTop10.reduce((sum, i) => sum + i.amount, 0);

                const segments = productTop10.map((item, idx) => {
                  const percent = totalAmount ? item.amount / totalAmount : 0;
                  const strokeDasharray = `${percent * circumference} ${circumference}`;
                  const strokeDashoffset = -cumulativePercent * circumference;

                  const startAngle = cumulativePercent * 2 * Math.PI;
                  const midAngle = startAngle + (percent * 2 * Math.PI) / 2;
                  const endAngle = startAngle + percent * 2 * Math.PI;

                  const textRadius = 62;
                  const textX = 100 + textRadius * Math.cos(midAngle);
                  const textY = 100 + textRadius * Math.sin(midAngle);

                  const innerRadius = 32;
                  const outerRadius = 92;

                  const endX1 = 100 + innerRadius * Math.cos(endAngle);
                  const endY1 = 100 + innerRadius * Math.sin(endAngle);
                  const endX2 = 100 + outerRadius * Math.cos(endAngle);
                  const endY2 = 100 + outerRadius * Math.sin(endAngle);

                  const isOthers = item.name === '기타';
                  const segmentColor = isOthers ? '#9ca3af' : colors[idx % colors.length];

                  cumulativePercent += percent;

                  return {
                    circle: (
                      <circle
                        key={idx}
                        cx="100"
                        cy="100"
                        r={radius}
                        fill="transparent"
                        stroke={segmentColor}
                        strokeWidth="60"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        style={{
                          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                          opacity: 0.95
                        }}
                      />
                    ),
                    divider:
                      idx < productTop10.length - 1 ? (
                        <line
                          key={`divider-${idx}`}
                          x1={endX1}
                          y1={endY1}
                          x2={endX2}
                          y2={endY2}
                          stroke="var(--color-border)"
                          strokeWidth="0.8"
                          style={{ pointerEvents: 'none' }}
                        />
                      ) : null,
                    text:
                      percent > 0.05 ? (
                        <text
                          key={`text-${idx}`}
                          x={textX}
                          y={textY}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="var(--color-text)"
                          fontSize="10"
                          fontWeight="700"
                          style={{
                            transform: 'rotate(90deg)',
                            transformOrigin: `${textX}px ${textY}px`,
                            textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
                            pointerEvents: 'none'
                          }}
                        >
                          {(percent * 100).toFixed(1)}%
                        </text>
                      ) : null
                  };
                });

                const firstDivider = (() => {
                  const angle = 0;
                  const innerRadius = 32;
                  const outerRadius = 92;
                  const x1 = 100 + innerRadius * Math.cos(angle);
                  const y1 = 100 + innerRadius * Math.sin(angle);
                  const x2 = 100 + outerRadius * Math.cos(angle);
                  const y2 = 100 + outerRadius * Math.sin(angle);

                  return (
                    <line
                      key="divider-first"
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="var(--color-border)"
                      strokeWidth="0.8"
                      style={{ pointerEvents: 'none' }}
                    />
                  );
                })();

                return (
                  <>
                    {segments.map(s => s.circle)}
                    {firstDivider}
                    {segments.map(s => s.divider)}
                    {segments.map(s => s.text)}
                  </>
                );
              })()}

              {/* 중앙 원 (다크모드 대응) */}
              <circle cx="100" cy="100" r="32" fill="var(--color-surface)" filter="drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15))" />
            </svg>
          </div>

          {/* 범례 */}
          <div
            style={{
              flex: 1,
              maxHeight: '340px',
              overflowY: 'auto',
              paddingRight: '8px'
            }}
          >
            {allProducts.map((item, idx) => {
              const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#f97316', '#14b8a6', '#a855f7'];
              const isInTop10 = idx < 10;
              const color = isInTop10 ? colors[idx % colors.length] : '#9ca3af';

              return (
                <div
                  key={idx}
                  onClick={() => onProductClick?.(item.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '4px',
                    gap: '8px',
                    cursor: onProductClick ? 'pointer' : 'default',
                    padding: '2px 8px',
                    marginLeft: '-8px',
                    borderRadius: '6px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    if (onProductClick) {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--color-surface-hover)';
                    }
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                  }}
                >
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '3px',
                      backgroundColor: color,
                      flexShrink: 0
                    }}
                  />
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flex: 1,
                      minWidth: 0,
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    <span
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        color: 'var(--color-text)'
                      }}
                    >
                      {item.category3 && <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: '400' }}>{item.category3} / </span>}
                      {item.name}
                    </span>
                    <span
                      style={{
                        whiteSpace: 'nowrap',
                        color: 'var(--color-text-secondary)',
                        fontSize: '11px',
                        fontWeight: '400'
                      }}
                    >
                      ₩{item.amount.toLocaleString()}
                    </span>
                    <span
                      style={{
                        whiteSpace: 'nowrap',
                        fontWeight: '600',
                        color: color,
                        fontSize: '12px'
                      }}
                    >
                      {item.percent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>데이터가 없습니다</div>
      )}
    </div>
  );
}
