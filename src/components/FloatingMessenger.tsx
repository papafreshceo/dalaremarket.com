'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface User {
  id: string
  email: string
  name?: string
  nickname?: string
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

export default function FloatingMessenger() {
  const supabase = createClient()
  const [isOpen, setIsOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [threads, setThreads] = useState<Thread[]>([])
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [showUserList, setShowUserList] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastMessageTimeRef = useRef<string>('')

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

  // 메시지 조회
  const fetchMessages = async (threadId: string, isPolling = false) => {
    try {
      const url = isPolling && lastMessageTimeRef.current
        ? `/api/messages/${threadId}?after=${lastMessageTimeRef.current}`
        : `/api/messages/${threadId}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        if (isPolling && data.messages.length > 0) {
          setMessages(prev => [...prev, ...data.messages])
        } else if (!isPolling) {
          setMessages(data.messages)
        }

        if (data.messages.length > 0) {
          const lastMsg = data.messages[data.messages.length - 1]
          lastMessageTimeRef.current = lastMsg.created_at
        }
      }
    } catch (error) {
      console.error('메시지 조회 실패:', error)
    }
  }

  // 대화방 선택
  const selectThread = (thread: Thread) => {
    setSelectedThread(thread)
    setMessages([])
    lastMessageTimeRef.current = ''
    setShowUserList(false)

    fetchMessages(thread.id, false)

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }
    pollingIntervalRef.current = setInterval(() => {
      fetchMessages(thread.id, true)
    }, 3000)
  }

  // 메시지 전송
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedThread || sending) return

    setSending(true)
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver_id: selectedThread.partner?.id,
          content: newMessage.trim(),
        }),
      })

      const data = await response.json()
      if (data.success) {
        setNewMessage('')
        fetchMessages(selectedThread.id, true)
        fetchThreads()
      }
    } catch (error) {
      console.error('메시지 전송 실패:', error)
    } finally {
      setSending(false)
    }
  }

  // 사용자 목록 조회
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/user/list')
      const data = await response.json()
      if (data.success) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error('사용자 목록 조회 실패:', error)
    }
  }

  // 새 대화 시작
  const startNewConversation = async (receiverId: string) => {
    setShowUserList(false)
    setSearchQuery('')

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

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

  const getDisplayName = (user?: User) => {
    if (!user) return '알 수 없음'
    return user.nickname || user.name || user.email?.split('@')[0] || '사용자'
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
        className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all z-50 flex items-center justify-center"
        style={{ zIndex: 9999 }}
      >
        {isOpen ? (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </>
        )}
      </button>

      {/* 플로팅 메신저 창 */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50"
          style={{ zIndex: 9999 }}
        >
          {/* 헤더 */}
          <div className="p-4 bg-blue-600 text-white rounded-t-lg flex items-center justify-between">
            <h3 className="font-bold text-lg">메시지</h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  fetchUsers()
                  setShowUserList(true)
                  setSelectedThread(null)
                }}
                className="p-1 hover:bg-blue-700 rounded"
                title="새 메시지"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              {selectedThread && (
                <button
                  onClick={() => {
                    setSelectedThread(null)
                    setShowUserList(false)
                    if (pollingIntervalRef.current) {
                      clearInterval(pollingIntervalRef.current)
                    }
                  }}
                  className="p-1 hover:bg-blue-700 rounded"
                  title="뒤로 가기"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* 본문 */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {showUserList ? (
              /* 사용자 목록 */
              <div className="flex-1 flex flex-col">
                <div className="p-3 border-b">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="사용자 검색..."
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div className="flex-1 overflow-y-auto">
                  {users
                    .filter(user => {
                      const query = searchQuery.toLowerCase()
                      return (
                        user.email?.toLowerCase().includes(query) ||
                        user.name?.toLowerCase().includes(query) ||
                        user.nickname?.toLowerCase().includes(query)
                      )
                    })
                    .map(user => (
                      <div
                        key={user.id}
                        onClick={() => startNewConversation(user.id)}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b"
                      >
                        <div className="font-semibold text-sm text-gray-900">
                          {getDisplayName(user)}
                        </div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    ))}
                </div>
              </div>
            ) : selectedThread ? (
              /* 대화창 */
              <>
                <div className="p-3 border-b bg-gray-50">
                  <div className="font-semibold text-sm">
                    {getDisplayName(selectedThread.partner)}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {messages.map((message) => {
                    const isMine = message.sender_id !== selectedThread.partner?.id
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${
                            isMine
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          <p className="break-words">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isMine ? 'text-blue-100' : 'text-gray-500'
                            }`}
                          >
                            {formatTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-3 border-t">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="메시지를 입력하세요..."
                      className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      disabled={sending}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 text-sm"
                    >
                      {sending ? '...' : '전송'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* 대화방 목록 */
              <div className="flex-1 overflow-y-auto">
                {threads.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-sm">
                    <p>대화 내역이 없습니다</p>
                    <button
                      onClick={() => {
                        fetchUsers()
                        setShowUserList(true)
                      }}
                      className="mt-3 text-blue-600 hover:underline"
                    >
                      새 메시지 시작하기
                    </button>
                  </div>
                ) : (
                  threads.map((thread) => (
                    <div
                      key={thread.id}
                      onClick={() => selectThread(thread)}
                      className="p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm text-gray-900">
                          {getDisplayName(thread.partner)}
                        </span>
                        {thread.last_message_at && (
                          <span className="text-xs text-gray-500">
                            {formatTime(thread.last_message_at)}
                          </span>
                        )}
                      </div>
                      {thread.last_message_content && (
                        <p className="text-xs text-gray-600 truncate">
                          {thread.last_message_content}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
