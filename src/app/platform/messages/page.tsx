'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'

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

export default function MessagesPage() {
  const searchParams = useSearchParams()
  const initialThreadId = searchParams?.get('threadId')

  const [threads, setThreads] = useState<Thread[]>([])
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastMessageTimeRef = useRef<string>('')

  // 대화방 목록 조회
  const fetchThreads = async () => {
    try {
      const response = await fetch('/api/messages')
      const data = await response.json()
      if (data.success) {
        setThreads(data.threads)

        // URL에 threadId가 있으면 해당 대화방 자동 선택
        if (initialThreadId && !selectedThread) {
          const thread = data.threads.find((t: Thread) => t.id === initialThreadId)
          if (thread) {
            selectThread(thread)
          }
        }
      }
    } catch (error) {
      console.error('대화방 목록 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 메시지 조회 (폴링용)
  const fetchMessages = async (threadId: string, isPolling = false) => {
    try {
      const url = isPolling && lastMessageTimeRef.current
        ? `/api/messages/${threadId}?after=${lastMessageTimeRef.current}`
        : `/api/messages/${threadId}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        if (isPolling && data.messages.length > 0) {
          // 폴링: 새 메시지만 추가
          setMessages(prev => [...prev, ...data.messages])
        } else if (!isPolling) {
          // 초기 로드: 전체 교체
          setMessages(data.messages)
        }

        // 마지막 메시지 시간 업데이트
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

    // 초기 메시지 로드
    fetchMessages(thread.id, false)

    // 폴링 시작 (3초마다)
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
        // 즉시 새 메시지 조회
        fetchMessages(selectedThread.id, true)
        fetchThreads() // 대화방 목록도 업데이트
      }
    } catch (error) {
      console.error('메시지 전송 실패:', error)
    } finally {
      setSending(false)
    }
  }

  // 스크롤을 맨 아래로
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // 초기 로드
  useEffect(() => {
    fetchThreads()

    // 컴포넌트 언마운트 시 폴링 중지
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

  // 새 메시지 도착 시 스크롤
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 시간 포맷팅
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)

    if (minutes < 1) return '방금 전'
    if (minutes < 60) return `${minutes}분 전`
    if (hours < 24) return `${hours}시간 전`

    return date.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getDisplayName = (user?: User) => {
    if (!user) return '알 수 없음'
    return user.nickname || user.name || user.email?.split('@')[0] || '사용자'
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* 왼쪽: 대화방 목록 */}
      <div className="w-80 border-r bg-white flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold">메시지</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">로딩 중...</div>
          ) : threads.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>대화 내역이 없습니다</p>
            </div>
          ) : (
            threads.map((thread) => (
              <div
                key={thread.id}
                onClick={() => selectThread(thread)}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedThread?.id === thread.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-900">
                    {getDisplayName(thread.partner)}
                  </span>
                  {thread.last_message_at && (
                    <span className="text-xs text-gray-500">
                      {formatTime(thread.last_message_at)}
                    </span>
                  )}
                </div>
                {thread.last_message_content && (
                  <p className="text-sm text-gray-600 truncate">
                    {thread.last_message_content}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 오른쪽: 대화창 */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedThread ? (
          <>
            {/* 헤더 */}
            <div className="p-4 bg-white border-b">
              <h3 className="font-semibold text-lg">
                {getDisplayName(selectedThread.partner)}
              </h3>
            </div>

            {/* 메시지 목록 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => {
                const isMine = message.sender_id !== selectedThread.partner?.id
                return (
                  <div
                    key={message.id}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-md px-4 py-2 rounded-lg ${
                        isMine
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm break-words">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isMine ? 'text-blue-100' : 'text-gray-500'
                        }`}
                      >
                        {new Date(message.created_at).toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* 입력창 */}
            <div className="p-4 bg-white border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={sending}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {sending ? '전송 중...' : '전송'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p>대화방을 선택하세요</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
