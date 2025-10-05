// src/pages/user/Tools.jsx
import { useState, useEffect } from 'react';
import UserHeader from '../../components/layout/UserHeader';
import ToolModal from '../../components/tools/ToolModal';

function Tools() {
  const [hoveredTool, setHoveredTool] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState(['margin-calculator', 'price-simulator']);
  const [isMobile, setIsMobile] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 도구 카테고리
  const categories = [
    { id: 'all', name: '전체', count: 16 },
    { id: 'essential', name: '핵심 도구', count: 5 },
    { id: 'data', name: '데이터 관리', count: 3 },
    { id: 'pricing', name: '가격 설정', count: 4 },
    { id: 'analytics', name: '분석 도구', count: 5 },
    { id: 'communication', name: '커뮤니케이션', count: 1 }
  ];

  // SVG 아이콘 컴포넌트들
  const icons = {
    'margin-calculator': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="white"/>
        <path d="M11 7H13V9H11V7ZM11 11H13V17H11V11Z" fill="white"/>
        <path d="M15.5 11.5L14 10L16.5 7.5L18 9L15.5 11.5ZM8 9L9.5 7.5L12 10L10.5 11.5L8 9Z" fill="white"/>
      </svg>
    ),
    'price-simulator': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 13H5L8 17L12 7L15 13H17V15H15L12 9L8 19L5 15H3V13Z" fill="white"/>
        <path d="M19 3H21V12H19V3ZM15 8H17V12H15V8ZM11 10H13V12H11V10Z" fill="white"/>
      </svg>
    ),
    'order-integration': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 3H5C3.89 3 3 3.89 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.89 20.1 3 19 3ZM19 19H5V5H19V19Z" fill="white"/>
        <path d="M7 7H11V11H7V7ZM13 7H17V11H13V7ZM7 13H11V17H7V13ZM13 13H17V17H13V13Z" fill="white"/>
      </svg>
    ),
    'option-pricing': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7V11C2 16.55 5.84 21.74 11 22.97V20.91C6.91 19.75 4 15.54 4 11.22V8.3L12 4.19L20 8.3V11.22C20 12.46 19.8 13.65 19.43 14.77L21.17 16.5C21.7 14.86 22 13.1 22 11.22V7L12 2Z" fill="white"/>
        <path d="M19.07 17.66L12.41 11L11 12.41L17.66 19.07L16.24 20.49L21.49 21.9L20.08 16.65L19.07 17.66Z" fill="white"/>
      </svg>
    ),
    'inventory-tracker': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white"/>
        <path d="M2 17L12 22L22 17M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    'discount-calculator': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.5 6.9C11.77 6.33 10.86 6 9.85 6C7.09 6 4.85 8.24 4.85 11C4.85 13.76 7.09 16 9.85 16C10.86 16 11.77 15.67 12.5 15.1C13.23 15.67 14.14 16 15.15 16C17.91 16 20.15 13.76 20.15 11C20.15 8.24 17.91 6 15.15 6C14.14 6 13.23 6.33 12.5 6.9ZM9.85 14C8.2 14 6.85 12.65 6.85 11C6.85 9.35 8.2 8 9.85 8C10.51 8 11.1 8.22 11.59 8.59C11.12 9.3 10.85 10.13 10.85 11C10.85 11.87 11.12 12.7 11.59 13.41C11.1 13.78 10.51 14 9.85 14ZM15.15 14C14.49 14 13.9 13.78 13.41 13.41C13.88 12.7 14.15 11.87 14.15 11C14.15 10.13 13.88 9.3 13.41 8.59C13.9 8.22 14.49 8 15.15 8C16.8 8 18.15 9.35 18.15 11C18.15 12.65 16.8 14 15.15 14Z" fill="white"/>
      </svg>
    ),
    'sales-analytics': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 9.2H8V19H5V9.2ZM10.6 5H13.4V19H10.6V5ZM16.2 13H19V19H16.2V13Z" fill="white"/>
      </svg>
    ),
    'customer-message': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H6L4 18V4H20V16Z" fill="white"/>
        <path d="M7 9H17V11H7V9ZM7 6H17V8H7V6ZM7 12H14V14H7V12Z" fill="white"/>
      </svg>
    ),
    'barcode-generator': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 6H4V18H2V6ZM5 6H6V18H5V6ZM7 6H10V18H7V6ZM11 6H12V18H11V6ZM14 6H16V18H14V6ZM17 6H18V18H17V6ZM19 6H22V18H19V6Z" fill="white"/>
      </svg>
    ),
    'transaction-statement': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="white"/>
        <path d="M8 12H16V13.5H8V12ZM8 15H16V16.5H8V15ZM8 9H16V10.5H8V9Z" fill="white"/>
        <circle cx="17" cy="17" r="3" fill="white"/>
        <path d="M16 16H18V18H16V16Z" fill="#667eea"/>
      </svg>
    ),
    'trend-analysis': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 6L18.29 8.29L13.41 13.17L9.41 9.17L2 16.59L3.41 18L9.41 12L13.41 16L19.71 9.71L22 12V6H16Z" fill="white"/>
      </svg>
    ),
    'competitor-monitor': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="white"/>
      </svg>
    ),
    'product-name-optimizer': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z" fill="white"/>
      </svg>
    ),
    'review-analyzer': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.99 2C6.47 2 2 6.48 2 12C2 17.52 6.47 22 11.99 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 11.99 2ZM8.5 8C9.33 8 10 8.67 10 9.5C10 10.33 9.33 11 8.5 11C7.67 11 7 10.33 7 9.5C7 8.67 7.67 8 8.5 8ZM12 18C9.5 18 7.3 16.7 6.05 14.75C6.2 14.3 6.85 13.8 8.5 13C8.75 13.15 9.25 13.5 10 13.5C10.75 13.5 11.25 13.15 11.5 13C13.15 13.8 13.8 14.3 13.95 14.75C12.7 16.7 10.5 18 12 18ZM15.5 11C14.67 11 14 10.33 14 9.5C14 8.67 14.67 8 15.5 8C16.33 8 17 8.67 17 9.5C17 10.33 16.33 11 15.5 11Z" fill="white"/>
      </svg>
    ),
    'price-recommender': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13.41 18.09V20H10.74V18.07C9.03 17.71 7.58 16.61 7.47 14.67H9.43C9.53 15.82 10.39 16.7 12.08 16.7C13.98 16.7 14.54 15.64 14.54 14.93C14.54 14.04 14.08 13.37 12.31 12.95L10.46 12.52C8.55 12.08 7.51 10.87 7.51 9.14C7.51 7.17 8.96 5.94 10.74 5.58V4H13.41V5.6C15.27 6.04 16.27 7.38 16.37 9H14.41C14.35 7.96 13.65 7.22 12.08 7.22C10.58 7.22 9.75 7.91 9.75 8.88C9.75 9.73 10.29 10.29 11.89 10.67L13.48 11.05C15.69 11.55 16.78 12.62 16.78 14.65C16.77 16.79 15.35 17.72 13.41 18.09Z" fill="white"/>
      </svg>
    ),
    'category-rank-checker': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7.5 21L2 9L4.5 9L7.5 16L10.5 9L13 9L7.5 21ZM17 3V13L22 13L17 21L17 13L12 13L17 3Z" fill="white"/>
      </svg>
    ),
    'search': (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14.2939 12.5786H13.3905L13.0703 12.2699C14.191 10.9663 14.8656 9.27387 14.8656 7.43282C14.8656 3.32762 11.538 0 7.43282 0C3.32762 0 0 3.32762 0 7.43282C0 11.538 3.32762 14.8656 7.43282 14.8656C9.27387 14.8656 10.9663 14.191 12.2699 13.0703L12.5786 13.3905V14.2939L18.2962 20L20 18.2962L14.2939 12.5786ZM7.43282 12.5786C4.58548 12.5786 2.28702 10.2802 2.28702 7.43282C2.28702 4.58548 4.58548 2.28702 7.43282 2.28702C10.2802 2.28702 12.5786 4.58548 12.5786 7.43282C12.5786 10.2802 10.2802 12.5786 7.43282 12.5786Z" fill="#6c757d"/>
      </svg>
    ),
    'star': (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 15.27L16.18 19L14.54 11.97L20 7.24L12.81 6.63L10 0L7.19 6.63L0 7.24L5.46 11.97L3.82 19L10 15.27Z" fill="#f59e0b"/>
      </svg>
    ),
    'starOutline': (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 15.27L16.18 19L14.54 11.97L20 7.24L12.81 6.63L10 0L7.19 6.63L0 7.24L5.46 11.97L3.82 19L10 15.27Z" stroke="#6c757d" strokeWidth="1.5" fill="none"/>
      </svg>
    )
  };

  // 도구 목록
  const tools = [
    {
      id: 'margin-calculator',
      category: 'essential',
      name: '마진계산기',
      description: '원가와 판매가를 입력하여 마진율을 자동 계산',
      bgGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      usageCount: '2,341회/월',
      isNew: false,
      isPremium: false
    },
    {
      id: 'price-simulator',
      category: 'essential',
      name: '판매가 시뮬레이터',
      description: '다양한 조건에서의 최적 판매가격을 시뮬레이션',
      bgGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      usageCount: '1,892회/월',
      isNew: false,
      isPremium: false
    },
    {
      id: 'order-integration',
      category: 'data',
      name: '주문통합 (Excel)',
      description: '여러 채널의 주문을 하나의 엑셀로 통합 관리',
      bgGradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      usageCount: '3,127회/월',
      isNew: false,
      isPremium: false
    },
    {
      id: 'option-pricing',
      category: 'pricing',
      name: '옵션가 세팅',
      description: '상품 옵션별 가격을 효율적으로 설정 및 관리',
      bgGradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      usageCount: '892회/월',
      isNew: true,
      isPremium: false
    },
    {
      id: 'inventory-tracker',
      category: 'data',
      name: '재고 추적기',
      description: '실시간 재고 현황을 모니터링하고 알림 설정',
      bgGradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      usageCount: '1,456회/월',
      isNew: false,
      isPremium: false
    },
    {
      id: 'discount-calculator',
      category: 'pricing',
      name: '할인율 계산기',
      description: '목표 마진을 유지하면서 최대 할인율 계산',
      bgGradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      usageCount: '672회/월',
      isNew: false,
      isPremium: false
    },
    {
      id: 'sales-analytics',
      category: 'analytics',
      name: '매출 분석',
      description: '기간별, 상품별 매출 현황을 시각화하여 분석',
      bgGradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      usageCount: '2,890회/월',
      isNew: false,
      isPremium: true
    },
    {
      id: 'customer-message',
      category: 'communication',
      name: '고객 메시지',
      description: '고객에게 발송할 메시지 템플릿 관리',
      bgGradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      usageCount: '445회/월',
      isNew: false,
      isPremium: false
    },
    {
      id: 'barcode-generator',
      category: 'essential',
      name: '바코드 생성기',
      description: '상품 바코드를 대량으로 생성 및 인쇄',
      bgGradient: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
      usageCount: '567회/월',
      isNew: true,
      isPremium: false
    },
    {
      id: 'transaction-statement',
      category: 'essential',
      name: '거래명세서 즉시 발급',
      description: '거래명세서를 PDF, JPG, PNG로 즉시 발급',
      bgGradient: 'linear-gradient(135deg, #cfd9df 0%, #e2ebf0 100%)',
      usageCount: '1,234회/월',
      isNew: false,
      isPremium: false
    },
    {
      id: 'trend-analysis',
      category: 'analytics',
      name: '트렌드 분석',
      description: '시장 트렌드와 판매 데이터 상관관계 분석',
      bgGradient: 'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
      usageCount: '892회/월',
      isNew: true,
      isPremium: true
    },
    {
      id: 'competitor-monitor',
      category: 'analytics',
      name: '경쟁사 모니터링',
      description: '경쟁사 가격 변동 실시간 추적',
      bgGradient: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
      usageCount: '445회/월',
      isNew: false,
      isPremium: true
    },
    {
      id: 'product-name-optimizer',
      category: 'essential',
      name: '상품명 최적화 도구',
      description: '검색 엔진 최적화를 고려한 효과적인 상품명 생성',
      bgGradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      usageCount: '1,023회/월',
      isNew: true,
      isPremium: false
    },
    {
      id: 'review-analyzer',
      category: 'analytics',
      name: '리뷰 분석',
      description: '고객 리뷰의 감정을 분석하고 대응 전략 제안',
      bgGradient: 'linear-gradient(135deg, #a6c0fe 0%, #f68084 100%)',
      usageCount: '756회/월',
      isNew: true,
      isPremium: false
    },
    {
      id: 'price-recommender',
      category: 'pricing',
      name: '판매가/할인가 추천기',
      description: '원가와 마진율을 고려한 최적의 판매 가격 추천',
      bgGradient: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
      usageCount: '1,567회/월',
      isNew: false,
      isPremium: false
    },
    {
      id: 'category-rank-checker',
      category: 'analytics',
      name: '카테고리 순위 확인',
      description: '각 플랫폼별 카테고리 내 상품 순위 실시간 확인',
      bgGradient: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
      usageCount: '2,145회/월',
      isNew: true,
      isPremium: true
    }
  ];

  // 필터링된 도구
  const filteredTools = tools.filter(tool => {
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tool.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // 즐겨찾기 토글
  const toggleFavorite = (toolId) => {
    setFavorites(prev => 
      prev.includes(toolId) 
        ? prev.filter(id => id !== toolId)
        : [...prev, toolId]
    );
  };

  // 도구 클릭 핸들러
  const handleToolClick = (tool) => {
    console.log('Tool clicked:', tool); // 디버깅용
    setSelectedTool(tool);
    setModalOpen(true);
  };

  // 모달 닫기 핸들러
  const handleCloseModal = () => {
    console.log('Modal closing'); // 디버깅용
    setModalOpen(false);
    setSelectedTool(null);
  };

  // 즐겨찾기된 도구와 일반 도구 분리
  const favoriteTools = filteredTools.filter(tool => favorites.includes(tool.id));
  const regularTools = filteredTools.filter(tool => !favorites.includes(tool.id));

  return (
    <>
      <UserHeader />
      <div style={{
        position: 'relative',
        width: '100%',
        paddingTop: '70px',
        paddingLeft: isMobile ? '20px' : '40px',
        paddingRight: isMobile ? '20px' : '40px',
        paddingBottom: isMobile ? '20px' : '40px',
        minHeight: '100vh',
        overflow: 'hidden'
      }}>
        {/* 배경 그라데이션 */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(180deg, #3b82f6 0%, #60a5fa 300px, #93c5fd 600px, #bfdbfe 900px, #dbeafe 1200px, #f0f9ff 1500px, #ffffff 1800px, #ffffff 100%)',
          zIndex: -3
        }} />
        
        {/* 왼쪽 악센트 */}
        <div style={{
          position: 'absolute',
          top: '400px',
          left: 0,
          width: '600px',
          height: '400px',
          background: 'radial-gradient(ellipse at 0% 50%, rgba(187, 247, 208, 0.4) 0%, transparent 60%)',
          zIndex: -2
        }} />
        
        {/* 우측 상단 악센트 */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '1600px',
          height: '1200px',
          background: 'radial-gradient(ellipse at 100% 0%, rgba(139, 92, 246, 0.5) 0%, transparent 60%)',
          zIndex: -1
        }} />

        <div style={{
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          {/* 히어로 섹션 */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: isMobile ? '25px 20px' : '40px',
            marginBottom: '32px',
            border: '1px solid #dee2e6'
          }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: '700', 
              color: '#6c757d', 
              textTransform: 'uppercase', 
              letterSpacing: '0.06em',
              marginBottom: '12px'
            }}>
              Business Tools
            </div>
            <h1 style={{ 
              fontSize: isMobile ? '28px' : '36px', 
              fontWeight: '600', 
              marginBottom: '12px'
            }}>
              업무도구
            </h1>
            <p style={{ 
              fontSize: '14px', 
              color: '#6c757d',
              lineHeight: '1.6',
              marginBottom: '24px'
            }}>
              판매 업무를 더욱 효율적으로 만드는 다양한 도구들을 활용해보세요.
              마진 계산부터 데이터 분석까지 한 곳에서 관리할 수 있습니다.
            </p>

            {/* 검색 바 */}
            <div style={{
              position: 'relative',
              marginBottom: '24px'
            }}>
              <input
                type="text"
                placeholder="도구 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 16px',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <div style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6c757d'
              }}>
                🔍
              </div>
            </div>

            {/* 카테고리 탭 */}
            <div style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '8px'
            }}>
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  style={{
                    padding: '8px 16px',
                    background: selectedCategory === category.id ? '#2563eb' : '#f8f9fa',
                    color: selectedCategory === category.id ? '#ffffff' : '#495057',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s'
                  }}
                >
                  {category.name}
                  <span style={{
                    marginLeft: '6px',
                    opacity: 0.8,
                    fontSize: '12px'
                  }}>
                    {category.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 즐겨찾기 도구 */}
          {favoriteTools.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ 
                fontSize: isMobile ? '20px' : '24px', 
                fontWeight: '600', 
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {icons.star} 즐겨찾기
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '16px'
              }}>
                {favoriteTools.map((tool) => (
                  <div
                    key={tool.id}
                    style={{
                      background: '#ffffff',
                      border: '2px solid #2563eb',
                      borderRadius: '16px',
                      padding: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      transform: hoveredTool === tool.id ? 'translateY(-4px)' : 'translateY(0)',
                      boxShadow: hoveredTool === tool.id 
                        ? '0 10px 30px rgba(37, 99, 235, 0.2)' 
                        : '0 2px 8px rgba(0,0,0,0.05)'
                    }}
                    onMouseEnter={() => setHoveredTool(tool.id)}
                    onMouseLeave={() => setHoveredTool(null)}
                    onClick={() => handleToolClick(tool)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        background: tool.bgGradient,
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {icons[tool.id]}
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {tool.isNew && (
                          <span style={{
                            padding: '2px 6px',
                            background: '#fef3c7',
                            color: '#f59e0b',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '600'
                          }}>
                            NEW
                          </span>
                        )}
                        {tool.isPremium && (
                          <span style={{
                            padding: '2px 6px',
                            background: '#ede9fe',
                            color: '#8b5cf6',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '600'
                          }}>
                            PRO
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(tool.id);
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          {icons.star}
                        </button>
                      </div>
                    </div>
                    <h3 style={{ 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      marginBottom: '8px' 
                    }}>
                      {tool.name}
                    </h3>
                    <p style={{ 
                      fontSize: '13px', 
                      color: '#6c757d',
                      lineHeight: '1.5',
                      marginBottom: '12px'
                    }}>
                      {tool.description}
                    </p>
                    <div style={{ 
                      fontSize: '11px', 
                      color: '#2563eb',
                      fontWeight: '500'
                    }}>
                      {tool.usageCount} 사용
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 전체 도구 */}
          <div>
            <h2 style={{ 
              fontSize: isMobile ? '20px' : '24px', 
              fontWeight: '600', 
              marginBottom: '16px'
            }}>
              {selectedCategory === 'all' ? '전체 도구' : categories.find(c => c.id === selectedCategory)?.name}
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '16px'
            }}>
              {regularTools.map((tool) => (
                <div
                  key={tool.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #dee2e6',
                    borderRadius: '16px',
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    transform: hoveredTool === tool.id ? 'translateY(-4px)' : 'translateY(0)',
                    boxShadow: hoveredTool === tool.id 
                      ? '0 10px 30px rgba(0,0,0,0.1)' 
                      : '0 2px 8px rgba(0,0,0,0.05)'
                  }}
                  onMouseEnter={() => setHoveredTool(tool.id)}
                  onMouseLeave={() => setHoveredTool(null)}
                  onClick={() => handleToolClick(tool)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: tool.bgGradient,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {icons[tool.id]}
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {tool.isNew && (
                        <span style={{
                          padding: '2px 6px',
                          background: '#fef3c7',
                          color: '#f59e0b',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '600'
                        }}>
                          NEW
                        </span>
                      )}
                      {tool.isPremium && (
                        <span style={{
                          padding: '2px 6px',
                          background: '#ede9fe',
                          color: '#8b5cf6',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '600'
                        }}>
                          PRO
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(tool.id);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          opacity: favorites.includes(tool.id) ? 1 : 0.3
                        }}
                      >
                        {favorites.includes(tool.id) ? icons.star : icons.starOutline}
                      </button>
                    </div>
                  </div>
                  <h3 style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    marginBottom: '8px' 
                  }}>
                    {tool.name}
                  </h3>
                  <p style={{ 
                    fontSize: '13px', 
                    color: '#6c757d',
                    lineHeight: '1.5',
                    marginBottom: '12px'
                  }}>
                    {tool.description}
                  </p>
                  <div style={{ 
                    fontSize: '11px', 
                    color: '#6c757d',
                    fontWeight: '500'
                  }}>
                    {tool.usageCount} 사용
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 하단 CTA */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            padding: isMobile ? '30px 20px' : '40px',
            marginTop: '40px',
            textAlign: 'center',
            color: '#ffffff',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <h3 style={{ 
              fontSize: isMobile ? '24px' : '28px', 
              fontWeight: '600', 
              marginBottom: '12px',
              background: 'linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              더 많은 도구가 필요하신가요?
            </h3>
            <p style={{ 
              fontSize: '16px',
              color: 'rgba(255, 255, 255, 0.95)',
              marginBottom: '24px',
              fontWeight: '400'
            }}>
              필요한 기능을 제안해주시면 추가해드립니다 / 소요기간 1~2주
            </p>
            <button style={{
              padding: '12px 32px',
              background: '#ffffff',
              color: '#667eea',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}>
              도구 제안하기
            </button>
          </div>
        </div>
      </div>

      {/* 도구 모달 */}
      <ToolModal 
        isOpen={modalOpen}
        onClose={handleCloseModal}
        toolId={selectedTool?.id}
        toolName={selectedTool?.name}
      />
    </>
  );
}

export default Tools;