const { google } = require('googleapis');

let sheetsClient = null;

// 주문 저장용 스프레드시트 ID 직접 설정
const ORDERS_SPREADSHEET_ID = '1UsUMd_haNOsRm2Yn8sFpFc7HUlJ_CEQ-91QctlkSjJg';

function getAuthClient() {
  if (!sheetsClient) {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    sheetsClient = google.sheets({ version: 'v4', auth });
  }
  return sheetsClient;
}

// ========================================
// 기본 시트 함수들 (SPREADSHEET_ID 사용)
// ========================================
async function getSheetData(range, spreadsheetId) {
  try {
    const sheets = getAuthClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId || process.env.SPREADSHEET_ID,
      range: range
    });
    return response.data.values || [];
  } catch (error) {
    console.error('시트 읽기 오류:', error);
    throw error;
  }
}

async function updateSheetData(range, values) {
  try {
    const sheets = getAuthClient();
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values }
    });
    return response.data;
  } catch (error) {
    console.error('시트 쓰기 오류:', error);
    throw error;
  }
}

async function appendSheetData(range, values, spreadsheetId) {
  try {
    const sheets = getAuthClient();
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId || process.env.SPREADSHEET_ID,
      range: range,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values }
    });
    return response.data;
  } catch (error) {
    console.error('시트 추가 오류:', error);
    throw error;
  }
}

async function clearSheet(range) {
  try {
    const sheets = getAuthClient();
    await sheets.spreadsheets.values.clear({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: range
    });
    return true;
  } catch (error) {
    console.error('시트 클리어 오류:', error);
    throw error;
  }
}

async function createSheet(title) {
  try {
    const sheets = getAuthClient();
    const response = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: process.env.SPREADSHEET_ID,
      requestBody: {
        requests: [{
          addSheet: {
            properties: { title }
          }
        }]
      }
    });
    return response.data;
  } catch (error) {
    if (error.message.includes('already exists')) {
      return { exists: true };
    }
    throw error;
  }
}

// ========================================
// 주문 시트 함수들 (ORDERS_SPREADSHEET_ID 사용)
// ========================================
async function getOrderData(range) {
  try {
    const spreadsheetId = process.env.SPREADSHEET_ID_ORDERS || ORDERS_SPREADSHEET_ID;
    console.log('Reading from spreadsheet:', spreadsheetId);
    
    const sheets = getAuthClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: range
    });
    return response.data.values || [];
  } catch (error) {
    console.error('주문 시트 읽기 오류:', error);
    return [];
  }
}

async function saveOrderData(range, values) {
  try {
    const spreadsheetId = process.env.SPREADSHEET_ID_ORDERS || ORDERS_SPREADSHEET_ID;
    const sheets = getAuthClient();
    
    // 헤더 확인
    const headers = values[0];
    const textFields = [
  '수령인', '수취인', 
  '주문자전화번호', '수취인전화번호', '수령인전화번호',
  '주문자 전화번호', '수취인 전화번호', '수령인 전화번호',
  '송장번호', '운송장번호',
  '주문번호', '상품주문번호',  // 추가
  '발송지연락처'
];
    
    // 어떤 컬럼이 텍스트 필드인지 인덱스 찾기
    const textColumnIndices = [];
    headers.forEach((header, index) => {
      if (textFields.some(field => header.includes(field))) {
        textColumnIndices.push(index);
      }
    });
    
    // 데이터 가공 - 텍스트 필드만 앞에 ' 추가
    const processedValues = values.map((row, rowIndex) => {
      if (rowIndex === 0) return row; // 헤더는 그대로
      
      return row.map((cell, colIndex) => {
        if (textColumnIndices.includes(colIndex) && cell && /^\d/.test(cell)) {
          return "'" + cell; // 숫자로 시작하면 ' 추가
        }
        return cell;
      });
    });
    
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: range,
      valueInputOption: 'USER_ENTERED', // 다시 USER_ENTERED 사용
      requestBody: { values: processedValues }
    });
    return response.data;
  } catch (error) {
    console.error('주문 시트 쓰기 오류:', error);
    throw error;
  }
}

async function clearOrderSheet(range) {
  try {
    const spreadsheetId = process.env.SPREADSHEET_ID_ORDERS || ORDERS_SPREADSHEET_ID;
    
    const sheets = getAuthClient();
    await sheets.spreadsheets.values.clear({
      spreadsheetId: spreadsheetId,
      range: range
    });
    return true;
  } catch (error) {
    console.error('주문 시트 클리어 오류:', error);
    throw error;
  }
}

async function createOrderSheet(title) {
  try {
    const spreadsheetId = process.env.SPREADSHEET_ID_ORDERS || ORDERS_SPREADSHEET_ID;
    console.log('Creating sheet in spreadsheet:', spreadsheetId);
    
    const sheets = getAuthClient();
    
    // 시트 목록 가져오기
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId
    });
    
    // 이미 시트가 있는지 확인
    const existingSheet = spreadsheet.data.sheets.find(
      sheet => sheet.properties.title === title
    );
    
    if (existingSheet) {
      return { exists: true, sheetId: existingSheet.properties.sheetId };
    }
    
    // 새 시트 생성
    const response = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetId,
      requestBody: {
        requests: [{
          addSheet: {
            properties: { title }
          }
        }]
      }
    });
    
    return { 
      exists: false, 
      sheetId: response.data.replies[0].addSheet.properties.sheetId 
    };
  } catch (error) {
    if (error.message.includes('already exists')) {
      return { exists: true };
    }
    throw error;
  }
}

// 시트 ID 가져오기
async function getSheetId(sheetName) {
  try {
    const spreadsheetId = process.env.SPREADSHEET_ID_ORDERS || ORDERS_SPREADSHEET_ID;
    
    const sheets = getAuthClient();
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId
    });
    
    const sheet = spreadsheet.data.sheets.find(
      s => s.properties.title === sheetName
    );
    
    return sheet ? sheet.properties.sheetId : null;
  } catch (error) {
    console.error('시트 ID 가져오기 오류:', error);
    return null;
  }
}

// 마켓별 색상 적용
async function applyMarketColors(sheetName, marketColors) {
  try {
    const spreadsheetId = process.env.SPREADSHEET_ID_ORDERS || ORDERS_SPREADSHEET_ID;
    
    const sheets = getAuthClient();
    const sheetId = await getSheetId(sheetName);
    
    if (sheetId === null && sheetId !== 0) return;
    
    const requests = [];
    
    // 각 마켓별 색상 적용
    Object.entries(marketColors).forEach(([marketName, colorInfo]) => {
      if (colorInfo.rows && colorInfo.rows.length > 0) {
        const rgb = colorInfo.color.split(',').map(n => parseInt(n) / 255);
        
        colorInfo.rows.forEach(rowIndex => {
          requests.push({
            updateCells: {
              range: {
                sheetId: sheetId,
                startRowIndex: rowIndex,
                endRowIndex: rowIndex + 1,
                startColumnIndex: 0,  // 첫 번째 컬럼 (마켓명)
                endColumnIndex: 1
              },
              rows: [{
                values: [{
                  userEnteredFormat: {
                    backgroundColor: {
                      red: rgb[0],
                      green: rgb[1],
                      blue: rgb[2]
                    },
                    textFormat: {
                      foregroundColor: {
                        red: colorInfo.textColor === '#fff' ? 1 : 0,
                        green: colorInfo.textColor === '#fff' ? 1 : 0,
                        blue: colorInfo.textColor === '#fff' ? 1 : 0
                      },
                      bold: true
                    },
                    horizontalAlignment: 'CENTER'
                  }
                }]
              }],
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
            }
          });
        });
      }
    });
    
    if (requests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetId,
        requestBody: { requests }
      });
    }
    
    return true;
  } catch (error) {
    console.error('색상 적용 오류:', error);
    return false;
  }
}

// 중복 체크 및 병합 저장
async function mergeAndSaveOrderData(sheetName, newData, headers, marketMapping) {
  try {
    // 기존 데이터 읽기
    const existingData = await getOrderData(`${sheetName}!A:ZZ`);
    
    // 헤더 인덱스 찾기
    const orderNumberIdx = headers.indexOf('주문번호');
    const buyerIdx = headers.indexOf('주문자');
    const marketNameIdx = headers.indexOf('마켓명');
    const marketIdx = headers.indexOf('마켓');
    const serialIdx = headers.indexOf('연번');
    
    // 기존 데이터를 Map으로 변환 (키: 주문번호_주문자_마켓)
    const existingMap = new Map();
    
    // 첫 행은 헤더이므로 스킵
    for (let i = 1; i < existingData.length; i++) {
      const row = existingData[i];
      if (row && row[orderNumberIdx] && row[buyerIdx]) {
        const key = `${row[orderNumberIdx]}_${row[buyerIdx]}_${row[marketIdx] || ''}`;
        existingMap.set(key, { row, index: i });
      }
    }
    
    // 최종 데이터 구성
    const finalData = [headers];  // 헤더 추가
    const marketColors = {};
    
    // 기존 데이터 중 업데이트되지 않은 것들 먼저 추가
    const updatedKeys = new Set();
    newData.forEach(row => {
      const key = `${row[orderNumberIdx]}_${row[buyerIdx]}_${row[marketIdx] || ''}`;
      updatedKeys.add(key);
    });
    
    // 기존 데이터 유지 (업데이트되지 않은 것들)
    existingMap.forEach((value, key) => {
      if (!updatedKeys.has(key)) {
        finalData.push(value.row);
      }
    });
    
    // 새 데이터 처리 (중복은 덮어쓰기, 신규는 추가)
    newData.forEach(row => {
      const key = `${row[orderNumberIdx]}_${row[buyerIdx]}_${row[marketIdx] || ''}`;
      const existing = existingMap.get(key);

      if (existing) {
        // 중복: 기존 위치에 덮어쓰기
        const targetIndex = existing.index;
        if (targetIndex < finalData.length) {
          finalData[targetIndex] = row;
        } else {
          finalData.push(row);
        }
      } else {
        // 신규: 마지막에 추가
        finalData.push(row);
      }
    });
    
    // 연번 재정렬 (헤더 제외하고 1부터 순차 번호)
    if (serialIdx !== -1) {
      for (let i = 1; i < finalData.length; i++) {
        finalData[i][serialIdx] = i;
      }
    }
    
    // 마켓별 색상 정보 수집
    for (let i = 1; i < finalData.length; i++) {
      const marketName = finalData[i][marketNameIdx];
      if (marketName && marketMapping[marketName]) {
        if (!marketColors[marketName]) {
          marketColors[marketName] = {
            color: marketMapping[marketName].color,
            textColor: marketMapping[marketName].textColor,
            rows: []
          };
        }
        marketColors[marketName].rows.push(i);
      }
    }
    
    // 전체 시트 클리어 후 새로 쓰기
    await clearOrderSheet(`${sheetName}!A:ZZ`);
    await saveOrderData(`${sheetName}!A1`, finalData);
    
    // 색상 적용
    await applyMarketColors(sheetName, marketColors);
    
    return {
      success: true,
      totalRows: finalData.length - 1,
      newRows: newData.filter(row => {
        const key = `${row[orderNumberIdx]}_${row[buyerIdx]}_${row[marketIdx] || ''}`;
        return !existingMap.has(key);
      }).length,
      updatedRows: newData.filter(row => {
        const key = `${row[orderNumberIdx]}_${row[buyerIdx]}_${row[marketIdx] || ''}`;
        return existingMap.has(key);
      }).length
    };
    
  } catch (error) {
    console.error('병합 저장 오류:', error);
    throw error;
  }
}

// ========================================
// 제품 시트 함수들 (SPREADSHEET_ID_PRODUCTS 사용)
// ========================================
async function getProductSheetData(spreadsheetId, range) {
  try {
    const sheets = getAuthClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: range
    });
    return response.data.values || [];
  } catch (error) {
    console.error('제품 시트 읽기 오류:', error);
    return [];
  }
}

// ========================================
// 사용자 관리 함수들 (SPREADSHEET_ID_SETTINGS 사용)
// ========================================
async function getUserData(email) {
  try {
    const spreadsheetId = process.env.SPREADSHEET_ID; // 환경변수 사용
    const sheets = getAuthClient();
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: '사용자관리!A:E'
    });
    
    const rows = response.data.values || [];
    if (rows.length < 2) return null;
    
    const headers = rows[0];
    const emailIndex = headers.indexOf('이메일');
    
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][emailIndex] === email) {
        return {
          email: rows[i][0],
          name: rows[i][1],
          role: rows[i][2],
          status: rows[i][3],
          joinDate: rows[i][4]
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('사용자 데이터 조회 오류:', error);
    return null;
  }
}

async function createUser(userData) {
  try {
    const spreadsheetId = process.env.SPREADSHEET_ID; // 환경변수 사용
    const sheets = getAuthClient();
    
    const values = [[
      userData.email,
      userData.name || '',
      userData.role || 'staff',
      'active',
      new Date().toISOString().split('T')[0]
    ]];
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: '사용자관리!A:E',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values }
    });
    
    return true;
  } catch (error) {
    console.error('사용자 생성 오류:', error);
    return false;
  }
}
// 개별 셀 업데이트 (주문 시트용)
async function updateOrderCell(range, value, spreadsheetId) {
  try {
    const sheets = getAuthClient();
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId || process.env.SPREADSHEET_ID_ORDERS || ORDERS_SPREADSHEET_ID,
      range: range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { 
        values: [[value]]
      }
    });
    return response.data;
  } catch (error) {
    console.error('개별 셀 업데이트 오류:', error);
    throw error;
  }
}

module.exports = {
  // 기본 시트 함수들
  getSheetData,
  updateSheetData,
  appendSheetData,
  clearSheet,
  createSheet,
    updateOrderCell,  // 추가
  
  // 주문 시트 함수들
  getOrderData,
  saveOrderData,
  clearOrderSheet,
  createOrderSheet,
  mergeAndSaveOrderData,
  applyMarketColors,
  
  // 제품 시트 함수
  getProductSheetData,
  
  // 사용자 관리 함수 추가
  getUserData,    // ← 이 부분 확인
  createUser      // ← 이 부분 확인
};



