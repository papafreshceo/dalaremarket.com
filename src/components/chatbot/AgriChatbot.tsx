'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import './chatbot.css';

// 타입 정의
interface Message {
  text: string;
  isUser: boolean;
  time: string;
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
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [settings, setSettings] = useState<ChatbotSettings | null>(null);
  const [apiUsage, setApiUsage] = useState<ApiUsage>({
    today: 0,
    date: new Date().toDateString(),
    cacheHits: 0,
    keywordMatches: 0
  });
  const [showStats, setShowStats] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageCache = useRef(new Map<string, string>());
  const supabase = createClient();

  // 메시지 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 챗봇 설정 로드
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('chatbot_settings')
          .select('*')
          .limit(1)
          .single();

        if (error) {
          // 테이블이 없거나 권한 문제 - 조용히 무시
          if (error.code === 'PGRST116' || error.code === '42P01' || error.code === 'PGRST301') {
            console.log('챗봇 설정 테이블이 없습니다. 챗봇을 비활성화합니다.');
          } else {
            console.warn('설정 로드 실패:', error.message);
          }
          return;
        }

        if (data) {
          setSettings(data);
          console.log('✅ 챗봇 설정 로드 완료');
        }
      } catch (error) {
        console.error('❌ 챗봇 설정 로드 실패:', error);
      }
    };

    loadSettings();
  }, []);

  // 로컬 스토리지에서 불러오기
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem('chatHistory');
      if (savedMessages) {
        const msgs = JSON.parse(savedMessages);
        setMessages(msgs);
      }

      const savedUsage = localStorage.getItem('apiUsage');
      if (savedUsage) {
        const usage = JSON.parse(savedUsage);
        if (usage.date === new Date().toDateString()) {
          setApiUsage(usage);
        } else {
          // 자정 리셋
          const newUsage = {
            today: 0,
            date: new Date().toDateString(),
            cacheHits: 0,
            keywordMatches: 0
          };
          setApiUsage(newUsage);
          localStorage.setItem('apiUsage', JSON.stringify(newUsage));
        }
      }
    } catch (error) {
      console.error('스토리지 로드 오류:', error);
    }
  }, []);

  // 환영 메시지 추가
  useEffect(() => {
    if (messages.length === 0 && settings) {
      const welcomeMsg: Message = {
        text: settings.welcome_message,
        isUser: false,
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([welcomeMsg]);
    }
  }, [settings]);

  // 키워드 매칭
  const handleKeywordMatch = (message: string): string | null => {
    if (!settings) return null;

    const msg = message.toLowerCase();

    // FAQ 키워드 매칭
    for (const faq of settings.faqs) {
      if (faq.keywords.some(keyword => msg.includes(keyword))) {
        console.log('🎯 키워드 매칭 성공:', faq.question);
        const newUsage = { ...apiUsage, keywordMatches: apiUsage.keywordMatches + 1 };
        setApiUsage(newUsage);
        localStorage.setItem('apiUsage', JSON.stringify(newUsage));
        return faq.answer;
      }
    }

    // 회사 정보
    if (msg.includes('회사') || msg.includes(settings.company_name) || msg.includes('소개')) {
      const newUsage = { ...apiUsage, keywordMatches: apiUsage.keywordMatches + 1 };
      setApiUsage(newUsage);
      localStorage.setItem('apiUsage', JSON.stringify(newUsage));
      return `${settings.company_name} B2B는 신선한 농산물을 도매가로 공급하는 B2B 플랫폼입니다.\n\n문의: ${settings.company_phone}\n영업시간: ${settings.business_hours}`;
    }

    // 인사말
    if (msg.match(/^(안녕|하이|hi|hello|헬로)/)) {
      const newUsage = { ...apiUsage, keywordMatches: apiUsage.keywordMatches + 1 };
      setApiUsage(newUsage);
      localStorage.setItem('apiUsage', JSON.stringify(newUsage));
      return `안녕하세요! ${settings.company_name} B2B입니다.\n상품 가격, 시즌, 배송 등 무엇이든 물어보세요!`;
    }

    return null;
  };

  // AI API 호출
  const handleAIQuery = async (message: string): Promise<string> => {
    if (!settings) {
      return settings?.error_message || '죄송합니다. 일시적인 오류가 발생했습니다.';
    }

    if (apiUsage.today >= settings.daily_ai_limit) {
      console.warn('⚠️ AI API 일일 한도 초과');
      return `죄송합니다. 오늘 AI 상담 한도를 초과했습니다.\n기본 문의는 ${settings.company_phone}로 전화주세요.`;
    }

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error('API 호출 실패');
      }

      const data = await response.json();

      const newUsage = { ...apiUsage, today: apiUsage.today + 1 };
      setApiUsage(newUsage);
      localStorage.setItem('apiUsage', JSON.stringify(newUsage));

      return data.response;
    } catch (error) {
      console.error('❌ AI API 호출 오류:', error);
      return settings.error_message + `\n기본 문의는 ${settings.company_phone}로 전화주세요.`;
    }
  };

  // 메시지 처리
  const processMessage = async (message: string): Promise<string> => {
    console.log('📨 메시지 처리 시작:', message);

    // 캐시 확인
    if (messageCache.current.has(message)) {
      console.log('💾 캐시 히트!');
      const newUsage = { ...apiUsage, cacheHits: apiUsage.cacheHits + 1 };
      setApiUsage(newUsage);
      localStorage.setItem('apiUsage', JSON.stringify(newUsage));
      return messageCache.current.get(message)!;
    }

    // 1단계: 키워드 매칭
    let response = handleKeywordMatch(message);
    if (response) {
      messageCache.current.set(message, response);
      return response;
    }

    // 2단계: AI API
    response = await handleAIQuery(message);
    messageCache.current.set(message, response);
    return response;
  };

  // 메시지 전송
  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      text: inputValue,
      isUser: true,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsTyping(true);

    // 로컬 스토리지 저장
    try {
      const messagesToSave = newMessages.slice(-50); // 최대 50개
      localStorage.setItem('chatHistory', JSON.stringify(messagesToSave));
    } catch (error) {
      console.error('메시지 저장 오류:', error);
    }

    try {
      const response = await processMessage(inputValue);

      // 타이핑 효과
      await new Promise(resolve => setTimeout(resolve, 500));

      const botMessage: Message = {
        text: response,
        isUser: false,
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      };

      const finalMessages = [...newMessages, botMessage];
      setMessages(finalMessages);

      // 로컬 스토리지 저장
      try {
        const messagesToSave = finalMessages.slice(-50);
        localStorage.setItem('chatHistory', JSON.stringify(messagesToSave));
      } catch (error) {
        console.error('메시지 저장 오류:', error);
      }
    } catch (error) {
      console.error('메시지 처리 오류:', error);
      const errorMessage: Message = {
        text: settings?.error_message || '죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.',
        isUser: false,
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // 빠른 버튼 클릭
  const handleQuickButton = (message: string) => {
    setInputValue(message);
    setTimeout(() => sendMessage(), 100);
  };

  // 키보드 이벤트
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  // Alt+S로 통계 토글
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 's') {
        setShowStats(!showStats);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showStats]);

  // 설정이 로드되지 않았거나 비활성화된 경우 렌더링하지 않음
  if (!settings || !settings.is_enabled) {
    return null;
  }

  return (
    <>
      {/* 사용량 통계 */}
      {showStats && (
        <div className="usage-stats">
          <div>오늘 AI 사용: {apiUsage.today} / {settings.daily_ai_limit}</div>
          <div>캐시 히트: {apiUsage.cacheHits}</div>
          <div>키워드 매칭: {apiUsage.keywordMatches}</div>
        </div>
      )}

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
            <h3>{settings.company_name} 상담봇</h3>
            <button onClick={() => setIsOpen(false)} aria-label="닫기">&times;</button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, index) => (
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

          {/* 빠른 버튼 */}
          {settings.quick_replies && settings.quick_replies.length > 0 && (
            <div className="quick-buttons">
              {settings.quick_replies.map((reply, index) => (
                <button
                  key={index}
                  className="quick-button"
                  onClick={() => handleQuickButton(reply.message)}
                  style={{
                    borderColor: settings.theme_color,
                    color: settings.theme_color
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = settings.theme_color;
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.color = settings.theme_color;
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
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              autoComplete="off"
              style={{
                borderColor: inputValue ? settings.theme_color : undefined
              }}
            />
            <button
              className="chatbot-send"
              onClick={sendMessage}
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
        </div>
      )}
    </>
  );
}
