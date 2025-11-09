// 필수 칼럼 검증 함수
export function validateRequiredColumns(data: any[]): string[] {
  const errors: string[] = [];

  data.forEach((row: any, index: number) => {
    const rowNumber = index + 2; // 엑셀 행 번호 (헤더 제외, 1부터 시작)

    // 수령인 검증
    if (!row['수령인'] || String(row['수령인']).trim() === '') {
      errors.push(`${rowNumber}번째 주문건의 '수령인' 값이 누락되었습니다`);
    }

    // 수령인전화번호 검증
    if (!row['수령인전화번호'] || String(row['수령인전화번호']).trim() === '') {
      errors.push(`${rowNumber}번째 주문건의 '수령인전화번호' 값이 누락되었습니다`);
    }

    // 주소 검증
    if (!row['주소'] || String(row['주소']).trim() === '') {
      errors.push(`${rowNumber}번째 주문건의 '주소' 값이 누락되었습니다`);
    }

    // 옵션상품 또는 옵션코드 검증 (둘 중 하나는 반드시 있어야 함)
    const hasOptionName = row['옵션상품'] && String(row['옵션상품']).trim() !== '';
    const hasOptionCode = row['옵션코드'] && String(row['옵션코드']).trim() !== '';
    if (!hasOptionName && !hasOptionCode) {
      errors.push(`${rowNumber}번째 주문건의 '옵션상품' 또는 '옵션코드' 값이 누락되었습니다`);
    }

    // 수량 검증
    if (!row['수량'] || String(row['수량']).trim() === '') {
      errors.push(`${rowNumber}번째 주문건의 '수량' 값이 누락되었습니다`);
    }
  });

  return errors;
}
