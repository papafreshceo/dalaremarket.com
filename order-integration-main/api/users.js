const { getUserData, createUser } = require('../lib/google-sheets');

export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, email, userData } = req.body;
    
    switch (action) {
      case 'checkUser':
        const user = await getUserData(email);
        
        if (!user) {
          // 사용자가 없으면 자동으로 staff로 생성
          const isAdmin = false; // 모든 신규 사용자는 staff로 시작, 구글 시트에서 수동으로 admin 지정
          const newUserData = {
            email: email,
            name: userData?.name || email.split('@')[0],
            role: isAdmin ? 'admin' : 'staff'
          };
          
          const created = await createUser(newUserData);
          
          if (created) {
            return res.status(200).json({
              exists: false,
              user: {
                ...newUserData,
                status: 'active',
                joinDate: new Date().toISOString().split('T')[0]
              }
            });
          } else {
            return res.status(500).json({ error: '사용자 생성 실패' });
          }
        }
        
        return res.status(200).json({
          exists: true,
          user: user
        });
        
      case 'createUser':
        const isNewAdmin = userData.email === 'papafresh.ceo@gmail.com';
        userData.role = isNewAdmin ? 'admin' : 'staff';
        
        const success = await createUser(userData);
        
        if (success) {
          return res.status(200).json({ success: true });
        } else {
          return res.status(500).json({ error: '사용자 생성 실패' });
        }
        
      default:
        return res.status(400).json({ error: '알 수 없는 액션' });
    }
    
  } catch (error) {
    console.error('Users API 오류:', error);
    res.status(500).json({ 
      error: error.message || '서버 오류가 발생했습니다.' 
    });
  }
}
