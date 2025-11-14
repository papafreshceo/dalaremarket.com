import { createClientForRouteHandler } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

export async function POST(request: Request) {
  try {
    const supabase = await createClientForRouteHandler();
    const { memberId } = await request.json();

    if (!memberId) {
      return NextResponse.json({ error: '회원 ID가 필요합니다.' }, { status: 400 });
    }

    // 현재 사용자가 관리자인지 확인
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json({ error: '인증되지 않았습니다.' }, { status: 401 });
    }

    // 현재 사용자의 역할 확인
    const { data: currentUserData } = await supabase
      .from('users')
      .select('role')
      .eq('id', currentUser.id)
      .single();

    if (!currentUserData || !['super_admin', 'admin'].includes(currentUserData.role)) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    // 대상 회원 정보 조회
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('id', memberId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json({ error: '회원을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 임시 토큰 생성 (30분 유효)
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-this');
    const token = await new SignJWT({
      userId: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
      role: targetUser.role,
      impersonatedBy: currentUser.id,
      type: 'impersonate'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30m')
      .sign(secret);

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name
      }
    });

  } catch (error) {
    console.error('POST /api/admin/impersonate 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
