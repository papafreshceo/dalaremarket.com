// 옵션가 세팅 테스트 데이터 초기화 스크립트

const testData = {
  options: [
    { id: '1', name: '기본옵션', price: '10000', priceDiff: 0 },
    { id: '2', name: '프리미엄', price: '15000', priceDiff: 5000 },
    { id: '3', name: '스탠다드', price: '12000', priceDiff: 2000 }
  ],
  baseOptionId: '1'
};

const savedConfigs = [
  {
    name: '테스트설정',
    timestamp: new Date().toISOString()
  }
];

console.log('옵션가 세팅 테스트 데이터를 localStorage에 저장합니다...');
console.log('');
console.log('브라우저 콘솔에서 다음 코드를 실행하세요:');
console.log('');
console.log('localStorage.setItem("optionPricing_테스트설정", ' + JSON.stringify(JSON.stringify(testData)) + ');');
console.log('');
console.log('localStorage.setItem("optionPricing_savedConfigs", ' + JSON.stringify(JSON.stringify(savedConfigs)) + ');');
console.log('');
console.log('그런 다음 페이지를 새로고침하세요.');
