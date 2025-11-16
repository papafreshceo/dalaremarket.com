'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import TierBadge from '@/components/TierBadge'
import { Send } from 'lucide-react'

interface User {
  id: string
  email: string
  name?: string
  profile_name?: string
  primary_organization_id?: string
  organizations?: {
    tier: string
  } | null
}

interface Message {
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

type TabType = 'chats' | 'users' | 'admin'

export default function FloatingMessenger() {
  const supabase = createClient()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('chats')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [threads, setThreads] = useState<Thread[]>([])
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [adminUsers, setAdminUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<any>(null)

  // 로그인 사용자 확인
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
    }
    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // 대화방 목록 조회
  const fetchThreads = async () => {
    if (!currentUser) return

    try {
      const response = await fetch('/api/messages')
      const data = await response.json()
      if (data.success) {
        setThreads(data.threads)

        // 읽지 않은 메시지 총 개수 계산
        const totalUnread = data.threads.reduce((sum: number, thread: Thread) => {
          return sum + (thread.unread_count || 0)
        }, 0)
        setUnreadCount(totalUnread)
      }
    } catch (error) {
      console.error('대화방 목록 조회 실패:', error)
    }
  }

  // 메시지 조회 (초기 로드용)
  const fetchMessages = async (threadId: string) => {
    try {
      const response = await fetch(`/api/messages/${threadId}`)
      const data = await response.json()

      if (data.success) {
        setMessages(data.messages)
      }
    } catch (error) {
      console.error('메시지 조회 실패:', error)
    }
  }

  // 대화방 선택
  const selectThread = (thread: Thread) => {
    setSelectedThread(thread)
    setMessages([])
    setActiveTab('chats')

    // 초기 메시지 로드
    fetchMessages(thread.id)
  }

  // 메시지 전송
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedThread || sending) return

    const messageContent = newMessage.trim()
    setNewMessage('') // 즉시 입력창 비우기
    setSending(true)

    // 낙관적 업데이트: 전송 전에 UI에 먼저 표시
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      thread_id: selectedThread.id,
      sender_id: currentUser?.id || '',
      content: messageContent,
      created_at: new Date().toISOString(),
      is_read: false,
      read_at: null
    }
    setMessages(prev => [...prev, optimisticMessage])

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
        // 새 대화방인 경우 실제 thread_id로 업데이트
        if (selectedThread.id === 'new' && data.thread_id) {
          const updatedThread = {
            ...selectedThread,
            id: data.thread_id
          }
          setSelectedThread(updatedThread)
          fetchThreads()
        } else {
          // 낙관적 메시지를 실제 메시지로 교체 (Realtime으로 받을 것임)
          setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id))
          fetchThreads()
        }
      } else {
        // 실패 시 낙관적 메시지 제거
        setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id))
        setNewMessage(messageContent) // 입력창에 다시 복원
      }
    } catch (error) {
      console.error('메시지 전송 실패:', error)
      // 실패 시 낙관적 메시지 제거
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id))
      setNewMessage(messageContent) // 입력창에 다시 복원
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
        // 관리자와 일반 사용자 분리
        const admins = data.users.filter((u: any) =>
          u.role === 'admin' || u.role === 'super_admin' || u.role === 'employee'
        )
        const regularUsers = data.users.filter((u: any) =>
          u.role !== 'admin' && u.role !== 'super_admin' && u.role !== 'employee'
        )

        setAdminUsers(admins)
        setUsers(regularUsers)
      }
    } catch (error) {
      console.error('사용자 목록 조회 실패:', error)
    }
  }

  // 새 대화 시작
  const startNewConversation = async (receiverId: string) => {
    setSearchQuery('')
    setActiveTab('chats')

    const existingThread = threads.find(t => t.partner?.id === receiverId)
    if (existingThread) {
      selectThread(existingThread)
      return
    }

    const allUsers = [...users, ...adminUsers]
    const selectedUser = allUsers.find(u => u.id === receiverId)
    if (selectedUser) {
      setSelectedThread({
        id: 'new',
        participant_1: '',
        participant_2: receiverId,
        created_at: new Date().toISOString(),
        partner: selectedUser,
        unread_count: 0
      })
      setMessages([])
    }
  }

  // 스크롤 아래로
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (currentUser && isOpen) {
      fetchThreads()
    }
  }, [currentUser, isOpen])

  useEffect(() => {
    if (currentUser) {
      fetchThreads()
      const interval = setInterval(fetchThreads, 30000)
      return () => clearInterval(interval)
    }
  }, [currentUser])

  // Realtime 구독: 선택된 대화방의 새 메시지 실시간 수신
  useEffect(() => {
    if (!selectedThread || !currentUser || selectedThread.id === 'new') return

    // 기존 채널 구독 해제
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    // 새 채널 구독
    const channel = supabase
      .channel(`thread:${selectedThread.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${selectedThread.id}`
        },
        async (payload) => {
          console.log('📨 새 메시지 실시간 수신:', payload)

          // sender 정보 가져오기
          const { data: senderData } = await supabase
            .from('users')
            .select('id, email, name, profile_name')
            .eq('id', payload.new.sender_id)
            .single()

          const newMessage = {
            ...payload.new,
            sender: senderData
          } as Message

          setMessages(prev => {
            // 중복 방지 (낙관적 업데이트 메시지 제거)
            const filtered = prev.filter(m => !m.id.toString().startsWith('temp-'))
            // 이미 존재하는 메시지인지 확인
            if (filtered.some(m => m.id === newMessage.id)) {
              return prev
            }
            return [...filtered, newMessage]
          })

          // 대화방 목록 갱신
          fetchThreads()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${selectedThread.id}`
        },
        (payload) => {
          console.log('✓ 메시지 읽음 표시 업데이트:', payload)

          // 읽음 표시 업데이트
          setMessages(prev => prev.map(msg =>
            msg.id === payload.new.id
              ? { ...msg, is_read: payload.new.is_read, read_at: payload.new.read_at }
              : msg
          ))
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedThread, currentUser])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [])

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

  if (!currentUser) return null

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-12 right-4 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 z-50 flex items-center justify-center group"
        style={{ zIndex: 9999 }}
      >
        <div className="flex items-center justify-center">
          <Send className="w-5 h-5 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
        </div>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse border-2 border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 플로팅 메신저 창 */}
      {isOpen && (
        <div
          className="fixed bottom-28 right-4 w-[360px] h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-gray-200 animate-in slide-in-from-bottom-4 fade-in duration-200"
          style={{ zIndex: 9999 }}
        >
          {/* 헤더 */}
          <div className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
              <h3 className="font-semibold text-base">메시지</h3>
            </div>
            <div className="flex gap-1">
              {selectedThread && (
                <button
                  onClick={() => {
                    setSelectedThread(null)
                  }}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  title="뒤로 가기"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                title="닫기"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* 탭 */}
          {!selectedThread && (
            <div className="flex border-b border-gray-200 bg-white">
              <button
                onClick={() => setActiveTab('chats')}
                className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === 'chats'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                채팅
              </button>
              <button
                onClick={() => {
                  setActiveTab('users')
                  fetchUsers()
                }}
                className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === 'users'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                사용자
              </button>
              <button
                onClick={() => {
                  setActiveTab('admin')
                  fetchUsers()
                }}
                className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === 'admin'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                관리자
              </button>
            </div>
          )}

          {/* 본문 */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {selectedThread ? (
              /* 대화창 */
              <>
                <div className="px-4 py-3 border-b bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {getDisplayName(selectedThread.partner).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex items-center gap-2">
                      {getTierBadge(selectedThread.partner)}
                      <span className="font-semibold text-gray-900">
                        {getDisplayName(selectedThread.partner)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <svg className="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p className="text-sm">메시지를 보내보세요!</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isMine = message.sender_id !== selectedThread.partner?.id
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                              isMine
                                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md'
                                : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                            }`}
                          >
                            <p className="break-words leading-relaxed">{message.content}</p>
                            <p
                              className={`text-xs mt-1.5 ${
                                isMine ? 'text-blue-100' : 'text-gray-400'
                              }`}
                            >
                              {formatTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-4 bg-white border-t">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="메시지를 입력하세요..."
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      disabled={sending}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-sm text-sm font-medium"
                    >
                      {sending ? '...' : '전송'}
                    </button>
                  </div>
                </div>
              </>
            ) : activeTab === 'chats' ? (
              /* 채팅 탭 - 대화방 목록 */
              <div className="flex-1 overflow-y-auto bg-gray-50">
                {threads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
                    <svg className="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <p className="text-sm mb-2">대화 내역이 없습니다</p>
                    <button
                      onClick={() => {
                        setActiveTab('users')
                        fetchUsers()
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all text-xs font-medium shadow-sm"
                    >
                      새 메시지 시작하기
                    </button>
                  </div>
                ) : (
                  threads.map((thread) => (
                    <div
                      key={thread.id}
                      onClick={() => selectThread(thread)}
                      className="px-3 py-2.5 border-b border-gray-100 cursor-pointer hover:bg-white transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-sm">
                          {getDisplayName(thread.partner).charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <div className="flex items-center gap-1.5">
                              {getTierBadge(thread.partner)}
                              <span className="font-semibold text-xs text-gray-900 group-hover:text-blue-600 transition-colors">
                                {getDisplayName(thread.partner)}
                              </span>
                            </div>
                            {thread.last_message_at && (
                              <span className="text-[10px] text-gray-400 ml-2">
                                {formatTime(thread.last_message_at)}
                              </span>
                            )}
                          </div>
                          {thread.last_message_content && (
                            <p className="text-[11px] text-gray-500 truncate">
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
              <div className="flex-1 flex flex-col bg-gray-50">
                <div className="p-3 bg-white border-b">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="이름으로 검색..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                  />
                </div>
                <div className="flex-1 overflow-y-auto">
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
                        className="px-3 py-2.5 hover:bg-white cursor-pointer border-b border-gray-100 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          {!user.organizations?.tier && (
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                              {getDisplayName(user).charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0 flex items-center gap-1.5">
                            {getTierBadge(user)}
                            <span className="font-semibold text-xs text-gray-900 group-hover:text-blue-600 transition-colors">
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
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                      <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-xs">검색 결과가 없습니다</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* 관리자 탭 */
              <div className="flex-1 flex flex-col bg-gray-50">
                <div className="p-3 bg-white border-b">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="이름으로 검색..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                  />
                </div>
                <div className="flex-1 overflow-y-auto">
                  {adminUsers
                    .filter(user => {
                      if (!searchQuery.trim()) return true
                      const query = searchQuery.toLowerCase().trim()
                      return user.profile_name?.toLowerCase().includes(query)
                    })
                    .map(user => (
                      <div
                        key={user.id}
                        onClick={() => startNewConversation(user.id)}
                        className="px-3 py-2.5 hover:bg-white cursor-pointer border-b border-gray-100 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                            {getDisplayName(user).charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-xs text-gray-900 group-hover:text-purple-600 transition-colors">
                              {getDisplayName(user)}
                            </span>
                            <span className="ml-1.5 text-[10px] text-purple-600">관리자</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  {adminUsers.filter(user => {
                    if (!searchQuery.trim()) return true
                    const query = searchQuery.toLowerCase().trim()
                    return user.profile_name?.toLowerCase().includes(query)
                  }).length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                      <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <p className="text-xs">검색 결과가 없습니다</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
