import { createClientForRouteHandler } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { notifyNewMessage } from '@/lib/onesignal-notifications';

/**
 * GET /api/messages
 * 내 대화방 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClientForRouteHandler();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 내가 참여한 대화방 목록 조회
    const { data: threads, error } = await supabase
      .from('message_threads')
      .select('*')
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('대화방 목록 조회 실패:', error);
      return NextResponse.json(
        { success: false, error: '대화방 목록을 불러올 수 없습니다.' },
        { status: 500 }
      );
    }

    // 상대방 정보 조회
    const threadsWithPartner = await Promise.all(
      (threads || []).map(async (thread: any) => {
        const partnerId = thread.participant_1 === user.id
          ? thread.participant_2
          : thread.participant_1;

        // users 테이블에서 상대방 정보 조회 - 조직 티어 포함
        const { data: partner } = await supabase
          .from('users')
          .select(`
            id,
            email,
            name,
            profile_name,
            primary_organization_id,
            organizations!users_primary_organization_id_fkey(tier)
          `)
          .eq('id', partnerId)
          .single();

        return {
          ...thread,
          partner,
          unread_count: 0, // TODO: 별도 쿼리로 계산
        };
      })
    );

    return NextResponse.json({
      success: true,
      threads: threadsWithPartner,
    });

  } catch (error: any) {
    logger.error('GET /api/messages 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/messages
 * 새 메시지 전송
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientForRouteHandler();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { receiver_id, content } = body;

    if (!receiver_id || !content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: '받는 사람과 내용이 필요합니다.' },
        { status: 400 }
      );
    }

    // 자기 자신에게 메시지 불가
    if (receiver_id === user.id) {
      return NextResponse.json(
        { success: false, error: '자기 자신에게 메시지를 보낼 수 없습니다.' },
        { status: 400 }
      );
    }

    // 1. 대화방 찾기 또는 생성
    const { data: threadId, error: threadError } = await supabase
      .rpc('get_or_create_thread', {
        p_user1_id: user.id,
        p_user2_id: receiver_id,
        p_thread_type: 'user_to_user'
      });

    if (threadError || !threadId) {
      logger.error('대화방 생성 실패:', threadError);
      return NextResponse.json(
        { success: false, error: '대화방 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 2. 메시지 저장
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        thread_id: threadId,
        sender_id: user.id,
        content: content.trim(),
      })
      .select()
      .single();

    if (messageError) {
      logger.error('메시지 저장 실패:', messageError);
      return NextResponse.json(
        { success: false, error: '메시지 전송에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 3. 받는 사람 정보 조회
    const { data: receiver } = await supabase
      .from('users')
      .select('name, profile_name')
      .eq('id', receiver_id)
      .single();

    // 4. 보낸 사람 정보 조회
    const { data: sender } = await supabase
      .from('users')
      .select('name, profile_name')
      .eq('id', user.id)
      .single();

    // 5. OneSignal 푸시 알림 전송 (비동기로 백그라운드 실행)
    if (sender) {
      const senderName = sender.profile_name || sender.name || '사용자';
      const messagePreview = content.length > 50
        ? content.substring(0, 50) + '...'
        : content;

      // 푸시 알림 전송 (await 없이 비동기 실행)
      notifyNewMessage({
        receiverId: receiver_id,
        senderId: user.id,
        senderName,
        messagePreview,
        threadId,
      }).catch(error => {
        logger.error('푸시 알림 전송 실패:', error);
        // 푸시 실패해도 메시지는 정상 전송됨
      });
    }

    return NextResponse.json({
      success: true,
      message,
      thread_id: threadId,
    });

  } catch (error: any) {
    logger.error('POST /api/messages 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
