// api/process.js
const { getSheetData } = require('../lib/google-sheets');

export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileName, headers, firstDataRow } = req.body;
    
    // 직접 매핑 데이터 가져오기 (fetch 대신)
    const mappingData = await getMappingDataDirect();
    
    if (mappingData.error) {
      return res.status(400).json({ error: mappingData.error });
    }
    
    // 마켓 감지
    const marketName = detectMarket(fileName, headers, firstDataRow, mappingData);
    
    if (!marketName) {
      return res.status(400).json({ 
        error: '마켓을 인식할 수 없습니다.' 
      });
    }
    
    return res.status(200).json({ 
      marketName,
      market: mappingData.markets[marketName]
    });
    
  } catch (error) {
    console.error('Process API 오류:', error);
    res.status(500).json({ 
      error: error.message || '서버 오류가 발생했습니다.' 
    });
  }
}

// 매핑 데이터 직접 가져오기
async function getMappingDataDirect() {
  try {
    const data = await getSheetData('매핑!A:AZ');
    
    if (data.length < 3) {
      return { error: '매핑 시트에 데이터가 없습니다.' };
    }
    
    const mappingData = {
      markets: {},
      marketOrder: [],
      standardFields: [],
      standardFieldsStartCol: -1
    };
    
    // "표준필드시작" 마커 찾기
    const markerRow = data[1];
    for (let i = 0; i < markerRow.length; i++) {
      if (String(markerRow[i]).trim() === '표준필드시작') {
        mappingData.standardFieldsStartCol = i + 1;
        break;
      }
    }
    
    if (mappingData.standardFieldsStartCol === -1) {
      return { error: '표준필드시작 마커를 찾을 수 없습니다.' };
    }
    
    // 표준필드 목록 생성
    for (let i = mappingData.standardFieldsStartCol; i < markerRow.length; i++) {
      const fieldName = String(markerRow[i] || '').trim();
      if (fieldName === '') break;
      mappingData.standardFields.push(fieldName);
    }
    
    // 마켓별 매핑 정보 로드
    for (let i = 2; i < data.length; i++) {
      const row = data[i];
      const marketName = String(row[0] || '').trim();
      
      if (!marketName) continue;
      
      const marketInfo = {
        name: marketName,
        initial: String(row[1] || '').trim(),
        color: String(row[2] || '200,200,200').trim(),
        detectString1: String(row[3] || '').trim(),
        detectString2: String(row[4] || '').trim(),
        detectString3: String(row[5] || '').trim(),
        settlementFormula: String(row[6] || '').trim(),
        headerRow: parseInt(row[7]) || 1,
        orderIndex: i - 2,
        mappings: {}
      };
      
      // 필드 매핑
      for (let j = 0; j < mappingData.standardFields.length; j++) {
        const standardField = mappingData.standardFields[j];
        const colIndex = mappingData.standardFieldsStartCol + j;
        const mappedField = String(row[colIndex] || '').trim();
        if (mappedField) {
          marketInfo.mappings[standardField] = mappedField;
        }
      }
      
      mappingData.markets[marketName] = marketInfo;
      mappingData.marketOrder.push(marketName);
    }
    
    return mappingData;
    
  } catch (error) {
    console.error('매핑 데이터 로드 오류:', error);
    return { error: error.toString() };
  }
}

function detectMarket(fileName, headers, firstDataRow, mappingData) {
  try {
    const headerText = headers.join(' ').toLowerCase();
    
    // 파일명으로 체크
    for (const marketName in mappingData.markets) {
      const market = mappingData.markets[marketName];
      
      if (market.detectString1 && market.detectString1.length > 0) {
        if (fileName.toLowerCase().includes(market.detectString1.toLowerCase())) {
          return marketName;
        }
      }
    }
    
    // 헤더로 체크
    for (const marketName in mappingData.markets) {
      const market = mappingData.markets[marketName];
      
      if (market.detectString2 && market.detectString2.length > 0) {
        const detectStrings = market.detectString2.split(',').map(s => s.trim());
        let matchCount = 0;
        
        for (const detectStr of detectStrings) {
          if (detectStr && headerText.includes(detectStr.toLowerCase())) {
            matchCount++;
          }
        }
        
        const requiredMatches = detectStrings.length > 1 ? 2 : 1;
        
        if (matchCount >= requiredMatches) {
          return marketName;
        }
      }
    }
    
    return null;
    
  } catch (error) {
    console.error('마켓 감지 오류:', error);
    return null;
  }
}