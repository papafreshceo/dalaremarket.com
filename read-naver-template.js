const XLSX = require('xlsx');

// 엑셀 파일 읽기
const workbook = XLSX.readFile('OptionCombinationNaver.xls');

// 모든 시트 이름 출력
console.log('=== 시트 목록 ===');
console.log(workbook.SheetNames);
console.log('');

// 각 시트의 데이터 출력
workbook.SheetNames.forEach(sheetName => {
  console.log(`=== 시트: ${sheetName} ===`);
  const worksheet = workbook.Sheets[sheetName];

  // JSON으로 변환 (헤더 포함)
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  // 처음 10행만 출력
  jsonData.slice(0, 10).forEach((row, index) => {
    console.log(`행 ${index + 1}:`, JSON.stringify(row));
  });

  console.log('');
});

// 범위 정보도 출력
console.log('=== 범위 정보 ===');
workbook.SheetNames.forEach(sheetName => {
  const worksheet = workbook.Sheets[sheetName];
  console.log(`${sheetName}: ${worksheet['!ref']}`);
});
