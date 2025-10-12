const { getSheetData, updateSheetData } = require('../lib/google-sheets');

module.exports = async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // 매핑 데이터 가져오기
      const data = await getSheetData('매핑!A:AZ');
      
      if (data.length < 3) {
        return res.status(200).json({ 
          error: '매핑 시트에 데이터가 없습니다.' 
        });
      }
      
      const mappingData = {
        markets: {},
        marketOrder: [],
        standardFields: [],
        standardFieldsStartCol: -1
      };
      
      // "표준필드시작" 마커 찾기 (2행)
      const markerRow = data[1];
      for (let i = 0; i < markerRow.length; i++) {
        if (String(markerRow[i]).trim() === '표준필드시작') {
          mappingData.standardFieldsStartCol = i + 1;
          break;
        }
      }
      
      if (mappingData.standardFieldsStartCol === -1) {
        return res.status(200).json({ 
          error: '표준필드시작 마커를 찾을 수 없습니다.' 
        });
      }
      
      // 표준필드 목록 생성
      for (let i = mappingData.standardFieldsStartCol; i < markerRow.length; i++) {
        const fieldName = String(markerRow[i] || '').trim();
        if (fieldName === '') break;
        mappingData.standardFields.push(fieldName);
      }
      
      // 마켓별 매핑 정보 로드 (3행부터)
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
        
        // 필드 매핑 정보
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
      
      return res.status(200).json(mappingData);
      
    } else if (req.method === 'POST') {
      // 매핑 데이터 업데이트
      const { range, values } = req.body;
      const result = await updateSheetData(range, values);
      return res.status(200).json({ success: true, result });
      
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API 오류:', error);
    res.status(500).json({ 
      error: error.message || '서버 오류가 발생했습니다.' 
    });
  }
}