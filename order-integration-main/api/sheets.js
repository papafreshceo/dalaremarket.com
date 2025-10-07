const { 
  getSheetData, 
  updateSheetData, 
  appendSheetData, 
  clearSheet,
  createSheet,
  // 주문 시트 함수들
  createOrderSheet,
  clearOrderSheet,
  saveOrderData,
  mergeAndSaveOrderData,
  getOrderData,
  updateOrderCell,
  // 제품 시트 함수 추가
  getProductSheetData
} = require('../lib/google-sheets');

module.exports = async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action, sheetName, range, values } = req.body || req.query;

    switch (action) {

case 'saveCsRecord':
  try {
    const { data } = req.body;
    const ordersSpreadsheetId = process.env.SPREADSHEET_ID_ORDERS || '1UsUMd_haNOsRm2Yn8sFpFc7HUlJ_CEQ-91QctlkSjJg';
    
    console.log('CS 기록 저장 시작');
    
    // getOrderData 함수 사용 (주문 시트용 함수)
    let allData = [];
    let newRowNumber = 1;
    let todayMax = 0;
    
    try {
      // getOrderData는 주문 시트를 읽는 전용 함수
      
      allData = await getOrderData('CS기록!A:V', ordersSpreadsheetId);
      console.log('CS기록 데이터 행 수:', allData?.length);
      
      if (allData && allData.length > 1) {
        // 마지막 행의 연번 가져오기
        const lastRow = allData[allData.length - 1];
        if (lastRow && lastRow[0]) {
          const lastNumber = parseInt(lastRow[0]);
          if (!isNaN(lastNumber)) {
            newRowNumber = lastNumber + 1;
            console.log(`마지막 연번: ${lastNumber}, 새 연번: ${newRowNumber}`);
          } else {
            newRowNumber = allData.length;
          }
        } else {
          newRowNumber = allData.length;
        }
        
// 오늘 날짜 접수번호 최대값 찾기 - 한국 시간
const koreaToday = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
const dateStr = koreaToday.getFullYear() + 
  String(koreaToday.getMonth() + 1).padStart(2, '0') + 
  String(koreaToday.getDate()).padStart(2, '0');
        
        for (let i = 1; i < allData.length; i++) {
          if (allData[i] && allData[i][1]) {
            const receiptNo = String(allData[i][1]);
            if (receiptNo.startsWith(`CS${dateStr}`)) {
              const numStr = receiptNo.substring(10);
              const num = parseInt(numStr);
              if (!isNaN(num)) {
                todayMax = Math.max(todayMax, num);
              }
            }
          }
        }
      }
    } catch (error) {
      console.log('CS기록 읽기 실패, 첫 데이터로 처리:', error.message);
    }
    
// 접수번호 생성 - CS + 날짜 + 연번 (한국 시간)
const koreaDate = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
const dateStr = koreaDate.getFullYear() + 
  String(koreaDate.getMonth() + 1).padStart(2, '0') + 
  String(koreaDate.getDate()).padStart(2, '0');

// 오늘 날짜의 기존 CS 접수번호 확인하여 연번 생성
let sequenceNumber = 1;
for (let i = 1; i < allData.length; i++) {
  if (allData[i] && allData[i][1]) {
    const receiptNo = String(allData[i][1]);
    if (receiptNo.startsWith(`CS${dateStr}`)) {
      const seqStr = receiptNo.substring(10); // CS20250929XXX에서 XXX 추출
      const seq = parseInt(seqStr);
      if (!isNaN(seq) && seq >= sequenceNumber) {
        sequenceNumber = seq + 1;
      }
    }
  }
}

const receiptNumber = `CS${dateStr}${String(sequenceNumber).padStart(3, '0')}`;
    
    console.log(`최종 - 연번: ${newRowNumber}, 접수번호: ${receiptNumber}`);
    
    // CS기록 저장
        // CS기록 저장 (CS구분 추가로 인한 칼럼 순서 변경)
    // 전화번호 형식 유지 함수
    const formatPhoneNumber = (phone) => {
      if (!phone) return '';
      // 숫자만 추출
      let phoneStr = String(phone).replace(/[^0-9]/g, '');
      // 앞에 0이 없으면 추가
      if (phoneStr && !phoneStr.startsWith('0')) {
        phoneStr = '0' + phoneStr;
      }
      // 작은따옴표를 앞에 붙여 문자열로 저장
      return phoneStr ? `'${phoneStr}` : '';
    };
    
    const csRowData = [[
      newRowNumber,
      receiptNumber,
      data['마켓명'] || '',
      new Date().toLocaleDateString('ko-KR'),
      data['해결방법'] || '',
      data['재발송상품'] || '',
      data['재발송수량'] || '',
      data['CS구분'] || '',
      data['CS 내용'] || '',
      data['부분환불금액'] || '',
      data['결제일'] || '',
      data['주문번호'] || '',
      data['주문자'] || '',
      formatPhoneNumber(data['주문자 전화번호']),
      data['수령인'] || '',
      formatPhoneNumber(data['수령인 전화번호']),
      data['주소'] || '',
      data['배송메세지'] || '',
      data['옵션명'] || '',
      data['수량'] || '',
      data['특이/요청사항'] || '',
      data['발송요청일'] || '',     // V열: 발송요청일
      '접수',                       // W열: 상태
      parseFloat(String(data['추가금액'] || 0).replace(/,/g, '')) || 0  // X열: 상품금액 (천단위 쉼표 제거)
    ]];
    
    await appendSheetData('CS기록!A:X', csRowData, ordersSpreadsheetId);  // X까지 확장
  
    console.log('CS기록 저장 완료');
    
    // 재발송/부분재발송인 경우 주문접수

    if (data['해결방법'] === '재발송' || data['해결방법'] === '부분재발송') {
      const koreaTime = new Date().toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      // 전화번호 형식 유지 함수 (위에서 정의된 것 재사용)
      const formatPhone = (phone) => {
        if (!phone) return '';
        let phoneStr = String(phone).replace(/[^0-9]/g, '');
        if (phoneStr && !phoneStr.startsWith('0')) {
          phoneStr = '0' + phoneStr;
        }
        return phoneStr ? `'${phoneStr}` : '';
      };
      
      // 주문접수 헤더는 이미 고정되어 있음
      // 사용자이메일,접수번호,저장시간,마켓명,옵션명,수량,단가,택배비,상품금액,주문자,주문자 전화번호,수령인,수령인 전화번호,주소,배송메세지,특이/요청사항,발송요청일
      
      const tempRowData = [[
        data['userEmail'] || 'CS',           // 사용자이메일
        receiptNumber,                        // 접수번호  
        koreaTime,                           // 저장시간
        'CS발송',                            // 마켓명
        data['재발송상품'] || data['옵션명'] || '',  // 옵션명
        data['재발송수량'] || data['수량'] || '1',   // 수량
        '',                                   // 단가
        '',                                   // 택배비
        parseFloat(String(data['추가금액'] || 0).replace(/,/g, '')) || 0,   // 추가금액 (천단위 쉼표 제거)
        data['주문자'] || '',                // 주문자
        formatPhone(data['주문자 전화번호']), // 주문자 전화번호
        data['수령인'] || '',                // 수령인
        formatPhone(data['수령인 전화번호']), // 수령인 전화번호
        data['주소'] || '',                  // 주소
        data['배송메세지'] || '',            // 배송메세지
        data['특이/요청사항'] || '',    // 특이/요청사항
        data['발송요청일'] || '',        // 발송요청일
        '접수',                          // 상태
        ''                               // 입금확인
      ]];
      
      await appendSheetData('주문접수!A:S', tempRowData, ordersSpreadsheetId);
      console.log('주문접수 완료');
    }
    
    return res.status(200).json({
      success: true,
      message: 'CS 기록이 저장되었습니다',
      receiptNumber: receiptNumber
    });
    
  } catch (error) {
    console.error('saveCsRecord 오류:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'CS 기록 저장 실패'
    });
  }
case 'addCsOrder':
        try {
          const { data } = req.body;
          const ordersSpreadsheetId = process.env.SPREADSHEET_ID_ORDERS || '1UsUMd_haNOsRm2Yn8sFpFc7HUlJ_CEQ-91QctlkSjJg';
          
          console.log('CS 재발송 주문접수 시작:', data);
          
          // 주문접수 시트 확인 및 생성
          let tempHeaders = [];
          try {
              const tempData = await getOrderData('주문접수!1:1', ordersSpreadsheetId);
              if (tempData && tempData.length > 0) {
                  tempHeaders = tempData[0];
              }
          } catch (err) {
              // 시트가 없으면 생성
              console.log('주문접수 시트 생성 필요');
              await createOrderSheet('주문접수', ordersSpreadsheetId);
              tempHeaders = ['사용자이메일', '접수번호', '저장시간', '마켓명', '옵션명', '수량', '단가', '택배비', 
                            '상품금액', '주문자', '주문자 전화번호', '수령인', '수령인 전화번호', 
                            '주소', '배송메세지', '특이/요청사항', '발송요청일'];
              await saveOrderData('주문접수!A1', [tempHeaders], ordersSpreadsheetId);
          }
          
          // CS번호 생성 - 한국 시간
const koreaDate = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
const dateStr = koreaDate.getFullYear() + 
  String(koreaDate.getMonth() + 1).padStart(2, '0') + 
  String(koreaDate.getDate()).padStart(2, '0');
            
          let csNumber = 1;
          try {
              const existingData = await getOrderData('주문접수!A:C', ordersSpreadsheetId);
              if (existingData && existingData.length > 1) {
                  for (let i = 1; i < existingData.length; i++) {
                      const email = existingData[i][0] || '';
                      if (email.startsWith('CS')) {
                          const match = email.match(/CS(\d+)/);
                          if (match) {
                              const num = parseInt(match[1]);
                              if (num >= csNumber) {
                                  csNumber = num + 1;
                              }
                          }
                      }
                  }
              }
          } catch (err) {
              console.log('CS 번호 확인 실패, 기본값 사용');
          }
          
          const csOrderNumber = `${dateStr}CS${String(csNumber).padStart(3, '0')}`;
          
          // 주문접수 데이터 추가
          // 한국 시간 생성
          const koreaTime = new Date().toLocaleString('ko-KR', {
              timeZone: 'Asia/Seoul',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
          });
          
          // 전화번호 형식 유지
          const formatPhone = (phone) => {
            if (!phone) return '';
            let phoneStr = String(phone).replace(/[^0-9]/g, '');
            if (phoneStr && !phoneStr.startsWith('0')) {
              phoneStr = '0' + phoneStr;
            }
            return phoneStr ? `'${phoneStr}` : '';
          };
          
          const tempRowData = [[
              data['userEmail'] || '',                    // 사용자이메일
              data['receiptNumber'] || csOrderNumber,     // 접수번호
              koreaTime,                                  // 저장시간
              data['마켓명'] || 'CS재발송',              // 마켓명
              data['옵션명'] || '',                      // 옵션명
              data['수량'] || '1',                       // 수량
              '',                                         // 단가
              '',                                         // 택배비
              '',                                         // 상품금액
              data['주문자'] || '',                      // 주문자
              formatPhone(data['주문자 전화번호']),       // 주문자 전화번호
              data['수령인'] || '',                      // 수령인
              formatPhone(data['수령인 전화번호']),       // 수령인 전화번호
              data['주소'] || '',                        // 주소
              data['배송메세지'] || '',                  // 배송메세지
              data['특이/요청사항'] || '',               // 특이/요청사항
              data['발송요청일'] || ''                   // 발송요청일
          ]];
          
          await appendSheetData('주문접수!A:x', tempRowData, ordersSpreadsheetId);
          
          console.log('CS 재발송 주문접수 완료:', csOrderNumber);
          
          return res.status(200).json({
            success: true,
            message: 'CS 재발송이 주문접수되었습니다',
            csOrderNumber: csOrderNumber
          });
          
        } catch (error) {
          console.error('addCsOrder 오류:', error.message, error.stack);
          return res.status(500).json({
            success: false,
            error: error.message || 'CS 주문 접수 실패'
          });
        }

      case 'getProductData':
        try {
          const productSpreadsheetId = process.env.SPREADSHEET_ID_PRODUCTS || '17MGwbu1DZf5yg-BLhfZr-DO-OPiau3aeyBMtSssv7Sg';
          
          // getProductSheetData 사용 (주문 시트가 아닌 제품 시트 전용 함수)
          const productSheetData = await getProductSheetData(productSpreadsheetId, '통합상품마스터!A:DZ');
          const productInfo = {};
          
          if (productSheetData && productSheetData.length > 1) {
              const headers = productSheetData[0];
              const optionIdx = headers.indexOf('옵션명');
              
              for (let i = 1; i < productSheetData.length; i++) {
                  const optionName = String(productSheetData[i][optionIdx] || '').trim();
                  if (!optionName) continue;
                  
                  const rowData = {};
                  headers.forEach((header, idx) => {
                      if (header && header !== '옵션명') {
                          const value = productSheetData[i][idx];
                          if (header.includes('비용') || header.includes('가격') || header.includes('금액')) {
    // parseNumber 인라인 처리
    let numValue = 0;
    if (value !== null && value !== undefined && value !== '') {
        if (typeof value === 'number') {
            numValue = value;
        } else {
            let strValue = String(value).trim();
            strValue = strValue.replace(/[,₩￦$¥£€\s]/g, '');
            const num = parseFloat(strValue);
            numValue = isNaN(num) ? 0 : num;
        }
    }
    rowData[header] = numValue;
} else {
    rowData[header] = String(value || '').trim();
}
                      }
                  });
                  
                  productInfo[optionName] = rowData;
              }
          }
          
          return res.status(200).json({
              productData: productInfo,
              priceData: productInfo
          });
          
        } catch (error) {
          console.error('getProductData 오류:', error);
          return res.status(500).json({
              error: 'Failed to load product data',
              details: error.message
          });
        }

      case 'getOrdersByDate':
        try {
          const { sheetName, spreadsheetId } = req.body;
          
          
          const orderData = await getOrderData(`${sheetName}!A:ZZ`, spreadsheetId || process.env.SPREADSHEET_ID_ORDERS);
          
          if (!orderData || orderData.length < 2) {
            return res.status(200).json({ success: true, data: [] });
          }
          
          const headers = orderData[0];
          const rows = orderData.slice(1);
          
          const formattedData = rows.map(row => {
            const obj = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] || '';
            });
            return obj;
          });
          
          return res.status(200).json({ success: true, data: formattedData });
        } catch (error) {
          console.error('getOrdersByDate 오류:', error);
          return res.status(200).json({ success: true, data: [] });
        }

      case 'getTodayOrders':
        try {
          const today = new Date().toLocaleDateString('ko-KR', {
            timeZone: 'Asia/Seoul',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).replace(/\. /g, '').replace(/\./g, '').replace(/-/g, '');
          
          
          const targetSpreadsheetId = process.env.SPREADSHEET_ID_ORDERS;
          
          const orderData = await getOrderData(`${today}!A:ZZ`, targetSpreadsheetId);
          
          if (!orderData || orderData.length < 2) {
            return res.status(200).json({ success: true, data: [] });
          }
          
          const headers = orderData[0];
          const rows = orderData.slice(1);
          
          const formattedData = rows.map(row => {
            const obj = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] || '';
            });
            return obj;
          });
          
          const mappingData = await getSheetData('매핑!A:D');
          const colors = {};
          
          if (mappingData && mappingData.length > 2) {
            let headerRowIndex = -1;
            for (let i = 0; i < Math.min(5, mappingData.length); i++) {
              if (mappingData[i] && mappingData[i][0] === '마켓명') {
                headerRowIndex = i;
                break;
              }
            }
            
            if (headerRowIndex !== -1) {
              for (let i = headerRowIndex + 1; i < mappingData.length; i++) {
                const row = mappingData[i];
                if (row && row[0]) {
                  const marketName = String(row[0]).trim();
                  const colorValue = row[2] ? String(row[2]).trim() : '';
                  
                  if (marketName && colorValue) {
                    if (colorValue.match(/^\d+,\s*\d+,\s*\d+$/)) {
                      colors[marketName] = `rgb(${colorValue})`;
                    } else if (colorValue.startsWith('rgb(')) {
                      colors[marketName] = colorValue;
                    }
                  }
                }
              }
            }
          }
          
          return res.status(200).json({ 
            success: true, 
            data: formattedData,
            colors: colors
          });
          
        } catch (error) {
          console.error('getTodayOrders 오류:', error);
          return res.status(500).json({ 
            success: false, 
            error: error.message 
          });
        }

      case 'getOrdersByDateRange':
        try {
          const { startDate, endDate } = req.body;
          
          const targetSpreadsheetId = process.env.SPREADSHEET_ID_ORDERS;
          
          if (!startDate || !endDate) {
            
            
            const orderData = await getOrderData(`${today}!A:ZZ`, targetSpreadsheetId);
            
            if (!orderData || orderData.length < 2) {
              return res.status(200).json({ 
                success: true, 
                orders: [],
                colors: {},
                headers: []
              });
            }
            
            const headers = orderData[0];
            const rows = orderData.slice(1);
            
            const formattedData = rows.map((row, index) => {
              const obj = { '연번': index + 1 };
              headers.forEach((header, idx) => {
                obj[header] = row[idx] || '';
              });
              return obj;
            });
            
            const mappingData = await getSheetData('매핑!A:D');
            const colors = {};
            
            if (mappingData && mappingData.length > 2) {
              let headerRowIndex = -1;
              for (let i = 0; i < 5 && i < mappingData.length; i++) {
                if (mappingData[i] && mappingData[i][0] === '마켓명') {
                  headerRowIndex = i;
                  break;
                }
              }
              
              if (headerRowIndex !== -1) {
                for (let i = headerRowIndex + 1; i < mappingData.length; i++) {
                  const row = mappingData[i];
                  if (row && row[0]) {
                    const marketName = String(row[0]).trim();
                    const colorValue = row[2] ? String(row[2]).trim() : '';
                    
                    if (marketName && colorValue) {
                      if (colorValue.match(/^\d+,\s*\d+,\s*\d+$/)) {
                        colors[marketName] = `rgb(${colorValue})`;
                      } else if (colorValue.startsWith('rgb(')) {
                        colors[marketName] = colorValue;
                      }
                    }
                  }
                }
              }
            }
            
            return res.status(200).json({ 
              success: true, 
              orders: formattedData,
              colors: colors,
              headers: headers,
              totalCount: formattedData.length
            });
          }
          
          const orders = [];
          let allHeaders = new Set(['연번']);
          
          const start = new Date(startDate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'));
          const end = new Date(endDate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'));
          
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0].replace(/-/g, '');
            
            try {
              const dayData = await getOrderData(`${dateStr}!A:ZZ`, targetSpreadsheetId);
              
              if (dayData && dayData.length > 1) {
                const headers = dayData[0];
                headers.forEach(h => allHeaders.add(h));
                
                for (let i = 1; i < dayData.length; i++) {
                  const row = dayData[i];
                  const order = {};
                  
                  headers.forEach((header, index) => {
                    order[header] = row[index] || '';
                  });
                  
                  orders.push(order);
                }
              }
            } catch (err) {
              console.log(`날짜 ${dateStr} 시트 없음`);
            }
          }
          
          orders.forEach((order, index) => {
            order['연번'] = index + 1;
          });
          
          const mappingData = await getSheetData('매핑!A:D');
          const colors = {};
          
          if (mappingData && mappingData.length > 2) {
            let headerRowIndex = -1;
            for (let i = 0; i < 5 && i < mappingData.length; i++) {
              if (mappingData[i] && mappingData[i][0] === '마켓명') {
                headerRowIndex = i;
                break;
              }
            }
            
            if (headerRowIndex !== -1) {
              for (let i = headerRowIndex + 1; i < mappingData.length; i++) {
                const row = mappingData[i];
                if (row && row[0]) {
                  const marketName = String(row[0]).trim();
                  const colorValue = row[2] ? String(row[2]).trim() : '';
                  
                  if (marketName && colorValue) {
                    if (colorValue.match(/^\d+,\s*\d+,\s*\d+$/)) {
                      colors[marketName] = `rgb(${colorValue})`;
                    } else if (colorValue.startsWith('rgb(')) {
                      colors[marketName] = colorValue;
                    }
                  }
                }
              }
            }
          }
          
          return res.status(200).json({ 
            success: true, 
            orders: orders,
            colors: colors,
            headers: Array.from(allHeaders),
            totalCount: orders.length
          });
          
        } catch (error) {
          console.error('getOrdersByDateRange 오류:', error);
          return res.status(500).json({ 
            success: false, 
            error: error.message 
          });
        }

      case 'updateTracking':
        try {
          const { sheetName, updates } = req.body;
          const { getOrderData, updateOrderCell } = require('../lib/google-sheets');
          const targetSpreadsheetId = process.env.SPREADSHEET_ID_ORDERS;
          
          const headerData = await getOrderData(`${sheetName}!1:1`, targetSpreadsheetId);
          const headers = headerData[0];
          
          const orderNumCol = headers.indexOf('주문번호');
          const carrierCol = headers.indexOf('택배사');
          const trackingCol = headers.indexOf('송장번호');
          const dateCol = headers.indexOf('발송일(송장입력일)');
          
          const getColumnLetter = (col) => {
            let letter = '';
            let num = col;
            while (num >= 0) {
              letter = String.fromCharCode((num % 26) + 65) + letter;
              num = Math.floor(num / 26) - 1;
            }
            return letter;
          };
          
          const orderNumLetter = getColumnLetter(orderNumCol);
          const orderData = await getOrderData(`${sheetName}!${orderNumLetter}:${orderNumLetter}`, targetSpreadsheetId);
          
          const today = new Date().toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).replace(/\. /g, '-').replace(/\./g, '');
          
          let updateCount = 0;
          
          for (const update of updates) {
            let targetRow = -1;
            for (let i = 1; i < orderData.length; i++) {
              if (orderData[i][0] === update.orderNumber) {
                targetRow = i + 1;
                break;
              }
            }
            
            if (targetRow > 0) {
              if (update.carrier && carrierCol >= 0) {
                const cell = `${sheetName}!${getColumnLetter(carrierCol)}${targetRow}`;
                await updateOrderCell(cell, update.carrier, targetSpreadsheetId);
              }
              
              if (update.trackingNumber && trackingCol >= 0) {
                const cell = `${sheetName}!${getColumnLetter(trackingCol)}${targetRow}`;
                await updateOrderCell(cell, update.trackingNumber, targetSpreadsheetId);
              }
              
              if (update.trackingNumber && dateCol >= 0) {
                const cell = `${sheetName}!${getColumnLetter(dateCol)}${targetRow}`;
                await updateOrderCell(cell, today, targetSpreadsheetId);
              }
              
              updateCount++;
            }
          }
          
          return res.status(200).json({ 
            success: true, 
            updated: updateCount,
            message: `${updateCount}건의 송장번호가 업데이트되었습니다`
          });
          
         } catch (error) {
          console.error('updateTracking 오류:', error);
          return res.status(500).json({ 
            success: false, 
            error: error.message || '송장번호 업데이트 실패'
          });
        }



      case 'fetchVendorTemplates':
        try {
          const { range } = req.body;
          
          if (!range) {
            return res.status(400).json({ 
              success: false, 
              error: 'range가 필요합니다.' 
            });
          }
          
          // 환경변수에서 SPREADSHEET_ID 가져오기
          const spreadsheetId = process.env.SPREADSHEET_ID || '1kLjYKemytOfaH6kSXD7dqdiolx3j09Ir-V9deEnNImA';
          
          // getSheetData 함수 사용 (이미 import 되어 있음)
          const templateData = await getSheetData(range, spreadsheetId);
          
          if (!templateData || templateData.length === 0) {
            return res.status(200).json({ 
              success: true, 
              data: [] 
            });
          }
          
          return res.status(200).json({ 
            success: true, 
            data: templateData
          });
          
        } catch (error) {
          console.error('벤더 템플릿 조회 오류:', error);
          return res.status(500).json({ 
            success: false, 
            error: error.message || '벤더 템플릿 조회 실패'
          });
        }

     

      case 'getVendorTemplates':
        try {
          const { range } = req.body;
          
          if (!range) {
            return res.status(400).json({ 
              success: false, 
              error: 'range가 필요합니다.' 
            });
          }
          
          // 환경변수에서 SPREADSHEET_ID 가져오기
          const templateData = await getSheetData(range);
          
          if (!templateData || templateData.length === 0) {
            return res.status(200).json({ 
              success: true, 
              data: [] 
            });
          }
          
          return res.status(200).json({ 
            success: true, 
            data: templateData
          });
          
        } catch (error) {
          console.error('벤더 템플릿 조회 오류:', error);
          return res.status(500).json({ 
            success: false, 
            error: error.message || '벤더 템플릿 조회 실패'
          });
        }

      case 'getMarketFormats':
        try {
          const formatData = await getSheetData('마켓별송장업로드양식!A:Z');
          
          const formats = {};
          
          if (formatData && formatData.length > 0) {
            const markets = formatData[0].filter(cell => cell);
            
            markets.forEach((market, colIndex) => {
              formats[market] = [];
              for (let rowIndex = 1; rowIndex < formatData.length; rowIndex++) {
                const field = formatData[rowIndex][colIndex];
                if (field) {
                  formats[market].push(field);
                }
              }
            });
          }
          
          if (Object.keys(formats).length === 0) {
            formats['쿠팡'] = ['주문번호', '택배사', '송장번호'];
            formats['네이버'] = ['상품주문번호', '택배사코드', '송장번호'];
            formats['11번가'] = ['배송번호', '택배사', '송장번호'];
            formats['지마켓'] = ['주문번호', '택배사', '운송장번호'];
            formats['옥션'] = ['주문번호', '택배사', '운송장번호'];
            formats['인터파크'] = ['주문번호', '택배사', '송장번호'];
            formats['티몬'] = ['주문번호', '택배사', '송장번호'];
            formats['위메프'] = ['주문번호', '택배사', '송장번호'];
          }
          
          return res.status(200).json({ 
            success: true, 
            formats: formats 
          });
          
        } catch (error) {
          console.error('getMarketFormats 오류:', error);
          return res.status(200).json({ 
            success: true, 
            formats: {
              '쿠팡': ['주문번호', '택배사', '송장번호'],
              '네이버': ['상품주문번호', '택배사코드', '송장번호'],
              '11번가': ['배송번호', '택배사', '송장번호']
            }
          });
        }

      case 'getMarketData':
        try {
          const { useMainSpreadsheet } = req.body;
          
          if (useMainSpreadsheet) {
            const today = new Date().toLocaleDateString('ko-KR', {
              timeZone: 'Asia/Seoul',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            }).replace(/\. /g, '').replace(/\./g, '').replace(/-/g, '');
            
            
            let orderData = [];
            
            try {
              const rawOrderData = await getOrderData(`${today}!A:ZZ`, process.env.SPREADSHEET_ID_ORDERS);
              
              if (rawOrderData && rawOrderData.length >= 2) {
                const headers = rawOrderData[0];
                const rows = rawOrderData.slice(1);
                
                orderData = rows.map(row => {
                  const obj = {};
                  headers.forEach((header, index) => {
                    obj[header] = row[index] || '';
                  });
                  return obj;
                });
              }
            } catch (orderError) {
              console.log('주문 데이터 로드 실패:', orderError.message);
            }
            
            let markets = [];
            let colors = {};
            
            try {
              const mappingData = await getSheetData('매핑!A:D');
              
              if (mappingData && mappingData.length > 2) {
                let headerRowIndex = -1;
                for (let i = 0; i < Math.min(5, mappingData.length); i++) {
                  if (mappingData[i] && mappingData[i][0] === '마켓명') {
                    headerRowIndex = i;
                    break;
                  }
                }
                
                if (headerRowIndex !== -1) {
                  for (let i = headerRowIndex + 1; i < mappingData.length; i++) {
                    const row = mappingData[i];
                    if (row && row[0]) {
                      const marketName = String(row[0]).trim();
                      const colorValue = row[2] ? String(row[2]).trim() : '';
                      
                      if (marketName) {
                        markets.push(marketName);
                        
                        if (colorValue) {
                          if (colorValue.match(/^\d+,\s*\d+,\s*\d+$/)) {
                            colors[marketName] = `rgb(${colorValue})`;
                          } else if (colorValue.startsWith('rgb(')) {
                            colors[marketName] = colorValue;
                          }
                        }
                      }
                    }
                  }
                }
              }
            } catch (mappingError) {
              console.log('매핑 데이터 로드 실패:', mappingError.message);
            }
            
            return res.status(200).json({ 
              success: true,
              data: orderData,
              markets: markets,
              colors: colors
            });
            
          } else {
            const mappingData = await getSheetData('매핑!A:D');
            
            const markets = [];
            const colors = {};
            
            if (mappingData && mappingData.length > 2) {
              let headerRowIndex = -1;
              for (let i = 0; i < Math.min(5, mappingData.length); i++) {
                if (mappingData[i] && mappingData[i][0] === '마켓명') {
                  headerRowIndex = i;
                  break;
                }
              }
              
              if (headerRowIndex !== -1) {
                for (let i = headerRowIndex + 1; i < mappingData.length; i++) {
                  const row = mappingData[i];
                  if (row && row[0]) {
                    const marketName = String(row[0]).trim();
                    const colorValue = row[2] ? String(row[2]).trim() : '';
                    
                    if (marketName) {
                      markets.push(marketName);
                      
                      if (colorValue) {
                        if (colorValue.match(/^\d+,\s*\d+,\s*\d+$/)) {
                          colors[marketName] = `rgb(${colorValue})`;
                        } else if (colorValue.startsWith('rgb(')) {
                          colors[marketName] = colorValue;
                        }
                      }
                    }
                  }
                }
              }
            }
            
            return res.status(200).json({ 
              success: true, 
              markets: markets.length > 0 ? markets : ['쿠팡', '네이버', '11번가'],
              colors: colors
            });
          }
        } catch (error) {
          console.error('getMarketData 오류:', error);
          return res.status(200).json({ 
            success: true, 
            markets: ['쿠팡', '네이버', '11번가'],
            colors: {}
          });
        }


case 'checkCsDuplicate':
  try {
    const { orderData } = req.body;
    const ordersSpreadsheetId = process.env.SPREADSHEET_ID_ORDERS || '1UsUMd_haNOsRm2Yn8sFpFc7HUlJ_CEQ-91QctlkSjJg';
    
    let csRecordExists = false;
    let tempSaveExists = false;
    
    // CS기록 시트 체크 - getOrderData 사용
    try {
      
      const csData = await getOrderData('CS기록!A:V', ordersSpreadsheetId);
      
      if (csData && csData.length > 1) {
        // 헤더 인덱스 찾기 (첫 번째 행이 헤더)
        const headers = csData[0];
        const orderNoIdx = 11;  // L열: 주문번호 (CS구분 추가로 +1)
        const ordererIdx = 12;  // M열: 주문자
        const receiverIdx = 14; // O열: 수령인
        const optionIdx = 18;   // S열: 옵션명
        
        // 2행부터 데이터 검사
        for (let i = 1; i < csData.length; i++) {
          const row = csData[i];
          if (!row) continue;
          
          const orderNoMatch = (row[orderNoIdx] || '') === (orderData.주문번호 || '');
          const ordererMatch = (row[ordererIdx] || '') === (orderData.주문자 || '');
          const receiverMatch = (row[receiverIdx] || '') === (orderData.수령인 || '');
          const optionMatch = (row[optionIdx] || '') === (orderData.옵션명 || '');
          
          if (orderNoMatch && ordererMatch && receiverMatch && optionMatch) {
            csRecordExists = true;
            console.log('CS기록 중복 발견:', {
              주문번호: row[orderNoIdx],
              주문자: row[ordererIdx],
              수령인: row[receiverIdx],
              옵션명: row[optionIdx]
            });
            break;
          }
        }
      }
    } catch (err) {
      console.log('CS기록 체크 실패:', err.message);
    }
    
    // 주문접수 시트 체크
    try {
      
      const tempData = await getOrderData('주문접수!A:Q', ordersSpreadsheetId);
      
      if (tempData && tempData.length > 1) {
        for (let i = 1; i < tempData.length; i++) {
          const row = tempData[i];
          if (!row) continue;
          
          const optionMatch = (row[4] || '') === (orderData.옵션명 || '');
          const ordererMatch = (row[9] || '') === (orderData.주문자 || '');
          const receiverMatch = (row[11] || '') === (orderData.수령인 || '');
          
          if (optionMatch && ordererMatch && receiverMatch) {
            tempSaveExists = true;
            console.log('주문접수 중복 발견');
            break;
          }
        }
      }
    } catch (err) {
      console.log('주문접수 체크 실패:', err.message);
    }
    
    console.log('중복 체크 결과:', { csRecord: csRecordExists, tempSave: tempSaveExists });
    
    return res.status(200).json({
      success: true,
      duplicate: {
        csRecord: csRecordExists,
        tempSave: tempSaveExists
      }
    });
    
  } catch (error) {
    console.error('checkCsDuplicate 오류:', error);
    return res.status(200).json({
      success: true,
      duplicate: { csRecord: false, tempSave: false }
    });
  }



  case 'getExistingCsRecord':
  try {
    const { orderData } = req.body;
    const ordersSpreadsheetId = process.env.SPREADSHEET_ID_ORDERS || '1UsUMd_haNOsRm2Yn8sFpFc7HUlJ_CEQ-91QctlkSjJg';
    
    
    const csData = await getOrderData('CS기록!A:W', ordersSpreadsheetId);
    
    if (csData && csData.length > 1) {
      // 주문번호로 찾기 (L열 = 11번 인덱스) - CS구분 추가로 인해 한 칸 밀림
      for (let i = 1; i < csData.length; i++) {
        const row = csData[i];
        if (row && row[11] === orderData.주문번호) {
          // CS 레코드 찾음
          const csRecord = {
            연번: row[0],
            접수번호: row[1],
            마켓명: row[2],
            접수일: row[3],
            해결방법: row[4],
            재발송상품: row[5],
            재발송수량: row[6],
            'CS구분': row[7],  // CS구분 추가
            'CS 내용': row[8],  // 인덱스 조정
            부분환불금액: row[9],
            결제일: row[10],
            주문번호: row[11],
            주문자: row[12],
            '주문자 전화번호': row[13],
            수령인: row[14],
            '수령인 전화번호': row[15],
            주소: row[16],
            배송메세지: row[17],
            옵션명: row[18],
            수량: row[19],
            '특이/요청사항': row[20],
            발송요청일: row[21],
            상태: row[22] || '접수',
            rowIndex: i + 1  // 시트 행 번호 (수정용)
          };
          
          return res.status(200).json({
            success: true,
            csRecord: csRecord
          });
        }
      }
    }
    
    return res.status(200).json({
      success: true,
      csRecord: null
    });
    
  } catch (error) {
    console.error('getExistingCsRecord 오류:', error);
    return res.status(200).json({
      success: true,
      csRecord: null
    });
  }

case 'updateCsRecord':
  try {
    const { data, rowIndex } = req.body;
    const ordersSpreadsheetId = process.env.SPREADSHEET_ID_ORDERS || '1UsUMd_haNOsRm2Yn8sFpFc7HUlJ_CEQ-91QctlkSjJg';
    
    // 전화번호 형식 유지 함수
    const formatPhoneNumber = (phone) => {
      if (!phone) return '';
      let phoneStr = String(phone).replace(/[^0-9]/g, '');
      if (phoneStr && !phoneStr.startsWith('0')) {
        phoneStr = '0' + phoneStr;
      }
      return phoneStr ? `'${phoneStr}` : '';
    };
    
    // 업데이트할 데이터 준비 (CS구분 포함)
    const updateData = [[
      data.연번 || rowIndex - 1,
      data.접수번호,
      data['마켓명'] || '',
      data.접수일 || new Date().toLocaleDateString('ko-KR'),
      data['해결방법'] || '',
      data['재발송상품'] || '',
      data['재발송수량'] || '',
      data['CS구분'] || '',  // H열: CS구분
      data['CS 내용'] || '',  // I열: CS 내용
      data['부분환불금액'] || '',
      data['결제일'] || '',
      data['주문번호'] || '',
      data['주문자'] || '',
      formatPhoneNumber(data['주문자 전화번호']),
      data['수령인'] || '',
      formatPhoneNumber(data['수령인 전화번호']),
      data['주소'] || '',
      data['배송메세지'] || '',
      data['옵션명'] || '',
      data['수량'] || '',
      data['특이/요청사항'] || '',
      data['발송요청일'] || '',
      '수정',  // W열: 상태
      parseFloat(String(data['추가금액'] || 0).replace(/,/g, '')) || 0  // X열: 추가금액
    ]];
    
    await updateSheetData(`CS기록!A${rowIndex}:X${rowIndex}`, updateData, ordersSpreadsheetId);
    
    return res.status(200).json({
      success: true,
      message: 'CS 기록이 수정되었습니다'
    });
    
  } catch (error) {
    console.error('updateCsRecord 오류:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'CS 기록 수정 실패'
    });
  }



  
case 'getCsRecords':
  try {
    const ordersSpreadsheetId = process.env.SPREADSHEET_ID_ORDERS || '1UsUMd_haNOsRm2Yn8sFpFc7HUlJ_CEQ-91QctlkSjJg';
    
    console.log('getCsRecords 시작, spreadsheetId:', ordersSpreadsheetId);
    
    // CS기록 시트의 모든 데이터 가져오기
    let csData;
    try {
      csData = await getSheetData('CS기록!A:W', ordersSpreadsheetId);  // V를 W로 변경 (CS구분 칼럼 추가로 인해)
      console.log('CS기록 원본 데이터 길이:', csData?.length);
      console.log('첫 3행 데이터:', csData?.slice(0, 3));
    } catch (error) {
      console.error('CS기록 시트 읽기 실패:', error);
      return res.status(200).json({ 
        success: true, 
        data: [],
        error: error.message 
      });
    }
    
    if (!csData || csData.length < 2) {
      console.log('데이터 없음 또는 헤더만 있음');
      return res.status(200).json({ 
        success: true, 
        data: [] 
      });
    }
    
    // 헤더 정의
    const headers = [
      '연번', '접수번호', '마켓명', '접수일', '해결방법', 
      '재발송상품', '재발송수량', 'CS구분', 'CS 내용', '부분환불금액', 
      '결제일', '주문번호', '주문자', '주문자 전화번호', 
      '수령인', '수령인 전화번호', '주소', '배송메세지', 
      '옵션명', '수량', '특이/요청사항', '발송요청일', '상태'
    ];
    
    // 데이터 행만 추출 (첫 번째 행 헤더 제외)
    const dataRows = csData.slice(1);
    console.log('데이터 행 수:', dataRows.length);
    
    // 데이터를 객체 배열로 변환
    const formattedData = dataRows.map((row, index) => {
      const obj = {};
      headers.forEach((header, idx) => {
        obj[header] = row[idx] || '';
      });
      
      // 추가 필드 설정
      obj['처리일시'] = obj['접수일'];
      obj['CS사유'] = obj['CS 내용'];
      obj['처리내용'] = obj['해결방법'];
      obj['처리상태'] = obj['상태'] || '접수';
      obj['담당자'] = '-';
      
      return obj;
    }).filter((row, index) => {
      // 빈 행 필터링 - 최소한 하나의 필드라도 값이 있어야 함
      const hasData = row['연번'] || row['접수번호'] || row['주문번호'] || row['마켓명'];
      if (!hasData) {
        console.log(`행 ${index + 2} 제거됨 - 빈 행`);
      }
      return hasData;
    });
    
    console.log('최종 CS기록 개수:', formattedData.length);
    if (formattedData.length > 0) {
      console.log('첫 번째 레코드:', formattedData[0]);
    }
    
    return res.status(200).json({ 
      success: true, 
      data: formattedData 
    });
    
  } catch (error) {
    console.error('getCsRecords 전체 오류:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'CS 기록 조회 실패' 
    });
  }




        case 'updateCsStatus':
        try {
          const { orderNumber, status } = req.body;
          const ordersSpreadsheetId = process.env.SPREADSHEET_ID_ORDERS || '1UsUMd_haNOsRm2Yn8sFpFc7HUlJ_CEQ-91QctlkSjJg';
          
          // CS기록 시트 데이터 가져오기
          const csData = await getSheetData('CS기록!A:T', ordersSpreadsheetId);
          
          if (!csData || csData.length < 2) {
            return res.status(404).json({ 
              success: false, 
              error: '데이터를 찾을 수 없습니다.' 
            });
          }
          
          // 주문번호 컬럼 찾기
          const headers = csData[0];
          const orderNoIndex = headers.indexOf('주문번호');
          const statusIndex = headers.indexOf('처리상태');
          
          if (orderNoIndex === -1) {
            return res.status(400).json({ 
              success: false, 
              error: '주문번호 컬럼을 찾을 수 없습니다.' 
            });
          }
          
          // 해당 주문번호 행 찾기
          let rowIndex = -1;
          for (let i = 1; i < csData.length; i++) {
            if (csData[i][orderNoIndex] === orderNumber) {
              rowIndex = i + 1; // 시트는 1부터 시작
              break;
            }
          }
          
          if (rowIndex === -1) {
            return res.status(404).json({ 
              success: false, 
              error: '해당 주문번호를 찾을 수 없습니다.' 
            });
          }
          
          // 처리상태 업데이트
          const range = `CS기록!T${rowIndex}`; // T열이 처리상태 (실제 컬럼 위치에 맞게 조정 필요)
          await updateSheetData(range, [[status]], ordersSpreadsheetId);
          
          return res.status(200).json({ 
            success: true, 
            message: '상태가 업데이트되었습니다.' 
          });
          
        } catch (error) {
          console.error('updateCsStatus 오류:', error);
          return res.status(500).json({ 
            success: false, 
            error: error.message || 'CS 상태 업데이트 실패' 
          });
        }


        case 'getTempOrders':
    try {
        const { userEmail } = req.body;
        const ordersSpreadsheetId = process.env.SPREADSHEET_ID_ORDERS;
        
        const tempData = await getSheetData('주문접수', ordersSpreadsheetId);
        
        if (!tempData || tempData.length < 2) {
            return res.status(200).json({ success: true, orders: [] });
        }


        const userOrders = [];
        console.log(`getTempOrders: 전체 ${tempData.length}행 중 ${userEmail} 검색`);
        
        for (let i = 1; i < tempData.length; i++) {
            if (tempData[i] && tempData[i][0]) {
                // U열(20): 삭제, V열(21): 삭제일시, W열(22): 이관, X열(23): 이관일시
                const isDeleted = tempData[i][20] === 'Y';  // U열: 삭제 플래그
                const isTransferred = tempData[i][22] === 'Y';  // W열: 이관 플래그
                
                // 삭제되거나 이관된 주문은 제외
                if (isDeleted || isTransferred) {
                    console.log(`행 ${i} 제외 - 삭제: ${isDeleted}, 이관: ${isTransferred}`);
                    continue;
                }
                
                userOrders.push({
                    사용자이메일: tempData[i][0],
                    접수번호: tempData[i][1],
                    주문번호: tempData[i][2],
                    마켓명: tempData[i][3],
                    옵션명: tempData[i][4],
                    수량: parseInt(tempData[i][5]) || 1,
                    단가: parseFloat(tempData[i][6]) || 0,
                    택배비: parseFloat(tempData[i][7]) || 0,
                    상품금액: parseFloat(tempData[i][8]) || 0,
                    주문자: tempData[i][9],
                    '주문자 전화번호': tempData[i][10],
                    수령인: tempData[i][11],
                    '수령인 전화번호': tempData[i][12],
                    주소: tempData[i][13],
                    배송메세지: tempData[i][14],
                    '특이/요청사항': tempData[i][15],
                    발송요청일: tempData[i][16] || '',
                    상태: tempData[i][17] || '',
                    입금확인: tempData[i][18] || '',
                    삭제: tempData[i][20] || '',  // U열
                    삭제일시: tempData[i][21] || '',  // V열
                    이관: tempData[i][22] || '',  // W열
                    이관일시: tempData[i][23] || ''  // X열
                });
            }
        }
        
        console.log(`주문접수 조회 결과: ${userOrders.length}건`);
        return res.status(200).json({ success: true, orders: userOrders });
        
    } catch (error) {
        console.error('getTempOrders 오류:', error);
        return res.status(500).json({ success: false, error: error.message });
    }


    case 'markAsDeleted':
    try {
        const { userEmail, orderIndex, orderId, deleteFlag, deleteTime } = req.body;
        const ordersSpreadsheetId = process.env.SPREADSHEET_ID_ORDERS || '1UsUMd_haNOsRm2Yn8sFpFc7HUlJ_CEQ-91QctlkSjJg';
        
        console.log('markAsDeleted 시작:', { userEmail, orderIndex, orderId, deleteFlag });
        
        // 주문접수 데이터 가져오기
        const tempData = await getOrderData('주문접수!A:V', ordersSpreadsheetId);
        
        if (!tempData || tempData.length < 2) {
            return res.status(200).json({ 
                success: false, 
                error: '주문접수 데이터가 없습니다' 
            });
        }
        
        // 사용자 이메일과 주문번호로 찾기
        let targetRowIndex = -1;
        let currentUserOrderIndex = 0;
        
        for (let i = 1; i < tempData.length; i++) {
            if (tempData[i][0] === userEmail) {
                // 접수번호(인덱스 1) 또는 주문번호로 매칭
                if (tempData[i][1] === orderId || currentUserOrderIndex === orderIndex) {
                    targetRowIndex = i;
                    break;
                }
                currentUserOrderIndex++;
            }
        }
        
        if (targetRowIndex === -1) {
            return res.status(200).json({ 
                success: false, 
                error: '주문을 찾을 수 없습니다' 
            });
        }
        
        const rowNumber = targetRowIndex + 1; // 시트는 1부터 시작
        console.log(`삭제 플래그 설정: 행 ${rowNumber}`);
        
        // U열: 삭제 플래그, V열: 삭제일시
        await updateOrderCell(
            `주문접수!U${rowNumber}`, 
            deleteFlag || 'Y', 
            ordersSpreadsheetId
        );
        
        await updateOrderCell(
            `주문접수!V${rowNumber}`, 
            deleteTime || new Date().toLocaleString('ko-KR'), 
            ordersSpreadsheetId
        );
        
        return res.status(200).json({ 
            success: true, 
            message: '주문이 삭제되었습니다' 
        });
        
    } catch (error) {
        console.error('markAsDeleted 오류:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message || '삭제 플래그 설정 실패' 
        });
    }


    case 'updatePaymentConfirmation':
  try {
    const { userEmail, orderIndex, confirmTime } = req.body;
    const ordersSpreadsheetId = process.env.SPREADSHEET_ID_ORDERS || '1UsUMd_haNOsRm2Yn8sFpFc7HUlJ_CEQ-91QctlkSjJg';
    
    console.log('updatePaymentConfirmation 시작:', { userEmail, orderIndex, confirmTime });
    
    // 기존 getOrderData 함수 사용 (주문 시트 전용 함수)
    const tempData = await getOrderData('주문접수!A:S', ordersSpreadsheetId);
    
    if (!tempData || tempData.length === 0) {
      return res.json({ success: false, error: '데이터 없음' });
    }
    
    // 사용자 이메일로 필터링하고 해당 인덱스 찾기
    let targetRowIndex = -1;
    let currentUserOrderIndex = 0;
    
    for (let i = 1; i < tempData.length; i++) {
      if (tempData[i][0] === userEmail) {
        if (currentUserOrderIndex === orderIndex) {
          targetRowIndex = i;
          break;
        }
        currentUserOrderIndex++;
      }
    }
    
    if (targetRowIndex === -1) {
      return res.json({ success: false, error: '주문을 찾을 수 없습니다' });
    }
    
    console.log('대상 행 찾음:', targetRowIndex + 1);
    
    // 전체 데이터 복사
    const allData = [...tempData];
    
    // 해당 행의 S열(18번 인덱스)에 입금확인 시간 추가
    if (!allData[targetRowIndex]) {
      allData[targetRowIndex] = [];
    }
    
    // S열까지 채우기
    while (allData[targetRowIndex].length < 19) {
      allData[targetRowIndex].push('');
    }
    
    allData[targetRowIndex][18] = confirmTime;
    
    // 전체 시트 덮어쓰기
    await clearOrderSheet('주문접수!A:S', ordersSpreadsheetId);
    await saveOrderData('주문접수!A1', allData, ordersSpreadsheetId);
    
    console.log('입금확인 업데이트 완료');
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('입금확인 업데이트 오류:', error);
    res.json({ success: false, error: error.message });
  }
  break;
  

    case 'appendTempOrder':
    try {
        const { userEmail, orderData } = req.body;
        const ordersSpreadsheetId = process.env.SPREADSHEET_ID_ORDERS;
        
        // 전화번호 형식 보존
        const formatPhone = (phone) => {
            if (!phone) return '';
            let phoneStr = String(phone).replace(/[^0-9]/g, '');
            if (phoneStr && !phoneStr.startsWith('0')) {
                phoneStr = '0' + phoneStr;
            }
            return phoneStr ? `'${phoneStr}` : '';
        };
        
        const koreaTime = new Date().toLocaleString('ko-KR', {
            timeZone: 'Asia/Seoul',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
// 접수번호 생성 - PH + 날짜 + 연번 (한국 시간 기준)
const koreaDate = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
const dateStr = koreaDate.getFullYear() + 
    String(koreaDate.getMonth() + 1).padStart(2, '0') + 
    String(koreaDate.getDate()).padStart(2, '0');

// 오늘 날짜의 기존 PH 주문 확인하여 연번 생성
let sequenceNumber = 1;
try {
    const existingData = await getOrderData('주문접수!A:C', ordersSpreadsheetId);
    if (existingData && existingData.length > 1) {
        for (let i = 1; i < existingData.length; i++) {
            const receiptNo = existingData[i][1] || '';
            if (receiptNo.startsWith(`PH${dateStr}`)) {
                const seqStr = receiptNo.substring(10); // PH20250929XXX에서 XXX 추출
                const seq = parseInt(seqStr);
                if (!isNaN(seq) && seq >= sequenceNumber) {
                    sequenceNumber = seq + 1;
                }
            }
        }
    }
} catch (err) {
    console.log('연번 확인 실패, 기본값 사용');
}

const receiptNumber = `PH${dateStr}${String(sequenceNumber).padStart(3, '0')}`;

const tempData = [[
    userEmail,
    receiptNumber,  // 접수번호
    koreaTime,      // 저장시간
    orderData.마켓명,
    orderData.옵션명,
    orderData.수량,
    orderData.단가,
    orderData.택배비,
    orderData.상품금액,
    orderData.주문자,
    formatPhone(orderData['주문자 전화번호']),
    orderData.수령인,
    formatPhone(orderData['수령인 전화번호']),
    orderData.주소,
    orderData.배송메세지,
    orderData['특이/요청사항'] || '',
    orderData.발송요청일 || '',
    '',  // 상태
    ''   // 입금확인
]];

await appendSheetData('주문접수!A:S', tempData, ordersSpreadsheetId);

return res.status(200).json({ 
    success: true,
    receiptNumber: receiptNumber,
    orderTime: koreaTime
});

    } catch (error) {
        console.error('appendTempOrder 오류:', error);
        return res.status(500).json({ success: false, error: error.message });
    }







case 'deleteTempOrders':
    try {
        const { userEmail } = req.body;
        const ordersSpreadsheetId = process.env.SPREADSHEET_ID_ORDERS;
        const tempData = await getOrderData('주문접수!A:S', ordersSpreadsheetId);
        
        if (!tempData || tempData.length < 2) {
            return res.status(200).json({ success: true });
        }
        
        const newData = [tempData[0]];
        
        for (let i = 1; i < tempData.length; i++) {
            if (tempData[i][0] !== userEmail) {
                newData.push(tempData[i]);
            }
        }
        
        await clearOrderSheet('주문접수!A:S');
        if (newData.length > 0) {
            await saveOrderData('주문접수!A1', newData);
        }
        
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('deleteTempOrders 오류:', error);
        return res.status(500).json({ success: false, error: error.message });
    }









      case 'saveToSheet':
        const sheetResult = await createOrderSheet(sheetName);
        
        const headerRow = values[0];
        const dataRows = values.slice(1);
        
        const marketColorMap = req.body.marketColors || {};
        
        const result = await mergeAndSaveOrderData(
          sheetName, 
          dataRows, 
          headerRow,
          marketColorMap
        );
        
        return res.status(200).json({ 
          success: true, 
          sheetName: sheetName,
          ...result
        });

      case 'appendToSheet':
        const appendResult = await appendSheetData(range, values);
        return res.status(200).json({ 
          success: true, 
          result: appendResult 
        });

case 'updateTransferFlag':
        try {
          const { userEmail, orderIds, transferFlag, transferTime } = req.body;
          const ordersSpreadsheetId = process.env.SPREADSHEET_ID_ORDERS || '1UsUMd_haNOsRm2Yn8sFpFc7HUlJ_CEQ-91QctlkSjJg';
          
          // 전체 데이터 가져오기
          const allData = await getOrderData('주문접수!A:X', ordersSpreadsheetId);
          
          if (!allData || allData.length < 2) {
            return res.status(200).json({ 
              success: true, 
              message: '주문접수 데이터가 없습니다'
            });
          }
          
          let updateCount = 0;
          
          console.log('=== updateTransferFlag 디버깅 ===');
          console.log('요청 데이터:', {
              userEmail: userEmail,
              orderIds: orderIds,
              totalRows: allData.length - 1
          });

          // 각 행별로 개별 업데이트
          for (let i = 1; i < allData.length; i++) {
              const rowEmail = allData[i][0];
              const rowOrderId = allData[i][1];  // 접수번호
              
              console.log(`행 ${i}:`, {
                  이메일: rowEmail,
                  접수번호: rowOrderId,
                  이메일일치: rowEmail === userEmail,
                  접수번호포함: orderIds.includes(rowOrderId)
              });
              
              if (rowEmail === userEmail && orderIds.includes(rowOrderId)) {
                  const rowNumber = i + 1; // 시트는 1부터 시작
                  
                  try {
                      // W열: 이관 플래그 (updateOrderCell 이미 import됨)
                      await updateOrderCell(
                          `주문접수!W${rowNumber}`, 
                          'Y', 
                          ordersSpreadsheetId
                      );
                      
                      // X열: 이관 시간
                      await updateOrderCell(
                          `주문접수!X${rowNumber}`, 
                          transferTime, 
                          ordersSpreadsheetId
                      );
                      
                      updateCount++;
                      console.log(`행 ${rowNumber} 업데이트 성공`);
                  } catch (updateError) {
                      console.log(`행 ${rowNumber} 업데이트 실패:`, updateError.message);
                      // 실패해도 계속 진행
                  }
              }
          }
          
          console.log(`총 ${updateCount}개 행 업데이트 완료`);
          
          return res.status(200).json({ 
            success: true, 
            message: `${updateCount}개 주문 이관 플래그 업데이트됨`
          });
          
        } catch (error) {
          console.error('이관플래그 오류:', error);
          return res.status(500).json({ 
            success: false, 
            error: error.message 
          });
        }


case 'saveMarketingCustomer':
  try {
    console.log('=== saveMarketingCustomer 시작 ===');
    const { data } = req.body;
    console.log('받은 데이터:', JSON.stringify(data));
    
    // 환경변수 확인
    console.log('모든 환경변수 키:', Object.keys(process.env));
    
    const spreadsheetId = process.env.SPREADSHEET_ID_CUSTOMER;
    const sheetName = '문자마케팅대상고객';
    
    console.log('SPREADSHEET_ID_CUSTOMER 값:', spreadsheetId);
    console.log('타입:', typeof spreadsheetId);
    console.log('길이:', spreadsheetId ? spreadsheetId.length : 0);
    
    if (!spreadsheetId || spreadsheetId === 'undefined') {
      console.error('환경변수 SPREADSHEET_ID_CUSTOMER 없거나 잘못됨');
      return res.status(500).json({ 
        success: false, 
        error: '고객 관리 시트가 설정되지 않았습니다' 
      });
    }
    
    let existingData = [];
    let hasHeaders = false;
    
    try {
      console.log('기존 데이터 조회 시작');
      existingData = await getSheetData(`${sheetName}!A:J`, spreadsheetId);
      console.log('기존 데이터 행 수:', existingData?.length || 0);
      
      // 헤더 확인
      if (existingData && existingData.length > 0) {
        const firstRow = existingData[0];
        hasHeaders = firstRow[0] === '연번' || firstRow[1] === '등록일';
        console.log('헤더 존재:', hasHeaders);
      }
    } catch (readError) {
      console.error('시트 읽기 실패:', readError.message);
    }
    
    // 헤더가 없으면 먼저 추가
    if (!hasHeaders) {
      const headers = [['연번', '등록일', '이름', '전화번호', '주소', '이용마켓', '구매상품', '결제일', '고객정보', '비고']];
      await appendSheetData(`${sheetName}!A1:J1`, headers, spreadsheetId);
      console.log('헤더 추가 완료');
    }
    
    let nextSerialNumber = 1;
    
    if (existingData && existingData.length > 1) {
      for (let i = existingData.length - 1; i > 0; i--) {
        const serialNum = parseInt(existingData[i][0]);
        if (!isNaN(serialNum)) {
          nextSerialNumber = serialNum + 1;
          break;
        }
      }
    }
    
    console.log('다음 연번:', nextSerialNumber);
    
    const newRow = [[
      nextSerialNumber,
      data.등록일 || '',
      data.이름 || '',
      data.전화번호 || '',
      data.주소 || '',
      data.이용마켓 || '',
      data.구매상품 || '',
      data.결제일 || '',
      data.고객정보 || '',
      data.비고 || ''
    ]];
    
    console.log('추가할 데이터:', JSON.stringify(newRow));
    
    try {
      await appendSheetData(`${sheetName}!A:J`, newRow, spreadsheetId);
      console.log('데이터 추가 성공');
    } catch (appendError) {
      console.error('데이터 추가 실패:', appendError.message);
      console.error('상세 에러:', appendError);
      throw appendError;
    }
    
    console.log('=== saveMarketingCustomer 완료 ===');
    
    return res.status(200).json({ 
      success: true, 
      message: '마케팅 고객이 등록되었습니다.',
      serialNumber: nextSerialNumber
    });
    
  } catch (error) {
    console.error('=== saveMarketingCustomer 오류 ===');
    console.error('에러 메시지:', error.message);
    console.error('전체 에러:', error);
    console.error('스택 트레이스:', error.stack);
    
    return res.status(500).json({ 
      success: false, 
      error: error.message || '마케팅 고객 저장 실패'
    });
  }

      default:
        return res.status(400).json({ 
          error: '알 수 없는 액션입니다.' 
        });
    }
  } catch (error) {
    console.error('Sheets API 오류:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message || '서버 오류가 발생했습니다.'
    });
  }
}

// 컬럼 번호를 알파벳으로 변환하는 헬퍼 함수
function columnToLetter(column) {
  let temp, letter = '';
  while (column > 0) {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}

function parseNumber(value) {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  if (typeof value === 'number') {
    return value;
  }
  let strValue = String(value).trim();
  strValue = strValue.replace(/[,₩￦$¥£€\s]/g, '');
  if (strValue.startsWith('(') && strValue.endsWith(')')) {
    strValue = '-' + strValue.substring(1, strValue.length - 1);
  }
  const num = parseFloat(strValue);
  return isNaN(num) ? 0 : num;
}



