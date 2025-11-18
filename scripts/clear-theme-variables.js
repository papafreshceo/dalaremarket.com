// 브라우저 콘솔에서 실행할 스크립트
// 모든 커스텀 테마 CSS 변수를 제거하여 원래 상태로 복구

const clearThemeVariables = () => {
  const root = document.documentElement;

  // 인라인 스타일에서 모든 CSS 변수 제거 (--로 시작하는 모든 변수)
  const inlineStyle = root.getAttribute('style');
  if (inlineStyle) {
    const cleaned = inlineStyle
      .split(';')
      .filter(rule => !rule.trim().startsWith('--'))
      .join(';');

    if (cleaned.trim()) {
      root.setAttribute('style', cleaned);
    } else {
      root.removeAttribute('style');
    }
  }

  // theme-enabled 클래스도 제거
  root.classList.remove('theme-enabled');
  root.classList.remove('dark');

  console.log('✅ 모든 테마 CSS 변수가 제거되었습니다. 원래 테마로 복구되었습니다.');
  console.log('💡 페이지를 새로고침(Ctrl+Shift+R)하는 것을 권장합니다.');
};

// 실행
clearThemeVariables();
