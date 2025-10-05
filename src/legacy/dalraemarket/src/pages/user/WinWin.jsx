// src/pages/user/WinWin.jsx
import { useState } from 'react';
import UserHeader from '../../components/layout/UserHeader';

function WinWin() {
  const [activeService, setActiveService] = useState('photo');
  const [expandedLocations, setExpandedLocations] = useState({});
  const [selectedLocations, setSelectedLocations] = useState({});
  const [quantities, setQuantities] = useState({});
  const [editQuantities, setEditQuantities] = useState({});
  const [options, setOptions] = useState({});
  const [expandedAccordion, setExpandedAccordion] = useState(null);

  // 로케이션 데이터
  const locationData = {
    indoor: { name: '일반 실내 촬영', basePrice: 30000, defaultPhoto: 50, defaultVideo: 10 },
    outdoor: { name: '야외 촬영', basePrice: 50000, defaultPhoto: 50, defaultVideo: 5 },
    cooking: { name: '요리 촬영', basePrice: 60000, defaultPhoto: 30, defaultVideo: 3, hasMenu: true },
    drone: { name: '드론 촬영', basePrice: 90000, defaultPhoto: 20, defaultVideo: 5, noHandModel: true }
  };

  // 토글 로케이션
  const toggleLocation = (location) => {
    setExpandedLocations(prev => ({
      ...prev,
      [location]: !prev[location]
    }));
  };

  // 체크박스 토글
  const toggleLocationCheck = (location, e) => {
    e.stopPropagation();
    setSelectedLocations(prev => ({
      ...prev,
      [location]: !prev[location]
    }));
  };

  // 수량 조정
  const adjustQuantity = (id, change) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + change)
    }));
  };

  // 편집 수량 조정
  const adjustEditQuantity = (id, change) => {
    setEditQuantities(prev => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + change)
    }));
  };

  // 옵션 토글
  const toggleOption = (id) => {
    setOptions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // 가격 계산
  const calculateQuote = () => {
    let total = 0;
    let locationCost = 0;
    let transitionCost = 0;
    let menuCost = 0;
    let photoCost = 0;
    let videoCost = 0;
    let handCost = 0;
    let modelCost = 0;
    let editCost = 0;

    // 선택된 로케이션 계산
    const selectedCount = Object.values(selectedLocations).filter(Boolean).length;
    
    Object.keys(selectedLocations).forEach(location => {
      if (selectedLocations[location]) {
        locationCost += locationData[location].basePrice;
        
        // 추가 사진
        const photoQty = quantities[`${location}-photo`] || 0;
        photoCost += photoQty * 500;
        
        // 추가 영상
        const videoQty = quantities[`${location}-video`] || 0;
        videoCost += videoQty * 2000;
        
        // 옵션
        if (options[`${location}-hand`]) handCost += 30000;
        if (options[`${location}-model`]) modelCost += 200000;
      }
    });

    // 로케이션 전환 비용
    if (selectedCount >= 2) {
      transitionCost = (selectedCount - 1) * 10000;
    }

    // 요리 메뉴 추가 비용
    if (selectedLocations.cooking) {
      const menuQty = quantities['cooking-menu'] || 0;
      menuCost = menuQty * 30000;
    }

    // 편집 비용
    const basic1 = (editQuantities['edit-basic-1min'] || 0) * 30000;
    const basic2 = (editQuantities['edit-basic-2min'] || 0) * 60000;
    const basic3 = (editQuantities['edit-basic-3min'] || 0) * 90000;
    const full1 = (editQuantities['edit-full-1min'] || 0) * 70000;
    const full2 = (editQuantities['edit-full-2min'] || 0) * 90000;
    const full3 = (editQuantities['edit-full-3min'] || 0) * 110000;
    editCost = basic1 + basic2 + basic3 + full1 + full2 + full3;

    total = locationCost + transitionCost + menuCost + photoCost + videoCost + handCost + modelCost + editCost;

    return {
      total,
      locationCost,
      transitionCost,
      menuCost,
      photoCost,
      videoCost,
      handCost,
      modelCost,
      editCost
    };
  };

  const quote = calculateQuote();

  // 통계 계산
  const calculateStats = () => {
    let totalPhotos = 0;
    let totalVideos = 0;
    const stats = [];

    Object.keys(selectedLocations).forEach(location => {
      if (selectedLocations[location]) {
        const data = locationData[location];
        const addPhotos = quantities[`${location}-photo`] || 0;
        const addVideos = quantities[`${location}-video`] || 0;
        const photos = data.defaultPhoto + addPhotos;
        const videos = data.defaultVideo + addVideos;
        
        totalPhotos += photos;
        totalVideos += videos;
        
        stats.push({
          name: data.name,
          photos,
          videos
        });
      }
    });

    return { totalPhotos, totalVideos, stats };
  };

  const stats = calculateStats();

  // 편집 통계
  const totalEditVideos = Object.values(editQuantities).reduce((sum, qty) => sum + qty, 0);

  // 농가 매칭 서비스 데이터
  const accordionData = [
    {
      title: '서비스 프로세스',
      content: [
        '1. 고객 요구사항 파악',
        '2. 맞춤형 농가 매칭',
        '3. 품질 및 가격 협상',
        '4. 계약 체결 지원'
      ]
    },
    {
      title: '제공 혜택',
      content: [
        '산지 직송으로 신선도 보장',
        '중간 유통 마진 제거',
        '안정적인 공급처 확보',
        '품질 보증 시스템'
      ]
    },
    {
      title: '주의사항',
      content: [
        '매칭 후 달래마켓은 관여하지 않습니다',
        '직접 거래에 따른 책임은 거래 당사자에게 있습니다',
        '사전 상담을 통해 충분한 검토 후 진행하세요'
      ]
    }
  ];

  const farmPlans = {
    visit: {
      price: 150000,
      features: [
        '농가 직접 방문 동행',
        '품질 현장 확인',
        '가격 협상 지원',
        '1:1 맞춤 상담'
      ]
    },
    matching: {
      price: 100000,
      features: [
        '맞춤형 농가 매칭',
        '온라인 미팅 주선',
        '기본 계약서 제공',
        '사후 관리 1개월'
      ]
    },
    full: {
      price: 200000,
      features: [
        '전체 프로세스 관리',
        '방문 동행 + 매칭',
        '계약 체결 지원',
        '3개월 사후 관리'
      ]
    }
  };

  const formatPrice = (price) => {
    return '₩' + price.toLocaleString('ko-KR');
  };

  return (
    <>
      <UserHeader />
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #eff6ff, #ffffff 25%, #ffffff)',
        paddingTop: '70px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* 배경 장식 */}
        <div style={{
          position: 'absolute',
          top: '-120px',
          left: '-140px',
          width: '260px',
          height: '260px',
          background: '#bfdbfe',
          borderRadius: '999px',
          filter: 'blur(60px)',
          opacity: 0.5,
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          right: '-120px',
          bottom: '-140px',
          width: '300px',
          height: '300px',
          background: '#93c5fd',
          borderRadius: '999px',
          filter: 'blur(60px)',
          opacity: 0.5,
          pointerEvents: 'none'
        }} />

        {/* 히어로 섹션 */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '72px 20px 24px',
          textAlign: 'center',
          position: 'relative'
        }}>
          <h1 style={{
            fontSize: '38px',
            lineHeight: '1.15',
            margin: 0,
            color: '#1d4ed8',
            fontWeight: '700'
          }}>
            달래마켓만의 특별한 서비스
          </h1>
          <p style={{
            margin: '12px auto 0',
            color: '#475569',
            maxWidth: '720px',
            fontSize: '16px'
          }}>
            지속적인 파트너십을 위해 언제나 최선을 다하고 있습니다
          </p>
          
          {/* 서비스 탭 */}
          <div style={{
            margin: '22px auto 0',
            display: 'inline-flex',
            background: '#ffffff',
            border: '1px solid #bfdbfe',
            borderRadius: '18px',
            boxShadow: '0 8px 24px rgba(2,6,23,0.06)'
          }}>
            <button
              onClick={() => setActiveService('photo')}
              style={{
                border: 0,
                background: activeService === 'photo' ? '#2563eb' : 'transparent',
                padding: '10px 16px',
                borderRadius: '14px',
                fontWeight: '800',
                color: activeService === 'photo' ? '#ffffff' : '#1d4ed8',
                cursor: 'pointer',
                boxShadow: activeService === 'photo' ? '0 10px 20px rgba(37,99,235,0.25)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              촬영 서비스
            </button>
            <button
              onClick={() => setActiveService('farm')}
              style={{
                border: 0,
                background: activeService === 'farm' ? '#2563eb' : 'transparent',
                padding: '10px 16px',
                borderRadius: '14px',
                fontWeight: '800',
                color: activeService === 'farm' ? '#ffffff' : '#1d4ed8',
                cursor: 'pointer',
                boxShadow: activeService === 'farm' ? '0 10px 20px rgba(37,99,235,0.25)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              농가 매칭 서비스
            </button>
          </div>
        </div>

        {/* 분할 히어로 카드 */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px',
          display: 'grid',
          gridTemplateColumns: window.innerWidth >= 900 ? 'repeat(2, 1fr)' : '1fr',
          gap: '20px',
          marginBottom: '36px'
        }}>
          <div style={{
            background: '#ffffff',
            border: '1px solid #bfdbfe',
            borderRadius: '22px',
            padding: '22px 22px 24px',
            transition: 'box-shadow 0.25s, transform 0.25s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 18px 44px rgba(2,6,23,0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              marginBottom: '12px'
            }}>
              UNIQUE <span style={{ color: '#1d4ed8' }}>상품 사진</span>
            </h2>
            <p style={{
              color: '#64748b',
              fontSize: '14px',
              lineHeight: '1.6'
            }}>
              상품의 가치를 높이는 <strong>중복 없이 고유한</strong> 나만의 상품 사진으로 판매에 도전하세요
            </p>
          </div>

          <div style={{
            background: '#ffffff',
            border: '1px solid #bfdbfe',
            borderRadius: '22px',
            padding: '22px 22px 24px',
            transition: 'box-shadow 0.25s, transform 0.25s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 18px 44px rgba(2,6,23,0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              marginBottom: '12px'
            }}>
              <span style={{ color: '#1d4ed8' }}>농가 매칭 서비스</span>
            </h2>
            <p style={{
              color: '#64748b',
              fontSize: '14px',
              lineHeight: '1.6',
              marginBottom: '8px'
            }}>
              결론은 가격과 품질!! 농가 매칭 서비스로 산지가격으로 상품을 소싱 해드립니다.
            </p>
            <p style={{
              fontSize: '12px',
              color: '#94a3b8'
            }}>
              (매칭 후 달래마켓에서는 특별한 사정이 없는 한 관여하지 않습니다)
            </p>
          </div>
        </div>

        {/* 촬영 서비스 섹션 */}
        {activeService === 'photo' && (
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 20px 70px',
            display: 'grid',
            gridTemplateColumns: window.innerWidth >= 900 ? '1fr 400px' : '1fr',
            gap: '20px'
          }}>
            {/* 좌측: 로케이션 선택 */}
            <div>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                marginBottom: '20px'
              }}>
                촬영 로케이션 선택
              </h2>

              {Object.entries(locationData).map(([key, data]) => (
                <div key={key} style={{
                  background: '#ffffff',
                  border: selectedLocations[key] ? '2px solid #3b82f6' : '1px solid #bfdbfe',
                  borderRadius: '22px',
                  marginBottom: '16px',
                  overflow: 'hidden',
                  transition: 'box-shadow 0.25s, transform 0.25s'
                }}
                onMouseEnter={(e) => {
                  if (!expandedLocations[key]) {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 18px 44px rgba(2,6,23,0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                  <div 
                    style={{
                      padding: '22px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      background: selectedLocations[key] ? 'linear-gradient(to right, #eff6ff, #ffffff)' : 'transparent'
                    }}
                    onClick={() => toggleLocation(key)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input
                        type="checkbox"
                        checked={selectedLocations[key] || false}
                        onChange={(e) => toggleLocationCheck(key, e)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: '20px',
                          height: '20px',
                          cursor: 'pointer'
                        }}
                      />
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#1d4ed8'
                      }}>
                        {data.name}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '20px',
                      fontWeight: '900'
                    }}>
                      {formatPrice(data.basePrice)}
                    </div>
                  </div>

                  {expandedLocations[key] && (
                    <div style={{
                      padding: '0 22px 22px',
                      borderTop: '1px solid #e5e7eb'
                    }}>
                      <div style={{
                        padding: '16px',
                        background: '#f0f9ff',
                        borderRadius: '12px',
                        marginTop: '16px',
                        marginBottom: '20px',
                        fontSize: '13px',
                        color: '#64748b'
                      }}>
                        기본 제공: 사진 {data.defaultPhoto}매, 영상길이 {data.defaultVideo}분 이상 (총 재생시간)
                      </div>

                      {/* 추가 메뉴 (요리 촬영만) */}
                      {data.hasMenu && (
                        <div style={{ marginBottom: '24px' }}>
                          <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            marginBottom: '12px',
                            color: '#334155'
                          }}>
                            메뉴 개수
                          </label>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                          }}>
                            <span style={{ fontSize: '14px', minWidth: '80px' }}>추가 메뉴</span>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              border: '1px solid #cbd5e1',
                              borderRadius: '8px',
                              overflow: 'hidden'
                            }}>
                              <button
                                onClick={() => adjustQuantity(`${key}-menu`, -1)}
                                style={{
                                  padding: '8px 12px',
                                  background: '#f8fafc',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: '#64748b'
                                }}
                              >
                                −
                              </button>
                              <input
                                type="number"
                                value={quantities[`${key}-menu`] || 0}
                                onChange={(e) => setQuantities(prev => ({
                                  ...prev,
                                  [`${key}-menu`]: parseInt(e.target.value) || 0
                                }))}
                                style={{
                                  width: '60px',
                                  padding: '8px',
                                  border: 'none',
                                  textAlign: 'center'
                                }}
                              />
                              <button
                                onClick={() => adjustQuantity(`${key}-menu`, 1)}
                                style={{
                                  padding: '8px 12px',
                                  background: '#f8fafc',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: '#64748b'
                                }}
                              >
                                +
                              </button>
                            </div>
                            <span style={{ fontSize: '13px', color: '#64748b' }}>
                              개 (메뉴당 30,000원 추가)
                            </span>
                          </div>
                        </div>
                      )}

                      {/* 추가 수량 */}
                      <div style={{ marginBottom: '24px' }}>
                        <label style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: '500',
                          marginBottom: '12px',
                          color: '#334155'
                        }}>
                          추가 수량
                        </label>
                        
                        {/* 추가 사진 */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          marginBottom: '12px'
                        }}>
                          <span style={{ fontSize: '14px', minWidth: '80px' }}>추가 사진</span>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            overflow: 'hidden'
                          }}>
                            <button
                              onClick={() => adjustQuantity(`${key}-photo`, -10)}
                              style={{
                                padding: '8px 12px',
                                background: '#f8fafc',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#64748b'
                              }}
                            >
                              −
                            </button>
                            <input
                              type="number"
                              value={quantities[`${key}-photo`] || 0}
                              onChange={(e) => setQuantities(prev => ({
                                ...prev,
                                [`${key}-photo`]: parseInt(e.target.value) || 0
                              }))}
                              style={{
                                width: '60px',
                                padding: '8px',
                                border: 'none',
                                textAlign: 'center'
                              }}
                            />
                            <button
                              onClick={() => adjustQuantity(`${key}-photo`, 10)}
                              style={{
                                padding: '8px 12px',
                                background: '#f8fafc',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#64748b'
                              }}
                            >
                              +
                            </button>
                          </div>
                          <span style={{ fontSize: '13px', color: '#64748b' }}>
                            매 (500원/매)
                          </span>
                        </div>

                        {/* 추가 영상 */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}>
                          <span style={{ fontSize: '14px', minWidth: '80px' }}>추가 영상</span>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            overflow: 'hidden'
                          }}>
                            <button
                              onClick={() => adjustQuantity(`${key}-video`, -1)}
                              style={{
                                padding: '8px 12px',
                                background: '#f8fafc',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#64748b'
                              }}
                            >
                              −
                            </button>
                            <input
                              type="number"
                              value={quantities[`${key}-video`] || 0}
                              onChange={(e) => setQuantities(prev => ({
                                ...prev,
                                [`${key}-video`]: parseInt(e.target.value) || 0
                              }))}
                              style={{
                                width: '60px',
                                padding: '8px',
                                border: 'none',
                                textAlign: 'center'
                              }}
                            />
                            <button
                              onClick={() => adjustQuantity(`${key}-video`, 1)}
                              style={{
                                padding: '8px 12px',
                                background: '#f8fafc',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#64748b'
                              }}
                            >
                              +
                            </button>
                          </div>
                          <span style={{ fontSize: '13px', color: '#64748b' }}>
                            분 (2,000원/분)
                          </span>
                        </div>
                      </div>

                      {/* 추가 옵션 */}
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: '500',
                          marginBottom: '12px',
                          color: '#334155'
                        }}>
                          추가 옵션
                        </label>
                        <div style={{ display: 'flex', gap: '16px' }}>
                          <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: data.noHandModel ? 'not-allowed' : 'pointer',
                            opacity: data.noHandModel ? 0.5 : 1,
                            fontSize: '14px',
                            color: '#334155'
                          }}>
                            <input
                              type="checkbox"
                              checked={options[`${key}-hand`] || false}
                              onChange={() => toggleOption(`${key}-hand`)}
                              disabled={data.noHandModel}
                              style={{
                                width: '18px',
                                height: '18px'
                              }}
                            />
                            핸드컷 {data.noHandModel ? '(불가)' : '(+30,000원)'}
                          </label>
                          <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: data.noHandModel ? 'not-allowed' : 'pointer',
                            opacity: data.noHandModel ? 0.5 : 1,
                            fontSize: '14px',
                            color: '#334155'
                          }}>
                            <input
                              type="checkbox"
                              checked={options[`${key}-model`] || false}
                              onChange={() => toggleOption(`${key}-model`)}
                              disabled={data.noHandModel}
                              style={{
                                width: '18px',
                                height: '18px'
                              }}
                            />
                            모델컷 {data.noHandModel ? '(불가)' : '(+200,000원)'}
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 우측: 통계, 편집, 견적 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* 통계 섹션 */}
              <div style={{
                background: '#ffffff',
                borderRadius: '22px',
                padding: '22px',
                border: '1px solid #bfdbfe'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  marginBottom: '20px',
                  color: '#1d4ed8'
                }}>
                  촬영 통계
                </h3>
                
                {stats.stats.length > 0 ? (
                  <>
                    {stats.stats.map((stat, index) => (
                      <div key={index} style={{
                        padding: '12px',
                        background: '#f0f9ff',
                        borderRadius: '8px',
                        marginBottom: '12px'
                      }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          marginBottom: '8px',
                          color: '#334155'
                        }}>
                          {stat.name}
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '13px',
                          color: '#64748b'
                        }}>
                          <span>사진: {stat.photos}매</span>
                          <span>영상: {stat.videos}분</span>
                        </div>
                      </div>
                    ))}
                    
                    <div style={{
                      marginTop: '16px',
                      paddingTop: '16px',
                      borderTop: '1px solid #e5e7eb'
                    }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        marginBottom: '8px',
                        color: '#334155'
                      }}>
                        전체 합계
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '14px'
                      }}>
                        <span>총 사진 수량</span>
                        <span style={{ fontWeight: '600', color: '#1d4ed8' }}>{stats.totalPhotos}매</span>
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '14px',
                        marginTop: '4px'
                      }}>
                        <span>총 영상 수량</span>
                        <span style={{ fontWeight: '600', color: '#1d4ed8' }}>{stats.totalVideos}분</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '32px',
                    color: '#94a3b8'
                  }}>
                    로케이션을 선택해주세요
                  </div>
                )}
              </div>

              {/* 편집 옵션 */}
              <div style={{
                background: '#ffffff',
                borderRadius: '22px',
                padding: '22px',
                border: '1px solid #bfdbfe'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  marginBottom: '20px',
                  color: '#1d4ed8'
                }}>
                  영상 편집 옵션
                </h3>

                {/* 일반 편집 */}
                <div style={{
                  marginBottom: '20px',
                  padding: '16px',
                  background: '#f0f9ff',
                  borderRadius: '12px'
                }}>
                  <div style={{
                    fontSize: '15px',
                    fontWeight: '500',
                    marginBottom: '4px',
                    color: '#334155'
                  }}>
                    일반 편집
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: '#64748b',
                    marginBottom: '12px'
                  }}>
                    고객이 시나리오 제공 (30,000원/분)
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[1, 2, 3].map(min => (
                      <div key={min} style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '12px',
                          color: '#64748b',
                          marginBottom: '4px',
                          textAlign: 'center'
                        }}>
                          {min}분
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          background: '#ffffff'
                        }}>
                          <button
                            onClick={() => adjustEditQuantity(`edit-basic-${min}min`, -1)}
                            style={{
                              padding: '4px 8px',
                              background: '#f8fafc',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '14px',
                              color: '#64748b'
                            }}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            value={editQuantities[`edit-basic-${min}min`] || 0}
                            onChange={(e) => setEditQuantities(prev => ({
                              ...prev,
                              [`edit-basic-${min}min`]: parseInt(e.target.value) || 0
                            }))}
                            style={{
                              width: '40px',
                              padding: '4px',
                              border: 'none',
                              textAlign: 'center',
                              fontSize: '13px'
                            }}
                          />
                          <button
                            onClick={() => adjustEditQuantity(`edit-basic-${min}min`, 1)}
                            style={{
                              padding: '4px 8px',
                              background: '#f8fafc',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '14px',
                              color: '#64748b'
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 풀 편집 */}
                <div style={{
                  padding: '16px',
                  background: '#f0f9ff',
                  borderRadius: '12px'
                }}>
                  <div style={{
                    fontSize: '15px',
                    fontWeight: '500',
                    marginBottom: '4px',
                    color: '#334155'
                  }}>
                    풀 편집
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: '#64748b',
                    marginBottom: '12px'
                  }}>
                    썸네일, 시나리오, 자막 등 모든 작업 위임<br />
                    1분: 70,000원 / 2분 이상: +20,000원/분
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[1, 2, 3].map(min => (
                      <div key={min} style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '12px',
                          color: '#64748b',
                          marginBottom: '4px',
                          textAlign: 'center'
                        }}>
                          {min}분
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          background: '#ffffff'
                        }}>
                          <button
                            onClick={() => adjustEditQuantity(`edit-full-${min}min`, -1)}
                            style={{
                              padding: '4px 8px',
                              background: '#f8fafc',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '14px',
                              color: '#64748b'
                            }}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            value={editQuantities[`edit-full-${min}min`] || 0}
                            onChange={(e) => setEditQuantities(prev => ({
                              ...prev,
                              [`edit-full-${min}min`]: parseInt(e.target.value) || 0
                            }))}
                            style={{
                              width: '40px',
                              padding: '4px',
                              border: 'none',
                              textAlign: 'center',
                              fontSize: '13px'
                            }}
                          />
                          <button
                            onClick={() => adjustEditQuantity(`edit-full-${min}min`, 1)}
                            style={{
                              padding: '4px 8px',
                              background: '#f8fafc',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '14px',
                              color: '#64748b'
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '14px'
                }}>
                  <span>총 편집 영상 개수</span>
                  <span style={{ fontWeight: '600', color: '#1d4ed8' }}>{totalEditVideos}개</span>
                </div>
              </div>

              {/* 최종 견적 */}
              <div style={{
                background: '#ffffff',
                border: '2px solid #3b82f6',
                borderRadius: '22px',
                padding: '22px',
                boxShadow: '0 24px 60px -20px rgba(59,130,246,0.35)',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  left: '50%',
                  top: '-12px',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(90deg, #2563eb, #06b6d4)',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: '900',
                  padding: '6px 10px',
                  borderRadius: '999px'
                }}>
                  최종 견적
                </div>

                <div style={{ marginBottom: '20px', marginTop: '8px' }}>
                  {quote.locationCost > 0 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '10px',
                      fontSize: '14px',
                      color: '#334155'
                    }}>
                      <span>로케이션 기본</span>
                      <span style={{ fontWeight: '500' }}>{formatPrice(quote.locationCost)}</span>
                    </div>
                  )}
                  {quote.transitionCost > 0 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '10px',
                      fontSize: '14px',
                      color: '#334155'
                    }}>
                      <span>로케이션 전환</span>
                      <span style={{ fontWeight: '500' }}>{formatPrice(quote.transitionCost)}</span>
                    </div>
                  )}
                  {quote.menuCost > 0 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '10px',
                      fontSize: '14px',
                      color: '#334155'
                    }}>
                      <span>추가 메뉴</span>
                      <span style={{ fontWeight: '500' }}>{formatPrice(quote.menuCost)}</span>
                    </div>
                  )}
                  {quote.photoCost > 0 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '10px',
                      fontSize: '14px',
                      color: '#334155'
                    }}>
                      <span>추가 사진</span>
                      <span style={{ fontWeight: '500' }}>{formatPrice(quote.photoCost)}</span>
                    </div>
                  )}
                  {quote.videoCost > 0 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '10px',
                      fontSize: '14px',
                      color: '#334155'
                    }}>
                      <span>추가 영상</span>
                      <span style={{ fontWeight: '500' }}>{formatPrice(quote.videoCost)}</span>
                    </div>
                  )}
                  {quote.handCost > 0 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '10px',
                      fontSize: '14px',
                      color: '#334155'
                    }}>
                      <span>핸드컷</span>
                      <span style={{ fontWeight: '500' }}>{formatPrice(quote.handCost)}</span>
                    </div>
                  )}
                  {quote.modelCost > 0 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '10px',
                      fontSize: '14px',
                      color: '#334155'
                    }}>
                      <span>모델컷</span>
                      <span style={{ fontWeight: '500' }}>{formatPrice(quote.modelCost)}</span>
                    </div>
                  )}
                  {quote.editCost > 0 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '10px',
                      fontSize: '14px',
                      color: '#334155'
                    }}>
                      <span>영상 편집</span>
                      <span style={{ fontWeight: '500' }}>{formatPrice(quote.editCost)}</span>
                    </div>
                  )}
                </div>

                <div style={{
                  paddingTop: '16px',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <div style={{
                    fontSize: '13px',
                    color: '#64748b',
                    marginBottom: '8px'
                  }}>
                    예상 총 비용
                  </div>
                  <div style={{
                    fontSize: '30px',
                    fontWeight: '900',
                    color: '#1d4ed8'
                  }}>
                    {formatPrice(quote.total)}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#64748b',
                    marginTop: '4px'
                  }}>
                    * 부가세 별도
                  </div>
                </div>

                <div style={{
                  marginTop: '20px',
                  paddingTop: '20px',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <div style={{
                    fontSize: '14px',
                    marginBottom: '12px',
                    color: '#334155'
                  }}>
                    진행 시 유선상담 조율 후 진행 가능합니다
                  </div>
                  <button
                    onClick={() => window.location.href = 'tel:01026881388'}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '14px',
                      fontWeight: '900',
                      background: 'linear-gradient(90deg, #2563eb, #06b6d4)',
                      color: '#ffffff',
                      border: '1px solid transparent',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.filter = 'brightness(1.03)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.filter = 'brightness(1)';
                    }}
                  >
                    010-2688-1388
                  </button>
                </div>

                <div style={{
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid #e5e7eb',
                  fontSize: '12px',
                  color: '#94a3b8',
                  textAlign: 'center'
                }}>
                  본 견적은 예상 금액이며, 현장 상황에 따라 변동될 수 있습니다
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 농가 매칭 서비스 섹션 */}
        {activeService === 'farm' && (
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 20px 70px'
          }}>
            {/* 서비스 설명 아코디언 */}
            <div style={{ marginBottom: '40px' }}>
              {accordionData.map((item, index) => (
                <div key={index} style={{
                  background: '#ffffff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '22px',
                  marginBottom: '12px',
                  overflow: 'hidden',
                  transition: 'box-shadow 0.25s, transform 0.25s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 18px 44px rgba(2,6,23,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                  <button
                    onClick={() => setExpandedAccordion(expandedAccordion === index ? null : index)}
                    style={{
                      width: '100%',
                      padding: '20px 24px',
                      background: expandedAccordion === index ? '#f0f9ff' : '#ffffff',
                      border: 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1d4ed8'
                    }}
                  >
                    {item.title}
                    <span style={{
                      transform: expandedAccordion === index ? 'rotate(180deg)' : 'rotate(0)',
                      transition: 'transform 0.2s',
                      color: '#64748b'
                    }}>
                      ▼
                    </span>
                  </button>
                  {expandedAccordion === index && (
                    <div style={{
                      padding: '20px 24px',
                      borderTop: '1px solid #e5e7eb',
                      background: '#fafbfc'
                    }}>
                      {item.content.map((text, i) => (
                        <div key={i} style={{
                          marginBottom: '8px',
                          fontSize: '14px',
                          color: '#334155',
                          lineHeight: '1.6'
                        }}>
                          {text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 가격 플랜 카드 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: window.innerWidth >= 900 ? 'repeat(3, 1fr)' : '1fr',
              gap: '20px',
              marginBottom: '32px'
            }}>
              {/* 방문견학동행 */}
              <div style={{
                background: '#ffffff',
                border: '1px solid #bfdbfe',
                borderRadius: '22px',
                padding: '22px 22px 24px',
                textAlign: 'center',
                position: 'relative',
                transition: 'box-shadow 0.25s, transform 0.25s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 18px 44px rgba(2,6,23,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: '#1d4ed8'
                }}>
                  방문견학동행
                </h3>
                <div style={{
                  fontSize: '30px',
                  fontWeight: '900',
                  margin: '8px 0 2px'
                }}>
                  {formatPrice(farmPlans.visit.price)}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#64748b',
                  marginBottom: '20px'
                }}>
                  /건
                </div>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '16px 0 18px'
                }}>
                  {farmPlans.visit.features.map((feature, index) => (
                    <li key={index} style={{
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'flex-start',
                      margin: '10px 0',
                      fontSize: '14px',
                      color: '#334155',
                      textAlign: 'left'
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" stroke="#1d4ed8" strokeWidth="2" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  fontWeight: '900',
                  background: '#ffffff',
                  color: '#1d4ed8',
                  border: '1px solid #93c5fd',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#eff6ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ffffff';
                }}>
                  선택하기
                </button>
              </div>

              {/* 농가매칭 (추천) */}
              <div style={{
                background: '#ffffff',
                border: '2px solid #3b82f6',
                borderRadius: '22px',
                padding: '22px 22px 24px',
                textAlign: 'center',
                position: 'relative',
                boxShadow: '0 24px 60px -20px rgba(59,130,246,0.35)',
                transition: 'box-shadow 0.25s, transform 0.25s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 28px 70px -20px rgba(59,130,246,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 24px 60px -20px rgba(59,130,246,0.35)';
              }}>
                <div style={{
                  position: 'absolute',
                  left: '50%',
                  top: '-12px',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(90deg, #2563eb, #06b6d4)',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: '900',
                  padding: '6px 10px',
                  borderRadius: '999px'
                }}>
                  추천
                </div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: '#1d4ed8'
                }}>
                  농가매칭
                </h3>
                <div style={{
                  fontSize: '30px',
                  fontWeight: '900',
                  margin: '8px 0 2px'
                }}>
                  {formatPrice(farmPlans.matching.price)}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#64748b',
                  marginBottom: '20px'
                }}>
                  /건
                </div>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '16px 0 18px'
                }}>
                  {farmPlans.matching.features.map((feature, index) => (
                    <li key={index} style={{
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'flex-start',
                      margin: '10px 0',
                      fontSize: '14px',
                      color: '#334155',
                      textAlign: 'left'
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" stroke="#1d4ed8" strokeWidth="2" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  fontWeight: '900',
                  background: 'linear-gradient(90deg, #2563eb, #06b6d4)',
                  color: '#ffffff',
                  border: '1px solid transparent',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = 'brightness(1.03)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = 'brightness(1)';
                }}>
                  선택하기
                </button>
              </div>

              {/* 풀서비스 */}
              <div style={{
                background: '#ffffff',
                border: '1px solid #bfdbfe',
                borderRadius: '22px',
                padding: '22px 22px 24px',
                textAlign: 'center',
                position: 'relative',
                transition: 'box-shadow 0.25s, transform 0.25s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 18px 44px rgba(2,6,23,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: '#1d4ed8'
                }}>
                  풀서비스
                </h3>
                <div style={{
                  fontSize: '30px',
                  fontWeight: '900',
                  margin: '8px 0 2px'
                }}>
                  {formatPrice(farmPlans.full.price)}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#64748b',
                  marginBottom: '20px'
                }}>
                  /건
                </div>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '16px 0 18px'
                }}>
                  {farmPlans.full.features.map((feature, index) => (
                    <li key={index} style={{
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'flex-start',
                      margin: '10px 0',
                      fontSize: '14px',
                      color: '#334155',
                      textAlign: 'left'
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" stroke="#1d4ed8" strokeWidth="2" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  fontWeight: '900',
                  background: '#ffffff',
                  color: '#1d4ed8',
                  border: '1px solid #93c5fd',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#eff6ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ffffff';
                }}>
                  선택하기
                </button>
              </div>
            </div>

            <div style={{
              textAlign: 'center',
              padding: '20px',
              background: '#fef2f2',
              borderRadius: '16px',
              fontSize: '14px',
              color: '#991b1b'
            }}>
              매칭 후 달래마켓에서는 특별한 사정이 없는 한 관여하지 않습니다
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default WinWin;