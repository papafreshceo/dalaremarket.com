// 도구 아이콘 컴포넌트들
export const toolIcons: Record<string, JSX.Element> = {
  'margin-calculator': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="3" width="16" height="18" rx="2" stroke="white" strokeWidth="2" fill="none"/>
      <line x1="7" y1="7" x2="17" y2="7" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="7" y1="11" x2="17" y2="11" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="7" y1="15" x2="14" y2="15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="17" cy="18" r="3" fill="white"/>
      <circle cx="16" cy="17.2" r="0.6" fill="#667eea"/>
      <circle cx="18" cy="18.8" r="0.6" fill="#667eea"/>
      <line x1="15.5" y1="18.5" x2="18.5" y2="16.5" stroke="#667eea" strokeWidth="0.4"/>
    </svg>
  ),
  'price-simulator': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="white" strokeWidth="2" fill="none"/>
      <path d="M7 15L10 12L13 14L17 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="7" cy="15" r="1.5" fill="white"/>
      <circle cx="10" cy="12" r="1.5" fill="white"/>
      <circle cx="13" cy="14" r="1.5" fill="white"/>
      <circle cx="17" cy="8" r="1.5" fill="white"/>
      <line x1="7" y1="7" x2="11" y2="7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
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
  'transaction-statement': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="white"/>
      <path d="M8 12H16V13.5H8V12ZM8 15H16V16.5H8V15ZM8 9H16V10.5H8V9Z" fill="white"/>
      <circle cx="17" cy="17" r="3" fill="white"/>
      <rect x="16" y="16" width="2" height="2" fill="#667eea"/>
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
  'category-rank-checker': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.5 21L2 9L4.5 9L7.5 16L10.5 9L13 9L7.5 21ZM17 3V13L22 13L17 21L17 13L12 13L17 3Z" fill="white"/>
    </svg>
  )
};

// 아이콘 가져오기 함수
export function getToolIcon(toolId: string, size: number = 24): JSX.Element | null {
  const icon = toolIcons[toolId];
  if (!icon) return null;

  // SVG 크기 조정
  return (
    <div style={{ width: `${size}px`, height: `${size}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {icon}
    </div>
  );
}
