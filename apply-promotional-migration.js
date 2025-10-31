const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://ketdnqhxwqcgyltinjih.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtldGRucWh4d3FjZ3lsdGluamloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIyMzA0NywiZXhwIjoyMDc0Nzk5MDQ3fQ.JG09yOpBvu_Y_-9QNmWGY7GVwUVmTMKD4Sc6FGFhxX4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    const sqlPath = path.join(__dirname, 'supabase', 'migrations', '20251031_create_promotional_images.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📦 Applying promotional_images migration...');

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ Migration failed:', error);

      // Try alternative method - execute each statement separately
      console.log('🔄 Trying alternative method...');
      const statements = sql.split(';').filter(s => s.trim());

      for (const statement of statements) {
        if (statement.trim()) {
          const { error: stmtError } = await supabase.rpc('exec_sql', {
            sql_query: statement + ';'
          });
          if (stmtError) {
            console.error('Statement error:', stmtError);
          }
        }
      }
    } else {
      console.log('✅ Migration applied successfully!');
    }

    // Verify table was created
    const { data: tableData, error: tableError } = await supabase
      .from('promotional_images')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Table verification failed:', tableError);
    } else {
      console.log('✅ Table verified successfully!');
      console.log('📊 Sample data:', tableData);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

applyMigration();
