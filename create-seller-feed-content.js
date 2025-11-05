const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

// 다양한 프로필명
const profileNames = [
  '달래마켓지기',
  '신선왕',
  '농산물마스터',
  '김사장',
  '이대리',
  '박과장',
  '최팀장',
  '정사장님',
  '유통전문가',
  '채소왕국',
  '과일천국',
  '도매킹',
  '시장통',
  '농부김씨',
  '장사의신',
];

// 날짜 생성 헬퍼 (2025-10-10부터 시작)
function getRandomDate(daysAgo = 0) {
  const baseDate = new Date('2025-10-10');
  const date = new Date(baseDate);
  date.setDate(date.getDate() - daysAgo);
  date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
  return date.toISOString();
}

// 자유토론 게시글
const discussionPosts = [
  {
    title: '요즘 시장 상황 어떠신가요?',
    content: '10월 들어서 날씨가 쌀쌀해지면서 채소류 가격이 조금씩 오르는 것 같은데, 다른 분들은 어떠신지 궁금합니다. 저희는 배추 같은 경우 작년 대비 20% 정도 오른 것 같아요.',
    tags: ['시장상황', '가격동향', '채소'],
    daysAgo: 0
  },
  {
    title: '달래마켓 사용하신지 얼마나 되셨나요?',
    content: '저는 이번 달부터 시작했는데 정말 편하네요! 특히 주문통합관리 기능이 정말 유용한 것 같습니다. 다들 얼마나 사용하셨는지 궁금합니다.',
    tags: ['신규', '후기', '달래마켓'],
    daysAgo: 1
  },
  {
    title: '배송 시 포장 팁 공유해요',
    content: '신선도 유지를 위해 아이스팩 사용하시는 분들 많으신가요? 저는 여름에는 필수로 넣는데 요즘 같은 환절기에는 고민이 되네요. 비용도 만만치 않아서요.',
    tags: ['포장', '배송', '신선도'],
    daysAgo: 2
  },
  {
    title: '연말 대비 재고 준비 어떻게 하시나요?',
    content: '벌써 2개월 후면 연말인데 다들 준비 많이 하셨나요? 작년에는 김장철 대비를 못해서 아쉬웠던 기억이 있어서 올해는 미리미리 준비하려고 합니다.',
    tags: ['연말', '재고관리', '김장'],
    daysAgo: 3
  },
  {
    title: '플랫폼 판매 vs 직거래, 여러분은?',
    content: '달래마켓 같은 플랫폼 판매와 직거래 비중을 어떻게 가져가시나요? 저는 7:3 정도로 플랫폼 비중이 높은데, 직거래도 늘려볼까 고민 중입니다.',
    tags: ['판매전략', '직거래', '플랫폼'],
    daysAgo: 4
  }
];

// 정보공유 게시글
const infoPosts = [
  {
    title: '옵션 상품 등록 시 주의사항 정리',
    content: `달래마켓에서 옵션 상품을 등록할 때 알아두면 좋은 팁들을 공유합니다.

1. 원물과 연결 필수: 옵션 상품은 반드시 원물(raw material)과 연결해야 재고 관리가 정확합니다.
2. 카테고리 세분화: 카테고리를 4단계까지 세분화하면 고객이 찾기 쉽습니다.
3. 대표 이미지 설정: 첫 번째 이미지가 자동으로 대표 이미지가 됩니다.
4. 가격 정책: 판매자 공급가와 마진을 정확히 설정해야 나중에 정산이 편합니다.

도움이 되셨으면 좋겠습니다!`,
    tags: ['옵션상품', '등록가이드', '팁'],
    daysAgo: 1
  },
  {
    title: '주문통합관리 기능 100% 활용하기',
    content: `달래마켓의 핵심 기능인 주문통합관리를 제대로 활용하는 방법을 정리했습니다.

📦 주문 상태별 필터링
- 접수대기, 발주확정, 출고완료 등 상태별로 한눈에 확인 가능
- 검색 기능으로 주문번호나 상품명으로 빠르게 찾기

🚚 발송지 정보 자동 입력
- 프로필 설정에서 발송지 정보를 미리 등록하면 매번 입력 안 해도 됨
- 여러 발송지 관리도 가능

💰 정산 내역 확인
- 월별/일별 정산 내역을 대시보드에서 실시간 확인
- 엑셀 다운로드로 세무 처리도 간편

활용해보세요!`,
    tags: ['주문관리', '가이드', '활용법'],
    daysAgo: 2
  },
  {
    title: '신선 농산물 보관 온도 가이드',
    content: `각 농산물별 최적 보관 온도를 정리했습니다.

🥬 채소류
- 배추/양배추: 0~2°C
- 시금치/상추: 0~5°C
- 당근/무: 0~2°C

🍎 과일류
- 사과: 0~4°C
- 배: -1~0°C
- 귤/오렌지: 3~8°C

🥔 근채류
- 감자: 3~5°C
- 양파: 0~2°C
- 마늘: 0~2°C

온도 관리 잘 하셔서 신선도 유지하세요!`,
    tags: ['보관법', '신선도', '농산물'],
    daysAgo: 5
  },
  {
    title: '택배사별 운송비 비교 (2025년 10월 기준)',
    content: `주요 택배사 운송비를 비교해봤습니다.

📦 일반 박스 (5kg 기준)
- CJ대한통운: 3,500원
- 우체국택배: 3,200원
- 한진택배: 3,400원
- 로젠택배: 3,300원

🧊 신선 배송 (10kg, 아이스팩 포함)
- CJ프레시웨이: 5,500원
- 쿠팡로켓프레시: 계약 조건별 상이
- 마켓컬리: 자체 배송

지역별로 다를 수 있으니 참고만 하세요!`,
    tags: ['택배비', '운송비', '비교'],
    daysAgo: 3
  }
];

// QNA 게시글
const qnaPosts = [
  {
    title: '프로필 이름 변경은 어떻게 하나요?',
    content: '회원정보 페이지에서 프로필 이름을 변경하려고 하는데 중복확인 버튼을 눌러야 하나요? 절차가 궁금합니다.',
    tags: ['프로필', '설정', '질문'],
    daysAgo: 0
  },
  {
    title: '정산 주기가 어떻게 되나요?',
    content: '이번에 처음 입점했는데 정산이 언제 되는지 궁금합니다. 월 단위인가요 아니면 주 단위인가요?',
    tags: ['정산', '입점', '질문'],
    daysAgo: 1
  },
  {
    title: '대량 주문 등록 방법이 있을까요?',
    content: '한 번에 100건 이상 주문을 등록해야 하는데, 엑셀로 일괄 등록하는 기능이 있나요? 하나씩 등록하기엔 너무 많아서요.',
    tags: ['대량등록', '주문', '엑셀'],
    daysAgo: 2
  },
  {
    title: '원물과 옵션 상품의 차이가 뭔가요?',
    content: '상품 등록 메뉴를 보니 원물(raw materials)과 옵션 상품(option products)이 따로 있던데, 이 둘의 차이가 정확히 뭔가요? 어떤 걸 먼저 등록해야 하나요?',
    tags: ['원물', '옵션상품', '상품등록'],
    daysAgo: 3
  },
  {
    title: '셀러 랭킹은 어떻게 산정되나요?',
    content: '대시보드에 셀러 랭킹이 있던데 이게 어떤 기준으로 매겨지는 건가요? 판매량, 매출액, 아니면 다른 기준이 있나요?',
    tags: ['랭킹', '대시보드', '질문'],
    daysAgo: 4
  }
];

// 건의 게시글
const suggestionPosts = [
  {
    title: '모바일 앱 개발 건의드립니다',
    content: '달래마켓 정말 잘 사용하고 있습니다. 다만 외부에서 급하게 주문 확인할 때 모바일 웹이 조금 불편한데, 전용 앱이 있으면 훨씬 편할 것 같아요. 검토 부탁드립니다!',
    tags: ['모바일앱', '건의', '기능개선'],
    daysAgo: 0
  },
  {
    title: '카테고리 검색 필터 추가 건의',
    content: '상품 검색할 때 카테고리별 필터가 있으면 좋겠습니다. 예를 들어 "채소 > 엽채류 > 배추류" 이런 식으로 세부 카테고리까지 필터링할 수 있으면 원하는 상품을 더 빨리 찾을 수 있을 것 같아요.',
    tags: ['검색', '필터', '카테고리'],
    daysAgo: 2
  },
  {
    title: '송장 일괄 출력 기능 추가해주세요',
    content: '하루에 발송할 주문이 많을 때 송장을 하나씩 출력하는 게 불편합니다. 체크박스로 여러 주문을 선택해서 한 번에 송장 출력할 수 있는 기능이 있으면 좋겠습니다.',
    tags: ['송장', '출력', '일괄처리'],
    daysAgo: 3
  },
  {
    title: '알림 기능 강화 건의',
    content: '새 주문이나 고객 문의가 들어왔을 때 알림을 받을 수 있으면 좋겠어요. 카카오톡이나 이메일로 알림을 보내주는 기능이 있으면 빠르게 대응할 수 있을 것 같습니다.',
    tags: ['알림', '주문알림', '카카오톡'],
    daysAgo: 5
  }
];

async function createContent() {
  try {
    console.log('🚀 셀러피드 콘텐츠 생성 시작...\n');

    // 관리자 계정 가져오기
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('role', 'super_admin')
      .limit(1);

    if (userError || !users || users.length === 0) {
      console.error('❌ 관리자 계정을 찾을 수 없습니다.');
      return;
    }

    const adminUserId = users[0].id;
    console.log(`✅ 관리자 계정 확인: ${users[0].email}\n`);

    let totalPosts = 0;
    let totalComments = 0;

    // 1. 자유토론 게시글 생성
    console.log('📝 [자유토론] 게시글 생성 중...');
    for (let i = 0; i < discussionPosts.length; i++) {
      const post = discussionPosts[i];
      const profileName = profileNames[Math.floor(Math.random() * profileNames.length)];

      const { data: createdPost, error: postError } = await supabase
        .from('seller_feed_posts')
        .insert({
          user_id: adminUserId,
          category: 'discussion',
          title: post.title,
          content: post.content,
          display_nickname: profileName,
          created_at: getRandomDate(post.daysAgo),
        })
        .select()
        .single();

      if (postError) {
        console.error(`   ❌ 게시글 생성 실패: ${post.title}`, postError.message);
        continue;
      }

      totalPosts++;
      console.log(`   ✅ "${post.title}" (${profileName})`);

      // 태그 추가
      if (post.tags && post.tags.length > 0) {
        const tagInserts = post.tags.map(tag => ({
          post_id: createdPost.id,
          tag: tag,
        }));

        await supabase.from('seller_feed_tags').insert(tagInserts);
      }

      // 댓글 추가
      const commentCount = Math.floor(Math.random() * 4) + 1; // 1~4개
      for (let j = 0; j < commentCount; j++) {
        const commenterName = profileNames[Math.floor(Math.random() * profileNames.length)];
        const comments = [
          '좋은 정보 감사합니다!',
          '저도 같은 생각이에요.',
          '유익한 글이네요. 도움 많이 됐습니다.',
          '공감합니다!',
          '저도 궁금했던 내용인데 감사해요.',
          '다음에도 좋은 글 부탁드립니다.',
        ];

        const { error: commentError } = await supabase
          .from('seller_feed_comments')
          .insert({
            post_id: createdPost.id,
            user_id: adminUserId,
            content: comments[Math.floor(Math.random() * comments.length)],
            display_nickname: commenterName,
            created_at: getRandomDate(post.daysAgo - (j * 0.1)),
          });

        if (!commentError) totalComments++;
      }
    }

    // 2. 정보공유 게시글 생성
    console.log('\n📚 [정보공유] 게시글 생성 중...');
    for (let i = 0; i < infoPosts.length; i++) {
      const post = infoPosts[i];
      const profileName = profileNames[Math.floor(Math.random() * profileNames.length)];

      const postData = {
        user_id: adminUserId,
        category: 'info',
        title: post.title,
        content: post.content,
        created_at: getRandomDate(post.daysAgo),
      };

      // display_nickname 필드가 있으면 추가
      if (profileName) {
        postData.display_nickname = profileName;
      }

      const { data: createdPost, error: postError} = await supabase
        .from('seller_feed_posts')
        .insert(postData)
        .select()
        .single();

      if (postError) {
        console.error(`   ❌ 게시글 생성 실패: ${post.title}`);
        console.error('      에러:', JSON.stringify(postError, null, 2));
        console.error('      데이터:', JSON.stringify(postData, null, 2));
        continue;
      }

      totalPosts++;
      console.log(`   ✅ "${post.title}" (${profileName})`);

      // 태그 추가
      if (post.tags && post.tags.length > 0) {
        const tagInserts = post.tags.map(tag => ({
          post_id: createdPost.id,
          tag: tag,
        }));

        await supabase.from('seller_feed_tags').insert(tagInserts);
      }

      // 댓글 추가
      const commentCount = Math.floor(Math.random() * 5) + 2; // 2~6개
      for (let j = 0; j < commentCount; j++) {
        const commenterName = profileNames[Math.floor(Math.random() * profileNames.length)];
        const comments = [
          '정말 유익한 정보네요! 감사합니다.',
          '이런 팁 너무 좋아요.',
          '저장해서 참고할게요!',
          '완전 꿀팁이네요.',
          '공유해주셔서 감사합니다.',
          '바로 적용해봐야겠어요!',
          '도움 많이 됐습니다!',
        ];

        const { error: commentError } = await supabase
          .from('seller_feed_comments')
          .insert({
            post_id: createdPost.id,
            user_id: adminUserId,
            content: comments[Math.floor(Math.random() * comments.length)],
            display_nickname: commenterName,
            created_at: getRandomDate(post.daysAgo - (j * 0.1)),
          });

        if (!commentError) totalComments++;
      }
    }

    // 3. QNA 게시글 생성
    console.log('\n❓ [QNA] 게시글 생성 중...');
    for (let i = 0; i < qnaPosts.length; i++) {
      const post = qnaPosts[i];
      const profileName = profileNames[Math.floor(Math.random() * profileNames.length)];

      const { data: createdPost, error: postError } = await supabase
        .from('seller_feed_posts')
        .insert({
          user_id: adminUserId,
          category: 'qna',
          title: post.title,
          content: post.content,
          display_nickname: profileName,
          created_at: getRandomDate(post.daysAgo),
        })
        .select()
        .single();

      if (postError) {
        console.error(`   ❌ 게시글 생성 실패: ${post.title}`, postError.message);
        continue;
      }

      totalPosts++;
      console.log(`   ✅ "${post.title}" (${profileName})`);

      // 태그 추가
      if (post.tags && post.tags.length > 0) {
        const tagInserts = post.tags.map(tag => ({
          post_id: createdPost.id,
          tag: tag,
        }));

        await supabase.from('seller_feed_tags').insert(tagInserts);
      }

      // 질문에 대한 답변 댓글 추가
      const answerComments = [
        {
          name: '달래마켓지기',
          content: '안녕하세요! 프로필 이름 변경은 회원정보 페이지에서 가능합니다. 중복확인 버튼을 눌러 사용 가능 여부를 확인한 후 저장하시면 됩니다.',
        },
        {
          name: '달래마켓지기',
          content: '정산은 월 단위로 진행되며, 매월 말일 기준으로 익월 10일에 정산금이 지급됩니다. 더 궁금하신 사항은 고객센터로 문의 부탁드립니다.',
        },
        {
          name: '유통전문가',
          content: '엑셀 일괄 등록 기능은 현재 개발 중인 것으로 알고 있어요. 빠른 시일 내에 추가될 예정이라고 들었습니다.',
        },
        {
          name: '달래마켓지기',
          content: '원물은 재료 그 자체를 의미하고, 옵션 상품은 그 원물을 기반으로 만든 판매 상품입니다. 먼저 원물을 등록한 후 옵션 상품을 등록하시면 됩니다!',
        },
        {
          name: '장사의신',
          content: '셀러 랭킹은 판매량, 매출액, 고객 만족도 등 여러 지표를 종합해서 산정된다고 들었어요. 정확한 가중치는 비공개인 것 같습니다.',
        },
      ];

      const answer = answerComments[i] || answerComments[0];
      const { error: commentError } = await supabase
        .from('seller_feed_comments')
        .insert({
          post_id: createdPost.id,
          user_id: adminUserId,
          content: answer.content,
          display_nickname: answer.name,
          created_at: getRandomDate(post.daysAgo - 0.5),
        });

      if (!commentError) totalComments++;

      // 추가 댓글
      const additionalComments = Math.floor(Math.random() * 2) + 1; // 1~2개
      for (let j = 0; j < additionalComments; j++) {
        const commenterName = profileNames[Math.floor(Math.random() * profileNames.length)];
        const comments = [
          '저도 궁금했는데 감사합니다!',
          '답변 감사해요.',
          '도움됐습니다!',
        ];

        const { error: extraCommentError } = await supabase
          .from('seller_feed_comments')
          .insert({
            post_id: createdPost.id,
            user_id: adminUserId,
            content: comments[Math.floor(Math.random() * comments.length)],
            display_nickname: commenterName,
            created_at: getRandomDate(post.daysAgo - 0.3 - (j * 0.1)),
          });

        if (!extraCommentError) totalComments++;
      }
    }

    // 4. 건의 게시글 생성
    console.log('\n💡 [건의] 게시글 생성 중...');
    for (let i = 0; i < suggestionPosts.length; i++) {
      const post = suggestionPosts[i];
      const profileName = profileNames[Math.floor(Math.random() * profileNames.length)];

      const { data: createdPost, error: postError } = await supabase
        .from('seller_feed_posts')
        .insert({
          user_id: adminUserId,
          category: 'suggestion',
          title: post.title,
          content: post.content,
          display_nickname: profileName,
          created_at: getRandomDate(post.daysAgo),
        })
        .select()
        .single();

      if (postError) {
        console.error(`   ❌ 게시글 생성 실패: ${post.title}`, postError.message);
        continue;
      }

      totalPosts++;
      console.log(`   ✅ "${post.title}" (${profileName})`);

      // 태그 추가
      if (post.tags && post.tags.length > 0) {
        const tagInserts = post.tags.map(tag => ({
          post_id: createdPost.id,
          tag: tag,
        }));

        await supabase.from('seller_feed_tags').insert(tagInserts);
      }

      // 댓글 추가
      const commentCount = Math.floor(Math.random() * 4) + 2; // 2~5개
      for (let j = 0; j < commentCount; j++) {
        const commenterName = profileNames[Math.floor(Math.random() * profileNames.length)];
        const comments = [
          '좋은 의견이네요! 저도 동의합니다.',
          '완전 공감합니다.',
          '저도 이 기능 필요하다고 생각했어요.',
          '건의사항 반영되면 좋겠네요!',
          '적극 찬성합니다!',
          '빨리 추가됐으면 좋겠어요.',
        ];

        const { error: commentError } = await supabase
          .from('seller_feed_comments')
          .insert({
            post_id: createdPost.id,
            user_id: adminUserId,
            content: comments[Math.floor(Math.random() * comments.length)],
            display_nickname: commenterName,
            created_at: getRandomDate(post.daysAgo - (j * 0.1)),
          });

        if (!commentError) totalComments++;
      }
    }

    console.log('\n✅ 셀러피드 콘텐츠 생성 완료!');
    console.log(`📊 총 ${totalPosts}개의 게시글과 ${totalComments}개의 댓글이 생성되었습니다.\n`);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

createContent();
