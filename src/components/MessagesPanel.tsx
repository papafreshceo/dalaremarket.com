'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import TierBadge from '@/components/TierBadge';

// 탭 타입
type TabType = 'messages' | 'users' | 'ai';

// 타입 정의
interface AIMessage {
  text: string;
  isUser: boolean;
  time: string;
}

interface ChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  sender?: User;
}

interface Thread {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_content?: string;
  last_message_at?: string;
  created_at: string;
  partner?: User;
  unread_count: number;
}

interface User {
  id: string;
  email: string;
  name?: string;
  profile_name?: string;
  primary_organization_id?: string;
  role?: string;
  organizations?: {
    tier: string;
  } | null;
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
  welcome_message: string;
  quick_replies: QuickReply[];
  ai_enabled: boolean;
  daily_ai_limit: number;
  faqs: FAQ[];
  company_name: string;
  company_phone: string;
  business_hours: string;
}

function MessagesPanelContent() {
  const searchParams = useSearchParams();
  const supabase = createClient();

  // 탭 및 UI state
  const [activeTab, setActiveTab] = useState<TabType>('messages');

  // AI 챗봇 state
  const [aiMessages, setAIMessages] = useState<AIMessage[]>([]);
  const [aiInput, setAIInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [settings, setSettings] = useState<ChatbotSettings | null>(null);

  // 메시징 state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const messagesCacheRef = useRef<{ [threadId: string]: ChatMessage[] }>({});
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isLoadingOlderRef = useRef(false);

  // 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 스크롤 참조 (마지막 메시지 수를 추적하여 새 메시지 추가 시에만 스크롤)
  const lastMessageCountRef = useRef(0);

  useEffect(() => {
    // 새 메시지가 추가될 때만 스크롤 (과거 메시지 로드 시에는 스크롤 안함)
    const currentCount = chatMessages.length;
    const previousCount = lastMessageCountRef.current;

    // 메시지가 실제로 추가되었고, 과거 메시지 로드 중이 아닐 때만 스크롤
    if (!loadingOlderMessages && currentCount > previousCount && previousCount > 0) {
      // 짧은 딜레이 후 스크롤 (DOM 업데이트 대기)
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 100);
      lastMessageCountRef.current = currentCount;
      return () => clearTimeout(timer);
    }

    lastMessageCountRef.current = currentCount;
  }, [chatMessages.length, loadingOlderMessages]);

  // AI 메시지에 대한 스크롤
  useEffect(() => {
    if (aiMessages.length > 0) {
      scrollToBottom();
    }
  }, [aiMessages.length]);

  // 스크롤 이벤트 핸들러
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollTop = container.scrollTop;

    // 스크롤이 맨 위에서 100px 이내로 왔을 때 과거 메시지 로드
    if (scrollTop < 100 && hasMoreMessages && !loadingOlderMessages) {
      console.log('🔼 맨 위 도달, 과거 메시지 로드');
      loadOlderMessages();
    }
  };

  // 사용자 정보 가져오기
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // users 테이블에서 프로필 정보 가져오기
        const { data: userProfile } = await supabase
          .from('users')
          .select('id, email, name, profile_name')
          .eq('id', user.id)
          .single();

        // auth user와 profile 정보 합치기
        setCurrentUser({
          ...user,
          ...userProfile
        });
      }
    };
    getUser();
  }, []);

  // 챗봇 설정 로드
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('chatbot_settings')
          .select('*')
          .limit(1);

        if (error) return;

        if (data && data.length > 0) {
          setSettings(data[0]);
          if (data[0].welcome_message && aiMessages.length === 0) {
            setAIMessages([{
              text: data[0].welcome_message,
              isUser: false,
              time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
            }]);
          }
        }
      } catch (error) {
        console.error('챗봇 설정 로드 실패:', error);
      }
    };

    loadSettings();
  }, []);

  // 푸시 알림에서 localStorage를 통해 특정 사용자와 대화 열기
  useEffect(() => {
    const pendingSenderId = localStorage.getItem('openChatWithUser');
    if (pendingSenderId && currentUser) {
      localStorage.removeItem('openChatWithUser');
      setActiveTab('messages');
      setTimeout(() => {
        openChatWithUser(pendingSenderId);
      }, 500);
    }
  }, [currentUser]);

  // URL 파라미터로 특정 사용자와 대화 열기
  useEffect(() => {
    const userId = searchParams.get('userId');
    if (userId && currentUser) {
      setActiveTab('messages');
      setTimeout(() => {
        openChatWithUser(userId);
      }, 500);
    }
  }, [searchParams, currentUser]);

  // 특정 사용자와 대화 열기
  const openChatWithUser = async (senderId: string) => {
    await fetchUsers();
    await fetchThreads();

    setTimeout(async () => {
      const existingThread = threads.find(t => t.partner?.id === senderId);
      if (existingThread) {
        selectThread(existingThread);
      } else {
        const user = users.find(u => u.id === senderId);
        if (user) {
          startNewConversation(senderId);
        }
      }
    }, 300);
  };

  // 대화방 목록 조회
  const fetchThreads = async () => {
    if (!currentUser) return;

    try {
      const response = await fetch('/api/messages');
      const data = await response.json();
      if (data.success) {
        setThreads(data.threads);
      }
    } catch (error) {
      console.error('대화방 목록 조회 실패:', error);
    }
  };

  // 메시지 조회
  const fetchChatMessages = async (threadId: string, limit: number = 50) => {
    if (!threadId || threadId === 'new') {
      console.log('⚠️ setChatMessages([]) - threadId가 new이거나 없음');
      setChatMessages([]);
      messagesCacheRef.current[threadId] = [];
      setHasMoreMessages(false);
      return;
    }

    // 캐시에서 먼저 로드
    if (messagesCacheRef.current[threadId]) {
      console.log('💾 캐시에서 메시지 로드:', messagesCacheRef.current[threadId].length, '개');
      console.log('💾 setChatMessages() - 캐시에서 로드');
      setChatMessages(messagesCacheRef.current[threadId]);
    }

    setLoadingMessages(true);
    try {
      console.log('📥 메시지 조회 시작:', threadId);
      const response = await fetch(`/api/messages/${threadId}?limit=${limit}`);
      const data = await response.json();
      console.log('📥 메시지 API 응답:', data.success ? '성공' : '실패', data.messages?.length || 0, '개');

      if (data.success) {
        const messages = data.messages || [];
        console.log('📝 받은 메시지:', messages.map((m: any) => m.id.substring(0, 8)).join(', '));

        // 캐시와 state 모두 업데이트
        messagesCacheRef.current[threadId] = messages;
        console.log('✅ setChatMessages() - 서버에서 받은 메시지:', messages.length, '개');
        setChatMessages(messages);
        setHasMoreMessages(messages.length >= limit);
        console.log('✅ 메시지 설정 완료:', messages.length, '개 (캐시 저장됨)');

        // 화면에 메시지가 표시되었으므로 읽음 처리
        const unreadMessageIds = messages
          .filter((msg: any) => msg.sender_id !== currentUser?.id && !msg.is_read)
          .map((msg: any) => msg.id);

        if (unreadMessageIds.length > 0) {
          console.log('📖 기존 메시지 읽음 처리:', unreadMessageIds.length, '개');
          await supabase
            .from('messages')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .in('id', unreadMessageIds);
        }
      } else {
        console.error('❌ 메시지 조회 실패:', data.error);
        console.log('❌ setChatMessages([]) - 조회 실패');
        setChatMessages([]);
        messagesCacheRef.current[threadId] = [];
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error('❌ 메시지 조회 오류:', error);
      console.log('❌ setChatMessages([]) - 조회 오류');
      setChatMessages([]);
      messagesCacheRef.current[threadId] = [];
      setHasMoreMessages(false);
    } finally {
      setLoadingMessages(false);
    }
  };

  // 과거 메시지 더 불러오기
  const loadOlderMessages = async () => {
    if (!selectedThread || selectedThread.id === 'new' || !hasMoreMessages || isLoadingOlderRef.current) {
      return;
    }

    if (chatMessages.length === 0) return;

    const oldestMessage = chatMessages[0];
    if (!oldestMessage) return;

    isLoadingOlderRef.current = true;
    setLoadingOlderMessages(true);

    try {
      console.log('📥 과거 메시지 로드 중...');
      console.log('📅 가장 오래된 메시지 시간:', oldestMessage.created_at);
      const beforeParam = encodeURIComponent(oldestMessage.created_at);
      console.log('📅 인코딩된 파라미터:', beforeParam);

      const response = await fetch(
        `/api/messages/${selectedThread.id}?limit=50&before=${beforeParam}`
      );
      const data = await response.json();

      if (!data.success) {
        console.error('❌ API 에러:', data.error, data.details);
      }

      if (data.success) {
        const olderMessages = data.messages || [];
        console.log('📝 과거 메시지:', olderMessages.length, '개');

        if (olderMessages.length > 0) {
          // 기존 메시지 앞에 추가
          const updatedMessages = [...olderMessages, ...chatMessages];
          setChatMessages(updatedMessages);
          messagesCacheRef.current[selectedThread.id] = updatedMessages;

          // 더 불러올 메시지가 있는지 확인
          setHasMoreMessages(olderMessages.length >= 50);
        } else {
          setHasMoreMessages(false);
        }
      }
    } catch (error) {
      console.error('❌ 과거 메시지 로드 오류:', error);
    } finally {
      setLoadingOlderMessages(false);
      isLoadingOlderRef.current = false;
    }
  };

  // 대화방 선택
  const selectThread = (thread: Thread) => {
    console.log('🎯 대화방 선택:', thread.id);
    setSelectedThread(thread);

    // 캐시에 메시지가 있으면 즉시 표시
    if (messagesCacheRef.current[thread.id]) {
      console.log('💾 캐시에서 즉시 로드:', messagesCacheRef.current[thread.id].length, '개');
      console.log('💾 setChatMessages() - selectThread에서 캐시 로드');
      const cachedMessages = messagesCacheRef.current[thread.id];
      setChatMessages(cachedMessages);

      // 캐시된 메시지가 있을 때는 바로 스크롤하지 않음
      // 사용자가 이전 대화 내용을 보고 싶을 수 있음
    } else {
      // 캐시가 없으면 빈 배열로 시작
      console.log('⚠️ setChatMessages([]) - selectThread에서 캐시 없음');
      setChatMessages([]);
    }

    // 그 다음 서버에서 최신 데이터 가져오기
    fetchChatMessages(thread.id);

    // 기존 구독 해제
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Realtime 구독 시작
    console.log('📡 Realtime 구독 시작:', thread.id);
    const channel = supabase
      .channel(`messages:${thread.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${thread.id}`
        },
        async (payload: any) => {
          console.log('✅ Realtime 새 메시지 수신:', payload.new.id);

          // 보낸 사람 정보 가져오기
          const { data: sender } = await supabase
            .from('users')
            .select('id, email, name, profile_name')
            .eq('id', payload.new.sender_id)
            .single();

          const newMsg: ChatMessage = {
            ...payload.new,
            sender
          };

          // 메시지 목록에 추가 (중복 체크)
          setChatMessages(prev => {
            const exists = prev.some(m => m.id === newMsg.id);
            if (exists) {
              console.log('⚠️ 메시지 중복, 무시:', newMsg.id);
              return prev;
            }
            console.log('✅ 메시지 추가:', newMsg.id);
            const updated = [...prev, newMsg];
            // 캐시도 업데이트
            messagesCacheRef.current[thread.id] = updated;
            return updated;
          });

          // 대화창이 열려있고, 상대방이 보낸 메시지면 즉시 읽음 처리
          if (payload.new.sender_id !== currentUser?.id && !payload.new.is_read) {
            console.log('📖 대화창 열려있음, 메시지 읽음 처리:', payload.new.id);
            await supabase
              .from('messages')
              .update({ is_read: true, read_at: new Date().toISOString() })
              .eq('id', payload.new.id);
          }

          // 대화방 목록 갱신
          fetchThreads();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${thread.id}`
        },
        (payload: any) => {
          console.log('📖 메시지 읽음 상태 업데이트:', payload.new.id, payload.new.is_read);

          // 메시지 읽음 상태 업데이트
          setChatMessages(prev => {
            const updated = prev.map(msg =>
              msg.id === payload.new.id
                ? { ...msg, is_read: payload.new.is_read, read_at: payload.new.read_at }
                : msg
            );
            // 캐시도 업데이트
            messagesCacheRef.current[thread.id] = updated;
            return updated;
          });

          // 대화방 목록 갱신
          fetchThreads();
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime 구독 상태:', status);
      });

    channelRef.current = channel;
  };

  // 메시지 전송
  const sendChatMessage = async () => {
    if (!newMessage.trim() || !selectedThread || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    console.log('📤 메시지 전송 시작:', messageContent.substring(0, 20) + '...');

    // 낙관적 업데이트: 즉시 화면에 표시
    const optimisticMessage: ChatMessage = {
      id: 'temp-' + Date.now(),
      thread_id: selectedThread.id,
      sender_id: currentUser?.id || '',
      content: messageContent,
      is_read: false,
      created_at: new Date().toISOString(),
      sender: {
        id: currentUser?.id || '',
        email: currentUser?.email || '',
        name: currentUser?.name,
        profile_name: currentUser?.profile_name
      }
    };

    // 즉시 화면에 추가
    setChatMessages(prev => {
      const updated = [...prev, optimisticMessage];
      if (selectedThread.id !== 'new') {
        messagesCacheRef.current[selectedThread.id] = updated;
      }
      return updated;
    });

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver_id: selectedThread.partner?.id,
          content: messageContent,
        }),
      });

      const data = await response.json();
      console.log('📥 서버 응답:', data.success ? '성공' : '실패', data);

      if (data.success) {
        console.log('✅ 메시지 전송 성공, ID:', data.message?.id);

        // 임시 메시지를 실제 메시지로 교체
        setChatMessages(prev => {
          const filtered = prev.filter(m => m.id !== optimisticMessage.id);
          const realMessage: ChatMessage = {
            ...data.message,
            sender: optimisticMessage.sender
          };
          const updated = [...filtered, realMessage];
          if (selectedThread.id !== 'new') {
            messagesCacheRef.current[selectedThread.id] = updated;
          }
          return updated;
        });

        if (selectedThread.id === 'new' && data.thread_id) {
          console.log('🆕 새 대화방 생성됨:', data.thread_id);
          const updatedThread = { ...selectedThread, id: data.thread_id };
          setSelectedThread(updatedThread);
        }

        // 대화방 목록 갱신
        fetchThreads();
      } else {
        console.log('❌ 메시지 전송 실패:', data.error);

        // 낙관적 메시지 제거
        setChatMessages(prev => {
          const updated = prev.filter(m => m.id !== optimisticMessage.id);
          if (selectedThread.id !== 'new') {
            messagesCacheRef.current[selectedThread.id] = updated;
          }
          return updated;
        });

        setNewMessage(messageContent);
        alert('메시지 전송 실패: ' + data.error);
      }
    } catch (error) {
      console.error('❌ 메시지 전송 오류:', error);

      // 낙관적 메시지 제거
      setChatMessages(prev => {
        const updated = prev.filter(m => m.id !== optimisticMessage.id);
        if (selectedThread.id !== 'new') {
          messagesCacheRef.current[selectedThread.id] = updated;
        }
        return updated;
      });

      setNewMessage(messageContent);
      alert('메시지 전송 중 오류 발생');
    } finally {
      setSending(false);
    }
  };

  // 사용자 목록 조회
  const fetchUsers = async () => {
    if (!currentUser) return;

    try {
      const response = await fetch('/api/user/list');
      const data = await response.json();
      if (data.success) {
        const regularUsers = data.users.filter((u: any) =>
          u.role !== 'admin' && u.role !== 'super_admin' && u.role !== 'employee'
        );
        setUsers(regularUsers);
      }
    } catch (error) {
      console.error('사용자 목록 조회 실패:', error);
    }
  };

  // 새 대화 시작
  const startNewConversation = (receiverId: string) => {
    setSearchQuery('');
    setActiveTab('messages');

    const existingThread = threads.find(t => t.partner?.id === receiverId);
    if (existingThread) {
      selectThread(existingThread);
      return;
    }

    const selectedUser = users.find(u => u.id === receiverId);
    if (selectedUser) {
      setSelectedThread({
        id: 'new',
        participant_1: '',
        participant_2: receiverId,
        created_at: new Date().toISOString(),
        partner: selectedUser,
        unread_count: 0
      });
      setChatMessages([]);
    }
  };

  // AI 메시지 전송
  const sendAIMessage = async () => {
    if (!aiInput.trim() || isTyping) return;

    const userMessage = aiInput.trim();
    setAIInput('');

    const userMsg: AIMessage = {
      text: userMessage,
      isUser: true,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };

    setAIMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();

      if (data.success && data.response) {
        const botMsg: AIMessage = {
          text: data.response,
          isUser: false,
          time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
        };
        setAIMessages(prev => [...prev, botMsg]);
      }
    } catch (error) {
      console.error('AI 챗봇 오류:', error);
    } finally {
      setIsTyping(false);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    if (currentUser) {
      fetchThreads();
      fetchUsers();
    }

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [currentUser]);

  // 메시지 state 변경 추적
  useEffect(() => {
    console.log('🔍 chatMessages 상태 변경됨:', chatMessages.length, '개');
    console.log('🔍 현재 selectedThread:', selectedThread?.id);
  }, [chatMessages]);

  // selectedThread 변경 추적
  useEffect(() => {
    console.log('🔍 selectedThread 변경됨:', selectedThread?.id);
    if (selectedThread && selectedThread.id !== 'new') {
      console.log('🔍 캐시 확인:', messagesCacheRef.current[selectedThread.id]?.length || 0, '개');
    }
  }, [selectedThread]);

  // 필터링된 사용자 목록
  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.profile_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 사용자 표시 이름
  const getDisplayName = (user?: User) => {
    return user?.profile_name || '프로필명 없음';
  };

  // 티어 배지
  const getTierBadge = (user?: User) => {
    const tier = user?.organizations?.tier?.toLowerCase() as 'light' | 'standard' | 'advance' | 'elite' | 'legend' | undefined;
    if (!tier) return null;

    const validTiers = ['light', 'standard', 'advance', 'elite', 'legend'];
    if (!validTiers.includes(tier)) return null;

    return <TierBadge tier={tier} iconOnly glow={0} />;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ height: '600px' }}>
      <div className="flex h-full">
        {/* 왼쪽 사이드바 - 탭 및 목록 */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          {/* 탭 */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex-1 py-3 text-sm font-medium ${
                activeTab === 'messages'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              대화
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-3 text-sm font-medium ${
                activeTab === 'users'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              사용자
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-3 text-sm font-medium ${
                activeTab === 'ai'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              AI 상담
            </button>
          </div>

          {/* 리스트 영역 */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'messages' && (
              <div>
                {threads.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p>대화 내역이 없습니다</p>
                    <p className="text-sm mt-2">사용자 탭에서 새 대화를 시작하세요</p>
                  </div>
                ) : (
                  threads.map(thread => (
                    <div
                      key={thread.id}
                      onClick={() => selectThread(thread)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                        selectedThread?.id === thread.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getTierBadge(thread.partner)}
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {getDisplayName(thread.partner)}
                            </p>
                          </div>
                          <p className="text-sm text-gray-500 truncate">
                            {thread.last_message_content || '메시지 없음'}
                          </p>
                        </div>
                        {thread.unread_count > 0 && (
                          <span className="ml-2 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {thread.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <div className="p-3 border-b border-gray-200">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="사용자 검색..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {filteredUsers.map(user => (
                  <div
                    key={user.id}
                    onClick={() => startNewConversation(user.id)}
                    className="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      {getTierBadge(user)}
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {getDisplayName(user)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="p-4">
                <div className="text-center text-gray-600">
                  <div className="text-4xl mb-2">🤖</div>
                  <p className="text-sm font-medium">AI 상담봇</p>
                  <p className="text-xs text-gray-500 mt-1">
                    궁금한 점을 물어보세요
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽 메인 영역 - 채팅 */}
        <div className="flex-1 flex flex-col">
          {activeTab === 'ai' ? (
            // AI 채팅
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {aiMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${msg.isUser ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'} rounded-lg px-4 py-2`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      <p className={`text-xs mt-1 ${msg.isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-4 py-2">
                      <p className="text-sm text-gray-600">입력 중...</p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="border-t border-gray-200 p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiInput}
                    onChange={(e) => setAIInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendAIMessage()}
                    placeholder="메시지를 입력하세요..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={sendAIMessage}
                    disabled={!aiInput.trim() || isTyping}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    전송
                  </button>
                </div>
              </div>
            </>
          ) : selectedThread ? (
            // 사용자 채팅
            <>
              <div className="border-b border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  {getTierBadge(selectedThread.partner)}
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {getDisplayName(selectedThread.partner)}
                  </h3>
                  <span className="text-xs text-gray-500 ml-auto">
                    메시지: {chatMessages?.length || 0}개
                  </span>
                </div>
              </div>
              <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {console.log('🎨 렌더링:', chatMessages?.length, '개 메시지')}

                {/* 과거 메시지 로딩 표시 */}
                {loadingOlderMessages && (
                  <div className="flex justify-center py-2">
                    <div className="text-sm text-gray-500">과거 메시지 불러오는 중...</div>
                  </div>
                )}

                {/* 더 이상 메시지 없음 표시 */}
                {!hasMoreMessages && chatMessages.length > 0 && (
                  <div className="flex justify-center py-2">
                    <div className="text-xs text-gray-400">대화의 시작입니다</div>
                  </div>
                )}

                {chatMessages && chatMessages.length > 0 ? (
                  chatMessages.map((msg) => {
                    const isMyMessage = msg.sender_id === currentUser?.id;
                    return (
                      <div key={msg.id} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${isMyMessage ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'} rounded-lg px-4 py-2`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <div className={`flex items-center gap-2 text-xs mt-1 ${isMyMessage ? 'text-blue-100' : 'text-gray-500'}`}>
                            <span>
                              {new Date(msg.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMyMessage && (
                              <span className={`text-[10px] font-medium ${msg.is_read ? 'text-green-300' : 'text-blue-200'}`}>
                                {msg.is_read ? '읽음' : '안읽음'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <p className="text-sm">메시지가 없습니다</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="border-t border-gray-200 p-4">
                <form onSubmit={(e) => { e.preventDefault(); sendChatMessage(); }} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="메시지를 입력하세요..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {sending ? '전송중...' : '전송'}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-lg font-medium">대화를 선택하세요</p>
                <p className="text-sm text-gray-400 mt-1">왼쪽에서 대화를 선택하거나 새 대화를 시작하세요</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPanel() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>로딩 중...</div>}>
      <MessagesPanelContent />
    </Suspense>
  )
}
