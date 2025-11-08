import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST: 크레딧 사용 (도구 실행)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 현재 로그인한 사용자 정보 가져오기
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { toolId, buttonId } = await request.json();

    if (!toolId) {
      return NextResponse.json({ success: false, error: 'toolId is required' }, { status: 400 });
    }

    // 도구 정보 조회 (action_buttons 포함)
    const { data: tool, error: toolError } = await supabase
      .from('tools_master')
      .select('credits_required, is_active, name, billing_type, action_buttons')
      .eq('id', toolId)
      .single();

    if (toolError || !tool) {
      return NextResponse.json({ success: false, error: 'Tool not found' }, { status: 404 });
    }

    // 도구가 비활성화되어 있는지 확인
    if (!tool.is_active) {
      return NextResponse.json({ success: false, error: 'Tool is not active' }, { status: 400 });
    }

    // 크레딧 차감액 결정
    let creditsToCharge = tool.credits_required;
    let actionDescription = tool.name;

    // billing_type이 'on_action'이고 buttonId가 제공된 경우
    if (tool.billing_type === 'on_action' && buttonId && tool.action_buttons) {
      const button = tool.action_buttons.find((b: any) => b.id === buttonId);
      if (button) {
        creditsToCharge = button.credits;
        actionDescription = `${tool.name} - ${button.label}`;
      } else {
        return NextResponse.json({
          success: false,
          error: `Button '${buttonId}' not found in tool configuration`
        }, { status: 400 });
      }
    }

    // 크레딧이 0이면 차감하지 않고 바로 성공 반환
    if (creditsToCharge === 0) {
      return NextResponse.json({
        success: true,
        credits_used: 0,
        balance: 0,
        message: 'Free action - no credits required'
      });
    }

    // 현재 크레딧 잔액 조회 (기존 user_credits 테이블 사용)
    const { data: userCredit, error: creditError } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (creditError && creditError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error fetching credits:', creditError);
      return NextResponse.json({ success: false, error: creditError.message }, { status: 500 });
    }

    const currentBalance = userCredit?.balance || 0;

    // 크레딧 부족 확인
    if (currentBalance < creditsToCharge) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient credits',
        current_credits: currentBalance,
        required_credits: creditsToCharge
      }, { status: 400 });
    }

    const newBalance = currentBalance - creditsToCharge;

    // 크레딧 차감 (기존 user_credits 테이블 업데이트)
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating credits:', updateError);
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    // 거래 이력 기록 (기존 user_credit_transactions 테이블 사용)
    const transactionMetadata: any = {
      tool_id: toolId,
      tool_name: tool.name
    };

    if (buttonId) {
      transactionMetadata.button_id = buttonId;
    }

    const { error: transactionError } = await supabase
      .from('user_credit_transactions')
      .insert({
        user_id: user.id,
        type: 'used',
        amount: -creditsToCharge,
        balance_after: newBalance,
        description: `${actionDescription} 사용`,
        metadata: transactionMetadata
      });

    if (transactionError) {
      console.error('Error recording transaction:', transactionError);
      // 거래 이력 실패는 크리티컬하지 않으므로 계속 진행
    }

    return NextResponse.json({
      success: true,
      credits_used: creditsToCharge,
      credits_before: currentBalance,
      credits_after: newBalance,
      balance: newBalance,
      message: `${creditsToCharge} 크레딧이 차감되었습니다`
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
