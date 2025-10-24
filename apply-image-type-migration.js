const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://qxhpgjftkkcxdttgjkzj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4aHBnamZ0a2tjeGR0dGdqa3pqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjcwNDE0MCwiZXhwIjoyMDU4MjgwMTQwfQ.ti5BTYDRJQ_oh_uiaFARyV-4cCCYDj-FTh-l7sTiLiI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    const sql = fs.readFileSync('supabase/migrations/20251024140000_add_image_type_to_cloudinary_images.sql', 'utf8');
    
    // SQL을 세미콜론으로 분리하여 실행
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('실행 중:', statement.trim().substring(0, 100) + '...');
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement.trim() });
        
        if (error) {
          console.error('오류:', error);
        } else {
          console.log('성공');
        }
      }
    }
    
    console.log('마이그레이션 완료!');
  } catch (error) {
    console.error('마이그레이션 오류:', error);
  }
}

applyMigration();
