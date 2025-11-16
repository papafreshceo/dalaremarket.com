'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import TierBadge from '@/components/TierBadge';
import './chatbot.css';

// 탭 타입
type TabType = 'messages' | 'users' | 'ai'

// 타입 정의
interface AIMessage {
  text: string;
  isUser: boolean;
  time: string;
}

interface ChatMessage {
  id: string
  thread_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
  sender?: User
}

interface Thread {
  id: string
  participant_1: string
  participant_2: string
  last_message_content?: string
  last_message_at?: string
  created_at: string
  partner?: User
  unread_count: number
}

interface User {
  id: string
  email: string
  name?: string
  profile_name?: string
  primary_organization_id?: string
  role?: string
  organizations?: {
    tier: string
  } | null
}

interface QuickReply {
  label: string;
  message: string;
}

interface FAQ {
  question: string;
  keywords: string[];
  answer: string;
}

interface ChatbotSettings {
  is_enabled: boolean;
  position: string;
  theme_color: string;
  welcome_message: string;
  quick_replies: QuickReply[];
  ai_enabled: boolean;
  daily_ai_limit: number;
  faqs: FAQ[];
  company_name: string;
  company_phone: string;
  business_hours: string;
  offline_message: string;
  error_message: string;
}

interface ApiUsage {
  today: number;
  date: string;
  cacheHits: number;
  keywordMatches: number;
}

export default function AgriChatbot() {
  const supabase = createClient();

  // 탭 및 UI state
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('messages');

  // AI 챗봇 state
  const [aiMessages, setAIMessages] = useState<AIMessage[]>([]);
  const [aiInput, setAIInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [settings, setSettings] = useState<ChatbotSettings | null>(null);
  const [apiUsage, setApiUsage] = useState<ApiUsage>({
    today: 0,
    date: new Date().toDateString(),
    cacheHits: 0,
    keywordMatches: 0
  });

  // 메시징 state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageCache = useRef(new Map<string, string>());
  const channelRef = useRef<any>(null);

  // 메시지 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [aiMessages, chatMessages]);

  // 사용자 정보 가져오기
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
    }
    getUser()
  }, [])

  // 챗봇 설정 로드
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('chatbot_settings')
          .select('*')
          .limit(1);

        if (error) {
          return;
        }

        if (data && data.length > 0) {
          setSettings(data[0]);
        }
      } catch (error) {
        console.error('❌ 챗봇 설정 로드 실패:', error);
      }
    };

    loadSettings();
  }, []);

  // 대화방 목록 조회
  const fetchThreads = async () => {
    if (!currentUser) return

    try {
      const response = await fetch('/api/messages')
      const data = await response.json()
      if (data.success) {
        setThreads(data.threads)
        const totalUnread = data.threads.reduce((sum: number, thread: Thread) => {
          return sum + (thread.unread_count || 0)
        }, 0)
        setUnreadCount(totalUnread)
      }
    } catch (error) {
      console.error('대화방 목록 조회 실패:', error)
    }
  }

  // 메시지 조회
  const fetchChatMessages = async (threadId: string) => {
    try {
      const response = await fetch(`/api/messages/${threadId}`)
      const data = await response.json()

      if (data.success) {
        setChatMessages(data.messages)
      }
    } catch (error) {
      console.error('메시지 조회 실패:', error)
    }
  }

  // 대화방 선택
  const selectThread = (thread: Thread) => {
    setSelectedThread(thread)
    setChatMessages([])
    fetchChatMessages(thread.id)
  }

  // 메시지 전송
  const sendChatMessage = async () => {
    if (!newMessage.trim() || !selectedThread || sending) return

    const messageContent = newMessage.trim()
    setNewMessage('')
    setSending(true)

    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      thread_id: selectedThread.id,
      sender_id: currentUser?.id || '',
      content: messageContent,
      created_at: new Date().toISOString(),
      is_read: false,
    }
    setChatMessages(prev => [...prev, optimisticMessage])

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver_id: selectedThread.partner?.id,
          content: messageContent,
        }),
      })

      const data = await response.json()
      if (data.success) {
        if (selectedThread.id === 'new' && data.thread_id) {
          const updatedThread = {
            ...selectedThread,
            id: data.thread_id
          }
          setSelectedThread(updatedThread)
          fetchThreads()
        } else {
          setChatMessages(prev => prev.filter(m => m.id !== optimisticMessage.id))
          fetchThreads()
        }
      } else {
        setChatMessages(prev => prev.filter(m => m.id !== optimisticMessage.id))
        setNewMessage(messageContent)
      }
    } catch (error) {
      console.error('메시지 전송 실패:', error)
      setChatMessages(prev => prev.filter(m => m.id !== optimisticMessage.id))
      setNewMessage(messageContent)
    } finally {
      setSending(false)
    }
  }

  // 사용자 목록 조회
  const fetchUsers = async () => {
    if (!currentUser) return

    try {
      const response = await fetch('/api/user/list')
      const data = await response.json()
      if (data.success) {
        const regularUsers = data.users.filter((u: any) =>
          u.role !== 'admin' && u.role !== 'super_admin' && u.role !== 'employee'
        )
        setUsers(regularUsers)
      }
    } catch (error) {
      console.error('사용자 목록 조회 실패:', error)
    }
  }

  // 새 대화 시작
  const startNewConversation = async (receiverId: string) => {
    setSearchQuery('')
    setActiveTab('messages')

    const existingThread = threads.find(t => t.partner?.id === receiverId)
    if (existingThread) {
      selectThread(existingThread)
      return
    }

    const selectedUser = users.find(u => u.id === receiverId)
    if (selectedUser) {
      setSelectedThread({
        id: 'new',
        participant_1: '',
        participant_2: receiverId,
        created_at: new Date().toISOString(),
        partner: selectedUser,
        unread_count: 0
      })
      setChatMessages([])
    }
  }

  // 초기 대화방 조회
  useEffect(() => {
    if (currentUser && isOpen && activeTab === 'messages') {
      fetchThreads()
    }
  }, [currentUser, isOpen, activeTab])

  // AI 챗봇 - 키워드 매칭
  const handleKeywordMatch = (message: string): string | null => {
    if (!settings) return null

    const msg = message.toLowerCase()

    for (const faq of settings.faqs) {
      if (faq.keywords.some(keyword => msg.includes(keyword))) {
        return faq.answer
      }
    }

    if (msg.includes('회사') || msg.includes(settings.company_name) || msg.includes('소개')) {
      return `${settings.company_name} B2B는 신선한 농산물을 도매가로 공급하는 B2B 플랫폼입니다.\n\n문의: ${settings.company_phone}\n영업시간: ${settings.business_hours}`
    }

    if (msg.match(/^(안녕|하이|hi|hello|헬로)/)) {
      return `안녕하세요! ${settings.company_name} B2B입니다.\n상품 가격, 시즌, 배송 등 무엇이든 물어보세요!`
    }

    return null
  }

  // AI 챗봇 - AI API 호출
  const handleAIQuery = async (message: string): Promise<string> => {
    if (!settings) {
      return settings?.error_message || '죄송합니다. 일시적인 오류가 발생했습니다.'
    }

    if (apiUsage.today >= settings.daily_ai_limit) {
      return `죄송합니다. 오늘 AI 상담 한도를 초과했습니다.\n기본 문의는 ${settings.company_phone}로 전화주세요.`
    }

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      })

      if (!response.ok) {
        throw new Error('API 호출 실패')
      }

      const data = await response.json()
      const newUsage = { ...apiUsage, today: apiUsage.today + 1 }
      setApiUsage(newUsage)
      localStorage.setItem('apiUsage', JSON.stringify(newUsage))

      return data.response
    } catch (error) {
      console.error('❌ AI API 호출 오류:', error)
      return settings.error_message + `\n기본 문의는 ${settings.company_phone}로 전화주세요.`
    }
  }

  // AI 챗봇 - 메시지 처리
  const processAIMessage = async (message: string): Promise<string> => {
    if (messageCache.current.has(message)) {
      return messageCache.current.get(message)!
    }

    let response = handleKeywordMatch(message)
    if (response) {
      messageCache.current.set(message, response)
      return response
    }

    response = await handleAIQuery(message)
    messageCache.current.set(message, response)
    return response
  }

  // AI 챗봇 - 메시지 전송
  const sendAIMessage = async () => {
    if (!aiInput.trim()) return

    const userMessage: AIMessage = {
      text: aiInput,
      isUser: true,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    }

    const newMessages = [...aiMessages, userMessage]
    setAIMessages(newMessages)
    setAIInput('')
    setIsTyping(true)

    try {
      const response = await processAIMessage(aiInput)
      await new Promise(resolve => setTimeout(resolve, 500))

      const botMessage: AIMessage = {
        text: response,
        isUser: false,
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      }

      setAIMessages([...newMessages, botMessage])
    } catch (error) {
      console.error('메시지 처리 오류:', error)
      const errorMessage: AIMessage = {
        text: settings?.error_message || '죄송합니다. 오류가 발생했습니다.',
        isUser: false,
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      }
      setAIMessages([...newMessages, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  // 환영 메시지
  useEffect(() => {
    if (aiMessages.length === 0 && settings && activeTab === 'ai') {
      const welcomeMsg: AIMessage = {
        text: settings.welcome_message,
        isUser: false,
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      }
      setAIMessages([welcomeMsg])
    }
  }, [settings, activeTab])

  // 헬퍼 함수
  const getDisplayName = (user?: User) => {
    if (!user) return '알 수 없음'
    return user.profile_name || '사용자'
  }

  const getTierBadge = (user?: User) => {
    const tier = user?.organizations?.tier?.toLowerCase() as 'light' | 'standard' | 'advance' | 'elite' | 'legend' | undefined
    if (!tier) return null

    const validTiers = ['light', 'standard', 'advance', 'elite', 'legend']
    if (!validTiers.includes(tier)) return null

    return <TierBadge tier={tier} iconOnly glow={0} />
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // 설정이 로드되지 않았거나 비활성화된 경우 렌더링하지 않음
  if (!settings || !settings.is_enabled) {
    return null
  }

  return (
    <>
      {/* 챗봇 토글 버튼 */}
      <button
        className="chatbot-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="챗봇 열기"
        style={{
          background: `linear-gradient(135deg, ${settings.theme_color} 0%, ${settings.theme_color}dd 100%)`
        }}
      >
        <svg viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            background: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 'bold'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* 챗봇 창 */}
      {isOpen && (
        <div className="chatbot-window">
          <div
            className="chatbot-header"
            style={{
              background: `linear-gradient(135deg, ${settings.theme_color} 0%, ${settings.theme_color}dd 100%)`
            }}
          >
            <h3>{settings.company_name} 상담</h3>
            <button onClick={() => setIsOpen(false)} aria-label="닫기">&times;</button>
          </div>

          {/* 탭 */}
          {!selectedThread && (
            <div style={{
              display: 'flex',
              borderBottom: '1px solid #e5e7eb',
              background: 'white'
            }}>
              <button
                onClick={() => setActiveTab('messages')}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: 'none',
                  background: 'transparent',
                  color: activeTab === 'messages' ? settings.theme_color : '#6b7280',
                  borderBottom: activeTab === 'messages' ? `2px solid ${settings.theme_color}` : 'none',
                  cursor: 'pointer'
                }}
              >
                대화
              </button>
              <button
                onClick={() => {
                  setActiveTab('users')
                  fetchUsers()
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: 'none',
                  background: 'transparent',
                  color: activeTab === 'users' ? settings.theme_color : '#6b7280',
                  borderBottom: activeTab === 'users' ? `2px solid ${settings.theme_color}` : 'none',
                  cursor: 'pointer'
                }}
              >
                사용자
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: 'none',
                  background: 'transparent',
                  color: activeTab === 'ai' ? settings.theme_color : '#6b7280',
                  borderBottom: activeTab === 'ai' ? `2px solid ${settings.theme_color}` : 'none',
                  cursor: 'pointer'
                }}
              >
                AI상담봇
              </button>
            </div>
          )}

          {/* 컨텐츠 영역 */}
          {selectedThread ? (
            /* 대화창 */
            <>
              <div style={{ padding: '15px', borderBottom: '1px solid #e5e7eb', background: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    onClick={() => setSelectedThread(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '20px',
                      color: '#6b7280'
                    }}
                  >
                    ←
                  </button>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    background: `linear-gradient(135deg, ${settings.theme_color}, #22c55e)`,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}>
                    {getDisplayName(selectedThread.partner).charAt(0).toUpperCase()}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {getTierBadge(selectedThread.partner)}
                    <span style={{ fontWeight: '600', fontSize: '14px' }}>
                      {getDisplayName(selectedThread.partner)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="chatbot-messages">
                {chatMessages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
                    <p style={{ fontSize: '14px' }}>메시지를 보내보세요!</p>
                  </div>
                ) : (
                  chatMessages.map((message) => {
                    const isMine = message.sender_id !== selectedThread.partner?.id
                    return (
                      <div
                        key={message.id}
                        className={`message ${isMine ? 'user' : 'bot'}`}
                      >
                        <div
                          className="message-content"
                          style={isMine ? { background: settings.theme_color } : {}}
                        >
                          {message.content}
                        </div>
                        <div className="message-time">{formatTime(message.created_at)}</div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="chatbot-input-area">
                <input
                  type="text"
                  className="chatbot-input"
                  placeholder="메시지를 입력하세요..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  disabled={sending}
                  style={{
                    borderColor: newMessage ? settings.theme_color : undefined
                  }}
                />
                <button
                  className="chatbot-send"
                  onClick={sendChatMessage}
                  disabled={!newMessage.trim() || sending}
                  aria-label="전송"
                  style={{
                    background: `linear-gradient(135deg, ${settings.theme_color} 0%, ${settings.theme_color}dd 100%)`
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                </button>
              </div>
            </>
          ) : activeTab === 'messages' ? (
            /* 대화 탭 */
            <div style={{ flex: 1, overflow: 'auto', background: '#f9fafb' }}>
              {threads.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 20px', color: '#9ca3af' }}>
                  <p style={{ fontSize: '14px', marginBottom: '10px' }}>대화 내역이 없습니다</p>
                  <button
                    onClick={() => {
                      setActiveTab('users')
                      fetchUsers()
                    }}
                    style={{
                      padding: '8px 16px',
                      background: `linear-gradient(135deg, ${settings.theme_color}, #22c55e)`,
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    새 메시지 시작하기
                  </button>
                </div>
              ) : (
                threads.map((thread) => (
                  <div
                    key={thread.id}
                    onClick={() => selectThread(thread)}
                    style={{
                      padding: '15px',
                      borderBottom: '1px solid #e5e7eb',
                      cursor: 'pointer',
                      background: 'white',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        background: `linear-gradient(135deg, ${settings.theme_color}, #22c55e)`,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        flexShrink: 0
                      }}>
                        {getDisplayName(thread.partner).charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {getTierBadge(thread.partner)}
                            <span style={{ fontWeight: '600', fontSize: '13px', color: '#111827' }}>
                              {getDisplayName(thread.partner)}
                            </span>
                          </div>
                          {thread.last_message_at && (
                            <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                              {formatTime(thread.last_message_at)}
                            </span>
                          )}
                        </div>
                        {thread.last_message_content && (
                          <p style={{ fontSize: '12px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                            {thread.last_message_content}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : activeTab === 'users' ? (
            /* 사용자 탭 */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
              <div style={{ padding: '15px', background: 'white', borderBottom: '1px solid #e5e7eb' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="이름으로 검색..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = settings.theme_color}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>
              <div style={{ flex: 1, overflow: 'auto' }}>
                {users
                  .filter(user => {
                    if (!searchQuery.trim()) return true
                    const query = searchQuery.toLowerCase().trim()
                    return user.profile_name?.toLowerCase().includes(query)
                  })
                  .map(user => (
                    <div
                      key={user.id}
                      onClick={() => startNewConversation(user.id)}
                      style={{
                        padding: '15px',
                        borderBottom: '1px solid #e5e7eb',
                        cursor: 'pointer',
                        background: 'white',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {!user.organizations?.tier && (
                          <div style={{
                            width: '36px',
                            height: '36px',
                            background: `linear-gradient(135deg, ${settings.theme_color}, #22c55e)`,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '13px'
                          }}>
                            {getDisplayName(user).charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {getTierBadge(user)}
                          <span style={{ fontWeight: '600', fontSize: '13px', color: '#111827' }}>
                            {getDisplayName(user)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                {users.filter(user => {
                  if (!searchQuery.trim()) return true
                  const query = searchQuery.toLowerCase().trim()
                  return user.profile_name?.toLowerCase().includes(query)
                }).length === 0 && (
                  <div style={{ textAlign: 'center', padding: '80px 20px', color: '#9ca3af' }}>
                    <p style={{ fontSize: '14px' }}>검색 결과가 없습니다</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* AI 상담봇 탭 */
            <>
              <div className="chatbot-messages">
                {aiMessages.map((msg, index) => (
                  <div key={index} className={`message ${msg.isUser ? 'user' : 'bot'}`}>
                    <div
                      className="message-content"
                      style={msg.isUser ? { background: settings.theme_color } : {}}
                    >
                      {msg.text}
                    </div>
                    <div className="message-time">{msg.time}</div>
                  </div>
                ))}
                {isTyping && (
                  <div className="typing-indicator">
                    <span style={{ background: settings.theme_color }}></span>
                    <span style={{ background: settings.theme_color }}></span>
                    <span style={{ background: settings.theme_color }}></span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {settings.quick_replies && settings.quick_replies.length > 0 && (
                <div className="quick-buttons">
                  {settings.quick_replies.map((reply, index) => (
                    <button
                      key={index}
                      className="quick-button"
                      onClick={() => {
                        setAIInput(reply.message)
                        setTimeout(() => sendAIMessage(), 100)
                      }}
                      style={{
                        borderColor: settings.theme_color,
                        color: settings.theme_color
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = settings.theme_color
                        e.currentTarget.style.color = 'white'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'white'
                        e.currentTarget.style.color = settings.theme_color
                      }}
                    >
                      {reply.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="chatbot-input-area">
                <input
                  type="text"
                  className="chatbot-input"
                  placeholder="메시지를 입력하세요..."
                  value={aiInput}
                  onChange={(e) => setAIInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendAIMessage()}
                  autoComplete="off"
                  style={{
                    borderColor: aiInput ? settings.theme_color : undefined
                  }}
                />
                <button
                  className="chatbot-send"
                  onClick={sendAIMessage}
                  disabled={isTyping}
                  aria-label="전송"
                  style={{
                    background: `linear-gradient(135deg, ${settings.theme_color} 0%, ${settings.theme_color}dd 100%)`
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
