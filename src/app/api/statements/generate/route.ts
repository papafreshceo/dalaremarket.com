import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';
import QRCode from 'qrcode';
import puppeteer from 'puppeteer';
import { generateStatementHTML } from '@/lib/statement-template';

/**
 * POST /api/statements/generate
 * 거래명세서 PDF 생성 API
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 현재 로그인한 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // 요청 데이터 검증
    if (!body.buyerInfo || !body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: '필수 데이터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 1. 고유 ID 생성
    const docId = nanoid(12);
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const docNumber = `TXN-${dateStr}-${docId}`;

    // 2. 금액 계산
    const items = body.items.map((item: any) => ({
      name: item.name,
      spec: item.spec || '-',
      quantity: item.quantity,
      unit: item.unit || 'kg',
      price: item.price,
      supplyAmount: item.quantity * item.price,
      vat: Math.floor((item.quantity * item.price) * 0.1),
      notes: item.notes || ''
    }));

    const supplyAmount = items.reduce((sum: number, item: any) => sum + item.supplyAmount, 0);
    const vatAmount = items.reduce((sum: number, item: any) => sum + item.vat, 0);
    const totalAmount = supplyAmount + vatAmount;

    // 3. Supabase에 저장 (Service role client 사용 - RLS 우회)
    const { createClient: createServiceClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: insertError } = await supabaseAdmin
      .from('transaction_statements')
      .insert({
        id: docId,
        doc_number: docNumber,
        seller_id: user.id,
        buyer_id: body.buyerId || null,
        seller_name: body.sellerInfo?.name || '달래마켓',
        seller_business_number: body.sellerInfo?.businessNumber || '107-30-96371',
        seller_representative: body.sellerInfo?.representative || '대표자',
        seller_address: body.sellerInfo?.address || '주소',
        seller_phone: body.sellerInfo?.phone || '02-1234-5678',
        seller_email: body.sellerInfo?.email || 'contact@dalraemarket.com',
        buyer_name: body.buyerInfo.name,
        buyer_business_number: body.buyerInfo.businessNumber || '',
        buyer_representative: body.buyerInfo.representative || '',
        buyer_address: body.buyerInfo.address || '',
        buyer_phone: body.buyerInfo.phone || '',
        buyer_email: body.buyerInfo.email || '',
        items: JSON.stringify(items),
        supply_amount: supplyAmount,
        vat_amount: vatAmount,
        total_amount: totalAmount,
        notes: body.notes || null,
        status: 'issued'
      });

    if (insertError) {
      console.error('[statements/generate] DB 저장 실패:', insertError);
      return NextResponse.json(
        { success: false, error: 'DB 저장 실패' },
        { status: 500 }
      );
    }

    console.log(`[statements/generate] ✅ 문서 생성 성공! ID: ${docId}, 문서번호: ${docNumber}`);

    // 4. QR코드 생성
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
    const qrUrl = `${baseUrl}/verify/${docId}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 300,
      margin: 1
    });

    // 5. HTML 생성
    const issuedAt = new Date().toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/\. /g, '년 ').replace(/\./g, '월 ').replace(/ /g, '일 ');

    const html = generateStatementHTML({
      docNumber,
      issuedAt,
      seller: {
        name: body.sellerInfo?.name || '달래마켓',
        businessNumber: body.sellerInfo?.businessNumber || '107-30-96371',
        representative: body.sellerInfo?.representative || '대표자',
        address: body.sellerInfo?.address || '주소',
        phone: body.sellerInfo?.phone || '02-1234-5678',
        email: body.sellerInfo?.email || 'contact@dalraemarket.com'
      },
      buyer: {
        name: body.buyerInfo.name,
        businessNumber: body.buyerInfo.businessNumber || '',
        representative: body.buyerInfo.representative || '',
        address: body.buyerInfo.address || '',
        phone: body.buyerInfo.phone || '',
        email: body.buyerInfo.email || ''
      },
      items,
      supplyAmount,
      vatAmount,
      totalAmount,
      notes: body.notes,
      qrCodeDataUrl
    });

    // 6. Puppeteer로 PDF 생성
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      }
    });

    await browser.close();

    // 7. PDF 응답
    const filename = `거래명세서_${docNumber}.pdf`;
    const encodedFilename = encodeURIComponent(filename);

    return new Response(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`
      }
    });

  } catch (error: any) {
    console.error('[statements/generate] 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
