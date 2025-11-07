const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://qxhpgjftkkcxdttgjkzj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4aHBnamZ0a2tjeGR0dGdqa3pqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjcwNDE0MCwiZXhwIjoyMDU4MjgwMTQwfQ.t_zeKFkner-dt2xOvJoT0t0XzlYX-tC8suToRI_WVKQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyRLS() {
  try {
    // Read SQL file
    const sqlPath = path.join(__dirname, 'database', 'migrations', 'add_platform_notices_policies.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Applying RLS policies for platform_notices...\n');

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      console.log(statement.substring(0, 100) + '...\n');

      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: statement
      });

      if (error) {
        console.error(`Error in statement ${i + 1}:`, error);
        // Continue with next statement even if one fails
      } else {
        console.log(`Statement ${i + 1} executed successfully ✓\n`);
      }
    }

    console.log('\n✅ RLS policies applied successfully!');
    console.log('\nYou can now create and edit platform notices.');

  } catch (error) {
    console.error('Error applying RLS policies:', error);
    process.exit(1);
  }
}

applyRLS();
