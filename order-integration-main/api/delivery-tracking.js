module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { carrier, trackingNumber } = req.body;
    
    if (!carrier || !trackingNumber) {
      return res.status(400).json({ 
        error: '택배사와 송장번호가 필요합니다.' 
      });
    }

    // 환경변수에서 API 키 가져오기
    const API_KEY = process.env.SMART_DELIVERY_API_KEY;
    
    if (!API_KEY) {
      console.error('SMART_DELIVERY_API_KEY 환경변수가 설정되지 않았습니다.');
      return res.status(500).json({ 
        error: 'API 키가 설정되지 않았습니다.' 
      });
    }

    // axios 가져오기
    const axios = require('axios');

    // 택배사 코드 매핑
    const CARRIER_CODES = {
      'CJ대한통운': '04',
      '한진택배': '05', 
      '롯데택배': '08',
      '우체국택배': '01',
      '로젠택배': '06'
    };

    const carrierCode = CARRIER_CODES[carrier];
    
    if (!carrierCode) {
      return res.status(400).json({ 
        error: '지원하지 않는 택배사입니다.' 
      });
    }
    
    // 스마트택배 API 호출
    const response = await axios.get('https://info.sweettracker.co.kr/api/v1/trackingInfo', {
      params: {
        t_key: API_KEY,
        t_code: carrierCode,
        t_invoice: trackingNumber
      }
    });

    const data = response.data;
    
    if (!data || data.status === false) {
      return res.status(404).json({ 
        error: '배송 정보를 찾을 수 없습니다.' 
      });
    }

    // 배송 상태 텍스트
    const statusMap = {
      1: '배송준비중',
      2: '집하완료',
      3: '배송중',
      4: '지점도착',
      5: '배송출발',
      6: '배송완료'
    };

    // 응답 데이터
    const result = {
      invoiceNo: data.invoiceNo || trackingNumber,
      itemName: data.itemName || '상품',
      senderName: data.senderName || '-',
      receiverName: data.receiverName || '-',
      receiverAddr: data.receiverAddr || '-',
      level: data.level || 1,
      complete: data.complete || false,
      completeYN: data.completeYN || 'N',
      status: statusMap[data.level] || '알 수 없음',
      statusCode: data.level || 0,
      trackingDetails: data.trackingDetails || []
    };

    return res.status(200).json(result);

  } catch (error) {
    console.error('배송 조회 오류:', error.message);
    
    if (error.response && error.response.status === 401) {
      return res.status(401).json({ 
        error: 'API 인증 실패' 
      });
    }
    
    return res.status(500).json({ 
      error: '배송 조회 실패',
      message: error.message 
    });
  }
};
