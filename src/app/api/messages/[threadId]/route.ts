import { createClientForRouteHandler } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

/**
 * GET /api/messages/[threadId]
 * 특정 대화방의 메시지 목록 조회 (폴링용)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const supabase = await createClientForRouteHandler();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { threadId } = await params;
    const { searchParams } = new URL(request.url);
    const after = searchParams.get('after'); // 이 시간 이후 메시지만 (폴링용)
    const limit = parseInt(searchParams.get('limit') || '50');

    // 대화방 참여자 확인
    const { data: thread, error: threadError } = await supabase
      .from('message_threads')
      .select('*')
      .eq('id', threadId)
      .single();

    if (threadError || !thread) {
      return NextResponse.json(
        { success: false, error: '대화방을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 권한 확인
    if (thread.participant_1 !== user.id && thread.participant_2 !== user.id) {
      return NextResponse.json(
        { success: false, error: '이 대화방에 접근할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 메시지 조회
    let query = supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id(id, email, name, profile_name)
      `)
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
      .limit(limit);

    // 폴링: 특정 시간 이후 메시지만
    if (after) {
      query = query.gt('created_at', after);
    }

    const { data: messages, error: messagesError } = await query;

    if (messagesError) {
      logger.error('메시지 조회 실패:', messagesError);
      return NextResponse.json(
        { success: false, error: '메시지를 불러올 수 없습니다.' },
        { status: 500 }
      );
    }

    // 상대방이 보낸 읽지 않은 메시지를 읽음 처리
    const unreadMessageIds = (messages || [])
      .filter((msg: any) => msg.sender_id !== user.id && !msg.is_read)
      .map((msg: any) => msg.id);

    if (unreadMessageIds.length > 0) {
      await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', unreadMessageIds);
    }

    return NextResponse.json({
      success: true,
      messages: messages || [],
      thread,
    });

  } catch (error: any) {
    logger.error('GET /api/messages/[threadId] 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
