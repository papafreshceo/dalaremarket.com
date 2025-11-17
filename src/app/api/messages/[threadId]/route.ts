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
    const before = searchParams.get('before'); // 이 시간 이전 메시지만 (무한 스크롤용)
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

    // 메시지 조회 - 최신 메시지부터 가져오기
    let query = supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id(id, email, name, profile_name)
      `)
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false })  // 최신 메시지부터
      .limit(limit);

    // 폴링: 특정 시간 이후 메시지만
    if (after) {
      query = query.gt('created_at', after);
    }

    // 무한 스크롤: 특정 시간 이전 메시지만
    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: messages, error: messagesError } = await query;

    if (messagesError) {
      logger.error('메시지 조회 실패:', messagesError);
      logger.error('쿼리 파라미터:', { threadId, after, before, limit });
      return NextResponse.json(
        { success: false, error: '메시지를 불러올 수 없습니다.', details: messagesError.message },
        { status: 500 }
      );
    }

    // UI에서는 오래된 것부터 표시하므로 배열 뒤집기
    if (messages) {
      messages.reverse();
    }

    // 읽음 처리는 클라이언트에서 메시지가 화면에 표시될 때 수행
    // (자동 읽음 처리 제거 - 화면에 실제로 표시될 때만 읽음 처리)

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
