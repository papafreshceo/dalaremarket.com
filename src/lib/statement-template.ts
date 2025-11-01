/**
 * 거래명세서 HTML 템플릿 생성
 */

interface StatementItem {
  name: string;
  spec: string;
  quantity: number;
  unit: string;
  price: number;
  supplyAmount: number;
  vat: number;
  notes?: string;
}

interface CompanyInfo {
  name: string;
  businessNumber: string;
  representative: string;
  address: string;
  phone: string;
  email: string;
}

interface StatementData {
  docNumber: string;
  issuedAt: string;
  seller: CompanyInfo;
  buyer: CompanyInfo;
  items: StatementItem[];
  supplyAmount: number;
  vatAmount: number;
  totalAmount: number;
  notes?: string[];
  qrCodeDataUrl: string;
}

export function generateStatementHTML(data: StatementData): string {
  const itemCount = data.items.length;
  const isOver10Items = itemCount > 10;
  const totalPages = isOver10Items ? 2 : 1;

  let itemsHtml = '';
  let emptyRows = '';

  if (isOver10Items) {
    // 10개 초과 시: 1페이지는 요약만 표시
    const firstItem = data.items[0];
    const totalCount = data.items.reduce((sum, item) => {
      const noteCount = item.notes ? parseInt(item.notes.replace('건', '')) : 0;
      return sum + noteCount;
    }, 0);

    // 1행: 요약
    itemsHtml = `
      <tr>
        <td>1</td>
        <td class="left">${firstItem.name} 외 ${itemCount - 1}건</td>
        <td>옵션상품 ${firstItem.spec} 외 ${itemCount - 1}건</td>
        <td class="right">1</td>
        <td>식</td>
        <td class="right">${data.totalAmount.toLocaleString()}</td>
        <td class="right">${data.totalAmount.toLocaleString()}</td>
        <td>${totalCount}건</td>
      </tr>
    `;

    // 2행: 세부내역 안내
    itemsHtml += `
      <tr style="height: 30px;">
        <td>2</td>
        <td colspan="7" class="left" style="color: #3b82f6; font-weight: bold;">※ 세부내역은 2페이지를 참조해 주세요</td>
      </tr>
    `;

    // 3~10행: 공란
    for (let i = 3; i <= 10; i++) {
      itemsHtml += `
        <tr style="height: 30px;">
          <td>${i}</td>
          <td colspan="7" class="left" style="color: #999;">-</td>
        </tr>
      `;
    }

    emptyRows = ''; // 이미 10행 채웠음
  } else {
    // 10개 이하: 기존 방식
    itemsHtml = data.items.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td class="left">${item.name}</td>
        <td>${item.spec}</td>
        <td class="right">${item.quantity.toLocaleString()}</td>
        <td>${item.unit}</td>
        <td class="right">${item.price.toLocaleString()}</td>
        <td class="right">${item.supplyAmount.toLocaleString()}</td>
        <td>${item.notes || ''}</td>
      </tr>
    `).join('');

    // 빈 행 추가 (최소 10행까지 채우기)
    const emptyRowsCount = Math.max(0, 10 - data.items.length);
    emptyRows = Array(emptyRowsCount).fill(0).map((_, index) => `
      <tr style="height: 30px;">
        <td>${data.items.length + index + 1}</td>
        <td colspan="7" class="left" style="color: #999;">여백</td>
      </tr>
    `).join('');
  }

  // 비고 항목 생성
  const notesHtml = data.notes && data.notes.length > 0
    ? data.notes.map(note => `<li>${note}</li>`).join('')
    : `
      <li>상기 금액을 아래 계좌로 입금하여 주시기 바랍니다.</li>
      <li>입금계좌: 농협 123-4567-8901-23 (예금주: 달래마켓)</li>
      <li>문의사항: 02-1234-5678 또는 contact@dalraemarket.com</li>
    `;

  // 2페이지 세부내역 생성 (품목이 10개 초과일 때만)
  const detailPageHtml = isOver10Items ? `
    <!-- 페이지 구분 -->
    <div style="page-break-after: always;"></div>

    <!-- 2페이지: 세부내역 -->
    <div class="container">
        <div class="header">
            <h1>거래명세서 (세부내역)</h1>
        </div>

        <div class="doc-info">
            <div>
                <strong>문서번호:</strong> ${data.docNumber}<br>
                <strong>발행일시:</strong> ${data.issuedAt}
            </div>
            <div style="text-align: right;">
                <strong>페이지:</strong> 2 / ${totalPages}
            </div>
        </div>

        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 6%;">No.</th>
                    <th style="width: 20%;">품목명</th>
                    <th style="width: 23%;">규격</th>
                    <th style="width: 8%;">수량</th>
                    <th style="width: 7%;">단위</th>
                    <th style="width: 12%;">단가</th>
                    <th style="width: 12%;">공급가액</th>
                    <th style="width: 12%;">비고</th>
                </tr>
            </thead>
            <tbody>
                ${data.items.map((item, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td class="left">${item.name}</td>
                    <td>${item.spec}</td>
                    <td class="right">${item.quantity.toLocaleString()}</td>
                    <td>${item.unit}</td>
                    <td class="right">${item.price.toLocaleString()}</td>
                    <td class="right">${item.supplyAmount.toLocaleString()}</td>
                    <td>${item.notes || ''}</td>
                  </tr>
                `).join('')}
            </tbody>
        </table>

        <div style="text-align: right; margin-top: 20px; font-size: 16px; font-weight: bold;">
            합계 금액: ${data.totalAmount.toLocaleString()}원
        </div>

        <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
            <p>이 문서는 dalraemarket.com에서 발행된 정식 거래명세서입니다.</p>
        </div>
    </div>
  ` : '';

  return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>거래명세서 - 달래마켓</title>
    <style>
        @media print {
            .no-print { display: none; }
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Malgun Gothic', sans-serif;
            background: white;
            padding: 0;
        }

        .container {
            width: 210mm;
            margin: 0 auto;
            background: white;
            padding: 18mm 18mm 20mm 18mm;
            box-sizing: border-box;
        }

        @page {
            size: A4;
            margin: 0;
        }

        .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }

        .header h1 {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 8px;
        }

        .doc-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            font-size: 11px;
        }

        .doc-info div {
            line-height: 1.6;
        }

        .company-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
        }

        .company-box {
            border: 1.5px solid #000;
            padding: 12px;
        }

        .company-box h3 {
            font-size: 13px;
            margin-bottom: 8px;
            padding-bottom: 5px;
            border-bottom: 1px solid #000;
        }

        .company-box p {
            font-size: 11px;
            line-height: 1.7;
        }

        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }

        .items-table th,
        .items-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: center;
            font-size: 11px;
        }

        .items-table th {
            background: #f0f0f0;
            font-weight: bold;
        }

        .items-table td.left {
            text-align: left;
        }

        .items-table td.right {
            text-align: right;
        }

        .footer {
            margin-top: 25px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }

        .qr-section {
            text-align: center;
        }

        .qr-code img {
            width: 90px;
            height: 90px;
            border: 1px solid #ddd;
            display: block;
            margin: 0 auto 5px;
        }

        .qr-section p {
            font-size: 9px;
            color: #666;
        }

        .stamp-section {
            text-align: center;
        }

        .notes {
            margin-top: 18px;
            padding: 12px;
            background: #f9f9f9;
            border-left: 3px solid #000;
        }

        .notes h4 {
            font-size: 11px;
            margin-bottom: 7px;
        }

        .notes ul {
            list-style: none;
            font-size: 10px;
            line-height: 1.7;
        }

        .notes li:before {
            content: "• ";
            margin-right: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>거 래 명 세 서</h1>
        </div>

        <div class="doc-info">
            <div>
                <strong>문서번호:</strong> ${data.docNumber}<br>
                <strong>발행일시:</strong> ${data.issuedAt}
            </div>
            <div style="text-align: right;">
                <strong>페이지:</strong> 1 / ${totalPages}
            </div>
        </div>

        <div class="company-section">
            <div class="company-box">
                <h3>공급자 정보</h3>
                <p>
                    <strong>상호:</strong> ${data.seller.name}<br>
                    <strong>사업자등록번호:</strong> ${data.seller.businessNumber}<br>
                    <strong>대표자:</strong> ${data.seller.representative}<br>
                    <strong>주소:</strong> ${data.seller.address}<br>
                    <strong>연락처:</strong> ${data.seller.phone}<br>
                    <strong>이메일:</strong> ${data.seller.email}
                </p>
            </div>

            <div class="company-box">
                <h3>공급받는자 정보</h3>
                <p>
                    <strong>상호:</strong> ${data.buyer.name}<br>
                    <strong>사업자등록번호:</strong> ${data.buyer.businessNumber}<br>
                    <strong>대표자:</strong> ${data.buyer.representative}<br>
                    <strong>주소:</strong> ${data.buyer.address}<br>
                    <strong>연락처:</strong> ${data.buyer.phone}<br>
                    <strong>이메일:</strong> ${data.buyer.email}
                </p>
            </div>
        </div>

        <div style="text-align: right; margin-bottom: 15px; font-size: 16px; font-weight: bold;">
            합계 금액: ${data.totalAmount.toLocaleString()}원
        </div>

        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 6%;">No.</th>
                    <th style="width: 20%;">품목명</th>
                    <th style="width: 23%;">규격</th>
                    <th style="width: 8%;">수량</th>
                    <th style="width: 7%;">단위</th>
                    <th style="width: 12%;">단가</th>
                    <th style="width: 12%;">공급가액</th>
                    <th style="width: 12%;">비고</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHtml}
                ${emptyRows}
            </tbody>
        </table>

        <div class="notes">
            <h4>■ 비고</h4>
            <ul>
                ${notesHtml}
            </ul>
        </div>

        <div class="footer">
            <div class="qr-section">
                <div class="qr-code">
                    <img src="${data.qrCodeDataUrl}" alt="QR Code" />
                </div>
                <p>본 문서는 dalraemarket.com에서<br>검증 가능합니다</p>
            </div>

            <div class="stamp-section">
                <p style="font-size: 12px; line-height: 1.8; text-align: right;">
                    <strong>발행자:</strong> ${data.seller.name}<br>
                    <strong>발행 시스템:</strong> dalraemarket.com
                </p>
            </div>
        </div>
    </div>

    ${detailPageHtml}
</body>
</html>
  `;
}
