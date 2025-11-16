import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const inputYn = searchParams.get('inputYn');

  // 결과를 받아온 경우
  if (inputYn === 'Y') {
    const roadFullAddr = searchParams.get('roadFullAddr') || '';
    const roadAddrPart1 = searchParams.get('roadAddrPart1') || '';
    const addrDetail = searchParams.get('addrDetail') || '';
    const roadAddrPart2 = searchParams.get('roadAddrPart2') || '';
    const engAddr = searchParams.get('engAddr') || '';
    const jibunAddr = searchParams.get('jibunAddr') || '';
    const zipNo = searchParams.get('zipNo') || '';
    const admCd = searchParams.get('admCd') || '';
    const rnMgtSn = searchParams.get('rnMgtSn') || '';
    const bdMgtSn = searchParams.get('bdMgtSn') || '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>주소 전달</title>
      </head>
      <body>
        <script>
          if(window.opener && typeof window.opener.jusoCallBack === 'function'){
            window.opener.jusoCallBack(
              '${roadFullAddr.replace(/'/g, "\\'")}',
              '${roadAddrPart1.replace(/'/g, "\\'")}',
              '${addrDetail.replace(/'/g, "\\'")}',
              '${roadAddrPart2.replace(/'/g, "\\'")}',
              '${engAddr.replace(/'/g, "\\'")}',
              '${jibunAddr.replace(/'/g, "\\'")}',
              '${zipNo}',
              '${admCd}',
              '${rnMgtSn}',
              '${bdMgtSn}'
            );
          }
          window.close();
        </script>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=UTF-8',
      },
    });
  }

  // 처음 열린 경우 - 링크 API 방식 사용
  const confmKey = 'U01TX0FVVEgyMDI1MTAyODE5MDE0NTExNjM3Mzk=';
  const returnUrl = encodeURIComponent(`${request.nextUrl.origin}/api/juso-popup`);
  const currentPage = '1';
  const countPerPage = '10';
  const resultType = 'json';

  const apiUrl = `https://business.juso.go.kr/addrlink/addrLinkApi.do?confmKey=${confmKey}&currentPage=${currentPage}&countPerPage=${countPerPage}&keyword=&resultType=${resultType}`;

  const html = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>주소 검색</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Malgun Gothic', sans-serif; padding: 20px; }
        .search-box { margin-bottom: 20px; }
        .search-box input { width: 70%; padding: 10px; border: 1px solid #ddd; }
        .search-box button { width: 28%; padding: 10px; background: #4CAF50; color: white; border: none; cursor: pointer; margin-left: 2%; }
        .search-box button:hover { background: #45a049; }
        .result-list { border-top: 2px solid #333; }
        .result-item { padding: 15px; border-bottom: 1px solid #ddd; cursor: pointer; }
        .result-item:hover { background: #f5f5f5; }
        .road-addr { font-weight: bold; color: #333; margin-bottom: 5px; }
        .jibun-addr { color: #666; font-size: 14px; }
        .zip-code { color: #999; font-size: 12px; margin-top: 5px; }
        .no-result { padding: 50px; text-align: center; color: #999; }
        .loading { padding: 50px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="search-box">
        <input type="text" id="keyword" placeholder="도로명, 건물명 또는 지번을 입력하세요" />
        <button onclick="searchAddress()">검색</button>
      </div>
      <div id="result" class="loading">검색어를 입력하고 검색 버튼을 클릭하세요.</div>

      <script>
        const confmKey = '${confmKey}';
        const returnUrl = '${request.nextUrl.origin}/api/juso-popup';

        document.getElementById('keyword').addEventListener('keypress', function(e) {
          if (e.key === 'Enter') searchAddress();
        });

        async function searchAddress(page = 1) {
          const keyword = document.getElementById('keyword').value.trim();
          if (!keyword) {
            alert('검색어를 입력하세요.');
            return;
          }

          document.getElementById('result').innerHTML = '<div class="loading">검색 중...</div>';

          try {
            const response = await fetch('/api/juso-search?keyword=' + encodeURIComponent(keyword) + '&page=' + page);
            const data = await response.json();

            if (data.results && data.results.common.errorCode === '0') {
              const juso = data.results.juso;
              if (juso && juso.length > 0) {
                let html = '<div class="result-list">';
                juso.forEach(item => {
                  html += \`
                    <div class="result-item" onclick='selectAddress(\${JSON.stringify(item)})'>
                      <div class="road-addr">\${item.roadAddr}</div>
                      <div class="jibun-addr">지번: \${item.jibunAddr}</div>
                      <div class="zip-code">우편번호: \${item.zipNo}</div>
                    </div>
                  \`;
                });
                html += '</div>';
                document.getElementById('result').innerHTML = html;
              } else {
                document.getElementById('result').innerHTML = '<div class="no-result">검색 결과가 없습니다.</div>';
              }
            } else {
              document.getElementById('result').innerHTML = '<div class="no-result">검색 중 오류가 발생했습니다.</div>';
            }
          } catch (error) {
            logger.error('Search error:', error);
            document.getElementById('result').innerHTML = '<div class="no-result">검색 중 오류가 발생했습니다.</div>';
          }
        }

        function selectAddress(item) {
          if (window.opener && typeof window.opener.jusoCallBack === 'function') {
            window.opener.jusoCallBack(
              item.roadAddr,
              item.roadAddr,
              '',
              '',
              item.engAddr || '',
              item.jibunAddr,
              item.zipNo,
              item.admCd,
              item.rnMgtSn,
              item.bdMgtSn
            );
          }
          window.close();
        }
      </script>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
    },
  });
}
