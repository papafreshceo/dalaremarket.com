// src/components/tools/CustomerMessage.jsx
import { useState } from 'react';

function CustomerMessage() {
  const [activeTab, setActiveTab] = useState('templates'); // templates, compose, history
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [messageContent, setMessageContent] = useState('');
  const [variables, setVariables] = useState({
    customerName: '',
    orderNumber: '',
    productName: '',
    trackingNumber: '',
    customField: ''
  });

  const templates = [
    {
      id: 1,
      category: '주문 확인',
      title: '주문 접수 안내',
      content: '안녕하세요 {customerName}님,\n\n주문번호 {orderNumber}번 주문이 정상적으로 접수되었습니다.\n상품: {productName}\n\n빠른 시일 내에 발송해드리겠습니다.\n감사합니다.',
      usage: 234,
      lastUsed: '2시간 전'
    },
    {
      id: 2,
      category: '배송 안내',
      title: '발송 완료 안내',
      content: '{customerName}님, 주문하신 상품이 발송되었습니다!\n\n송장번호: {trackingNumber}\n배송조회: https://tracker.delivery\n\n안전하게 전달될 수 있도록 최선을 다하겠습니다.',
      usage: 189,
      lastUsed: '1일 전'
    },
    {
      id: 3,
      category: '재입고',
      title: '재입고 알림',
      content: '기다려주셔서 감사합니다!\n\n{customerName}님께서 관심있어 하신 {productName}이(가) 재입고되었습니다.\n\n수량이 한정되어 있으니 서둘러주세요!',
      usage: 67,
      lastUsed: '3일 전'
    },
    {
      id: 4,
      category: '감사 인사',
      title: '구매 감사 메시지',
      content: '{customerName}님, 구매해주셔서 진심으로 감사드립니다.\n\n저희 상품이 만족스러우셨다면 리뷰 부탁드립니다.\n다음에도 좋은 상품으로 찾아뵙겠습니다.',
      usage: 156,
      lastUsed: '5시간 전'
    },
    {
      id: 5,
      category: '문의 응답',
      title: '문의 답변 템플릿',
      content: '안녕하세요 {customerName}님,\n\n문의 주신 내용에 대해 답변드립니다.\n\n{customField}\n\n추가 문의사항이 있으시면 언제든지 연락주세요.\n감사합니다.',
      usage: 98,
      lastUsed: '1일 전'
    }
  ];

  const messageHistory = [
    { id: 1, recipient: '김민수', template: '주문 접수 안내', sentTime: '2025-01-27 14:30', status: 'delivered' },
    { id: 2, recipient: '이영희', template: '발송 완료 안내', sentTime: '2025-01-27 13:15', status: 'delivered' },
    { id: 3, recipient: '박철수', template: '재입고 알림', sentTime: '2025-01-27 10:20', status: 'read' },
    { id: 4, recipient: '정미라', template: '구매 감사 메시지', sentTime: '2025-01-26 18:45', status: 'delivered' }
  ];

  const categories = ['전체', '주문 확인', '배송 안내', '재입고', '감사 인사', '문의 응답'];
  const [selectedCategory, setSelectedCategory] = useState('전체');

  const filteredTemplates = templates.filter(template => 
    selectedCategory === '전체' || template.category === selectedCategory
  );

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setMessageContent(template.content);
    setActiveTab('compose');
  };

  const processMessage = () => {
    let processed = messageContent;
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      processed = processed.replace(new RegExp(placeholder, 'g'), value || `[${key}]`);
    });
    return processed;
  };

  const handleSend = () => {
    alert('메시지가 발송되었습니다!');
    // 실제 발송 로직
  };

  return (
    <div style={{
      padding: '32px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: '600',
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          고객 메시지
        </h2>
        <p style={{
          fontSize: '14px',
          color: '#6c757d'
        }}>
          고객에게 발송할 메시지 템플릿을 관리하고 발송합니다
        </p>
      </div>

      {/* 탭 네비게이션 */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '1px solid #dee2e6',
        paddingBottom: '0'
      }}>
        {[
          { id: 'templates', label: '템플릿 관리', icon: '📝' },
          { id: 'compose', label: '메시지 작성', icon: '✉️' },
          { id: 'history', label: '발송 내역', icon: '📊' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              color: activeTab === tab.id ? '#2563eb' : '#6c757d',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #2563eb' : '2px solid transparent',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              marginBottom: '-1px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span style={{ fontSize: '16px' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* 템플릿 관리 */}
      {activeTab === 'templates' && (
        <div>
          {/* 카테고리 필터 */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #dee2e6',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  style={{
                    padding: '8px 16px',
                    background: selectedCategory === category ? '#2563eb' : '#ffffff',
                    color: selectedCategory === category ? '#ffffff' : '#495057',
                    border: `1px solid ${selectedCategory === category ? '#2563eb' : '#dee2e6'}`,
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  {category}
                </button>
              ))}
            </div>

            <button
              style={{
                padding: '8px 16px',
                background: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              + 새 템플릿
            </button>
          </div>

          {/* 템플릿 목록 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '16px'
          }}>
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #dee2e6',
                  borderRadius: '12px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => handleTemplateSelect(template)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#2563eb';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#dee2e6';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: '12px'
                }}>
                  <div>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      background: '#e7f3ff',
                      color: '#2563eb',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '500',
                      marginBottom: '8px'
                    }}>
                      {template.category}
                    </span>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', marginTop: '4px' }}>
                      {template.title}
                    </h4>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // 편집 로직
                    }}
                    style={{
                      padding: '4px 8px',
                      background: '#f8f9fa',
                      border: '1px solid #dee2e6',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    편집
                  </button>
                </div>

                <div style={{
                  fontSize: '13px',
                  color: '#6c757d',
                  lineHeight: '1.5',
                  marginBottom: '12px',
                  maxHeight: '60px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {template.content}
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: '#6c757d'
                }}>
                  <span>사용: {template.usage}회</span>
                  <span>최근: {template.lastUsed}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 메시지 작성 */}
      {activeTab === 'compose' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px'
        }}>
          {/* 왼쪽: 변수 입력 */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #dee2e6',
            borderRadius: '16px',
            padding: '24px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '20px'
            }}>
              변수 설정
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {Object.entries(variables).map(([key, value]) => (
                <div key={key}>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    color: '#495057',
                    marginBottom: '6px',
                    fontWeight: '500',
                    textTransform: 'capitalize'
                  }}>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setVariables({...variables, [key]: e.target.value})}
                    placeholder={`{${key}}`}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #dee2e6',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              ))}
            </div>

            {/* 수신자 설정 */}
            <div style={{
              marginTop: '24px',
              paddingTop: '24px',
              borderTop: '1px solid #dee2e6'
            }}>
              <h4 style={{
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '16px'
              }}>
                수신자 설정
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}>
                  <input type="radio" name="recipient" defaultChecked />
                  <span style={{ fontSize: '13px' }}>개별 발송</span>
                </label>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}>
                  <input type="radio" name="recipient" />
                  <span style={{ fontSize: '13px' }}>그룹 발송</span>
                </label>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}>
                  <input type="radio" name="recipient" />
                  <span style={{ fontSize: '13px' }}>전체 발송</span>
                </label>
              </div>
            </div>
          </div>

          {/* 오른쪽: 메시지 미리보기 */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #dee2e6',
            borderRadius: '16px',
            padding: '24px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600'
              }}>
                메시지 미리보기
              </h3>
              <select
                value={selectedTemplate?.id || ''}
                onChange={(e) => {
                  const template = templates.find(t => t.id === parseInt(e.target.value));
                  if (template) handleTemplateSelect(template);
                }}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #dee2e6',
                  borderRadius: '6px',
                  fontSize: '13px',
                  outline: 'none'
                }}
              >
                <option value="">템플릿 선택</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.title}
                  </option>
                ))}
              </select>
            </div>

            <div style={{
              padding: '20px',
              background: '#f8f9fa',
              borderRadius: '12px',
              marginBottom: '20px'
            }}>
              {/* 메시지 편집 영역 */}
              <textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '200px',
                  padding: '12px',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
                placeholder="메시지를 입력하세요..."
              />
            </div>

            {/* 처리된 메시지 미리보기 */}
            <div style={{
              padding: '16px',
              background: '#e7f3ff',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{
                fontSize: '12px',
                color: '#2563eb',
                fontWeight: '500',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M21 6H19V15H6V17C6 17.55 6.45 18 7 18H18L22 22V7C22 6.45 21.55 6 21 6ZM17 12V3C17 2.45 16.55 2 16 2H3C2.45 2 2 2.45 2 3V17L6 13H16C16.55 13 17 12.55 17 12Z" fill="#2563eb"/>
                </svg>
                실제 발송될 메시지
              </div>
              <div style={{
                fontSize: '14px',
                color: '#212529',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap'
              }}>
                {processMessage()}
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#ffffff',
                  color: '#2563eb',
                  border: '1px solid #2563eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                테스트 발송
              </button>
              <button
                onClick={handleSend}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                메시지 발송
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 발송 내역 */}
      {activeTab === 'history' && (
        <div style={{
          background: '#ffffff',
          border: '1px solid #dee2e6',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#495057' }}>수신자</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#495057' }}>템플릿</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#495057' }}>발송 시간</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#495057' }}>상태</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#495057' }}>작업</th>
              </tr>
            </thead>
            <tbody>
              {messageHistory.map(history => (
                <tr key={history.id} style={{ borderBottom: '1px solid #f1f3f5' }}>
                  <td style={{ padding: '12px', fontSize: '14px' }}>{history.recipient}</td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>{history.template}</td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>{history.sentTime}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 8px',
                      background: history.status === 'read' ? '#dcfce7' : '#dbeafe',
                      color: history.status === 'read' ? '#10b981' : '#2563eb',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}>
                      {history.status === 'read' ? '읽음' : '전달됨'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button
                      style={{
                        padding: '6px 12px',
                        background: '#f8f9fa',
                        border: '1px solid #dee2e6',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      재발송
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CustomerMessage;